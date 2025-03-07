-- name: ListReceiversByUserId :many
SELECT *
FROM trusts
JOIN users ON trusts.receiver_user_id = users.id
WHERE trusts.passer_user_id = $1;
