package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-webauthn/webauthn/webauthn"
)

func main() {
	r := gin.Default()
	r.Use(cors.Default())

	// ---------------------------------
	// 1) 静的ファイルをホスティング
	//   / へのアクセスで public/index.html を返し、
	//   JS/CSSなども public ディレクトリに置いて提供します。
	r.Static("/frontend", "./cmd/webauthn-demo/public")

	// ---------------------------------
	// 2) WebAuthn設定
	w, _ := webauthn.New(&webauthn.Config{
		RPDisplayName: "Demo WebAuthn Service",
		RPID:          "localhost",
		RPOrigins:     []string{"http://localhost:6288"},
	})

	userStorage := NewInMemoryUserStorage()
	sessionStorage := NewInMemorySessionStorage()

	// ---------------------------------
	// 3) WebAuthn APIエンドポイント

	// ユーザー登録 (Begin)
	r.GET("/register/begin", func(c *gin.Context) {
		username := c.Query("username")
		user := userStorage.GetOrCreateUser(username)

		opts, sessionData, err := w.BeginRegistration(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		sessionStorage.SaveSession(username, sessionData)
		c.JSON(http.StatusOK, opts)
	})

	// ユーザー登録 (Finish)
	r.POST("/register/finish", func(c *gin.Context) {
		username := c.Query("username")
		user := userStorage.GetOrCreateUser(username)

		sessionData, err := sessionStorage.GetSession(username)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		cred, err := w.FinishRegistration(user, *sessionData, c.Request)
		if err != nil {
			log.Printf("Error finishing registration: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		user.AddCredential(*cred)
		c.JSON(http.StatusOK, gin.H{"status": "registered"})
	})

	// ログイン (Begin)
	r.GET("/login/begin", func(c *gin.Context) {
		username := c.Query("username")
		user := userStorage.GetUser(username)
		if user == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "no such user"})
			return
		}

		opts, sessionData, err := w.BeginLogin(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		sessionStorage.SaveSession(username, sessionData)
		c.JSON(http.StatusOK, opts)
	})

	// ログイン (Finish)
	r.POST("/login/finish", func(c *gin.Context) {
		username := c.Query("username")
		user := userStorage.GetUser(username)
		if user == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "no such user"})
			return
		}

		sessionData, err := sessionStorage.GetSession(username)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		credential, err := w.FinishLogin(user, *sessionData, c.Request)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "logged in", "credentialID": credential.ID})
	})

	// ---------------------------------
	log.Println("Demo WebAuthn Service is listening on :6288")
	log.Fatal(r.Run(":6288"))
}

// --- InMemory Session

type InMemorySessionStorage struct {
	data  map[string]*webauthn.SessionData
	mutex sync.RWMutex
}

func NewInMemorySessionStorage() *InMemorySessionStorage {
	return &InMemorySessionStorage{data: make(map[string]*webauthn.SessionData)}
}

func (s *InMemorySessionStorage) SaveSession(username string, d *webauthn.SessionData) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.data[username] = d
}

func (s *InMemorySessionStorage) GetSession(username string) (*webauthn.SessionData, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	sd, ok := s.data[username]
	if !ok {
		return nil, http.ErrNoCookie
	}
	return sd, nil
}

// --- InMemory User Storage

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

// Not used in minimal PoC
func (u *User) WebAuthnIcon() string {
	return ""
}

func NewInMemoryUserStorage() *InMemoryUserStorage {
	return &InMemoryUserStorage{data: make(map[string]*User)}
}

type InMemoryUserStorage struct {
	data  map[string]*User
	mutex sync.RWMutex
}

func (s *InMemoryUserStorage) GetOrCreateUser(username string) *User {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	if u, ok := s.data[username]; ok {
		return u
	}
	u := &User{Username: username}
	s.data[username] = u
	return u
}

func (s *InMemoryUserStorage) GetUser(username string) *User {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.data[username]
}
