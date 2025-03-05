package config

import (
	"log"
	"os"
	"sync"

	"github.com/joho/godotenv"
)

type Config struct {
	Server ServerConfig
	DB    DBConfig
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
			Server: ServerConfig{
				Port: getEnv("SERVER_PORT", "8080"),
			},
			DB: DBConfig{
				Host:     getEnv("DB_HOST", "localhost"),
				Port:     getEnv("DB_PORT", "5432"),
				User:     getEnv("DB_USER", "user"),
				Password: getEnv("DB_PASSWORD", "password"),
				Name:     getEnv("DB_NAME", "digi_baton"),
			},
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

