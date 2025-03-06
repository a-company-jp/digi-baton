-- name: CreateAliveCheckHistory :one
INSERT INTO alive_check_histories(id,
                                target_user_id,
                                check_method,
                                check_time,
                                check_success,
                                custom_data)
VALUES ($1, $2, $3, $4, false, $5)
RETURNING *;

-- name: UpdateAliveCheckHistory :one
UPDATE alive_check_histories
SET check_method = $2,
    check_success = $3,
    check_success_time = $4,
    custom_data = $5
WHERE id = $1
RETURNING *;

-- name: DeleteAliveCheckHistory :one
DELETE FROM alive_check_histories
WHERE id = $1
RETURNING *;
