-- name: GetSubscription :one
SELECT *
FROM subscriptions
WHERE id = $1;

-- name: ListSubscriptions :many
SELECT *
FROM subscriptions
ORDER BY id; 