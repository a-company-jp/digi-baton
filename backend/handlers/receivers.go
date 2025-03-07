package handlers

import (
	"net/http"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/middleware"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/gin-gonic/gin"
)

type ReceiversHandler struct {
	queries *query.Queries
}

func NewReceiversHandler(queries *query.Queries) *ReceiversHandler {
	return &ReceiversHandler{queries: queries}
}

type ReceiverResponse struct {
	ID          int32  `json:"id"`
	UserID      string `json:"userId"`
	ClerkUserID string `json:"clerkUserId"`
	Name        string `json:"name"`
	Email       string `json:"email"`
	IconUrl     string `json:"iconUrl"`
}

// List 相続人の一覧取得
// @Summary 相続人の一覧取得
// @Description 相続人の一覧を取得します
// @Tags receivers
// @Accept json
// @Produce json
// @Success 200 {object} []ReceiverResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /receivers [get]
func (h *ReceiversHandler) List(c *gin.Context) {
	userUUID, exists := middleware.GetUserIdUUID(c)
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザー認証に失敗しました"})
		return
	}

	receivers, err := h.queries.ListReceiversByUserId(c, userUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "failed to list receivers", Details: err.Error()})
		return
	}

	// Extract clerk user IDs from receivers
	receiverClerkUserIDs := make([]string, 0, len(receivers))
	for _, receiver := range receivers {
		receiverClerkUserIDs = append(receiverClerkUserIDs, receiver.ClerkUserID)
	}

	userList, err := user.List(c, &user.ListParams{UserIDs: receiverClerkUserIDs})
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "failed to list receivers", Details: err.Error()})
		return
	}

	// Create a map of clerkUserID to user info for easy lookup
	clerkUserMap := make(map[string]*clerk.User)
	for _, clerkUser := range userList.Users {
		clerkUserMap[clerkUser.ID] = clerkUser
	}

	// Build response
	response := make([]*ReceiverResponse, 0, len(receivers))
	for _, receiver := range receivers {
		receiverResponse := ReceiverToResponse(&receiver)

		// Enrich with Clerk user data if available
		if clerkUser, ok := clerkUserMap[receiver.ClerkUserID]; ok {
			receiverResponse.ClerkUserID = clerkUser.ID

			// Handle name - check if the name fields are not nil
			firstName := ""
			if clerkUser.FirstName != nil {
				firstName = *clerkUser.FirstName
			}

			lastName := ""
			if clerkUser.LastName != nil {
				lastName = *clerkUser.LastName
			}

			receiverResponse.Name = firstName
			if firstName != "" && lastName != "" {
				receiverResponse.Name = lastName + " " + firstName
			} else if lastName != "" {
				receiverResponse.Name = lastName
			}

			// Handle email
			if len(clerkUser.EmailAddresses) > 0 {
				receiverResponse.Email = clerkUser.EmailAddresses[0].EmailAddress
			}

			// Handle profile image
			if clerkUser.ImageURL != nil {
				receiverResponse.IconUrl = *clerkUser.ImageURL
			}
		}

		response = append(response, receiverResponse)
	}

	c.JSON(http.StatusOK, response)
}

func ReceiverToResponse(receiver *query.ListReceiversByUserIdRow) *ReceiverResponse {
	response := &ReceiverResponse{}
	response.ID = receiver.TrustID
	response.UserID = receiver.UserID.String()
	response.ClerkUserID = receiver.ClerkUserID
	response.Name = ""
	response.Email = ""
	response.IconUrl = ""
	return response
}
