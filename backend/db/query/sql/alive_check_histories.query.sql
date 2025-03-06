-- name: GetAliveCheckHistory :one
SELECT * FROM alive_check_histories WHERE id = $1;

-- name: ListAliveCheckHistoriesByTargetUserId :many
SELECT * FROM alive_check_histories WHERE target_user_id = $1;
