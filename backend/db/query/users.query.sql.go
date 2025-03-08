// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: users.query.sql

package query

import (
	"context"
)

const getUserByClerkID = `-- name: GetUserByClerkID :one
SELECT id, default_receiver_id, clerk_user_id FROM users
WHERE clerk_user_id = $1
LIMIT 1
`

func (q *Queries) GetUserByClerkID(ctx context.Context, clerkUserID string) (User, error) {
	row := q.db.QueryRow(ctx, getUserByClerkID, clerkUserID)
	var i User
	err := row.Scan(&i.ID, &i.DefaultReceiverID, &i.ClerkUserID)
	return i, err
}

const listUsers = `-- name: ListUsers :many
SELECT id, default_receiver_id, clerk_user_id FROM users
`

func (q *Queries) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := q.db.Query(ctx, listUsers)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []User
	for rows.Next() {
		var i User
		if err := rows.Scan(&i.ID, &i.DefaultReceiverID, &i.ClerkUserID); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
