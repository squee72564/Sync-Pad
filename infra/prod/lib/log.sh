#!/usr/bin/env bash

set -euo pipefail

log_info() {
  printf '[%s] info: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

log_warn() {
  printf '[%s] warn: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2
}

log_error() {
  printf '[%s] error: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2
}

die() {
  log_error "$*"
  exit 1
}

