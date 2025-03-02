-- name: AssumeUserID :exec
SET LOCAL digi_baton.current_user_id = $1;
