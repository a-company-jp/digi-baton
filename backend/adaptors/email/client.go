package email

import (
	"context"

	"github.com/a-company-jp/digi-baton/config"
	"github.com/karim-w/go-azure-communication-services/emails"
)

type EmailRequest struct {
	Subject   string
	PlainText string
	To        string
}

func SendEmail(request EmailRequest) (emails.EmailResult, error) {

	conf := config.LoadConfig()
	client := emails.NewClient(conf.EmailHost, conf.EmailKey, nil)

	payload := emails.Payload{
		Headers: emails.Headers{
			ClientCorrelationID:    "1234",
			ClientCustomHeaderName: "ClientCustomHeaderValue",
		},
		SenderAddress: createSenderAddress(conf.EmailDomain),
		Content: emails.Content{
			Subject:   request.Subject,
			PlainText: request.PlainText,
		},
		Recipients: emails.Recipients{
			To: []emails.ReplyTo{
				{
					Address: request.To,
				},
			},
		},
	}

	result, err := client.SendEmail(context.TODO(), payload)
	if err != nil {
		return emails.EmailResult{}, err
	}
	return result, nil
}

func createSenderAddress(domain string) string {
	return "no-reply@" + domain + ".com"
}
