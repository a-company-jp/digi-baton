package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gin-gonic/gin"
)

// ClerkAuth is middleware that validates Clerk JWT tokens
func ClerkAuth() gin.HandlerFunc {
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
		c.Set("userId", claims.Subject)

		c.Next()
	}
}

// GetUserId extracts the Clerk user ID from the Gin context
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
