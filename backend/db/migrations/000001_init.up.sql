-- ===============================
-- 1. Users
-- ===============================
CREATE TABLE users
(
    id                  UUID PRIMARY KEY,
    -- 自分自身の id を参照する外部キー(受け取り手のデフォルト)
    default_receiver_id UUID REFERENCES users (id),
    clerk_user_id       TEXT NOT NULL
);

-- ===============================
-- 2. AliveCheckHistories
-- ===============================
CREATE TABLE alive_check_histories
(
    id                 UUID PRIMARY KEY,
    target_user_id     UUID                        NOT NULL REFERENCES users (id),
    check_time         TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    check_method       INTEGER                     NOT NULL,
    check_success      BOOLEAN                     NOT NULL,
    check_success_time TIMESTAMP WITHOUT TIME ZONE,
    custom_data        JSONB
);

-- ===============================
-- 3. Trusts
-- ===============================
CREATE TABLE trusts
(
    id               SERIAL PRIMARY KEY,
    receiver_user_id UUID NOT NULL REFERENCES users (id),
    passer_user_id   UUID NOT NULL REFERENCES users (id)
);

-- ===============================
-- 4. AppTemplate
-- ===============================
CREATE TABLE app_template
(
    id              SERIAL PRIMARY KEY,
    app_name        TEXT NOT NULL,
    app_description TEXT NOT NULL,
    app_icon_url    TEXT NOT NULL
);

-- ===============================
-- 5. Accounts (RLSを適用)
-- ===============================
CREATE TABLE accounts
(
    id               SERIAL PRIMARY KEY,
    app_template_id  INTEGER REFERENCES app_template (id),
    app_name         TEXT,
    app_description  TEXT,
    app_icon_url     TEXT,
    username TEXT    NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    enc_password     BYTEA   NOT NULL,
    memo             TEXT    NOT NULL,
    pls_delete       BOOLEAN NOT NULL,
    message          TEXT    NOT NULL,
    passer_id        UUID    NOT NULL REFERENCES users (id),
    trust_id         INTEGER REFERENCES trusts (id),
    is_disclosed     BOOLEAN NOT NULL,
    custom_data      JSONB
);

-- RLS を有効化
ALTER TABLE accounts
    ENABLE ROW LEVEL SECURITY;

-- （例）SELECT 用ポリシー: passer_id = ログインユーザ もしくは is_disclosed = true かつ Trust 関係がある
CREATE POLICY accounts_select
    ON accounts
    FOR SELECT
    TO PUBLIC
    USING (
    -- 自分が "passer" の場合
    (passer_id = current_setting('digi_baton.current_user_id')::uuid)
        OR
        -- is_disclosed = true かつ、Trusts で結ばれている場合
    (
        is_disclosed
            AND EXISTS (SELECT 1
                        FROM trusts t
                        WHERE t.id = accounts.trust_id
                          AND t.receiver_user_id = current_setting('digi_baton.current_user_id')::uuid
                          AND t.passer_user_id = accounts.passer_id)
        )
    );

-- （例）INSERT/UPDATE/DELETE 用のポリシー: passer_id が自分のときのみ操作可
CREATE POLICY accounts_modification
    ON accounts
    FOR ALL -- INSERT, UPDATE, DELETEすべてを対象
    TO PUBLIC
    USING (
    passer_id = current_setting('digi_baton.current_user_id')::uuid
    )
    WITH CHECK (
    passer_id = current_setting('digi_baton.current_user_id')::uuid
    );

-- ===============================
-- 6. Devices (RLSを適用)
-- ===============================
CREATE TABLE devices
(
    id                 SERIAL PRIMARY KEY,
    device_type        INTEGER NOT NULL, -- 1=PC, 2=mobile etc
    device_description TEXT,
    device_username    TEXT,
    enc_password       BYTEA   NOT NULL,
    memo               TEXT    NOT NULL,
    message            TEXT    NOT NULL,
    passer_id          UUID    NOT NULL REFERENCES users (id),
    trust_id           INTEGER REFERENCES trusts (id),
    is_disclosed       BOOLEAN NOT NULL,
    custom_data        JSONB
);

ALTER TABLE devices
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY devices_select
    ON devices
    FOR SELECT
    TO PUBLIC
    USING (
    (passer_id = current_setting('digi_baton.current_user_id')::uuid)
        OR
    (
        is_disclosed
            AND EXISTS (SELECT 1
                        FROM trusts t
                        WHERE t.id = devices.trust_id
                          AND t.receiver_user_id = current_setting('digi_baton.current_user_id')::uuid
                          AND t.passer_user_id = devices.passer_id)
        )
    );

CREATE POLICY devices_modification
    ON devices
    FOR ALL
    TO PUBLIC
    USING (
    passer_id = current_setting('digi_baton.current_user_id')::uuid
    )
    WITH CHECK (
    passer_id = current_setting('digi_baton.current_user_id')::uuid
    );

-- ===============================
-- 7. Disclosures
-- ===============================
CREATE TABLE disclosures
(
    id           SERIAL PRIMARY KEY,
    requester_id UUID                        NOT NULL REFERENCES users (id),
    passer_id    UUID                        NOT NULL REFERENCES users (id),
    issued_time  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    in_progress  BOOLEAN                     NOT NULL,
    disclosed    BOOLEAN                     NOT NULL,
    disclosed_at TIMESTAMP WITHOUT TIME ZONE,
    -- AliveCheckHistories.id を参照
    prevented_by UUID REFERENCES alive_check_histories (id),
    deadline     TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    custom_data  JSONB
);

-- ===============================
-- 8. Subscriptions (RLSを適用)
-- ===============================
CREATE TABLE subscriptions
(
    id               SERIAL PRIMARY KEY,
    service_name         TEXT,
    username TEXT    NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    enc_password     BYTEA   NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    billing_cycle TEXT NOT NULL,
    memo             TEXT    NOT NULL,
    pls_delete       BOOLEAN NOT NULL,
    message          TEXT    NOT NULL,
    passer_id        UUID    NOT NULL REFERENCES users (id),
    trust_id         INTEGER REFERENCES trusts (id),
    is_disclosed     BOOLEAN NOT NULL,
    custom_data      JSONB
);
