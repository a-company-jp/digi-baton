package main

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	ServerPort string
	UseSSL     bool
}

var (
	configInstance *Config
)

func init() {
	cfg, err := loadConfig()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}
	configInstance = cfg
	log.Printf("Loaded config: %+v", configInstance)
}

func loadConfig() (*Config, error) {
	viper.SetConfigFile(".env")
	if err := viper.ReadInConfig(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	viper.AutomaticEnv()

	viper.SetDefault("SERVER_PORT", "8080")
	viper.SetDefault("USE_SSL", false)

	c := &Config{
		DBHost:     viper.GetString("DB_HOST"),
		DBPort:     viper.GetString("DB_PORT"),
		DBUser:     viper.GetString("DB_USER"),
		DBPassword: viper.GetString("DB_PASSWORD"),
		DBName:     viper.GetString("DB_NAME"),
		ServerPort: viper.GetString("SERVER_PORT"),
		UseSSL:     viper.GetBool("USE_SSL"),
	}

	if !c.Validate() {
		return nil, fmt.Errorf("missing or invalid environment variables")
	}

	return c, nil
}

func ConfigData() Config {
	if configInstance == nil {
		return Config{}
	}
	return *configInstance
}

func (c *Config) Validate() bool {
	return c.DBHost != "" &&
		c.DBPort != "" &&
		c.DBUser != "" &&
		c.DBPassword != "" &&
		c.DBName != "" &&
		c.ServerPort != ""
}

func (c *Config) DBConnStr() string {
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
	if !c.UseSSL {
		connStr += " sslmode=disable"
	}
	return connStr
}
