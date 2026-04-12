<?php

namespace BetterPterodactyl\Custom\Shortcuts;

use PDO;

class DB {
    private static $instance = null;

    public static function getConnection() {
        if (self::$instance === null) {
            $dbPath = base_path('resources/settings/custom/shortcuts/sqlite');
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
                
                // Initialize tables
                // We use (user_id, server_id) as the primary key for server-specific shortcuts
                self::$instance->exec("CREATE TABLE IF NOT EXISTS user_shortcuts (
                    user_id INTEGER,
                    server_id INTEGER,
                    shortcuts TEXT,
                    PRIMARY KEY (user_id, server_id)
                )");
            } catch (\PDOException $e) {
                throw new \Exception("SQLite Connection Error: " . $e->getMessage());
            }
        }
        return self::$instance;
    }

    /**
     * Get shortcuts for a specific user and server.
     */
    public static function getShortcuts($userId, $serverId) {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT shortcuts FROM user_shortcuts WHERE user_id = ? AND server_id = ?");
        $stmt->execute([$userId, $serverId]);
        $row = $stmt->fetch();
        
        if (!$row) {
            // Return default shortcuts if the user hasn't customized them yet for this server
            return [
                ['id' => 'default_status', 'label' => 'Status', 'command' => 'status', 'is_default' => true],
                ['id' => 'default_version', 'label' => 'Version', 'command' => 'version', 'is_default' => true],
                ['id' => 'default_help', 'label' => 'Help', 'command' => 'help', 'is_default' => true],
            ];
        }
        
        return json_decode($row['shortcuts'], true) ?: [];
    }

    /**
     * Update shortcuts for a specific user and server.
     */
    public static function updateShortcuts($userId, $serverId, array $shortcuts) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT OR REPLACE INTO user_shortcuts (user_id, server_id, shortcuts) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $serverId, json_encode($shortcuts)]);
    }
}
