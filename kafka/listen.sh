#!/usr/bin/env bash
# NeuraTransit — Kafka topic listener
#
# Usage:
#   bash kafka/listen.sh                  → tail all three topics (colour-labelled)
#   bash kafka/listen.sh detections       → anpr.detection.events only
#   bash kafka/listen.sh alerts           → anpr.alerts only
#   bash kafka/listen.sh analytics        → anpr.analytics.aggregates only
#   bash kafka/listen.sh <full-topic>     → any explicit topic name
#
# Run from project root OR from inside kafka/

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BROKER="localhost:9092"

# ANSI colours
RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[0;33m'
CYN='\033[0;36m'
RST='\033[0m'

TOPIC_DETECTIONS="anpr.detection.events"
TOPIC_ALERTS="anpr.alerts"
TOPIC_ANALYTICS="anpr.analytics.aggregates"

# ---- resolve topic from short alias or full name ----------------------------
resolve_topic() {
  case "$1" in
    detections|detection|detect) echo "$TOPIC_DETECTIONS" ;;
    alerts|alert)                echo "$TOPIC_ALERTS" ;;
    analytics|analytic)          echo "$TOPIC_ANALYTICS" ;;
    *)                           echo "$1" ;;   # treat as a literal topic name
  esac
}

# ---- tail a single topic, prefix each line with a label --------------------
tail_topic() {
  local topic="$1"
  local colour="$2"
  local label="$3"
  bin/kafka-console-consumer.sh \
    --bootstrap-server "$BROKER" \
    --topic "$topic" \
    --from-beginning \
    --property print.timestamp=true \
    2>/dev/null \
  | while IFS= read -r line; do
      echo -e "${colour}[${label}]${RST} ${line}"
    done
}

# ---- main -------------------------------------------------------------------
ARG="${1:-}"

if [ -z "$ARG" ]; then
  # No argument — tail all three topics simultaneously
  echo -e "${CYN}Listening to all three NeuraTransit Kafka topics${RST}"
  echo -e "  ${GRN}[DET]${RST} anpr.detection.events"
  echo -e "  ${RED}[ALT]${RST} anpr.alerts"
  echo -e "  ${YLW}[ANL]${RST} anpr.analytics.aggregates"
  echo ""
  echo "Press Ctrl+C to stop."
  echo ""

  # Launch each consumer in the background, funnel output here
  tail_topic "$TOPIC_DETECTIONS" "$GRN" "DET" &
  PID_DET=$!
  tail_topic "$TOPIC_ALERTS"     "$RED" "ALT" &
  PID_ALT=$!
  tail_topic "$TOPIC_ANALYTICS"  "$YLW" "ANL" &
  PID_ANL=$!

  # On Ctrl+C kill all three background consumers cleanly
  trap "kill $PID_DET $PID_ALT $PID_ANL 2>/dev/null; exit 0" INT TERM

  wait
else
  # Specific topic requested
  TOPIC="$(resolve_topic "$ARG")"
  echo -e "${CYN}Listening to topic: ${TOPIC}${RST}"
  echo "Press Ctrl+C to stop."
  echo ""
  bin/kafka-console-consumer.sh \
    --bootstrap-server "$BROKER" \
    --topic "$TOPIC" \
    --from-beginning \
    --property print.timestamp=true
fi
