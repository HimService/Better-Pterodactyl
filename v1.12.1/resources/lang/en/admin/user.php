<?php

return [
    'exceptions' => [
        'delete_self' => 'You cannot delete your own account.',
        'user_has_servers' => 'Cannot delete a user with active servers under their account. Please delete their servers before continuing.',
    ],
    'notices' => [
        'account_created' => 'Account has been successfully created.',
        'account_updated' => 'Account has been successfully updated.',
    ],
    'generated_password' => 'Generated Password',
    'index' => [
        'title' => 'User List',
        'description' => 'All registered users in the system.',
        'list' => 'User List',
        'create_new' => 'Create New User',
        'client_name' => 'Client Name',
        'servers_owned' => 'Servers Owned',
        'servers_owned_tooltip' => 'Servers where this user is marked as the owner.',
        'can_access' => 'Servers Can Access',
        'can_access_tooltip' => 'Servers this user has access to by being marked as a subuser.',
    ],
    'new' => [
        'header' => 'Create User',
        'header_help' => 'Add a user to the system.',
        'identity' => 'Identity Details',
        'permissions' => 'Permissions',
        'permissions_help' => 'Set whether this user is an administrator. Administrators have full access to the entire system.',
        'password' => 'Password',
        'password_help' => 'Providing a password is optional. New user emails will prompt the user to create a password on their first login. If a password is provided here, you will need to provide it to the user through other methods.',
    ],
    'view' => [
        'header' => 'Manage User: :name',
        'identity' => 'Identity Details',
        'password' => 'Password',
        'password_help' => 'To keep this user\'s password unchanged, leave blank. If the password is changed, the user will not receive any notification.',
        'permissions' => 'Permissions',
        'delete_user' => 'Delete User',
        'delete_user_help' => 'The account must have no associated servers to be deleted.',
        'update_user' => 'Update User',
    ],
];
