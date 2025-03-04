package beta

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"github.com/fxamacker/cbor/v2"
	"log"
)

// PublicKeyCredentialCreationOptions は、
// WebAuthn のクライアントサイドで作られる認証器登録リクエストを受け取るための構造体例。
type PublicKeyCredentialCreationOptions struct {
	Attestation            string `json:"attestation"`
	AuthenticatorSelection struct {
		ResidentKey      string `json:"residentKey"`
		UserVerification string `json:"userVerification"`
	} `json:"authenticatorSelection"`
	Challenge          string                 `json:"challenge"`
	ExcludeCredentials []interface{}          `json:"excludeCredentials"`
	Extensions         map[string]interface{} `json:"extensions"` // 拡張フィールド
	PubKeyCredParams   []struct {
		Alg  int    `json:"alg"`
		Type string `json:"type"`
	} `json:"pubKeyCredParams"`
	RP struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"rp"`
	User struct {
		DisplayName string `json:"displayName"`
		ID          string `json:"id"`
		Name        string `json:"name"`
	} `json:"user"`
}

type AttestationObject struct {
	Fmt      string                 `cbor:"fmt"`
	AttStmt  map[string]interface{} `cbor:"attStmt"`
	AuthData []byte                 `cbor:"authData"`
}

var privateKey *ecdsa.PrivateKey

func generateOrLoadPrivateKey() (*ecdsa.PrivateKey, error) {
	if privateKey == nil {
		var err error
		privateKey, err = ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		if err != nil {
			return nil, err
		}
	}
	return privateKey, nil
}

// MakeCredentialResponse は、受け取った WebAuthn 登録リクエスト(JSON) をパースし、
// "none" アテステーションのレスポンス(JSON)を作成して返します。
func MakeCredentialResponse(requestData []byte) ([]byte, error) {
	// ---- 1. リクエストをパースする ----
	var options PublicKeyCredentialCreationOptions
	if err := json.Unmarshal(requestData, &options); err != nil {
		return nil, fmt.Errorf("failed to parse request: %w", err)
	}

	// challenge, rpID, origin(など)を取得
	challenge := options.Challenge
	rpID := options.RP.ID

	// 今回はオリジンを extensions 下にある例 (remoteDesktopClientOverride) から取り出してみる
	// 例:
	//  "extensions": {
	//    "remoteDesktopClientOverride": {
	//      "origin": "http://localhost:8081",
	//      "sameOriginWithAncestors": true
	//    }
	//  }
	//
	// ※ extension構造が多様なので、簡易的に取り出しています。
	var origin string
	if ext, ok := options.Extensions["remoteDesktopClientOverride"]; ok {
		if m, ok := ext.(map[string]interface{}); ok {
			if o, ok := m["origin"].(string); ok {
				origin = o
			}
		}
	}
	if origin == "" {
		// origin が取れなかった場合の fallback
		origin = "https://" + rpID // 仮
	}

	// ---- 2. clientDataJSON を組み立て (webauthn.create) ----
	clientData := map[string]interface{}{
		"type":        "webauthn.create",
		"challenge":   challenge,
		"origin":      origin,
		"crossOrigin": false,
	}
	clientDataBytes, err := json.Marshal(clientData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal clientData: %w", err)
	}
	clientDataJSONB64 := base64URLEncode(clientDataBytes)

	// ---- 3. ECDSA P-256 鍵ペア生成 (alg=-7) ----
	priv, err := generateOrLoadPrivateKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate key: %w", err)
	}
	pub := priv.Public().(*ecdsa.PublicKey)

	// 4-5. credentialID を16byte乱数で作成
	credentialID := make([]byte, 16)
	if _, err := rand.Read(credentialID); err != nil {
		return nil, fmt.Errorf("failed to generate credentialID: %w", err)
	}

	// 4-6. COSE形式の公開鍵をCBORエンコード
	xBytes := pub.X.Bytes()
	yBytes := pub.Y.Bytes()
	coseKey := map[int]interface{}{
		1:  2,  // kty: EC2
		3:  -7, // alg: ES256
		-1: 1,  // crv: P-256
		-2: xBytes,
		-3: yBytes,
	}
	cosePubKey, err := cbor.Marshal(coseKey)
	if err != nil {
		return nil, fmt.Errorf("failed to cbor-marshal coseKey: %w", err)
	}

	authData, err := createAuthenticatorData(options.RP.ID, credentialID, cosePubKey)
	if err != nil {
		log.Fatal(err)
	}

	clientDataHash := sha256.Sum256(clientDataBytes)
	dataToSign := append(authData, clientDataHash[:]...)
	r, s, err := ecdsa.Sign(rand.Reader, priv, dataToSign)
	if err != nil {
		log.Fatal(err)
	}
	// DERエンコードなど、実際の “packed” アテステーションステートメントではシグネチャを
	// ASN.1 DER 形式で格納するのが一般的。ここでは簡易実装として r,s を連結しているだけとする。
	// (仕様厳守するなら DER 形式で連結が必要)
	signature := append(r.Bytes(), s.Bytes()...)

	attStmt := map[string]interface{}{
		"alg": -7,        // ES256
		"sig": signature, // 実際は ASN.1 DER にすることが多い
		// "x5c": 省略 (none アテステーションなので証明書チェーンを載せない)
	}

	attObj := AttestationObject{
		Fmt:      "packed",
		AuthData: authData,
		AttStmt:  attStmt,
	}
	attestationObjBytes, err := cbor.Marshal(attObj)
	if err != nil {
		return nil, fmt.Errorf("failed to cbor-marshal attestationObj: %w", err)
	}
	attestationObjectB64 := base64URLEncode(attestationObjBytes)

	// ---- 6. ECDSA 公開鍵を SPKI (DER) 化 (Chrome はこれを要求) ----
	pubDER, err := x509.MarshalPKIXPublicKey(pub)
	if err != nil {
		return nil, fmt.Errorf("failed to convert pubkey to DER: %w", err)
	}
	pubDERB64 := base64URLEncode(pubDER)

	// ---- 7. 最終レスポンスを JSON で組み立て ----
	resp := map[string]interface{}{
		"type":                    "public-key",
		"id":                      base64URLEncode(credentialID),
		"rawId":                   base64URLEncode(credentialID),
		"authenticatorAttachment": "platform",
		"response": map[string]interface{}{
			"clientDataJSON":     clientDataJSONB64,
			"attestationObject":  attestationObjectB64,
			"authenticatorData":  base64URLEncode(authData),
			"publicKeyAlgorithm": -7, // ES256
			"publicKey":          pubDERB64,
			"transports":         []string{"internal"},
		},
		"clientExtensionResults": map[string]interface{}{},
	}

	out, err := json.Marshal(resp)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal response: %w", err)
	}
	return out, nil
}

func base64URLEncode(data []byte) string {
	return base64.RawURLEncoding.EncodeToString(data)
}

func createAuthenticatorData(rpId string, credentialID []byte, cosePubKey []byte) ([]byte, error) {
	// 1) rpIdHash
	rpIdHash := sha256.Sum256([]byte(rpId))

	// 2) flags (0x41: UserPresent + AttestedCredentialData)
	flags := byte(0x41)

	// 3) signCount
	signCount := make([]byte, 4)
	binary.BigEndian.PutUint32(signCount, 0) // 今回は0とする

	// 4) attestedCredentialData
	//    - AAGUID (16バイト, 今回は全部0とする)
	aaguid := make([]byte, 16)

	//    - credentialIdLength + credentialId
	credIdLen := make([]byte, 2)
	binary.BigEndian.PutUint16(credIdLen, uint16(len(credentialID)))

	//    - credentialPublicKey (COSE Key)
	attestedCredData := append(aaguid, credIdLen...)
	attestedCredData = append(attestedCredData, credentialID...)
	attestedCredData = append(attestedCredData, cosePubKey...)

	// 最終的に authenticatorData は以下を連結:
	authData := make([]byte, 0, 32+1+4+len(attestedCredData))
	authData = append(authData, rpIdHash[:]...)
	authData = append(authData, flags)
	authData = append(authData, signCount...)
	authData = append(authData, attestedCredData...)
	return authData, nil
}
