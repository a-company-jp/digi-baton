package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/a-company-jp/digi-baton/backend/config"
	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/docs"
	"github.com/a-company-jp/digi-baton/backend/handlers"
	"github.com/a-company-jp/digi-baton/backend/middleware"
	"github.com/a-company-jp/digi-baton/proto/crypto"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// @title		Digi Baton API
// @version	2.0
// @host		localhost:8080
// @BasePath	/api
func main() {
	config := config.LoadConfig()

	// Clerk APIキーの初期化
	secretKey := os.Getenv("CLERK_SECRET_KEY")
	if secretKey == "" {
		panic("CLERK_SECRET_KEY environment variable is not set")
	}
	clerk.SetKey(secretKey)

	// Connect to the crypto service
	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect to gRPC server: %v", err)
	}
	defer conn.Close()

	// Create a client
	client := crypto.NewEncryptionServiceClient(conn)

	dbPool, err := initDatabasePool(config.DB.GetConnStr())
	if err != nil {
		panic(err)
	}
	defer dbPool.Close()
	q := query.New(dbPool)

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // すべてのオリジンを許可（必要に応じて制限可能）
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	docs.SwaggerInfo.BasePath = "/api"

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	api := router.Group("/api")
	{
		usersHandler := handlers.NewUsersHandler(q)
		// users
		// passer and receiver are the same in the system
		// clerkに認証の責務を負わせるため、本当に登録するためだけのエンドポイント。
		api.POST("/users", usersHandler.Create)
		api.PUT("/users", usersHandler.Update)

		// 認証が必要なルートに対してClerkAuth middlewareを適用
		authenticated := api.Group("/")
		authenticated.Use(middleware.ClerkAuth(q))
		{
			// receivers
			receiversHandler := handlers.NewReceiversHandler(q)
			authenticated.GET("/receivers", receiversHandler.List)

			// users
			userHandlers := handlers.NewUsersHandler(q)
			authenticated.GET("/users", userHandlers.GetByClerkID)

			// accounts
			accountHandlers := handlers.NewAccountsHandler(q, client)
			authenticated.GET("/accounts", accountHandlers.List)
			authenticated.POST("/accounts", accountHandlers.Create)
			authenticated.PUT("/accounts", accountHandlers.Update)
			authenticated.DELETE("/accounts", accountHandlers.Delete)
			authenticated.GET("/accounts/templates", accountHandlers.ListTemplate)

			// devices
			devicesHandler := handlers.NewDevicesHandler(q)
			authenticated.GET("/devices", devicesHandler.List)
			authenticated.POST("/devices", devicesHandler.Create)
			authenticated.PUT("/devices", devicesHandler.Update)
			authenticated.DELETE("/devices", devicesHandler.Delete)

			// trusts(相続の関係性）
			trustsHandler := handlers.NewTrustsHandler(q)
			authenticated.GET("/trusts", trustsHandler.List)
			authenticated.POST("/trusts", trustsHandler.Create)
			authenticated.PUT("/trusts", trustsHandler.Update)
			authenticated.DELETE("/trusts", trustsHandler.Delete)

			// disclosures
			disclosuresHandler := handlers.NewDisclosuresHandler(q)
			authenticated.GET("/disclosures", disclosuresHandler.List)
			authenticated.POST("/disclosures", disclosuresHandler.Create)
			authenticated.PUT("/disclosures", disclosuresHandler.Update)
			authenticated.DELETE("/disclosures", disclosuresHandler.Delete)

			// subscriptions
			subscriptionsHandler := handlers.NewSubscriptionsHandler(q)
			authenticated.GET("/subscriptions", subscriptionsHandler.List)
			authenticated.POST("/subscriptions", subscriptionsHandler.Create)
			authenticated.PUT("/subscriptions", subscriptionsHandler.Update)
			authenticated.DELETE("/subscriptions", subscriptionsHandler.Delete)

			// alive check
			aliveChecksHandler := handlers.NewAliveChecksHandler(q)
			authenticated.GET("/alive-checks", aliveChecksHandler.List)
			authenticated.POST("/alive-checks", aliveChecksHandler.Create)
			authenticated.PUT("/alive-checks", aliveChecksHandler.Update)
		}
	}

	chrome := router.Group("/chrome")
	{
		ch := handlers.NewChromeHandler(q)
		chrome.GET("/id", ch.HandleGetID)
		chrome.GET("/list", ch.HandleGetAccessibleUsers)
		chrome.POST("/register", ch.HandleCreate)
		chrome.POST("/assert", ch.HandleGetAssertion)
	}
	router.Run(":" + config.Server.Port)
}

// initDatabasePool はデータベース接続プールを初期化
func initDatabasePool(connString string) (*pgxpool.Pool, error) {
	// プール設定のパース
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("unable to parse connection string: %v", err)
	}

	// プール設定のカスタマイズ
	config.MaxConns = 20                      // 最大接続数
	config.MinConns = 5                       // 最小維持接続数
	config.MaxConnLifetime = 1 * time.Hour    // 接続の最大寿命
	config.MaxConnIdleTime = 30 * time.Minute // アイドル接続のタイムアウト
	config.ConnConfig.ConnectTimeout = 5 * time.Second

	// プールの作成
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %v", err)
	}

	// 接続確認
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %v", err)
	}

	log.Println("Database connection pool initialized successfully")
	return pool, nil
}
