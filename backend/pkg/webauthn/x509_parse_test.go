package webauthn

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"testing"
)

// test parsing and decoding x509 certificate to []byte
func TestConvertX509PrivateKeyToBytes(t *testing.T) {
	// create a new private key
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Errorf("failed to generate key: %v", err)
	}

	// convert the private key to bytes
	key, err := ConvertX509PrivateKeyToBytes(privateKey)
	if err != nil {
		t.Errorf("failed to convert private key to bytes: %v", err)
	}

	// parse the private key
	parsedKey, err := ParseX509PrivateKey(key)
	if err != nil {
		t.Errorf("failed to parse private key: %v", err)
	}

	// compare the parsed key with the original key
	if parsedKey.D.Cmp(privateKey.D) != 0 {
		t.Errorf("parsed key does not match original key")
	}
}

// test parsing and decoding x509 certificate to []byte
func TestConvertX509PublicKeyToBytes(t *testing.T) {
	// create a new private key
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Errorf("failed to generate key: %v", err)
	}

	// convert the private key to bytes
	key, err := ConvertX509PublicKeyToBytes(privateKey.Public().(*ecdsa.PublicKey))
	if err != nil {
		t.Errorf("failed to convert private key to bytes: %v", err)
	}

	// parse the private key
	parsedKey, err := ParseX509PublicKey(key)
	if err != nil {
		t.Errorf("failed to parse private key: %v", err)
	}

	// compare the parsed key with the original key
	if parsedKey.X.Cmp(privateKey.X) != 0 {
		t.Errorf("parsed key does not match original key")
	}
}

func TestParseX509PublicKey(t *testing.T) {
	// create a new private key
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Errorf("failed to generate key: %v", err)
	}

	// convert the private key to bytes
	key, err := ConvertX509PublicKeyToBytes(privateKey.Public().(*ecdsa.PublicKey))
	if err != nil {
		t.Errorf("failed to convert private key to bytes: %v", err)
	}

	// parse the private key
	parsedKey, err := ParseX509PublicKey(key)
	if err != nil {
		t.Errorf("failed to parse private key: %v", err)
	}

	// compare the parsed key with the original key
	if parsedKey.X.Cmp(privateKey.X) != 0 {
		t.Errorf("parsed key does not match original key")
	}
}

func TestParseX509PrivateKey(t *testing.T) {
	// create a new private key
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Errorf("failed to generate key: %v", err)
	}

	// convert the private key to bytes
	key, err := ConvertX509PrivateKeyToBytes(privateKey)
	if err != nil {
		t.Errorf("failed to convert private key to bytes: %v", err)
	}

	// parse the private key
	parsedKey, err := ParseX509PrivateKey(key)
	if err != nil {
		t.Errorf("failed to parse private key: %v", err)
	}

	// compare the parsed key with the original key
	if parsedKey.D.Cmp(privateKey.D) != 0 {
		t.Errorf("parsed key does not match original key")
	}
}
