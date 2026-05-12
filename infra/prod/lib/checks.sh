#!/usr/bin/env bash

set -euo pipefail

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "required command not found: $1"
  fi
}

check_api_endpoints() {
  if ! command -v curl >/dev/null 2>&1; then
    log_warn "curl not found; skipping API health checks"
    return 0
  fi

  log_info "checking API /health on 127.0.0.1:3001"
  curl -fsS http://127.0.0.1:3001/health >/dev/null

  log_info "checking API /ready on 127.0.0.1:3001"
  curl -fsS http://127.0.0.1:3001/ready >/dev/null
}

