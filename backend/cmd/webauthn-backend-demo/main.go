package main

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
)

/*
extension_backend_webauthn.go

Chrome拡張の "chrome.webAuthenticationProxy" を利用してパスキー認証を代理する際、
実際にサーバー上で秘密鍵を保持し、WebAuthnのAssertion(署名)を作成するためのPoC実装例。

!!! 注意 !!!
このコードは「仮想的な認証器」のごく簡単な擬似実装です。
実際にFIDO2/WebAuthnで必要なAttestationやAAGUID、COSE形式の公開鍵保存など
多数のステップを省略/簡略化しており、あくまで概念実証用となります。

想定フロー:
1. Chrome拡張が navigator.credentials.get() 呼び出しを "webAuthenticationProxy" で横取り
2. onGetRequest で受け取ったRP IDやchallenge等をこのバックエンドに転送(例: POST /sign-assertion)
3. バックエンドがユーザーの秘密鍵を使って、authenticatorDataやsignatureを生成
4. 生成した PublicKeyCredential(JSON)相当を拡張機能に返却
5. 拡張機能が completeGetRequest({responseJson: ...}) でサイトに返す -> サイトは署名検証でログイン完了
*/

func main() {
	r := gin.Default()
	r.Use(cors.Default())

	store := NewKeyStore()

	// 鍵作成エンドポイント (PoC)
	// 実際は登録フローで鍵ペアを生成して保持し、ユーザー名/credentialIdなどと紐づけておく
	r.POST("/create-key", func(c *gin.Context) {
		data, _ := c.GetRawData()
		log.Printf("create-key: %s", string(data))
		out := process(string(data))
		c.Data(200, "application/json; charset=utf-8", []byte(out))

		//// using beta package
		//resp, err := authenticator.MakeCredentialResponse(data)
		//if err != nil {
		//	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		//	return
		//}
		//c.Data(200, "application/json; charset=utf-8", resp)
	})

	// 認証リクエストを受け取り、Assertionデータを返す
	// Chrome拡張が /sign-assertion を呼んで -> {rpId, challenge, credentialId, username} など
	// ここで署名生成し、AuthenticatorAssertionResponse相当のJSONを返す

	r.POST("/sign-assertion", func(c *gin.Context) {
		var req struct {
			Username     string `json:"username"`
			CredentialID string `json:"credentialId"`
			RPID         string `json:"rpId"`
			Challenge    string `json:"challenge"` // base64url?
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		priv := store.GetKey(req.Username, req.CredentialID)
		if priv == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "no key found"})
			return
		}

		// 1) clientDataJSONを組み立て
		//    本来は { "type": "webauthn.get", "challenge": <req.Challenge>, "origin": <origin>, ...}
		//    などを含むが、PoCのため簡略化
		clientDataObj := map[string]string{
			"type":      "webauthn.get",
			"challenge": req.Challenge,
			"origin":    "https://" + req.RPID,
		}
		clientDataBytes, _ := json.Marshal(clientDataObj)
		clientDataBase64 := base64URLEncode(clientDataBytes)

		// 2) authenticatorData の仮生成
		//    RP ID Hash(sha256), flags(例0x01 = UserPresent), signCount(例0)
		//    例: [32 bytes rpIdHash][1 byte flags][4 bytes signCount]

		// rpIdHash = sha256(rpId)
		rpIdHash := sha256.Sum256([]byte(req.RPID))

		flags := []byte{0x01} // user present

		signCountBuf := make([]byte, 4)
		// 0 としておく

		authDataBuf := bytes.Buffer{}
		authDataBuf.Write(rpIdHash[:])
		authDataBuf.Write(flags)
		authDataBuf.Write(signCountBuf)

		authenticatorData := authDataBuf.Bytes()
		authDataBase64 := base64URLEncode(authenticatorData)

		// 3) signature = sign( authenticatorData || SHA256(clientDataJSON) )
		clientDataHash := sha256.Sum256(clientDataBytes)

		toSign := append(authenticatorData, clientDataHash[:]...)
		sl := sha256.Sum256(toSign)
		rSig, sSig, err := ecdsa.Sign(rand.Reader, priv, sl[:])
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// rSig, sSig を ASN.1 シグネチャにまとめる or ただconcat?
		// WebAuthnではECDSAシグネチャは ASN.1 DER でエンコードされるのが一般的
		sigBytes, err := asn1EncodeECDSASignature(rSig.Bytes(), sSig.Bytes())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		signatureBase64 := base64URLEncode(sigBytes)

		// 4) userHandle: 必要に応じて username -> []byte変換
		//    ここでは省略 or ""

		// 5) 最終的に PublicKeyCredential toJSON() 準拠のJSONを組み立てて返す
		// {
		//   id, rawId, type: "public-key",
		//   response: {
		//       clientDataJSON, authenticatorData, signature, userHandle?
		//   }
		// }

		type ResponseStruct struct {
			ClientDataJSON    string `json:"clientDataJSON"`
			AuthenticatorData string `json:"authenticatorData"`
			Signature         string `json:"signature"`
			UserHandle        string `json:"userHandle"`
		}

		type CredentialObj struct {
			ID       string         `json:"id"`
			RawID    string         `json:"rawId"`
			Type     string         `json:"type"`
			Response ResponseStruct `json:"response"`
		}

		credObj := CredentialObj{
			ID:    req.CredentialID,
			RawID: base64URLEncode([]byte(req.CredentialID)),
			Type:  "public-key",
			Response: ResponseStruct{
				ClientDataJSON:    clientDataBase64,
				AuthenticatorData: authDataBase64,
				Signature:         signatureBase64,
				UserHandle:        "",
			},
		}

		respBytes, _ := json.Marshal(credObj)
		c.Data(http.StatusOK, "application/json", respBytes)
	})

	log.Println("[extension_backend_webauthn] Running on :8083")
	http.ListenAndServe(":8083", r)
}

// -----------------------------------------------------------------------------

// KeyStore: username, credID -> ECDSA private key

// -----------------------------------------------------------------------------

// base64URLエンコード (paddingなし)
func base64URLEncode(data []byte) string {
	s := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(data)
	return s
}

// ECDSA署名の (r, s) を ASN.1 DER エンコード
// 本来 WebAuthn/FIDO2ではECDSAの署名がraw concat(64byte)の場合もあり得るが、
// ここでは一般的なASN.1 DERで返す
func asn1EncodeECDSASignature(r, s []byte) ([]byte, error) {
	// ecdsa.Sign() gives *big.Int
	// ここではPoC実装としてバイト列をラップしないといけない
	// もっと丁寧に big.Int 使うのが本来
	return nil, errors.New("Not fully implemented. Convert your big.Int properly.")
}
