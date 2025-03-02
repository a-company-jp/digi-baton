// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: passer_query.sql

package query

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const listAccountsByPasserID = `-- name: ListAccountsByPasserID :many
SELECT id, app_template_id, app_name, app_description, app_icon_url, account_username, enc_password, memo, pls_delete, message, passer_id, trust_id, is_disclosed, custom_data FROM accounts WHERE passer_id = $1
`

func (q *Queries) ListAccountsByPasserID(ctx context.Context, passerID pgtype.UUID) ([]Account, error) {
	rows, err := q.db.Query(ctx, listAccountsByPasserID, passerID)
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

const listDevicesByPasserID = `-- name: ListDevicesByPasserID :many
SELECT id, device_type, credential_type, device_description, device_username, enc_password, memo, message, passer_id, trust_id, is_disclosed, custom_data FROM devices WHERE passer_id = $1
`

func (q *Queries) ListDevicesByPasserID(ctx context.Context, passerID pgtype.UUID) ([]Device, error) {
	rows, err := q.db.Query(ctx, listDevicesByPasserID, passerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Device
	for rows.Next() {
		var i Device
		if err := rows.Scan(
			&i.ID,
			&i.DeviceType,
			&i.CredentialType,
			&i.DeviceDescription,
			&i.DeviceUsername,
			&i.EncPassword,
			&i.Memo,
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
