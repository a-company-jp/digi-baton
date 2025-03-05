package main

import (
	"encoding/base64"
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

	r.POST("/create-key", func(c *gin.Context) {
		data, _ := c.GetRawData()
		log.Printf("create-key: %s", string(data))

		out := processCreate(string(data))
		c.Data(200, "application/json; charset=utf-8", []byte(out))

		//// using beta package
		//resp, err := beta.MakeCredentialResponse(data)
		//if err != nil {
		//	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		//	return
		//}
		//c.Data(200, "application/json; charset=utf-8", resp)
	})
	r.POST("/check-passkey", func(c *gin.Context) {
		var req struct {
			RPID         string `json:"rpId"`
			CredentialID string `json:"credentialId,omitempty"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}

		//exists := store.Exists(req.RPID, req.CredentialID)
		c.JSON(http.StatusOK, gin.H{"exists": true})
	})

	// 認証（アサーション）エンドポイント
	r.POST("/get-assertion", func(c *gin.Context) {
		data, _ := c.GetRawData()
		log.Printf("get-assertion: %s", string(data))

		out := processGetAssertion(string(data))
		c.Data(200, "application/json; charset=utf-8", []byte(out))
	})

	log.Println("[extension_backend_webauthn] Running on :8083")
	http.ListenAndServe(":8083", r)
}

// -----------------------------------------------------------------------------

// KeyStore: username, credID -> ECDSA private key

// -----------------------------------------------------------------------------

// ECDSA署名の (r, s) を ASN.1 DER エンコード
// 本来 WebAuthn/FIDO2ではECDSAの署名がraw concat(64byte)の場合もあり得るが、
// ここでは一般的なASN.1 DERで返す
func asn1EncodeECDSASignature(r, s []byte) ([]byte, error) {
	// ecdsa.Sign() gives *big.Int
	// ここではPoC実装としてバイト列をラップしないといけない
	// もっと丁寧に big.Int 使うのが本来
	return nil, errors.New("Not fully implemented. Convert your big.Int properly.")
}

func base64URLEncode(data []byte) string {
	return base64.RawURLEncoding.EncodeToString(data)
}

func base64URLDecode(s string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(s)
}
