<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => ':attribute を承認してください。',
    'active_url' => ':attribute は有効なURLではありません。',
    'after' => ':attribute には :date より後の日付を指定してください。',
    'after_or_equal' => ':attribute には :date 以降の日付を指定してください。',
    'alpha' => ':attribute には英字のみ使用できます。',
    'alpha_dash' => ':attribute には英数字とダッシュ、アンダースコアのみ使用できます。',
    'alpha_num' => ':attribute には英数字のみ使用できます。',
    'array' => ':attribute は配列である必要があります。',
    'before' => ':attribute には :date より前の日付を指定してください。',
    'before_or_equal' => ':attribute には :date 以前の日付を指定してください。',
    'between' => [
        'numeric' => ':attribute には :min から :max の間の数値を指定してください。',
        'file' => ':attribute には :min KB から :max KB の間のファイルを指定してください。',
        'string' => ':attribute には :min 文字から :max 文字の間で指定してください。',
        'array' => ':attribute には :min 個から :max 個の項目を指定してください。',
    ],
    'boolean' => ':attribute は true か false である必要があります。',
    'confirmed' => ':attribute の確認が一致しません。',
    'date' => ':attribute は有効な日付ではありません。',
    'date_format' => ':attribute は :format 形式と一致しません。',
    'different' => ':attribute と :other には異なる値を指定してください。',
    'digits' => ':attribute は :digits 桁である必要があります。',
    'digits_between' => ':attribute は :min 桁から :max 桁の間である必要があります。',
    'dimensions' => ':attribute は無効な画像サイズです。',
    'distinct' => ':attribute に重複した値が存在します。',
    'email' => ':attribute は有効なメールアドレスである必要があります。',
    'exists' => '選択された :attribute は無効です。',
    'file' => ':attribute はファイルである必要があります。',
    'filled' => ':attribute は必須です。',
    'image' => ':attribute は画像である必要があります。',
    'in' => '選択された :attribute は無効です。',
    'in_array' => ':attribute は :other に存在しません。',
    'integer' => ':attribute は整数である必要があります。',
    'ip' => ':attribute は有効なIPアドレスである必要があります。',
    'json' => ':attribute は有効なJSON文字列である必要があります。',
    'max' => [
        'numeric' => ':attribute は :max 以下の数値を指定してください。',
        'file' => ':attribute は :max KB 以下のファイルを指定してください。',
        'string' => ':attribute は :max 文字以下で指定してください。',
        'array' => ':attribute の項目数は :max 個以下である必要があります。',
    ],
    'mimes' => ':attribute には :values タイプのファイルを指定してください。',
    'mimetypes' => ':attribute には :values タイプのファイルを指定してください。',
    'min' => [
        'numeric' => ':attribute は :min 以上の数値を指定してください。',
        'file' => ':attribute は :min KB 以上のファイルを指定してください。',
        'string' => ':attribute は :min 文字以上で指定してください。',
        'array' => ':attribute の項目数は :min 個以上である必要があります。',
    ],
    'not_in' => '選択された :attribute は無効です。',
    'numeric' => ':attribute は数値である必要があります。',
    'present' => ':attribute は存在している必要があります。',
    'regex' => ':attribute の形式が無効です。',
    'required' => ':attribute は必須です。',
    'required_if' => ':other が :value の時、:attribute は必須です。',
    'required_unless' => ':other が :values 以外の時、:attribute は必須です。',
    'required_with' => ':values が存在する場合、:attribute は必須です。',
    'required_with_all' => ':values がすべて存在する場合、:attribute は必須です。',
    'required_without' => ':values が存在しない場合、:attribute は必須です。',
    'required_without_all' => ':values がすべて存在しない場合、:attribute は必須です。',
    'same' => ':attribute と :other は一致している必要があります。',
    'size' => [
        'numeric' => ':attribute は :size である必要があります。',
        'file' => ':attribute は :size KB である必要があります。',
        'string' => ':attribute は :size 文字である必要があります。',
        'array' => ':attribute には :size 個の項目が含まれている必要があります。',
    ],
    'string' => ':attribute は文字列である必要があります。',
    'timezone' => ':attribute は有効なタイムゾーンである必要があります。',
    'unique' => ':attribute は既に使用されています。',
    'uploaded' => ':attribute のアップロードに失敗しました。',
    'url' => ':attribute の形式が無効です。',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap attribute place-holders
    | with something more reader friendly such as E-Mail Address instead
    | of "email". This simply helps us make messages a little cleaner.
    |
    */

    'attributes' => [],

    // Internal validation logic for Pterodactyl
    'internal' => [
        'variable_value' => ':env 変数',
        'invalid_password' => 'このアカウントに提供されたパスワードは無効です。',
    ],
];
