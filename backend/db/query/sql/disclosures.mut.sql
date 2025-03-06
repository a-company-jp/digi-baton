-- name: CreateDisclosure :one
INSERT INTO disclosures(requester_id,
                        passer_id,
                        issued_time,
                        deadline,
                        custom_data,
                        disclosed,
                        in_progress)
VALUES ($1, $2, $3, $4, $5, false, true)
RETURNING *;

-- name: UpdateDisclosure :one
UPDATE disclosures
SET requester_id = $2,
    passer_id = $3,
    disclosed = $4,
    deadline = $5,
    prevented_by = $6,
    custom_data = $7,
    in_progress = $8
WHERE id = $1 AND requester_id = $2
RETURNING *;

-- name: DeleteDisclosure :one
DELETE FROM disclosures
WHERE id = $1 AND requester_id = $2
RETURNING *;
