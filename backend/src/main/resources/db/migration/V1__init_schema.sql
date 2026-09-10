CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE roles (
    name        VARCHAR(32) PRIMARY KEY,
    description TEXT
);

CREATE TABLE users (
    user_id       VARCHAR(36) PRIMARY KEY,
    username      VARCHAR(128) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
    user_id   VARCHAR(36) NOT NULL REFERENCES users(user_id),
    role_name VARCHAR(32) NOT NULL REFERENCES roles(name),
    PRIMARY KEY (user_id, role_name)
);

CREATE TABLE cameras (
    camera_id     VARCHAR(64) PRIMARY KEY,
    city_id       VARCHAR(64) NOT NULL,
    state_id      VARCHAR(64) NOT NULL,
    geo           GEOMETRY(Point, 4326),
    orientation   VARCHAR(32),
    lane_metadata TEXT,
    status        VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE camera_segments (
    id                   BIGSERIAL PRIMARY KEY,
    from_camera_id       VARCHAR(64) NOT NULL REFERENCES cameras(camera_id),
    to_camera_id         VARCHAR(64) NOT NULL REFERENCES cameras(camera_id),
    road_distance_meters DOUBLE PRECISION NOT NULL
);

CREATE TABLE media (
    media_id     VARCHAR(36) PRIMARY KEY,
    city_id      VARCHAR(64) NOT NULL,
    source_type  VARCHAR(16) NOT NULL,
    camera_id    VARCHAR(64) REFERENCES cameras(camera_id),
    media_type   VARCHAR(16) NOT NULL,
    captured_at  TIMESTAMPTZ NOT NULL,
    status       VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE detections (
    detection_id       BIGSERIAL PRIMARY KEY,
    media_id           VARCHAR(36) NOT NULL REFERENCES media(media_id),
    city_id            VARCHAR(64) NOT NULL,
    camera_id          VARCHAR(64) REFERENCES cameras(camera_id),
    plate_number       VARCHAR(32) NOT NULL,
    confidence         DOUBLE PRECISION NOT NULL,
    geo                GEOMETRY(Point, 4326),
    direction          VARCHAR(8),
    timestamp          TIMESTAMPTZ NOT NULL,
    cropped_image_path TEXT,
    ocr_engine_version VARCHAR(32),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_detections_plate_timestamp ON detections(plate_number, timestamp);
CREATE INDEX idx_detections_city ON detections(city_id);

CREATE TABLE blacklist (
    plate_number VARCHAR(32) PRIMARY KEY,
    city_id      VARCHAR(64),
    reason       TEXT NOT NULL,
    added_by     VARCHAR(64) NOT NULL,
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
    alert_id     BIGSERIAL PRIMARY KEY,
    city_id      VARCHAR(64) NOT NULL,
    detection_id BIGINT NOT NULL REFERENCES detections(detection_id),
    plate_number VARCHAR(32) NOT NULL,
    type         VARCHAR(32) NOT NULL,
    status       VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    reason       TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
    id           BIGSERIAL PRIMARY KEY,
    actor        VARCHAR(128) NOT NULL,
    action       VARCHAR(64) NOT NULL,
    target_plate VARCHAR(32),
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT now()
);
