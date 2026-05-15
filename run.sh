#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v uv >/dev/null 2>&1; then
    echo "[redactpii] No se encontró 'uv'. Instálalo desde https://docs.astral.sh/uv/"
    echo "            o ejecuta: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

exec uv run python launcher.py "$@"
