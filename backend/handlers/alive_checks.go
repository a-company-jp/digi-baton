package handlers

import (
	"bytes"
	"net/http"
	"time"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type aliveChecksHandler struct {
	queries *query.Queries
}

func NewAliveChecksHandler(q *query.Queries) *aliveChecksHandler {
	return &aliveChecksHandler{queries: q}
}

type AliveCheckHistoryResponse struct {
	ID               string `json:"id"`
	TargetUserID     string `json:"targetUserID"`
	CheckTime        string `json:"checkTime"`
	CheckMethod      int32  `json:"checkMethod"`
	CheckSuccess     bool   `json:"checkSuccess"`
	CheckSuccessTime string `json:"checkSuccessTime"`
	CustomData       []byte `json:"customedData"`
}

// @Summary		アライブチェック履歴一覧取得
// @Description	アライブチェック履歴一覧を取得する
// @Tags			aliveChecks
// @Accept			json
// @Produce		json
// @Param			passerID	query	string						true	"アライブチェック履歴を取得するユーザのID"
// @Success		200			{array}	AliveCheckHistoryResponse	"成功"
// @Router			/alive-checks [get]
func (h *aliveChecksHandler) List(c *gin.Context) {
	passerID := c.Query("passerID")
	if passerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "passerID is required"})
		return
	}

	targetUserID, err := toPGUUID(passerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid passerID"})
		return
	}

	aliveCheckHistories, err := h.queries.ListAliveCheckHistoriesByTargetUserId(c, targetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get alive check histories"})
		return
	}

	response := make([]AliveCheckHistoryResponse, len(aliveCheckHistories))
	for i, a := range aliveCheckHistories {
		response[i] = aliveCheckToResponse(a)
	}

	c.JSON(http.StatusOK, response)
}

type AliveCheckHistoryCreateRequest struct {
	TargetUserID *uuid.UUID `json:"targetUserID"`
	CheckMethod  int32      `json:"checkMethod"`
	CustomData   *[]byte    `json:"customedData"`
}

// @Summary		アライブチェック履歴作成
// @Description	アライブチェック履歴を作成する
// @Tags			aliveChecks
// @Accept			json
// @Produce		json
// @Param			body	body		AliveCheckHistoryCreateRequest	true	"アライブチェック履歴作成リクエスト"
// @Success		200		{object}	AliveCheckHistoryResponse		"成功"
// @Failure		400		{object}	ErrorResponse					"リクエストデータが不正です"
// @Failure		500		{object}	ErrorResponse					"データベース接続に失敗しました"
// @Router			/alive-checks [post]
func (h *aliveChecksHandler) Create(c *gin.Context) {
	var req AliveCheckHistoryCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	params, err := reqToCreateAliveCheckHistoryParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	aliveCheckHistory, err := h.queries.CreateAliveCheckHistory(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "確認履歴の作成に失敗しました", Details: err.Error()})
		return
	}

	response := aliveCheckToResponse(aliveCheckHistory)

	c.JSON(http.StatusOK, response)
}

type AliveCheckHistoryUpdateRequest struct {
	ID           uuid.UUID `json:"id"`
	CheckMethod  int32     `json:"checkMethod"`
	CheckSuccess bool      `json:"checkSuccess"`
	CustomData   *[]byte   `json:"customedData"`
}

// @Summary		アライブチェック履歴更新
// @Description	アライブチェック履歴を更新する
// @Tags			aliveChecks
// @Accept			json
// @Produce		json
// @Param			body	body		AliveCheckHistoryUpdateRequest	true	"アライブチェック履歴更新リクエスト"
// @Success		200		{object}	AliveCheckHistoryResponse		"成功"
// @Failure		400		{object}	ErrorResponse					"リクエストデータが不正です"
// @Failure		500		{object}	ErrorResponse					"データベース接続に失敗しました"
// @Router			/alive-checks [put]
func (h *aliveChecksHandler) Update(c *gin.Context) {
	var req AliveCheckHistoryUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	params, err := reqToUpdateAliveCheckHistoryParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	aliveCheckHistory, err := h.queries.GetAliveCheckHistory(c, params.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "確認履歴の取得に失敗しました", Details: err.Error()})
		return
	}

	aliveCheckHistory, err = h.queries.UpdateAliveCheckHistory(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "確認履歴の更新に失敗しました", Details: err.Error()})
		return
	}

	response := aliveCheckToResponse(aliveCheckHistory)

	c.JSON(http.StatusOK, response)
}

func reqToCreateAliveCheckHistoryParams(req AliveCheckHistoryCreateRequest) (query.CreateAliveCheckHistoryParams, error) {
	var params query.CreateAliveCheckHistoryParams

	newUUID := uuid.New()
	pgUUID, err := toPGUUID(newUUID.String())
	if err != nil {
		return query.CreateAliveCheckHistoryParams{}, err
	}
	params.ID = pgUUID

	userID, err := toPGUUID(req.TargetUserID.String())
	if err != nil {
		return query.CreateAliveCheckHistoryParams{}, err
	}
	params.TargetUserID = userID
	params.CheckMethod = req.CheckMethod
	params.CheckTime = toPGTimestamp(time.Now())

	if req.CustomData == nil || bytes.Equal(*req.CustomData, []byte("\x00")) {
		params.CustomData = []byte("{}")
	} else {
		params.CustomData = *req.CustomData
	}

	return params, nil
}

func reqToUpdateAliveCheckHistoryParams(req AliveCheckHistoryUpdateRequest) (query.UpdateAliveCheckHistoryParams, error) {

	var params query.UpdateAliveCheckHistoryParams

	id, err := toPGUUID(req.ID.String())
	if err != nil {
		return query.UpdateAliveCheckHistoryParams{}, err
	}
	params.ID = id
	params.CheckMethod = req.CheckMethod
	params.CheckSuccess = req.CheckSuccess

	if req.CheckSuccess {
		params.CheckSuccessTime = pgtype.Timestamp{Time: time.Now(), Valid: true}
	} else {
		params.CheckSuccessTime = pgtype.Timestamp{Valid: false}
	}

	if req.CustomData == nil || bytes.Equal(*req.CustomData, []byte("\x00")) {
		params.CustomData = []byte("{}")
	} else {
		params.CustomData = *req.CustomData
	}

	return params, nil
}

func aliveCheckToResponse(a query.AliveCheckHistory) AliveCheckHistoryResponse {
	return AliveCheckHistoryResponse{
		ID:               a.ID.String(),
		TargetUserID:     a.TargetUserID.String(),
		CheckTime:        a.CheckTime.Time.Format(time.RFC3339),
		CheckMethod:      a.CheckMethod,
		CheckSuccess:     a.CheckSuccess,
		CheckSuccessTime: a.CheckSuccessTime.Time.Format(time.RFC3339),
		CustomData:       a.CustomData,
	}
}
