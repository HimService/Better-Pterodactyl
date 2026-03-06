<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Admin;
use Pterodactyl\Http\Middleware\Admin\Servers\ServerInstalled;


Route::get('/', [Admin\BaseController::class, 'index'])->name('admin.index');
Route::get('/announcements', [Admin\BaseController::class, 'index'])->name('admin.announcements');
Route::get('/status', [Admin\BaseController::class, 'index'])->name('admin.status');
Route::get('/economy', [Admin\BaseController::class, 'index'])->name('admin.economy');
Route::get('/discord', [Admin\BaseController::class, 'index'])->name('admin.discord');
Route::get('/plugins', [Admin\BaseController::class, 'index'])->name('admin.plugins');
Route::get('/update', [Admin\BaseController::class, 'index'])->name('admin.update');
Route::get('/discord/settings', function () {
    if (!class_exists('BetterPterodactyl\Discord\DB')) {
        require_once base_path('resources/settings/discord/helpers.php');
    }
    return response()->json(\BetterPterodactyl\Discord\DB::getSettings());
});
Route::post('/discord/settings', function (\Illuminate\Http\Request $request) {
    if (!class_exists('BetterPterodactyl\Discord\DB')) {
        require_once base_path('resources/settings/discord/helpers.php');
    }
    $payload = $request->json()->all();
    \BetterPterodactyl\Discord\DB::updateSettings($payload);
    return response()->json(['success' => true]);
});
Route::get('/status/nodes', function () {
    $settingsPath = base_path('resources/settings/status_nodes.json');
    $settings = file_exists($settingsPath) ? (json_decode(file_get_contents($settingsPath), true) ?? []) : [];
    $hiddenNodes = $settings['nodes'] ?? [];
    
        $nodes = \Pterodactyl\Models\Node::query()
            ->with('location')
            ->get()
            ->map(function (\Pterodactyl\Models\Node $node) use ($hiddenNodes) {
                return [
                    'id' => $node->id,
                    'name' => $node->name,
                    'location' => optional($node->location)->short ?? 'Unknown',
                    'public' => in_array($node->id, $hiddenNodes),
                ];
            });

    return [
        'nodes' => $nodes,
        'webhook_url' => $settings['webhook_url'] ?? '',
        'alerts_enabled' => $settings['alerts_enabled'] ?? false,
    ];
});
Route::post('/status', function (\Illuminate\Http\Request $request) {
    try {
        $path = base_path('resources/settings/status_nodes.json');
        
        if (!is_dir(dirname($path))) {
            if (!mkdir(dirname($path), 0755, true)) {
                return response()->json(['error' => 'Failed to create directory: ' . dirname($path)], 500);
            }
        }
        
        $payload = $request->json()->all();
        // If payload is just numeric array (old behavior from frontend), wrap it
        if (array_is_list($payload)) {
            $payload = [
                'nodes' => $payload,
                'webhook_url' => '',
                'alerts_enabled' => false,
            ];
        }
        
        $result = file_put_contents($path, json_encode($payload, JSON_PRETTY_PRINT));
        if ($result === false) {
            return response()->json(['error' => 'Failed to write to file: ' . $path . '. Check permissions.'], 500);
        }
        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

Route::post('/status/test', function (\Illuminate\Http\Request $request) {
    try {
        $webhookUrl = $request->input('webhook_url');
        if (empty($webhookUrl)) {
            return response()->json(['error' => 'Webhook URL is required'], 400);
        }

        $response = \Illuminate\Support\Facades\Http::post($webhookUrl, [
            'username' => 'Better Pterodactyl Monitor',
            'embeds' => [[
                'title' => '🧪 Webhook 測試通知 (Test Notification)',
                'description' => "這是一則測試通知，代表您的 Webhook 設定已成功連線！",
                'color' => 3447003,
                'fields' => [
                    ['name' => '測試時間', 'value' => now()->toDateTimeString(), 'inline' => true],
                    ['name' => '狀態', 'value' => '連線正常', 'inline' => true],
                ],
                'footer' => [
                    'text' => 'Better Pterodactyl Monitor',
                ],
                'timestamp' => now()->toIso8601String(),
            ]]
        ]);

        if (!$response->successful()) {
            return response()->json(['error' => 'Webhook returned error: ' . $response->status()], 500);
        }

        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});
Route::post('/announcements', function (\Illuminate\Http\Request $request) {
    try {
        $path = base_path('resources/settings/announcements.json');
        
        // Ensure the directory exists
        if (!is_dir(dirname($path))) {
            if (!mkdir(dirname($path), 0755, true)) {
                return response()->json(['error' => 'Failed to create directory: ' . dirname($path)], 500);
            }
        }
        
        $payload = $request->json()->all();
        $result = file_put_contents($path, json_encode($payload, JSON_PRETTY_PRINT));
        if ($result === false) {
            return response()->json(['error' => 'Failed to write to file: ' . $path], 500);
        }
        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()], 500);
    }
});

Route::get('/economy/settings', function () {
    if (!class_exists('BetterPterodactyl\Economy\DB')) {
        require_once base_path('resources/settings/economy/helpers.php');
    }
    try {
        $settings = \BetterPterodactyl\Economy\DB::getSettings();
        return response()->json($settings);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

Route::get('/economy/users', function (\Illuminate\Http\Request $request) {
    if (!class_exists('BetterPterodactyl\Economy\DB')) {
        require_once base_path('resources/settings/economy/helpers.php');
    }
    $query = $request->query('filter', '');
    if (empty($query)) return [];

    return \Pterodactyl\Models\User::query()
        ->where('email', 'LIKE', "%$query%")
        ->orWhere('username', 'LIKE', "%$query%")
        ->limit(10)
        ->get()
        ->map(function ($user) {
            $ecoUser = \BetterPterodactyl\Economy\DB::getUser($user->id);
            return [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
                'points' => (float)$ecoUser['points'],
                'resources' => [
                    'cpu' => $ecoUser['extra_cpu'],
                    'ram' => $ecoUser['extra_memory'],
                    'disk' => $ecoUser['extra_disk'],
                    'backups' => $ecoUser['extra_backups'],
                    'allocations' => $ecoUser['extra_allocations'],
                    'slots' => $ecoUser['extra_slots'],
                ]
            ];
        });
});

Route::post('/economy/users/{id}/resources', function ($id, \Illuminate\Http\Request $request) {
    if (!class_exists('BetterPterodactyl\Economy\DB')) {
        require_once base_path('resources/settings/economy/helpers.php');
    }
    try {
        $data = $request->validate([
            'points' => 'required|numeric',
            'cpu' => 'required|integer',
            'ram' => 'required|integer',
            'disk' => 'required|integer',
            'backups' => 'required|integer',
            'allocations' => 'required|integer',
            'slots' => 'required|integer',
        ]);

        $db = \BetterPterodactyl\Economy\DB::getConnection();
        $stmt = $db->prepare("UPDATE users SET points = ?, extra_cpu = ?, extra_memory = ?, extra_disk = ?, extra_backups = ?, extra_allocations = ?, extra_slots = ? WHERE user_id = ?");
        $stmt->execute([
            $data['points'],
            $data['cpu'],
            $data['ram'],
            $data['disk'],
            $data['backups'],
            $data['allocations'],
            $data['slots'],
            $id
        ]);

        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

Route::post('/economy/settings', function (\Illuminate\Http\Request $request) {
    if (!class_exists('BetterPterodactyl\Economy\DB')) {
        require_once base_path('resources/settings/economy/helpers.php');
    }
    try {
        $settings = \BetterPterodactyl\Economy\DB::getSettings();
        $payload = $request->json()->all();
        $newSettings = array_replace_recursive($settings, $payload);
        
        if (!isset($payload['enabled'])) {
            $newSettings['enabled'] = false;
        }
        if (isset($payload['api_tokens'])) {
            $newSettings['api_tokens'] = $payload['api_tokens'];
        }
        if (isset($payload['allowed_eggs'])) {
            $newSettings['allowed_eggs'] = $payload['allowed_eggs'];
        }
        if (isset($payload['allowed_nodes'])) {
            $newSettings['allowed_nodes'] = $payload['allowed_nodes'];
        }

        \BetterPterodactyl\Economy\DB::updateSettings($newSettings);
        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

Route::get('/economy/nests', function () {
    return response()->json(\Pterodactyl\Models\Nest::with('eggs')->get()->map(function($nest) {
        return [
            'id' => $nest->id,
            'name' => $nest->name,
            'eggs' => $nest->eggs->map(function($egg) {
                return [
                    'id' => $egg->id,
                    'name' => $egg->name,
                ];
            }),
        ];
    }));
});

Route::get('/economy/locations', function () {
    return response()->json(\Pterodactyl\Models\Location::with('nodes')->get()->map(function($location) {
        return [
            'id' => $location->id,
            'name' => $location->short,
            'nodes' => $location->nodes->map(function($node) {
                return [
                    'id' => $node->id,
                    'name' => $node->name,
                ];
            }),
        ];
    }));
});

Route::get('/economy/promo_codes', function () {
    if (!class_exists('BetterPterodactyl\Economy\DB')) {
        require_once base_path('resources/settings/economy/helpers.php');
    }
    return response()->json(\BetterPterodactyl\Economy\DB::getPromoCodes());
});

Route::post('/economy/promo_codes', function (\Illuminate\Http\Request $request) {
    if (!class_exists('BetterPterodactyl\Economy\DB')) {
        require_once base_path('resources/settings/economy/helpers.php');
    }
    try {
        $data = $request->validate([
            'code' => 'required|string|max:32',
            'rewards' => 'required|array|min:1',
            'rewards.*.type' => 'required|string|in:points,cpu,ram,disk,backups,allocations,slots',
            'rewards.*.amount' => 'required|numeric|min:0.01',
            'max_uses' => 'required|integer|min:1',
        ]);

        $code = strtoupper($data['code']);
        \BetterPterodactyl\Economy\DB::updatePromoCode($code, [
            'rewards' => $data['rewards'],
            'max_uses' => $data['max_uses'],
        ]);
        
        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

Route::post('/economy/promo_codes/delete', function (\Illuminate\Http\Request $request) {
    if (!class_exists('BetterPterodactyl\Economy\DB')) {
        require_once base_path('resources/settings/economy/helpers.php');
    }
    try {
        $code = $request->input('code');
        \BetterPterodactyl\Economy\DB::deletePromoCode($code);
        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

Route::get('/announcements/test-error', function () {
    try {
        $path = base_path('resources/settings/announcements.json');
        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        $result = file_put_contents($path, "{}");
        if ($result === false) {
            return "Failed to write to {$path}. Check permissions.";
        }
        return "Write Test Successful! Written to {$path}";
    } catch (\Exception $e) {
        return "Exception: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine();
    }
});

Route::get('/plugins/list', function () {
    if (!class_exists('BetterPterodactyl\Plugins\DB')) {
        require_once base_path('resources/settings/plugins/helpers.php');
    }
    return response()->json(\BetterPterodactyl\Plugins\DB::getPlugins());
});

Route::post('/plugins/install', function (\Illuminate\Http\Request $request) {
    if (!class_exists('BetterPterodactyl\Plugins\DB')) {
        require_once base_path('resources/settings/plugins/helpers.php');
    }
    // Support both raw JSON in body or a 'json' field
    $payload = $request->json()->all();
    
    // If it's a wrapper, unwrap it
    if (isset($payload['plugin'])) {
        $payload = $payload['plugin'];
    }

    $data = [
        'name' => $payload['name'] ?? 'Unknown Plugin',
        'slot' => $payload['slot'] ?? 'dashboard_header',
        'type' => $payload['type'] ?? 'iframe',
        'description' => $payload['description'] ?? '',
        'config' => $payload['config'] ?? $payload, // Fallback to entire payload if no config key
        'enabled' => (bool) ($payload['enabled'] ?? true),
    ];
    
    \BetterPterodactyl\Plugins\DB::createPlugin($data);
    return response()->json(['success' => true]);
});

Route::post('/plugins/toggle', function (\Illuminate\Http\Request $request) {
    if (!class_exists('BetterPterodactyl\Plugins\DB')) {
        require_once base_path('resources/settings/plugins/helpers.php');
    }
    $id = $request->input('id');
    $enabled = $request->input('enabled');
    \BetterPterodactyl\Plugins\DB::togglePlugin($id, $enabled);
    return response()->json(['success' => true]);
});

Route::post('/plugins/delete', function (\Illuminate\Http\Request $request) {
    if (!class_exists('BetterPterodactyl\Plugins\DB')) {
        require_once base_path('resources/settings/plugins/helpers.php');
    }
    $id = $request->input('id');
    \BetterPterodactyl\Plugins\DB::deletePlugin($id);
    return response()->json(['success' => true]);
});

Route::get('/update/check', function () {
    $localVersionPath = base_path('resources/settings/version.json');
    $localId = 0;
    $localVersion = 'Unknown';
    
    if (file_exists($localVersionPath)) {
        try {
            $json = json_decode(file_get_contents($localVersionPath), true);
            $localId = (int) ($json['id'] ?? 0);
            $localVersion = $json['version'] ?? 'Unknown';
        } catch (\Exception $e) {}
    }

    $remoteId = $localId;
    $remoteVersion = $localVersion;

    try {
        // Add cache buster
        $url = 'https://raw.githubusercontent.com/HimService/Better-Pterodactyl/develop/v1.12.1/resources/settings/version.json?t=' . time();
        $response = \Illuminate\Support\Facades\Http::get($url);
        if ($response->successful()) {
            $data = $response->json();
            $remoteId = (int) ($data['id'] ?? 0);
            $remoteVersion = $data['version'] ?? 'Unknown';
        }
    } catch (\Exception $e) {}

    return response()->json([
        'local' => $localVersion,
        'remote' => $remoteVersion,
        'updatable' => $remoteId > $localId,
        'debug' => [
            'local_id' => $localId,
            'remote_id' => $remoteId
        ]
    ]);
});

Route::post('/update/execute', function () {
    set_time_limit(900);
    try {
        $zipUrl = 'https://github.com/HimService/Better-Pterodactyl/archive/refs/heads/develop.zip';
        $tempZip = storage_path('app/update.zip');
        $backupPath = storage_path('app/settings_backup');
        $extractPath = storage_path('app/update_extract');
        
        // Paths for Atomic Swap
        $resOld = base_path('resources_old');
        $routesOld = base_path('routes_old');
        $resNew = base_path('resources_new');
        $routesNew = base_path('routes_new');

        // 1. Download
        $response = \Illuminate\Support\Facades\Http::get($zipUrl);
        if (!$response->successful()) {
            return response()->json(['error' => 'Failed to download update from GitHub.'], 500);
        }
        file_put_contents($tempZip, $response->body());

        // 2. Extract
        $zip = new \ZipArchive();
        if ($zip->open($tempZip) === TRUE) {
            if (is_dir($extractPath)) {
                \Illuminate\Support\Facades\File::deleteDirectory($extractPath);
            }
            mkdir($extractPath, 0755, true);
            $zip->extractTo($extractPath);
            $zip->close();

            $sourcePath = $extractPath . '/Better-Pterodactyl-develop/v1.12.1';
            
            if (is_dir($sourcePath . '/resources') && is_dir($sourcePath . '/routes')) {
                // 3. Backup Settings
                if (is_dir(base_path('resources/settings'))) {
                    if (is_dir($backupPath)) {
                        \Illuminate\Support\Facades\File::deleteDirectory($backupPath);
                    }
                    \Illuminate\Support\Facades\File::copyDirectory(base_path('resources/settings'), $backupPath);
                }

                // 4. Pre-Cleanup (Remove any previous failed update leftovers)
                if (is_dir($resOld)) \Illuminate\Support\Facades\File::deleteDirectory($resOld);
                if (is_dir($routesOld)) \Illuminate\Support\Facades\File::deleteDirectory($routesOld);
                if (is_dir($resNew)) \Illuminate\Support\Facades\File::deleteDirectory($resNew);
                if (is_dir($routesNew)) \Illuminate\Support\Facades\File::deleteDirectory($routesNew);

                // 5. Atomic Preparation: Copy extracted to _new
                \Illuminate\Support\Facades\File::copyDirectory($sourcePath . '/resources', $resNew);
                \Illuminate\Support\Facades\File::copyDirectory($sourcePath . '/routes', $routesNew);

                // 6. SWAP: Millisecond downtime
                rename(base_path('resources'), $resOld);
                rename(base_path('routes'), $routesOld);
                rename($resNew, base_path('resources'));
                rename($routesNew, base_path('routes'));
                
                // 7. Restore backup (except version.json)
                if (is_dir($backupPath)) {
                    $files = \Illuminate\Support\Facades\File::allFiles($backupPath);
                    foreach ($files as $file) {
                        if ($file->getFilename() === 'version.json') continue;
                        
                        $relativePath = str_replace($backupPath, '', $file->getRealPath());
                        $targetPath = base_path('resources/settings' . $relativePath);
                        
                        \Illuminate\Support\Facades\File::ensureDirectoryExists(dirname($targetPath));
                        \Illuminate\Support\Facades\File::copy($file->getRealPath(), $targetPath);
                    }
                }

                // 8. Final Cleanup & Permissions
                \Illuminate\Support\Facades\File::deleteDirectory($extractPath);
                \Illuminate\Support\Facades\File::deleteDirectory($backupPath);
                \Illuminate\Support\Facades\File::deleteDirectory($resOld);
                \Illuminate\Support\Facades\File::deleteDirectory($routesOld);
                unlink($tempZip);

                // Permissions
                shell_exec('chown -R www-data:www-data ' . base_path('resources/settings'));
                
                // 9. Build
                shell_exec('cd ' . base_path() . ' && yarn build:production > /dev/null 2>&1 &');

                return response()->json(['success' => true]);
            } else {
                 return response()->json(['error' => 'Could not find version folder or assets in the downloaded package.'], 500);
            }
        } else {
            return response()->json(['error' => 'Failed to open ZIP file.'], 500);
        }
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

/*
|--------------------------------------------------------------------------
| Location Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/api
|
*/
Route::group(['prefix' => 'api'], function () {
    Route::get('/', [Admin\ApiController::class, 'index'])->name('admin.api.index');
    Route::get('/new', [Admin\ApiController::class, 'create'])->name('admin.api.new');

    Route::post('/new', [Admin\ApiController::class, 'store']);

    Route::delete('/revoke/{identifier}', [Admin\ApiController::class, 'delete'])->name('admin.api.delete');
});

/*
|--------------------------------------------------------------------------
| Location Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/locations
|
*/
Route::group(['prefix' => 'locations'], function () {
    Route::get('/', [Admin\LocationController::class, 'index'])->name('admin.locations');
    Route::get('/view/{location:id}', [Admin\LocationController::class, 'view'])->name('admin.locations.view');

    Route::post('/', [Admin\LocationController::class, 'create']);
    Route::patch('/view/{location:id}', [Admin\LocationController::class, 'update']);
});

/*
|--------------------------------------------------------------------------
| Database Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/databases
|
*/
Route::group(['prefix' => 'databases'], function () {
    Route::get('/', [Admin\DatabaseController::class, 'index'])->name('admin.databases');
    Route::get('/view/{host:id}', [Admin\DatabaseController::class, 'view'])->name('admin.databases.view');

    Route::post('/', [Admin\DatabaseController::class, 'create']);
    Route::patch('/view/{host:id}', [Admin\DatabaseController::class, 'update']);
    Route::delete('/view/{host:id}', [Admin\DatabaseController::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| Settings Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/settings
|
*/
Route::group(['prefix' => 'settings'], function () {
    Route::get('/', [Admin\Settings\IndexController::class, 'index'])->name('admin.settings');
    Route::get('/mail', [Admin\Settings\MailController::class, 'index'])->name('admin.settings.mail');
    Route::get('/advanced', [Admin\Settings\AdvancedController::class, 'index'])->name('admin.settings.advanced');

    Route::post('/mail/test', [Admin\Settings\MailController::class, 'test'])->name('admin.settings.mail.test');

    Route::patch('/', [Admin\Settings\IndexController::class, 'update']);
    Route::patch('/mail', [Admin\Settings\MailController::class, 'update']);
    Route::patch('/advanced', [Admin\Settings\AdvancedController::class, 'update']);
});

/*
|--------------------------------------------------------------------------
| User Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/users
|
*/
Route::group(['prefix' => 'users'], function () {
    Route::get('/', [Admin\UserController::class, 'index'])->name('admin.users');
    Route::get('/accounts.json', [Admin\UserController::class, 'json'])->name('admin.users.json');
    Route::get('/new', [Admin\UserController::class, 'create'])->name('admin.users.new');
    Route::get('/view/{user:id}', [Admin\UserController::class, 'view'])->name('admin.users.view');

    Route::post('/new', [Admin\UserController::class, 'store']);

    Route::patch('/view/{user:id}', [Admin\UserController::class, 'update']);
    Route::delete('/view/{user:id}', [Admin\UserController::class, 'delete'])->name('admin.users.delete');
});

/*
|--------------------------------------------------------------------------
| Server Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/servers
|
*/
Route::group(['prefix' => 'servers'], function () {
    Route::get('/', [Admin\Servers\ServerController::class, 'index'])->name('admin.servers');
    Route::get('/new', [Admin\Servers\CreateServerController::class, 'index'])->name('admin.servers.new');
    Route::get('/view/{server:id}', [Admin\Servers\ServerViewController::class, 'index'])->name('admin.servers.view');

    Route::group(['middleware' => [ServerInstalled::class]], function () {
        Route::get('/view/{server:id}/details', [Admin\Servers\ServerViewController::class, 'details'])->name('admin.servers.view.details');
        Route::get('/view/{server:id}/build', [Admin\Servers\ServerViewController::class, 'build'])->name('admin.servers.view.build');
        Route::get('/view/{server:id}/startup', [Admin\Servers\ServerViewController::class, 'startup'])->name('admin.servers.view.startup');
        Route::get('/view/{server:id}/database', [Admin\Servers\ServerViewController::class, 'database'])->name('admin.servers.view.database');
        Route::get('/view/{server:id}/mounts', [Admin\Servers\ServerViewController::class, 'mounts'])->name('admin.servers.view.mounts');
    });

    Route::get('/view/{server:id}/manage', [Admin\Servers\ServerViewController::class, 'manage'])->name('admin.servers.view.manage');
    Route::get('/view/{server:id}/delete', [Admin\Servers\ServerViewController::class, 'delete'])->name('admin.servers.view.delete');

    Route::post('/new', [Admin\Servers\CreateServerController::class, 'store']);
    Route::post('/view/{server:id}/build', [Admin\ServersController::class, 'updateBuild']);
    Route::post('/view/{server:id}/startup', [Admin\ServersController::class, 'saveStartup']);
    Route::post('/view/{server:id}/database', [Admin\ServersController::class, 'newDatabase']);
    Route::post('/view/{server:id}/mounts', [Admin\ServersController::class, 'addMount'])->name('admin.servers.view.mounts.store');
    Route::post('/view/{server:id}/manage/toggle', [Admin\ServersController::class, 'toggleInstall'])->name('admin.servers.view.manage.toggle');
    Route::post('/view/{server:id}/manage/suspension', [Admin\ServersController::class, 'manageSuspension'])->name('admin.servers.view.manage.suspension');
    Route::post('/view/{server:id}/manage/reinstall', [Admin\ServersController::class, 'reinstallServer'])->name('admin.servers.view.manage.reinstall');
    Route::post('/view/{server:id}/manage/transfer', [Admin\Servers\ServerTransferController::class, 'transfer'])->name('admin.servers.view.manage.transfer');
    Route::post('/view/{server:id}/delete', [Admin\ServersController::class, 'delete']);

    Route::patch('/view/{server:id}/details', [Admin\ServersController::class, 'setDetails']);
    Route::patch('/view/{server:id}/database', [Admin\ServersController::class, 'resetDatabasePassword']);

    Route::delete('/view/{server:id}/database/{database:id}/delete', [Admin\ServersController::class, 'deleteDatabase'])->name('admin.servers.view.database.delete');
    Route::delete('/view/{server:id}/mounts/{mount:id}', [Admin\ServersController::class, 'deleteMount'])
        ->name('admin.servers.view.mounts.delete');
});

/*
|--------------------------------------------------------------------------
| Node Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/nodes
|
*/
Route::group(['prefix' => 'nodes'], function () {
    Route::get('/', [Admin\Nodes\NodeController::class, 'index'])->name('admin.nodes');
    Route::get('/new', [Admin\NodesController::class, 'create'])->name('admin.nodes.new');
    Route::get('/view/{node:id}', [Admin\Nodes\NodeViewController::class, 'index'])->name('admin.nodes.view');
    Route::get('/view/{node:id}/settings', [Admin\Nodes\NodeViewController::class, 'settings'])->name('admin.nodes.view.settings');
    Route::get('/view/{node:id}/configuration', [Admin\Nodes\NodeViewController::class, 'configuration'])->name('admin.nodes.view.configuration');
    Route::get('/view/{node:id}/allocation', [Admin\Nodes\NodeViewController::class, 'allocations'])->name('admin.nodes.view.allocation');
    Route::get('/view/{node:id}/servers', [Admin\Nodes\NodeViewController::class, 'servers'])->name('admin.nodes.view.servers');
    Route::get('/view/{node:id}/system-information', Admin\Nodes\SystemInformationController::class);

    Route::post('/new', [Admin\NodesController::class, 'store']);
    Route::post('/view/{node:id}/allocation', [Admin\NodesController::class, 'createAllocation']);
    Route::post('/view/{node:id}/allocation/remove', [Admin\NodesController::class, 'allocationRemoveBlock'])->name('admin.nodes.view.allocation.removeBlock');
    Route::post('/view/{node:id}/allocation/alias', [Admin\NodesController::class, 'allocationSetAlias'])->name('admin.nodes.view.allocation.setAlias');
    Route::post('/view/{node:id}/settings/token', Admin\NodeAutoDeployController::class)->name('admin.nodes.view.configuration.token');

    Route::patch('/view/{node:id}/settings', [Admin\NodesController::class, 'updateSettings']);

    Route::delete('/view/{node:id}/delete', [Admin\NodesController::class, 'delete'])->name('admin.nodes.view.delete');
    Route::delete('/view/{node:id}/allocation/remove/{allocation:id}', [Admin\NodesController::class, 'allocationRemoveSingle'])->name('admin.nodes.view.allocation.removeSingle');
    Route::delete('/view/{node:id}/allocations', [Admin\NodesController::class, 'allocationRemoveMultiple'])->name('admin.nodes.view.allocation.removeMultiple');
});

/*
|--------------------------------------------------------------------------
| Mount Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/mounts
|
*/
Route::group(['prefix' => 'mounts'], function () {
    Route::get('/', [Admin\MountController::class, 'index'])->name('admin.mounts');
    Route::get('/view/{mount:id}', [Admin\MountController::class, 'view'])->name('admin.mounts.view');

    Route::post('/', [Admin\MountController::class, 'create']);
    Route::post('/{mount:id}/eggs', [Admin\MountController::class, 'addEggs'])->name('admin.mounts.eggs');
    Route::post('/{mount:id}/nodes', [Admin\MountController::class, 'addNodes'])->name('admin.mounts.nodes');

    Route::patch('/view/{mount:id}', [Admin\MountController::class, 'update']);

    Route::delete('/{mount:id}/eggs/{egg_id}', [Admin\MountController::class, 'deleteEgg']);
    Route::delete('/{mount:id}/nodes/{node_id}', [Admin\MountController::class, 'deleteNode']);
});

/*
|--------------------------------------------------------------------------
| Nest Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/nests
|
*/
Route::group(['prefix' => 'nests'], function () {
    Route::get('/', [Admin\Nests\NestController::class, 'index'])->name('admin.nests');
    Route::get('/new', [Admin\Nests\NestController::class, 'create'])->name('admin.nests.new');
    Route::get('/view/{nest:id}', [Admin\Nests\NestController::class, 'view'])->name('admin.nests.view');
    Route::get('/egg/new', [Admin\Nests\EggController::class, 'create'])->name('admin.nests.egg.new');
    Route::get('/egg/{egg:id}', [Admin\Nests\EggController::class, 'view'])->name('admin.nests.egg.view');
    Route::get('/egg/{egg:id}/export', [Admin\Nests\EggShareController::class, 'export'])->name('admin.nests.egg.export');
    Route::get('/egg/{egg:id}/variables', [Admin\Nests\EggVariableController::class, 'view'])->name('admin.nests.egg.variables');
    Route::get('/egg/{egg:id}/scripts', [Admin\Nests\EggScriptController::class, 'index'])->name('admin.nests.egg.scripts');

    Route::post('/new', [Admin\Nests\NestController::class, 'store']);
    Route::post('/import', [Admin\Nests\EggShareController::class, 'import'])->name('admin.nests.egg.import');
    Route::post('/egg/new', [Admin\Nests\EggController::class, 'store']);
    Route::post('/egg/{egg:id}/variables', [Admin\Nests\EggVariableController::class, 'store']);

    Route::put('/egg/{egg:id}', [Admin\Nests\EggShareController::class, 'update']);

    Route::patch('/view/{nest:id}', [Admin\Nests\NestController::class, 'update']);
    Route::patch('/egg/{egg:id}', [Admin\Nests\EggController::class, 'update']);
    Route::patch('/egg/{egg:id}/scripts', [Admin\Nests\EggScriptController::class, 'update']);
    Route::patch('/egg/{egg:id}/variables/{variable:id}', [Admin\Nests\EggVariableController::class, 'update'])->name('admin.nests.egg.variables.edit');

    Route::delete('/view/{nest:id}', [Admin\Nests\NestController::class, 'destroy']);
    Route::delete('/egg/{egg:id}', [Admin\Nests\EggController::class, 'destroy']);
    Route::delete('/egg/{egg:id}/variables/{variable:id}', [Admin\Nests\EggVariableController::class, 'destroy']);
});
