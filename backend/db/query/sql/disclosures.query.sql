-- name: GetDisclosure :one
SELECT * FROM disclosures WHERE id = $1;

-- name: ListDisclosuresByRequesterId :many
SELECT * FROM disclosures WHERE requester_id = $1;
