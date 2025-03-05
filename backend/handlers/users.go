package handlers

import (
	"fmt"
	"net/http"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type UsersHandler struct {
	queries *query.Queries
}

func NewUsersHandler(q *query.Queries) *UsersHandler {
	return &UsersHandler{queries: q}
}


type UserCreateRequest struct {
	DefaultReceiverID *uuid.UUID `json:"defaultReceiverID"`
	ClerkUserID       string `json:"clerkUserID"`
}

type UserResponse struct {
	UserID 		  string `json:"userID"`
	DefaultReceiverID string `json:"defaultReceiverID"`
	ClerkUserID       string `json:"clerkUserID"`
}

// @Summary ユーザ登録
// @Description clerkでユーザ認証した後にバックエンドのDBにユーザを登録するためのエンドポイント
// @Tags users
// @Accept json
// @Produce json
// @Param user body UserCreateRequest true "ユーザ情報"
// @Success 200 {object} UserResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /users [post]
func (h *UsersHandler) Create(c *gin.Context) {
	var req UserCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	params, err := reqToUserCreateParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	user, err := h.queries.CreateUser(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー", "details": err.Error()})
		return
	}

	response := userToResponse(user)

	c.JSON(http.StatusOK, response)
}

type UserUpdateRequest struct {
	UserID			*uuid.UUID `json:"userID"`
	DefaultReceiverID *uuid.UUID `json:"defaultReceiverID"`
	ClerkUserID       string `json:"clerkUserID"`
}

// @Summary ユーザ更新
// @Description clerkでユーザ認証した後にバックエンドのDBにユーザを更新するためのエンドポイント
// @Tags users
// @Accept json
// @Produce json
// @Param user body UserCreateRequest true "ユーザ情報"
// @Success 200 {object} UserResponse "成功"
// @Failure 400 {object} ErrorResponse "リクエストデータが不正です"
// @Failure 500 {object} ErrorResponse "データベース接続に失敗しました"
// @Router /users [put]
func (h *UsersHandler) Update(c *gin.Context) {
	var req UserUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	params, err := reqToUpdateUserParams(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが不正です", "details": err.Error()})
		return
	}

	user, err := h.queries.UpdateUser(c, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func reqToUserCreateParams(req UserCreateRequest) (query.CreateUserParams, error) {
	UUID := uuid.New()

	var ID pgtype.UUID
	if err := ID.Scan(UUID.String()); err != nil {
		return query.CreateUserParams{}, fmt.Errorf("IDの生成に失敗しました: %w", err)
	}

	var defaultReceiverID pgtype.UUID
	if req.DefaultReceiverID == nil {
		defaultReceiverID = pgtype.UUID{Valid: false} // nilの場合はValid: falseに設定
	} else {
		// nilでない場合のみScanを実行
		if err := defaultReceiverID.Scan(*req.DefaultReceiverID); err != nil {
			return query.CreateUserParams{}, fmt.Errorf("defaultReceiverIDがUUIDではありません: %w", err)
		}
	}

	params := query.CreateUserParams{
		ID:                ID,
		DefaultReceiverID: defaultReceiverID,
		ClerkUserID:       req.ClerkUserID,
	}

	return params, nil
}

func reqToUpdateUserParams(req UserUpdateRequest) (query.UpdateUserParams, error) {

	if req.UserID == nil {
		return query.UpdateUserParams{}, fmt.Errorf("userIDは必須です。")
	}

	var useID pgtype.UUID
	if err := useID.Scan(req.UserID.String()); err != nil {
		return query.UpdateUserParams{}, fmt.Errorf("userIDがUUIDではありません: %w", err)
	}

	var receiverID pgtype.UUID
	if req.DefaultReceiverID == nil {
		receiverID = pgtype.UUID{Valid: false}
	} else {
		if err := receiverID.Scan(*req.DefaultReceiverID); err != nil {
			return query.UpdateUserParams{}, fmt.Errorf("defaultReceiverIDがUUIDではありません: %w", err)
		}
	}

	params := query.UpdateUserParams{
		ID:                useID,
		DefaultReceiverID: receiverID,
		ClerkUserID:       req.ClerkUserID,
	}

	return params, nil
}

func userToResponse(user query.User) UserResponse {
	return UserResponse{
		UserID: user.ID.String(),
		DefaultReceiverID: user.DefaultReceiverID.String(),
		ClerkUserID: user.ClerkUserID,
	}
}
