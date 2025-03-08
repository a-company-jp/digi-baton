-- name: GetUserByClerkID :one
SELECT * FROM users
WHERE clerk_user_id = $1
LIMIT 1; 

-- name: ListUsers :many
SELECT * FROM users; 