package webauthn

import (
	"crypto/ecdsa"
	"crypto/x509"
)

func ConvertX509PublicKeyToBytes(cert *ecdsa.PublicKey) ([]byte, error) {
	key, err := x509.MarshalPKIXPublicKey(cert)
	if err != nil {
		return nil, err
	}
	return key, nil
}

func ConvertX509PrivateKeyToBytes(cert *ecdsa.PrivateKey) ([]byte, error) {
	key, err := x509.MarshalECPrivateKey(cert)
	if err != nil {
		return nil, err
	}
	return key, nil
}

func ParseX509PublicKey(key []byte) (*ecdsa.PublicKey, error) {
	cert, err := x509.ParsePKIXPublicKey(key)
	if err != nil {
		return nil, err
	}
	return cert.(*ecdsa.PublicKey), nil
}

func ParseX509PrivateKey(key []byte) (*ecdsa.PrivateKey, error) {
	cert, err := x509.ParseECPrivateKey(key)
	if err != nil {
		return nil, err
	}
	return cert, nil
}
