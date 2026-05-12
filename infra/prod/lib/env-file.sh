#!/usr/bin/env bash

set -euo pipefail

required_env_files=(
  ".env.prod"
  "api/.env.prod"
  "websocket/.env.prod"
)

optional_env_files=(
  "embedding/.env.prod"
)

env_files=("${required_env_files[@]}" "${optional_env_files[@]}")

required_env_keys=(
  ".env.prod:POSTGRES_PORT"
  ".env.prod:POSTGRES_DB"
  ".env.prod:POSTGRES_USER"
  ".env.prod:POSTGRES_PASSWORD"
  "api/.env.prod:PORT"
  "api/.env.prod:NODE_ENV"
  "api/.env.prod:DATABASE_URL"
  "api/.env.prod:BETTER_AUTH_SECRET"
  "api/.env.prod:BETTER_AUTH_URL"
  "api/.env.prod:PERMIFY_HTTP_URL"
  "api/.env.prod:PERMIFY_GRPC_URL"
  "api/.env.prod:PERMIFY_GRPC_INSECURE"
  "api/.env.prod:PERMIFY_REQUEST_TIMEOUT_MS"
  "api/.env.prod:PERMIFY_TENANT_ID"
  "api/.env.prod:PERMIFY_SCHEMA_VERSION"
  "websocket/.env.prod:PORT"
  "websocket/.env.prod:NODE_ENV"
  "websocket/.env.prod:DATABASE_URL"
  "websocket/.env.prod:BETTER_AUTH_SECRET"
  "websocket/.env.prod:BETTER_AUTH_URL"
  "websocket/.env.prod:PERMIFY_HTTP_URL"
  "websocket/.env.prod:PERMIFY_GRPC_URL"
  "websocket/.env.prod:PERMIFY_GRPC_INSECURE"
  "websocket/.env.prod:PERMIFY_REQUEST_TIMEOUT_MS"
  "websocket/.env.prod:PERMIFY_TENANT_ID"
  "websocket/.env.prod:PERMIFY_SCHEMA_VERSION"
  "embedding/.env.prod:NODE_ENV"
  "embedding/.env.prod:LOG_LEVEL"
  "embedding/.env.prod:EMBEDDING_PROVIDER"
)

init_env_files() {
  local file
  local example

  for file in "${env_files[@]}"; do
    example="${file}.example"
    if [ -f "$SYNC_PAD_ROOT/$file" ]; then
      log_info "found $file"
      continue
    fi

    if [ ! -f "$SYNC_PAD_ROOT/$example" ]; then
      die "missing $file and example file $example does not exist"
    fi

    log_info "creating $file from $example"
    cp "$SYNC_PAD_ROOT/$example" "$SYNC_PAD_ROOT/$file"
  done
}

require_env_files() {
  local file

  for file in "${required_env_files[@]}"; do
    if [ ! -f "$SYNC_PAD_ROOT/$file" ]; then
      die "missing $file; create it from ${file}.example or run bootstrap with env initialization"
    fi
  done
}

require_worker_env_files() {
  local file

  for file in "${optional_env_files[@]}"; do
    if [ ! -f "$SYNC_PAD_ROOT/$file" ]; then
      die "missing $file; create it from ${file}.example before starting worker services"
    fi
  done
}

validate_env_files() {
  local allow_schema_placeholder="${1:-false}"
  local file
  local line
  local key_spec
  local key
  local value
  local failed=false

  require_env_files

  for file in "${env_files[@]}"; do
    while IFS= read -r line; do
      if [ "$allow_schema_placeholder" = "true" ] &&
        [ "$line" = "PERMIFY_SCHEMA_VERSION=replace-me-after-running-permify-bootstrap" ]; then
        continue
      fi

      log_error "$file contains placeholder value: $line"
      failed=true
    done < <(grep 'replace-me' "$SYNC_PAD_ROOT/$file" 2>/dev/null || true)
  done

  for key_spec in "${required_env_keys[@]}"; do
    file="${key_spec%%:*}"
    key="${key_spec#*:}"

    if [ ! -f "$SYNC_PAD_ROOT/$file" ]; then
      continue
    fi

    value="$(get_env_value "$file" "$key")"

    if [ -z "$value" ]; then
      log_error "$file is missing required value for $key"
      failed=true
    fi
  done

  for file in "api/.env.prod" "websocket/.env.prod"; do
    value="$(get_env_value "$file" "BETTER_AUTH_SECRET")"
    if [ -n "$value" ] && [ "${#value}" -lt 32 ]; then
      log_error "$file BETTER_AUTH_SECRET must be at least 32 characters"
      failed=true
    fi
  done

  if [ "$failed" = "true" ]; then
    die "fix production env file issues before continuing"
  fi
}

get_env_value() {
  local file="$1"
  local key="$2"

  awk -F= -v key="$key" '
    $0 ~ /^[[:space:]]*#/ {
      next
    }
    $1 == key {
      sub(/^[^=]*=/, "")
      print
      exit
    }
  ' "$SYNC_PAD_ROOT/$file"
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  local path="$SYNC_PAD_ROOT/$file"
  local tmp

  [ -f "$path" ] || die "cannot update missing env file: $file"

  tmp="$(mktemp "${path}.XXXXXX")"
  awk -v key="$key" -v value="$value" '
    BEGIN {
      replacement = key "=" value
      found = 0
    }
    index($0, key "=") == 1 {
      print replacement
      found = 1
      next
    }
    {
      print
    }
    END {
      if (!found) {
        print replacement
      }
    }
  ' "$path" >"$tmp"
  mv "$tmp" "$path"
}

extract_schema_version() {
  awk -F= '/^PERMIFY_SCHEMA_VERSION=/ { value = $2 } END { print value }' "$1"
}

write_schema_version() {
  local schema_version="$1"

  [ -n "$schema_version" ] || die "cannot write an empty Permify schema version"

  log_info "writing PERMIFY_SCHEMA_VERSION=$schema_version to api/.env.prod"
  set_env_value "api/.env.prod" "PERMIFY_SCHEMA_VERSION" "$schema_version"

  log_info "writing PERMIFY_SCHEMA_VERSION=$schema_version to websocket/.env.prod"
  set_env_value "websocket/.env.prod" "PERMIFY_SCHEMA_VERSION" "$schema_version"
}
