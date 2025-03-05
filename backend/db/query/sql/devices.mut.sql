-- name: CreateDevice :one
INSERT INTO devices(id,
                    device_type,
                    credential_type,
                    device_description,
                    device_username,
                    enc_password,
                    memo,
                    message,
                    passer_id,
                    trust_id,
                    is_disclosed,
                    custom_data)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11)
RETURNING *;

-- name: UpdateDevice :one
UPDATE devices
SET device_type = $2,
    credential_type = $3,
    device_description = $4,
    device_username = $5,
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
