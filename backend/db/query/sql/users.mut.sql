-- name: CreateUser :one
INSERT INTO users(id,
                  default_receiver_id,
                  clerk_user_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateUser :one
UPDATE users
SET default_receiver_id = $2,
    clerk_user_id = $3
WHERE id = $1
RETURNING *;
