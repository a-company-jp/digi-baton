package handlers

import (
	"bytes"
	"net/http"

	"github.com/a-company-jp/digi-baton/backend/db/query"
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
	ID                int32   `json:"id"`
	DeviceType        int32   `json:"deviceType"`
	CredentialType    int32   `json:"credentialType"`
	DeviceDescription string  `json:"deviceDescription"`
	DeviceUsername    string  `json:"deviceUsername"`
	EncPassword       string  `json:"encPassword"`
	Memo              string  `json:"memo"`
	Message           string  `json:"message"`
	PasserID          string  `json:"passerID"`
	TrustID           *int32  `json:"trustID"`
	CustomData      []byte `json:"customData"`
}

// @Summary デバイス一覧取得
// @Description ユーザが開示しているデバイス一覧を取得する
// @Tags devices
// @Accept json
// @Produce json
// @Param passerID query string true "デバイスを取得するユーザのID"
// @Success 200 {array} DeviceResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /devices/{passerID} [get]
func (h *DevicesHandler) List(c *gin.Context) {
	passerID := c.Query("passerID")
	if passerID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{"パラメータが不正です", "passerIDが指定されていません"})
		return
	}
	
	pID, err := toPGUUID(passerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{"UUID変換に失敗しました", err.Error()})
		return
	}

	devices, err := h.queries.ListDisclosedDevicesByReceiverId(c, pID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{"デバイス一覧取得に失敗しました", err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, devices)
}

type DeviceCreateRequest struct {
	DeviceType        int32   `json:"deviceType"`
	CredentialType    int32   `json:"credentialType"`
	DeviceDescription string  `json:"deviceDescription,omitempty"`
	DeviceUsername    string  `json:"deviceUsername,omitempty"`
	Password       string  `json:"password,omitempty"`
	Memo              string  `json:"memo,omitempty"`
	Message           string  `json:"message,omitempty"`
	PasserID          string  `json:"passerID,omitempty"`
	CustomData      []byte `json:"customData"`
}

// @Summary デバイス追加
// @Description デバイスを追加する
// @Tags devices
// @Accept json
// @Produce json
// @Param device body DeviceCreateRequest true "デバイス情報"
// @Success 200 {object} DeviceResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /devices [post]
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
	ID 			  int32   `json:"id"`
	DeviceCreateRequest
}

// @Summary デバイス更新
// @Description デバイスを更新する
// @Tags devices
// @Accept json
// @Produce json
// @Param device body DeviceCreateRequest true "デバイス情報"
// @Success 200 {object} DeviceResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /devices [put]
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
	DeviceID int `json:"deviceID"`
}

// @Summary デバイス削除
// @Description デバイスを削除する
// @Tags devices
// @Accept json
// @Produce json
// @Param device body DeleteDeviceCreateRequest true "デバイス情報"
// @Success 200 {object} DeviceResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /devices [delete]
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
		ID: int32(req.DeviceID),
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
	var params query.CreateDeviceParams
	
	params.DeviceType = req.DeviceType
	params.CredentialType = req.CredentialType
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
	
	if req.CustomData == nil || bytes.Equal(req.CustomData, []byte("\x00")) {
		params.CustomData = nil
	}else {
		params.CustomData = req.CustomData
	}
	
	return params, nil
}

func reqToUpdateDeviceParams(req DeviceUpdateRequest) (query.UpdateDeviceParams, error) {
	var params query.UpdateDeviceParams
	
	params.ID = req.ID
	params.DeviceType = req.DeviceType
	params.CredentialType = req.CredentialType
	params.DeviceDescription = pgtype.Text{String: req.DeviceDescription, Valid: req.DeviceDescription != ""}
	params.DeviceUsername = pgtype.Text{String: req.DeviceUsername, Valid: req.DeviceUsername != ""}
	params.EncPassword = []byte(req.Password)
	params.Memo = req.Memo
	params.Message = req.Message
	params.CustomData = []byte(req.CustomData)

	return params, nil
}
