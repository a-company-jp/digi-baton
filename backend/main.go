package main

import (
	"net/http"

	"github.com/a-company-jp/digi-baton/backend/config"
	"github.com/gin-gonic/gin"
)

func main() {
	config := config.LoadConfig()

	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.Run(":" + config.ServerPort)
}
