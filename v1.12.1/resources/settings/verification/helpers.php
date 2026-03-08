<?php

namespace BetterPterodactyl\Verification;

use PDO;

class DB {
    private static $instance = null;

    public static function getConnection() {
        if (!extension_loaded('pdo_sqlite')) {
            throw new \Exception("PHP Extension 'pdo_sqlite' is not loaded. Please install 'php-sqlite3' and restart your web server.");
        }
        if (self::$instance === null) {
            $dbPath = base_path('resources/settings/verification/sqlite');
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
                
                self::$instance->exec("CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )");
                @chmod($dbPath, 0666);
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
            'enabled' => true,
            'verification_type' => 'recaptcha',
            'recaptcha_site_key' => '6LcJcjwUAAAAAO_Xqjrtj9wWufUpYRnK6BW8lnfn',
            'recaptcha_secret_key' => '6LcJcjwUAAAAALOcDJqAEYKTDhwELCkzUkNDQ0J5',
            'turnstile_site_key' => '1x00000000000000000000AA',
            'turnstile_secret_key' => '1x0000000000000000000000000000000AA',
        ];

        return array_replace_recursive($defaultSettings, $settings);
    }

    public static function updateSettings(array $settings) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('all', ?)");
        $stmt->execute([json_encode($settings)]);
    }
}
