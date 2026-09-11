#!/usr/bin/env bash
# NeuraTransit — Start Java backend (Spring Boot)
# Run from project root:  bash backend/start.sh
# Or from inside backend/: bash start.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CONFIG="src/main/resources/application.yaml"
if [ ! -f "$CONFIG" ]; then
  echo ""
  echo "ERROR: $CONFIG not found."
  echo "  Copy the example first:  cp src/main/resources/application.yaml.example src/main/resources/application.yaml"
  echo "  Then edit it with your DB credentials and secrets."
  echo ""
  exit 1
fi


echo "==> Cleaning up any zombie processes on port 8080..."
fuser -k 8080/tcp 2>/dev/null || true

echo "==> Starting Java backend on port 8080..."
echo "    (Building first — this may take a minute on a cold cache)"
echo ""

./mvnw spring-boot:run
