-- name: ListAccountsByReceiverId :many
SELECT *
FROM accounts
JOIN trusts t ON accounts.trust_id = t.id
WHERE t.receiver_user_id = $1;
