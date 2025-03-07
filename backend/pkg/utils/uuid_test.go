package utils

import (
	"reflect"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func TestToPgxUUID(t *testing.T) {
	type args struct {
		u uuid.UUID
	}
	tests := []struct {
		name string
		args args
		want pgtype.UUID
	}{
		{
			name: "Valid random UUID",
			args: args{
				u: uuid.MustParse("12345678-1234-5678-1234-567812345678"),
			},
			want: pgtype.UUID{
				Bytes: uuid.MustParse("12345678-1234-5678-1234-567812345678"),
				Valid: true,
			},
		},
		{
			name: "Zero UUID",
			args: args{
				u: uuid.UUID{},
			},
			want: pgtype.UUID{
				Bytes: uuid.UUID{},
				Valid: true,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ToPgxUUID(tt.args.u)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ToPgxUUID() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestFromPgxUUID(t *testing.T) {
	type args struct {
		u pgtype.UUID
	}
	tests := []struct {
		name    string
		args    args
		want    uuid.UUID
		wantErr bool
	}{
		{
			name: "Valid pgtype.UUID",
			args: args{
				u: pgtype.UUID{
					Bytes: uuid.MustParse("11111111-2222-3333-4444-555555555555"),
					Valid: true,
				},
			},
			want:    uuid.MustParse("11111111-2222-3333-4444-555555555555"),
			wantErr: false,
		},
		{
			name: "Invalid pgtype.UUID (NULL case)",
			args: args{
				u: pgtype.UUID{
					Bytes: uuid.UUID{},
					Valid: false,
				},
			},
			want:    uuid.UUID{}, // Expect empty
			wantErr: true,        // Because Valid = false
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := FromPgxUUID(tt.args.u)
			if (err != nil) != tt.wantErr {
				t.Errorf("FromPgxUUID() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("FromPgxUUID() got = %v, want %v", got, tt.want)
			}
		})
	}
}
