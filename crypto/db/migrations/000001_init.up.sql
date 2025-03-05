-- 001_init.up.sql
CREATE TABLE IF NOT EXISTS user_keys (
    user_id TEXT PRIMARY KEY,
    private_key TEXT NOT NULL,
    public_key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS encryption_decryption_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

