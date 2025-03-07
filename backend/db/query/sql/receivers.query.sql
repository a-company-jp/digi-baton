-- name: ListReceiversByUserId :many
SELECT trusts.id as trust_id, users.clerk_user_id, users.id AS user_id 
FROM trusts
JOIN users ON trusts.receiver_user_id = users.id
WHERE trusts.passer_user_id = $1;
