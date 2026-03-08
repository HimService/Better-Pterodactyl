<?php

namespace BetterPterodactyl\Tickets;

class TicketService {
    public static function sendDiscordNotification($ticketId, $subject, $user) {
        $settings = DB::getSettings();
        $webhookUrl = $settings['discord_webhook'] ?? '';
        
        if (empty($webhookUrl)) {
            return;
        }

        $panelUrl = config('app.url');
        $ticketUrl = rtrim($panelUrl, '/') . '/tickets/' . $ticketId;

        $payload = [
            'embeds' => [
                [
                    'title' => '🎫 新票務建立',
                    'description' => "全新的支援票務已由 **{$user->username}** 建立。",
                    'color' => 0x3498db, // Blue
                    'fields' => [
                        [
                            'name' => '標題',
                            'value' => $subject,
                            'inline' => false,
                        ],
                        [
                            'name' => '連結',
                            'value' => "[點此查看票務]($ticketUrl)",
                            'inline' => false,
                        ],
                    ],
                    'timestamp' => date('c'),
                    'footer' => [
                        'text' => 'Better Pterodactyl Ticket System',
                    ],
                ]
            ]
        ];

        self::postToWebhook($webhookUrl, $payload);
    }

    private static function postToWebhook($url, $payload) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_exec($ch);
        curl_close($ch);
    }
}
