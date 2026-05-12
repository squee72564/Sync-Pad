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
run_bootstrap=false
services=(api websocket)

usage() {
  cat <<'USAGE'
Usage: infra/prod/refresh.sh [options]

Refresh a production host after code has been updated.

Options:
  --web-root PATH      Publish deploy/web-dist into PATH after building web assets.
  --services LIST      Space-separated Compose services to restart. Default: "api websocket".
  --with-workers       Include the optional embedding worker.
  --bootstrap          Run migrations and Permify bootstrap, then update schema env vars.
  --skip-build         Do not rebuild the production Docker image.
  --skip-web           Do not build or publish static web assets.
  -h, --help           Show this help.

Examples:
  infra/prod/refresh.sh --web-root /var/www/squee.online
  infra/prod/refresh.sh --services "api websocket" --skip-web
  infra/prod/refresh.sh --bootstrap --web-root /var/www/squee.online
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --web-root)
      [ "$#" -ge 2 ] || die "--web-root requires a path"
      web_root="$2"
      shift 2
      ;;
    --services)
      [ "$#" -ge 2 ] || die "--services requires a service list"
      read -r -a services <<<"$2"
      shift 2
      ;;
    --with-workers)
      with_workers=true
      services+=(embedding)
      shift
      ;;
    --bootstrap)
      run_bootstrap=true
      shift
      ;;
    --skip-build)
      skip_build=true
      shift
      ;;
    --skip-web)
      skip_web=true
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

log_info "starting production refresh from $SYNC_PAD_ROOT"
require_command awk
require_command grep
require_command mktemp
require_env_files

if [ "${#services[@]}" -eq 0 ]; then
  die "at least one service must be provided"
fi

for service in "${services[@]}"; do
  if [ "$service" = "embedding" ]; then
    with_workers=true
  fi
done

if [ "$with_workers" = "true" ]; then
  require_worker_env_files
fi

if [ "$run_bootstrap" = "true" ]; then
  validate_env_files true
else
  validate_env_files false
fi

if [ "$skip_build" = "false" ]; then
  compose_build
fi

if [ "$run_bootstrap" = "true" ]; then
  compose_start_infra
  run_prod_bootstrap
  validate_env_files false
fi

if [ "$with_workers" = "true" ]; then
  compose_start_app_with_workers "${services[@]}"
else
  compose_start_app "${services[@]}"
fi

if [ "$skip_web" = "false" ]; then
  build_web_assets
  publish_web_assets "$web_root"
fi

compose_ps
check_api_endpoints
log_info "production refresh complete"
