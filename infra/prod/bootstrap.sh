#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
export SYNC_PAD_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

source "$SCRIPT_DIR/lib/log.sh"
source "$SCRIPT_DIR/lib/checks.sh"
source "$SCRIPT_DIR/lib/compose.sh"
source "$SCRIPT_DIR/lib/env-file.sh"
source "$SCRIPT_DIR/lib/bootstrap.sh"
source "$SCRIPT_DIR/lib/web.sh"

web_root=""
skip_build=false
skip_web=false
with_workers=false
init_env=true

usage() {
  cat <<'USAGE'
Usage: infra/prod/bootstrap.sh [options]

Bootstrap a production host from this repository.

Options:
  --web-root PATH      Publish deploy/web-dist into PATH after building web assets.
  --skip-build         Do not build the production Docker image before bootstrapping.
  --skip-web           Do not build or publish static web assets.
  --with-workers       Start the optional embedding worker.
  --no-init-env        Do not create missing .env.prod files from examples.
  -h, --help           Show this help.

The script never overwrites existing env files. It only creates missing env
files from examples and updates PERMIFY_SCHEMA_VERSION in api/.env.prod and
websocket/.env.prod after the Permify bootstrap prints a schema version.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --web-root)
      [ "$#" -ge 2 ] || die "--web-root requires a path"
      web_root="$2"
      shift 2
      ;;
    --skip-build)
      skip_build=true
      shift
      ;;
    --skip-web)
      skip_web=true
      shift
      ;;
    --with-workers)
      with_workers=true
      shift
      ;;
    --no-init-env)
      init_env=false
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1"
      ;;
  esac
done

log_info "starting production bootstrap from $SYNC_PAD_ROOT"
require_command awk
require_command grep
require_command mktemp

if [ "$init_env" = "true" ]; then
  init_env_files
else
  require_env_files
fi

if [ "$with_workers" = "true" ]; then
  require_worker_env_files
fi

validate_env_files true

if [ "$skip_build" = "false" ]; then
  compose_build
fi

compose_start_infra
run_prod_bootstrap
validate_env_files false

if [ "$with_workers" = "true" ]; then
  compose_start_app_with_workers api websocket embedding
else
  compose_start_app api websocket
fi

if [ "$skip_web" = "false" ]; then
  build_web_assets
  publish_web_assets "$web_root"
fi

compose_ps
check_api_endpoints
log_info "production bootstrap complete"
