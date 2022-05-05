#!/bin/bash

## Start Github Actions Runner
if [[ 'yes' == $EPHEMERAL ]]; then
  ephemeral='--ephemeral'
fi
if [[ -n $LABELS ]]; then
  labels="--labels ${LABELS}"
fi
echo '----- SETTINGS -----------------------------------------'
echo "REPOSITORY_URL: ${REPOSITORY_URL}"
echo "ephemeral: ${ephemeral}"
echo "labels: ${labels}"
echo '--------------------------------------------------------'
./config.sh --unattended --replace --disableupdate --url ${REPOSITORY_URL} --token ${TOKEN} ${ephemeral} ${labels}
./run.sh
