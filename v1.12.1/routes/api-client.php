<?php

use Pterodactyl\Enum\ResourceLimit;
use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Client;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Activity\AccountSubject;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Pterodactyl\Http\Middleware\Api\Client\Server\ResourceBelongsToServer;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;

if (!class_exists('BetterPterodactyl\Economy\DB')) {
    require_once base_path('resources/settings/economy/helpers.php');
}
use BetterPterodactyl\Economy\DB;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client
|
*/
Route::get('/', [Client\ClientController::class, 'index'])->name('api:client.index');
Route::get('/permissions', [Client\ClientController::class, 'permissions']);

/*
|--------------------------------------------------------------------------
| Zero-Config Automated Billing Cron
|--------------------------------------------------------------------------
| Executes silently in the background once every hour when API is accessed.
*/
if (!app()->runningInConsole()) {
    try {
        $settings = DB::getSettings();
        if ($settings['billing']['enabled'] ?? false) {
            // Cache::add is atomic. It returns true if the key didn't exist and was added.
            if (\Illuminate\Support\Facades\Cache::add('economy_billing_cron_lock', true, now()->addMinutes(10))) {
                app()->terminating(function () use ($settings) {
                    try {
                        // 1. Process regular charges
                        $toCharge = DB::getServersScheduledForBilling();
                        foreach ($toCharge as $row) {
                            \BetterPterodactyl\Economy\BillingService::processCharge($row['server_id']);
                        }
                        // 2. Process overdue servers (grace period expired)
                        $overdue = DB::getOverdueServers();
                        foreach ($overdue as $row) {
                            \BetterPterodactyl\Economy\BillingService::handleOverdue($row['server_id']);
                        }
                        // 3. Process pending deletions
                        $deleteDays = (int) ($settings['billing']['pending_delete_days'] ?? 7);
                        $toDelete = DB::getPendingDeleteServers($deleteDays);
                        foreach ($toDelete as $row) {
                            \BetterPterodactyl\Economy\BillingService::handlePendingDeletion($row['server_id']);
                        }
                        \Log::info('Zero-Config Billing: Successfully processed automated billing cycle.');
                    } catch (\Exception $e) {
                        \Log::error('Zero-Config Billing Error: ' . $e->getMessage());
                    }
                });
            }
        }
    } catch (\Exception $e) {
        // Silently ignore if DB isn't ready
    }
}

Route::group(['prefix' => '/economy'], function () {
    Route::get('/', function (Request $request) {
        try {
            $user = DB::getUser($request->user()->id);
            
            $settings = DB::getSettings();

            $userServers = $request->user()->servers;
            $usage = [
                'cpu' => $userServers->sum('cpu'),
                'ram' => $userServers->sum('memory'),
                'disk' => $userServers->sum('disk'),
                'backups' => $userServers->sum('backup_limit'),
                'allocations' => $userServers->sum('allocation_limit'),
                'slots' => $userServers->count(),
            ];

            return response()->json([
                'points' => (float) $user['points'],
                'resources' => [
                    'cpu' => (int) $user['extra_cpu'],
                    'ram' => (int) $user['extra_memory'],
                    'disk' => (int) $user['extra_disk'],
                    'backups' => (int) $user['extra_backups'],
                    'allocations' => (int) $user['extra_allocations'],
                    'slots' => (int) $user['extra_slots'],
                ],
                'usage' => $usage,
                'settings' => $settings,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });

    Route::get('/history', function (\Illuminate\Http\Request $request) {
        $settings = \BetterPterodactyl\Economy\DB::getSettings();
        if (!($settings['enabled'] ?? false)) {
            return response()->json(['error' => 'Economy feature is disabled.'], 403);
        }

        $userId = $request->user()->id;
        $history = \BetterPterodactyl\Economy\DB::getUserHistory($userId);

        return response()->json([
            'success' => true,
            'history' => $history
        ]);
    });

    Route::post('/purchase', function (Request $request) {
        $validated = $request->validate([
            'resource' => 'required|string|in:cpu,ram,disk,backups,allocations,slots',
            'amount' => 'required|numeric|min:1',
        ]);

        $resource = $request->input('resource');
        $bundlesToBuy = (int) $request->input('amount');
        $userId = $request->user()->id;

        $settings = DB::getSettings();
        if (!($settings['enabled'] ?? false)) {
            return response()->json(['error' => 'Economy system is currently disabled.'], 403);
        }

        if (!isset($settings['bundles'][$resource])) {
            return response()->json(['error' => 'Invalid resource bundle.'], 400);
        }

        $bundlePrice = $settings['bundles'][$resource]['price'];
        $bundleAmount = $settings['bundles'][$resource]['amount'];

        $totalCost = $bundlePrice * $bundlesToBuy;
        $totalResourceAmount = $bundleAmount * $bundlesToBuy;

        $user = DB::getUser($userId);
        if ($user['points'] < $totalCost) {
            return response()->json(['error' => 'Insufficient points.'], 400);
        }

        // Deduct points and Add resource
        DB::updatePoints($userId, -$totalCost);
        DB::addResource($userId, $resource, $totalResourceAmount);

        // Log transaction
        DB::logTransaction($userId, 'purchase', -$totalCost, [
            'resource' => $resource,
            'amount_added' => $totalResourceAmount,
            'remaining_points' => $user['points'] - $totalCost,
        ]);

        return response()->json(['success' => true]);
    });

    Route::post('/redeem', function (Request $request) {
        $validated = $request->validate([
            'code' => 'required|string',
        ]);

        $code = strtoupper($validated['code']);
        $userId = $request->user()->id;

        $codes = DB::getPromoCodes();

        if (!isset($codes[$code])) {
            return response()->json(['error' => 'Invalid promo code.'], 400);
        }

        $promo = $codes[$code];

        if ($promo['uses'] >= $promo['max_uses']) {
            return response()->json(['error' => 'This promo code has reached its maximum uses.'], 400);
        }

        if (DB::hasUsedPromoCode($code, $userId)) {
            return response()->json(['error' => 'You have already redeemed this promo code.'], 400);
        }

        // Grant rewards
        $pointsAdded = 0;
        foreach ($promo['rewards'] as $reward) {
            if ($reward['type'] === 'points') {
                DB::updatePoints($userId, $reward['amount']);
                $pointsAdded += $reward['amount'];
            } else {
                DB::addResource($userId, $reward['type'], $reward['amount']);
            }
        }

        // Update records in DB
        DB::usePromoCode($code, $userId);

        $rewards = $promo['rewards'];

        // Log transaction
        DB::logTransaction($userId, 'redeem', $pointsAdded, [
            'code' => $code,
            'rewards' => $rewards
        ]);

        return response()->json([
            'success' => true,
            'rewards' => $rewards
        ]);
    });

    Route::get('/resources', function (Request $request) {
        $settings = DB::getSettings();
        $allowedEggs = $settings['allowed_eggs'] ?? [];

        $nests = \Pterodactyl\Models\Nest::with('eggs')->get()->map(function($nest) use ($allowedEggs) {
            $filteredEggs = $nest->eggs->filter(function($egg) use ($allowedEggs) {
                return in_array($egg->id, $allowedEggs);
            })->map(function($egg) {
                return [
                    'id' => $egg->id,
                    'name' => $egg->name,
                ];
            })->values();

            if ($filteredEggs->isEmpty()) {
                return null;
            }

            return [
                'id' => $nest->id,
                'name' => $nest->name,
                'eggs' => $filteredEggs,
            ];
        })->filter()->values();

        $allowedNodes = $settings['allowed_nodes'] ?? [];

        $locations = \Pterodactyl\Models\Location::with(['nodes' => function ($query) use ($allowedNodes) {
            $query->where('public', 1); // Only public nodes
            if (!empty($allowedNodes)) {
                $query->whereIn('id', $allowedNodes);
            }
        }])->get()->map(function($loc) {
            return [
                'id' => $loc->id,
                'short' => $loc->short,
                'long' => $loc->long,
                'nodes' => $loc->nodes->map(function($node) {
                    return [
                        'id' => $node->id,
                        'name' => $node->name,
                    ];
                }),
            ];
        })->filter(function($loc) {
            return $loc['nodes']->count() > 0;
        })->values();

        return response()->json([
            'nests' => $nests,
            'locations' => $locations,
            'min_limits' => $settings['min_limits'] ?? [
                'cpu' => 10,
                'ram' => 256,
                'disk' => 512,
                'backups' => 0,
                'allocations' => 0,
            ],
        ]);
    });

    // Handle accidental GET request to the server creation POST endpoint
    Route::get('/servers', function () {
        return redirect('/economy/create');
    });

    Route::post('/servers', function (Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'nest_id' => 'required|integer|exists:nests,id',
            'egg_id' => 'required|integer|exists:eggs,id',
            'location_id' => 'required|integer|exists:locations,id',
            'node_id' => 'nullable|integer|exists:nodes,id',
            'cpu' => 'required|numeric|min:0',
            'ram' => 'required|numeric|min:0',
            'disk' => 'required|numeric|min:0',
            'allocations' => 'nullable|numeric|min:1',
            'backups' => 'nullable|numeric|min:0',
            'billing_cycle' => 'nullable|string|in:hourly,daily,weekly,monthly',
        ]);

        $userId = $request->user()->id;
        $user = DB::getUser($userId);
        $settings = DB::getSettings();
        
        if (!($settings['enabled'] ?? false)) {
            return response()->json(['error' => '經濟系統目前已關閉。'], 403);
        }

        $defaults = $settings['defaults'] ?? ['cpu' => 0, 'ram' => 0, 'disk' => 0, 'slots' => 0];
        $minLimits = $settings['min_limits'] ?? ['cpu' => 0, 'ram' => 0, 'disk' => 0];

        // 1. Check minimum limits
        if ($validated['cpu'] < $minLimits['cpu'] || $validated['ram'] < $minLimits['ram'] || $validated['disk'] < $minLimits['disk']) {
            return response()->json(['error' => '所選資源低於管理員設定的最低限制。'], 400);
        }

        // 2. Check user resource bucket
        $userServers = $request->user()->servers;
        $totalCPUAvailable = $defaults['cpu'] + $user['extra_cpu'];
        $totalRAMAvailable = $defaults['ram'] + $user['extra_memory'];
        $totalDiskAvailable = $defaults['disk'] + $user['extra_disk'];
        $totalSlotsAvailable = $defaults['slots'] + $user['extra_slots'];

        $usedCPU = $userServers->sum('cpu');
        $usedRAM = $userServers->sum('memory');
        $usedDisk = $userServers->sum('disk');
        $usedSlots = $userServers->count();

        if ($usedSlots + 1 > $totalSlotsAvailable) {
            return response()->json(['error' => '伺服器插槽不足，請前往商店購買。'], 400);
        }
        if ($usedCPU + $validated['cpu'] > $totalCPUAvailable) {
            return response()->json(['error' => 'CPU 資源不足，請前往商店購買。'], 400);
        }
        if ($usedRAM + $validated['ram'] > $totalRAMAvailable) {
            return response()->json(['error' => '記憶體資源不足，請前往商店購買。'], 400);
        }
        if ($usedDisk + $validated['disk'] > $totalDiskAvailable) {
            return response()->json(['error' => '磁碟資源不足，請前往商店購買。'], 400);
        }

        $reqAllocations = $validated['allocations'] ?? 1;
        $reqBackups = $validated['backups'] ?? 0;

        $totalAllocationsAvailable = ($defaults['allocations'] ?? 0) + $user['extra_allocations'];
        $totalBackupsAvailable = ($defaults['backups'] ?? 0) + $user['extra_backups'];

        $usedAllocations = $userServers->sum('allocation_limit');
        $usedBackups = $userServers->sum('backup_limit');

        if ($usedAllocations + $reqAllocations > $totalAllocationsAvailable) {
            return response()->json(['error' => trans('economy.server_creation.insufficient_allocations')], 400);
        }
        if ($usedBackups + $reqBackups > $totalBackupsAvailable) {
            return response()->json(['error' => trans('economy.server_creation.insufficient_backups')], 400);
        }

        // 3. Find Node & Allocation
        $allowedNodes = $settings['allowed_nodes'] ?? [];
        $nodeQuery = \Pterodactyl\Models\Node::where('public', 1)
            ->where('maintenance_mode', 0);

        if (!empty($validated['node_id'])) {
            $nodeQuery->where('id', $validated['node_id'])
                ->where('location_id', $validated['location_id']);
        } else {
            $nodeQuery->where('location_id', $validated['location_id']);
        }
        
        if (!empty($allowedNodes)) {
            $nodeQuery->whereIn('id', $allowedNodes);
        }

        $node = $nodeQuery->first();

        if (!$node) {
            return response()->json(['error' => trans('economy.server_creation.no_nodes_available')], 400);
        }

        $allocation = \Pterodactyl\Models\Allocation::where('node_id', $node->id)
            ->whereNull('server_id')
            ->first();

        if (!$allocation) {
            return response()->json(['error' => trans('economy.server_creation.insufficient_allocations')], 400);
        }

        // 4. Create Server using standard Pterodactyl logic
        try {
            $egg = \Pterodactyl\Models\Egg::with('nest')->findOrFail($validated['egg_id']);
            
            // Collect egg environment variables
            $environment = [];
            foreach ($egg->variables as $variable) {
                $environment[$variable->env_variable] = $variable->default_value;
            }

            $dockerImage = $egg->docker_image ?? $egg->image ?? '';
            if (empty($dockerImage)) {
                if (is_array($egg->docker_images) && count($egg->docker_images) > 0) {
                    $dockerImage = array_values($egg->docker_images)[0];
                } elseif (is_string($egg->docker_images) && !empty($egg->docker_images)) {
                    $parsed = json_decode($egg->docker_images, true);
                    if (is_array($parsed) && count($parsed) > 0) {
                        $dockerImage = array_values($parsed)[0];
                    } else {
                        $dockerImage = explode("\n", trim($egg->docker_images))[0];
                    }
                }
            }
            $dockerImage = trim($dockerImage);

            $data = [
                'name' => $validated['name'],
                'owner_id' => $userId,
                'node_id' => $node->id,
                'allocation_id' => $allocation->id,
                'egg_id' => $egg->id,
                'nest_id' => $egg->nest_id,
                'memory' => $validated['ram'],
                'swap' => 0,
                'disk' => $validated['disk'],
                'cpu' => $validated['cpu'],
                'io' => 500,
                'startup' => $egg->startup,
                'image' => $dockerImage,
                'database_limit' => 0,
                'allocation_limit' => $reqAllocations,
                'backup_limit' => $reqBackups,
                'environment' => $environment,
                'start_on_completion' => true,
            ];

            $price = 0;
            $cycle = $validated['billing_cycle'] ?? 'monthly';

            if ($settings['billing']['enabled'] ?? false) {
                $dummyServer = new \Pterodactyl\Models\Server([
                    'cpu' => $validated['cpu'],
                    'memory' => $validated['ram'],
                    'disk' => $validated['disk']
                ]);
                $price = \BetterPterodactyl\Economy\BillingService::calculatePrice($dummyServer, $cycle);
                
                if ($user['points'] < $price) {
                    return response()->json(['error' => '餘額不足以支付伺服器第一期費用！需要 ' . $price . ' 點數。'], 400);
                }
            }

            $server = app(\Pterodactyl\Services\Servers\ServerCreationService::class)->handle($data);

            // Handle Billing initialization safely
            if ($settings['billing']['enabled'] ?? false) {
                \BetterPterodactyl\Economy\DB::updatePoints($userId, -$price);
                
                \BetterPterodactyl\Economy\DB::createServerBilling($server->id, [
                    'billing_cycle' => $cycle,
                    'price' => $price,
                    'status' => 'active',
                    'next_billing_at' => \BetterPterodactyl\Economy\BillingService::calculateNextDate($cycle),
                ]);
                \BetterPterodactyl\Economy\DB::logBillingTransaction($server->id, $userId, 'charge_success', $price, 'none', 'active', ['reason' => 'Server Creation']);
            }

            return response()->json([
                'success' => true,
                'server_id' => $server->uuid,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => '部署伺服器時發生錯誤: ' . $e->getMessage()], 500);
        }
    });
});

Route::prefix('/account')->middleware(AccountSubject::class)->group(function () {
    Route::prefix('/')->withoutMiddleware(RequireTwoFactorAuthentication::class)->group(function () {
        Route::get('/', [Client\AccountController::class, 'index'])->name('api:client.account');
        Route::get('/two-factor', [Client\TwoFactorController::class, 'index']);
        Route::post('/two-factor', [Client\TwoFactorController::class, 'store']);
        Route::post('/two-factor/disable', [Client\TwoFactorController::class, 'delete']);
    });

    Route::put('/email', [Client\AccountController::class, 'updateEmail'])->name('api:client.account.update-email');
    Route::put('/password', [Client\AccountController::class, 'updatePassword'])->name('api:client.account.update-password');

    Route::get('/activity', Client\ActivityLogController::class)->name('api:client.account.activity');

    Route::get('/api-keys', [Client\ApiKeyController::class, 'index']);
    Route::post('/api-keys', [Client\ApiKeyController::class, 'store']);
    Route::delete('/api-keys/{identifier}', [Client\ApiKeyController::class, 'delete']);

    Route::prefix('/ssh-keys')->group(function () {
        Route::get('/', [Client\SSHKeyController::class, 'index']);
        Route::post('/', [Client\SSHKeyController::class, 'store']);
        Route::post('/remove', [Client\SSHKeyController::class, 'delete']);
    });
});

/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client/servers/{server}
|
*/
Route::group([
    'prefix' => '/servers/{server_ident}',
    'middleware' => [
        ServerSubject::class,
    ],
], function () {
    Route::get('/billing', function (Request $request, $server_ident) {
        // Fallback: If for some reason Laravel already resolved it as an object
        if ($server_ident instanceof \Pterodactyl\Models\Server) {
            $serverModel = $server_ident;
        } else {
            $serverModel = \Pterodactyl\Models\Server::where('uuid', $server_ident)
                ->orWhere('uuidShort', $server_ident)
                ->orWhere('id', is_numeric($server_ident) ? (int)$server_ident : 0)
                ->first();
        }
            
        if (!$serverModel) {
            // Last ditch effort: check request attributes
            $serverModel = $request->attributes->get('server');
        }

        if (!$serverModel) {
            return response()->json(['error' => '伺服器不存在 (Ref: ' . (is_string($server_ident) ? $server_ident : 'Object') . ')。'], 404);
        }
        
        if ($serverModel->owner_id !== $request->user()->id) {
            return response()->json(['error' => '您沒有權限存取此伺服器的計費資訊。'], 403);
        }

        $billing = \BetterPterodactyl\Economy\DB::getServerBilling($serverModel->id);
        $settings = \BetterPterodactyl\Economy\DB::getSettings();

        if ($billing && isset($billing['next_billing_at'])) {
            $billing['next_billing_at'] = \Carbon\Carbon::parse($billing['next_billing_at'], 'UTC')->toIso8601String();
            $billing['price'] = \BetterPterodactyl\Economy\BillingService::calculatePrice($serverModel, $billing['billing_cycle']);
        }
        if ($billing && isset($billing['grace_period_ends_at'])) {
            $billing['grace_period_ends_at'] = \Carbon\Carbon::parse($billing['grace_period_ends_at'], 'UTC')->toIso8601String();
        }

        return response()->json([
            'enabled' => $settings['billing']['enabled'] ?? false,
            'billing' => $billing,
        ]);
    });

    Route::post('/billing/renew', function (Request $request, $server_ident) {
        if ($server_ident instanceof \Pterodactyl\Models\Server) {
            $serverModel = $server_ident;
        } else {
            $serverModel = \Pterodactyl\Models\Server::where('uuid', $server_ident)
                ->orWhere('uuidShort', $server_ident)
                ->orWhere('id', is_numeric($server_ident) ? (int)$server_ident : 0)
                ->first();
        }

        if (!$serverModel) {
            $serverModel = $request->attributes->get('server');
        }
        
        if (!$serverModel) {
            return response()->json(['error' => '伺服器不存在 (Ref: ' . (is_string($server_ident) ? $server_ident : 'Object') . ')。'], 404);
        }

        if ($serverModel->owner_id !== $request->user()->id) {
            return response()->json(['error' => '只有伺服器擁有者可以進行續費。'], 403);
        }

        $settings = \BetterPterodactyl\Economy\DB::getSettings();
        if (!($settings['billing']['enabled'] ?? false)) {
            return response()->json(['error' => '計費系統尚未啟用'], 400);
        }

        if (!class_exists('\BetterPterodactyl\Economy\BillingService')) {
            return response()->json(['error' => '計費服務異常'], 500);
        }

        return \BetterPterodactyl\Economy\BillingService::processCharge($serverModel->id);
    });
});

Route::group([
    'prefix' => '/servers/{server}',
    'middleware' => [
        ServerSubject::class,
        AuthenticateServerAccess::class,
        ResourceBelongsToServer::class,
    ],
], function () {
    Route::get('/', [Client\Servers\ServerController::class, 'index'])->name('api:client:server.view');
    Route::middleware([ResourceLimit::Websocket->middleware()])
        ->get('/websocket', Client\Servers\WebsocketController::class)
        ->name('api:client:server.ws');
    Route::get('/resources', Client\Servers\ResourceUtilizationController::class)->name('api:client:server.resources');
    Route::get('/activity', Client\Servers\ActivityLogController::class)->name('api:client:server.activity');



    Route::post('/command', [Client\Servers\CommandController::class, 'index']);
    Route::post('/power', [Client\Servers\PowerController::class, 'index']);

    Route::group(['prefix' => '/databases'], function () {
        Route::get('/', [Client\Servers\DatabaseController::class, 'index']);
        Route::middleware([ResourceLimit::Database->middleware()])
            ->post('/', [Client\Servers\DatabaseController::class, 'store']);
        Route::post('/{database}/rotate-password', [Client\Servers\DatabaseController::class, 'rotatePassword']);
        Route::delete('/{database}', [Client\Servers\DatabaseController::class, 'delete']);
    });

    Route::group(['prefix' => '/files'], function () {
        Route::get('/list', [Client\Servers\FileController::class, 'directory']);
        Route::get('/contents', [Client\Servers\FileController::class, 'contents']);
        Route::get('/download', [Client\Servers\FileController::class, 'download']);
        Route::put('/rename', [Client\Servers\FileController::class, 'rename']);
        Route::post('/copy', [Client\Servers\FileController::class, 'copy']);
        Route::post('/write', [Client\Servers\FileController::class, 'write']);
        Route::post('/compress', [Client\Servers\FileController::class, 'compress']);
        Route::post('/decompress', [Client\Servers\FileController::class, 'decompress']);
        Route::post('/delete', [Client\Servers\FileController::class, 'delete']);
        Route::post('/create-folder', [Client\Servers\FileController::class, 'create']);
        Route::post('/chmod', [Client\Servers\FileController::class, 'chmod']);
        Route::middleware([ResourceLimit::FilePull->middleware()])
            ->post('/pull', [Client\Servers\FileController::class, 'pull']);
        Route::get('/upload', Client\Servers\FileUploadController::class);
    });

    Route::group(['prefix' => '/schedules'], function () {
        Route::get('/', [Client\Servers\ScheduleController::class, 'index']);
        Route::middleware([ResourceLimit::Schedule->middleware()])
            ->post('/', [Client\Servers\ScheduleController::class, 'store']);
        Route::get('/{schedule}', [Client\Servers\ScheduleController::class, 'view']);
        Route::post('/{schedule}', [Client\Servers\ScheduleController::class, 'update']);
        Route::post('/{schedule}/execute', [Client\Servers\ScheduleController::class, 'execute']);
        Route::delete('/{schedule}', [Client\Servers\ScheduleController::class, 'delete']);

        Route::post('/{schedule}/tasks', [Client\Servers\ScheduleTaskController::class, 'store']);
        Route::post('/{schedule}/tasks/{task}', [Client\Servers\ScheduleTaskController::class, 'update']);
        Route::delete('/{schedule}/tasks/{task}', [Client\Servers\ScheduleTaskController::class, 'delete']);
    });

    Route::group(['prefix' => '/network'], function () {
        Route::get('/allocations', [Client\Servers\NetworkAllocationController::class, 'index']);
        Route::middleware([ResourceLimit::Allocation->middleware()])
            ->post('/allocations', [Client\Servers\NetworkAllocationController::class, 'store']);
        Route::post('/allocations/{allocation}', [Client\Servers\NetworkAllocationController::class, 'update']);
        Route::post('/allocations/{allocation}/primary', [Client\Servers\NetworkAllocationController::class, 'setPrimary']);
        Route::delete('/allocations/{allocation}', [Client\Servers\NetworkAllocationController::class, 'delete']);
    });

    Route::group(['prefix' => '/users'], function () {
        Route::get('/', [Client\Servers\SubuserController::class, 'index']);
        Route::middleware([ResourceLimit::Subuser->middleware()])
            ->post('/', [Client\Servers\SubuserController::class, 'store']);
        Route::get('/{user}', [Client\Servers\SubuserController::class, 'view']);
        Route::post('/{user}', [Client\Servers\SubuserController::class, 'update']);
        Route::delete('/{user}', [Client\Servers\SubuserController::class, 'delete']);
    });

    Route::group(['prefix' => '/backups'], function () {
        Route::get('/', [Client\Servers\BackupController::class, 'index']);
        Route::post('/', [Client\Servers\BackupController::class, 'store']);
        Route::get('/{backup}', [Client\Servers\BackupController::class, 'view']);
        Route::get('/{backup}/download', [Client\Servers\BackupController::class, 'download']);
        Route::post('/{backup}/lock', [Client\Servers\BackupController::class, 'toggleLock']);
        Route::middleware([ResourceLimit::Backup->middleware()])
            ->post('/{backup}/restore', [Client\Servers\BackupController::class, 'restore']);
        Route::delete('/{backup}', [Client\Servers\BackupController::class, 'delete']);
    });

    Route::group(['prefix' => '/startup'], function () {
        Route::get('/', [Client\Servers\StartupController::class, 'index']);
        Route::put('/variable', [Client\Servers\StartupController::class, 'update']);
    });

    Route::group(['prefix' => '/settings'], function () {
        Route::post('/rename', [Client\Servers\SettingsController::class, 'rename']);
        Route::post('/reinstall', [Client\Servers\SettingsController::class, 'reinstall']);
        Route::put('/docker-image', [Client\Servers\SettingsController::class, 'dockerImage']);
    });
});
