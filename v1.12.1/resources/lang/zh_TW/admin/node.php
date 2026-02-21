<?php

return [
    'validation' => [
        'fqdn_not_resolvable' => '提供的 FQDN 或 IP 位址無法解析為有效的 IP 位址。',
        'fqdn_required_for_ssl' => '需要解析為公共 IP 位址的完全限定網域名稱 (FQDN)，才能為此節點使用 SSL。',
    ],
    'notices' => [
        'allocations_added' => '已成功將分配新增至此節點。',
        'node_deleted' => '節點已成功從面板中移除。',
        'location_required' => '您必須先設定至少一個位置，才能將節點新增至此面板。',
        'node_created' => '已成功建立新節點。您可以前往「設定」分頁在此機器上自動設定守護行程。在您新增任何伺服器之前，您必須先分配至少一個 IP 位址和連接埠。',
        'node_updated' => '節點資訊已更新。如果變更了任何守護行程設定，您需要重新啟動它才能讓這些變更生效。',
        'unallocated_deleted' => '已刪除 <code>:ip</code> 的所有未分配連接埠。',
    ],
];
