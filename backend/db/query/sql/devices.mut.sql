-- name: CreateDevice :one
INSERT INTO devices(
                    device_type,
                    device_description,
                    device_username,
                    device_icon_url,
                    enc_password,
                    memo,
                    message,
                    passer_id,
                    trust_id,
                    is_disclosed,
                    custom_data)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10)
RETURNING *;

-- name: UpdateDevice :one
UPDATE devices
SET device_type = $2,
    device_description = $3,
    device_username = $4,
    device_icon_url = $5,
    enc_password = $6,
    memo = $7,
    message = $8,
    custom_data = $9
WHERE id = $1
RETURNING *;

-- name: DeleteDevice :one
DELETE FROM devices
WHERE id = $1 AND passer_id = $2
RETURNING *;

-- name: SetDeviceDeleteFlag :one
UPDATE devices
SET pls_delete = $2
WHERE id = $1
RETURNING *;

-- name: SetDeviceDisclosureStatus :one
UPDATE devices
SET is_disclosed = $2,
    trust_id = $3
WHERE id = $1
RETURNING *;
