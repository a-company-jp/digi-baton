package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ClerkAuth is middleware that validates Clerk JWT tokens and fetches the DB user ID
func ClerkAuth(q *query.Queries) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Check if the header has the format "Bearer {token}"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		// Get the token
		token := parts[1]

		// Verify token and get claims
		claims, err := jwt.Verify(c.Request.Context(), &jwt.VerifyParams{
			Token: token,
		})
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Invalid token: %v", err)})
			c.Abort()
			return
		}

		// Set claims in the context for later use
		c.Set("clerkClaims", claims)
		c.Set("clerkUserId", claims.Subject)

		// Get the DB user by the Clerk user ID
		clerkUserID := claims.Subject
		user, err := q.GetUserByClerkID(c, clerkUserID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("User not found in the database: %v", err)})
			c.Abort()
			return
		}

		// Set the DB user ID in the context
		c.Set("userId", user.ID.String())

		c.Next()
	}
}

// GetClerkUserId extracts the Clerk user ID from the Gin context
func GetClerkUserId(c *gin.Context) (string, bool) {
	userId, exists := c.Get("clerkUserId")
	if !exists {
		return "", false
	}

	id, ok := userId.(string)
	return id, ok
}

// GetUserId extracts the database user ID from the Gin context
func GetUserId(c *gin.Context) (string, bool) {
	userId, exists := c.Get("userId")
	if !exists {
		return "", false
	}

	id, ok := userId.(string)
	return id, ok
}

// RequireAuthentication is a middleware that ensures a user is authenticated
func RequireAuthentication() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get("userId")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// GetSessionClaims extracts the Clerk session claims from the Gin context
func GetSessionClaims(c *gin.Context) (*clerk.SessionClaims, bool) {
	claims, exists := c.Get("clerkClaims")
	if !exists {
		return nil, false
	}

	sessionClaims, ok := claims.(*clerk.SessionClaims)
	return sessionClaims, ok
}

// GetUserIdUUID extracts the database user ID from the Gin context and converts it to pgtype.UUID
func GetUserIdUUID(c *gin.Context) (pgtype.UUID, bool) {
	userIdStr, exists := GetUserId(c)
	if !exists {
		return pgtype.UUID{}, false
	}

	parsedUUID, err := uuid.Parse(userIdStr)
	if err != nil {
		return pgtype.UUID{}, false
	}

	var pgUUID pgtype.UUID
	err = pgUUID.Scan(parsedUUID.String())
	if err != nil {
		return pgtype.UUID{}, false
	}

	return pgUUID, true
}
