package main

import (
	"crypto/ecdsa"
	"log"
	"sync"
)

type PasskeyStore struct {
	mu       sync.RWMutex
	passkeys map[string]*StoredPasskey // rpID+credentialID -> StoredPasskey
}

// 保存されたパスキー情報
type StoredPasskey struct {
	RPID         string            `json:"rpId"`
	CredentialID string            `json:"credentialId"` // Base64URL encoded
	UserID       string            `json:"userId"`       // Base64URL encoded
	UserName     string            `json:"userName"`
	PublicKey    []byte            `json:"-"` // DER encoded public key
	PrivateKey   *ecdsa.PrivateKey `json:"-"` // ECDSA private key
	SignCount    uint32            `json:"signCount"`
}

// グローバルパスキーストア
var store = &PasskeyStore{
	passkeys: make(map[string]*StoredPasskey),
}

// パスキーストアのヘルパーメソッド
func (s *PasskeyStore) Add(passkey *StoredPasskey) {
	s.mu.Lock()
	defer s.mu.Unlock()
	key := passkey.RPID + ":" + passkey.CredentialID
	s.passkeys[key] = passkey
	log.Printf("Added key: %s", key)
}

func (s *PasskeyStore) Get(rpID, credentialID string) *StoredPasskey {
	s.mu.RLock()
	defer s.mu.RUnlock()
	key := rpID + ":" + credentialID
	return s.passkeys[key]
}

func (s *PasskeyStore) GetByRPID(rpID string) []*StoredPasskey {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*StoredPasskey
	for key, passkey := range s.passkeys {
		if passkey.RPID == rpID {
			result = append(result, s.passkeys[key])
		}
	}
	return result
}

func (s *PasskeyStore) Exists(rpID string, credentialID string) bool {
	if credentialID == "" {
		// CredentialIDが指定されていない場合は、RPIDに対するパスキーが1つでもあればtrue
		return len(s.GetByRPID(rpID)) > 0
	}
	return s.Get(rpID, credentialID) != nil
}

func (s *PasskeyStore) UpdateSignCount(rpID, credentialID string, newCount uint32) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := rpID + ":" + credentialID
	if passkey, exists := s.passkeys[key]; exists {
		passkey.SignCount = newCount
		return true
	}
	return false
}
