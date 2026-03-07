<?php

return [
    'header' => '回收系統',
    'header_desc' => '配置檔案軟刪除與自動清理策略。',
    'overviewTitle' => '核心配置',
    'overviewDesc' => '啟用/禁用回收站系統並設置保留規則。',
    'enable' => '啟用回收系統',
    'enable_help' => '推薦。檔案將被移動到隱藏存儲區，而不是立即刪除。',
    'retention' => '全域保留期限 (天)',
    'retention_help' => '指定檔案在被系統定時任務永久清除前在回收站中保留的時間。',
    'saving' => '正在保存配置...',
    'save' => '更新設置',
    'save_success' => '回收系統設置已保存！',
    'notice' => '系統提示',
    'notice_body' => '回收系統中的檔案仍會佔用用戶配額下的磁盤空間。遭回收的檔案存放在伺服器根目錄的 .bp_trash 中。',
];
