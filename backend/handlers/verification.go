package handlers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/middleware"
	"github.com/a-company-jp/digi-baton/backend/pkg/mail"
	"github.com/a-company-jp/digi-baton/backend/pkg/verification"
	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	// トークンの有効期限（24時間）
	tokenExpirationTime = 24 * time.Hour
)

// VerificationHandler は生存確認関連のハンドラーを提供します
type VerificationHandler struct {
	queries            *query.Queries
	tokenManager       *verification.VerificationTokenManager
	mailSender         *mail.Sender
	verificationURLFmt string
}

// NewVerificationHandler は新しい生存確認ハンドラーを作成します
func NewVerificationHandler(queries *query.Queries) *VerificationHandler {
	// 環境変数から設定を取得
	mailjetPublicKey := os.Getenv("MAILJET_API_KEY_PUBLIC")
	mailjetPrivateKey := os.Getenv("MAILJET_API_KEY_PRIVATE")
	mailjetFromEmail := os.Getenv("MAILJET_FROM_EMAIL")
	mailjetFromName := os.Getenv("MAILJET_FROM_NAME")
	jwtSecret := os.Getenv("JWT_SECRET")
	frontendURL := os.Getenv("FRONTEND_URL")

	// 有効期限は24時間に設定
	tokenManager := verification.NewVerificationTokenManager(jwtSecret, tokenExpirationTime)

	// Mailjetのメール送信機能を初期化
	var mailSender *mail.Sender
	if mailjetPublicKey != "" && mailjetPrivateKey != "" && mailjetFromEmail != "" {
		if mailjetFromName == "" {
			mailjetFromName = "Digi Baton" // デフォルト送信者名
		}
		mailSender = mail.NewSender(mailjetPublicKey, mailjetPrivateKey, mailjetFromEmail, mailjetFromName)
	} else {
		// 環境変数が設定されていない場合はダミー送信者を使用（ログのみ出力）
		fmt.Println("WARNING: Mailjet credentials not found, using dummy email sender")
		mailSender = mail.NewDummySender()
	}

	return &VerificationHandler{
		queries:            queries,
		tokenManager:       tokenManager,
		mailSender:         mailSender,
		verificationURLFmt: frontendURL + "/verify?token=%s",
	}
}

// SendVerificationRequest はユーザーに確認メールを送信するためのリクエスト
type SendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// SendVerificationEmail は生存確認メールを送信します
func (h *VerificationHandler) SendVerificationEmail(c *gin.Context) {
	var req SendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ユーザーIDを取得
	userID, exists := middleware.GetUserId(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	// クラークIDを取得
	clerkID, exists := middleware.GetClerkUserId(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証情報が不足しています"})
		return
	}

	// Clerkからユーザー情報を取得
	clerkUser, err := user.Get(c.Request.Context(), clerkID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("ユーザー情報の取得に失敗しました: %v", err)})
		return
	}

	// ユーザー名を取得
	userName := ""
	if clerkUser.FirstName != nil {
		userName = *clerkUser.FirstName
	}
	if userName == "" {
		// 名前がない場合はメールアドレスのユーザー部分を使用
		userName = req.Email
	}

	// トークンを生成
	token, err := h.tokenManager.GenerateToken(userID, clerkID, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("トークン生成に失敗しました: %v", err)})
		return
	}

	// 確認URLを作成
	verifyURL := fmt.Sprintf(h.verificationURLFmt, token)

	// メールを送信
	err = h.mailSender.SendVerificationEmail(req.Email, userName, verifyURL, int(tokenExpirationTime.Hours()))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("メール送信に失敗しました: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "確認メールを送信しました"})
}

// VerifyRequest はトークン検証リクエスト
type VerifyRequest struct {
	Token        string `json:"token" binding:"required"`
	DisclosureID int32  `json:"disclosure_id"`
}

// VerifyToken はトークンを検証します
func (h *VerificationHandler) VerifyToken(c *gin.Context) {
	var req VerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// トークンを検証
	claims, err := h.tokenManager.VerifyToken(req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("無効なトークンです: %v", err)})
		return
	}

	result := gin.H{
		"message":   "生存確認が完了しました",
		"user_id":   claims.UserID,
		"clerk_id":  claims.ClerkID,
		"email":     claims.Email,
		"validated": true,
	}

	// Disclosureのステータスを更新（生存確認されたので開示申請を却下）
	if req.DisclosureID > 0 {
		fmt.Printf("受信したDisclosureID: %d\n", req.DisclosureID) // デバッグ出力

		// Disclosureを取得
		disclosure, err := h.queries.GetDisclosure(c, req.DisclosureID)
		if err != nil {
			fmt.Printf("GetDisclosure失敗 ID=%d: %v\n", req.DisclosureID, err) // デバッグ出力
			result["disclosure_status"] = fmt.Sprintf("開示申請が見つかりません: %v", err)
			c.JSON(http.StatusOK, result)
			return
		}

		fmt.Printf("取得したDisclosure: %+v\n", disclosure) // デバッグ出力

		// パッサーIDが一致するか確認 (セキュリティチェック)
		if disclosure.PasserID.String() != claims.UserID {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "このリクエストを確認する権限がありません"})
			return
		}

		// Disclosureが処理中か確認
		if !disclosure.InProgress {
			result["disclosure_status"] = "この開示申請はすでに処理されています"
			c.JSON(http.StatusOK, result)
			return
		}

		// パッサーIDをUUIDに変換
		passerUUID, err := uuid.Parse(claims.UserID)
		if err != nil {
			result["disclosure_status"] = fmt.Sprintf("UUIDの解析に失敗しました: %v", err)
			c.JSON(http.StatusOK, result)
			return
		}

		// PostgreSQL UUIDに変換
		var passerPgUUID pgtype.UUID
		err = passerPgUUID.Scan(passerUUID.String())
		if err != nil {
			result["disclosure_status"] = fmt.Sprintf("UUID変換に失敗しました: %v", err)
			c.JSON(http.StatusOK, result)
			return
		}

		// 現在時刻を取得
		now := time.Now()
		var pgNow pgtype.Timestamp
		err = pgNow.Scan(now)
		if err != nil {
			result["disclosure_status"] = fmt.Sprintf("タイムスタンプ変換に失敗しました: %v", err)
			c.JSON(http.StatusOK, result)
			return
		}

		// 新しいUUIDを生成
		newUUID := uuid.New()
		var newPgUUID pgtype.UUID
		err = newPgUUID.Scan(newUUID.String())
		if err != nil {
			result["disclosure_status"] = fmt.Sprintf("UUID生成に失敗しました: %v", err)
			c.JSON(http.StatusOK, result)
			return
		}

		// 生存確認履歴を追加
		aliveCheckParams := query.CreateAliveCheckHistoryParams{
			ID:           newPgUUID,
			TargetUserID: passerPgUUID,
			CheckMethod:  1, // マジックリンクによる確認
			CheckTime:    pgNow,
			CustomData:   []byte("{}"),
		}

		aliveCheckHistory, err := h.queries.CreateAliveCheckHistory(c, aliveCheckParams)
		if err != nil {
			fmt.Printf("生存確認履歴の追加に失敗: %v\n", err)
			result["disclosure_status"] = fmt.Sprintf("生存確認履歴の追加に失敗しました: %v", err)
			c.JSON(http.StatusOK, result)
			return
		}

		fmt.Printf("生存確認履歴を追加しました: %+v\n", aliveCheckHistory)

		// 更新パラメータの構築 - 必ずdisclosureから取得したRequesterIDを使う
		updateParams := query.UpdateDisclosureParams{
			ID:          disclosure.ID,
			RequesterID: disclosure.RequesterID, // ここが重要: WHERE句の条件に必要
			PasserID:    disclosure.PasserID,
			Disclosed:   false,
			Deadline:    disclosure.Deadline,
			PreventedBy: aliveCheckHistory.ID, // 追加した生存確認履歴のIDを使用
			CustomData:  disclosure.CustomData,
			InProgress:  false,
		}

		// デバッグ用にパラメータを表示
		fmt.Printf("UpdateParams: %+v\n", updateParams)

		// 更新実行
		_, err = h.queries.UpdateDisclosure(c, updateParams)
		if err != nil {
			fmt.Printf("UpdateDisclosure失敗: %v\n", err)
			result["disclosure_status"] = fmt.Sprintf("開示申請の更新に失敗しました: %v", err)
		} else {
			result["disclosure_status"] = "生存確認により開示申請を却下しました"
		}
	}

	c.JSON(http.StatusOK, result)
}
