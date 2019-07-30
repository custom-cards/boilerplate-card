FROM node:current-buster

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        python3-pip \
        #python3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --upgrade colorlog setuptools wheel
RUN pip3 install --upgrade git+git://github.com/home-assistant/home-assistant.git@dev
RUN mkdir -p /config/www

WORKDIR /workspace

# Set the default shell to bash instead of sh
ENV SHELL /bin/bash