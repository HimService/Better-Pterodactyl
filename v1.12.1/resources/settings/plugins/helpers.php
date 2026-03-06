<?php

namespace BetterPterodactyl\Plugins;

use PDO;

class DB {
    private static $instance = null;

    public static function getConnection() {
        if (!extension_loaded('pdo_sqlite')) {
            throw new \Exception("PHP Extension 'pdo_sqlite' is not loaded. Please install 'php-sqlite3' and restart your web server.");
        }
        if (self::$instance === null) {
            $dbPath = base_path('resources/settings/plugins/plugins.sqlite');
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
                self::$instance->exec("CREATE TABLE IF NOT EXISTS plugins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    slot TEXT NOT NULL,
                    type TEXT NOT NULL,
                    config TEXT NOT NULL,
                    enabled BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )");

            } catch (\PDOException $e) {
                throw new \Exception("SQLite Connection Error: " . $e->getMessage());
            }
        }
        return self::$instance;
    }

    public static function getPlugins() {
        $db = self::getConnection();
        $stmt = $db->query("SELECT * FROM plugins ORDER BY created_at DESC");
        return $stmt->fetchAll();
    }

    public static function getActivePluginsForSlot($slot) {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT * FROM plugins WHERE slot = ? AND enabled = 1 ORDER BY id ASC");
        $stmt->execute([$slot]);
        return $stmt->fetchAll();
    }

    public static function updatePlugin($id, array $data) {
        $db = self::getConnection();
        
        $fields = [];
        $values = [];
        foreach ($data as $key => $value) {
            if ($key === 'id') continue;
            $fields[] = "$key = ?";
            $values[] = is_array($value) ? json_encode($value) : $value;
        }
        $values[] = $id;
        
        $sql = "UPDATE plugins SET " . implode(', ', $fields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($values);
    }

    public static function createPlugin(array $data) {
        $db = self::getConnection();
        
        $columns = [];
        $placeholders = [];
        $values = [];
        foreach ($data as $key => $value) {
            $columns[] = $key;
            $placeholders[] = "?";
            $values[] = is_array($value) ? json_encode($value) : $value;
        }
        
        $sql = "INSERT INTO plugins (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        return $db->lastInsertId();
    }

    public static function deletePlugin($id) {
        $db = self::getConnection();
        $stmt = $db->prepare("DELETE FROM plugins WHERE id = ?");
        $stmt->execute([$id]);
    }

    public static function togglePlugin($id, $enabled) {
        $db = self::getConnection();
        $stmt = $db->prepare("UPDATE plugins SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([(int)$enabled, $id]);
    }
}
