<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Carbon\Carbon;
use Pterodactyl\Models\Node;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Repositories\Wings\DaemonSystemRepository;
use Pterodactyl\Contracts\Repository\NodeRepositoryInterface;

Route::get('/', [Base\IndexController::class, 'index'])->name('index')->fallback();
Route::get('/account', [Base\IndexController::class, 'index'])
    ->withoutMiddleware(RequireTwoFactorAuthentication::class)
    ->name('account');

Route::get('/locales/locale.json', Base\LocaleController::class)
    ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class])
    ->where('namespace', '.*');

Route::get('/api/public/status', function () {
    try {
        $settingsPath = base_path('resources/settings/status_nodes.json');
        $settings = file_exists($settingsPath) ? (json_decode(file_get_contents($settingsPath), true) ?? []) : [];
        $visibleNodeIds = $settings['nodes'] ?? [];
        $webhookUrl = $settings['webhook_url'] ?? null;
        $alertsEnabled = $settings['alerts_enabled'] ?? false;

        $nodes = \Pterodactyl\Models\Node::query()
            ->whereIn('id', $visibleNodeIds)
            ->with('location')
            ->withCount('servers')
            ->get()
            ->map(function (\Pterodactyl\Models\Node $node) use ($webhookUrl, $alertsEnabled) {
                // Add v3 suffix to force refresh
                $data = \Illuminate\Support\Facades\Cache::remember('node_status_v3_' . $node->id, 30, function () use ($node, $alertsEnabled, $webhookUrl) {
                    $result = [
                        'status' => 'down',
                        'last_error' => null,
                        'cpu_cores' => 0,
                        'wings_version' => 'Unknown',
                        'load' => null,
                        'network_rx' => 0,
                        'network_tx' => 0,
                        'disk_used' => 0,
                        'disk_total' => 0,
                        'mem_percent' => 0,
                        'disk_percent' => 0,
                        'servers_online' => 0,
                        'servers_offline' => $node->servers_count ?? 0,
                        'os' => 'Unknown',
                        'kernel' => 'Unknown',
                        'system_uptime' => null,
                        'memory_total' => 0,
                    ];

                    $json = [];
                    try {
                        // Use direct HTTP request with SSL bypass and longer timeout for reliability
                        // This fixes issues where node appears offline due to SSL/timeout issues
                        $response = Http::withHeaders([
                            'Authorization' => 'Bearer ' . $node->getDecryptedKey(),
                            'Accept' => 'application/json',
                        ])->timeout(5)->withoutVerifying()->get($node->getConnectionAddress() . '/api/system');

                        if ($response->ok()) {
                            $json = $response->json() ?? [];
                            $result['status'] = 'up';
                            
                            // Log success for debugging (can be removed later)
                            Log::info("Node Status Debug: Node {$node->id} is UP");
                            $result['cpu_cores'] = $json['cpu_count'] ?? $json['cores'] ?? 0;
                            $result['wings_version'] = $json['version'] ?? 'Unknown';
                            $result['load'] = $json['load'] ?? $json['system_load'] ?? null;
                            
                            // Enhanced Disk Parsing
                            $diskData = is_array($json['disk'] ?? null) ? $json['disk'] : [];
                            $result['disk_total'] = (float)($diskData['total'] ?? $diskData['total_bytes'] ?? $json['disk_total'] ?? $json['total_disk'] ?? 0);
                            $result['disk_used'] = (float)($diskData['used'] ?? $diskData['used_bytes'] ?? $json['disk_used'] ?? $json['used_disk'] ?? 0);

                            if ($result['disk_total'] <= 0) {
                                $result['disk_total'] = ($node->disk > 0) ? ((float)$node->disk * 1024 * 1024) : 0;
                            }

                            // Memory Parsing - Extremely aggressive fallbacks
                            $memData = is_array($json['memory'] ?? null) ? $json['memory'] : [];
                            $result['memory_total'] = (float)($memData['total'] ?? $memData['total_bytes'] ?? $memData['total_memory'] ?? 
                                                     $json['memory_total'] ?? $json['total_memory'] ?? $json['mem_total'] ?? 
                                                     $json['memory_limit'] ?? (is_numeric($json['memory'] ?? null) ? $json['memory'] : 0));
                            
                            $result['memory_used'] = (float)($memData['used'] ?? $memData['used_bytes'] ?? $memData['current'] ?? 
                                                     (isset($memData['total'], $memData['free']) ? ($memData['total'] - $memData['free']) : 0) ??
                                                     $json['memory_used'] ?? $json['used_memory'] ?? $json['mem_used'] ?? 0);
                            
                            // Check if node->memory (configured limit) is usable as a final fallback if 0
                            if ($result['memory_total'] <= 0) {
                                // Fallback to node's configured capacity (megabytes converted to bytes)
                                $result['memory_total'] = ($node->memory > 0) ? ((float)$node->memory * 1024 * 1024) : 0;
                            }
                            
                            // Real hardware memory usage percent
                            $result['hardware_mem_percent'] = ($result['memory_total'] > 0) ? (int)round(($result['memory_used'] / $result['memory_total']) * 100) : 0;
                            $result['hardware_disk_percent'] = ($result['disk_total'] > 0) ? (int)round(($result['disk_used'] / $result['disk_total']) * 100) : 0;
                            
                            // Enhanced Network Parsing & Rate Calculation
                            $netData = $json['network'] ?? [];
                            $rxBytes = $netData['rx'] ?? $netData['rx_bytes'] ?? $json['rx'] ?? $json['rx_bytes'] ?? $json['network_rx_bytes'] ?? 0;
                            $txBytes = $netData['tx'] ?? $netData['tx_bytes'] ?? $json['tx'] ?? $json['tx_bytes'] ?? $json['network_tx_bytes'] ?? 0;
                            
                            $cacheKeyNet = 'node_net_prev_' . $node->id;
                            $prevNet = \Illuminate\Support\Facades\Cache::get($cacheKeyNet);
                            $now = microtime(true);
                            
                            if ($prevNet && isset($prevNet['time']) && $now > $prevNet['time']) {
                                $timeDiff = $now - $prevNet['time'];
                                // Calculate bytes per second
                                $result['network_rx'] = max(0, ($rxBytes - $prevNet['rx']) / $timeDiff);
                                $result['network_tx'] = max(0, ($txBytes - $prevNet['tx']) / $timeDiff);
                            } else {
                                $result['network_rx'] = 0;
                                $result['network_tx'] = 0;
                            }
                            
                            \Illuminate\Support\Facades\Cache::put($cacheKeyNet, [
                                'rx' => $rxBytes,
                                'tx' => $txBytes,
                                'time' => $now
                            ], 60);
                        }
                    } catch (\Exception $e) {
                        $result['status'] = 'down';
                        $result['last_error'] = $e->getMessage();
                        Log::error("Node Status Error: Node {$node->id} failed with error: " . $e->getMessage());
                    }

                    // Calculate totals using standard Eloquent sum() - Avoid selectRaw as per user request
                    $total_mem_assigned = (int) $node->servers()->sum('memory');
                    $total_disk_assigned = (int) $node->servers()->sum('disk');

                    $result['mem_percent'] = $node->memory > 0 ? round(($total_mem_assigned / $node->memory) * 100) : 0;
                    
                    // Server counts - In v1.x, 'status' is NULL for active servers. 'suspended' column might be missing.
                    $result['servers_online'] = (int) $node->servers()->whereNull('status')->count();
                    $result['servers_offline'] = max(0, ($node->servers_count ?? 0) - $result['servers_online']);

                    // System metadata
                    $result['os'] = $json['os'] ?? $json['operating_system'] ?? $json['os_version'] ?? 'Unknown';
                    $result['kernel'] = $json['kernel'] ?? $json['kernel_version'] ?? $json['kernel_release'] ?? 'Unknown';
                    $result['system_uptime'] = $json['uptime'] ?? $json['system_uptime'] ?? $json['up_time'] ?? $json['uptime_seconds'] ?? null;

                    // Real memory usage percent if available, otherwise fallback to allocation
                    if (($result['memory_total'] ?? 0) > 0 && ($result['memory_used'] ?? 0) > 0) {
                        $result['mem_percent'] = (int)round(($result['memory_used'] / $result['memory_total']) * 100);
                    } else {
                        $result['mem_percent'] = $node->memory > 0 ? (int)round(($total_mem_assigned / $node->memory) * 100) : 0;
                    }

                    // Real disk usage percent if available, otherwise fallback to allocation
                    if (($result['disk_total'] ?? 0) > 0 && ($result['disk_used'] ?? 0) > 0) {
                        $result['disk_percent'] = (int)round(($result['disk_used'] / $result['disk_total']) * 100);
                    } else {
                        $result['disk_percent'] = $node->disk > 0 ? (int)round(($total_disk_assigned / $node->disk) * 100) : 0;
                    }

                    // Webhook logic
                    if ($alertsEnabled && !empty($webhookUrl)) {
                        $cacheKey = 'last_status_node_' . $node->id;
                        $lastStatus = \Illuminate\Support\Facades\Cache::get($cacheKey, 'up'); // Default up to avoid alert on first boot if actually up

                        if ($lastStatus !== 'down' && $result['status'] === 'down' && !$node->maintenance_mode) {
                            // Status changed to down
                            try {
                                \Illuminate\Support\Facades\Http::post($webhookUrl, [
                                    'username' => 'Better Pterodactyl Monitor',
                                    'embeds' => [[
                                        'title' => '🚨 節點斷線通知 (Node Offline)',
                                        'description' => "節點 **{$node->name}** 目前處於離線狀態，請儘速檢查！",
                                        'color' => 15158332,
                                        'fields' => [
                                            ['name' => '節點名稱', 'value' => $node->name, 'inline' => true],
                                            ['name' => '位置', 'value' => optional($node->location)->short ?? 'Unknown', 'inline' => true],
                                            ['name' => 'ID', 'value' => (string)$node->id, 'inline' => true],
                                        ],
                                        'timestamp' => Carbon::now()->toIso8601String(),
                                    ]]
                                ]);
                            } catch (\Exception $e) {
                                // Ignore webhook failure
                            }
                        } elseif ($lastStatus === 'down' && $result['status'] === 'up') {
                            // Status changed to up
                            try {
                                \Illuminate\Support\Facades\Http::post($webhookUrl, [
                                    'username' => 'Better Pterodactyl Monitor',
                                    'embeds' => [[
                                        'title' => '✅ 節點恢復通知 (Node Online)',
                                        'description' => "節點 **{$node->name}** 已恢復上線！",
                                        'color' => 3066993,
                                        'fields' => [
                                            ['name' => '節點名稱', 'value' => $node->name, 'inline' => true],
                                            ['name' => '位置', 'value' => optional($node->location)->short ?? 'Unknown', 'inline' => true],
                                            ['name' => 'ID', 'value' => (string)$node->id, 'inline' => true],
                                        ],
                                        'timestamp' => Carbon::now()->toIso8601String(),
                                    ]]
                                ]);
                            } catch (\Exception $e) {
                                // Ignore webhook failure
                            }
                        }

                        \Illuminate\Support\Facades\Cache::forever($cacheKey, $result['status']);
                    }

                    return $result;
                });

                return [
                    'id' => $node->id,
                    'name' => $node->name,
                    'location' => optional($node->location)->short ?? 'Unknown',
                    'status' => $node->maintenance_mode ? 'maintenance' : ($data['status'] ?? 'down'),
                    'memory' => $node->memory,
                    'disk' => $node->disk,
                    'servers_count' => $node->servers_count,
                    'cpu_cores' => $data['cpu_cores'] ?? 0,
                    'wings_version' => $data['wings_version'] ?? 'Unknown',
                    'mem_percent' => $data['mem_percent'] ?? 0,
                    'disk_percent' => $data['disk_percent'] ?? 0,
                    'servers_online' => $data['servers_online'] ?? 0,
                    'servers_offline' => $data['servers_offline'] ?? 0,
                    'os' => $data['os'] ?? 'Unknown',
                    'kernel' => $data['kernel'] ?? 'Unknown',
                    'uptime' => $data['system_uptime'] ?? null,
                    'load' => $data['load'] ?? null,
                    'network_rx' => $data['network_rx'] ?? null,
                    'network_tx' => $data['network_tx'] ?? null,
                    'disk_used' => $data['disk_used'] ?? null,
                    'disk_total' => $data['disk_total'] ?? null,
                    'memory_total' => $data['memory_total'] ?? 0,
                    'memory_used' => $data['memory_used'] ?? 0,
                    'hw_mem_percent' => $data['hardware_mem_percent'] ?? 0,
                    'hw_disk_percent' => $data['hardware_disk_percent'] ?? 0,
                    'debug_error' => $data['last_error'] ?? null,
                ];
            });

        return $nodes;
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('Status API Error: ' . $e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);
        return response()->json(['error' => 'Internal Server Error', 'message' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()], 500);
    }
})->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class]);

Route::get('/api/client/plugins', function () {
    if (!class_exists('BetterPterodactyl\Plugins\DB')) {
        require_once base_path('resources/settings/plugins/helpers.php');
    }
    $plugins = \BetterPterodactyl\Plugins\DB::getPlugins();
    $active = array_filter($plugins, function($p) { return (bool)$p['enabled']; });
    
    $grouped = [];
    foreach ($active as $p) {
        $slot = $p['slot'];
        if (!isset($grouped[$slot])) $grouped[$slot] = [];
        $p['config'] = json_decode($p['config'], true);
        $grouped[$slot][] = $p;
    }
    
    return response()->json($grouped);
});

Route::get('/api/public/announcements', function () {
    $path = base_path('resources/settings/announcements.json');
    if (!file_exists($path)) {
        return response()->json([]);
    }
    return response()->file($path, ['Content-Type' => 'application/json']);
})->withoutMiddleware(['auth', \Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication::class]);

// Economy external API - explicitly registered without auth to allow Bearer token access from external scripts
Route::middleware(['throttle:60,1', \Illuminate\Routing\Middleware\SubstituteBindings::class])
    ->withoutMiddleware([
        'auth', 
        'web',
        \Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication::class,
        \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\Session\Middleware\AuthenticateSession::class,
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Pterodactyl\Http\Middleware\LanguageMiddleware::class,
        \Pterodactyl\Http\Middleware\SetSecurityHeaders::class,
    ])
    ->group(function () {
        require_once __DIR__ . '/api-economy.php';
    });

// Discord routes need sessions for authentication to work
Route::middleware(['web', 'throttle:60,1', \Illuminate\Routing\Middleware\SubstituteBindings::class])
    ->group(function () {
        require_once __DIR__ . '/api-discord.php';
    });

Route::get('/{react}', [Base\IndexController::class, 'index'])
    ->where('react', '^(?!(\/)?(api|auth|admin|daemon)).+');

// Clean Plugin Extension Routes (Publicly Accessible)
// These are placed in base.php to bypass the global api-client auth middleware
Route::any('/api/client/extensions/{path}', function (\Illuminate\Http\Request $request, $path) {
    if (!class_exists('BetterPterodactyl\Plugins\HookService')) {
        require_once base_path('resources/settings/plugins/helpers.php');
        require_once base_path('resources/settings/plugins/HookService.php');
    }
    $userId = $request->user() ? $request->user()->id : null;
    return \BetterPterodactyl\Plugins\HookService::matchAndDispatch($path, $userId, $request->all());
})->where('path', '.*')->withoutMiddleware([
    'auth', 
    'auth:api', 
    \Illuminate\Auth\Middleware\Authenticate::class,
    \Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication::class,
    \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
]);

Route::any('/api/client/servers/{server}/extensions/{path}', function (\Illuminate\Http\Request $request, $server, $path) {
    if (!class_exists('BetterPterodactyl\Plugins\HookService')) {
        require_once base_path('resources/settings/plugins/helpers.php');
        require_once base_path('resources/settings/plugins/HookService.php');
    }
    $userId = $request->user() ? $request->user()->id : null;
    return \BetterPterodactyl\Plugins\HookService::matchAndDispatch($path, $userId, $request->all(), $server);
})->where('path', '.*')->withoutMiddleware([
    'auth', 
    'auth:api', 
    \Illuminate\Auth\Middleware\Authenticate::class,
    \Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication::class,
    \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
]);
