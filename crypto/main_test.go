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

func TestEncryptDecrypt_Unit(t *testing.T) {
	db, err := getDB()
	require.NoError(t, err, "getDB failed")
	defer db.Close()

	err = runMigrationsUp(db)
	require.NoError(t, err, "runMigrationsUp failed")
	defer func() {
		err := runMigrationsDown(db)
		require.NoError(t, err, "runMigrationsDown failed")
	}()

	s := &Server{db: db}

	// Table-driven approach: multiple scenarios
	tests := []struct {
		name      string
		userID    string
		plaintext string
		repeat    int // how many times to encrypt/decrypt for the same user
	}{
		{
			name:      "normal case",
			userID:    "test-user",
			plaintext: "Hello, RSA World!",
			repeat:    1,
		},
		{
			name:      "empty plaintext",
			userID:    "empty-plaintext-user",
			plaintext: "",
			repeat:    1,
		},
		{
			name:      "another user",
			userID:    "another-usr",
			plaintext: "TestCase2",
			repeat:    1,
		},
		{
			name:      "multiple encryption same user",
			userID:    "multi-encrypt-user",
			plaintext: "Repeated encryption test",
			repeat:    3,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// We’ll run the encrypt/decrypt loop tc.repeat times
			for i := 0; i < tc.repeat; i++ {
				encResp, err := s.Encrypt(context.Background(), &crypto.EncryptRequest{
					UserId:    tc.userID,
					Plaintext: []byte(tc.plaintext),
				})
				require.NoError(t, err, "Encrypt should succeed")
				require.NotEmpty(t, encResp.GetCiphertext(), "Ciphertext must not be empty")

				decResp, err := s.Decrypt(context.Background(), &crypto.DecryptRequest{
					UserId:     tc.userID,
					Ciphertext: encResp.GetCiphertext(),
				})
				require.NoError(t, err, "Decrypt should succeed")
				require.Equal(t, tc.plaintext, string(decResp.GetPlaintext()),
					"plaintext mismatch after RSA encrypt/decrypt")
			}
		})
	}
}
