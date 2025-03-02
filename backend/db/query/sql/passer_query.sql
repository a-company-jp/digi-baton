-- name: ListAccountsByPasserID :many
SELECT * FROM accounts WHERE passer_id = $1;

-- name: ListDevicesByPasserID :many
SELECT * FROM devices WHERE passer_id = $1;
