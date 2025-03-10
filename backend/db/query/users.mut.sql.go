// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: users.mut.sql

package query

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const createUser = `-- name: CreateUser :one
INSERT INTO users(id,
                  default_receiver_id,
                  clerk_user_id)
VALUES ($1, $2, $3)
RETURNING id, default_receiver_id, clerk_user_id
`

type CreateUserParams struct {
	ID                pgtype.UUID
	DefaultReceiverID pgtype.UUID
	ClerkUserID       string
}

func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (User, error) {
	row := q.db.QueryRow(ctx, createUser, arg.ID, arg.DefaultReceiverID, arg.ClerkUserID)
	var i User
	err := row.Scan(&i.ID, &i.DefaultReceiverID, &i.ClerkUserID)
	return i, err
}

const updateUser = `-- name: UpdateUser :one
UPDATE users
SET default_receiver_id = $2,
    clerk_user_id = $3
WHERE id = $1
RETURNING id, default_receiver_id, clerk_user_id
`

type UpdateUserParams struct {
	ID                pgtype.UUID
	DefaultReceiverID pgtype.UUID
	ClerkUserID       string
}

func (q *Queries) UpdateUser(ctx context.Context, arg UpdateUserParams) (User, error) {
	row := q.db.QueryRow(ctx, updateUser, arg.ID, arg.DefaultReceiverID, arg.ClerkUserID)
	var i User
	err := row.Scan(&i.ID, &i.DefaultReceiverID, &i.ClerkUserID)
	return i, err
}
