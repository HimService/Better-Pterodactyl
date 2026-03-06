<?php

namespace BetterPterodactyl\Discord;

use PDO;

class DB {
    private static $instance = null;

    public static function getConnection() {
        if (!extension_loaded('pdo_sqlite')) {
            throw new \Exception("PHP Extension 'pdo_sqlite' is not loaded.");
        }
        if (self::$instance === null) {
            $dbPath = base_path('resources/settings/discord/sqlite');
            $dir = dirname($dbPath);
            
            if (!is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            if (!file_exists($dbPath)) {
                @touch($dbPath);
                @chmod($dbPath, 0666);
            }

            try {
                self::$instance = new PDO("sqlite:$dbPath");
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                
                self::$instance->exec("CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )");

                self::$instance->exec("CREATE TABLE IF NOT EXISTS discord_users (
                    user_id INTEGER PRIMARY KEY,
                    discord_id TEXT UNIQUE,
                    discord_username TEXT,
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
        $stmt = $db->prepare("SELECT value FROM settings WHERE key = 'config'");
        $stmt->execute();
        $row = $stmt->fetch();
        
        $decoded = $row ? json_decode($row['value'], true) : [];
        $settings = is_array($decoded) ? $decoded : [];
        
        $defaultSettings = [
            'enabled' => false,
            'client_id' => '',
            'client_secret' => '',
            'redirect_url' => '',
            'allow_registration' => true,
        ];

        $merged = array_merge($defaultSettings, $settings);

        // Final sanitation: ensure no nulls reach the frontend for these keys
        return [
            'enabled' => (bool)($merged['enabled'] ?? false),
            'client_id' => (string)($merged['client_id'] ?? ''),
            'client_secret' => (string)($merged['client_secret'] ?? ''),
            'redirect_url' => (string)($merged['redirect_url'] ?? ''),
            'allow_registration' => (bool)($merged['allow_registration'] ?? true),
        ];
    }

    public static function updateSettings(array $settings) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('config', ?)");
        $stmt->execute([json_encode($settings)]);
    }

    public static function linkUser($userId, $discordId, $username) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT OR REPLACE INTO discord_users (user_id, discord_id, discord_username) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $discordId, $username]);
    }

    public static function getUserByDiscordId($discordId) {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT user_id FROM discord_users WHERE discord_id = ?");
        $stmt->execute([$discordId]);
        return $stmt->fetch();
    }
}
