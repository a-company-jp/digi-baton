-- name: GetAccount :one
SELECT accounts.*
FROM accounts
WHERE accounts.id = $1;

-- name: ListAccountsByPasserId :many
SELECT accounts.*
FROM accounts
WHERE accounts.passer_id = $1
ORDER BY accounts.id DESC;

-- name: ListDisclosedAccountsByReceiverId :many
SELECT accounts.*
FROM accounts
JOIN trusts t ON accounts.trust_id = t.id
WHERE t.receiver_user_id = $1 AND accounts.is_disclosed = true;
