-- name: ListAccountsByReceiverId :many
SELECT *
FROM accounts
JOIN trusts t ON accounts.trust_id = t.id
WHERE t.receiver_user_id = $1;

-- name: ListDevicesByReceiverId :many
SELECT *
FROM devices
JOIN trusts t ON devices.trust_id = t.id
WHERE t.receiver_user_id = $1;
