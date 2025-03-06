package handlers

import (
	"fmt"
	"net/http"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type TrustsHandler struct {
	queries *query.Queries
}

func NewTrustsHandler(q *query.Queries) *TrustsHandler {
	return &TrustsHandler{queries: q}
}

type TrustRequest struct {
	PasserID uuid.UUID `json:"passerID"`
	ReviverID uuid.UUID `json:"reviverID"`
}

type TrustResponse struct {
	ID int32 `json:"id"`
	PasserID string `json:"passerID"`
	ReviverID string `json:"reviverID"`
}

// @Summary 相続関係の一覧取得
// @Description ユーザが開示している相続関係一覧を取得する
// @Tags trusts
// @Accept json
// @Produce json
// @Param passerID query string true "相続関係を取得するユーザのID"
// @Success 200 {array} TrustResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /trusts [get]
func (h *TrustsHandler) List(c *gin.Context) {
	passerID := c.Query("passerID")
	if passerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "パラメータが不正です", "details": "passerIDが指定されていません"})
		return
	}

	pID, err := toPGUUID(passerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "UUID変換に失敗しました", "details": err.Error()})
		return
	}


	trusts, err := h.queries.ListTrustsByPasserID(c, pID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トラスト一覧取得に失敗しました", "details": err.Error()})
		return
	}

	var res []TrustResponse
	for _, trust := range trusts {
		res = append(res, trustToResponse(trust))
	}

	c.JSON(http.StatusOK, res)
}

// @Summary 相続関係の作成
// @Description ユーザ間の相続関係を作成する
// @Tags trusts
// @Accept json
// @Produce json
// @Param trust body TrustRequest true "相続関係"
// @Success 200 {object} TrustResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /trusts [post]
func (h *TrustsHandler) Create(c *gin.Context) {
	var req TrustRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	params, err := reqToCreateTrustParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	trust, err := h.queries.CreateTrust(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, trust)
}

type UpdateTrustRequest struct {
	TrustID int32 `json:"trustID"`
	PasserID uuid.UUID `json:"passerID"`
	ReviverID uuid.UUID `json:"reviverID"`
}

// @Summary 相続関係の更新
// @Description ユーザ間の相続関係を更新する
// @Tags trusts
// @Accept json
// @Produce json
// @Param trust body UpdateTrustRequest true "相続関係"
// @Success 200 {object} TrustResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /trusts [put]
func (h *TrustsHandler) Update(c *gin.Context) {
	var req UpdateTrustRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	params, err := reqToUpdateTrustParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	trust, err := h.queries.GetTrust(c, params.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "相続関係が見つかりませんでした。", "details": err.Error()})
		return
	}

	trust, err = h.queries.UpdateTrust(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新エラー", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, trust)
}

type DeleteTrustRequest struct {
	TrustID int32 `json:"trustID"`
	PasserID string `json:"passerID"`
}

// @Summary 相続関係の削除
// @Description ユーザ間の相続関係を削除する
// @Tags trusts
// @Accept json
// @Produce json
// @Param trust body DeleteTrustRequest true "相続関係"
// @Success 200 {object} TrustResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /trusts [delete]
func (h *TrustsHandler) Delete(c *gin.Context) {
	var req DeleteTrustRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	pID, err := toPGUUID(req.PasserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "パラメータ変換中にエラーが発生しました", "details": err.Error()})
		return
	}

	trust, err := h.queries.DeleteTrust(c, query.DeleteTrustParams{ID: req.TrustID, PasserUserID: pID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トラスト削除に失敗しました", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, trust)
}

func reqToCreateTrustParams(req TrustRequest) (query.CreateTrustParams, error) {
	
	var passerID pgtype.UUID
	if err := passerID.Scan(req.PasserID.String()); err != nil {
		return query.CreateTrustParams{}, fmt.Errorf("パラメータの変換に失敗しました: %w", err)
	}

	var receiverID pgtype.UUID
	if err := receiverID.Scan(req.ReviverID.String()); err != nil {
		return query.CreateTrustParams{}, fmt.Errorf("パラメータの変換に失敗しました: %w", err)
	}
	
	params := query.CreateTrustParams{
		ReceiverUserID: receiverID,
		PasserUserID: passerID,
	}

	return params, nil
}

func reqToUpdateTrustParams(req UpdateTrustRequest) (query.UpdateTrustParams, error) {
	var passerID pgtype.UUID
	if err := passerID.Scan(req.PasserID.String()); err != nil {
		return query.UpdateTrustParams{}, fmt.Errorf("パラメータの変換に失敗しました: %w", err)
	}
	
	var receiverID pgtype.UUID
	if err := receiverID.Scan(req.ReviverID.String()); err != nil {
		return query.UpdateTrustParams{}, fmt.Errorf("パラメータの変換に失敗しました: %w", err)
	}
	
	params := query.UpdateTrustParams{
		ID: req.TrustID,
		PasserUserID: passerID,
		ReceiverUserID: receiverID,
	}

	return params, nil
}


func trustToResponse(trust query.Trust) TrustResponse {
	return TrustResponse{
		ID: trust.ID,
		PasserID: trust.PasserUserID.String(),
		ReviverID: trust.ReceiverUserID.String(),
	}
}
