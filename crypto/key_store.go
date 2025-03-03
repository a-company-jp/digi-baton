package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"database/sql"
	"encoding/pem"
	"fmt"
	_ "github.com/lib/pq"
)

// getOrCreateUserKey fetches an existing RSA key pair from DB or generates a new one.
func getOrCreateUserKey(ctx context.Context, db *sql.DB, userID string) (privateKey *rsa.PrivateKey, publicKey *rsa.PublicKey, err error) {
	var pemPrivate, pemPublic string
	err = db.QueryRowContext(ctx,
		`SELECT private_key, public_key FROM user_keys WHERE user_id = $1`,
		userID,
	).Scan(&pemPrivate, &pemPublic)

	switch {
	case err == sql.ErrNoRows:
		// 1. Generate new key pair (2048 bits or 3072 or 4096, depending on your security/performance needs)
		rsaPriv, genErr := rsa.GenerateKey(rand.Reader, 2048)
		if genErr != nil {
			return nil, nil, fmt.Errorf("failed to generate RSA key: %v", genErr)
		}

		// 2. Convert to PEM
		privBytes := x509.MarshalPKCS1PrivateKey(rsaPriv)
		privPEM := pem.EncodeToMemory(&pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: privBytes,
		})

		pubBytes := x509.MarshalPKCS1PublicKey(&rsaPriv.PublicKey)
		pubPEM := pem.EncodeToMemory(&pem.Block{
			Type:  "RSA PUBLIC KEY",
			Bytes: pubBytes,
		})

		// 3. Insert into DB
		_, insertErr := db.ExecContext(ctx,
			`INSERT INTO user_keys (user_id, private_key, public_key) VALUES ($1, $2, $3)`,
			userID, string(privPEM), string(pubPEM),
		)
		if insertErr != nil {
			return nil, nil, fmt.Errorf("failed to insert new RSA keys: %v", insertErr)
		}

		return rsaPriv, &rsaPriv.PublicKey, nil

	case err != nil:
		// Some unexpected DB error
		return nil, nil, fmt.Errorf("failed to query user key pair: %v", err)

	default:
		// Found rows, parse them from PEM
		block, _ := pem.Decode([]byte(pemPrivate))
		if block == nil || block.Type != "RSA PRIVATE KEY" {
			return nil, nil, fmt.Errorf("stored private key is invalid PEM")
		}
		parsedPriv, parseErr := x509.ParsePKCS1PrivateKey(block.Bytes)
		if parseErr != nil {
			return nil, nil, fmt.Errorf("failed to parse private key: %v", parseErr)
		}

		blockPub, _ := pem.Decode([]byte(pemPublic))
		if blockPub == nil || blockPub.Type != "RSA PUBLIC KEY" {
			return nil, nil, fmt.Errorf("stored public key is invalid PEM")
		}
		parsedPub, parsePubErr := x509.ParsePKCS1PublicKey(blockPub.Bytes)
		if parsePubErr != nil {
			return nil, nil, fmt.Errorf("failed to parse public key: %v", parsePubErr)
		}

		return parsedPriv, parsedPub, nil
	}
}
