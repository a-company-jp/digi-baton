package main

import (
	"errors"
	"log"
	"net/http"
	"sync"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-webauthn/webauthn/webauthn"
)

// Simple in-memory user storage implementation
var (
	webAuthn, _ = webauthn.New(&webauthn.Config{
		RPDisplayName: "Demo App",
		RPID:          "localhost",
		RPOrigins:     []string{"http://localhost:8080", "chrome-extension://baenfakjhnfdniadohamniigaiblkjkf"},
	})
	userStorage    = NewInMemoryUserStorage()
	sessionStorage = NewInMemorySessionStorage()
)

func main() {
	r := gin.Default()
	r.Use(cors.Default())

	r.GET("/register/begin", BeginRegistration)
	r.POST("/register/finish", FinishRegistration)

	log.Println("Server listening on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

func BeginRegistration(c *gin.Context) {
	username := c.Query("username")
	user := userStorage.GetOrCreateUser(username)

	opts, sessionData, err := webAuthn.BeginRegistration(user)
	if err != nil {
		log.Printf("[ERROR] BeginRegistration for user '%s': %v", username, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sessionStorage.SaveSession(username, sessionData)
	log.Printf("[INFO] BeginRegistration successful for user '%s'", username)
	c.JSON(http.StatusOK, opts)
}

func FinishRegistration(c *gin.Context) {
	username := c.Query("username")
	user := userStorage.GetOrCreateUser(username)

	sessionData, err := sessionStorage.GetSession(username)
	if err != nil {
		log.Printf("[ERROR] FinishRegistration (GetSession) for user '%s': %v", username, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sD := webauthn.SessionData{
		Challenge:            sessionData.Challenge,
		RelyingPartyID:       sessionData.RelyingPartyID,
		UserID:               sessionData.UserID,
		AllowedCredentialIDs: sessionData.AllowedCredentialIDs,
		Expires:              sessionData.Expires,
		UserVerification:     sessionData.UserVerification,
		Extensions:           sessionData.Extensions,
	}
	credential, err := webAuthn.FinishRegistration(user, sD, c.Request)
	if err != nil {
		log.Printf("[ERROR] FinishRegistration for user '%s': %v", username, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	user.AddCredential(*credential)
	log.Printf("[INFO] FinishRegistration successful for user '%s'. Credential added.", username)
	c.JSON(http.StatusOK, gin.H{"status": "registered"})
}

// In-memory session storage implementation

type InMemorySessionStorage struct {
	sessions map[string]*webauthn.SessionData
	mutex    sync.RWMutex
}

func NewInMemorySessionStorage() *InMemorySessionStorage {
	return &InMemorySessionStorage{sessions: make(map[string]*webauthn.SessionData)}
}

func (s *InMemorySessionStorage) SaveSession(username string, data *webauthn.SessionData) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.sessions[username] = data
}

func (s *InMemorySessionStorage) GetSession(username string) (*webauthn.SessionData, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	data, exists := s.sessions[username]
	if !exists {
		return nil, errors.New("session not found")
	}
	return data, nil
}

// In-memory user storage and user implementation

type User struct {
	Username    string
	Credentials []webauthn.Credential
}

func (u *User) WebAuthnID() []byte {
	return []byte(u.Username)
}

func (u *User) WebAuthnName() string {
	return u.Username
}

func (u *User) WebAuthnDisplayName() string {
	return u.Username
}

func (u *User) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

func (u *User) AddCredential(cred webauthn.Credential) {
	u.Credentials = append(u.Credentials, cred)
}

type InMemoryUserStorage struct {
	users map[string]*User
	mutex sync.RWMutex
}

func NewInMemoryUserStorage() *InMemoryUserStorage {
	return &InMemoryUserStorage{users: make(map[string]*User)}
}

func (s *InMemoryUserStorage) GetOrCreateUser(username string) *User {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	user, exists := s.users[username]
	if !exists {
		user = &User{Username: username}
		s.users[username] = user
	}
	return user
}
