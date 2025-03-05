-- name: GetTrust :one
SELECT * FROM trusts WHERE id = $1;

-- name: ListTrustsByPasserID :many
SELECT * FROM trusts WHERE passer_user_id = $1;
