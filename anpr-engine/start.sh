#!/usr/bin/env bash
# NeuraTransit — Start Python ANPR inference engine
# Run from project root:    bash anpr-engine/start.sh
# Or from inside anpr-engine/: bash start.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- Check .env ---
if [ ! -f ".env" ]; then
  echo ""
  echo "ERROR: .env not found."
  echo "  Copy the example first:  cp .env.example .env"
  echo "  Then set SERVICE_API_KEY to match anpr.internal-api-key in backend/src/main/resources/application.yaml."
  echo ""
  exit 1
fi

# --- Check model weights ---
if [ ! -f "weights/plate_detector.pt" ]; then
  echo ""
  echo "WARNING: weights/plate_detector.pt not found."
  echo "  The service will fail on first inference request."
  echo "  Place your trained YOLOv8 weights at: anpr-engine/weights/plate_detector.pt"
  echo ""
fi

# --- Activate virtualenv if present ---
if [ -f "venv/bin/activate" ]; then
  echo "==> Activating virtual environment..."
  # shellcheck disable=SC1091
  source venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
  source .venv/bin/activate
else
  echo "WARNING: No venv found. Using system Python. Run 'python3 -m venv venv && pip install -r requirements.txt' first."
fi

echo "==> Starting ANPR engine on port 8000..."
echo "    Press Ctrl+C to stop."
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
