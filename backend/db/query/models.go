// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0

package query

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type Account struct {
	ID              int32
	AppTemplateID   pgtype.Int4
	AppName         pgtype.Text
	AppDescription  pgtype.Text
	AppIconUrl      pgtype.Text
	AccountUsername string
	EncPassword     []byte
	Memo            string
	PlsDelete       bool
	Message         string
	PasserID        pgtype.UUID
	TrustID         pgtype.Int4
	IsDisclosed     bool
	CustomData      []byte
}

type Device struct {
	ID                int32
	DeviceType        int32
	CredentialType    int32
	DeviceDescription pgtype.Text
	DeviceUsername    pgtype.Text
	EncPassword       []byte
	Memo              string
	Message           string
	PasserID          pgtype.UUID
	TrustID           pgtype.Int4
	IsDisclosed       bool
	CustomData        []byte
}
