package main

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"log"
	"time"
)

// GetAssertionRequest はクライアントから送られる認証用リクエスト
type GetAssertionRequest struct {
	Challenge        string `json:"challenge"`
	RPID             string `json:"rpId"`
	Timeout          int    `json:"timeout,omitempty"`
	UserVerification string `json:"userVerification,omitempty"`
	AllowCredentials []struct {
		ID        string   `json:"id"`
		Type      string   `json:"type"`
		Transport []string `json:"transports,omitempty"`
	} `json:"allowCredentials,omitempty"`
	Extensions map[string]interface{} `json:"extensions,omitempty"`
}

// AuthenticatorData の生成時にフラグをセットする用
const (
	flagUserPresent   byte = 0x01
	flagUserVerified  byte = 0x04
	flagAttestedCred  byte = 0x40
	flagExtensionData byte = 0x80
)

// processGetAssertion は認証チャレンジを処理し、署名付きレスポンスを返す
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

	// 1. リクエストをパース
	var req GetAssertionRequest
	err := json.Unmarshal([]byte(payload.RequestDetailsJson), &req)
	if err != nil {
		log.Printf("Failed to parse request JSON: %v", err)
		return ""
	}

	// 2. 対応する StoredPasskey を検索
	//    - allowCredentials に複数の候補がある場合もあるが、ここでは 1つ目のみ対応
	if len(req.AllowCredentials) == 0 {
		log.Printf("No allowCredentials in request")
		return ""
	}

	var passkey *StoredPasskey
	for _, cred := range req.AllowCredentials {
		passkey = store.Get(req.RPID, cred.ID)
		if passkey != nil {
			break
		}
	}
	if passkey == nil {
		log.Printf("No stored passkey found for RPID=%s", req.RPID)
		return ""
	}

	// 3. authenticatorData の組み立て
	//    - rpIdHash(32byte) + flags(1byte) + signCount(4byte)
	rpIdHash := sha256.Sum256([]byte(req.RPID))

	// flags: UserPresentは1、UVはオプションで設定(ここではリクエストによらずOFFにしている例)
	var flags byte = flagUserPresent

	// signCount を 1 加算 (認証器内カウンターをエミュレート)
	newSignCount := passkey.SignCount + 1

	// 4byte BigEndian でカウンタをエンコード
	signCountBuf := make([]byte, 4)
	binary.BigEndian.PutUint32(signCountBuf, newSignCount)

	var authData bytes.Buffer
	authData.Write(rpIdHash[:])  // 32 bytes
	authData.WriteByte(flags)    // 1 byte
	authData.Write(signCountBuf) // 4 bytes

	origin := "https://" + req.RPID
	if req.Extensions["remoteDesktopClientOverride"] != nil && req.Extensions["remoteDesktopClientOverride"].(map[string]interface{})["origin"] != nil {
		origin = req.Extensions["remoteDesktopClientOverride"].(map[string]interface{})["origin"].(string)
	}
	// 4. clientDataJSON と 署名(signature) を生成
	//    - clientDataJSON は webauthn.get + Challenge + Origin
	clientData := map[string]interface{}{
		"type":      "webauthn.get",
		"challenge": req.Challenge,     // そのままBase64URL文字列でよいことが多い
		"origin":    origin,            // ここでは簡易的に rpId からoriginを組み立てる例
		"timestamp": time.Now().Unix(), // デバッグ用に適当に入れてみた
	}

	clientDataJSON, _ := json.Marshal(clientData)

	// 署名対象は authenticatorData + sha256(clientDataJSON)
	clientDataHash := sha256.Sum256(clientDataJSON)
	toBeSigned := append(authData.Bytes(), clientDataHash[:]...)
	// 2) さらにHash (digest)
	digest := sha256.Sum256(toBeSigned)

	// 3) ECDSA署名
	signature, err := ecdsa.SignASN1(rand.Reader, passkey.PrivateKey, digest[:])
	if err != nil {
		log.Printf("Failed to sign: %v", err)
		return ""
	}

	// 5. StoredPasskey の SignCount を更新(保存処理)
	passkey.SignCount = newSignCount

	// 6. レスポンス用構造体を組み立て
	var pkc PublicKeyCredential
	pkc.ID = passkey.CredentialID
	pkc.RawID = passkey.CredentialID
	pkc.Type = "public-key"

	// Base64URLエンコードして詰める
	pkc.Response.ClientDataJSON = base64.RawURLEncoding.EncodeToString(clientDataJSON)
	pkc.Response.AuthenticatorData = base64.RawURLEncoding.EncodeToString(authData.Bytes())
	pkc.Response.Signature = base64.RawURLEncoding.EncodeToString(signature)

	// userHandle は passkey.UserID を Base64URL で表すケースが多い
	pkc.Response.UserHandle = passkey.UserID

	pkc.ClientExtensionResults = map[string]interface{}{}

	// JSON にエンコードして返す
	respJSON, err := json.Marshal(pkc)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return ""
	}

	return string(respJSON)
}
