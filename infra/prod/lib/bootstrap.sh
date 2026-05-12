#!/usr/bin/env bash

set -euo pipefail

run_prod_bootstrap() {
  local output_file
  local schema_version

  output_file="$(mktemp)"

  log_info "running database migrations and Permify bootstrap"
  if ! compose run --rm api pnpm infra:bootstrap:prod 2>&1 | tee "$output_file"; then
    rm -f "$output_file"
    die "production bootstrap failed"
  fi

  schema_version="$(extract_schema_version "$output_file")"
  rm -f "$output_file"

  if [ -z "$schema_version" ]; then
    die "bootstrap did not print PERMIFY_SCHEMA_VERSION=..."
  fi

  write_schema_version "$schema_version"
}

