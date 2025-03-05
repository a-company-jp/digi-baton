package handlers

import "github.com/jackc/pgx/v5/pgtype"


func toPGUUID(uuid string) (pgtype.UUID, error) {
	var pgUUID pgtype.UUID
	if err := pgUUID.Scan(uuid); err != nil {
		return pgUUID, err
	}
	return pgUUID, nil
}
