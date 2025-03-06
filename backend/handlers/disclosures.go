package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type DisclosuresHandler struct {
	queries *query.Queries
}

func NewDisclosuresHandler(q *query.Queries) *DisclosuresHandler {
	return &DisclosuresHandler{queries: q}
}

type DisclosureResponse struct {
	ID          int32      `json:"id"`
	RequesterID string     `json:"requesterID"`
	PasserID    string     `json:"passerID"`
	IssuedTime  string     `json:"issuedTime"`
	InProgress  bool       `json:"inProgress"`
	Disclosed   bool       `json:"disclosed"`
	PreventedBy *uuid.UUID `json:"preventedBy"`
	Deadline    string     `json:"deadline"`
	CustomData  string     `json:"customData"`
}

// @Summary 開示申請一覧取得
// @Description ユーザが受けた開示請求一覧を取得する
// @Tags disclosures
// @Accept json
// @Produce json
// @Param requesterID query string true "開示請求を出したユーザのID"
// @Success 200 {array} DisclosureResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストが不正"
// @Failure 500 {object} ErrorResponse "開示請求が見つかりませんでした"
// @Router /disclosures [get]
func (h *DisclosuresHandler) List(c *gin.Context) {
	requesterID := c.Query("requesterID")
	if requesterID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requesterID is required"})
		return
	}

	pgRequesterID, err := toPGUUID(requesterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid requesterID"})
		return
	}

	disclosures, err := h.queries.ListDisclosuresByRequesterId(c, pgRequesterID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "開示請求が見つかりませんでした"})
		return
	}

	response := make([]DisclosureResponse, len(disclosures))
	for i, d := range disclosures {
		res, err := disclosureToResponse(d)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to convert disclosure to response"})
			return
		}
		response[i] = res
	}

	c.JSON(http.StatusOK, response)
}

type DisclosureCreateRequest struct {
	PasserID         string `json:"passerID"`
	RequesterID      string `json:"requesterID"`
	DeadlineDuration int32  `json:"deadlineDuration"`
	CustomData       []byte `json:"customData"`
}

// @Summary 開示申請作成
// @Description ユーザが他のユーザに開示請求を出す
// @Tags disclosures
// @Accept json
// @Produce json
// @Param disclosure body DisclosureCreateRequest true "開示請求情報"
// @Success 200 {object} DisclosureResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストが不正"
// @Failure 500 {object} ErrorResponse "開示請求の作成に失敗"
// @Router /disclosures [post]
func (h *DisclosuresHandler) Create(c *gin.Context) {
	var req DisclosureCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "パラメータが不正です", Details: err.Error()})
		return
	}

	params, err := reqToCreateDisclosureParams(req)
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

	c.JSON(http.StatusOK, res)
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

// @Summary 開示申請更新
// @Description 開示申請のステータスを更新する
// @Tags disclosures
// @Accept json
// @Produce json
// @Param disclosure body DisclosureUpdateRequest true "開示申請情報"
// @Success 200 {object} DisclosureResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストが不正"
// @Failure 500 {object} ErrorResponse "開示申請の更新に失敗"
// @Router /disclosures [put]
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

// @Summary 開示申請削除
// @Description 開示申請を削除する
// @Tags disclosures
// @Accept json
// @Produce json
// @Param disclosure body DisclosureDeleteRequest true "開示申請情報"
// @Success 200 {object} DisclosureResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストが不正"
// @Failure 500 {object} ErrorResponse "開示申請の削除に失敗"
// @Router /disclosures [delete]
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

func reqToCreateDisclosureParams(req DisclosureCreateRequest) (query.CreateDisclosureParams, error) {

	passerID, err := toPGUUID(req.PasserID)
	if err != nil {
		return query.CreateDisclosureParams{}, err
	}

	requesterID, err := toPGUUID(req.RequesterID)
	if err != nil {
		return query.CreateDisclosureParams{}, err
	}

	if len(req.CustomData) == 0 || string(req.CustomData) == "null" || bytes.Equal(req.CustomData, []byte("\x00")) {
		req.CustomData = []byte("{}")
	}

	return query.CreateDisclosureParams{
		PasserID:    passerID,
		RequesterID: requesterID,
		IssuedTime:  toPGTimestamp(time.Now()),
		Deadline:    toPGTimestamp(time.Now().AddDate(0, 0, int(req.DeadlineDuration))),
		CustomData:  req.CustomData,
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
		var u uuid.UUID
		err = u.Scan(d.PreventedBy.Bytes)
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
