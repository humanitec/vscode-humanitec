#!/bin/sh

CLI_VERSION=0.25.1

mkdir -p ./humctl
rm -rf ./humctl/*

curl -L -o ./humctl/cli_${CLI_VERSION}_darwin_amd64.tar.gz https://github.com/humanitec/cli/releases/download/v${CLI_VERSION}/cli_${CLI_VERSION}_darwin_amd64.tar.gz
curl -L -o ./humctl/cli_${CLI_VERSION}_darwin_arm64.tar.gz https://github.com/humanitec/cli/releases/download/v${CLI_VERSION}/cli_${CLI_VERSION}_darwin_arm64.tar.gz
curl -L -o ./humctl/cli_${CLI_VERSION}_linux_amd64.tar.gz https://github.com/humanitec/cli/releases/download/v${CLI_VERSION}/cli_${CLI_VERSION}_linux_amd64.tar.gz
curl -L -o ./humctl/cli_${CLI_VERSION}_linux_arm64.tar.gz https://github.com/humanitec/cli/releases/download/v${CLI_VERSION}/cli_${CLI_VERSION}_linux_arm64.tar.gz
curl -L -o ./humctl/cli_${CLI_VERSION}_windows_amd64.zip https://github.com/humanitec/cli/releases/download/v${CLI_VERSION}/cli_${CLI_VERSION}_windows_amd64.zip

tar -xvf ./humctl/cli_${CLI_VERSION}_darwin_amd64.tar.gz -C ./humctl && mv ./humctl/humctl     ./humctl/cli_${CLI_VERSION}_darwin_x64
tar -xvf ./humctl/cli_${CLI_VERSION}_darwin_arm64.tar.gz -C ./humctl && mv ./humctl/humctl     ./humctl/cli_${CLI_VERSION}_darwin_arm64
tar -xvf ./humctl/cli_${CLI_VERSION}_linux_amd64.tar.gz  -C ./humctl && mv ./humctl/humctl     ./humctl/cli_${CLI_VERSION}_linux_x64
tar -xvf ./humctl/cli_${CLI_VERSION}_linux_arm64.tar.gz  -C ./humctl && mv ./humctl/humctl     ./humctl/cli_${CLI_VERSION}_linux_arm64
tar -xvf ./humctl/cli_${CLI_VERSION}_windows_amd64.zip   -C ./humctl && mv ./humctl/humctl.exe ./humctl/cli_${CLI_VERSION}_win32_x64.exe

rm -rf ./humctl/*.gz
rm -rf ./humctl/*.zip
rm -rf ./humctl/README.md
