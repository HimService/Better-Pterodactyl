<?php

namespace BetterPterodactyl\Trash;

class DB {
    private static $settingsPath = null;

    private static function getPath() {
        if (self::$settingsPath === null) {
            self::$settingsPath = base_path('resources/settings/trash_settings.json');
        }
        return self::$settingsPath;
    }

    public static function getSettings() {
        $path = self::getPath();
        $defaults = [
            'enabled' => true,
            'retention_days' => 30,
        ];

        if (!file_exists($path)) {
            return $defaults;
        }

        $content = file_get_contents($path);
        $settings = json_decode($content, true) ?: [];
        
        return array_merge($defaults, $settings);
    }

    public static function updateSettings(array $settings) {
        $path = self::getPath();
        $current = self::getSettings();
        $new = array_merge($current, $settings);
        
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        
        return file_put_contents($path, json_encode($new, JSON_PRETTY_PRINT));
    }
}
