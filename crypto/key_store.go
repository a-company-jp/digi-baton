package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"database/sql"
	"encoding/pem"
	"fmt"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
	"sync"
)

var userKeyLocks sync.Map

func getOrCreateUserKey(ctx context.Context, db *sql.DB, userID string) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	mu, _ := userKeyLocks.LoadOrStore(userID, &sync.Mutex{})
	userMu := mu.(*sync.Mutex)
	userMu.Lock()
	defer userMu.Unlock()

	priv, pub, err := loadKey(ctx, db, userID)
	if err != nil && err != sql.ErrNoRows {
		return nil, nil, fmt.Errorf("failed to query user key pair: %w", err)
	}
	if err == nil {
		// Found an existing key
		return priv, pub, nil
	}

	// Not found, so we generate a new key
	rsaPriv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate RSA key: %w", err)
	}
	privPEM, pubPEM := marshalRSA(rsaPriv)

	// Try inserting. If someone else beats us, handle unique constraint violation
	_, insertErr := db.ExecContext(ctx, `
        INSERT INTO user_keys (user_id, private_key, public_key)
        VALUES ($1, $2, $3)
    `, userID, privPEM, pubPEM)
	if insertErr != nil {
		// Check if it's a unique violation
		// (This depends on your driver; the exact way to detect error code may vary.)
		if isUniqueViolation(insertErr) {
			// Another transaction inserted the row concurrently; just read it now
			return loadKey(ctx, db, userID)
		}
		return nil, nil, fmt.Errorf("failed to insert new RSA keys: %w", insertErr)
	}
	return rsaPriv, &rsaPriv.PublicKey, nil
}

func loadKey(ctx context.Context, db *sql.DB, userID string) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	var pemPrivate, pemPublic string
	err := db.QueryRowContext(ctx,
		`SELECT private_key, public_key FROM user_keys WHERE user_id = $1`,
		userID,
	).Scan(&pemPrivate, &pemPublic)
	if err != nil {
		return nil, nil, err
	}
	parsedPriv, parsedPub, parseErr := parseKeys(pemPrivate, pemPublic)
	if parseErr != nil {
		return nil, nil, parseErr
	}
	return parsedPriv, parsedPub, nil
}

func parseKeys(pemPrivate, pemPublic string) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	block, _ := pem.Decode([]byte(pemPrivate))
	if block == nil || block.Type != "RSA PRIVATE KEY" {
		return nil, nil, fmt.Errorf("invalid private key PEM")
	}
	parsedPriv, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	blockPub, _ := pem.Decode([]byte(pemPublic))
	if blockPub == nil || blockPub.Type != "RSA PUBLIC KEY" {
		return nil, nil, fmt.Errorf("invalid public key PEM")
	}
	parsedPub, err := x509.ParsePKCS1PublicKey(blockPub.Bytes)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse public key: %w", err)
	}
	return parsedPriv, parsedPub, nil
}

func marshalRSA(rsaPriv *rsa.PrivateKey) (string, string) {
	privBytes := x509.MarshalPKCS1PrivateKey(rsaPriv)
	pubBytes := x509.MarshalPKCS1PublicKey(&rsaPriv.PublicKey)

	privPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: privBytes,
	})
	pubPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PUBLIC KEY",
		Bytes: pubBytes,
	})
	return string(privPEM), string(pubPEM)
}

func isUniqueViolation(err error) bool {
	if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
		return true
	}
	return false
}
