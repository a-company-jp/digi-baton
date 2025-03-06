package handlers

import (
	"bytes"
	"errors"
	"net/http"
	"strings"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type AccountTemplate struct {
	ID             int32  `json:"id"`
	AppName        string `json:"appName"`
	AppDescription string `json:"appDescription"`
	AppIconUrl     string `json:"appIconUrl"`
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
	queries *query.Queries
}

func NewAccountsHandler(q *query.Queries) *AccountsHandler {
	return &AccountsHandler{queries: q}
}

// 冗長に見えるが、後でrequestとresponseのフィールドが変わる可能性があるため
type AccountResponse struct {
	ID              int32  `json:"id"`
	AppTemplateID   *int32 `json:"appTemplateID"`
	AppName         string `json:"appName"`
	AppDescription  string `json:"appDescription"`
	AppIconUrl      string `json:"appIconUrl"`
	AccountUsername string `json:"accountUsername"`
	EncPassword     []byte `json:"encPassword"`
	Memo            string `json:"memo"`
	PlsDelete       bool   `json:"plsDelete"`
	Message         string `json:"message"`
	PasserID        string `json:"passerID"`
	TrustID         *int32 `json:"trustID"`
	IsDisclosed     bool   `json:"isDisclosed"`
	CustomData      []byte `json:"customData"`
}

type AccountCreateRequest struct {
	AppTemplateID   *int32  `json:"appTemplateID"`
	AppName         string  `json:"appName"`
	AppDescription  string  `json:"appDescription"`
	AppIconUrl      string  `json:"appIconUrl"`
	AccountUsername string  `json:"accountUsername"`
	Password        string  `json:"password"`
	Memo            string  `json:"memo"`
	PlsDelete       bool    `json:"plsDelete"`
	Message         string  `json:"message"`
	PasserID        string  `json:"passerID"`
	CustomData      *[]byte `json:"customData"`
}

// @Summary アカウント一覧取得
// @Description ユーザが開示しているアカウント一覧を取得する
// @Tags accounts
// @Accept json
// @Produce json
// @Param passerID query string true "パスワードを取得するユーザのID"
// @Success 200 {array} AccountResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /accounts [get]
func (h *AccountsHandler) List(c *gin.Context) {
	passerID := c.Query("passerID")
	if passerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "パラメータが不正です", "details": "passerIDが指定されていません"})
		return
	}

	pID, err := toPGUUID(passerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "パラメータ変換中にエラーが発生しました", "details": err.Error()})
		return
	}

	accounts, err := h.queries.ListAccountsByPasserId(c, pID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "アカウント一覧取得に失敗しました", "details": err.Error()})
		return
	}

	response := make([]AccountResponse, len(accounts))
	for i, account := range accounts {
		response[i] = accountToResponse(account)
	}

	c.JSON(http.StatusOK, response)
}

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

	account, err := h.queries.CreateAccount(c, params)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "アカウント作成に失敗しました", "details": err.Error()})
		return
	}

	response := accountToResponse(account)

	c.JSON(http.StatusOK, response)
}

type AccountUpdateRequest struct {
	ID int32 `json:"id"`
	AccountCreateRequest
}

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

	response := accountToResponse(account)

	c.JSON(http.StatusOK, response)

}

type DeleteAccountCreateRequest struct {
	PasserID string `json:"passerID"`
	DeviceID int    `json:"deviceID"`
}

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
	params.AccountUsername = req.AccountUsername
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
	params.EncPassword = []byte(req.Password) // TODO: encrypt

	if req.CustomData == nil || bytes.Equal(*req.CustomData, []byte("\x00")) {
		params.CustomData = nil
	} else {
		params.CustomData = *req.CustomData
	}

	return params, nil
}

func reqToUpdateAccountParams(req AccountUpdateRequest) (query.UpdateAccountParams, error) {
	var params query.UpdateAccountParams

	params.ID = req.ID
	params.AppName = pgtype.Text{String: req.AppName, Valid: req.AppName != ""}
	params.AppDescription = pgtype.Text{String: req.AppDescription, Valid: req.AppDescription != ""}
	params.AppIconUrl = pgtype.Text{String: req.AppIconUrl, Valid: req.AppIconUrl != ""}
	params.AccountUsername = req.AccountUsername
	params.EncPassword = []byte(req.Password) // TODO: encrypt
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
	params.EncPassword = []byte(req.Password) // TODO: encrypt

	if req.CustomData == nil || bytes.Equal(*req.CustomData, []byte("\x00")) {
		params.CustomData = nil
	} else {
		params.CustomData = *req.CustomData
	}

	return params, nil
}

func accountToResponse(account query.Account) AccountResponse {

	var appTemplateID *int32
	if account.AppTemplateID.Valid {
		appTemplateID = &account.AppTemplateID.Int32
	} else {
		appTemplateID = nil
	}

	var trustID *int32
	if account.TrustID.Valid {
		trustID = &account.TrustID.Int32
	} else {
		trustID = nil
	}

	return AccountResponse{
		ID:              account.ID,
		AppTemplateID:   appTemplateID,
		AppName:         account.AppName.String,
		AppDescription:  account.AppDescription.String,
		AppIconUrl:      account.AppIconUrl.String,
		AccountUsername: account.AccountUsername,
		EncPassword:     account.EncPassword,
		Memo:            account.Memo,
		PlsDelete:       account.PlsDelete,
		Message:         account.Message,
		PasserID:        account.PasserID.String(),
		TrustID:         trustID,
		IsDisclosed:     account.IsDisclosed,
		CustomData:      account.CustomData,
	}
}
