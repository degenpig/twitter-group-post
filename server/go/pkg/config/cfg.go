package config

type Cfg struct {
	TwitterApiKey            string `required:"true" split_words:"true"`
	TwitterApiKeySecret      string `required:"true" split_words:"true"`
	TwitterAccessToken       string `required:"true" split_words:"true"`
	TwitterAccessTokenSecret string `required:"true" split_words:"true"`
	ApiPort                  string `required:"true" split_words:"true"`
}
