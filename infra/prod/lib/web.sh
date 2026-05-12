#!/usr/bin/env bash

set -euo pipefail

build_web_assets() {
  log_info "building static web assets"
  compose --profile build run --rm web-build
}

publish_web_assets() {
  local web_root="$1"
  local dist="$SYNC_PAD_ROOT/deploy/web-dist"

  if [ -z "$web_root" ]; then
    log_info "no --web-root provided; leaving web assets in deploy/web-dist"
    return 0
  fi

  case "$web_root" in
    / | /.) die "refusing to publish web assets to $web_root" ;;
  esac

  [ -d "$dist" ] || die "web dist does not exist: $dist"
  [ -f "$dist/index.html" ] || die "web dist is missing index.html: $dist"

  log_info "publishing static web assets to $web_root"
  mkdir -p "$web_root"

  (
    shopt -s dotglob nullglob
    rm -rf "$web_root"/*
    cp -a "$dist"/. "$web_root"/
  )
}

