<?php

namespace BetterPterodactyl\Tickets;

use PDO;
require_once __DIR__ . '/TicketService.php';

class DB {
    private static $instance = null;

    public static function getConnection() {
        if (!extension_loaded('pdo_sqlite')) {
            throw new \Exception("PHP Extension 'pdo_sqlite' is not loaded.");
        }
        if (self::$instance === null) {
            $dbPath = base_path('resources/settings/tickets/sqlite');
            $dir = dirname($dbPath);
            
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            if (!file_exists($dbPath)) {
                touch($dbPath);
                chmod($dbPath, 0666);
            }

            try {
                self::$instance = new PDO("sqlite:$dbPath");
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                
                // Initialize tables
                self::$instance->exec("CREATE TABLE IF NOT EXISTS tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    subject TEXT NOT NULL,
                    status TEXT DEFAULT 'open',
                    priority TEXT DEFAULT 'normal',
                    category TEXT,
                    server_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )");

                self::$instance->exec("CREATE TABLE IF NOT EXISTS ticket_comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    comment TEXT NOT NULL,
                    is_admin BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
                )");

                self::$instance->exec("CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
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
            'max_per_user' => 3,
            'discord_webhook' => '',
        ];

        return array_replace_recursive($defaultSettings, $settings);
    }

    public static function updateSettings(array $settings) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('all', ?)");
        $stmt->execute([json_encode($settings)]);
    }

    public static function createTicket($userId, $subject, $priority, $category, $serverId = null) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT INTO tickets (user_id, subject, priority, category, server_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $subject, $priority, $category, $serverId]);
        return $db->lastInsertId();
    }

    public static function addComment($ticketId, $userId, $comment, $isAdmin = false) {
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT INTO ticket_comments (ticket_id, user_id, comment, is_admin) VALUES (?, ?, ?, ?)");
        $stmt->execute([$ticketId, $userId, $comment, $isAdmin ? 1 : 0]);
        
        // Update ticket's updated_at
        $stmt = $db->prepare("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$ticketId]);
    }

    public static function getTickets($userId = null, $status = null) {
        $db = self::getConnection();
        $sql = "SELECT * FROM tickets";
        $params = [];
        
        $where = [];
        if ($userId) {
            $where[] = "user_id = ?";
            $params[] = $userId;
        }
        if ($status) {
            $where[] = "status = ?";
            $params[] = $status;
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        
        $sql .= " ORDER BY updated_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function getTicket($id) {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT * FROM tickets WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public static function getComments($ticketId) {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC");
        $stmt->execute([$ticketId]);
        return $stmt->fetchAll();
    }

    public static function updateStatus($id, $status) {
        $db = self::getConnection();
        $stmt = $db->prepare("UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$status, $id]);
    }

    public static function getUserOpenTicketsCount($userId) {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM tickets WHERE user_id = ? AND status != 'closed'");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        return $row ? (int)$row['count'] : 0;
    }
}
