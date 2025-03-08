package mail

import (
	"fmt"

	"github.com/mailjet/mailjet-apiv3-go/v4"
)

// Sender はメール送信機能を提供します
type Sender struct {
	apiKeyPublic  string
	apiKeyPrivate string
	fromEmail     string
	fromName      string
	client        *mailjet.Client
}

// NewSender は新しいメール送信機能を作成します
func NewSender(apiKeyPublic, apiKeyPrivate, fromEmail, fromName string) *Sender {
	client := mailjet.NewMailjetClient(apiKeyPublic, apiKeyPrivate)
	return &Sender{
		apiKeyPublic:  apiKeyPublic,
		apiKeyPrivate: apiKeyPrivate,
		fromEmail:     fromEmail,
		fromName:      fromName,
		client:        client,
	}
}

// Message はメールメッセージの構造を定義します
type Message struct {
	To          []string
	Subject     string
	Body        string
	ContentType string
	Attachments map[string][]byte
}

// NewMessage は新しいメールメッセージを作成します
func NewMessage(to []string, subject, body string) *Message {
	return &Message{
		To:          to,
		Subject:     subject,
		Body:        body,
		ContentType: "text/html; charset=UTF-8",
		Attachments: make(map[string][]byte),
	}
}

// VerificationEmailData は存在確認メールテンプレートのデータです
type VerificationEmailData struct {
	UserName      string
	VerifyURL     string
	ExpirationHrs int
}

// SendVerificationEmail は生存確認用メールを送信します
func (s *Sender) SendVerificationEmail(to, userName, verifyURL string, expirationHrs int) error {
	// HTMLコンテンツの作成
	htmlContent := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>生存確認</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>生存確認</h1>
        </div>
        <div class="content">
            <p>%s 様</p>
            <p>こんにちは。アカウントの存在確認のため、以下のリンクをクリックしてください。</p>
            <p>このリンクは %d時間後に期限切れとなります。</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="%s" class="button">アカウントを確認する</a>
            </p>
            <p>もしリンクがクリックできない場合は、以下のURLをブラウザに貼り付けてください：</p>
            <p>%s</p>
            <p>このメールに心当たりがない場合は、無視していただいて構いません。</p>
        </div>
        <div class="footer">
            <p>このメールは自動送信されています。返信しないでください。</p>
        </div>
    </div>
</body>
</html>
`, userName, expirationHrs, verifyURL, verifyURL)

	// プレーンテキストコンテンツ
	plainTextContent := fmt.Sprintf(`
アカウント確認

%s 様

こんにちは。アカウントの存在確認のため、以下のリンクをクリックしてください。
このリンクは %d時間後に期限切れとなります。

%s

このメールに心当たりがない場合は、無視していただいて構いません。

このメールは自動送信されています。返信しないでください。
`, userName, expirationHrs, verifyURL)

	// Mailjetメッセージの作成
	messagesInfo := []mailjet.InfoMessagesV31{
		{
			From: &mailjet.RecipientV31{
				Email: s.fromEmail,
				Name:  s.fromName,
			},
			To: &mailjet.RecipientsV31{
				mailjet.RecipientV31{
					Email: to,
					Name:  userName,
				},
			},
			Subject:  "アカウント存在確認",
			TextPart: plainTextContent,
			HTMLPart: htmlContent,
		},
	}

	// メール送信リクエストの作成
	messages := mailjet.MessagesV31{Info: messagesInfo}

	// メールの送信
	_, err := s.client.SendMailV31(&messages)
	return err
}

// NewDummySender はテスト用のダミーメール送信機能を作成します（実際にはメールを送信しません）
func NewDummySender() *Sender {
	return &Sender{
		apiKeyPublic:  "dummy",
		apiKeyPrivate: "dummy",
		fromEmail:     "dummy@example.com",
		fromName:      "Dummy Sender",
		client:        nil,
	}
}

// SendDummyVerificationEmail はメールを送信したふりをします
func (s *Sender) SendDummyVerificationEmail(to, userName, verifyURL string, expirationHrs int) error {
	// 実際にはメールを送信せず、成功したふりをします
	fmt.Printf("[DUMMY EMAIL] To: %s, UserName: %s, VerifyURL: %s\n", to, userName, verifyURL)
	return nil
}
