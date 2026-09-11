# NeuraTransit — SIH 2026

> **Intelligent Urban Traffic Management System** — real-time ANPR, trajectory analysis, congestion analytics, and blacklist enforcement across a city camera network.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                       Browser / Operator UI                      │
│                  React 19 + Vite  (port 5173)                    │
└───────────────────┬──────────────────────────┬───────────────────┘
                    │ REST + WebSocket          │ multipart upload
                    ▼                           ▼
┌───────────────────────────────┐  ┌────────────────────────────┐
│       Java Backend            │  │   Python ANPR Engine       │
│  Spring Boot 4  (port 8080)   │  │   FastAPI + YOLOv8 + OCR   │
│                               │  │         (port 8000)        │
│  • Auth  (JWT + CSRF)         │  │                            │
│  • Media registration         │  │  • Plate detection         │
│  • Detection ingestion        │◄─┤  • OCR                     │
│  • Trajectory / alerts        │  │  • Crop storage            │
│  • Analytics aggregation      │  └────────────────────────────┘
│  • WebSocket relay            │
└──────────┬────────────────────┘
           │ Kafka  (port 9092)
           ▼
┌──────────────────────────────────────────────────────┐
│   anpr.detection.events  │  anpr.alerts              │
│   anpr.analytics.aggregates                          │
└──────────────────────────────────────────────────────┘
           │
  ┌────────┴────────┐
  ▼                 ▼
PostgreSQL        Redis
(port 5432)     (port 6379)
neuratransit DB  token blacklist
```

---

## Services

| Directory | Role | Port | Stack |
|-----------|------|------|-------|
| [`backend/`](./backend/README.md) | REST API, auth, Kafka producer/consumer, WebSocket relay | 8080 | Spring Boot 4, Java 25, PostgreSQL, Redis, Kafka |
| [`anpr-engine/`](./anpr-engine/README.md) | ANPR inference — plate detection + OCR, posts results to Java | 8000 | FastAPI, YOLOv8, fast-plate-ocr, OpenCV |
| [`client/`](./client/README.md) | Operator dashboard — live feeds, trajectory, analytics, upload portal | 5173 | React 19, Vite 8, TypeScript 6, Tailwind CSS 4 |
| [`kafka/`](./kafka/README.md) | Local Kafka broker (KRaft mode, no ZooKeeper) | 9092 | Apache Kafka 4 |

---

## Prerequisites

Install these once before using any of the start scripts:

| Tool | Min version | Check |
|------|------------|-------|
| Java (JDK) | 25 | `java -version` |
| Maven | 3.9 | `mvn -version` (or use `./mvnw`) |
| Python | 3.11 | `python3 --version` |
| Node.js | 22 | `node --version` |
| PostgreSQL | 16 | must be running |
| Redis | 7 | must be running |
| CUDA toolkit | 12 | optional — CPU fallback is automatic |

---

## Quick Start (full stack)

> Complete the one-time setup in each module's README before running these.

```bash
# Linux / macOS
bash start-all.sh

# Windows — run PowerShell as Administrator
.\start-all.ps1
```

Scripts start services in dependency order:
**Kafka → Java backend → ANPR engine → React client**

---

## Default Local Dev Credentials

> ⚠️ Change every one of these before deploying.

| What | Value |
|------|-------|
| PostgreSQL user / password | `neura_user` / `SIH2026` |
| PostgreSQL database | `neuratransit` |
| App admin login | `admin` / `admin123` |
| Internal API key (Python→Java) | `local-dev-internal-key-change-me` |
| JWT secret | see `backend/application.yaml.example` |
