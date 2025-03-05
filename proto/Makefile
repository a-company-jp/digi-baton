TARGET_DIR ?= crypto

gen_proto_base:
	mkdir -p ./$(TARGET_DIR)
	aqua exec protoc \
		--proto_path=./src/$(TARGET_DIR) \
		--go_out=./$(TARGET_DIR) \
		--go_opt=paths=source_relative \
		--go-grpc_out=./$(TARGET_DIR) \
		--go-grpc_opt=paths=source_relative \
		./src/$(TARGET_DIR)/*.proto

# テスト用に、生成した Go コードを使ってビルドしてみる例
build:
	@echo "Go build example... (必要があれば別途コマンド記述)"

clean:
	rm -rf ./$(TARGET_DIR)/*.pb.go
