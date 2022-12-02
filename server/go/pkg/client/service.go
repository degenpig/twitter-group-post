package client

import (
	"context"
	"log"
	"net/http"

	"github.com/dghubble/oauth1"
	"github.com/g8rswimmer/go-twitter/v2"
	"github.com/urko-b/twitter-user-timeline/pkg/config"
)

type authorize struct{}

func (a authorize) Add(req *http.Request) {
}

type Service struct {
	client *twitter.Client
}

func NewService(cfg config.Cfg) *Service {
	oauth_twitter_app_config := oauth1.NewConfig(cfg.TwitterApiKey, cfg.TwitterApiKeySecret)
	oauth_token := oauth1.NewToken(cfg.TwitterAccessToken, cfg.TwitterAccessTokenSecret)
	http_client := oauth_twitter_app_config.Client(oauth1.NoContext, oauth_token)

	client := &twitter.Client{
		Authorizer: authorize{},
		Client:     http_client,
		Host:       "https://api.twitter.com",
	}

	return &Service{
		client: client,
	}
}

func (srv *Service) GetTweetList(user_name string) []string {
	tweet_list := []string{}
	user_id_list := []string{user_name}
	user_resp, err := srv.client.UserNameLookup(context.Background(), user_id_list, twitter.UserLookupOpts{})
	if err != nil {
		log.Fatalf("client.UserTweetReverseChronologicalTimeline: %s", err)
	}

	if len(user_resp.Raw.Users) <= 0 {
		log.Fatal("user not found")
	}

	user_id := user_resp.Raw.Users[0].ID
	tl, err := srv.client.UserTweetTimeline(context.Background(), user_id, twitter.UserTweetTimelineOpts{
		TweetFields: []twitter.TweetField{
			twitter.TweetFieldID,
		},
		MaxResults: 15,
	})
	if err != nil {
		log.Fatalf("client.UserTweetTimeline: %s", err)
	}

	for _, tw := range tl.Raw.Tweets {
		tweet_list = append(tweet_list, tw.ID)
	}

	return tweet_list
}
