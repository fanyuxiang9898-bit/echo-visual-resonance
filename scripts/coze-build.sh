#!/bin/bash
set -Eeuo pipefail
cd "${COZE_WORKSPACE_PATH:-.}"
corepack pnpm install --frozen-lockfile --prod=false
corepack pnpm build
