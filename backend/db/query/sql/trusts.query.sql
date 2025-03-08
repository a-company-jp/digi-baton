-- name: GetTrust :one
SELECT *
FROM trusts
WHERE id = $1;

-- name: ListTrustsByPasserID :many
SELECT *
FROM trusts
WHERE passer_user_id = $1;

-- name: ListTrustersByReceiverID :many
SELECT u.id, u.clerk_user_id
FROM trusts
         LEFT JOIN public.users u on trusts.passer_user_id = u.id
WHERE receiver_user_id = $1;
