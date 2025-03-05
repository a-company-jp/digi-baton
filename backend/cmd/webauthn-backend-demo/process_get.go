package main

import (
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/asn1"
	"encoding/binary"
	"encoding/json"
	"log"
	"math/big"
)

// アサーション用の authenticatorData を作成
func createAssertionAuthData(rpId string, signCount uint32) ([]byte, error) {
	// 1) rpIdHash
	rpIdHash := sha256.Sum256([]byte(rpId))

	// 2) flags (0x01: UserPresent)
	flags := byte(0x01)

	// 3) signCount
	signCountBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(signCountBytes, signCount)

	// 最終的に authenticatorData は以下を連結:
	//   rpIdHash(32) || flags(1) || signCount(4)
	authData := make([]byte, 0, 32+1+4)
	authData = append(authData, rpIdHash[:]...)
	authData = append(authData, flags)
	authData = append(authData, signCountBytes...)

	return authData, nil
}

func processGetAssertion(reqJSON string) string {
	// リクエストのパース
	var payload struct {
		RequestID          int64  `json:"requestId"`
		RequestDetailsJson string `json:"requestDetailsJson"`
	}
	if err := json.Unmarshal([]byte(reqJSON), &payload); err != nil {
		log.Printf("Error parsing assertion request: %v", err)
		return `{"error": "Invalid request format"}`
	}

	// RequestDetailsJsonのパース
	var getReq GetAssertionRequest
	if err := json.Unmarshal([]byte(payload.RequestDetailsJson), &getReq); err != nil {
		log.Printf("Error parsing request details: %v", err)
		return `{"error": "Invalid request details"}`
	}

	log.Printf("Processing assertion for RPID: %s", getReq.RPId)

	// allowCredentialsが空の場合は、RPIDに関連するすべてのパスキーから選択
	var credID string
	var passkey *StoredPasskey

	if len(getReq.AllowCredentials) > 0 {
		// allowCredentialsから最初の1つを使用
		credID = getReq.AllowCredentials[0].ID
		passkey = store.Get(getReq.RPId, credID)
	} else {
		// RPIDに関連するパスキーを取得
		passkeys := store.GetByRPID(getReq.RPId)
		if len(passkeys) > 0 {
			passkey = passkeys[0]
			credID = passkey.CredentialID
		}
	}

	if passkey == nil {
		log.Printf("No matching passkey found for RPID: %s, CredentialID: %s", getReq.RPId, credID)
		return `{"error": "No matching credential found"}`
	}

	// SignCountを更新
	newSignCount := passkey.SignCount + 1
	store.UpdateSignCount(getReq.RPId, credID, newSignCount)

	// アサーション処理のためのデータ作成
	origin := "https://" + getReq.RPId
	if getReq.Extensions != nil && getReq.Extensions["remoteDesktopClientOverride"] != nil {
		if originVal, ok := getReq.Extensions["remoteDesktopClientOverride"].(map[string]interface{})["origin"]; ok {
			if originStr, ok := originVal.(string); ok {
				origin = originStr
			}
		}
	}

	// ClientDataJSONの作成
	clientData, err := createClientDataJSON(getReq.Challenge, origin, true)
	if err != nil {
		log.Printf("Error creating clientDataJSON: %v", err)
		return `{"error": "Failed to create client data"}`
	}
	clientDataB64 := base64URLEncode(clientData)

	// AuthenticatorDataの作成
	authData, err := createAssertionAuthData(getReq.RPId, newSignCount)
	if err != nil {
		log.Printf("Error creating authenticatorData: %v", err)
		return `{"error": "Failed to create authenticator data"}`
	}

	// 署名対象データの作成: authenticatorData + clientDataHash
	clientDataHash := sha256.Sum256(clientData)
	signData := append(authData, clientDataHash[:]...)

	x509.ParsePKIXPublicKey(passkey.PublicKey)
	// 署名の生成
	r, s, err := ecdsa.Sign(rand.Reader, passkey.PrivateKey, signData)
	if err != nil {
		log.Printf("Error creating signature: %v", err)
		return `{"error": "Failed to create signature"}`
	}

	// 署名データをASN.1 DERフォーマットに変換
	signature, err := marshalECDSASignature(r, s)
	if err != nil {
		log.Printf("Error marshalling signature: %v", err)
		return `{"error": "Failed to marshal signature"}`
	}

	// レスポンスの作成
	response := PublicKeyCredential{
		ID:    credID,
		RawID: credID,
		Type:  "public-key",
		Response: struct {
			ID                    string   `json:"id"`
			ClientDataJSON        string   `json:"clientDataJSON"`
			AttestationObject     string   `json:"attestationObject"`
			PublicKeyAlgorithm    int      `json:"publicKeyAlgorithm"`
			AuthenticatorData     string   `json:"authenticatorData"`
			PublicKey             string   `json:"publicKey"`
			Transports            []string `json:"transports"`
			Signature             string   `json:"signature,omitempty"`
			UserHandle            string   `json:"userHandle,omitempty"`
			AuthenticatorResponse string   `json:"authenticatorResponse,omitempty"`
		}{
			ClientDataJSON:    clientDataB64,
			AuthenticatorData: base64URLEncode(authData),
			Signature:         base64URLEncode(signature),
			UserHandle:        passkey.UserID,
		},
		ClientExtensionResults: map[string]interface{}{},
	}

	respJSON, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshalling response: %v", err)
		return `{"error": "Failed to create response"}`
	}

	log.Printf("Assertion response created for RPID: %s, CredentialID: %s", getReq.RPId, credID)
	return string(respJSON)
}

// ECDSA署名をASN.1 DER形式にエンコード
func marshalECDSASignature(r, s *big.Int) ([]byte, error) {
	return asn1.Marshal(struct {
		R, S *big.Int
	}{R: r, S: s})
}
