-- name: CreateSubscription :one
INSERT INTO subscriptions(
    service_name,
    icon_url,
    username,
    email,
    enc_password,
    amount,
    currency,
    billing_cycle,
    memo,
    pls_delete,
    message,
    passer_id,
    trust_id,
    is_disclosed,
    custom_data
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, $14)
RETURNING *;

-- name: UpdateSubscription :one
UPDATE subscriptions
SET service_name = $2,
    icon_url = $3,
    username = $4,
    email = $5,
    enc_password = $6,
    amount = $7,
    currency = $8,
    billing_cycle = $9,
    memo = $10,
    message = $11,
    custom_data = $12
WHERE id = $1
RETURNING *;

-- name: DeleteSubscription :one
DELETE FROM subscriptions
WHERE id = $1 AND passer_id = $2
RETURNING *;

-- name: SetSubscriptionDeleteFlag :one
UPDATE subscriptions
SET pls_delete = $2
WHERE id = $1
RETURNING *;

-- name: SetSubscriptionDisclosureStatus :one
UPDATE subscriptions
SET is_disclosed = $2,
    trust_id = $3
WHERE id = $1
RETURNING *; 