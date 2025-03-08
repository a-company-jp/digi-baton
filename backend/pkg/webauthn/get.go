package webauthn

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

type PasskeyInfo struct {
	RPID         string            `json:"rpId"`
	CredentialID string            `json:"credentialId"` // Base64URL encoded
	UserID       string            `json:"userId"`       // Base64URL encoded
	UserName     string            `json:"userName"`
	PublicKey    []byte            `json:"-"` // DER encoded public key
	PrivateKey   *ecdsa.PrivateKey `json:"-"` // ECDSA private key
	SignCount    uint32            `json:"signCount"`
}

const (
	flagUserPresent   byte = 0x01
	flagUserVerified  byte = 0x04
	flagAttestedCred  byte = 0x40
	flagExtensionData byte = 0x80
)

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

type PasskeyProcessor struct {
	s PasskeyStore
}

func NewPasskeyProcessor(
	store PasskeyStore,
) *PasskeyProcessor {
	return &PasskeyProcessor{
		s: store,
	}
}

func (p *PasskeyProcessor) ProcessGetAssertion(
	ctx context.Context,
	userID uuid.UUID,
	reqJSON string,
) (string, error) {
	var payload struct {
		RequestID          int64  `json:"requestId"`
		RequestDetailsJson string `json:"requestDetailsJson"`
	}
	if err := json.Unmarshal([]byte(reqJSON), &payload); err != nil {
		log.Printf("Error parsing assertion request: %v", err)
		return "", fmt.Errorf("invalid request format, %v", err)
	}

	var req GetAssertionRequest
	err := json.Unmarshal([]byte(payload.RequestDetailsJson), &req)
	if err != nil {
		log.Printf("Failed to parse request JSON: %v", err)
		return "", fmt.Errorf("failed to parse request JSON: %v", err)
	}

	// 2. 対応する PasskeyInfo を検索
	//    - allowCredentials に複数の候補がある場合もあるが、ここでは 1つ目のみ対応
	if len(req.AllowCredentials) == 0 {
		log.Printf("No allowCredentials in request")
		return "", fmt.Errorf("no allowCredentials in request")
	}

	// userID と RPID から 一意に取得
	passkey, err := p.s.GetKey(ctx, userID, req.RPID)
	if err != nil {
		log.Printf("Failed to get passkey: %v", err)
		return "", fmt.Errorf("failed to get passkey: %v", err)
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
		return "", fmt.Errorf("failed to sign: %v", err)
	}

	// 5. PasskeyInfo の SignCount を更新(保存処理)
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

	// userHandle は passkey.UserID を Base64URL で表すケースが多い??
	pkc.Response.UserHandle = passkey.UserID.String()

	pkc.ClientExtensionResults = map[string]interface{}{}

	// JSON にエンコードして返す
	respJSON, err := json.Marshal(pkc)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return "", fmt.Errorf("failed to marshal response: %v", err)
	}

	return string(respJSON), nil
}
