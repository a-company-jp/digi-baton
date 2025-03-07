package config

import "log"

type DBConfig struct {
	Host         string
	Port         string
	User         string
	Password     string
	Name         string
	AzureConnStr string
}

func (c *DBConfig) GetConnStr() string {
	if c.AzureConnStr != "" {
		log.Printf("Using AZURE_SQL_HOST: %s", c.AzureConnStr)
		return c.AzureConnStr
	}
	return "host=" + c.Host + " port=" + c.Port + " user=" + c.User + " password=" + c.Password + " dbname=" + c.Name + " sslmode=disable"
}
