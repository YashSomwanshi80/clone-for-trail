# Backend — Java Spring Boot API

Spring Boot 4 REST API, WebSocket relay, Kafka producer/consumer.  
Runs on **port 8080**.

---

## Prerequisites

- Java 25 JDK
- Maven 3.9+ (or use the included `./mvnw`)
- PostgreSQL 16+ running locally
- Redis 7+ running locally
- Kafka running on `localhost:9092` (start `kafka/` first)

---

## One-time Setup

### 1. Create the PostgreSQL database and user

```bash
psql -U postgres
```

```sql
CREATE USER neura_user WITH PASSWORD 'SIH2026';
CREATE DATABASE neuratransit OWNER neura_user;
\q
```

### 2. Enable the PostGIS extension (required for spatial queries)

```bash
psql -U neura_user -d neuratransit
```

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

### 3. Copy and configure the application config

```bash
cp src/main/resources/application.yaml.example src/main/resources/application.yaml
```

Edit `application.yaml` and set at minimum:
- `anpr.jwt-secret` — any random string ≥ 32 characters
- `anpr.internal-api-key` — must match `SERVICE_API_KEY` in `anpr-engine/.env`
- PostgreSQL credentials if different from defaults

### 4. Install dependencies and compile

```bash
./mvnw clean package -DskipTests
```

Flyway will run all DB migrations automatically on first startup.

---

## Running

```bash
./mvnw spring-boot:run
```

Or run the packaged jar:

```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

---

## Verify

- API root: http://localhost:8080/
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- Health: http://localhost:8080/actuator/health

---

## Default Dev Login

```
username: admin
password: admin123
```

Seeded automatically on first startup by `DataSeeder.java`.

---

## Environment / Config

All configuration is in `src/main/resources/application.yaml`.  
See `application.yaml.example` for a documented template.

Key values:

| Key | Default | Description |
|-----|---------|-------------|
| `server.port` | `8080` | HTTP port |
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/neuratransit` | DB URL |
| `spring.datasource.username` | `neura_user` | DB user |
| `spring.datasource.password` | `SIH2026` | DB password |
| `spring.data.redis.host` | `localhost` | Redis host |
| `spring.data.redis.port` | `6379` | Redis port |
| `spring.kafka.bootstrap-servers` | `localhost:9092` | Kafka broker |
| `anpr.internal-api-key` | `local-dev-internal-key-change-me` | Shared secret for Python→Java calls |
| `anpr.jwt-secret` | _(change this)_ | JWT signing secret, ≥ 32 bytes |
| `anpr.jwt-expiration-ms` | `3600000` | Access token TTL (1 hour) |

---

## Kafka Topics Created on Startup

| Topic | Purpose |
|-------|---------|
| `anpr.detection.events` | Detection events from ingestion → downstream consumers |
| `anpr.alerts` | Blacklist-hit alerts → WebSocket relay |
| `anpr.analytics.aggregates` | Aggregated analytics → WebSocket relay |
