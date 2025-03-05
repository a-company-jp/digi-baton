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
	docs.SwaggerInfo.BasePath = "/api/v1"

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	v1 := router.Group("/api/v1")
	{
		usersHandler := handlers.NewUsersHandler(q)
		// users
		// passer and receiver are the same in the system
		// clerkに認証の責務を負わせるため、本当に登録するためだけのエンドポイント。
		v1.POST("/users", usersHandler.Create)
		v1.PUT("/users", usersHandler.Update)

		// accounts
		accountHandlers := handlers.NewAccountsHandler(q)
		v1.GET("/accounts", accountHandlers.List)
		v1.POST("/accounts", accountHandlers.Create)
		v1.PUT("/accounts", accountHandlers.Update)
		v1.DELETE("/accounts", accountHandlers.Delete)

		// devices
		devicesHandler := handlers.NewDevicesHandler(q)
		v1.GET("/devices", devicesHandler.List)
		v1.POST("/devices", devicesHandler.Create)
		v1.PUT("/devices", devicesHandler.Update)
		v1.DELETE("/devices", devicesHandler.Delete)

		// trusts(相続の関係性）
		trustsHandler := handlers.NewTrustsHandler(q)
		v1.GET("/trusts/:passerID", trustsHandler.List)
		v1.POST("/trusts", trustsHandler.Create)
		v1.PUT("/trusts", trustsHandler.Update)
		v1.DELETE("/trusts", trustsHandler.Delete)

	}

	router.Run(":" + config.Server.Port)
}
