<?php

return [
    'header' => 'Recycle System',
    'header_desc' => 'Configure file soft-deletion and automated cleanup policies.',
    'overviewTitle' => 'Core Configuration',
    'overviewDesc' => 'Enable/disable the trash system and set retention rules.',
    'enable' => 'Enable Recycle System',
    'enable_help' => 'Recommended. Files will be moved to hidden storage instead of immediate deletion.',
    'retention' => 'Global Retention Period (Days)',
    'retention_help' => 'Specifies how long files stay in the trash before being permanently purged by the system cron.',
    'saving' => 'Saving Config...',
    'save' => 'Update Settings',
    'save_success' => 'Recycle System settings saved!',
    'notice' => 'System Notice',
    'notice_body' => 'Files in the recycle system still consume disk space under the user\'s allocated quota. Soft-deleted files are stored in .bp_trash at the server root.',
];
