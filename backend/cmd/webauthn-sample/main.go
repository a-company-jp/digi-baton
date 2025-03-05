package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"github.com/fxamacker/cbor/v2"
)

func main() {
	reqJSON := `{
  "attestation": "none",
  "authenticatorSelection": {
    "residentKey": "discouraged",
    "userVerification": "preferred"
  },
  "challenge": "S1DyLyid1BFsjxZCgBrdSYlNSPfb_U45kK-oURjv_zk",
  "excludeCredentials": [],
  "extensions": {
    "remoteDesktopClientOverride": {
      "origin": "http://localhost:8081",
      "sameOriginWithAncestors": true
    }
  },
  "pubKeyCredParams": [
    { "alg": -7,   "type": "public-key" },
    { "alg": -35,  "type": "public-key" },
    { "alg": -36,  "type": "public-key" },
    { "alg": -257, "type": "public-key" },
    { "alg": -258, "type": "public-key" },
    { "alg": -259, "type": "public-key" },
    { "alg": -37,  "type": "public-key" },
    { "alg": -38,  "type": "public-key" },
    { "alg": -39,  "type": "public-key" },
    { "alg": -8,   "type": "public-key" }
  ],
  "rp": {
    "id": "localhost",
    "name": "Demo WebAuthn Service"
  },
  "user": {
    "displayName": "aewf",
    "id": "YWV3Zg",
    "name": "aewf"
  }
}`
	out, err := MakeCredentialResponse([]byte(reqJSON))
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(out))
}

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
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate key: %w", err)
	}
	pub := priv.Public().(*ecdsa.PublicKey)

	// ---- 4. authenticatorData(authData) の作成 ----
	// 4-1. rpIdHash = SHA-256(rpID)
	rpIdHash := sha256.Sum256([]byte(rpID))

	// 4-2. flags
	// 今回は簡易的に「UserPresent(1) + AttestedCredentialDataIncluded(1)」= 0x41
	// UVビットは立てていません。UV を有効にする場合は 0x45 (0b01000101) などに。
	flags := byte(0x41)

	// 4-3. signCount (4byte, big-endian) -> 0
	signCount := make([]byte, 4)

	// 4-4. AAGUID(16byte) を全部0
	aaguid := make([]byte, 16)

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

	// 4-7. 上記すべてを連結
	var authData []byte
	authData = append(authData, rpIdHash[:]...)
	authData = append(authData, flags)
	authData = append(authData, signCount...)
	authData = append(authData, aaguid...)
	// credential ID length (2byte)
	credLen := make([]byte, 2)
	binary.BigEndian.PutUint16(credLen, uint16(len(credentialID)))
	authData = append(authData, credLen...)
	authData = append(authData, credentialID...)
	authData = append(authData, cosePubKey...)

	// ---- 5. AttestationObject (fmt="none") の作成 ----
	attObj := map[string]interface{}{
		"fmt":      "none",
		"attStmt":  map[string]interface{}{},
		"authData": authData,
	}
	attestationObjBytes, err := cbor.Marshal(attObj)
	if err != nil {
		return nil, fmt.Errorf("failed to cbor-marshal attestationObj: %w", err)
	}
	attestationObjectB64 := base64URLEncode(attestationObjBytes)

	// ---- 6. ECDSA 公開鍵を SPKI (DER) 化 (Chrome はこれを要求) ----
	pubDER, err := ecdsaPublicKeyToDER(pub)
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

// base64URLEncode は、標準的なBase64URL(パディングなし)にエンコードするための簡易関数です。
func base64URLEncode(data []byte) string {
	return base64.RawURLEncoding.EncodeToString(data)
}

// ecdsaPublicKeyToDER は、ECDSA P-256 公開鍵を SubjectPublicKeyInfo(DER) に変換するサンプルです。
// (本実装は固定長などを想定した簡易版であり、より汎用的な実装には注意が必要です)
func ecdsaPublicKeyToDER(pub *ecdsa.PublicKey) ([]byte, error) {
	// uncompressed EC point: 0x04 + X(32byte) + Y(32byte)
	curveSize := (pub.Curve.Params().BitSize + 7) >> 3
	xb := pub.X.Bytes()
	yb := pub.Y.Bytes()

	paddedX := make([]byte, curveSize)
	paddedY := make([]byte, curveSize)
	copy(paddedX[curveSize-len(xb):], xb)
	copy(paddedY[curveSize-len(yb):], yb)

	uncompressed := append([]byte{0x04}, append(paddedX, paddedY...)...)

	// -- SubjectPublicKeyInfo(EC) の ASN.1 --
	// AlgorithmIdentifier(ECPublicKey + prime256v1)
	algID := []byte{
		0x30, 0x13, // SEQUENCE length 0x13
		0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01, // OID ecPublicKey (1.2.840.10045.2.1)
		0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07, // OID prime256v1 (1.2.840.10045.3.1.7)
	}

	// subjectPublicKey (BIT STRING)
	subjectPubKey := makeBitString(uncompressed)

	// 全体を SEQUENCE(0x30) でラップ
	spki := wrapSequence(append(algID, subjectPubKey...))
	return spki, nil
}

func makeBitString(data []byte) []byte {
	// BIT STRING の先頭に unused bits(0) を 1byte 付ける。
	bs := append([]byte{0x00}, data...)
	return wrapTag(0x03, bs) // tag=0x03 (BIT STRING)
}

func wrapSequence(data []byte) []byte {
	return wrapTag(0x30, data) // tag=0x30 (SEQUENCE)
}

// wrapTag は、tag(1byte) + length(1byte) + data という非常に単純化した ASN.1 ラッピングです。
// (length が 127 を超える場合などは更なる工夫が必要)
func wrapTag(tag byte, data []byte) []byte {
	length := byte(len(data))
	return append([]byte{tag, length}, data...)
}
