<?php

return [
    'index' => [
        'title' => '應用程式 API',
        'description' => '控制透過 API 管理此面板的存取憑證。',
        'list' => '憑證列表',
        'create_new' => '建立新憑證',
        'key' => '金鑰',
        'memo' => '備註',
        'last_used' => '最後使用',
        'created' => '已建立',
        'created_by' => '建立者',
        'revoke_key_title' => '撤銷 API 金鑰',
        'revoke_key_text' => '一旦撤銷此 API 金鑰，任何目前正在使用它的應用程式都將停止運作。',
        'revoked_text' => 'API 金鑰已撤銷。',
        'whoops' => '哎呀！',
        'revoke_error' => '嘗試撤銷此金鑰時發生錯誤。',
    ],
    'new' => [
        'header' => '建立 API 金鑰',
        'header_help' => '建立一個新的應用程式 API 金鑰。',
        'node_help' => '配置新憑證後，您將無法返回並編輯它。如果您以後需要進行更改，則需要建立一組新的憑證。',
        'create_credentials' => '建立憑證',
    ],
    'permissions' => [
        'read' => '讀取',
        'read_write' => '讀取與寫入',
        'none' => '無',
        'select_permissions' => '選擇權限',
    ],
    'resources' => [
        'locations' => '位置 (Locations)',
        'nodes' => '節點 (Nodes)',
        'servers' => '伺服器 (Servers)',
        'users' => '使用者 (Users)',
        'allocations' => '分配 (Allocations)',
        'nests' => '巢 (Nests)',
        'eggs' => '蛋 (Eggs)',
        'node_allocations' => '節點分配 (Node Allocations)',
        'server_databases' => '伺服器資料庫 (Server Databases)',
        'server_variables' => '伺服器變數 (Server Variables)',
    ],
];
