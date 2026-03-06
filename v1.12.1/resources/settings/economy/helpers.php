<?php

namespace BetterPterodactyl\Economy;

use PDO;

if (file_exists(__DIR__ . '/BillingService.php')) {
    require_once __DIR__ . '/BillingService.php';
}


class DB {
    private static $instance = null;

    public static function getConnection() {
        if (!extension_loaded('pdo_sqlite')) {
            throw new \Exception("PHP Extension 'pdo_sqlite' is not loaded. Please install 'php-sqlite3' and restart your web server.");
        }
        if (self::$instance === null) {
            $dbPath = base_path('resources/settings/economy/sqlite');
            $dir = dirname($dbPath);
            
            if (!is_dir($dir)) {
                if (!@mkdir($dir, 0755, true)) {
                    throw new \Exception("Cannot create directory: $dir. Please check permissions.");
                }
            }
            if (!file_exists($dbPath)) {
                if (!@touch($dbPath)) {
                    throw new \Exception("Cannot create file: $dbPath. Please check permissions.");
                }
                @chmod($dbPath, 0666);
            }

            try {
                self::$instance = new PDO("sqlite:$dbPath");
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                
                // Initialize tables
                self::$instance->exec("CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY, 
                    points DECIMAL(16,4) DEFAULT 0, 
                    extra_cpu INTEGER DEFAULT 0, 
                    extra_memory INTEGER DEFAULT 0, 
                    extra_disk INTEGER DEFAULT 0, 
                    extra_backups INTEGER DEFAULT 0, 
                    extra_allocations INTEGER DEFAULT 0,
                    extra_slots INTEGER DEFAULT 0
                )");
                self::$instance->exec("CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )");
                self::$instance->exec("CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, type TEXT, amount DECIMAL(16,4), metadata TEXT, created_at DATETIME)");
                
                // Migrate older databases missing the new columns
                try {
                    self::$instance->exec("ALTER TABLE transactions ADD COLUMN metadata TEXT");
                } catch (\Exception $e) {}
                try {
                    self::$instance->exec("ALTER TABLE transactions ADD COLUMN created_at DATETIME");
                } catch (\Exception $e) {}

                // promo_codes
                self::$instance->exec("CREATE TABLE IF NOT EXISTS promo_codes (
                    code TEXT PRIMARY KEY,
                    rewards TEXT,
                    max_uses INTEGER DEFAULT 0,
                    uses INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )");

                // promo_uses
                self::$instance->exec("CREATE TABLE IF NOT EXISTS promo_uses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT,
                    user_id INTEGER,
                    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(code) REFERENCES promo_codes(code)
                )");

                // server_billing
                self::$instance->exec("CREATE TABLE IF NOT EXISTS server_billing (
                    server_id INTEGER PRIMARY KEY,
                    billing_cycle TEXT DEFAULT 'monthly',
                    price DECIMAL(16,4) DEFAULT 0,
                    status TEXT DEFAULT 'active',
                    next_billing_at DATETIME,
                    grace_period_ends_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )");

                // billing_transactions
                self::$instance->exec("CREATE TABLE IF NOT EXISTS billing_transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    server_id INTEGER,
                    user_id INTEGER,
                    type TEXT,
                    amount DECIMAL(16,4),
                    previous_status TEXT,
                    new_status TEXT,
                    metadata TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )");

            } catch (\PDOException $e) {
                throw new \Exception("SQLite Connection Error: " . $e->getMessage());
            }
        }
        return self::$instance;
    }

    public static function getSettings() {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT value FROM settings WHERE key = 'all'");
        $stmt->execute();
        $row = $stmt->fetch();
        
        $settings = $row ? json_decode($row['value'], true) : [];
        
        $defaultSettings = [
            'enabled' => false,
            'bundles' => [
                'cpu'         => ['amount' => 10, 'price' => 10],
                'ram'         => ['amount' => 1024, 'price' => 10],
                'disk'        => ['amount' => 1024, 'price' => 5],
                'backups'     => ['amount' => 1, 'price' => 50],
                'allocations' => ['amount' => 1, 'price' => 50],
                'slots'       => ['amount' => 1, 'price' => 500],
            ],
            'defaults' => [
                'points' => 0,
                'cpu' => 0,
                'ram' => 0,
                'disk' => 0,
                'backups' => 0,
                'allocations' => 0,
                'slots' => 0,
            ],
            'min_limits' => [
                'cpu' => 10,
                'ram' => 256,
                'disk' => 512,
            ],
            'api_tokens' => [],
            'allowed_eggs' => [],
            'allowed_nodes' => [],
            'billing' => [
                'enabled' => false,
                'base_price' => 0,
                'cpu_coeff' => 0.5,
                'ram_coeff' => 0.01, // per MB
                'disk_coeff' => 0.005, // per MB
                'grace_period_hours' => 24,
                'pending_delete_days' => 7,
                'webhook_url' => '',
            ]
        ];


        return array_replace_recursive($defaultSettings, $settings);
    }

    public static function updateSettings(array $settings) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('all', ?)");
        $stmt->execute([json_encode($settings)]);
    }

    public static function getUser($userId) {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            $settings = self::getSettings();
            $defaults = $settings['defaults'] ?? [
                'points' => 0,
                'cpu' => 0,
                'ram' => 0,
                'disk' => 0,
                'backups' => 0,
                'allocations' => 0,
                'slots' => 0,
            ];

            $stmt = $db->prepare("INSERT INTO users (user_id, points, extra_cpu, extra_memory, extra_disk, extra_backups, extra_allocations, extra_slots) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $defaults['points'],
                $defaults['cpu'],
                $defaults['ram'],
                $defaults['disk'],
                $defaults['backups'],
                $defaults['allocations'],
                $defaults['slots']
            ]);
            return self::getUser($userId);
        }
        return $user;
    }

    public static function updatePoints($userId, $amount) {
        $db = self::getConnection();
        $stmt = $db->prepare("UPDATE users SET points = points + ? WHERE user_id = ?");
        $stmt->execute([$amount, $userId]);
    }

    public static function addResource($userId, $resource, $amount) {
        $db = self::getConnection();
        $columnMap = [
            'cpu' => 'extra_cpu',
            'ram' => 'extra_memory',
            'disk' => 'extra_disk',
            'backups' => 'extra_backups',
            'allocations' => 'extra_allocations',
            'slots' => 'extra_slots',
        ];
        $column = $columnMap[$resource] ?? null;
        if ($column) {
            $stmt = $db->prepare("UPDATE users SET $column = $column + ? WHERE user_id = ?");
            $stmt->execute([$amount, $userId]);
        }
    }

    public static function logTransaction($userId, $type, $amount, $metadata = []) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT INTO transactions (user_id, type, amount, metadata, created_at) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $type, $amount, json_encode($metadata), date('Y-m-d H:i:s')]);
    }

    public static function getUserHistory($userId, $limit = 50) {
        $db = self::getConnection();
        
        $stmt1 = $db->prepare("SELECT id, type, amount, metadata, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?");
        $stmt1->execute([$userId, $limit]);
        $transactions = $stmt1->fetchAll();
        
        $stmt2 = $db->prepare("SELECT id, server_id, type, amount, previous_status, new_status, metadata, created_at FROM billing_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?");
        $stmt2->execute([$userId, $limit]);
        $billing = $stmt2->fetchAll();

        $history = [];
        foreach ($transactions as $t) {
            $history[] = [
                'id' => 'eco_' . $t['id'],
                'group' => 'economy',
                'type' => $t['type'],
                'amount' => (float) $t['amount'],
                'metadata' => json_decode($t['metadata'] ?: '{}', true),
                'created_at' => is_numeric($t['created_at']) ? date('Y-m-d H:i:s', $t['created_at']) : $t['created_at']
            ];
        }

        foreach ($billing as $b) {
            $meta = json_decode($b['metadata'] ?: '{}', true);
            $meta['server_id'] = $b['server_id'];
            $meta['previous_status'] = $b['previous_status'];
            $meta['new_status'] = $b['new_status'];
            
            $history[] = [
                'id' => 'bill_' . $b['id'],
                'group' => 'billing',
                'type' => $b['type'],
                'amount' => $b['type'] === 'charge_failed' ? 0 : -abs((float) $b['amount']),
                'metadata' => $meta,
                'created_at' => is_numeric($b['created_at']) ? date('Y-m-d H:i:s', $b['created_at']) : $b['created_at']
            ];
        }

        usort($history, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return array_slice($history, 0, $limit);
    }

    public static function getPromoCodes() {
        $db = self::getConnection();
        $stmt = $db->query("SELECT * FROM promo_codes ORDER BY created_at DESC");
        $results = $stmt->fetchAll();
        
        $codes = [];
        foreach ($results as $row) {
            $codes[$row['code']] = [
                'rewards' => json_decode($row['rewards'], true),
                'max_uses' => (int)$row['max_uses'],
                'uses' => (int)$row['uses'],
                'created_at' => is_numeric($row['created_at']) ? (int)$row['created_at'] : strtotime($row['created_at'])
            ];
        }
        return $codes;
    }

    public static function updatePromoCode($code, $data) {
        $db = self::getConnection();
        $code = strtoupper($code);
        $rewards = json_encode($data['rewards']);
        
        $stmt = $db->prepare("INSERT INTO promo_codes (code, rewards, max_uses, uses, created_at) VALUES (?, ?, ?, ?, ?) 
            ON CONFLICT(code) DO UPDATE SET rewards=excluded.rewards, max_uses=excluded.max_uses, uses=excluded.uses");
        $stmt->execute([
            $code, 
            $rewards, 
            $data['max_uses'], 
            $data['uses'] ?? 0, 
            $data['created_at'] ?? date('Y-m-d H:i:s')
        ]);
    }

    public static function deletePromoCode($code) {
        $db = self::getConnection();
        $stmt = $db->prepare("DELETE FROM promo_codes WHERE code = ?");
        $stmt->execute([strtoupper($code)]);
    }

    public static function usePromoCode($code, $userId) {
        $db = self::getConnection();
        $code = strtoupper($code);
        
        try {
            $db->beginTransaction();
            
            // Increment uses
            $stmt = $db->prepare("UPDATE promo_codes SET uses = uses + 1 WHERE code = ?");
            $stmt->execute([$code]);
            
            // Log use
            $stmt = $db->prepare("INSERT INTO promo_uses (code, user_id) VALUES (?, ?)");
            $stmt->execute([$code, $userId]);
            
            $db->commit();
            return true;
        } catch (\Exception $e) {
            $db->rollBack();
            return false;
        }
    }

    public static function hasUsedPromoCode($code, $userId) {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT id FROM promo_uses WHERE code = ? AND user_id = ?");
        $stmt->execute([strtoupper($code), $userId]);
        return (bool)$stmt->fetch();
    }

    // Billing Methods
    public static function getServerBilling($serverId) {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT * FROM server_billing WHERE server_id = ?");
        $stmt->execute([$serverId]);
        return $stmt->fetch();
    }

    public static function updateServerBilling($serverId, array $data) {
        $db = self::getConnection();
        $fields = [];
        $values = [];
        foreach ($data as $key => $value) {
            $fields[] = "$key = ?";
            $values[] = $value;
        }
        $values[] = $serverId;
        
        $sql = "UPDATE server_billing SET " . implode(', ', $fields) . ", updated_at = CURRENT_TIMESTAMP WHERE server_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($values);
    }

    public static function createServerBilling($serverId, array $data) {
        $db = self::getConnection();
        $columns = ['server_id'];
        $placeholders = ['?'];
        $values = [$serverId];
        
        foreach ($data as $key => $value) {
            $columns[] = $key;
            $placeholders[] = '?';
            $values[] = $value;
        }
        
        $sql = "INSERT INTO server_billing (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $db->prepare($sql);
        $stmt->execute($values);
    }

    public static function logBillingTransaction($serverId, $userId, $type, $amount, $prevStatus, $newStatus, $metadata = []) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT INTO billing_transactions (server_id, user_id, type, amount, previous_status, new_status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$serverId, $userId, $type, $amount, $prevStatus, $newStatus, json_encode($metadata)]);
    }

    public static function getServersScheduledForBilling() {
        $db = self::getConnection();
        $now = date('Y-m-d H:i:s');
        $stmt = $db->prepare("SELECT * FROM server_billing WHERE status IN ('active', 'overdue') AND (next_billing_at <= ? OR next_billing_at IS NULL)");
        $stmt->execute([$now]);
        return $stmt->fetchAll();
    }

    public static function getOverdueServers() {
        $db = self::getConnection();
        $now = date('Y-m-d H:i:s');
        $stmt = $db->prepare("SELECT * FROM server_billing WHERE status = 'overdue' AND grace_period_ends_at <= ?");
        $stmt->execute([$now]);
        return $stmt->fetchAll();
    }

    public static function getPendingDeleteServers($days) {
        $db = self::getConnection();
        $dateLimit = date('Y-m-d H:i:s', strtotime("-$days days"));
        $stmt = $db->prepare("SELECT * FROM server_billing WHERE status = 'suspended' AND updated_at <= ?");
        $stmt->execute([$dateLimit]);
        return $stmt->fetchAll();
    }
}

