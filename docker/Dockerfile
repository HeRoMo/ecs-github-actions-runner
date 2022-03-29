# https://hub.docker.com/_/debian
FROM debian:bullseye-slim

ARG RUNNER_VERSION=2.289.1

ARG USERNAME=user
ARG GROUPNAME=user
ARG UID=1000
ARG GID=1000
ARG DOCKER_GROUPNAME=docker
ARG DOCKER_GID=994

# Package install
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
                        ca-certificates \
                        curl \
                        gnupg \
                        lsb-release
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
            docker-ce-cli

## Add user and workdir
RUN groupadd -g ${GID} ${GROUPNAME} && \
    groupadd -g ${DOCKER_GID} ${DOCKER_GROUPNAME} && \
    useradd -m -s /bin/bash -u ${UID} -g ${GID} -G ${DOCKER_GID} ${USERNAME}
USER ${USERNAME}
RUN mkdir -p /home/${USERNAME}/actions-runner
WORKDIR /home/${USERNAME}/actions-runner

# Install Github actions runner
USER root
RUN set -eux; \
    dpkgArch="$(dpkg --print-architecture)"; \
    case "${dpkgArch##*-}" in \
        amd64) runnerArch='linux-x64'; runnerSha256='d75a2b35c47df410bba1ede6196fc62b6063164f5d109bda1693641bba87a65f' ;; \
        arm64) runnerArch='linux-arm64'; runnerSha256='28e09a31fe35863ef63507494642310eb7cbb9f2ae8c327cfce6962045a106f0' ;; \
        *) echo >&2 "unsupported architecture: ${dpkgArch}"; exit 1 ;; \
    esac; \
    url="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-${runnerArch}-${RUNNER_VERSION}.tar.gz"; \
    curl -L "$url" -o actions-runner.tar.gz; \
    echo "${runnerSha256} actions-runner.tar.gz" | sha256sum -c -; \
    chown ${USERNAME} actions-runner.tar.gz;

USER ${USERNAME}
RUN tar xzf ./actions-runner.tar.gz \
    && rm -f ./actions-runner.tar.gz

# Install dependencies and cleanup
USER root
RUN ./bin/installdependencies.sh \
    apt-get autoremove \
    && apt-get clean \
    && apt-get autoclean \
    && rm -rf /var/lib/apt/lists/*

USER ${USERNAME}
COPY --chown=${USERNAME}:${USERNAME} start-runner.sh start-runner.sh
RUN chmod u+x ./start-runner.sh

CMD ["./start-runner.sh"]
