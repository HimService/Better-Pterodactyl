<?php

namespace BetterPterodactyl\Economy;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use BetterPterodactyl\Economy\DB;

class BillingService {

    /**
     * Calculate the periodic price for a server based on its resource limits.
     * Formula: price = (base_price + (RAM * ram_coeff) + (CPU * cpu_coeff) + (DISK * disk_coeff)) * cycle_multiplier
     */
    public static function calculatePrice(Server $server, $cycle = 'monthly') {
        $settings = DB::getSettings();
        $billing = $settings['billing'] ?? [];
        
        if (!($billing['enabled'] ?? false)) {
            return 0;
        }

        $basePrice = (float) ($billing['base_price'] ?? 0);
        $cpuCoeff = (float) ($billing['cpu_coeff'] ?? 0);
        $ramCoeff = (float) ($billing['ram_coeff'] ?? 0);
        $diskCoeff = (float) ($billing['disk_coeff'] ?? 0);

        $price = $basePrice;
        $price += ($server->cpu * $cpuCoeff);
        $price += ($server->memory * $ramCoeff);
        $price += ($server->disk * $diskCoeff);

        // Apply cycle multiplier (assuming coefficients are per month)
        switch ($cycle) {
            case 'hourly': 
                $multiplier = (float) ($billing['hourly_multiplier'] ?? (1 / 720)); 
                break;
            case 'daily':  
                $multiplier = (float) ($billing['daily_multiplier'] ?? (1 / 30)); 
                break;
            case 'weekly': 
                $multiplier = (float) ($billing['weekly_multiplier'] ?? 0.25); 
                break;
            case 'monthly':
            default:       
                $multiplier = (float) ($billing['monthly_multiplier'] ?? 1.0); 
                break;
        }

        return round($price * $multiplier, 4);
    }

    /**
     * Process a billing cycle for a specific server.
     */
    public static function processCharge($serverId) {
        $server = Server::find($serverId);
        if (!$server) {
            $db = DB::getConnection();
            $stmt = $db->prepare("DELETE FROM server_billing WHERE server_id = ?");
            $stmt->execute([$serverId]);
            Log::info("Billing: Cleaned up ghost billing record for deleted server $serverId");
            return ['success' => false, 'error' => 'Server not found'];
        }

        $billing = DB::getServerBilling($serverId);
        if (!$billing) {
            // Initialize billing record if not exists
            $price = self::calculatePrice($server);
            DB::createServerBilling($serverId, [
                'price' => $price,
                'status' => 'active',
                'next_billing_at' => date('Y-m-d H:i:s', strtotime('+1 month')), // Default monthly
            ]);
            $billing = DB::getServerBilling($serverId);
        }

        $userRecord = DB::getUser($server->owner_id);
        
        // Dynamically calculate the real-time price based on current admin settings
        $price = self::calculatePrice($server, $billing['billing_cycle'] ?? 'monthly');

        if ($userRecord['points'] >= $price) {
            // Payment success
            DB::updatePoints($server->owner_id, -$price);
            
            // Update the next billing date. 
            // If the server is already active and the next billing time is in the future, we extend from that time (allowing stacking).
            // If the server is overdue or suspended (next billing in the past), we start from NOW to avoid catching up old cycles.
            $currentNext = !empty($billing['next_billing_at']) ? Carbon::parse($billing['next_billing_at']) : Carbon::now();
            $baseDate = ($currentNext->isFuture() && ($billing['status'] ?? '') === 'active') ? $currentNext : Carbon::now();
            $nextDate = self::calculateNextDate($billing['billing_cycle'] ?? 'monthly', $baseDate);
            
            // If the server was previously suspended, we must unsuspend it natively in Pterodactyl
            if (($billing['status'] ?? '') === 'suspended') {
                try {
                    if (class_exists(\Pterodactyl\Services\Servers\SuspensionService::class)) {
                        $service = app(\Pterodactyl\Services\Servers\SuspensionService::class);
                        $service->toggle($server, 'unsuspend');
                    } else {
                        $server->update(['suspended' => 0]);
                    }
                    // Optional: You could log/dispatch an unsuspend webhook here if needed
                } catch (\Exception $e) {
                    Log::error("Billing: Failed to unsuspend server $serverId after renewal: " . $e->getMessage());
                }
            }

            DB::updateServerBilling($serverId, [
                'status' => 'active',
                'next_billing_at' => $nextDate,
                'grace_period_ends_at' => null,
            ]);

            DB::logBillingTransaction($serverId, $server->owner_id, 'charge_success', $price, $billing['status'], 'active');
            self::dispatchWebhook('billing.success', $server, ['amount' => $price, 'next_billing_at' => $nextDate]);
            
            return ['success' => true];
        } else {
            // Payment failed
            $settings = DB::getSettings();
            $graceHours = (int) ($settings['billing']['grace_period_hours'] ?? 24);
            $graceEnds = date('Y-m-d H:i:s', strtotime("+$graceHours hours"));

            $updateData = ['status' => 'overdue'];
            
            // Only set the deadline and send the webhook if this is the FIRST time failing
            if (($billing['status'] ?? 'active') === 'active') {
                $updateData['grace_period_ends_at'] = $graceEnds;
                DB::updateServerBilling($serverId, $updateData);
                
                DB::logBillingTransaction($serverId, $server->owner_id, 'charge_failed', $price, $billing['status'], 'overdue');
                self::dispatchWebhook('billing.failed', $server, ['amount' => $price, 'grace_period_ends_at' => $graceEnds]);
            } else {
                DB::updateServerBilling($serverId, $updateData);
            }

            return ['success' => false, 'error' => 'Insufficient balance'];
        }
    }

    /**
     * Handle grace period expiration and suspend server.
     */
    public static function handleOverdue($serverId) {
        $server = Server::find($serverId);
        if (!$server) {
            $db = DB::getConnection();
            $stmt = $db->prepare("DELETE FROM server_billing WHERE server_id = ?");
            $stmt->execute([$serverId]);
            return;
        }

        $billing = DB::getServerBilling($serverId);
        if ($billing['status'] !== 'overdue') return;

        // Suspend server via Pterodactyl internal logic
        // We'll use the model's suspend attribute and save it, or use a service if we can find it.
        // In Pterodactyl 1.x, $server->suspended = true; $server->save(); is basic.
        // But better to use the proper service if possible.
        try {
            // Check if Pterodactyl SuspensionService is available
            if (class_exists(\Pterodactyl\Services\Servers\SuspensionService::class)) {
                $service = app(\Pterodactyl\Services\Servers\SuspensionService::class);
                $service->toggle($server, 'suspend');
            } else {
                $server->update(['suspended' => 1]);
            }

            DB::updateServerBilling($serverId, ['status' => 'suspended']);
            DB::logBillingTransaction($serverId, $server->owner_id, 'server_suspended', 0, 'overdue', 'suspended');
            self::dispatchWebhook('server.suspended', $server);
        } catch (\Exception $e) {
            Log::error("Billing: Failed to suspend server $serverId: " . $e->getMessage());
        }
    }

    /**
     * Handle cleanup of terminated servers.
     */
    public static function handlePendingDeletion($serverId) {
        $server = Server::find($serverId);
        if (!$server) {
            $db = DB::getConnection();
            $stmt = $db->prepare("DELETE FROM server_billing WHERE server_id = ?");
            $stmt->execute([$serverId]);
            return;
        }

        try {
            // In Pterodactyl, deletion is complex. We'll use the ServerDeletionService if available.
            if (class_exists(\Pterodactyl\Services\Servers\ServerDeletionService::class)) {
                $service = app(\Pterodactyl\Services\Servers\ServerDeletionService::class);
                $service->handle($server, true); // true for "keep on wings" or "force"? Usually handle($server)
            } else {
                // Fallback to basic delete (might not clean up Wings properly)
                $server->delete();
            }

            DB::updateServerBilling($serverId, ['status' => 'terminated']);
            DB::logBillingTransaction($serverId, $server->owner_id, 'server_deleted', 0, 'suspended', 'terminated');
            self::dispatchWebhook('server.deleted', $server);
        } catch (\Exception $e) {
            Log::error("Billing: Failed to delete server $serverId: " . $e->getMessage());
        }
    }

    /**
     * Calculate the next billing date based on cycle.
     */
    public static function calculateNextDate($cycle, $currentDate = null) {
        $date = $currentDate ? Carbon::parse($currentDate) : Carbon::now();
        
        switch ($cycle) {
            case 'hourly': return $date->addHour()->toDateTimeString();
            case 'daily': return $date->addDay()->toDateTimeString();
            case 'weekly': return $date->addWeek()->toDateTimeString();
            case 'monthly': return $date->addMonth()->toDateTimeString();
            default:
                // Handle Cron if we want to be fancy, but daily is a safe default
                return $date->addMonth()->toDateTimeString();
        }
    }

    /**
     * Dispatch webhook event dynamically formatted for Discord.
     */
    public static function dispatchWebhook($event, Server $server, $extra = []) {
        $settings = DB::getSettings();
        $url = $settings['billing']['webhook_url'] ?? null;
        
        if (!$url) return;

        $color = 3447003; // Blue
        $title = 'Billing Event';
        $description = "Server `{$server->name}` ({$server->uuid})";

        switch ($event) {
            case 'billing.success':
                $color = 3066993; // Green
                $title = '✅ 伺服器扣款成功 (Billing Success)';
                $description .= "\n成功扣除 `{$extra['amount']}` 點數。\n下次扣款時間: `{$extra['next_billing_at']}`";
                break;
            case 'billing.failed':
                $color = 15158332; // Red
                $title = '⚠️ 伺服器扣款失敗 (Billing Failed)';
                $description .= "\n餘額不足！嘗試扣除 `{$extra['amount']}` 點數失敗。\n停機時間: `{$extra['grace_period_ends_at']}`";
                break;
            case 'server.suspended':
                $color = 16753920; // Orange
                $title = '⏸️ 伺服器已因欠費停機 (Server Suspended)';
                $description .= "\n此伺服器已因逾期未繳費而暫停運行。";
                break;
            case 'server.deleted':
                $color = 10038562; // Dark Red
                $title = '🗑️ 伺服器已因欠費刪除 (Server Deleted)';
                $description .= "\n此伺服器已過了寬限期，已被系統刪除。";
                break;
        }

        $payload = [
            'username' => 'Better Pterodactyl Economy',
            'embeds' => [
                [
                    'title' => $title,
                    'description' => $description,
                    'color' => $color,
                    'timestamp' => now()->toIso8601String(),
                    'footer' => [
                        'text' => 'Better Pterodactyl',
                    ],
                ]
            ]
        ];

        try {
            Http::timeout(5)->post($url, $payload);
        } catch (\Exception $e) {
            Log::warning("Billing: Webhook failed for $event on server {$server->id}: " . $e->getMessage());
        }
    }
}
