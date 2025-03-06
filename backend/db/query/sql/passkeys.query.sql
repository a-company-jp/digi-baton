-- name: GetPasskeysByUserAndRp :one
SELECT id,
       user_id,
       rp_id,
       credential_id,
       user_name,
       public_key,
       private_key,
       sign_count
FROM passkeys
WHERE user_id = $1
  AND rp_id = $2;

-- name: GetPasskeysByUserID :many
SELECT id,
       user_id,
       rp_id,
       credential_id,
       user_name,
       public_key,
       private_key,
       sign_count
FROM passkeys
WHERE user_id = $1;
