package config

import (
	"fmt"
)

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	UseSSL   string
}

func (c *DBConfig) GetConnStr() string {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s", c.Host, c.Port, c.User, c.Password, c.Name)
	if c.UseSSL == "false" {
		connStr += " sslmode=disable"
	}
	return connStr
}
