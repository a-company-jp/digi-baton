-- name: CreateAccount :one
INSERT INTO accounts(app_template_id,
                    app_name,
                    app_description,
                    app_icon_url,
                    account_username,
                    enc_password,
                    memo,
                    pls_delete,
                    message,
                    passer_id,
                    trust_id,
                    is_disclosed,
                    custom_data)
VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9, null, false, $10)
RETURNING *;

-- name: UpdateAccount :one
UPDATE accounts
SET app_template_id = $2,
    app_name = $3,
    app_description = $4,
    app_icon_url = $5,
    account_username = $6,
    enc_password = $7,
    memo = $8,
    message = $9,
    custom_data = $10
WHERE id = $1 AND passer_id = $11
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
