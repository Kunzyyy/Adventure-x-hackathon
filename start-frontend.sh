#!/usr/bin/env bash
cd /Users/mac/Documents/keal/frontend
export PATH="/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
exec /Users/mac/Documents/keal/pnpm.sh exec vite --port 5200 --host 0.0.0.0
