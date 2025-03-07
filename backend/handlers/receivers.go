package handlers

import (
	"net/http"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/middleware"
	"github.com/gin-gonic/gin"
)

type ReceiversHandler struct {
	queries *query.Queries
}

func NewReceiversHandler(queries *query.Queries) *ReceiversHandler {
	return &ReceiversHandler{queries: queries}
}

type ReceiverResponse struct {
	ID int32 `json:"id"`
	Name string `json:"name"`
	Email string `json:"email"`
}


// List 相続人の一覧取得
// @Summary 相続人の一覧取得
// @Description 相続人の一覧を取得します
// @Tags receivers
// @Accept json
// @Produce json
// @Param userId query string true "ユーザーID"
// @Success 200 {object} []ReceiverResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /receivers [get]
func (h *ReceiversHandler) List(c *gin.Context) {

	userID, exists := middleware.GetUserIdUUID(c)
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザー認証に失敗しました"})
		return
	}
	
	receivers, err := h.queries.ListReceiversByUserId(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "failed to list receivers", Details: err.Error()})
		return
	}

	response := make([]*ReceiverResponse, 0, len(receivers))
	for _, receiver := range receivers {
		response = append(response, ReceiverToResponse(&receiver))
	}

	c.JSON(http.StatusOK, response)
}

func ReceiverToResponse(receiver *query.ListReceiversByUserIdRow) *ReceiverResponse {
	response := &ReceiverResponse{}
	response.ID = receiver.ID
	response.Name = "tuser"
	response.Email = "tuser@example.com"
	return response
}

