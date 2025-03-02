// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: passer.sql

package query

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const getAccountsByPasserID = `-- name: GetAccountsByPasserID :many
SELECT id, app_template_id, app_name, app_description, app_icon_url, account_username, enc_password, memo, pls_delete, message, passer_id, trust_id, is_disclosed, custom_data FROM accounts WHERE passer_id = $1
`

func (q *Queries) GetAccountsByPasserID(ctx context.Context, passerID pgtype.UUID) ([]Account, error) {
	rows, err := q.db.Query(ctx, getAccountsByPasserID, passerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Account
	for rows.Next() {
		var i Account
		if err := rows.Scan(
			&i.ID,
			&i.AppTemplateID,
			&i.AppName,
			&i.AppDescription,
			&i.AppIconUrl,
			&i.AccountUsername,
			&i.EncPassword,
			&i.Memo,
			&i.PlsDelete,
			&i.Message,
			&i.PasserID,
			&i.TrustID,
			&i.IsDisclosed,
			&i.CustomData,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
