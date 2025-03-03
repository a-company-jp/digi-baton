RDB_HOST ?= 127.0.0.1
RDB_PORT ?= 5432
RDB_USER ?= user
RDB_PASS ?= password
RDB_NAME ?= digi_baton_backend
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

migrate-seed-new: ## マイグレーションファイル作成
ifndef NAME
	@echo "Usage: make NAME=migration_name migrate-new"
else
	migrate create -ext sql -dir ./db/seed -seq $(NAME)
endif

migrate-seed-up: ## データベース初期データ投入
	migrate -source file://db/seed -database "$(DATABASE_URL)&x-migrations-table=schema_migrations_seed" up

migrate-seed-down: ## データベース初期データ投入
	migrate -source file://db/seed -database "$(DATABASE_URL)&x-migrations-table=schema_migrations_seed" down 1

dump-schema:
	pg_dump --schema-only "user=$(RDB_USER) password=$(RDB_PASS) dbname=$(RDB_NAME) sslmode=disable host=$(RDB_HOST) port=$(RDB_PORT)" > db/schema.sql
## マイグレーションリセット
migrate-reset: migrate-drop migrate-up migrate-seed-up

dev:
	air -c .air.toml
