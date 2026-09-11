#!/usr/bin/env bash
# NeuraTransit — Start Kafka broker (KRaft mode)
# Run from the project root:  bash kafka/start.sh
# Or from inside kafka/:      bash start.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CONFIG="config/kraft/server.properties"
if [ ! -f "$CONFIG" ]; then
  # Fall back to the flat config if kraft/ subdirectory doesn't exist
  CONFIG="config/server.properties"
fi

echo "==> Starting Kafka broker (KRaft) — config: $CONFIG"
echo "    Press Ctrl+C to stop."
echo ""

bin/kafka-server-start.sh "$CONFIG"
