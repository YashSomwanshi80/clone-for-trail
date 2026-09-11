#!/usr/bin/env bash
# NeuraTransit — Start React client (Vite dev server)
# Run from project root:  bash client/start.sh
# Or from inside client/: bash start.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ".env" ]; then
  echo ""
  echo "WARNING: .env not found — using defaults from .env.example."
  echo "  Copy it first:  cp .env.example .env"
  echo "  To connect to real backends set VITE_USE_MOCKS=false."
  echo ""
fi

if [ ! -d "node_modules" ]; then
  echo "==> node_modules not found — running npm install..."
  npm install
fi

echo "==> Starting React dev server on http://localhost:5173"
echo "    Press Ctrl+C to stop."
echo ""

npm run dev
