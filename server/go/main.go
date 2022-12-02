package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/urko-b/twitter-user-timeline/pkg/client"
	"github.com/urko-b/twitter-user-timeline/pkg/config"
)

func main() {
	env := os.Getenv("ENV")

	if env != "prod" {
		err := godotenv.Load(".env")
		if err != nil {
			log.Fatal(
				fmt.Errorf("environment variable ENV is empty and an error occurred while loading the .env file"),
			)
		}
	}

	cfg := config.Cfg{}
	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatal(err)
	}

	twitter_client := client.NewService(cfg)

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,OPTIONS",
	}))

	app.Get("/feed/:user_id", func(c *fiber.Ctx) error {
		if c.Params("user_id") == "" {
			err := errors.New("user_id is needed")
			return c.Status(http.StatusBadRequest).SendString(err.Error())
		}

		tweet_list := twitter_client.GetTweetList(c.Params("user_id"))

		return c.JSON(tweet_list)
	})

	app.Listen(fmt.Sprintf(":%s", cfg.ApiPort))
}
