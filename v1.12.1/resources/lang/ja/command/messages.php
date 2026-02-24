<?php

return [
    'location' => [
        'no_location_found' => '提供された短いコードに一致するレコードが見つかりません。',
        'ask_short' => '場所の短いコード',
        'ask_long' => '場所の説明',
        'created' => '新しい場所 (:name) が正常に作成されました。ID: :id',
        'deleted' => '要求された場所が正常に削除されました。',
    ],
    'user' => [
        'search_users' => 'ユーザー名、ユーザーID、またはメールアドレスを入力してください',
        'select_search_user' => '削除するユーザーのID（\'0\' を入力して再検索）',
        'deleted' => 'ユーザーがパネルから正常に削除されました。',
        'confirm_delete' => '本当にこのユーザーをパネルから削除しますか？',
        'no_users_found' => '提供された検索条件に一致するユーザーが見つかりません。',
        'multiple_found' => '提供されたユーザーに一致するアカウントが複数見つかりました。--no-interaction フラグが設定されているため、ユーザーを削除できません。',
        'ask_admin' => 'このユーザーは管理者ですか？',
        'ask_email' => 'メールアドレス',
        'ask_username' => 'ユーザー名',
        'ask_name_first' => '名',
        'ask_name_last' => '氏',
        'ask_password' => 'パスワード',
        'ask_password_tip' => 'システムによってランダムに生成され、メールで送信されるパスワードを使用してアカウントを作成したい場合は、このコマンドを再実行 (CTRL+C) し、`--no-password` フラグを渡してください。',
        'ask_password_help' => 'パスワードは少なくとも8文字以上で、少なくとも1つの大文字と数字を含める必要があります。',
        '2fa_help_text' => [
            'ユーザーが2要素認証を有効にしている場合、このコマンドはそのアカウントの2要素認証を無効にします。これは、ユーザーがアカウントからロックアウトされた場合の救済用コマンドとしてのみ使用してください。',
            'これが目的の動作でない場合は、CTRL+C を押してこのプロセスを終了してください。',
        ],
        '2fa_disabled' => ':email の2要素認証が無効になりました。',
    ],
    'schedule' => [
        'output_line' => '`:schedule` (:hash) 内の最初のタスクにジョブを割り当てています。',
    ],
    'maintenance' => [
        'deleting_service_backup' => 'サービスバックアップファイル :file を削除しています。',
    ],
    'server' => [
        'rebuild_failed' => 'ノード ":node" 上の ":name" (#:id) の再構築リクエストが失敗しました。エラー: :message',
        'reinstall' => [
            'failed' => 'ノード ":node" 上の ":name" (#:id) の再インストールリクエストが失敗しました。エラー: :message',
            'confirm' => '一連のサーバーに対して再インストールを実行しようとしています。続行しますか？',
        ],
        'power' => [
            'confirm' => ':count 台のサーバーに対して :action を実行しようとしています。続行しますか？',
            'action_failed' => 'ノード ":node" 上の ":name" (#:id) の電源操作リクエストが失敗しました。エラー: :message',
        ],
    ],
    'environment' => [
        'mail' => [
            'ask_smtp_host' => 'SMTP ホスト (例: smtp.gmail.com)',
            'ask_smtp_port' => 'SMTP ポート',
            'ask_smtp_username' => 'SMTP ユーザー名',
            'ask_smtp_password' => 'SMTP パスワード',
            'ask_mailgun_domain' => 'Mailgun ドメイン',
            'ask_mailgun_endpoint' => 'Mailgun エンドポイント',
            'ask_mailgun_secret' => 'Mailgun シークレット',
            'ask_mandrill_secret' => 'Mandrill シークレット',
            'ask_postmark_username' => 'Postmark API キー',
            'ask_driver' => 'メール送信に使用するドライバー',
            'ask_mail_from' => 'メールの送信元アドレス',
            'ask_mail_name' => 'メールの表示名',
            'ask_encryption' => '使用する暗号化方法',
        ],
    ],
];
