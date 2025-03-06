// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0

package query

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type Account struct {
	ID             int32
	AppTemplateID  pgtype.Int4
	AppName        pgtype.Text
	AppDescription pgtype.Text
	AppIconUrl     pgtype.Text
	Username       string
	Email          string
	EncPassword    []byte
	Memo           string
	PlsDelete      bool
	Message        string
	PasserID       pgtype.UUID
	TrustID        pgtype.Int4
	IsDisclosed    bool
	CustomData     []byte
}

type AliveCheckHistory struct {
	ID               pgtype.UUID
	TargetUserID     pgtype.UUID
	CheckTime        pgtype.Timestamp
	CheckMethod      int32
	CheckSuccess     bool
	CheckSuccessTime pgtype.Timestamp
	CustomData       []byte
}

type Device struct {
	ID                int32
	DeviceType        int32
	DeviceDescription pgtype.Text
	DeviceUsername    pgtype.Text
	DeviceIconUrl     pgtype.Text
	EncPassword       []byte
	Memo              string
	Message           string
	PasserID          pgtype.UUID
	TrustID           pgtype.Int4
	IsDisclosed       bool
	CustomData        []byte
}

type Disclosure struct {
	ID          int32
	RequesterID pgtype.UUID
	PasserID    pgtype.UUID
	IssuedTime  pgtype.Timestamp
	InProgress  bool
	Disclosed   bool
	DisclosedAt pgtype.Timestamp
	PreventedBy pgtype.UUID
	Deadline    pgtype.Timestamp
	CustomData  []byte
}

type Passkey struct {
	ID           int32
	UserID       pgtype.UUID
	RpID         string
	CredentialID string
	UserName     string
	PublicKey    []byte
	PrivateKey   []byte
	SignCount    int64
}

type Subscription struct {
	ID           int32
	ServiceName  pgtype.Text
	IconUrl      pgtype.Text
	Username     string
	Email        string
	EncPassword  []byte
	Amount       int32
	Currency     string
	BillingCycle string
	Memo         string
	PlsDelete    bool
	Message      string
	PasserID     pgtype.UUID
	TrustID      pgtype.Int4
	IsDisclosed  bool
	CustomData   []byte
}

type Trust struct {
	ID             int32
	ReceiverUserID pgtype.UUID
	PasserUserID   pgtype.UUID
}

type User struct {
	ID                pgtype.UUID
	DefaultReceiverID pgtype.UUID
	ClerkUserID       string
}
