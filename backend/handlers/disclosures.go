package handlers

import (
	"bytes"
	"context"
	"encoding/json"
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

type DisclosuresHandler struct {
	queries            *query.Queries
	mailSender         *mail.Sender
	tokenManager       *verification.VerificationTokenManager
	verificationURLFmt string
}

func NewDisclosuresHandler(q *query.Queries) *DisclosuresHandler {
	// メール送信機能の初期化
	mailjetPublicKey := os.Getenv("MAILJET_API_KEY_PUBLIC")
	mailjetPrivateKey := os.Getenv("MAILJET_API_KEY_PRIVATE")
	mailjetFromEmail := os.Getenv("MAILJET_FROM_EMAIL")
	mailjetFromName := os.Getenv("MAILJET_FROM_NAME")
	jwtSecret := os.Getenv("JWT_SECRET")
	frontendURL := "https://key-per.com"

	// 有効期限は1週間に設定
	expiresIn := 7 * 24 * time.Hour

	// トークンマネージャーを初期化
	tokenManager := verification.NewVerificationTokenManager(jwtSecret, expiresIn)

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

	return &DisclosuresHandler{
		queries:            q,
		mailSender:         mailSender,
		tokenManager:       tokenManager,
		verificationURLFmt: frontendURL + "/verify?token=%s&disclosure_id=%d",
	}
}

type DisclosureResponse struct {
	ID          int32      `json:"id" validate:"required"`
	RequesterID string     `json:"requesterID" validate:"required"`
	PasserID    string     `json:"passerID" validate:"required"`
	IssuedTime  string     `json:"issuedTime" validate:"required"`
	InProgress  bool       `json:"inProgress" validate:"required"`
	Disclosed   bool       `json:"disclosed" validate:"required"`
	PreventedBy *uuid.UUID `json:"preventedBy" validate:"required"`
	Deadline    string     `json:"deadline" validate:"required"`
	CustomData  string     `json:"customData"`
}

// @Summary		開示申請一覧取得
// @Description	ユーザが受けた開示請求一覧を取得する
// @Tags			disclosures
// @Accept			json
// @Produce		json
// @Success		200			{array}		DisclosureResponse	"成功"
// @Failure		400			{object}	ErrorResponse		"リクエストが不正"
// @Failure		500			{object}	ErrorResponse		"開示請求が見つかりませんでした"
// @Router			/disclosures [get]
func (h *DisclosuresHandler) List(c *gin.Context) {
	requesterID, ok := middleware.GetUserIdUUID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requesterID is required"})
		return
	}

	disclosures, err := h.queries.ListDisclosuresByRequesterId(c, requesterID)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusNotFound, gin.H{"error": "開示請求が見つかりませんでした"})
		return
	}

	response := make([]DisclosureResponse, len(disclosures))
	for i, d := range disclosures {
		res, err := disclosureToResponse(d)
		if err != nil {
			fmt.Println(err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to convert disclosure to response"})
			return
		}
		response[i] = res
	}

	c.JSON(http.StatusOK, response)
}

type DisclosureCreateRequest struct {
	PasserID         string                 `json:"passerID"`
	DeadlineDuration int32                  `json:"deadlineDuration"`
	CustomData       map[string]interface{} `json:"customData"`
}

// @Summary		開示申請作成
// @Description	ユーザが他のユーザに開示請求を出す
// @Tags			disclosures
// @Accept			json
// @Produce		json
// @Param			disclosure	body		DisclosureCreateRequest	true	"開示請求情報"
// @Success		200			{object}	DisclosureResponse		"成功"
// @Failure		400			{object}	ErrorResponse			"リクエストが不正"
// @Failure		500			{object}	ErrorResponse			"開示請求の作成に失敗"
// @Router			/disclosures [post]
func (h *DisclosuresHandler) Create(c *gin.Context) {
	requesterID, ok := middleware.GetUserIdUUID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: ""})
		return
	}
	var req DisclosureCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	params, err := reqToCreateDisclosureParams(requesterID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	disclosure, err := h.queries.CreateDisclosure(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "開示請求の作成に失敗しました", Details: err.Error()})
		return
	}

	res, err := disclosureToResponse(disclosure)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "開示請求のレスポンス変換に失敗しました", Details: err.Error()})
		return
	}

	// 生存確認メールを送信するロジック
	h.sendAliveCheckEmail(c.Request.Context(), disclosure)

	c.JSON(http.StatusOK, res)
}

// sendAliveCheckEmail は生存確認のためのメールを送信します
func (h *DisclosuresHandler) sendAliveCheckEmail(ctx context.Context, disclosure query.Disclosure) {
	fmt.Println("h.sendAliveCheckEmail()")
	// このコンテキストではクエリを実行しないので新しいコンテキストを作成
	passerID := disclosure.PasserID.String()

	// DBからパッサーのClerkIDを取得する
	users, err := h.queries.ListUsers(ctx)
	if err != nil {
		return
	}

	var clerkUserID string
	for _, u := range users {
		if u.ID.String() == passerID {
			clerkUserID = u.ClerkUserID
			break
		}
	}

	if clerkUserID == "" {
		return // Clerk IDが見つからない
	}

	// Clerkからユーザー情報を取得
	clerkUser, err := user.Get(ctx, clerkUserID)
	if err != nil {
		return
	}

	// メールアドレスがない場合は処理終了
	if len(clerkUser.EmailAddresses) == 0 {
		return
	}

	// メールアドレスを取得
	passerEmail := clerkUser.EmailAddresses[0].EmailAddress
	fmt.Println(passerEmail)

	// ユーザー名を取得
	passerName := ""
	if clerkUser.FirstName != nil {
		passerName = *clerkUser.FirstName
	}
	if passerName == "" {
		passerName = passerEmail
	}

	// 検証トークンを生成（トークンにdisclosure_idを含める）
	token, err := h.tokenManager.GenerateToken(passerID, clerkUserID, passerEmail)
	if err != nil {
		return
	}

	// 生存確認リンクを作成
	verificationURL := fmt.Sprintf(h.verificationURLFmt, token, disclosure.ID)

	// 生存確認メールを送信
	_ = h.mailSender.SendVerificationEmail(
		passerEmail,
		passerName,
		verificationURL,
		int(h.tokenManager.ExpiresIn().Hours()),
	)
}

type DisclosureUpdateRequest struct {
	ID          int32      `json:"id"`
	PasserID    string     `json:"passerID"`
	RequesterID string     `json:"requesterID"`
	InProgress  bool       `json:"inProgress"`
	Disclosed   bool       `json:"disclosed"`
	PreventedBy *uuid.UUID `json:"preventedBy"`
	DeadLine    string     `json:"deadLine"`
	CustomData  []byte     `json:"customData"`
}

// @Summary		開示申請更新
// @Description	開示申請のステータスを更新する
// @Tags			disclosures
// @Accept			json
// @Produce		json
// @Param			disclosure	body		DisclosureUpdateRequest	true	"開示申請情報"
// @Success		200			{object}	DisclosureResponse		"成功"
// @Failure		400			{object}	ErrorResponse			"リクエストが不正"
// @Failure		500			{object}	ErrorResponse			"開示申請の更新に失敗"
// @Router			/disclosures [put]
func (h *DisclosuresHandler) Update(c *gin.Context) {
	var req DisclosureUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	params, err := reqToUpdateDisclosureParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	disclosure, err := h.queries.GetDisclosure(c, params.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "開示申請が見つかりませんでした", Details: err.Error()})
		return
	}

	disclosure, err = h.queries.UpdateDisclosure(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "開示申請の更新に失敗しました", Details: err.Error()})
		return
	}

	res, err := disclosureToResponse(disclosure)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "開示申請のレスポンス変換に失敗しました", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

type DisclosureDeleteRequest struct {
	ID          int32  `json:"id"`
	RequesterID string `json:"requesterID"`
}

// @Summary		開示申請削除
// @Description	開示申請を削除する
// @Tags			disclosures
// @Accept			json
// @Produce		json
// @Param			disclosure	body		DisclosureDeleteRequest	true	"開示申請情報"
// @Success		200			{object}	DisclosureResponse		"成功"
// @Failure		400			{object}	ErrorResponse			"リクエストが不正"
// @Failure		500			{object}	ErrorResponse			"開示申請の削除に失敗"
// @Router			/disclosures [delete]
func (h *DisclosuresHandler) Delete(c *gin.Context) {
	var req DisclosureDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	params, err := reqToDeleteDisclosureParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	disclosure, err := h.queries.DeleteDisclosure(c, query.DeleteDisclosureParams{
		ID:          params.ID,
		RequesterID: params.RequesterID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete disclosure"})
		return
	}

	res, err := disclosureToResponse(disclosure)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to convert disclosure to response"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func reqToCreateDisclosureParams(requesterID pgtype.UUID, req DisclosureCreateRequest) (query.CreateDisclosureParams, error) {

	passerID, err := toPGUUID(req.PasserID)
	if err != nil {
		return query.CreateDisclosureParams{}, err
	}

	// CustomDataをJSONに変換
	var customDataBytes []byte
	if req.CustomData != nil {
		var err error
		customDataBytes, err = json.Marshal(req.CustomData)
		if err != nil {
			return query.CreateDisclosureParams{}, fmt.Errorf("failed to marshal custom data: %w", err)
		}
	} else {
		customDataBytes = []byte("{}")
	}

	return query.CreateDisclosureParams{
		PasserID:    passerID,
		RequesterID: requesterID,
		IssuedTime:  toPGTimestamp(time.Now()),
		Deadline:    toPGTimestamp(time.Now().AddDate(0, 0, int(req.DeadlineDuration))),
		CustomData:  customDataBytes,
	}, nil
}

func reqToUpdateDisclosureParams(req DisclosureUpdateRequest) (query.UpdateDisclosureParams, error) {

	var params query.UpdateDisclosureParams

	params.ID = req.ID

	requesterID, err := toPGUUID(req.RequesterID)
	if err != nil {
		return query.UpdateDisclosureParams{}, err
	}
	params.RequesterID = requesterID

	if req.PreventedBy == nil {
		params.PreventedBy = pgtype.UUID{Valid: false}
	} else {
		preventedBy, err := toPGUUID(req.PreventedBy.String())
		if err != nil {
			return query.UpdateDisclosureParams{}, err
		}
		params.PreventedBy = preventedBy
	}

	if req.DeadLine == "" {
		params.Deadline = pgtype.Timestamp{Valid: false}
	} else {
		t, err := time.Parse(time.RFC3339, req.DeadLine)
		if err != nil {
			return query.UpdateDisclosureParams{}, err
		}
		params.Deadline = pgtype.Timestamp{Time: t, Valid: true}
	}

	passerID, err := toPGUUID(req.PasserID)
	if err != nil {
		return query.UpdateDisclosureParams{}, err
	}
	params.PasserID = passerID

	if len(req.CustomData) == 0 || string(req.CustomData) == "null" || bytes.Equal(req.CustomData, []byte("\x00")) {
		req.CustomData = []byte("{}")
	}

	return params, nil
}

func reqToDeleteDisclosureParams(req DisclosureDeleteRequest) (query.DeleteDisclosureParams, error) {
	requesterID, err := toPGUUID(req.RequesterID)
	if err != nil {
		return query.DeleteDisclosureParams{}, err
	}

	return query.DeleteDisclosureParams{
		ID:          req.ID,
		RequesterID: requesterID,
	}, nil
}

func disclosureToResponse(d query.Disclosure) (DisclosureResponse, error) {
	var response DisclosureResponse

	customData, err := json.Marshal(d.CustomData)
	if err != nil {
		customData = []byte("{}")
	}

	response.ID = d.ID
	response.RequesterID = d.RequesterID.String()
	response.PasserID = d.PasserID.String()
	response.IssuedTime = d.IssuedTime.Time.Format(time.RFC3339)
	response.InProgress = d.InProgress
	response.Disclosed = d.Disclosed

	if d.PreventedBy.Valid {
		u, err := uuid.FromBytes(d.PreventedBy.Bytes[:])
		if err != nil {
			return DisclosureResponse{}, err
		}
		response.PreventedBy = &u
	} else {
		response.PreventedBy = nil
	}
	response.Deadline = d.Deadline.Time.Format(time.RFC3339)
	response.CustomData = string(customData)

	return response, nil
}
