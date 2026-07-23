#!/usr/bin/env bash
cd /Users/mac/Documents/keal/backend
export PATH="/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
exec /Users/mac/Documents/keal/pnpm.sh exec tsx src/server.ts
