-- name: CreateTrust :one
INSERT INTO trusts(receiver_user_id,
                   passer_user_id)
VALUES ($1, $2)
RETURNING *;

-- name: UpdateTrust :one
UPDATE trusts
SET receiver_user_id = $2
WHERE id = $1 AND passer_user_id = $3
RETURNING *;

-- name: DeleteTrust :one
DELETE FROM trusts
WHERE id = $1 AND passer_user_id = $2
RETURNING *;
