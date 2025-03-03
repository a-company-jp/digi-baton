package main

import (
	"context"
	"database/sql"
	"log"
	"net"

	"github.com/a-company-jp/digi-baton/proto/crypto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	_ "github.com/lib/pq"
)

type server struct {
	crypto.UnimplementedEncryptionServiceServer
	db *sql.DB
}

func (s *server) storeHistory(ctx context.Context, userID, operation string, data []byte) {
	_, err := s.db.ExecContext(
		ctx,
		"INSERT INTO encryption_decryption_history (user_id, operation, data) VALUES ($1, $2, $3)",
		userID, operation, data,
	)
	if err != nil {
		log.Printf("failed to store history: %v", err)
	}
}

func main() {
	dsn := "postgres://username:password@localhost:5432/mydb?sslmode=disable"
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping db: %v", err)
	}

	// 2. Create a gRPC server
	grpcServer := grpc.NewServer()
	srv := &server{db: db}

	// 3. Register our encryption service
	crypto.RegisterEncryptionServiceServer(grpcServer, srv)

	// 4. Optionally enable reflection
	reflection.Register(grpcServer)

	// 5. Listen on a port
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	log.Println("Starting gRPC server on :50051 ...")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
