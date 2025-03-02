-- name: Register :exec
INSERT INTO users(id,
                  default_receiver_id,
                  clerk_user_id)
VALUES ($1, $2, $3);

-- name: AddDevice :exec
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
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11);

-- name: AddReceiver :exec
INSERT INTO trusts(receiver_user_id,
                   passer_user_id)
VALUES ($1, $2);

-- name: AssignReceiverToAccount :exec
INSERT INTO accounts(trust_id)
VALUES ($1);

-- name: UpdateDefaultReceiver :exec
UPDATE users
SET default_receiver_id = $1
WHERE id = $2;
