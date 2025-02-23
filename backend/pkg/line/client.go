package line

import "resty.dev/v3"

const (
	getProfileEndpoint = "https://api.line.me/v2/profile"
)

// GetProfile Note: This functions requires the "profile" scope.
func GetProfile(accessToken string) (resp ProfileResponse, err error) {
	client := resty.New()
	if _, err = client.R().
		SetHeader("Authorization", "Bearer "+accessToken).
		SetResult(&resp).
		Get(getProfileEndpoint); err != nil {
		return ProfileResponse{}, err
	}
	return resp, nil
}
