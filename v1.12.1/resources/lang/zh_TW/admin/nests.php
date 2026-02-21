<?php

return [
    'notices' => [
        'created' => '已成功建立新的巢 :name。',
        'deleted' => '已成功從面板刪除請求的巢。',
        'updated' => '已成功更新巢設定選項。',
    ],
    'eggs' => [
        'notices' => [
            'imported' => '已成功匯入此蛋及其關聯的變數。',
            'updated_via_import' => '此蛋已使用提供的檔案更新。',
            'deleted' => '已成功從面板刪除請求的蛋。',
            'updated' => '蛋設定已成功更新。',
            'script_updated' => '蛋的安裝腳本已更新，並將在安裝伺服器時執行。',
            'egg_created' => '已成功產下新的蛋。您需要重新啟動任何正在執行的守護行程以套用此新蛋。',
        ],
    ],
    'variables' => [
        'notices' => [
            'variable_deleted' => '變數 ":variable" 已被刪除，重新建置後伺服器將不再可使用它。',
            'variable_updated' => '變數 ":variable" 已更新。您需要重新建置任何使用此變數的伺服器才能套用變更。',
            'variable_created' => '新變數已成功建立並指派給此蛋。',
        ],
    ],
];
