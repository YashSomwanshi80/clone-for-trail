from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # -- Model paths --
    yolo_weights_path: str = "weights/plate_detector.pt"
    ocr_model_name: str = "global-plates-mobile-vit-v2-model"

    # -- Inference --
    device: str = "cuda"            # "cuda" or "cpu" — falls back automatically if no GPU
    detection_conf_threshold: float = 0.4
    frame_skip: int = 2             # process every Nth frame for /infer/video

    # -- Local crop storage (Section 4 of SRS) --
    crop_dir: str = "data/plate-crops"
    save_crops: bool = True

    # -- Java backend (Section 7 of SRS) --
    java_base_url: str = "http://localhost:8080"
    java_detections_endpoint: str = "/api/internal/v1/detections"
    java_detections_batch_endpoint: str = "/api/internal/v1/detections/batch"
    # NOTE: there is no /api/internal/v1/cameras endpoint in Java.
    # Camera data lives at /api/v1/cameras (JWT-authenticated, not internal-key).
    outbound_retry_attempts: int = 3
    outbound_timeout_seconds: float = 5.0

    # -- Security (shared API key, Section 3 of SRS) --
    # Must match anpr.internal-api-key in backend/src/main/resources/application.yaml.
    # The .env file overrides this for prod; the default matches the dev application.yaml value.
    service_api_key: str = "local-dev-internal-key-change-me"

    # -- Misc / audit info (Section 3, GET /model-info) --
    ocr_engine_version: str = "fast-plate-ocr-1.1.0"
    detection_model_version: str = "yolov8-plate-v1"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()