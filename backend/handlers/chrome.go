package handlers

import (
	"context"
	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/pkg/utils"
	"github.com/a-company-jp/digi-baton/backend/pkg/webauthn"
	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/gin-gonic/gin"

	"github.com/google/uuid"
)

type ChromeHandler struct {
	queries *query.Queries
}

type UserInfo struct {
	ClerkID   string  `json:"clerk_id"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	Email     string  `json:"email"`
	IconURL   *string `json:"icon_url"`
}

func NewChromeHandler(q *query.Queries) *ChromeHandler {
	return &ChromeHandler{queries: q}
}

func (h *ChromeHandler) HandleGetAccessibleUsers(c *gin.Context) {
	userID, err := uuid.Parse(c.Query("user_id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid user_id"})
		return
	}
	users, err := h.GetAccessibleUsers(c, userID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"users": users})
}

func (h *ChromeHandler) GetAccessibleUsers(ctx context.Context, userID uuid.UUID) ([]UserInfo, error) {
	trusters, err := h.queries.ListTrustersByReceiverID(ctx, utils.ToPgxUUID(userID))
	if err != nil {
		return nil, err
	}
	userIDs := make([]string, len(trusters))
	for _, id := range trusters {
		userIDs = append(userIDs, id.ClerkUserID.String)
	}
	cUsers, err := user.List(ctx, &user.ListParams{
		UserIDs: userIDs,
	})
	if err != nil {
		return nil, err
	}
	users := make([]UserInfo, len(cUsers.Users))
	for i, u := range cUsers.Users {
		firstEmail := ""
		if len(u.EmailAddresses) > 0 {
			firstEmail = u.EmailAddresses[0].EmailAddress
		}
		users[i] = UserInfo{
			ClerkID:   u.ID,
			FirstName: u.FirstName,
			LastName:  u.LastName,
			Email:     firstEmail,
			IconURL:   u.ImageURL,
		}
	}
	return users, nil
}

func (h *ChromeHandler) HandleGetAssertion(c *gin.Context) {
	type AssertionRequest struct {
		UserID  uuid.UUID `json:"user_id"`
		ReqJson string    `json:"req_json"`
	}
	var req AssertionRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}
	s := webauthn.NewPasskeyStore(h.queries)
	p := webauthn.NewPasskeyProcessor(*s)
	resp, err := p.ProcessGetAssertion(c, req.UserID, req.ReqJson)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"response": resp})
}

func (h *ChromeHandler) HandleCreate(c *gin.Context) {
	type CreateRequest struct {
		UserID  uuid.UUID `json:"user_id"`
		ReqJson string    `json:"req_json"`
	}
	var req CreateRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}
	s := webauthn.NewPasskeyStore(h.queries)
	p := webauthn.NewPasskeyProcessor(*s)
	resp, err := p.ProcessCreate(c, req.UserID, req.ReqJson)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"response": resp})
}

func (h *ChromeHandler) HandleGetID(c *gin.Context) {
	c.Status(200)
}
