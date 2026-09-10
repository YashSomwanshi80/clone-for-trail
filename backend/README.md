# ANPR Platform — Java Backend

City-Wide ANPR Trajectory Tracking and Urban Traffic Analytics — Spring Boot backend.

No Docker/containerization is used for local development — every service (PostgreSQL, Redis, Kafka) is installed and run natively on the machine.

---

## Stack

- Java 25, Spring Boot 4.1.1
- PostgreSQL 18 + PostGIS
- Redis
- Apache Kafka (KRaft mode, single broker, no Zookeeper)
- Flyway (schema migrations)
- Spring Security (JWT + CSRF)

---

## Every Time (once everything below is set up once)

Three things must be running **before** you start the app: PostgreSQL, Redis, and Kafka.

```bash
# 1. Confirm/start PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql   # if not running

# 2. Confirm/start Redis
redis-cli ping                    # should return PONG
sudo systemctl start redis-server # if not running

# 3. Start Kafka (in its own terminal — this runs in the foreground, leave it open)
cd <path-to-kafka-install>
bin/kafka-server-start.sh config/server.properties

# 4. Start the Spring Boot app (in a separate terminal)
```

### Linux/macOS/other UNIX-like OS
```bash
./mvnw spring-boot:run
```

### Windows
```powershell
.\mvnw.cmd spring-boot:run
```

On startup, watch the console for:
- Flyway migration logs (`Migrating schema "public" to version "1 - init schema"`)
- A one-time banner printing default admin credentials (see [First Login](#first-login) below) — only appears the very first time, when no users exist yet
- Kafka connection activity (topic creation, consumer group registration)

---

## First-Time Setup

### 1. PostgreSQL + PostGIS

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis postgresql-16-postgis-3
```
*(Check your installed Postgres version with `psql --version` first and match the package suffix — e.g. `postgresql-18-postgis-3` if you're on Postgres 18.)*

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql   # confirm it's running
```

**Create the database** — connect directly to the target database with `-d` (not `\c` after connecting elsewhere, which is an easy way to accidentally run the next commands against the wrong database):

```bash
sudo -u postgres psql -d postgres
```
```sql
CREATE DATABASE neuratransit;
CREATE USER neura_user WITH PASSWORD 'SIH2026';
GRANT ALL PRIVILEGES ON DATABASE neuratransit TO neura_user;
\q
```

Then reconnect **directly to `neuratransit`** for the PostGIS/schema setup — this step is critical, since running it while connected to any other database silently does nothing useful:
```bash
sudo -u postgres psql -d neuratransit
```
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL ON SCHEMA public TO neura_user;
\q
```

**Verify:**
```bash
psql -h localhost -U neura_user -d neuratransit -c "SELECT PostGIS_Version();"
```
Should return a PostGIS version string, not an error.

### 2. Redis

```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
redis-cli ping   # should return PONG
```

### 3. Kafka (binary install, KRaft mode — no Zookeeper)

Download the **binary** release (not source) from [kafka.apache.org/downloads](https://kafka.apache.org/downloads) — Scala 2.13 build. Extract it **outside** this project directory (do not put it inside `backend/`, since it's a separate running service, not part of the codebase — e.g. as a sibling folder):

```bash
mkdir -p ~/tools && cd ~/tools
tar -xzf kafka_2.13-<version>.tgz
cd kafka_2.13-<version>
```

**Note:** Kafka 4.x removed the old `config/kraft/server.properties` path — config files now live flat under `config/`. Use `config/server.properties` directly.

**Format storage (one-time only):**
```bash
bin/kafka-storage.sh random-uuid
# copy the printed UUID, then:
bin/kafka-storage.sh format -t <uuid-from-above> -c config/server.properties --standalone
```
`--standalone` is required for a single-node local setup (Kafka 4.x requires explicitly declaring the controller quorum topology).

**Start the broker:**
```bash
bin/kafka-server-start.sh config/server.properties
```
This runs in the foreground — leave the terminal open. Use a separate terminal for everything else.

**Verify:**
```bash
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```
Should return an empty list with no error (not yet any topics — those get auto-created by the Spring Boot app on its first startup).

### 4. Build the app

```bash
mvn clean install
```

### 5. Run it

See [Every Time](#every-time-once-everything-below-is-set-up-once) above.

---

## Configuration

Key settings live in `src/main/resources/application.yml`:

| Property | Purpose |
|---|---|
| `spring.datasource.*` | Postgres connection (`neuratransit` / `neura_user`) |
| `spring.jpa.hibernate.ddl-auto: validate` | Schema is managed by Flyway migrations, not Hibernate auto-DDL |
| `spring.jpa.properties.hibernate.dialect` | `org.hibernate.dialect.PostgreSQLDialect` (PostGIS support comes from the `hibernate-spatial` dependency being on the classpath, not from a special dialect class) |
| `spring.kafka.bootstrap-servers` | `localhost:9092` |
| `anpr.internal-api-key` | Shared secret the Python inference service must send on `/api/internal/**` calls |
| `anpr.jwt-secret` | Signing key for user-facing JWTs — **change before this goes near production** |

`pom.xml` pins `<flyway.version>` explicitly, overriding Spring Boot's managed version, to get current PostgreSQL 18 support.

---

## Database Migrations (Flyway)

Schema is version-controlled via SQL files in `src/main/resources/db/migration/`, named `V<n>__description.sql`. Flyway runs these automatically on app startup — never edit a migration file that's already been applied anywhere; write a new one instead.

---

## First Login

A `DataSeeder` (`config/DataSeeder.java`) runs once on first startup — if no users exist yet, it creates the three roles (`TRAFFIC_POLICE`, `CITY_ADMIN`, `AUDITOR`) and one default admin account, printing the credentials to the console:

```
username: admin
password: admin123
```

**Change this before any real deployment.** It only seeds once — deleting all users and restarting will not re-trigger it unless the seeder logic is re-run manually.

---

## Testing the API Manually (curl)

Most endpoints under `/api/v1/**` require a JWT **and** a CSRF token (CSRF is intentionally kept enabled). `/api/internal/**` (used by the Python service) uses a separate API key instead, no JWT/CSRF.

**1. Log in:**
```bash
curl -i -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```
Copy the `accessToken` from the response.

**2. Get a CSRF cookie** (needed for any subsequent `POST`/`PUT`/`DELETE` to `/api/v1/**`):
```bash
curl -c cookies.txt http://localhost:8080/api/v1/cameras -H "Authorization: Bearer <accessToken>"
grep XSRF-TOKEN cookies.txt
```

**3. Make an authenticated request**, passing the JWT, the cookie jar, and the CSRF token together:
```bash
curl -i -X POST http://localhost:8080/api/v1/media \
  -b cookies.txt \
  -H "Authorization: Bearer <accessToken>" \
  -H "X-XSRF-TOKEN: <value-from-step-2>" \
  -H "Content-Type: application/json" \
  -d '{"sourceType":"MANUAL_UPLOAD","cameraId":null,"mediaType":"IMAGE","capturedAt":"2026-09-10T12:00:00Z","cityId":"pilot-city-1"}'
```

**4. Simulate the Python service posting a detection result** (internal API key, no JWT):
```bash
curl -i -X POST http://localhost:8080/api/internal/v1/detections \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Key: local-dev-internal-key-change-me" \
  -d '{"mediaId":"<mediaId-from-step-3>","cameraId":null,"plateNumber":"DL01AB1234","confidence":0.95,"lat":28.6139,"lng":77.2090,"direction":"N","timestamp":"2026-09-10T12:00:00Z","croppedPlateImagePath":null,"ocrEngineVersion":"manual-test"}'
```

**Verify the full pipeline fired:**
```bash
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list   # topics should exist
redis-cli KEYS "*"                                              # density/speed/OD keys from AnalyticsAggregationConsumer
curl http://localhost:8080/api/v1/media/<mediaId> -H "Authorization: Bearer <accessToken>"   # status should be COMPLETED
```

---

## Architecture Notes

- Detection events flow: Python posts to `/api/internal/v1/detections` → saved to Postgres → published to Kafka topic `anpr.detection.events` → consumed independently by `AlertConsumer` (blacklist checks) and `AnalyticsAggregationConsumer` (real-time density/speed/O-D aggregates written to Redis) → both relay live updates to the frontend over WebSocket (`/ws/alerts`, `/ws/analytics/live`).
- Real-time analytics are implemented via a plain Kafka consumer + Redis rolling aggregates, not a Kafka Streams DSL topology — a deliberate simplification for this build stage.
- `city_id` / `state_id` are present on every core table from day one, to support a future multi-city/state rollout without a schema migration — but no multi-region infrastructure (sharding, multi-broker Kafka, cross-city query fan-out) is built yet, per a "forward-compatible, not pre-built" principle.

---

## Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| `permission denied for schema public` (Flyway) | `CREATE EXTENSION` / `GRANT` were run while connected to the wrong database | Reconnect with `psql -d neuratransit` explicitly, re-run both commands |
| `Unsupported Database: PostgreSQL 18.x` (Flyway) | Spring Boot's managed Flyway version predates Postgres 18 support | Override `<flyway.version>` in `pom.xml` to a current release |
| Every Lombok getter/setter "cannot find symbol" | Lombok not registered as an annotation processor (JDK 23+ requires explicit registration) | Add Lombok to `maven-compiler-plugin`'s `annotationProcessorPaths` in `pom.xml` |
| `@WebMvcTest`/`@MockBean` compile errors | Spring Boot 4 moved these APIs (`@MockBean` → `@MockitoBean`, new package for `@WebMvcTest`) | Use `org.springframework.test.context.bean.override.mockito.MockitoBean` and `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest` |
| `No qualifying bean of type 'JwtTokenProvider'` in `@WebMvcTest` | `@WebMvcTest` includes filter beans (`JwtAuthFilter`) in its slice, which need their dependencies mocked too | Add `@MockitoBean private JwtTokenProvider jwtTokenProvider;` to the test class |
| `No qualifying bean of type 'ObjectMapper'` in `@WebMvcTest` | Spring Boot 4 defaults to Jackson 3 (`tools.jackson.databind.json.JsonMapper`), not Jackson 2's `ObjectMapper` | Autowire `tools.jackson.databind.json.JsonMapper` instead |
| `403` on every `/api/v1/**` call despite a valid JWT | Missing/stale CSRF token, or CSRF cookie not being issued eagerly | Force eager CSRF token loading via `CsrfTokenRequestAttributeHandler` in `SecurityConfig`; always fetch a fresh CSRF cookie via a `GET` before any `POST`/`PUT`/`DELETE` |
| `config/kraft/server.properties: No such file` | Kafka 4.x flattened the config directory structure | Use `config/server.properties` directly |
| `controller.quorum.voters is not set` during `kafka-storage.sh format` | Kafka 4.x requires explicit quorum topology | Add `--standalone` for a single-node setup |
