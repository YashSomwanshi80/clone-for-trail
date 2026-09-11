#!/usr/bin/env bash
# NeuraTransit — Start the full stack
# Launches: Kafka → Java backend → ANPR engine → React client
# Each service opens in a new terminal tab/window.
# Run from the project root: bash start-all.sh

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- preflight checks -------------------------------------------------------
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        NeuraTransit — Starting Full Stack        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

missing=0

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "  ✗ $1 not found — $2"
    missing=$((missing + 1))
  else
    echo "  ✓ $1 found"
  fi
}

echo "Checking prerequisites..."
check_cmd java    "install JDK 25+"
check_cmd python3 "install Python 3.11+"
check_cmd node    "install Node.js 22+"
check_cmd npm     "install npm 10+"

if [ $missing -gt 0 ]; then
  echo ""
  echo "ERROR: $missing prerequisite(s) missing. Install them and try again."
  exit 1
fi

# Check config files
if [ ! -f "$ROOT/backend/src/main/resources/application.yaml" ]; then
  echo ""
  echo "ERROR: backend/src/main/resources/application.yaml not found."
  echo "  Run: cp backend/src/main/resources/application.yaml.example backend/src/main/resources/application.yaml"
  echo "  Then set your DB credentials and secrets."
  exit 1
fi

if [ ! -f "$ROOT/anpr-engine/.env" ]; then
  echo ""
  echo "ERROR: anpr-engine/.env not found."
  echo "  Run: cp anpr-engine/.env.example anpr-engine/.env"
  exit 1
fi

echo ""
echo "All checks passed. Launching services..."

echo "Cleaning up any old zombie processes..."
fuser -k 9092/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true
echo "Cleanup done."
echo ""

# ---- helper: open a new terminal window/tab ---------------------------------
open_terminal() {
  local title="$1"
  local cmd="$2"

  if command -v gnome-terminal &>/dev/null; then
    gnome-terminal --title="$title" -- bash -c "$cmd; exec bash" &
  elif command -v xterm &>/dev/null; then
    xterm -title "$title" -e bash -c "$cmd; exec bash" &
  elif command -v konsole &>/dev/null; then
    konsole --new-tab -p tabtitle="$title" -e bash -c "$cmd; exec bash" &
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell application \"Terminal\" to do script \"$cmd\""
  else
    # Fallback: run in background and log to file
    echo "  (No GUI terminal detected — running $title in background, logging to /tmp/neuratransit-${title// /-}.log)"
    nohup bash -c "$cmd" > "/tmp/neuratransit-${title// /-}.log" 2>&1 & disown
  fi
}

# ---- 1. Kafka ---------------------------------------------------------------
echo "[1/4] Starting Kafka..."
open_terminal "NT — Kafka" "cd '$ROOT' && bash kafka/start.sh"
echo "      Waiting 8 seconds for Kafka to be ready..."
sleep 8

# ---- 2. Java backend --------------------------------------------------------
echo "[2/4] Starting Java backend..."
open_terminal "NT — Backend" "cd '$ROOT' && bash backend/start.sh"
echo "      Waiting 20 seconds for Spring Boot to start..."
sleep 20

# ---- 3. ANPR engine ---------------------------------------------------------
echo "[3/4] Starting ANPR engine..."
open_terminal "NT — ANPR Engine" "cd '$ROOT' && bash anpr-engine/start.sh"
echo "      Waiting 5 seconds for FastAPI to start..."
sleep 5

# ---- 4. React client --------------------------------------------------------
echo "[4/4] Starting React client..."
open_terminal "NT — Client" "cd '$ROOT' && bash client/start.sh"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║              All services launched               ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Kafka broker   →  localhost:9092                ║"
echo "║  Java backend   →  http://localhost:8080         ║"
echo "║  ANPR engine    →  http://localhost:8000         ║"
echo "║  React client   →  http://localhost:5173         ║"
echo "║                                                  ║"
echo "║  Swagger UI     →  http://localhost:8080/        ║"
echo "║                     swagger-ui/index.html        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
