-- name: CreateDevice :one
INSERT INTO devices(id,
                    device_type,
                    device_description,
                    device_username,
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
    enc_password = $5,
    memo = $6,
    message = $7,
    custom_data = $8
WHERE id = $1
RETURNING *;

-- name: DeleteDevice :one
DELETE FROM devices
WHERE id = $1 AND passer_id = $2
RETURNING *;
