-- name: GetPasskeyByUserAndRp :one
SELECT id,
       user_id,
       rp_id,
       private_key
FROM passkeys
WHERE user_id = $1
  AND rp_id = $2;
