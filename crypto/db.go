package main

import (
	"database/sql"
	"fmt"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
)

func getDB() (*sql.DB, error) {
	cfg := ConfigData()
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open db: %v", err)
	}
	err = db.Ping()
	return db, nil
}

// runMigrationsUp uses the golang-migrate library to apply all up migrations.
// No *testing.T in signature, returns an error instead.
func runMigrationsUp(db *sql.DB) error {
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return err
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://db/migrations",
		"postgres",
		driver,
	)
	if err != nil {
		return err
	}

	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}

// runMigrationsDown now uses m.Drop() to drop everything entirely.
// Also returns an error instead of taking *testing.T.
func runMigrationsDown(db *sql.DB) error {
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return err
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://db/migrations",
		"postgres",
		driver,
	)
	if err != nil {
		return err
	}

	err = m.Drop()
	if err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}
