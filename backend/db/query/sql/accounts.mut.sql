-- name: CreateAccount :one
INSERT INTO accounts(app_template_id,
                    app_name,
                    app_description,
                    app_icon_url,
                    username,
                    email,
                    enc_password,
                    memo,
                    pls_delete,
                    message,
                    passer_id,
                    trust_id,
                    is_disclosed,
                    custom_data)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10, $11, false, $12)
RETURNING *;

-- name: UpdateAccount :one
UPDATE accounts
SET app_template_id = $2,
    app_name = $3,
    app_description = $4,
    app_icon_url = $5,
    username = $6,
    email = $7,
    enc_password = $8,
    memo = $9,
    message = $10,
    custom_data = $11
WHERE id = $1 AND passer_id = $12
RETURNING *;

-- name: DeleteAccount :one
DELETE FROM accounts
WHERE id = $1 AND passer_id = $2
RETURNING *;

-- name: UpdateDeleteRequest :one
UPDATE accounts
SET pls_delete = $2
WHERE id = $1
RETURNING *;


-- name: AssignReceiverToAccount :one
UPDATE accounts
SET trust_id = $2
WHERE id = $1
RETURNING *;

-- name: SetAccountDisclosureStatus :one
UPDATE accounts
SET is_disclosed = $2,
    trust_id = $3
WHERE id = $1
RETURNING *;
