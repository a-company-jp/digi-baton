package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/middleware"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type DevicesHandler struct {
	queries *query.Queries
}

func NewDevicesHandler(q *query.Queries) *DevicesHandler {
	return &DevicesHandler{queries: q}
}

type DeviceResponse struct {
	ID                int32                  `json:"id"`
	DeviceType        int32                  `json:"deviceType"`
	CredentialType    int32                  `json:"credentialType"`
	DeviceDescription string                 `json:"deviceDescription"`
	DeviceUsername    string                 `json:"deviceUsername"`
	EncPassword       string                 `json:"encPassword"`
	Memo              string                 `json:"memo"`
	Message           string                 `json:"message"`
	PasserID          string                 `json:"passerID"`
	TrustID           int32                  `json:"trustID"`
	CustomData        map[string]interface{} `json:"customData"`
}

// @Summary		デバイス一覧取得
// @Description	ユーザが開示しているデバイス一覧を取得する
// @Tags			devices
// @Accept			json
// @Produce		json
// @Success		200			{array}		DeviceResponse	"成功"
// @Failure		401			{object}	ErrorResponse	"認証に失敗しました"
// @Failure		500			{object}	ErrorResponse	"データベース接続に失敗しました"
// @Router			/devices [get]
func (h *DevicesHandler) List(c *gin.Context) {
	// コンテキストからユーザーIDを取得する
	userID, exists := middleware.GetUserIdUUID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{"認証に失敗しました", "ユーザーIDが見つかりません"})
		return
	}

	devices, err := h.queries.ListDevicesByPasserId(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"デバイス一覧取得に失敗しました", err.Error()})
		return
	}

	response := make([]DeviceResponse, len(devices))
	for i, device := range devices {
		response[i] = deviceToResponse(device)
	}

	c.JSON(http.StatusOK, response)
}

type DeviceCreateRequest struct {
	DeviceType        int32                   `json:"deviceType"`
	CredentialType    int32                   `json:"credentialType"`
	DeviceDescription string                  `json:"deviceDescription,omitempty"`
	DeviceUsername    string                  `json:"deviceUsername,omitempty"`
	Password          string                  `json:"password,omitempty"`
	Memo              string                  `json:"memo,omitempty"`
	Message           string                  `json:"message,omitempty"`
	PasserID          string                  `json:"passerID,omitempty"`
	CustomData        *map[string]interface{} `json:"customData"`
}

// @Summary		デバイス追加
// @Description	デバイスを追加する
// @Tags			devices
// @Accept			json
// @Produce		json
// @Param			device	body		DeviceCreateRequest	true	"デバイス情報"
// @Success		200		{object}	DeviceResponse		"成功"
// @Failure		400		{object}	ErrorResponse		"リクエストデータが不正です"
// @Failure		500		{object}	ErrorResponse		"データベース接続に失敗しました"
// @Router			/devices [post]
func (h *DevicesHandler) Create(c *gin.Context) {
	var req DeviceCreateRequest

	// リクエストボディをDeviceCreateRequest構造体にバインド
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"リクエストデータが不正です", err.Error()})
		return
	}

	// パラメータをSQLクエリ用に変換
	params, err := reqToCreateDeviceParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"パラメータ変換中にエラーが発生しました", err.Error()})
		return
	}

	device, err := h.queries.CreateDevice(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"デバイス作成に失敗しました", err.Error()})
		return
	}

	c.JSON(http.StatusOK, device)
}

type DeviceUpdateRequest struct {
	ID int32 `json:"id"`
	DeviceCreateRequest
}

// @Summary		デバイス更新
// @Description	デバイスを更新する
// @Tags			devices
// @Accept			json
// @Produce		json
// @Param			device	body		DeviceCreateRequest	true	"デバイス情報"
// @Success		200		{object}	DeviceResponse		"成功"
// @Failure		400		{object}	ErrorResponse		"リクエストデータが不正です"
// @Failure		500		{object}	ErrorResponse		"データベース接続に失敗しました"
// @Router			/devices [put]
func (h *DevicesHandler) Update(c *gin.Context) {
	var req DeviceUpdateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"リクエストデータが不正です", err.Error()})
		return
	}

	params, err := reqToUpdateDeviceParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"パラメータ変換中にエラーが発生しました", err.Error()})
		return
	}

	device, err := h.queries.GetDevice(c, params.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"デバイスが見つかりませんでした", err.Error()})
		return
	}

	device, err = h.queries.UpdateDevice(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"デバイス更新に失敗しました", err.Error()})
		return
	}

	c.JSON(http.StatusOK, device)
}

type DeleteDeviceCreateRequest struct {
	PasserID string `json:"passerID"`
	DeviceID int    `json:"deviceID"`
}

// @Summary		デバイス削除
// @Description	デバイスを削除する
// @Tags			devices
// @Accept			json
// @Produce		json
// @Param			device	body		DeleteDeviceCreateRequest	true	"デバイス情報"
// @Success		200		{object}	DeviceResponse				"成功"
// @Failure		400		{object}	ErrorResponse				"リクエストデータが不正です"
// @Failure		500		{object}	ErrorResponse				"データベース接続に失敗しました"
// @Router			/devices [delete]
func (h *DevicesHandler) Delete(c *gin.Context) {
	var req DeleteDeviceCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"リクエストデータが不正です", err.Error()})
		return
	}

	pID, err := toPGUUID(req.PasserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"UUID変換に失敗しました", err.Error()})
		return
	}

	params := query.DeleteDeviceParams{
		ID:       int32(req.DeviceID),
		PasserID: pID,
	}

	device, err := h.queries.DeleteDevice(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"デバイス削除に失敗しました", err.Error()})
		return
	}

	c.JSON(http.StatusOK, device)
}

// reqToCreateDeviceParams はリクエスト構造体をクエリパラメータに変換
func reqToCreateDeviceParams(req DeviceCreateRequest) (query.CreateDeviceParams, error) {
	params := query.CreateDeviceParams{}

	params.DeviceType = req.DeviceType
	params.DeviceDescription = pgtype.Text{String: req.DeviceDescription, Valid: req.DeviceDescription != ""}
	params.DeviceUsername = pgtype.Text{String: req.DeviceUsername, Valid: req.DeviceUsername != ""}
	params.EncPassword = []byte(req.Password)
	params.Memo = req.Memo
	params.Message = req.Message

	if req.PasserID != "" {
		uuid, err := toPGUUID(req.PasserID)
		if err != nil {
			return params, err
		}
		params.PasserID = uuid
	}

	if req.CustomData == nil {
		params.CustomData = nil
	} else {
		// Convert map[string]interface{} to JSON []byte
		jsonData, err := json.Marshal(*req.CustomData)
		if err != nil {
			return params, fmt.Errorf("CustomDataのJSON変換に失敗しました: %w", err)
		}
		params.CustomData = jsonData
	}

	return params, nil
}

func reqToUpdateDeviceParams(req DeviceUpdateRequest) (query.UpdateDeviceParams, error) {
	params := query.UpdateDeviceParams{}

	params.ID = req.ID
	params.DeviceType = req.DeviceType
	params.DeviceDescription = pgtype.Text{String: req.DeviceDescription, Valid: req.DeviceDescription != ""}
	params.DeviceUsername = pgtype.Text{String: req.DeviceUsername, Valid: req.DeviceUsername != ""}
	params.EncPassword = []byte(req.Password)
	params.Memo = req.Memo
	params.Message = req.Message

	if req.CustomData == nil {
		params.CustomData = nil
	} else {
		// Convert map[string]interface{} to JSON []byte
		jsonData, err := json.Marshal(*req.CustomData)
		if err != nil {
			return params, fmt.Errorf("CustomDataのJSON変換に失敗しました: %w", err)
		}
		params.CustomData = jsonData
	}

	return params, nil
}

// deviceToResponse converts a database device object to a response object
func deviceToResponse(device query.Device) DeviceResponse {
	var response DeviceResponse
	var customData map[string]interface{}

	response.ID = device.ID
	response.DeviceType = device.DeviceType
	response.DeviceDescription = device.DeviceDescription.String
	response.DeviceUsername = device.DeviceUsername.String
	response.EncPassword = string(device.EncPassword)
	response.Memo = device.Memo
	response.Message = device.Message
	response.PasserID = device.PasserID.String()
	response.TrustID = device.TrustID

	// Parse CustomData JSON if it exists
	if device.CustomData != nil {
		if err := json.Unmarshal(device.CustomData, &customData); err != nil {
			customData = make(map[string]interface{})
		}
		response.CustomData = customData
	} else {
		response.CustomData = make(map[string]interface{})
	}

	return response
}
