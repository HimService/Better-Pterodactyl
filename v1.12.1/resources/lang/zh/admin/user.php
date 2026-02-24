<?php

return [
    'exceptions' => [
        'delete_self' => '您不能刪除自己的帳號。',
        'user_has_servers' => '無法刪除帳號下有活躍伺服器的使用者。請先刪除他們的伺服器後再繼續。',
    ],
    'notices' => [
        'account_created' => '帳號已成功建立。',
        'account_updated' => '帳號已成功更新。',
    ],
    'generated_password' => '產生的密碼',
    'index' => [
        'title' => '使用者列表',
        'description' => '系統中所有已註冊的使用者。',
        'list' => '使用者清單',
        'create_new' => '建立新使用者',
        'client_name' => '客戶姓名',
        'servers_owned' => '擁有的伺服器',
        'servers_owned_tooltip' => '此使用者被標記為擁有者的伺服器。',
        'can_access' => '可存取的伺服器',
        'can_access_tooltip' => '此使用者因被標記為子使用者而可存取的伺服器。',
    ],
    'new' => [
        'header' => '建立使用者',
        'header_help' => '在系統中新增一名使用者。',
        'identity' => '身份細節',
        'permissions' => '權限',
        'permissions_help' => '設定此使用者是否為管理員。管理員可以完整存取整個系統。',
        'password' => '密碼',
        'password_help' => '提供密碼是可選的。新使用者電子郵件會提示使用者在第一次登入時建立密碼。如果此處提供了密碼，您將需要使用其他方法提供給使用者。',
    ],
    'view' => [
        'header' => '管理使用者: :name',
        'identity' => '身份細節',
        'password' => '密碼',
        'password_help' => '若要保留此使用者的密碼不變，請留空。如果密碼被更改，使用者將不會收到任何通知。',
        'permissions' => '權限',
        'delete_user' => '刪除使用者',
        'delete_user_help' => '帳號下必須沒有關聯的伺服器才能被刪除。',
        'update_user' => '更新使用者',
    ],
];
