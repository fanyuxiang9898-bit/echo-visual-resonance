#!/bin/bash
set -Eeuo pipefail
cd "${COZE_WORKSPACE_PATH:-.}"
exec pnpm start --port "${DEPLOY_RUN_PORT:-5000}"
