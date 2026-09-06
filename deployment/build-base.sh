#!/usr/bin/env sh
set -eu

docker build \
  -f deployment/Dockerfile.base \
  -t insurance-cms-base:latest \
  .
