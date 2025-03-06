package main

import (
	"context"
	"net/http"
	"time"

	"github.com/a-company-jp/digi-baton/backend/config"
	"github.com/jackc/pgx/v5"

	"github.com/a-company-jp/digi-baton/backend/db/query"
	"github.com/a-company-jp/digi-baton/backend/docs"
	"github.com/a-company-jp/digi-baton/backend/handlers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title		Digi Baton API
// @version	2.0
// @host		localhost:8080
// @BasePath	/api
func main() {
	ctx := context.Background()
	config := config.LoadConfig()

	conn, err := pgx.Connect(ctx, config.DB.GetConnStr())
	if err != nil {
		panic(err)
	}
	defer conn.Close(ctx)
	q := query.New(conn)

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

		// accounts
		accountHandlers := handlers.NewAccountsHandler(q)
		api.GET("/accounts", accountHandlers.List)
		api.POST("/accounts", accountHandlers.Create)
		api.PUT("/accounts", accountHandlers.Update)
		api.DELETE("/accounts", accountHandlers.Delete)

		// devices
		devicesHandler := handlers.NewDevicesHandler(q)
		api.GET("/devices", devicesHandler.List)
		api.POST("/devices", devicesHandler.Create)
		api.PUT("/devices", devicesHandler.Update)
		api.DELETE("/devices", devicesHandler.Delete)

		// trusts(相続の関係性）
		trustsHandler := handlers.NewTrustsHandler(q)
		api.GET("/trusts", trustsHandler.List)
		api.POST("/trusts", trustsHandler.Create)
		api.PUT("/trusts", trustsHandler.Update)
		api.DELETE("/trusts", trustsHandler.Delete)

		// disclosures
		disclosuresHandler := handlers.NewDisclosuresHandler(q)
		api.GET("/disclosures", disclosuresHandler.List)
		api.POST("/disclosures", disclosuresHandler.Create)
		api.PUT("/disclosures", disclosuresHandler.Update)
		api.DELETE("/disclosures", disclosuresHandler.Delete)

		// alive check
		aliveChecksHandler := handlers.NewAliveChecksHandler(q)
		api.GET("/alive-checks", aliveChecksHandler.List)
		api.POST("/alive-checks", aliveChecksHandler.Create)
		api.PUT("/alive-checks", aliveChecksHandler.Update)
	}

	router.Run(":" + config.Server.Port)
}
