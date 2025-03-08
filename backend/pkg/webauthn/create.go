package webauthn

import (
	"context"
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
	"github.com/google/uuid"
	"log"
)

type PublicKeyCredential struct {
	ID        string `json:"id"`
	RawID     string `json:"rawId"`
	Type      string `json:"type"`      // "public-key"
	PublicKey string `json:"publicKey"` //base64
	Response  struct {
		ID                    string   `json:"id"`
		ClientDataJSON        string   `json:"clientDataJSON"`
		AttestationObject     string   `json:"attestationObject"`
		PublicKeyAlgorithm    int      `json:"publicKeyAlgorithm"`
		AuthenticatorData     string   `json:"authenticatorData"`
		PublicKey             string   `json:"publicKey"` //base64
		Transports            []string `json:"transports"`
		Signature             string   `json:"signature,omitempty"`
		UserHandle            string   `json:"userHandle,omitempty"`
		AuthenticatorResponse string   `json:"authenticatorResponse,omitempty"`
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

func createClientDataJSON(challenge, origin string, isAssertion bool) ([]byte, error) {
	typeStr := "webauthn.create"
	if isAssertion {
		typeStr = "webauthn.get"
	}

	clientData := map[string]interface{}{
		"type":             typeStr,
		"challenge":        challenge,
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

func (p *PasskeyProcessor) ProcessCreate(
	ctx context.Context,
	userID uuid.UUID,
	reqJSON string,
) (string, error) {
	var payload PublicKeyCredentialCreationPayload
	if err := json.Unmarshal([]byte(reqJSON), &payload); err != nil {
		log.Fatal(err)
	}

	var ar AuthnRequest
	if err := json.Unmarshal([]byte(payload.RequestDetailsJson), &ar); err != nil {
		log.Fatal(err)
	}

	// -- (2) 自前の秘密鍵 (ECDSA) を用意 (本来は外部から安全に読み込む等) --
	pskyInfo, err := p.s.GetKey(ctx, userID, ar.RP.ID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch private key: %v", err)
	}

	// -- (3) Credential ID として使うランダムバイト列を適当に生成 --
	// 本来はデバイス内部でユニークに管理される。ここでは簡易的に 16バイト乱数を使うイメージ。
	credID := make([]byte, 16)
	rand.Read(credID)

	// -- (4) COSE 形式の公開鍵データを作成して CBOR エンコード --
	cosePub, err := createCoseEC2PublicKey(pskyInfo.PublicKey)
	if err != nil {
		fmt.Errorf("failed to create cose public key: %v", err)
	}

	// -- (5) authenticatorData を組み立て --
	authData, err := createAuthenticatorData(ar.RP.ID, credID, cosePub)
	if err != nil {
		fmt.Errorf("failed to create authenticator: %v", err)
	}

	origin := "https://" + ar.RP.ID
	if ar.Extensions["remoteDesktopClientOverride"] != nil && ar.Extensions["remoteDesktopClientOverride"].(map[string]interface{})["origin"] != nil {
		origin = ar.Extensions["remoteDesktopClientOverride"].(map[string]interface{})["origin"].(string)
	}

	clientData, err := createClientDataJSON(ar.Challenge, origin, false)
	if err != nil {
		return "", fmt.Errorf("failed to create client data: %v", err)
	}
	clientDataB64 := base64.RawURLEncoding.EncodeToString(clientData)

	attObj := AttestationObject{
		Fmt:      "none",
		AuthData: authData,
		AttStmt:  map[string]interface{}{},
	}

	attBytes, err := cbor.Marshal(attObj)
	if err != nil {
		return "", fmt.Errorf("failed to marshal attestation object: %v", err)
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
	pubDER, err := x509.MarshalPKIXPublicKey(&pskyInfo.PublicKey)
	if err != nil {
		log.Fatal(err)
	}
	pkc.Response.PublicKey = base64URLEncode(pubDER)

	credIDBase64 := base64URLEncode(credID)

	passkey := &PasskeyInfo{
		RPID:         ar.RP.ID,
		CredentialID: credIDBase64,
		UserID:       ar.User.ID,
		UserName:     ar.User.Name,
		PublicKey:    pubDER,
		PrivateKey:   pskyInfo.PrivateKey,
		SignCount:    0,
	}
	log.Printf("Saved passkey for RPID: %s, CredentialID: %s", passkey.RPID, passkey.CredentialID)

	respJSON, err := json.Marshal(pkc)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(respJSON))
	return string(respJSON), nil
}

func base64URLEncode(data []byte) string {
	return base64.RawURLEncoding.EncodeToString(data)
}
