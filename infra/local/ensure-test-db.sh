#!/usr/bin/env bash

set -euo pipefail

POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-syncpad}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-syncpad}"
POSTGRES_ADMIN_DB="${POSTGRES_ADMIN_DB:-postgres}"
TEST_DB_NAME="${TEST_DB_NAME:-syncpad_test}"

export PGPASSWORD="$POSTGRES_PASSWORD"

until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_ADMIN_DB" >/dev/null 2>&1; do
  sleep 1
done

if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_ADMIN_DB" -Atqc \
  "SELECT 1 FROM pg_database WHERE datname = '${TEST_DB_NAME}'" | grep -q '^1$'; then
  printf 'database %s already exists\n' "$TEST_DB_NAME"
else
  createdb -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$TEST_DB_NAME"
  printf 'created database %s\n' "$TEST_DB_NAME"
fi
