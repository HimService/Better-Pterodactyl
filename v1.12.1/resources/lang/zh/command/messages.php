<?php

return [
    'location' => [
        'no_location_found' => '找不到與提供的短碼相符的記錄。',
        'ask_short' => '位置短碼',
        'ask_long' => '位置描述',
        'created' => '已成功建立新位置 (:name)，ID 為 :id。',
        'deleted' => '已成功刪除請求的位置。',
    ],
    'user' => [
        'search_users' => '輸入使用者名稱、使用者 ID 或電子郵件地址',
        'select_search_user' => '要刪除的使用者 ID (輸入 \'0\' 重新搜尋)',
        'deleted' => '已成功從面板中刪除使用者。',
        'confirm_delete' => '您確定要從面板中刪除此使用者嗎？',
        'no_users_found' => '找不到與提供搜尋字詞相符的使用者。',
        'multiple_found' => '找到多個與提供使用者相符的帳號，因為設定了 --no-interaction 標誌而無法刪除使用者。',
        'ask_admin' => '此使用者是管理員嗎？',
        'ask_email' => '電子郵件地址',
        'ask_username' => '使用者名稱',
        'ask_name_first' => '名字',
        'ask_name_last' => '姓氏',
        'ask_password' => '密碼',
        'ask_password_tip' => '如果您想建立一個密碼由系統隨機產生並以電子郵件寄送給使用者的帳號，請重新執行此命令 (CTRL+C) 並傳入 `--no-password` 標誌。',
        'ask_password_help' => '密碼長度必須至少為 8 個字元，且包含至少一個大寫字母和數字。',
        '2fa_help_text' => [
            '如果使用者已啟用雙因素驗證，此指令將會停用該帳號的雙因素驗證。這只應在使用者被鎖定在帳號之外時，作為帳號救援指令使用。',
            '如果這不是您想要執行的動作，請按 CTRL+C 退出此程序。',
        ],
        '2fa_disabled' => '已為 :email 停用雙因素驗證。',
    ],
    'schedule' => [
        'output_line' => '正在為 `:schedule` (:hash) 中的第一個任務分派工作。',
    ],
    'maintenance' => [
        'deleting_service_backup' => '正在刪除服務備份檔案 :file。',
    ],
    'server' => [
        'rebuild_failed' => '節點 ":node" 上對 ":name" (#:id) 的重建請求失敗，錯誤：:message',
        'reinstall' => [
            'failed' => '節點 ":node" 上對 ":name" (#:id) 的重新安裝請求失敗，錯誤：:message',
            'confirm' => '您即將對一組伺服器執行重新安裝。您確認要繼續嗎？',
        ],
        'power' => [
            'confirm' => '您即將對 :count 台伺服器執行 :action。您確認要繼續嗎？',
            'action_failed' => '節點 ":node" 上對 ":name" (#:id) 的電源操作請求失敗，錯誤：:message',
        ],
    ],
    'environment' => [
        'mail' => [
            'ask_smtp_host' => 'SMTP 主機 (例如 smtp.gmail.com)',
            'ask_smtp_port' => 'SMTP 連接埠',
            'ask_smtp_username' => 'SMTP 使用者名稱',
            'ask_smtp_password' => 'SMTP 密碼',
            'ask_mailgun_domain' => 'Mailgun 網域',
            'ask_mailgun_endpoint' => 'Mailgun 端點',
            'ask_mailgun_secret' => 'Mailgun 密鑰',
            'ask_mandrill_secret' => 'Mandrill 密鑰',
            'ask_postmark_username' => 'Postmark API 金鑰',
            'ask_driver' => '應該使用哪個驅動程式發送電子郵件？',
            'ask_mail_from' => '電子郵件的寄件者地址',
            'ask_mail_name' => '電子郵件的顯示名稱',
            'ask_encryption' => '要使用的加密方法',
        ],
    ],
];
