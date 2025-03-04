package main

import (
	"crypto/ecdsa"
	"sync"
)

type KeyStore struct {
	mu   sync.RWMutex
	data map[string]map[string]*ecdsa.PrivateKey
}

func NewKeyStore() *KeyStore {
	return &KeyStore{
		data: make(map[string]map[string]*ecdsa.PrivateKey),
	}
}

func (ks *KeyStore) SaveKey(username, credID string, key *ecdsa.PrivateKey) {
	ks.mu.Lock()
	defer ks.mu.Unlock()
	if ks.data[username] == nil {
		ks.data[username] = make(map[string]*ecdsa.PrivateKey)
	}
	ks.data[username][credID] = key
}

func (ks *KeyStore) GetKey(username, credID string) *ecdsa.PrivateKey {
	ks.mu.RLock()
	defer ks.mu.RUnlock()
	if v, ok := ks.data[username]; ok {
		return v[credID]
	}
	return nil
}
