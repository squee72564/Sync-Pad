#!/usr/bin/env bash

set -euo pipefail

compose() {
  require_command docker
  (
    cd "$SYNC_PAD_ROOT"
    docker compose --env-file .env.prod -f docker-compose.prod.yml "$@"
  )
}

compose_build() {
  log_info "building production Docker image"
  compose --profile build build api websocket web-build
}

compose_start_infra() {
  log_info "starting postgres and permify"
  compose up -d postgres permify
}

compose_start_app() {
  log_info "starting services: $*"
  compose up -d "$@"
}

compose_start_app_with_workers() {
  log_info "starting services with workers profile: $*"
  compose --profile workers up -d "$@"
}

compose_ps() {
  log_info "current Compose service state"
  compose ps
}

