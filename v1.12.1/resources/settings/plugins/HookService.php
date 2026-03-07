<?php

namespace BetterPterodactyl\Plugins;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;

class HookService {
    /**
     * Dispatch a hook request to a plugin's backend service.
     */
    public static function dispatch($pluginId, $action, $userId, $payload = [], $serverUuid = null, $pluginData = null) {
        $plugin = $pluginData ?? DB::getPlugin($pluginId);
        
        if (!$plugin || !$plugin['enabled']) {
            return response()->json(['error' => 'Plugin not found or disabled'], 404);
        }

        $config = is_array($plugin['config']) ? $plugin['config'] : json_decode($plugin['config'], true);
        $hooks = $config['backend_hooks'] ?? [];

        if (!isset($hooks[$action])) {
            return response()->json(['error' => "Hook '$action' not defined for this plugin"], 400);
        }

        $hook = $hooks[$action];
        $type = $hook['type'] ?? 'php';

        if ($type === 'php') {
            return self::handlePHP($hook, $userId, $payload, $serverUuid, $config);
        }

        return response()->json(['error' => 'Unsupported hook type'], 400);
    }

    /**
     * Map a custom URL path to a plugin hook.
     */
    public static function matchAndDispatch($path, $userId, $payload = [], $serverUuid = null) {
        $plugins = DB::getPlugins();
        $providedToken = request()->header('X-Plugin-Token') ?? request()->query('token');

        foreach ($plugins as $plugin) {
            if (!$plugin['enabled']) continue;

            $config = json_decode($plugin['config'], true);
            $customRoutes = $config['custom_routes'] ?? [];

            foreach ($customRoutes as $routePath => $action) {
                $normPath = trim($path, '/');
                $normRoute = trim($routePath, '/');

                if ($normPath === $normRoute) {
                    // Isolation: Validate security_token ONLY against the current plugin's config
                    $variables = $config['variables'] ?? [];
                    $securityToken = $variables['security_token']['value'] ?? null;

                    // If a token is defined, it MUST match. This does NOT affect other plugins or original API.
                    if ($securityToken && $providedToken !== $securityToken) {
                        return response()->json(['error' => 'Invalid or Missing Plugin Token (Use X-Plugin-Token header)'], 401);
                    }

                    // Pass the already fetched config to avoid double DB lookup
                    $plugin['config'] = $config; 
                    return self::dispatch($plugin['id'], $action, $userId, $payload, $serverUuid, $plugin);
                }
            }
        }

        return response()->json(['error' => 'Extension route not found'], 404);
    }

    /**
     * Handle PHP hooks by executing raw PHP code directly.
     */
    private static function handlePHP($hook, $userId, $payload, $serverUuid, $pluginConfig = []) {
        $code = $hook['code'] ?? null;
        if (!$code) {
            return response()->json(['error' => 'Missing PHP code configuration'], 500);
        }

        // Prepare context variables for the script
        $context = [
            'userId' => $userId,
            'payload' => $payload,
            'server' => null,
            'user' => $userId ? User::find($userId) : null,
            'variables' => $pluginConfig['variables'] ?? [],
        ];

        if ($serverUuid) {
            $context['server'] = Server::where('uuid', $serverUuid)->orWhere('uuidShort', $serverUuid)->first();
        }

        try {
            $executor = function($code, $ctx) {
                $userId = $ctx['userId'];
                $payload = $ctx['payload'];
                $server = $ctx['server'];
                $user = $ctx['user'];
                $variables = $ctx['variables'];

                return eval($code);
            };

            $result = $executor($code, $context);

            if ($result instanceof \Illuminate\Http\JsonResponse || $result instanceof \Illuminate\Http\Response) {
                return $result;
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'PHP Hook Execution Failed',
                'details' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}
