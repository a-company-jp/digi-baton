CREATE TABLE passkeys
(
    id            SERIAL PRIMARY KEY,
    user_id       UUID   NOT NULL REFERENCES users (id),
    rp_id         TEXT   NOT NULL,
    credential_id TEXT   NOT NULL,
    user_name     TEXT   NOT NULL,
    public_key    BYTEA  NOT NULL,
    private_key   BYTEA  NOT NULL,
    sign_count    BIGINT NOT NULL,

    CONSTRAINT passkeys_credential_id_unique UNIQUE (credential_id),
    CONSTRAINT passkeys_user_id_rp_id_unique UNIQUE (user_id, rp_id)
);
