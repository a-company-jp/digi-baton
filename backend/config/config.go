package config

import (
	"log"
	"os"
	"sync"

	"github.com/joho/godotenv"
)

type Config struct {
	EmailHost   string
	EmailKey    string
	EmailDomain string
}

var (
	configInstance *Config
	once           sync.Once
)

// LoadConfig は .env をロードし、Config インスタンスを作成する
func LoadConfig() *Config {
	once.Do(func() {
		// .env ファイルの読み込み（開発環境向け）
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found, using system environment variables")
		}

		configInstance = &Config{
			EmailHost:   getEnv("EMAIL_HOST", ""),
			EmailKey:    getEnv("EMAIL_KEY", ""),
			EmailDomain: getEnv("EMAIL_DOMAIN", "digi-baton"),
		}
	})
	return configInstance
}

// getEnv はデフォルト値付きの環境変数取得関数
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
