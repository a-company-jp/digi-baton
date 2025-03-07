-- name: GetSubscription :one
SELECT *
FROM subscriptions
WHERE id = $1;

-- name: ListSubscriptions :many
SELECT *
FROM subscriptions
ORDER BY id;

-- name: ListSubscriptionsByPasserId :many
SELECT *
FROM subscriptions
WHERE passer_id = $1
ORDER BY id; 