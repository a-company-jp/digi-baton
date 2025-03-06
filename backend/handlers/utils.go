package handlers

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/google/uuid"
)


func toPGUUID(id string) (pgtype.UUID, error) {
	UUID, err := uuid.Parse(id)
	if err != nil {
		return pgtype.UUID{}, err
	}
	var u [16]byte
	copy(u[:], UUID[:])

	return pgtype.UUID{Bytes: u, Valid: true}, nil
}

func toPGTimestamp(time time.Time) (pgtype.Timestamp) {
	return pgtype.Timestamp{Time: time, Valid: true}
}
