package verification

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type VerificationTokenManager struct {
	secretKey []byte
	expiresIn time.Duration
}

// TokenClaims はJWTトークンに含まれる情報
type TokenClaims struct {
	UserID    string `json:"user_id"`
	ClerkID   string `json:"clerk_id"`
	Email     string `json:"email"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

// NewVerificationTokenManager は新しいトークンマネージャーを作成します
func NewVerificationTokenManager(secretKey string, expiresIn time.Duration) *VerificationTokenManager {
	return &VerificationTokenManager{
		secretKey: []byte(secretKey),
		expiresIn: expiresIn,
	}
}

// GenerateToken はユーザーに対して存在確認用のマジックリンクトークンを生成します
func (m *VerificationTokenManager) GenerateToken(userID, clerkID, email string) (string, error) {
	expirationTime := time.Now().Add(m.expiresIn)

	claims := &TokenClaims{
		UserID:    userID,
		ClerkID:   clerkID,
		Email:     email,
		TokenType: "verification",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(m.secretKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// VerifyToken はトークンを検証し、有効であればクレームを返します
func (m *VerificationTokenManager) VerifyToken(tokenString string) (*TokenClaims, error) {
	claims := &TokenClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return m.secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	if claims.TokenType != "verification" {
		return nil, fmt.Errorf("invalid token type")
	}

	return claims, nil
}

// GenerateRandomToken は指定された長さのランダムなトークンを生成します
func GenerateRandomToken(length int) (string, error) {
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// ExpiresIn はトークンの有効期限を返します
func (m *VerificationTokenManager) ExpiresIn() time.Duration {
	return m.expiresIn
}
