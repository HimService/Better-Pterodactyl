<?php

namespace BetterPterodactyl\Logs;

use Illuminate\Support\Facades\File;

class DB
{
    /**
     * Get a list of log files in storage/logs
     */
    public static function getLogs(): array
    {
        $path = storage_path('logs');
        if (!File::exists($path)) {
            return [];
        }

        $files = File::files($path);
        
        return collect($files)
            ->map(function ($file) {
                return [
                    'name' => $file->getFilename(),
                    'size' => $file->getSize(),
                    'modified' => $file->getMTime(),
                ];
            })
            ->sortByDesc('modified')
            ->values()
            ->all();
    }

    /**
     * Get the content of a specific log file
     * Limit to last 1000 lines for performance
     */
    public static function getLogContent(string $filename, int $lines = 1000): string
    {
        $path = storage_path('logs/' . $filename);
        
        // Security check: ensure the file is within the logs directory
        if (!File::exists($path) || !str_starts_with(realpath($path), realpath(storage_path('logs')))) {
            return 'Log file not found or access denied.';
        }

        // Use shell_exec to get the last N lines for performance on large files
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows fallback: read the whole file if small, or use PowerShell
            $size = File::size($path);
            if ($size > 10 * 1024 * 1024) { // > 10MB
                return "File too large to display on Windows without tail command.";
            }
            return File::get($path);
        } else {
            // Linux: use tail
            return shell_exec('tail -n ' . escapeshellarg($lines) . ' ' . escapeshellarg($path));
        }
    }
}
