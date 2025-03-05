RDB_HOST ?= 127.0.0.1
RDB_PORT ?= 5432
RDB_USER ?= user
RDB_PASS ?= password
RDB_NAME ?= digi_baton_crypto
DATABASE_HOST ?= postgres://$(RDB_USER):$(RDB_PASS)@$(RDB_HOST):$(RDB_PORT)
DATABASE_URL ?= $(DATABASE_HOST)/$(RDB_NAME)?sslmode=disable

migrate-new: ## マイグレーションファイル作成
ifndef NAME
	@echo "Usage: make NAME=migration_name migrate-new"
else
	migrate create -ext sql -dir ./db/migrations -seq $(NAME)
endif

migrate-setup:
	@go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

migrate-up: ## マイグレーション実行
	migrate -source file://db/migrations -database $(DATABASE_URL) up

migrate-down: ## マイグレーションロールバック
	migrate -source file://db/migrations -database $(DATABASE_URL) down 1

migrate-drop: ## データベース削除
	migrate -source file://db/migrations -database $(DATABASE_URL) drop

dump-schema:
	pg_dump --schema-only "user=$(RDB_USER) password=$(RDB_PASS) dbname=$(RDB_NAME) sslmode=disable host=$(RDB_HOST) port=$(RDB_PORT)" > db/schema.sql

migrate-reset: migrate-drop migrate-up

dev:
	air -c .air.toml
