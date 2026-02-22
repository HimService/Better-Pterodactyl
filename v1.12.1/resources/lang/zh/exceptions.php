<?php

return [
    'daemon_connection_failed' => '嘗試與守護行程 (Daemon) 通訊時發生例外狀況，導致 HTTP/:code 回應代碼。此例外狀況已被記錄。',
    'node' => [
        'servers_attached' => '刪除節點前，必須確保該節點未連結任何伺服器。',
        'daemon_off_config_updated' => '守護行程設定已更新，但嘗試自動更新守護行程上的設定檔時發生錯誤。您需要手動更新守護行程的設定檔 (config.yml) 以套用這些變更。',
    ],
    'allocations' => [
        'server_using' => '目前有伺服器被指派到此分配 (Allocation)。只有在沒有伺服器指派的情況下才能刪除分配。',
        'too_many_ports' => '不支援一次在單一範圍內新增超過 1000 個連接埠。',
        'invalid_mapping' => '為 :port 提供的對應無效，無法處理。',
        'cidr_out_of_range' => 'CIDR 標記只允許在 /25 和 /32 之間的遮罩。',
        'port_out_of_range' => '分配中的連接埠必須大於 1024 且小於或等於 65535。',
    ],
    'nest' => [
        'delete_has_servers' => '無法從面板刪除有活動伺服器附加的巢 (Nest)。',
        'egg' => [
            'delete_has_servers' => '無法從面板刪除有活動伺服器附加的蛋 (Egg)。',
            'invalid_copy_id' => '選取要從中複製腳本的蛋不存在，或者它本身正在複製腳本。',
            'must_be_child' => '此蛋的「從...複製設定」指令必須是所選巢的子選項。',
            'has_children' => '此蛋是一或多個其他蛋的父級。請在刪除此蛋之前刪除那些蛋。',
        ],
        'variables' => [
            'env_not_unique' => '環境變數 :name 必須是此蛋中唯一的。',
            'reserved_name' => '環境變數 :name 受保護，不能被指派給變數。',
            'bad_validation_rule' => '驗證規則 ":rule" 不是此應用程式的有效規則。',
        ],
        'importer' => [
            'json_error' => '嘗試解析 JSON 檔案時發生錯誤：:error。',
            'file_error' => '提供的 JSON 檔案無效。',
            'invalid_json_provided' => '提供的 JSON 檔案格式無法被辨識。',
        ],
    ],
    'subusers' => [
        'editing_self' => '不允許編輯您自己的子使用者帳號。',
        'user_is_owner' => '您不能將伺服器擁有者新增為此伺服器的子使用者。',
        'subuser_exists' => '擁有該電子郵件地址的使用者已被指派為此伺服器的子使用者。',
    ],
    'databases' => [
        'delete_has_databases' => '無法刪除連結活動資料庫的主機伺服器。',
    ],
    'tasks' => [
        'chain_interval_too_long' => '鏈結任務的最長間隔時間為 15 分鐘。',
    ],
    'locations' => [
        'has_nodes' => '無法刪除有活動節點附加的位置。',
    ],
    'users' => [
        'node_revocation_failed' => '無法撤銷 <a href=":link">節點 #:node</a> 上的金鑰。:error',
    ],
    'deployment' => [
        'no_viable_nodes' => '找不到滿足自動部署要求條件的節點。',
        'no_viable_allocations' => '找不到滿足自動部署要求條件的分配。',
    ],
    'api' => [
        'resource_not_found' => '請求的資源在此伺服器上不存在。',
    ],
];
