<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use BetterPterodactyl\Economy\DB;

if (!class_exists('BetterPterodactyl\Economy\DB')) {
    require_once base_path('resources/settings/economy/helpers.php');
}

/*
|--------------------------------------------------------------------------
| Application Economy External API
|--------------------------------------------------------------------------
|
| Endpoint: /api/external/economy
|
| This file contains the endpoints for third-party scripts/tools (e.g. Discord Bot)
| to manage user economies, protected by an API Token configured in the
| Pterodactyl Admin Panel.
|
*/

Route::prefix('/api/external/economy')->group(function () {
    
    // Middleware-like function to validate the token
    $validateRequest = function (Request $request) {
        $settings = DB::getSettings();
        $apiTokens = $settings['api_tokens'] ?? [];
        
        if (empty($apiTokens)) {
            \Log::warning('Economy API: No tokens configured.');
            return response()->json(['success' => false, 'error' => 'No Economy API Tokens are configured.'], 403);
        }

        $bearerToken = $request->bearerToken();
        
        // Manual fallback if bearerToken() fails (common in some middleware setups)
        if (!$bearerToken) {
            $authHeader = $request->header('Authorization', '');
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $bearerToken = $matches[1];
            }
        }

        if (!$bearerToken) {
            return response()->json(['success' => false, 'error' => 'Missing Bearer token.'], 401);
        }

        // Check if the bearer token matches any of our configured tokens
        $found = false;
        foreach ($apiTokens as $tokenData) {
            if ($tokenData['token'] === $bearerToken) {
                $found = true;
                break;
            }
        }

        if (!$found) {
            \Log::info('Economy API: Invalid token attempt.');
            return response()->json(['success' => false, 'error' => 'Unauthorized or invalid API token.'], 401);
        }

        return null; // OK
    };

    /**
     * Get User Economy Balance
     * GET /api/external/economy/users/{identifier}
     */
    Route::get('/users/{identifier}', function (Request $request, $identifier) use ($validateRequest) {
        if ($err = $validateRequest($request)) return $err;

        $user = User::where('email', $identifier)->orWhere('id', $identifier)->orWhere('username', $identifier)->first();
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found.'], 404);

        $record = DB::getUser($user->id);
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
            ],
            'economy' => [
                'points' => (float) $record['points'],
                'resources' => [
                    'cpu' => (int) $record['extra_cpu'],
                    'ram' => (int) $record['extra_memory'],
                    'disk' => (int) $record['extra_disk'],
                    'backups' => (int) $record['extra_backups'],
                    'allocations' => (int) $record['extra_allocations'],
                    'slots' => (int) $record['extra_slots'],
                ]
            ]
        ]);
    });

    /**
     * Add or Remove Economy Points / Resources
     * POST /api/external/economy/users/{identifier}/add
     */
    Route::post('/users/{identifier}/add', function (Request $request, $identifier) use ($validateRequest) {
        \Log::info('Economy API: Add request for ' . $identifier, $request->all());
        if ($err = $validateRequest($request)) return $err;

        $user = User::where('email', $identifier)->orWhere('id', $identifier)->orWhere('username', $identifier)->first();
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found.'], 404);

        $validated = $request->validate([
            'points' => 'nullable|numeric',
            'amount' => 'nullable|numeric',
            'cpu' => 'nullable|numeric',
            'ram' => 'nullable|numeric',
            'disk' => 'nullable|numeric',
            'backups' => 'nullable|numeric',
            'allocations' => 'nullable|numeric',
            'slots' => 'nullable|numeric',
            'reason' => 'nullable|string',
        ]);

        $reason = $validated['reason'] ?? 'External API adjustment';
        $points = $validated['points'] ?? $validated['amount'] ?? null;

        if ($points !== null) {
            DB::updatePoints($user->id, (float) $points);
            DB::logTransaction($user->id, 'external_api_add', (float) $points, ['reason' => $reason]);
        }
        
        if (isset($validated['cpu'])) DB::addResource($user->id, 'cpu', (int) $validated['cpu']);
        if (isset($validated['ram'])) DB::addResource($user->id, 'ram', (int) $validated['ram']);
        if (isset($validated['disk'])) DB::addResource($user->id, 'disk', (int) $validated['disk']);
        if (isset($validated['backups'])) DB::addResource($user->id, 'backups', (int) $validated['backups']);
        if (isset($validated['allocations'])) DB::addResource($user->id, 'allocations', (int) $validated['allocations']);
        if (isset($validated['slots'])) DB::addResource($user->id, 'slots', (int) $validated['slots']);

        $record = DB::getUser($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Successfully updated user economy.',
            'economy' => [
                'points' => (float) $record['points'],
                'resources' => [
                    'cpu' => (int) $record['extra_cpu'],
                    'ram' => (int) $record['extra_memory'],
                    'disk' => (int) $record['extra_disk'],
                    'backups' => (int) $record['extra_backups'],
                    'allocations' => (int) $record['extra_allocations'],
                    'slots' => (int) $record['extra_slots'],
                ]
            ]
        ]);
    });

    /**
     * Set Economy Points / Resources Exactly
     * POST /api/external/economy/users/{identifier}/set
     */
    Route::post('/users/{identifier}/set', function (Request $request, $identifier) use ($validateRequest) {
        \Log::info('Economy API: Set request for ' . $identifier, $request->all());
        if ($err = $validateRequest($request)) return $err;

        $user = User::where('email', $identifier)->orWhere('id', $identifier)->orWhere('username', $identifier)->first();
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found.'], 404);

        $validated = $request->validate([
            'points' => 'nullable|numeric',
            'amount' => 'nullable|numeric',
            'cpu' => 'nullable|numeric',
            'ram' => 'nullable|numeric',
            'disk' => 'nullable|numeric',
            'backups' => 'nullable|numeric',
            'allocations' => 'nullable|numeric',
            'slots' => 'nullable|numeric',
            'reason' => 'nullable|string',
        ]);

        // Helper string to fetch current to calculate diff for logging
        $record = DB::getUser($user->id);

        $reason = $validated['reason'] ?? 'External API set';
        $points = $validated['points'] ?? $validated['amount'] ?? null;

        if ($points !== null) {
            $diff = (float) $points - (float) $record['points'];
            DB::updatePoints($user->id, (float) $diff);
            DB::logTransaction($user->id, 'external_api_set', (float) $diff, ['reason' => $reason, 'new_total' => $points]);
        }
        
        if (isset($validated['cpu'])) DB::addResource($user->id, 'cpu', (int) $validated['cpu'] - (int) $record['extra_cpu']);
        if (isset($validated['ram'])) DB::addResource($user->id, 'ram', (int) $validated['ram'] - (int) $record['extra_memory']);
        if (isset($validated['disk'])) DB::addResource($user->id, 'disk', (int) $validated['disk'] - (int) $record['extra_disk']);
        if (isset($validated['backups'])) DB::addResource($user->id, 'backups', (int) $validated['backups'] - (int) $record['extra_backups']);
        if (isset($validated['allocations'])) DB::addResource($user->id, 'allocations', (int) $validated['allocations'] - (int) $record['extra_allocations']);
        if (isset($validated['slots'])) DB::addResource($user->id, 'slots', (int) $validated['slots'] - (int) $record['extra_slots']);

        $updatedRecord = DB::getUser($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Successfully set user economy.',
            'economy' => [
                'points' => (float) $updatedRecord['points'],
                'resources' => [
                    'cpu' => (int) $updatedRecord['extra_cpu'],
                    'ram' => (int) $updatedRecord['extra_memory'],
                    'disk' => (int) $updatedRecord['extra_disk'],
                    'backups' => (int) $updatedRecord['extra_backups'],
                    'allocations' => (int) $updatedRecord['extra_allocations'],
                    'slots' => (int) $updatedRecord['extra_slots'],
                ]
            ]
        ]);
    });

    /**
     * Process Billing Cycle (Cron Trigger)
     * POST /api/external/economy/billing/process
     */
    Route::post('/billing/process', function (Request $request) use ($validateRequest) {
        if ($err = $validateRequest($request)) return $err;

        $settings = DB::getSettings();
        if (!($settings['billing']['enabled'] ?? false)) {
            return response()->json(['success' => false, 'error' => 'Billing system is disabled.'], 400);
        }

        $results = [
            'charged' => 0,
            'overdue' => 0,
            'suspended' => 0,
            'terminated' => 0,
            'errors' => []
        ];

        // 1. Process regular charges
        $toCharge = DB::getServersScheduledForBilling();
        foreach ($toCharge as $row) {
            try {
                $res = \BetterPterodactyl\Economy\BillingService::processCharge($row['server_id']);
                if ($res['success']) {
                    $results['charged']++;
                } else {
                    $results['overdue']++;
                }
            } catch (\Exception $e) {
                $results['errors'][] = "Charge error (Server {$row['server_id']}): " . $e->getMessage();
            }
        }

        // 2. Process overdue servers (grace period expired)
        $overdue = DB::getOverdueServers();
        foreach ($overdue as $row) {
            try {
                \BetterPterodactyl\Economy\BillingService::handleOverdue($row['server_id']);
                $results['suspended']++;
            } catch (\Exception $e) {
                $results['errors'][] = "Suspension error (Server {$row['server_id']}): " . $e->getMessage();
            }
        }

        // 3. Process pending deletions
        $deleteDays = (int) ($settings['billing']['pending_delete_days'] ?? 7);
        $toDelete = DB::getPendingDeleteServers($deleteDays);
        foreach ($toDelete as $row) {
            try {
                \BetterPterodactyl\Economy\BillingService::handlePendingDeletion($row['server_id']);
                $results['terminated']++;
            } catch (\Exception $e) {
                $results['errors'][] = "Deletion error (Server {$row['server_id']}): " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'results' => $results
        ]);
    });

});

