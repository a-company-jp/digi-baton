INSERT INTO users (
    id,
    default_receiver_id,
    clerk_user_id
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'user_2titmqSTaPcHli3Ac6xWz5nhK9j'
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'user_2tiwmsCOgwgOFdbszDgR2O2SfGS'
);

INSERT INTO app_template (
    id,
    app_name,
    app_description,
    app_icon_url
) VALUES
(
    1,
    'Gmail',
    'Google email service',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/gmail.webp'
),

(
    2,
    'X',
    'Social media platform',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/x.webp'
),

(
    3,
    'Instagram',
    'Social media platform',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/instagram.webp'
);

INSERT INTO accounts (
    app_template_id,
    app_name,
    app_description,
    app_icon_url,
    username,
    email,
    enc_password,
    memo,
    pls_delete,
    message,
    passer_id,
    trust_id,
    is_disclosed,
    custom_data
) VALUES 

(
    1, 
    'Google',
    'Google',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/google.webp',
    '',
    'user1@example.com', 
    '\x0123456789ABCDEF', -- Encrypted password as bytea
    'Personal Google account',
    false, 
    'This is my main google account',
    '00000000-0000-0000-0000-000000000001', -- Sample UUID for passer_id
    null, 
    false, 
    '{"recovery_email": "backup@example.com", "last_login": "2023-01-01"}'::jsonb
),

(
    2, 
    'X', 
    'Social media platform', 
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/x.webp', 
    'exampleuser', 
    '',
    '\xFEDCBA9876543210', -- Encrypted password as bytea
    'Professional X account', 
    false, 
    'Used for work-related communications', 
    '00000000-0000-0000-0000-000000000001', -- Same passer_id as above
    null, 
    false, 
    '{"phone_number": "+1234567890", "two_factor_enabled": true}'::jsonb
),

(
    3, 
    'Instagram', 
    'Social media platform', 
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/instagram.webp', 
    'exampleuser', 
    '',
    '\xFEDCBA9876543210', -- Encrypted password as bytea
    'Professional Instagram account', 
    false, 
    'Used for work-related communications', 
    '00000000-0000-0000-0000-000000000001', -- Same passer_id as above
    null,
    false,
    null
),

(
    NULL, 
    'GitHub', 
    'Git repository service', 
    '', 
    '',
    'user1@example.com', 
    '\x0123456789ABCDEF', -- Encrypted password as bytea
    'Personal GitHub account', 
    false, 
    '', 
    '00000000-0000-0000-0000-000000000001', -- Same passer_id as above
    NULL, 
    false, 
    '{"recovery_email": "backup@example.com", "last_login": "2023-01-01"}'::jsonb
);

INSERT INTO subscriptions (
    service_name,
    icon_url,
    username,
    email,
    enc_password,
    amount,
    currency,
    billing_cycle,
    memo,
    pls_delete,
    message,
    passer_id,
    trust_id,
    is_disclosed,
    custom_data
) VALUES
(
    'Netflix',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/netflix.webp',
    'user1',
    'user1@example.com',
    '\x0123456789ABCDEF', -- Encrypted password as bytea
    1490,
    'JPY',
    'MONTHLY',
    'ファミリープラン',
    false,
    '家族で共有しているNetflixアカウント',
    '00000000-0000-0000-0000-000000000001', -- Sample UUID for passer_id
    null,
    false,
    '{"payment_method": "credit_card", "next_billing_date": "2023-06-15"}'::jsonb
),
(
    'Spotify',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/spotify.webp',
    'musiclover42',
    'user1@example.com',
    '\xFEDCBA9876543210', -- Encrypted password as bytea
    980,
    'JPY',
    'MONTHLY',
    'プレミアムプラン',
    false,
    '音楽ストリーミングサービス',
    '00000000-0000-0000-0000-000000000001',
    null,
    false,
    '{"payment_method": "paypal", "auto_renew": true}'::jsonb
),
(
    'Amazon Prime',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/prime-video.webp',
    '',
    'user1@example.com',
    '\x1A2B3C4D5E6F7890', -- Encrypted password as bytea
    5900,
    'JPY',
    'YEARLY',
    'Amazonプライム会員',
    false,
    '配送無料とPrimeビデオを利用中',
    '00000000-0000-0000-0000-000000000001',
    null,
    false,
    '{"member_since": "2020-03-10", "benefits": ["free_shipping", "prime_video", "prime_reading"]}'::jsonb
),
(
    'Adobe Creative Cloud',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/adobe.webp',
    'designer123',
    'user1@example.com',
    '\x9876543210FEDCBA', -- Encrypted password as bytea
    6580,
    'JPY',
    'MONTHLY',
    'フォトグラフィプラン',
    false,
    '写真編集に使用',
    '00000000-0000-0000-0000-000000000001',
    null,
    false,
    '{"apps": ["photoshop", "lightroom"], "storage": "20GB"}'::jsonb
),
(
    'YouTube Premium',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/youtube-premium.webp',
    '',
    'user1@example.com',
    '\xABCDEF0123456789', -- Encrypted password as bytea
    1180,
    'JPY',
    'MONTHLY',
    '広告なしでYouTube視聴',
    false,
    'YouTube Musicも含まれる',
    '00000000-0000-0000-0000-000000000001',
    null,
    false,
    '{"family_plan": false, "youtube_music": true}'::jsonb
);

INSERT INTO devices (
    device_type,
    device_description,
    device_username,
    device_icon_url,
    enc_password,
    memo,
    message,
    passer_id,
    trust_id,
    is_disclosed,
    custom_data
) VALUES
(
    1, -- PC
    'MacBook Pro 14インチ',
    'hiroki',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/pc.webp',
    '\x0123456789ABCDEF', -- Encrypted password as bytea
    '仕事用のMacBook',
    'パスワードは大文字小文字と数字を含む',
    '00000000-0000-0000-0000-000000000001', -- Same passer_id as above
    null,
    false,
    '{"purchase_date": "2022-10-15", "os": "macOS Ventura", "serial_number": "C02ZN3YBLVCG"}'::jsonb
),
(
    1, -- PC
    'Windows Desktop PC',
    'user1',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/pc.webp',
    '\xFEDCBA9876543210', -- Encrypted password as bytea
    '自宅のデスクトップPC',
    'ゲームとプライベート作業用',
    '00000000-0000-0000-0000-000000000001',
    null,
    false,
    '{"specs": {"cpu": "Intel Core i7", "ram": "32GB", "storage": "1TB SSD"}, "location": "自宅書斎"}'::jsonb
),
(
    2, -- Phone
    'iPhone 14 Pro',
    'hiroki',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/phone.webp',
    '\x1A2B3C4D5E6F7890', -- Encrypted password as bytea
    'メインスマートフォン',
    'Face IDも設定済み',
    '00000000-0000-0000-0000-000000000001',
    null,
    false,
    '{"phone_number": "+81-90-1234-5678", "icloud_enabled": true, "color": "スペースブラック"}'::jsonb
),
(
    2, -- Phone
    'Google Pixel 7',
    '',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/phone.webp',
    '\x9876543210FEDCBA', -- Encrypted password as bytea
    'テスト用Android端末',
    'アプリ開発のテスト用',
    '00000000-0000-0000-0000-000000000001',
    null,
    false,
    '{"android_version": "Android 13", "screen_lock": "pattern"}'::jsonb
),
(
    3, -- Tablet
    'iPad Pro 11インチ',
    'hiroki-ipad',
    'https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/tablet.webp',
    '\xABCDEF0123456789', -- Encrypted password as bytea
    '出張時のサブデバイス',
    'Apple Pencilでメモを取るのに使用',
    '00000000-0000-0000-0000-000000000001',
    null,
    false,
    '{"accessories": ["Apple Pencil", "Magic Keyboard"], "cellular": true, "storage": "256GB"}'::jsonb
);