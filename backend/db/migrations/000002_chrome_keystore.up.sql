CREATE TABLE passkeys
(
    id          SERIAL PRIMARY KEY,
    user_id     UUID  NOT NULL REFERENCES users (id),
    private_key BYTEA NOT NULL
);