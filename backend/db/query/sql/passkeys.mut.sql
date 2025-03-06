-- name: SavePasskey :one
INSERT INTO passkeys (user_id,
                      rp_id,
                      private_key)
VALUES ($1, -- user_id
        $2, -- rp_id
        $3 -- private_key
       )
RETURNING id, user_id, rp_id, private_key;
