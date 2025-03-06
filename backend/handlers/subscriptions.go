package handlers

import (
	"net/http"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/middleware"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type SubscriptionsHandler struct {
	queries *query.Queries
}

func NewSubscriptionsHandler(q *query.Queries) *SubscriptionsHandler {
	return &SubscriptionsHandler{queries: q}
}

type SubscriptionResponse struct {
	ID           int32  `json:"id"`
	ServiceName  string `json:"serviceName"`
	IconUrl      string `json:"iconUrl"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	EncPassword  []byte `json:"encPassword"`
	Amount       int32  `json:"amount"`
	Currency     string `json:"currency"`
	BillingCycle string `json:"billingCycle"`
	Memo         string `json:"memo"`
	PlsDelete    bool   `json:"plsDelete"`
	Message      string `json:"message"`
	PasserID     string `json:"passerID"`
	TrustID      *int32 `json:"trustID"`
	IsDisclosed  bool   `json:"isDisclosed"`
	CustomData   []byte `json:"customData"`
}

type SubscriptionCreateRequest struct {
	ServiceName  string  `json:"serviceName"`
	IconUrl      string  `json:"iconUrl,omitempty"`
	Username     string  `json:"username"`
	Email        string  `json:"email"`
	Password     string  `json:"password"`
	Amount       int32   `json:"amount"`
	Currency     string  `json:"currency"`
	BillingCycle string  `json:"billingCycle"`
	Memo         string  `json:"memo,omitempty"`
	PlsDelete    bool    `json:"plsDelete"`
	Message      string  `json:"message,omitempty"`
	PasserID     string  `json:"passerID,omitempty"`
	CustomData   *[]byte `json:"customData"`
}

// @Summary サブスクリプション一覧取得
// @Description ユーザが開示しているサブスクリプション一覧を取得する
// @Tags subscriptions
// @Accept json
// @Produce json
// @Success 200 {array} SubscriptionResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /subscriptions [get]
func (h *SubscriptionsHandler) List(c *gin.Context) {
	// 認証済みミドルウェアからユーザIDを取得
	userUUID, exists := middleware.GetUserIdUUID(c)
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザー認証に失敗しました"})
		return
	}

	// ListSubscriptionsByPasserIdが存在しない場合は、全件取得してフィルタリングする
	// 理想的にはDBで絞り込むべきだが、実装がまだの場合はフロントエンドでフィルタリング
	subscriptions, err := h.queries.ListSubscriptionsByPasserId(c, userUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"サブスクリプション一覧の取得に失敗しました", err.Error()})
		return
	}

	var response []SubscriptionResponse
	for _, subscription := range subscriptions {
		response = append(response, subscriptionToResponse(subscription))
	}

	c.JSON(http.StatusOK, response)
}

// @Summary サブスクリプション作成
// @Description 新しいサブスクリプションを作成する
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param subscription body SubscriptionCreateRequest true "サブスクリプション情報"
// @Success 200 {object} SubscriptionResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /subscriptions [post]
func (h *SubscriptionsHandler) Create(c *gin.Context) {
	var req SubscriptionCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"リクエストデータが不正です", err.Error()})
		return
	}

	params, err := reqToCreateSubscriptionParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"パラメータ変換中にエラーが発生しました", err.Error()})
		return
	}

	subscription, err := h.queries.CreateSubscription(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"サブスクリプション作成に失敗しました", err.Error()})
		return
	}

	c.JSON(http.StatusOK, subscriptionToResponse(subscription))
}

type SubscriptionUpdateRequest struct {
	ID int32 `json:"id"`
	SubscriptionCreateRequest
}

// @Summary サブスクリプション更新
// @Description 既存のサブスクリプション情報を更新する
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param subscription body SubscriptionUpdateRequest true "サブスクリプション情報"
// @Success 200 {object} SubscriptionResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /subscriptions [put]
func (h *SubscriptionsHandler) Update(c *gin.Context) {
	var req SubscriptionUpdateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"リクエストデータが不正です", err.Error()})
		return
	}

	params, err := reqToUpdateSubscriptionParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"パラメータ変換中にエラーが発生しました", err.Error()})
		return
	}

	subscription, err := h.queries.GetSubscription(c, params.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"サブスクリプションが見つかりませんでした", err.Error()})
		return
	}

	subscription, err = h.queries.UpdateSubscription(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"サブスクリプション更新に失敗しました", err.Error()})
		return
	}

	c.JSON(http.StatusOK, subscriptionToResponse(subscription))
}

type DeleteSubscriptionRequest struct {
	SubscriptionID int `json:"subscriptionID"`
}

// @Summary サブスクリプション削除
// @Description 指定されたサブスクリプションを削除する
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param subscription body DeleteSubscriptionRequest true "削除するサブスクリプション情報"
// @Success 200 {object} SubscriptionResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /subscriptions [delete]
func (h *SubscriptionsHandler) Delete(c *gin.Context) {
	var req DeleteSubscriptionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"リクエストデータが不正です", err.Error()})
		return
	}

	// 認証済みミドルウェアからユーザIDを取得
	userUUID, exists := middleware.GetUserIdUUID(c)
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザー認証に失敗しました"})
		return
	}

	deleteParams := query.DeleteSubscriptionParams{
		ID:       int32(req.SubscriptionID),
		PasserID: userUUID,
	}

	subscription, err := h.queries.DeleteSubscription(c, deleteParams)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"サブスクリプション削除に失敗しました", err.Error()})
		return
	}

	c.JSON(http.StatusOK, subscriptionToResponse(subscription))
}

func reqToCreateSubscriptionParams(req SubscriptionCreateRequest) (query.CreateSubscriptionParams, error) {
	params := query.CreateSubscriptionParams{}

	params.ServiceName = pgtype.Text{String: req.ServiceName, Valid: req.ServiceName != ""}
	params.IconUrl = pgtype.Text{String: req.IconUrl, Valid: req.IconUrl != ""}
	params.Username = req.Username
	params.Email = req.Email
	params.EncPassword = []byte(req.Password)
	params.Amount = req.Amount
	params.Currency = req.Currency
	params.BillingCycle = req.BillingCycle
	params.Memo = req.Memo
	params.PlsDelete = req.PlsDelete
	params.Message = req.Message

	// PasserIDの処理
	if req.PasserID != "" {
		var passerUUID pgtype.UUID
		if err := passerUUID.Scan(req.PasserID); err != nil {
			return params, err
		}
		params.PasserID = passerUUID
	}

	// CustomDataの処理
	if req.CustomData != nil {
		params.CustomData = *req.CustomData
	} else {
		params.CustomData = []byte("{}")
	}

	return params, nil
}

func reqToUpdateSubscriptionParams(req SubscriptionUpdateRequest) (query.UpdateSubscriptionParams, error) {
	params := query.UpdateSubscriptionParams{}

	params.ID = req.ID
	params.ServiceName = pgtype.Text{String: req.ServiceName, Valid: req.ServiceName != ""}
	params.IconUrl = pgtype.Text{String: req.IconUrl, Valid: req.IconUrl != ""}
	params.Username = req.Username
	params.Email = req.Email
	params.EncPassword = []byte(req.Password)
	params.Amount = req.Amount
	params.Currency = req.Currency
	params.BillingCycle = req.BillingCycle
	params.Memo = req.Memo
	params.Message = req.Message

	// CustomDataの処理
	if req.CustomData != nil {
		params.CustomData = *req.CustomData
	} else {
		params.CustomData = []byte("{}")
	}

	return params, nil
}

func subscriptionToResponse(subscription query.Subscription) SubscriptionResponse {
	var trustID *int32
	if subscription.TrustID.Valid {
		trustID = &subscription.TrustID.Int32
	}

	var serviceName, iconUrl string
	if subscription.ServiceName.Valid {
		serviceName = subscription.ServiceName.String
	}
	if subscription.IconUrl.Valid {
		iconUrl = subscription.IconUrl.String
	}

	response := SubscriptionResponse{
		ID:           subscription.ID,
		ServiceName:  serviceName,
		IconUrl:      iconUrl,
		Username:     subscription.Username,
		Email:        subscription.Email,
		EncPassword:  subscription.EncPassword,
		Amount:       subscription.Amount,
		Currency:     subscription.Currency,
		BillingCycle: subscription.BillingCycle,
		Memo:         subscription.Memo,
		PlsDelete:    subscription.PlsDelete,
		Message:      subscription.Message,
		TrustID:      trustID,
		IsDisclosed:  subscription.IsDisclosed,
		CustomData:   subscription.CustomData,
	}

	// PasserID UUID → 文字列変換
	if subscription.PasserID.Valid {
		response.PasserID = subscription.PasserID.String()
	}

	return response
}
