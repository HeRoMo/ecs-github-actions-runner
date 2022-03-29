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
        amd64) runnerArch='linux-x64'; runnerSha256='325b89bdc1c67264ec6f4515afda4534f14a6477d9ba241da19c43f9bed2f5a6' ;; \
        arm64) runnerArch='linux-arm64'; runnerSha256='9fbb98fc64f57d48e86b641bd3dd54d870123afc32886b5ca1c33bdc10afb6ee' ;; \
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
