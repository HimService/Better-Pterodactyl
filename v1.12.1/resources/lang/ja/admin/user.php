<?php

return [
    'exceptions' => [
        'delete_self' => '自分自身のアカウントを削除することはできません。',
        'user_has_servers' => 'アクティブなサーバーを持っているユーザーを削除することはできません。続行する前に、そのユーザーのサーバーを削除してください。',
    ],
    'notices' => [
        'account_created' => 'アカウントが正常に作成されました。',
        'account_updated' => 'アカウントが正常に更新されました。',
    ],
    'generated_password' => '生成されたパスワード',
    'index' => [
        'title' => 'ユーザーリスト',
        'description' => 'システムに登録されているすべてのユーザー。',
        'list' => 'ユーザーリスト',
        'create_new' => '新しいユーザーを作成',
        'client_name' => '顧客名',
        'servers_owned' => '所有しているサーバー',
        'servers_owned_tooltip' => 'このユーザーが所有者としてマークされているサーバー。',
        'can_access' => 'アクセス可能なサーバー',
        'can_access_tooltip' => 'このユーザーがサブユーザーとしてマークされているため、アクセス可能なサーバー。',
    ],
    'new' => [
        'header' => 'ユーザー作成',
        'header_help' => 'システムに新しいユーザーを追加します。',
        'identity' => 'ID詳細',
        'permissions' => 'アクセス権',
        'permissions_help' => 'このユーザーを管理者に設定するかどうか。管理者はシステム全体にフルアクセスできます。',
        'password' => 'パスワード',
        'password_help' => 'パスワードの提供は任意です。新しいユーザー向けのメールには、初回ログイン時にパスワードを作成するよう案内されます。ここでパスワードを提供した場合は、他の方法でユーザーに提供する必要があります。',
    ],
    'view' => [
        'header' => 'ユーザー管理: :name',
        'identity' => 'ID詳細',
        'password' => 'パスワード',
        'password_help' => 'このユーザーのパスワードを変更しない場合は、空のままにしてください。パスワードが変更された場合、ユーザーに通知は送信されません。',
        'permissions' => 'アクセス権',
        'delete_user' => 'ユーザーを削除',
        'delete_user_help' => 'アカウントに紐づくサーバーがないことが削除の条件です。',
        'update_user' => 'ユーザーを更新',
    ],
];
