package main

import (
	"context"
	"testing"

	"github.com/a-company-jp/digi-baton/proto/crypto"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/stretchr/testify/require"
)

func TestEncryptDecryptDirect(t *testing.T) {
	// 1. Get a test DB connection
	db, err := getDB()
	require.NoError(t, err, "getDB failed")
	defer db.Close()

	// 2. Migrate up, then drop everything at the end
	err = runMigrationsUp(db)
	require.NoError(t, err, "runMigrationsUp failed")
	defer func() {
		err := runMigrationsDown(db)
		require.NoError(t, err, "runMigrationsDown failed")
	}()

	s := &Server{
		db: db,
	}

	userID := "test-user"
	plaintext := []byte("Hello, RSA World!")

	// 4. Encrypt directly
	encResp, err := s.Encrypt(context.Background(), &crypto.EncryptRequest{
		UserId:    userID,
		Plaintext: plaintext,
	})
	require.NoError(t, err, "Encrypt should succeed")
	require.NotEmpty(t, encResp.GetCiphertext(), "Ciphertext should not be empty")

	// 5. Decrypt directly
	decResp, err := s.Decrypt(context.Background(), &crypto.DecryptRequest{
		UserId:     userID,
		Ciphertext: encResp.GetCiphertext(),
	})
	require.NoError(t, err, "Decrypt should succeed")
	require.Equal(t, plaintext, decResp.GetPlaintext(), "plaintext mismatch after RSA encrypt/decrypt")
}
