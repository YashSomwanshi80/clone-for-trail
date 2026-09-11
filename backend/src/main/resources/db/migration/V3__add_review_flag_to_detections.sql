ALTER TABLE detections ADD COLUMN needs_review BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE detections ADD COLUMN reviewed_at TIMESTAMPTZ;
ALTER TABLE detections ADD COLUMN reviewed_by VARCHAR(128);
CREATE INDEX idx_detections_needs_review ON detections(needs_review) WHERE needs_review = TRUE;
