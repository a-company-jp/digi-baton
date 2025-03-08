package webauthn

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"database/sql"
	"errors"
	"fmt"
	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/pkg/utils"
	"github.com/google/uuid"
)

type PasskeyStore struct {
	queries *query.Queries
}

type PasskeyData struct {
	RPID         string
	CredentialID string
	UserID       uuid.UUID
	UserName     string
	PublicKey    *ecdsa.PublicKey
	PrivateKey   *ecdsa.PrivateKey
	SignCount    uint32
}

func NewPasskeyStore(q *query.Queries) *PasskeyStore {
	return &PasskeyStore{queries: q}
}

func (s *PasskeyStore) GetKey(ctx context.Context, userID uuid.UUID, rpID string) (*PasskeyData, error) {
	pk, err := s.queries.GetPasskeysByUserAndRp(ctx, query.GetPasskeysByUserAndRpParams{
		UserID: utils.ToPgxUUID(userID),
		RpID:   rpID,
	})
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("db query failed: %w", err)
		}

		// Create a new key
		newKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		if err != nil {
			return nil, fmt.Errorf("failed to generate key: %w", err)
		}
		der, err := x509.MarshalECPrivateKey(newKey)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal ECDSA private key: %w", err)
		}
		credentialID := uuid.NewString()
		derPub, err := x509.MarshalPKIXPublicKey(newKey.Public())
		if err != nil {
			return nil, fmt.Errorf("failed to marshal ECDSA public key: %w", err)
		}
		created, err := s.queries.CreatePasskey(ctx, query.CreatePasskeyParams{
			UserID:       utils.ToPgxUUID(userID),
			RpID:         rpID,
			CredentialID: credentialID,
			UserName:     "New User",
			PublicKey:    derPub,
			PrivateKey:   der,
			SignCount:    0,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to save new passkey: %w", err)
		}
		pk = created
	}

	// Key found or created
	pk.SignCount++
	s.queries.UpdateSignCount(ctx, query.UpdateSignCountParams{
		CredentialID: pk.CredentialID,
		SignCount:    pk.SignCount,
	})
	parsedPriv, err := x509.ParseECPrivateKey(pk.PrivateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to parse ECDSA private key: %w", err)
	}
	parsedPub, err := x509.ParsePKIXPublicKey(pk.PublicKey)
	if err != nil {
		return nil, fmt.Errorf("failed to parse ECDSA public key: %w", err)
	}
	passkeyData := &PasskeyData{
		RPID:         pk.RpID,
		CredentialID: pk.CredentialID,
		UserID:       userID,
		UserName:     pk.UserName,
		PublicKey:    parsedPub.(*ecdsa.PublicKey),
		PrivateKey:   parsedPriv,
		SignCount:    uint32(pk.SignCount),
	}
	return passkeyData, nil
}
