#!/bin/bash
# Installs the language server that the typescript-lsp plugin needs.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v typescript-language-server >/dev/null 2>&1 || ! command -v tsc >/dev/null 2>&1; then
  npm install -g --no-fund --no-audit typescript-language-server typescript >&2
fi
