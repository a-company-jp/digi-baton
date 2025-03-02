-- name: ListDisclosedAccountsByReceiverId :many
SELECT *
FROM accounts
JOIN trusts t ON accounts.trust_id = t.id
WHERE t.receiver_user_id = $1 AND accounts.is_disclosed = true;

-- name: ListDisclosedDevicesByReceiverId :many
SELECT *
FROM devices
JOIN trusts t ON devices.trust_id = t.id
WHERE t.receiver_user_id = $1 AND devices.is_disclosed = true;
