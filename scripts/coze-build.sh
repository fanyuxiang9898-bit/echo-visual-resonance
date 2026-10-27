#!/bin/bash
set -Eeuo pipefail
cd "${COZE_WORKSPACE_PATH:-.}"
pnpm install --frozen-lockfile --prod=false
pnpm build
