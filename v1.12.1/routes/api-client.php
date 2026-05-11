<?php

use Pterodactyl\Enum\ResourceLimit;
use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Client;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Activity\AccountSubject;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Pterodactyl\Http\Middleware\Api\Client\Server\ResourceBelongsToServer;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

if (!class_exists('BetterPterodactyl\Economy\DB')) {
    require_once base_path('resources/settings/economy/helpers.php');
}
if (!class_exists('BetterPterodactyl\Trash\DB')) {
    require_once base_path('resources/settings/trash/helpers.php');
}
if (!class_exists('BetterPterodactyl\Tickets\DB')) {
    require_once base_path('resources/settings/tickets/helpers.php');
}
if (!class_exists('BetterPterodactyl\Custom\Schedules\DB')) {
    require_once base_path('resources/settings/custom/schedules/helpers.php');
}
use BetterPterodactyl\Economy\DB;
use BetterPterodactyl\Trash\DB as TrashDB;
use BetterPterodactyl\Tickets\DB as TicketDB;
use BetterPterodactyl\Tickets\TicketService;
use BetterPterodactyl\Custom\Schedules\DB as ScheduleDB;
use Illuminate\Http\Request;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\ListFilesRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\DeleteFileRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Schedules\TriggerScheduleRequest;

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

// Plugin storage routes for clients
Route::group(['prefix' => '/plugins'], function () {
    Route::get('/storage', function (\Illuminate\Http\Request $request) {
        if (!class_exists('BetterPterodactyl\Plugins\DB')) {
            require_once base_path('resources/settings/plugins/helpers.php');
        }
        $pluginId = $request->query('id');
        if (!$pluginId) return response()->json(['error' => 'Missing plugin ID'], 400);
        
        // Scope by user_id
        return response()->json(\BetterPterodactyl\Plugins\DB::getStorage($pluginId, $request->user()->id));
    });

    Route::post('/storage', function (\Illuminate\Http\Request $request) {
        if (!class_exists('BetterPterodactyl\Plugins\DB')) {
            require_once base_path('resources/settings/plugins/helpers.php');
        }
        $pluginId = $request->input('id');
        $key = $request->input('key');
        $value = $request->input('value');
        
        if (!$pluginId || !$key) return response()->json(['error' => 'Missing required fields'], 400);
        
        // Scope by user_id
        \BetterPterodactyl\Plugins\DB::setStorage($pluginId, $key, $value, $request->user()->id);
        return response()->json(['success' => true]);
    });

    Route::post('/storage/delete', function (\Illuminate\Http\Request $request) {
        if (!class_exists('BetterPterodactyl\Plugins\DB')) {
            require_once base_path('resources/settings/plugins/helpers.php');
        }
        $pluginId = $request->input('id');
        $key = $request->input('key');
        
        if (!$pluginId || !$key) return response()->json(['error' => 'Missing required fields'], 400);
        
        // Scope by user_id
        \BetterPterodactyl\Plugins\DB::deleteStorage($pluginId, $key, $request->user()->id);
        return response()->json(['success' => true]);
    });

    // Backend Hooks
    Route::post('/{id}/hook/{action}', function (\Illuminate\Http\Request $request, $id, $action) {
        if (!class_exists('BetterPterodactyl\Plugins\HookService')) {
            require_once base_path('resources/settings/plugins/helpers.php');
            require_once base_path('resources/settings/plugins/HookService.php');
        }
        return \BetterPterodactyl\Plugins\HookService::dispatch($id, $action, $request->user()->id, $request->all());
    });
});


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

                        // 4. Process Trash Cleanup
                        $trashSettings = TrashDB::getSettings();
                        if ($trashSettings['enabled'] ?? false) {
                            $retention = (int) ($trashSettings['retention_days'] ?? 30);
                            $allServers = \Pterodactyl\Models\Server::all();
                            foreach ($allServers as $server) {
                                try {
                                    $trashPath = '.bp_trash';
                                    // We use the same FileController logic or call Wings directly if possible.
                                    // For simplicity in this patched environment, we'll try to use Wings via sub-requests or dispatch a job.
                                    // However, since we are in a terminating callback, we should be careful.
                                    // A safer way is to just let the individual server access trigger the cleanup or use a dedicated service.
                                    // But let's try to do a basic cleanup via Wings if we can resolve the repository.
                                    $repository = app(DaemonFileRepository::class);
                                    $repository->setServer($server);
                                    
                                    $repository->getDirectory($trashPath);
                                    $files = $repository->getDirectoryContents($trashPath);
                                    foreach ($files as $file) {
                                        $mtime = $file->mtime ?? 0;
                                        if ($mtime > 0 && (time() - $mtime) > ($retention * 86400)) {
                                            $repository->deleteFiles($trashPath, [$file->name]);
                                        }
                                    }
                                } catch (\Throwable $e) {
                                    // Ignore errors for specific servers
                                }
                            }
                        }
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
                'trash_enabled' => \BetterPterodactyl\Trash\DB::getSettings()['enabled'] ?? true,
                'tickets_enabled' => \BetterPterodactyl\Tickets\DB::getSettings()['enabled'] ?? false,
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

Route::group(['prefix' => '/tickets'], function () {
    Route::get('/', function (Request $request) {
        $settings = TicketDB::getSettings();
        if (!($settings['enabled'] ?? false)) {
            return response()->json(['error' => 'Ticket system is disabled.'], 403);
        }
        return response()->json(TicketDB::getTickets($request->user()->id));
    });

    Route::get('/new', function (Request $request) {
        $settings = TicketDB::getSettings();
        if (!($settings['enabled'] ?? false)) {
            return response()->json(['error' => 'Ticket system is disabled.'], 403);
        }
        return response()->json([
            'categories' => ['General Support', 'Technical Issue', 'Billing', 'Report'],
            'priorities' => ['low', 'normal', 'high'],
        ]);
    });

    Route::post('/', function (Request $request) {
        $settings = TicketDB::getSettings();
        if (!($settings['enabled'] ?? false)) {
            return response()->json(['error' => 'Ticket system is disabled.'], 403);
        }

        $openTicketCount = TicketDB::getUserOpenTicketsCount($request->user()->id);
        if ($openTicketCount >= $settings['max_per_user']) {
            return response()->json(['error' => __('admin/tickets.errors.limit_reached')], 403);
        }

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'priority' => 'required|string|in:low,normal,high',
            'category' => 'required|string',
            'content' => 'required|string',
            'server_id' => 'nullable|integer',
        ]);

        $ticketId = TicketDB::createTicket(
            $request->user()->id,
            $validated['subject'],
            $validated['priority'],
            $validated['category'],
            $validated['server_id'] ?? null
        );

        TicketDB::addComment($ticketId, $request->user()->id, $validated['content']);

        // Send Discord Notification
        TicketService::sendDiscordNotification($ticketId, $validated['subject'], $request->user());

        return response()->json(['success' => true, 'id' => $ticketId]);
    });

    Route::get('/{id}', function (Request $request, $id) {
        $ticket = TicketDB::getTicket($id);
        if (!$ticket || ($ticket['user_id'] != $request->user()->id && !$request->user()->rootAdmin)) {
            return response()->json(['error' => 'Ticket not found.'], 404);
        }

        return response()->json([
            'ticket' => $ticket,
            'comments' => TicketDB::getComments($id)
        ]);
    })->where('id', '[0-9]+');

    Route::post('/{id}/comment', function (Request $request, $id) {
        $ticket = TicketDB::getTicket($id);
        if (!$ticket || ($ticket['user_id'] != $request->user()->id && !$request->user()->rootAdmin)) {
            return response()->json(['error' => 'Ticket not found.'], 404);
        }

        if ($ticket['status'] === 'closed') {
            return response()->json(['error' => 'Cannot comment on a closed ticket.'], 403);
        }

        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        TicketDB::addComment($id, $request->user()->id, $validated['comment'], $request->user()->rootAdmin);

        return response()->json(['success' => true]);
    })->where('id', '[0-9]+');

    Route::post('/{id}/status', function (Request $request, $id) {
        $ticket = TicketDB::getTicket($id);
        if (!$ticket || ($ticket['user_id'] != $request->user()->id && !$request->user()->rootAdmin)) {
            return response()->json(['error' => 'Ticket not found.'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:open,resolved,closed',
        ]);

        TicketDB::updateStatus($id, $validated['status']);

        return response()->json(['success' => true]);
    })->where('id', '[0-9]+');
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

    // Server-scoped Plugin Hooks
    Route::post('/plugins/{id}/hook/{action}', function (\Illuminate\Http\Request $request, $server_ident, $id, $action) {
        if (!class_exists('BetterPterodactyl\Plugins\HookService')) {
            require_once base_path('resources/settings/plugins/helpers.php');
            require_once base_path('resources/settings/plugins/HookService.php');
        }
        return \BetterPterodactyl\Plugins\HookService::dispatch($id, $action, $request->user()->id, $request->all(), $server_ident);
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

    Route::get('/shortcuts', function (Request $request, Server $server) {
        if (!class_exists('BetterPterodactyl\Custom\Shortcuts\DB')) {
            require_once base_path('resources/settings/custom/shortcuts/helpers.php');
        }
        return response()->json(\BetterPterodactyl\Custom\Shortcuts\DB::getShortcuts($request->user()->id, $server->id));
    });

    Route::post('/shortcuts', function (Request $request, Server $server) {
        if (!class_exists('BetterPterodactyl\Custom\Shortcuts\DB')) {
            require_once base_path('resources/settings/custom/shortcuts/helpers.php');
        }
        $shortcuts = $request->input('shortcuts');
        if (!is_array($shortcuts)) {
            return response()->json(['error' => 'Invalid data format.'], 400);
        }
        \BetterPterodactyl\Custom\Shortcuts\DB::updateShortcuts($request->user()->id, $server->id, $shortcuts);
        return response()->json(['success' => true]);
    });

    Route::group(['prefix' => '/databases'], function () {
        Route::get('/', [Client\Servers\DatabaseController::class, 'index']);
        Route::middleware([ResourceLimit::Database->middleware()])
            ->post('/', [Client\Servers\DatabaseController::class, 'store']);
        Route::post('/{database}/rotate-password', [Client\Servers\DatabaseController::class, 'rotatePassword']);
        Route::delete('/{database}', [Client\Servers\DatabaseController::class, 'delete']);
    });

    Route::group(['prefix' => '/trash'], function () {

        Route::post('/restore', function (Request $request, Server $server) {
            try {
                $server->loadMissing('node');
                $repository = app(DaemonFileRepository::class);
                $repository->setServer($server);
                
                $files = $request->input('files', []);
                $renameFiles = [];
                
                foreach ($files as $file) {
                    // file name in trash: [random]_[time]_[original]
                    $parts = explode('_', $file, 3);
                    $targetName = (count($parts) < 3) ? $file : $parts[2];
                    
                    $renameFiles[] = [
                        'from' => '.bp_trash/' . ltrim($file, '/'),
                        'to' => $targetName
                    ];
                }
                
                if (!empty($renameFiles)) {
                    $repository->renameFiles('/', $renameFiles);
                }
                return response()->noContent();
            } catch (\Throwable $e) {
                \Log::error('BetterPterodactyl Trash Restore Error: ' . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        });

        Route::post('/clear', function (Request $request, Server $server) {
            try {
                $server->loadMissing('node');
                $repository = app(DaemonFileRepository::class);
                $repository->setServer($server);
                
                $files = $repository->getDirectoryContents('.bp_trash');
                $fileNames = array_map(fn($f) => $f->name, $files);
                
                if (!empty($fileNames)) {
                    $repository->deleteFiles('.bp_trash', $fileNames);
                }
                
                return response()->noContent();
            } catch (\Throwable $e) {
                \Log::error('BetterPterodactyl Trash Clear Error: ' . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        });
    });

    Route::group(['prefix' => '/files'], function () {
        Route::get('/list', function (Request $request, Server $server, Client\Servers\FileController $controller) {
            $fallback = function() use ($request, $server, $controller) {
                try {
                    $rc = new \ReflectionClass($controller);
                    $method = $rc->getMethod('directory');
                    $params = $method->getParameters();
                    if (isset($params[0]) && $type = $params[0]->getType()) {
                        $typeName = $type->getName();
                        if (class_exists($typeName) && $typeName !== 'Illuminate\Http\Request') {
                            \Log::info('BetterPterodactyl Trash: Attempting spoofer', ['type' => $typeName]);
                            $spoofed = app($typeName);
                            $spoofed->setMethod($request->getMethod());
                            $spoofed->query->replace($request->query->all());
                            $spoofed->request->replace($request->request->all());
                            $spoofed->files->replace($request->files->all());
                            $spoofed->cookies->replace($request->cookies->all());
                            $spoofed->headers->replace($request->headers->all());
                            $spoofed->setUserResolver($request->getUserResolver());
                            $spoofed->setRouteResolver($request->getRouteResolver());
                            
                            try {
                                return $controller->directory($spoofed, $server);
                            } catch (\Throwable $e) {
                                \Log::error('BetterPterodactyl Trash: Controller call failed: ' . $e->getMessage());
                                throw $e;
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    \Log::error('BetterPterodactyl Trash: List fallback spoof failed: ' . $e->getMessage());
                    throw $e;
                }
                
                return $controller->directory($request, $server);
            };

            try {
                $server->loadMissing('node');
                $response = $fallback();
                
                // Unified filtering: Only hide .bp_trash if we are NOT explicitly looking at it
                $requestedDir = $request->query('directory', '');
                if (trim($requestedDir, '/') === '.bp_trash') {
                    return $response;
                }

                $filterTrash = function ($items) {
                    if (!is_array($items)) return $items;
                    return array_values(array_filter($items, function ($item) {
                        $name = '';
                        if (is_array($item)) {
                            $name = $item['name'] ?? ($item['attributes']['name'] ?? '');
                        } elseif (is_object($item)) {
                            $name = $item->name ?? ($item->attributes->name ?? '');
                        }
                        return strtolower((string)$name) !== '.bp_trash';
                    }));
                };

                if (is_object($response)) {
                    if (method_exists($response, 'getData')) {
                        $data = $response->getData(true);
                        if (isset($data['data']) && is_array($data['data'])) {
                            $data['data'] = $filterTrash($data['data']);
                        }
                        return response()->json($data);
                    }
                    if (method_exists($response, 'toArray')) {
                        $data = $response->toArray();
                        if (isset($data['data']) && is_array($data['data'])) {
                            $data['data'] = $filterTrash($data['data']);
                        } else {
                            $data = $filterTrash($data);
                        }
                        return response()->json($data);
                    }
                }
                
                if (is_array($response)) {
                    if (isset($response['data']) && is_array($response['data'])) {
                        $response['data'] = $filterTrash($response['data']);
                    } else {
                        $response = $filterTrash($response);
                    }
                    return response()->json($response);
                }

                return $response;
            } catch (\Throwable $e) {
                if ($requestedDir === '.bp_trash') {
                    return response()->json(['data' => []]);
                }
                throw $e;
            }
        });

        Route::get('/contents', [Client\Servers\FileController::class, 'contents']);
        Route::get('/download', [Client\Servers\FileController::class, 'download']);
        Route::put('/rename', [Client\Servers\FileController::class, 'rename']);
        Route::post('/copy', [Client\Servers\FileController::class, 'copy']);
        Route::post('/write', [Client\Servers\FileController::class, 'write']);
        Route::post('/compress', [Client\Servers\FileController::class, 'compress']);
        Route::post('/decompress', [Client\Servers\FileController::class, 'decompress']);
        
        Route::post('/delete', function (Request $request, Server $server, Client\Servers\FileController $controller) {
            $fallback = function() use ($request, $server, $controller) {
                try {
                    $rc = new \ReflectionClass($controller);
                    $method = $rc->getMethod('delete');
                    $params = $method->getParameters();
                    if (isset($params[0]) && $type = $params[0]->getType()) {
                        $typeName = $type->getName();
                        if (class_exists($typeName) && $typeName !== 'Illuminate\Http\Request') {
                            $spoofed = app($typeName);
                            $spoofed->setMethod($request->getMethod());
                            $spoofed->query->replace($request->query->all());
                            $spoofed->request->replace($request->request->all());
                            $spoofed->files->replace($request->files->all());
                            $spoofed->cookies->replace($request->cookies->all());
                            $spoofed->headers->replace($request->headers->all());
                            $spoofed->setUserResolver($request->getUserResolver());
                            $spoofed->setRouteResolver($request->getRouteResolver());
                            
                            try {
                                return $controller->delete($spoofed, $server);
                            } catch (\Throwable $e) {
                                \Log::error('BetterPterodactyl Trash: Delete controller call failed: ' . $e->getMessage());
                                throw $e;
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    \Log::error('BetterPterodactyl Trash: Delete fallback spoof failed: ' . $e->getMessage());
                    throw $e;
                }
                
                return $controller->delete($request, $server);
            };

            try {
                $server->loadMissing('node');
                $repository = app(DaemonFileRepository::class);
                $repository->setServer($server);
            } catch (\Exception $e) {
                \Log::error('BetterPterodactyl Trash: Failed to resolve repository: ' . $e->getMessage());
                return $fallback();
            }

            $trashSettings = TrashDB::getSettings();
            $retention = (int) ($trashSettings['retention_days'] ?? 30);
            $isEnabled = $trashSettings['enabled'] ?? true;

            // Log the attempt for debugging
            \Log::debug('BetterPterodactyl Trash: Deletion request', [
                'enabled' => $isEnabled,
                'retention' => $retention,
                'user' => $request->user()->id ?? 'unknown'
            ]);

            if (!$isEnabled || $retention <= 0) {
                return $fallback();
            }

            $root = ltrim($request->input('root', '/'), '/');
            $files = $request->input('files', []);

            if (str_starts_with($root, '.bp_trash')) {
                return $fallback();
            }

            try {
                try {
                    $repository->getDirectory('.bp_trash');
                } catch (\Throwable $e) {
                    try {
                        $repository->createDirectory('', '.bp_trash');
                    } catch (\Throwable $e2) {
                        $repository->createDirectory('/', '.bp_trash');
                    }
                }
            } catch (\Throwable $e) {
                \Log::error('BetterPterodactyl Trash: All directory creation attempts failed: ' . $e->getMessage());
            }

            $renameFiles = [];
            foreach ($files as $file) {
                $cleanFile = ltrim($file, '/');
                $fromPath = trim($root . '/' . $cleanFile, '/');
                $trashName = bin2hex(random_bytes(4)) . '_' . time() . '_' . str_replace('/', '_', $cleanFile);
                
                $renameFiles[] = [
                    'from' => $fromPath,
                    'to' => '.bp_trash/' . $trashName
                ];
            }

            try {
                $repository->renameFiles('/', $renameFiles);
                return response()->noContent();
            } catch (\Throwable $e) {
                \Log::error('BetterPterodactyl Trash: Failed to move files to trash: ' . $e->getMessage());
                return response()->json(['error' => 'Failed to move files to trash: ' . $e->getMessage()], 500);
            }
        });

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
        Route::post('/{schedule}/execute', function (TriggerScheduleRequest $request, \Pterodactyl\Models\Server $server, \Pterodactyl\Models\Schedule $schedule) {
            try {
                if (!ScheduleDB::checkConditions($schedule)) {
                    return response()->json([
                        'error' => '智慧系統攔截：目前伺服器狀態未達執行條件（如：尚有玩家在線或資源使用率不符）。'
                    ], 403);
                }
            } catch (\Exception $e) {
                return response()->json([
                    'error' => '智慧系統內部錯誤：' . $e->getMessage()
                ], 500);
            }
            return app(Client\Servers\ScheduleController::class)->execute($request, $server, $schedule);
        });
        Route::delete('/{schedule}', [Client\Servers\ScheduleController::class, 'delete']);

        Route::post('/{schedule}/tasks', [Client\Servers\ScheduleTaskController::class, 'store']);
        Route::post('/{schedule}/tasks/{task}', [Client\Servers\ScheduleTaskController::class, 'update']);
        Route::delete('/{schedule}/tasks/{task}', [Client\Servers\ScheduleTaskController::class, 'delete']);

        Route::get('/{schedule}/conditions', function (Request $request, $server, $schedule) {
            return response()->json(ScheduleDB::getConditions($schedule));
        });
        Route::post('/{schedule}/conditions', function (Request $request, $server, $schedule) {
            $validated = $request->validate([
                'conditions' => 'required|array',
                'logic_operator' => 'required|string|in:AND,OR',
            ]);
            ScheduleDB::updateConditions($schedule, $validated['conditions'], $validated['logic_operator']);
            return response()->json(['success' => true]);
        });
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
