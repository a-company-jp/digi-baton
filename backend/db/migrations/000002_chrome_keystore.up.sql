CREATE TABLE passkeys
(
    id          SERIAL PRIMARY KEY,
    user_id     UUID  NOT NULL REFERENCES users (id),
    rp_id       TEXT  NOT NULL,
    private_key BYTEA NOT NULL,
    CONSTRAINT passkeys_user_id_rp_id_unique UNIQUE (user_id, rp_id)
);
