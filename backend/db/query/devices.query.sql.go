// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: devices.query.sql

package query

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const getDevice = `-- name: GetDevice :one
SELECT devices.id, devices.device_type, devices.device_description, devices.device_username, devices.device_icon_url, devices.enc_password, devices.memo, devices.message, devices.passer_id, devices.trust_id, devices.is_disclosed, devices.custom_data
FROM devices
WHERE devices.id = $1
`

func (q *Queries) GetDevice(ctx context.Context, id int32) (Device, error) {
	row := q.db.QueryRow(ctx, getDevice, id)
	var i Device
	err := row.Scan(
		&i.ID,
		&i.DeviceType,
		&i.DeviceDescription,
		&i.DeviceUsername,
		&i.DeviceIconUrl,
		&i.EncPassword,
		&i.Memo,
		&i.Message,
		&i.PasserID,
		&i.TrustID,
		&i.IsDisclosed,
		&i.CustomData,
	)
	return i, err
}

const listDevicesByPasserId = `-- name: ListDevicesByPasserId :many
SELECT devices.id, devices.device_type, devices.device_description, devices.device_username, devices.device_icon_url, devices.enc_password, devices.memo, devices.message, devices.passer_id, devices.trust_id, devices.is_disclosed, devices.custom_data
FROM devices
WHERE devices.passer_id = $1
ORDER BY devices.id DESC
`

func (q *Queries) ListDevicesByPasserId(ctx context.Context, passerID pgtype.UUID) ([]Device, error) {
	rows, err := q.db.Query(ctx, listDevicesByPasserId, passerID)
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
			&i.DeviceDescription,
			&i.DeviceUsername,
			&i.DeviceIconUrl,
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

const listDisclosedDevicesByReceiverId = `-- name: ListDisclosedDevicesByReceiverId :many
SELECT devices.id, devices.device_type, devices.device_description, devices.device_username, devices.device_icon_url, devices.enc_password, devices.memo, devices.message, devices.passer_id, devices.trust_id, devices.is_disclosed, devices.custom_data
FROM devices
JOIN trusts t ON devices.trust_id = t.id
WHERE t.receiver_user_id = $1 AND devices.is_disclosed = true
`

func (q *Queries) ListDisclosedDevicesByReceiverId(ctx context.Context, receiverUserID pgtype.UUID) ([]Device, error) {
	rows, err := q.db.Query(ctx, listDisclosedDevicesByReceiverId, receiverUserID)
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
			&i.DeviceDescription,
			&i.DeviceUsername,
			&i.DeviceIconUrl,
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
