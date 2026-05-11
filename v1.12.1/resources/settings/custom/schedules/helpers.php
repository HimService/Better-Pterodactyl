<?php

namespace BetterPterodactyl\Custom\Schedules;

use PDO;

class DB {
    private static $instance = null;

    public static function getConnection() {
        if (self::$instance === null) {
            $dbPath = base_path('resources/settings/custom/schedules/sqlite');
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
                self::$instance->exec("CREATE TABLE IF NOT EXISTS schedule_conditions (
                    schedule_id INTEGER PRIMARY KEY,
                    conditions TEXT,
                    logic_operator TEXT DEFAULT 'AND'
                )");
            } catch (\PDOException $e) {
                throw new \Exception("SQLite Connection Error: " . $e->getMessage());
            }
        }
        return self::$instance;
    }

    /**
     * Get conditions for a specific schedule.
     */
    public static function getConditions($scheduleId) {
        $id = $scheduleId instanceof \Pterodactyl\Models\Schedule ? $scheduleId->id : $scheduleId;
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT conditions, logic_operator FROM schedule_conditions WHERE schedule_id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        
        if (!$row) {
            return [
                'conditions' => [],
                'logic_operator' => 'AND'
            ];
        }
        
        return [
            'conditions' => json_decode($row['conditions'], true) ?: [],
            'logic_operator' => $row['logic_operator']
        ];
    }

    /**
     * Update conditions for a specific schedule.
     */
    public static function updateConditions($scheduleId, array $conditions, $logicOperator = 'AND') {
        $id = $scheduleId instanceof \Pterodactyl\Models\Schedule ? $scheduleId->id : $scheduleId;
        $db = self::getConnection();
        $stmt = $db->prepare("INSERT OR REPLACE INTO schedule_conditions (schedule_id, conditions, logic_operator) VALUES (?, ?, ?)");
        $stmt->execute([$id, json_encode($conditions), $logicOperator]);
    }

    /**
     * 檢查特定排程的智慧條件是否滿足
     * 
     * @param int|string $scheduleId
     * @return bool
     */
    public static function checkConditions($scheduleId): bool
    {
        // 1. 先從本地快取/資料庫獲取條件設定 (這一步非常快)
        $data = self::getConditions($scheduleId);
        
        // 2. 智慧交換：如果用戶沒填任何智慧條件，直接傳統模式放行
        if (empty($data['conditions']) || count($data['conditions']) === 0) {
            return true; 
        }

        $conditions = $data['conditions'];
        $logicOperator = $data['logic_operator'] ?? 'AND';

        // 3. 只有在有條件的情況下，才進行昂貴的 Wings 數據請求
        try {
            // 如果傳入的就是 Schedule 模型，直接使用以節省效能
            $schedule = $scheduleId instanceof \Pterodactyl\Models\Schedule ? $scheduleId : \Pterodactyl\Models\Schedule::find($scheduleId);
            if (!$schedule) return true;
            
            $server = $schedule->server;
            if (!$server) return true;

            $repository = app(\Pterodactyl\Repositories\Wings\DaemonServerRepository::class);
            $stats = $repository->setServer($server)->getDetails();
            
            // Pterodactyl 的 DaemonServerRepository::getDetails() 提供 'utilization'
            $res = $stats['utilization'] ?? $stats;

            $cpuUsage = $res['cpu_absolute'] ?? 0;
            $memoryBytes = $res['memory_bytes'] ?? 0;
            $uptimeMs = $res['uptime'] ?? 0;
            
            $memoryUsage = ($memoryBytes / (1024 * 1024)) / ($server->memory ?: 1) * 100;
            $uptimeSeconds = $uptimeMs / 1000;

            $results = [];
            foreach ($conditions as $cond) {
                $currentValue = 0;
                switch ($cond['variable']) {
                    // 為了相容已儲存在資料庫的舊設定，遇到 players_count 預設當作條件不成立/或跳過
                    case 'players_count': continue 2; 
                    case 'cpu_usage':    $currentValue = $cpuUsage; break;
                    case 'memory_usage': $currentValue = $memoryUsage; break;
                    case 'uptime':       $currentValue = $uptimeSeconds; break;
                }

                $match = false;
                switch ($cond['operator']) {
                    case '==': $match = $currentValue == $cond['value']; break;
                    case '!=': $match = $currentValue != $cond['value']; break;
                    case '>':  $match = $currentValue >  $cond['value']; break;
                    case '<':  $match = $currentValue <  $cond['value']; break;
                    case '>=': $match = $currentValue >= $cond['value']; break;
                    case '<=': $match = $currentValue <= $cond['value']; break;
                }
                $results[] = $match;
            }

            if ($logicOperator === 'OR') {
                return in_array(true, $results);
            }
            return !in_array(false, $results);

        } catch (\Exception $e) {
            \Log::error('BetterPterodactyl Smart Schedule Check Error: ' . $e->getMessage());
            throw $e; 
        }
    }
}
