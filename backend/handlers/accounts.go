package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/middleware"
	"github.com/a-company-jp/digi-baton/proto/crypto"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type AccountTemplate struct {
	ID             int32  `json:"id" validate:"required"`
	AppName        string `json:"appName" validate:"required"`
	AppDescription string `json:"appDescription" validate:"required"`
	AppIconUrl     string `json:"appIconUrl" validate:"required"`
}

type AccountTemplateResponse AccountTemplate // 他と仕様を合わせるため

var accountTemplateMap map[int32]AccountTemplate = map[int32]AccountTemplate{
	1: {
		ID:             1,
		AppName:        "Google",
		AppDescription: "Google",
		AppIconUrl:     "https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/google.webp",
	},
	2: {
		ID:             2,
		AppName:        "X",
		AppDescription: "X",
		AppIconUrl:     "https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/x.webp",
	},
	3: {
		ID:             3,
		AppName:        "Instagram",
		AppDescription: "Instagram",
		AppIconUrl:     "https://digibatonmainstorageacct.blob.core.windows.net/digibatonpublic/instagram.webp",
	},
}

type AccountsHandler struct {
	queries      *query.Queries
	cryptoClient crypto.EncryptionServiceClient
}

func NewAccountsHandler(q *query.Queries, cryptoClient crypto.EncryptionServiceClient) *AccountsHandler {
	return &AccountsHandler{queries: q, cryptoClient: cryptoClient}
}

// 冗長に見えるが、後でrequestとresponseのフィールドが変わる可能性があるため
type AccountResponse struct {
	ID             int32                  `json:"id" validate:"required"`
	AppTemplateID  *int32                 `json:"appTemplateID"`
	AppName        string                 `json:"appName" validate:"required"`
	AppDescription string                 `json:"appDescription" validate:"required"`
	AppIconUrl     string                 `json:"appIconUrl"`
	Username       string                 `json:"username"`
	Email          string                 `json:"email"`
	Password       string                 `json:"password" validate:"required"`
	Memo           string                 `json:"memo"`
	PlsDelete      bool                   `json:"plsDelete"  validate:"required"`
	Message        string                 `json:"message"`
	PasserID       string                 `json:"passerID"  validate:"required"`
	TrustID        int32                  `json:"trustID" validate:"required"`
	IsDisclosed    bool                   `json:"isDisclosed" validate:"required"`
	CustomData     map[string]interface{} `json:"customData"`
}

type AccountCreateRequest struct {
	AppTemplateID  *int32                  `json:"appTemplateID"`
	AppName        string                  `json:"appName" validate:"required"`
	AppDescription string                  `json:"appDescription"`
	AppIconUrl     string                  `json:"appIconUrl"`
	Username       string                  `json:"username"`
	Email          string                  `json:"email"`
	Password       string                  `json:"password" validate:"required"`
	Memo           string                  `json:"memo"`
	PlsDelete      bool                    `json:"plsDelete" validate:"required"`
	Message        string                  `json:"message"`
	PasserID       string                  `json:"passerID" validate:"required"`
	TrustID        int32                   `json:"trustID" validate:"required"`
	CustomData     *map[string]interface{} `json:"customData"`
}

// List アカウント一覧取得
// @Summary アカウント一覧取得
// @Description ユーザが開示しているアカウント一覧を取得する
// @Tags accounts
// @Accept json
// @Produce json
// @Success 200 {array} AccountResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /accounts [get]
func (h *AccountsHandler) List(c *gin.Context) {
	// 認証済みミドルウェアからユーザIDを取得
	userUUID, exists := middleware.GetUserIdUUID(c)
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザー認証に失敗しました"})
		return
	}

	accounts, err := h.queries.ListAccountsByPasserId(c, userUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "アカウント一覧取得に失敗しました", "details": err.Error()})
		return
	}

	response := make([]AccountResponse, len(accounts))
	for i, account := range accounts {
		resp, err := accountToResponse(account, h.cryptoClient, c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "アカウント情報の変換に失敗しました", "details": err.Error()})
			return
		}
		response[i] = resp
	}

	c.JSON(http.StatusOK, response)
}

// Create アカウント作成
// @Summary アカウント作成
// @Description アカウントを作成する
// @Tags accounts
// @Accept json
// @Produce json
// @Param account body AccountCreateRequest true "アカウント情報"
// @Success 200 {object} AccountResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /accounts [post]
func (h *AccountsHandler) Create(c *gin.Context) {
	var req AccountCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	params, err := reqToCreateAccountParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "パラメータ変換中にエラーが発生しました", "details": err.Error()})
		return
	}

	// パスワードを暗号化する
	if req.Password != "" {
		encResp, err := h.cryptoClient.Encrypt(c, &crypto.EncryptRequest{
			UserId:    req.PasserID,
			Plaintext: []byte(req.Password),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "パスワードの暗号化に失敗しました", "details": err.Error()})
			return
		}
		params.EncPassword = encResp.GetCiphertext()
	}

	account, err := h.queries.CreateAccount(c, params)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "アカウント作成に失敗しました", "details": err.Error()})
		return
	}

	response, err := accountToResponse(account, h.cryptoClient, c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "アカウント情報の変換に失敗しました", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

type AccountUpdateRequest struct {
	ID int32 `json:"id"`
	AccountCreateRequest
}

// Update アカウント更新
// @Summary アカウント更新
// @Description アカウントを更新する
// @Tags accounts
// @Accept json
// @Produce json
// @Param account body AccountCreateRequest true "アカウント情報"
// @Success 200 {object} AccountResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /accounts [put]
func (h *AccountsHandler) Update(c *gin.Context) {
	var req AccountUpdateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	params, err := reqToUpdateAccountParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "パラメータ変換中にエラーが発生しました", "details": err.Error()})
		return
	}

	// パスワードを暗号化する
	if req.Password != "" {
		encResp, err := h.cryptoClient.Encrypt(c, &crypto.EncryptRequest{
			UserId:    req.PasserID,
			Plaintext: []byte(req.Password),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "パスワードの暗号化に失敗しました", "details": err.Error()})
			return
		}
		params.EncPassword = encResp.GetCiphertext()
	}

	account, err := h.queries.GetAccount(c, params.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "アカウントが見つかりません", "details": err.Error()})
		return
	}

	account, err = h.queries.UpdateAccount(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "アカウント更新に失敗しました", "details": err.Error()})
		return
	}

	response, err := accountToResponse(account, h.cryptoClient, c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "アカウント情報の変換に失敗しました", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

type DeleteAccountCreateRequest struct {
	PasserID string `json:"passerID"`
	DeviceID int    `json:"deviceID"`
}

// Delete アカウント削除
// @Summary アカウント削除
// @Description アカウントを削除する
// @Tags accounts
// @Accept json
// @Produce json
// @Param account body DeleteAccountCreateRequest true "アカウント情報"
// @Success 200 {object} AccountResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /accounts [delete]
func (h *AccountsHandler) Delete(c *gin.Context) {
	var req DeleteAccountCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"リクエストデータが不正です", err.Error()})
		return
	}

	pID, err := toPGUUID(req.PasserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"UUID変換に失敗しました", err.Error()})
		return
	}

	account, err := h.queries.DeleteAccount(c, query.DeleteAccountParams{ID: int32(req.DeviceID), PasserID: pID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"アカウント削除に失敗しました", err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// ListTemplate
// @Summary アカウントテンプレート一覧
// @Description アカウントテンプレートの一覧取得
// @Tags accounts
// @Accept json
// @Produce json
// @Success 200 {array} AccountTemplateResponse "成功"
// @Router /accounts/templates [get]
func (h *AccountsHandler) ListTemplate(c *gin.Context) {
	templates := make([]AccountTemplate, 0, len(accountTemplateMap))
	for _, template := range accountTemplateMap {
		templates = append(templates, template)
	}
	c.JSON(http.StatusOK, templates)
}

func reqToCreateAccountParams(req AccountCreateRequest) (query.CreateAccountParams, error) {
	var params query.CreateAccountParams

	params.AppName = pgtype.Text{String: req.AppName, Valid: true}
	params.AppDescription = pgtype.Text{String: req.AppDescription, Valid: true}
	params.AppIconUrl = pgtype.Text{String: req.AppIconUrl, Valid: true}
	params.Username = req.Username
	params.Email = req.Email
	params.Memo = req.Memo
	params.Message = req.Message
	params.TrustID = req.TrustID

	if req.PasserID != "" {
		uuid, err := toPGUUID(req.PasserID)
		if err != nil {
			return params, err
		}
		params.PasserID = uuid
	}

	if req.AppTemplateID == nil {
		params.AppTemplateID = pgtype.Int4{Valid: false}
	} else {
		params.AppTemplateID = pgtype.Int4{Int32: *req.AppTemplateID, Valid: true}
	}

	if req.Password == "" {
		return params, errors.New("パスワードは必須です。")
	}
	strings.ReplaceAll(req.Password, " ", "")

	if req.CustomData == nil {
		params.CustomData = nil
	} else {
		// Convert []map[string]interface{} to JSON []byte
		jsonData, err := json.Marshal(*req.CustomData)
		if err != nil {
			return params, fmt.Errorf("CustomDataのJSON変換に失敗しました: %w", err)
		}
		params.CustomData = jsonData
	}

	return params, nil
}

func reqToUpdateAccountParams(req AccountUpdateRequest) (query.UpdateAccountParams, error) {
	var params query.UpdateAccountParams

	params.ID = req.ID
	params.AppName = pgtype.Text{String: req.AppName, Valid: req.AppName != ""}
	params.AppDescription = pgtype.Text{String: req.AppDescription, Valid: req.AppDescription != ""}
	params.AppIconUrl = pgtype.Text{String: req.AppIconUrl, Valid: req.AppIconUrl != ""}
	params.Username = req.Username
	params.Email = req.Email
	params.Memo = req.Memo
	params.Message = req.Message

	if req.PasserID != "" {
		uuid, err := toPGUUID(req.PasserID)
		if err != nil {
			return params, err
		}
		params.PasserID = uuid
	}

	if req.AppTemplateID == nil {
		params.AppTemplateID = pgtype.Int4{Valid: false}
	} else {
		params.AppTemplateID = pgtype.Int4{Int32: *req.AppTemplateID, Valid: true}
	}

	if req.Password == "" {
		return params, errors.New("パスワードは必須です。")
	}
	strings.ReplaceAll(req.Password, " ", "")

	if req.CustomData == nil {
		params.CustomData = nil
	} else {
		// Convert []map[string]interface{} to JSON []byte
		jsonData, err := json.Marshal(*req.CustomData)
		if err != nil {
			return params, fmt.Errorf("CustomDataのJSON変換に失敗しました: %w", err)
		}
		params.CustomData = jsonData
	}

	return params, nil
}

func accountToResponse(account query.Account, cryptoClient crypto.EncryptionServiceClient, ctx context.Context) (AccountResponse, error) {
	var appTemplateID *int32
	var appName, appDescription, appIconUrl string

	if account.AppTemplateID.Valid {
		appTemplateID = &account.AppTemplateID.Int32
		if template, ok := accountTemplateMap[account.AppTemplateID.Int32]; ok {
			appName = template.AppName
			appDescription = template.AppDescription
			appIconUrl = template.AppIconUrl
		}
	} else {
		appTemplateID = nil
		appName = account.AppName.String
		appDescription = account.AppDescription.String
		appIconUrl = account.AppIconUrl.String
	}

	var trustID int32
	trustID = account.TrustID

	// 暗号化されたパスワードを復号化
	password := ""
	// 暗号化されたパスワードがある場合のみ復号化を試みる
	if len(account.EncPassword) > 0 && cryptoClient != nil && ctx != nil {
		// パスワードの復号化を行う
		decResp, err := cryptoClient.Decrypt(ctx, &crypto.DecryptRequest{
			UserId:     account.PasserID.String(),
			Ciphertext: account.EncPassword,
		})
		if err != nil {
			fmt.Println(err)
			return AccountResponse{}, fmt.Errorf("パスワードの復号化に失敗しました: %w", err)
		}
		password = string(decResp.GetPlaintext()) // byte[]をstringに変換
	}

	// CustomDataをJSONからmap[string]interface{}に変換
	var customData map[string]interface{}
	if account.CustomData != nil {
		if err := json.Unmarshal(account.CustomData, &customData); err != nil {
			// エラーが発生した場合は空のマップを使用
			customData = make(map[string]interface{})
		}
	} else {
		customData = make(map[string]interface{})
	}

	return AccountResponse{
		ID:             account.ID,
		AppTemplateID:  appTemplateID,
		AppName:        appName,
		AppDescription: appDescription,
		AppIconUrl:     appIconUrl,
		Username:       account.Username,
		Email:          account.Email,
		Password:       password,
		Memo:           account.Memo,
		PlsDelete:      account.PlsDelete,
		Message:        account.Message,
		PasserID:       account.PasserID.String(),
		TrustID:        trustID,
		IsDisclosed:    account.IsDisclosed,
		CustomData:     customData,
	}, nil
}
