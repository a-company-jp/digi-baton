-- name: GetAccountsByPasserID :many
SELECT * FROM accounts WHERE passer_id = $1;
