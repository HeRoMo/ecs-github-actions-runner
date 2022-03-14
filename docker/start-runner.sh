#!/bin/bash

## Start Github Actions Runner
RUNNER_NAME="$(hostname)-$(uname -m)"
./config.sh --unattended --replace --name ${RUNNER_NAME} --url ${REPOSITORY_URL} --token ${TOKEN}
./run.sh
