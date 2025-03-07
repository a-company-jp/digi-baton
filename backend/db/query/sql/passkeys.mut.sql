-- name: CreatePasskey :one
INSERT INTO passkeys (user_id,
                      rp_id,
                      credential_id,
                      user_name,
                      public_key,
                      private_key,
                      sign_count)
VALUES ($1, -- user_id
        $2, -- rp_id
        $3, -- credential_id
        $4, -- user_name
        $5, -- public_key
        $6, -- private_key
        $7 -- sign_count
       )
RETURNING id, user_id, rp_id, credential_id, user_name, public_key, private_key, sign_count;

-- name: UpdateSignCount :exec
UPDATE passkeys
SET sign_count = $2
WHERE credential_id = $1;
