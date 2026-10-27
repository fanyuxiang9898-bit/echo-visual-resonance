#!/bin/bash
set -Eeuo pipefail
cd "${COZE_WORKSPACE_PATH:-.}"
if command -v pnpm >/dev/null 2>&1; then
  exec pnpm start --port "${DEPLOY_RUN_PORT:-5000}"
else
  exec corepack pnpm start --port "${DEPLOY_RUN_PORT:-5000}"
fi
