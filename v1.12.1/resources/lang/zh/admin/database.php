<?php

return [
    'notices' => [
        'host_created' => '已成功建立新資料庫主機。',
        'host_updated' => '資料庫主機已成功更新。',
        'host_deleted' => '資料庫主機已成功刪除。',
        'linked_nodes_updated' => '與此資料庫主機連結的節點已更新。',
    ],
    'index' => [
        'title' => '資料庫主機',
        'description' => '伺服器可以用來建立資料庫的資料庫主機。',
        'list' => '主機清單',
        'create_new' => '建立新主機',
        'create_host' => '建立新資料庫主機',
        'name_help' => '用於區分此主機與其他主機的簡短識別碼。必須在 1 到 60 個字元之間，例如：<code>us.nyc.lvl3</code>。',
        'host_help' => '當面板嘗試連接到此 MySQL 主機以建立新資料庫時應使用的 IP 位址或 FQDN。',
        'port_help' => '此主機上 MySQL 運行的連接埠。',
        'username_help' => '具有足夠權限在系統上建立新使用者和資料庫的帳號使用者名稱。',
        'password_help' => '定義帳號的密碼。',
        'linked_node' => '連結節點',
        'node_help' => '此設定除了在將資料庫新增至所選節點上的伺服器時，預設使用此資料庫主機外，沒有其他作用。',
        'grant_help' => '為此資料庫主機定義的帳號<strong>必須</strong>具有 <code>WITH GRANT OPTION</code> 權限。如果定義的帳號沒有此權限，建立資料庫的請求<em>將會</em>失敗。<strong>請勿將您為此面板定義的 MySQL 帳號詳細資訊用於此處。</strong>',
    ],
    'view' => [
        'header' => '查看此資料庫主機的相關資料庫和詳細資訊。',
        'host_details' => '主機詳細資訊',
        'user_details' => '使用者詳細資訊',
        'databases' => '資料庫',
        'max_connections' => '最大連線數',
        'connections_from' => '連線來源',
        'unlimited' => '無限',
        'manage' => '管理',
    ],
];
