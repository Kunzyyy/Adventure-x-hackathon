#!/usr/bin/env bash
NODE="/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
PNPM="/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.cjs"
PATH="/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
exec "$NODE" "$PNPM" "$@"
