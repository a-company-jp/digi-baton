-- name: GetDevice :one
SELECT devices.*
FROM devices
WHERE devices.id = $1;

-- name: ListDevicesByPasserId :many
SELECT devices.*
FROM devices
WHERE devices.passer_id = $1
ORDER BY devices.id DESC;

-- name: ListDisclosedDevicesByReceiverId :many
SELECT devices.*
FROM devices
JOIN trusts t ON devices.trust_id = t.id
WHERE t.receiver_user_id = $1 AND devices.is_disclosed = true;
