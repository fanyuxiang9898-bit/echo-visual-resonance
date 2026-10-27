#!/bin/bash
set -Eeuo pipefail
cd "${COZE_WORKSPACE_PATH:-.}"
run_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
  else
    corepack pnpm "$@"
  fi
}
run_pnpm install --frozen-lockfile --prod=false
run_pnpm build
