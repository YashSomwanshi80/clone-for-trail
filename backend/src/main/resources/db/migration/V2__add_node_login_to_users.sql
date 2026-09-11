ALTER TABLE users ADD COLUMN camera_id VARCHAR(64) REFERENCES cameras(camera_id);
CREATE INDEX idx_users_camera_id ON users(camera_id);
