<?php

return [
    'daemon_connection_failed' => 'デーモンとの通信中に例外が発生し、HTTP/:code レスポンスコードが返されました。この例外はログに記録されました。',
    'node' => [
        'servers_attached' => 'ノードを削除する前に、そのノードにサーバーが関連付けられていないことを確認する必要があります。',
        'daemon_off_config_updated' => 'デーモンの設定は更新されましたが、デーモン上の設定ファイルを自動的に更新しようとした際にエラーが発生しました。変更を適用するには、デーモンの設定ファイル（config.yml）を手動で更新する必要があります。',
    ],
    'allocations' => [
        'server_using' => '現在、この割り当てにサーバーが割り当てられています。割り当てを削除できるのは、サーバーが割り当てられていない場合のみです。',
        'too_many_ports' => '一度に単一の範囲内で1000個を超えるポートを追加することはサポートされていません。',
        'invalid_mapping' => ':port に提供されたマッピングは無効で、処理できませんでした。',
        'cidr_out_of_range' => 'CIDR表記では、/25から/32の間のマスクのみが許可されます。',
        'port_out_of_range' => '割り当てのポートは1024より大きく、65535以下である必要があります。',
    ],
    'nest' => [
        'delete_has_servers' => 'アクティブなサーバーが関連付けられているNestをパネルから削除することはできません。',
        'egg' => [
            'delete_has_servers' => 'アクティブなサーバーが関連付けられているEggをパネルから削除することはできません。',
            'invalid_copy_id' => 'スクリプトのコピー元のEggが存在しないか、それ自体がスクリプトをコピーしています。',
            'must_be_child' => 'このEggの「設定をコピー元」ディレクティブは、選択したNestの子である必要があります。',
            'has_children' => 'このEggは1つ以上の他のEggの親です。このEggを削除する前に、それらのEggを削除してください。',
        ],
        'variables' => [
            'env_not_unique' => '環境変数 :name は、このEgg内で一意である必要があります。',
            'reserved_name' => '環境変数 :name は保護されており、変数に割り当てることはできません。',
            'bad_validation_rule' => 'バリデーションルール ":rule" は、このアプリケーションの有効なルールではありません。',
        ],
        'importer' => [
            'json_error' => 'JSONファイルの解析中にエラーが発生しました: :error',
            'file_error' => '提供されたJSONファイルは無効です。',
            'invalid_json_provided' => '提供されたJSONファイルは認識可能な形式ではありません。',
        ],
    ],
    'subusers' => [
        'editing_self' => 'あなた自身のサブユーザーアカウントを編集することは許可されていません。',
        'user_is_owner' => 'サーバーの所有者をそのサーバーのサブユーザーとして追加することはできません。',
        'subuser_exists' => 'そのメールアドレスを持つユーザーは、すでにこのサーバーのサブユーザーとして割り当てられています。',
    ],
    'databases' => [
        'delete_has_databases' => 'アクティブなデータベースに関連付けられているホストサーバーを削除することはできません。',
    ],
    'tasks' => [
        'chain_interval_too_long' => 'チェーンタスク의最大間隔時間は15分です。',
    ],
    'locations' => [
        'has_nodes' => 'アクティブなノードが関連付けられている場所を削除することはできません。',
    ],
    'users' => [
        'node_revocation_failed' => '<a href=":link">ノード #:node</a> 上のキーの取り消しに失敗しました。 :error',
    ],
    'deployment' => [
        'no_viable_nodes' => '自動デプロイの要件を満たすノードが見つかりませんでした。',
        'no_viable_allocations' => '自動デプロイの要件を満たす割り当てが見つかりませんでした。',
    ],
    'api' => [
        'resource_not_found' => '要求されたリソースはこのサーバーに存在しません。',
    ],
];
