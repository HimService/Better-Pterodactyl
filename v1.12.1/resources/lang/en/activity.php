<?php

/**
 * Contains all of the translation strings for different activity log
 * events. These should be keyed by the value in front of the colon (:)
 * in the event name. If there is no colon present, they should live at
 * the top level.
 */
return [
    'auth' => [
        'fail' => 'Failed to login',
        'success' => 'Logged in',
        'password-reset' => 'Password reset',
        'reset-password' => 'Requested password reset',
        'checkpoint' => 'Requested two-factor authentication',
        'recovery-token' => 'Used two-factor recovery token',
        'token' => 'Completed two-factor authentication',
        'ip-blocked' => 'Blocked request for :identifier from unlisted IP address',
        'sftp' => [
            'fail' => 'SFTP login failed',
        ],
    ],
    'user' => [
        'account' => [
            'email-changed' => 'Changed email from :old to :new',
            'password-changed' => 'Changed password',
        ],
        'api-key' => [
            'create' => 'Created new API key :identifier',
            'delete' => 'Deleted API key :identifier',
        ],
        'ssh-key' => [
            'create' => 'Added SSH key :fingerprint to account',
            'delete' => 'Removed SSH key :fingerprint from account',
        ],
        'two-factor' => [
            'create' => 'Enabled two-factor authentication',
            'delete' => 'Disabled two-factor authentication',
        ],
    ],
    'server' => [
        'reinstall' => 'Reinstalled server',
        'console' => [
            'command' => 'Executed ":command" on the server',
        ],
        'power' => [
            'start' => 'Started server',
            'stop' => 'Stopped server',
            'restart' => 'Restarted server',
            'kill' => 'Forcibly stopped server process',
        ],
        'backup' => [
            'download' => 'Downloaded :name backup',
            'delete' => 'Deleted :name backup',
            'restore' => 'Restored :name backup (deleted files: :truncate)',
            'restore-complete' => 'Completed restoration of :name backup',
            'restore-failed' => 'Failed to complete restoration of :name backup',
            'start' => 'Started new backup :name',
            'complete' => 'Marked :name backup as complete',
            'fail' => 'Marked :name backup as failed',
            'lock' => 'Locked :name backup',
            'unlock' => 'Unlocked :name backup',
        ],
        'database' => [
            'create' => 'Created new database :name',
            'rotate-password' => 'Rotated password for database :name',
            'delete' => 'Deleted database :name',
        ],
        'file' => [
            'compress_one' => 'Compressed :directory:file',
            'compress_other' => 'Compressed :count files in :directory',
            'read' => 'Viewed the contents of :file',
            'copy' => 'Created a copy of :file',
            'create-directory' => 'Created directory :directory:name',
            'decompress' => 'Decompressed :files in :directory',
            'delete_one' => 'Deleted :directory:files.0',
            'delete_other' => 'Deleted :count files in :directory',
            'download' => 'Downloaded :file',
            'pull' => 'Downloaded remote file from :url to :directory',
            'rename_one' => 'Renamed :directory:files.0.from to :directory:files.0.to',
            'rename_other' => 'Renamed :count files in :directory',
            'write' => 'Wrote new content to :file',
            'upload' => 'Started file upload',
            'uploaded' => 'Uploaded :directory:file',
        ],
        'sftp' => [
            'denied' => 'Blocked SFTP access due to insufficient permissions',
            'create_one' => 'Created :files.0',
            'create_other' => 'Created :count new files',
            'write_one' => 'Modified the contents of :files.0',
            'write_other' => 'Modified the contents of :count files',
            'delete_one' => 'Deleted :files.0',
            'delete_other' => 'Deleted :count files',
            'create-directory_one' => 'Created :files.0 directory',
            'create-directory_other' => 'Created :count directories',
            'rename_one' => 'Renamed :files.0.from to :files.0.to',
            'rename_other' => 'Renamed or moved :count files',
        ],
        'allocation' => [
            'create' => 'Added :allocation to the server',
            'notes' => 'Updated note for :allocation from ":old" to ":new"',
            'primary' => 'Set :allocation as the primary server allocation',
            'delete' => 'Deleted :allocation allocation',
        ],
        'schedule' => [
            'create' => 'Created :name schedule',
            'update' => 'Updated :name schedule',
            'execute' => 'Manually executed :name schedule',
            'delete' => 'Deleted :name schedule',
        ],
        'task' => [
            'create' => 'Created new ":action" task for :name schedule',
            'update' => 'Updated ":action" task for :name schedule',
            'delete' => 'Deleted task for :name schedule',
        ],
        'settings' => [
            'rename' => 'Renamed server from :old to :new',
            'description' => 'Changed server description from :old to :new',
        ],
        'startup' => [
            'edit' => 'Changed :variable variable from ":old" to ":new"',
            'image' => 'Updated server\'s Docker image from :old to :new',
        ],
        'subuser' => [
            'create' => 'Added :email as a subuser',
            'update' => 'Updated subuser permissions for :email',
            'delete' => 'Removed :email as a subuser',
        ],
    ],
];
