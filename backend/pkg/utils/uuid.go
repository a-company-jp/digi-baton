package utils

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func ToPgxUUID(u uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: u,
		Valid: true,
	}
}

func FromPgxUUID(u pgtype.UUID) (uuid.UUID, error) {
	if !u.Valid {
		return uuid.UUID{}, fmt.Errorf("pgtype.UUID is invalid (NULL)")
	}
	return uuid.UUID(u.Bytes), nil
}
