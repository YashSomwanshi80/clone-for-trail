# Kafka — Local Broker (KRaft mode)

Apache Kafka 4 running in KRaft mode (no ZooKeeper).  
This directory **is** the Kafka installation — binaries in `bin/`, config in `config/`.  
Broker listens on **port 9092**.

---

## Prerequisites

- Java 25 JDK (Kafka 4 requires Java 11+ but this project standardises on 25)
- The `kafka/` directory must contain the broker binaries.  
  If it is missing, download Apache Kafka 4.x from https://kafka.apache.org/downloads  
  and extract it, renaming the folder to `kafka/` at the project root.

---

## One-time Setup — Format KRaft Storage

Run this **once** before the very first boot.

```bash
# Linux / macOS
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"
bin/kafka-storage.sh format \
  --config config/server.properties \
  --cluster-id "$KAFKA_CLUSTER_ID"
```

```powershell
# Windows PowerShell
$id = .\bin\windows\kafka-storage.bat random-uuid
.\bin\windows\kafka-storage.bat format `
  --config config\server.properties `
  --cluster-id $id
```

> Running this on an already-formatted store will fail — that is expected and harmless.

---

## Starting the Broker

```bash
# Linux / macOS
bash start.sh

# Windows PowerShell
.\start.ps1
```

Or directly:

```bash
bin/kafka-server-start.sh config/server.properties
```

The Spring Boot backend auto-creates all required topics on startup via `KafkaConfig.java`.

---

## Listening to Topics

### All three topics at once (colour-labelled)

```bash
# Linux / macOS — all topics in one terminal, prefixed with [DET] / [ALT] / [ANL]
bash listen.sh

# Windows PowerShell — opens a separate window per topic
.\listen.ps1
```

### A specific topic

```bash
bash listen.sh detections     # anpr.detection.events
bash listen.sh alerts         # anpr.alerts
bash listen.sh analytics      # anpr.analytics.aggregates

# Or use the full topic name:
bash listen.sh anpr.detection.events
```

```powershell
.\listen.ps1 detections
.\listen.ps1 alerts
.\listen.ps1 analytics
```

---

## Topics

| Topic | Created by | Consumed by | Description |
|-------|-----------|-------------|-------------|
| `anpr.detection.events` | Java backend (`KafkaConfig`) | `AlertConsumer`, `AnalyticsAggregationConsumer`, `TrajectoryService` | One event per plate detection from Python |
| `anpr.alerts` | `AlertConsumer` | `AlertRelayConsumer` → WebSocket `/ws/alerts` | Blacklist-hit alert notifications |
| `anpr.analytics.aggregates` | `AnalyticsAggregationConsumer` | `AnalyticsRelayConsumer` → WebSocket `/ws/analytics/live` | Rolling analytics snapshots |

---

## Verify

```bash
# List all topics
bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# Show topic details
bin/kafka-topics.sh --describe \
  --topic anpr.detection.events \
  --bootstrap-server localhost:9092

# Tail raw JSON from detections topic
bin/kafka-console-consumer.sh \
  --topic anpr.detection.events \
  --bootstrap-server localhost:9092 \
  --from-beginning \
  --property print.timestamp=true
```

---

## Config Notes

- Log data stored in `/tmp/kraft-combined-logs` by default — change `log.dirs` in `config/server.properties` for persistence across reboots.
- Single-node dev setup: `num.partitions=1`, `replication.factor=1`.
