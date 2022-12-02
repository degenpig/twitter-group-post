#!/bin/bash
env GOOS=linux CGO_ENABLED=0 GOARCH=amd64 go build -o ./main main.go