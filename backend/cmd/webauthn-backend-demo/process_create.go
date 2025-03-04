package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/asn1"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"github.com/fxamacker/cbor/v2"
	"log"
	"math/big"
	"time"
)

type PublicKeyCredential struct {
	ID        string `json:"id"`
	RawID     string `json:"rawId"`
	Type      string `json:"type"`      // "public-key"
	PublicKey string `json:"publicKey"` //base64
	Response  struct {
		ID                 string   `json:"id"`
		ClientDataJSON     string   `json:"clientDataJSON"`
		AttestationObject  string   `json:"attestationObject"`
		PublicKeyAlgorithm int      `json:"publicKeyAlgorithm"`
		AuthenticatorData  string   `json:"authenticatorData"`
		PublicKey          string   `json:"publicKey"` //base64
		Transports         []string `json:"transports"`
	} `json:"response"`
	ClientExtensionResults map[string]interface{} `json:"clientExtensionResults"`
}

type PublicKeyCredentialCreationPayload struct {
	RequestID          int64  `json:"requestId"`
	RequestDetailsJson string `json:"requestDetailsJson"`
}

type AuthnRequest struct {
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

// まずはサンプル用に、自前の “ECDSA P-256” 秘密鍵を生成する。
// 実際には外部ファイルや安全なストレージからロードして使うことを想定。
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

func createClientDataJSON(challenge, origin string) ([]byte, error) {
	clientData := map[string]interface{}{
		"type":             "webauthn.create",
		"challenge":        challenge, // 受け取ったBase64URLの文字列をそのまま設定することが多い
		"origin":           origin,
		"crossOrigin":      false,
		"clientExtensions": map[string]interface{}{},
	}
	return json.Marshal(clientData)
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
	//   rpIdHash(32) || flags(1) || signCount(4) || attestedCredentialData(...)
	authData := make([]byte, 0, 32+1+4+len(attestedCredData))
	authData = append(authData, rpIdHash[:]...)
	authData = append(authData, flags)
	authData = append(authData, signCount...)
	authData = append(authData, attestedCredData...)
	return authData, nil
}

func createCoseEC2PublicKey(pub *ecdsa.PublicKey) ([]byte, error) {
	type coseKeyMap struct {
		Kty int    `cbor:"1,keyasint"` // 2 => EC2
		Alg int    `cbor:"3,keyasint"` // -7 => ES256
		Crv int    `cbor:"-1,keyasint"`
		X   []byte `cbor:"-2,keyasint"`
		Y   []byte `cbor:"-3,keyasint"`
	}

	xBytes := pub.X.Bytes()
	yBytes := pub.Y.Bytes()

	m := coseKeyMap{
		Kty: 2,
		Alg: -7, // ES256
		Crv: 1,  // P-256 => 1
		X:   xBytes,
		Y:   yBytes,
	}

	return cbor.Marshal(m)
}

func process(reqJSON string) string {
	// -- (1) まずは認証サーバから送られてきたリクエスト(JSON) を想定してパースする --

	var payload PublicKeyCredentialCreationPayload
	if err := json.Unmarshal([]byte(reqJSON), &payload); err != nil {
		log.Fatal(err)
	}

	var ar AuthnRequest
	if err := json.Unmarshal([]byte(payload.RequestDetailsJson), &ar); err != nil {
		log.Fatal(err)
	}

	// -- (2) 自前の秘密鍵 (ECDSA) を用意 (本来は外部から安全に読み込む等) --
	privKey, err := generateOrLoadPrivateKey()
	if err != nil {
		log.Fatal(err)
	}

	// -- (3) Credential ID として使うランダムバイト列を適当に生成 --
	// 本来はデバイス内部でユニークに管理される。ここでは簡易的に 16バイト乱数を使うイメージ。
	credID := make([]byte, 16)
	rand.Read(credID)

	// -- (4) COSE 形式の公開鍵データを作成して CBOR エンコード --
	cosePub, err := createCoseEC2PublicKey(&privKey.PublicKey)
	if err != nil {
		log.Fatal(err)
	}

	// -- (5) authenticatorData を組み立て --
	authData, err := createAuthenticatorData(ar.RP.ID, credID, cosePub)
	if err != nil {
		log.Fatal(err)
	}

	// -- (6) clientDataJSON を組み立てて base64url エンコード --
	//     challenge はそのまま Base64URL 文字列を使うケースが多い (ブラウザJSと合わせる)

	origin := "https://" + ar.RP.ID
	if ar.Extensions["remoteDesktopClientOverride"] != nil && ar.Extensions["remoteDesktopClientOverride"].(map[string]interface{})["origin"] != nil {
		origin = ar.Extensions["remoteDesktopClientOverride"].(map[string]interface{})["origin"].(string)
	}

	clientData, err := createClientDataJSON(ar.Challenge, origin)
	if err != nil {
		log.Fatal(err)
	}
	clientDataHash := sha256.Sum256(clientData)
	clientDataB64 := base64.RawURLEncoding.EncodeToString(clientData)

	dataToSign := append(authData, clientDataHash[:]...)
	r, s, err := ecdsa.Sign(rand.Reader, privKey, dataToSign)
	if err != nil {
		log.Fatal(err)
	}

	type ecdsaSignature struct {
		R, S *big.Int
	}
	sigDER, err := asn1.Marshal(ecdsaSignature{R: r, S: s})
	if err != nil {
		log.Fatal(err)
	}

	selfSigned, err := createSelfSignedCertDER(privKey)
	if err != nil {
		log.Fatal(err)
	}
	attStmt := map[string]interface{}{
		"alg": -7,
		"sig": sigDER,
		"x5c": selfSigned,
	}

	attObj := AttestationObject{
		Fmt:      "packed",
		AuthData: authData,
		AttStmt:  attStmt,
	}

	attBytes, err := cbor.Marshal(attObj)
	if err != nil {
		log.Fatal(err)
	}
	attB64 := base64URLEncode(attBytes)
	var pkc PublicKeyCredential
	pkc.ID = base64.RawURLEncoding.EncodeToString(credID)
	pkc.RawID = pkc.ID
	pkc.Type = "public-key"
	pkc.Response.ID = base64.RawURLEncoding.EncodeToString(credID)
	pkc.Response.ClientDataJSON = clientDataB64
	pkc.Response.AttestationObject = attB64
	pkc.Response.PublicKeyAlgorithm = -7
	authB64 := base64.RawURLEncoding.EncodeToString(authData)
	pkc.Response.AuthenticatorData = authB64
	pkc.Response.Transports = []string{"internal"}
	pkc.ClientExtensionResults = map[string]interface{}{}
	pubDER, err := x509.MarshalPKIXPublicKey(&privKey.PublicKey)
	if err != nil {
		log.Fatal(err)
	}
	pkc.Response.PublicKey = base64URLEncode(pubDER)
	respJSON, err := json.Marshal(pkc)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(respJSON))
	return string(respJSON)
}

var selfSignedCert []byte

func createSelfSignedCertDER(priv *ecdsa.PrivateKey) ([]byte, error) {
	if selfSignedCert != nil {
		return selfSignedCert, nil
	}
	// 今回は自己署名証明書を作成する
	template := x509.Certificate{
		SerialNumber:          big.NewInt(1),
		Subject:               pkix.Name{CommonName: "localhost"},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(1, 0, 0),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}
	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		return nil, err
	}
	selfSignedCert = derBytes
	return selfSignedCert, nil
}
