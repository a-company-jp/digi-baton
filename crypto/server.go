package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"fmt"

	"github.com/a-company-jp/digi-baton/proto/crypto"
)

func (s *server) Encrypt(ctx context.Context, req *crypto.EncryptRequest) (*crypto.EncryptResponse, error) {
	// 1. Look up or create RSA key pair
	priv, pub, err := getOrCreateUserKey(ctx, s.db, req.GetUserId())
	if err != nil {
		return nil, err
	}
	_ = priv // might not be used if we only need the pub for encryption

	// 2. RSA encryption using OAEP with SHA256
	ciphertext, err := rsa.EncryptOAEP(
		sha256.New(),
		rand.Reader,
		pub, // use the public key to encrypt
		req.GetPlaintext(),
		nil, // optional label
	)
	if err != nil {
		return nil, fmt.Errorf("rsa encrypt failed: %v", err)
	}

	// 3. Log event
	s.storeHistory(ctx, req.GetUserId(), "ENCRYPT", ciphertext)

	return &crypto.EncryptResponse{Ciphertext: ciphertext}, nil
}

// Decrypt uses the private key
func (s *server) Decrypt(ctx context.Context, req *crypto.DecryptRequest) (*crypto.DecryptResponse, error) {
	priv, _, err := getOrCreateUserKey(ctx, s.db, req.GetUserId())
	if err != nil {
		return nil, err
	}

	plaintext, err := rsa.DecryptOAEP(
		sha256.New(),
		rand.Reader,
		priv,                // private key
		req.GetCiphertext(), // data we want to decrypt
		nil,                 // optional label
	)
	if err != nil {
		return nil, fmt.Errorf("rsa decrypt failed: %v", err)
	}

	s.storeHistory(ctx, req.GetUserId(), "DECRYPT", req.GetCiphertext())

	return &crypto.DecryptResponse{Plaintext: plaintext}, nil
}
