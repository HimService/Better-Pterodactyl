<?php

return [
    'sign_in' => '登入',
    'go_to_login' => '前往登入',
    'failed' => '找不到與這些憑證相符的帳號。',

    'forgot_password' => [
        'label' => '忘記密碼？',
        'label_help' => '請輸入您的帳號電子郵件地址以接收重設密碼的指示。',
        'button' => '復原帳號',
    ],

    'reset_password' => [
        'button' => '重設並登入',
    ],

    'two_factor' => [
        'label' => '雙因素驗證權杖',
        'label_help' => '此帳號需要第二層身分驗證才能繼續。請輸入您的裝置產生的代碼以完成此登入。',
        'checkpoint_failed' => '雙因素驗證權杖無效。',
    ],

    'throttle' => '登入嘗試次數過多。請在 :seconds 秒後再試一次。',
    'password_requirements' => '密碼長度必須至少為 8 個字元，且應該是此網站唯一的密碼。',
    '2fa_must_be_enabled' => '管理員已要求您的帳號必須啟用雙因素驗證才能使用面板。',
];
