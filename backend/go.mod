module github.com/a-company-jp/digi-baton

go 1.23.4

require resty.dev/v3 v3.0.0-beta.1

// privateなので、開発しやすくするため。
replace github.com/a-company-jp/digi-baton v0.0.0 => .

require (
	code.cloudfoundry.org/clock v1.0.0 // indirect
	github.com/BetaLixT/appInsightsTrace v0.2.3 // indirect
	github.com/Soreing/retrier v1.3.0 // indirect
	github.com/gofrs/uuid v4.2.0+incompatible // indirect
	github.com/joho/godotenv v1.5.1 // indirect
	github.com/karim-w/go-azure-communication-services v0.2.2 // indirect
	github.com/karim-w/stdlib v0.5.1 // indirect
	github.com/microsoft/ApplicationInsights-Go v0.4.4 // indirect
	go.uber.org/multierr v1.10.0 // indirect
	go.uber.org/zap v1.26.0 // indirect
)
