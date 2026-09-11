# ANPR Engine — Python FastAPI Service

Stateless inference service: receives image/video uploads from the React client,
detects licence plates with YOLOv8, reads text with fast-plate-ocr, and forwards
structured detection events to the Java backend.  
Runs on **port 8000**.

---

## Prerequisites

- Python 3.11 or 3.12
- CUDA 12+ and a compatible GPU (optional — CPU fallback is automatic)
- YOLOv8 model weights file at `weights/plate_detector.pt`

---

## One-time Setup

### 1. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\Activate.ps1    # Windows PowerShell
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> GPU users: make sure `onnxruntime-gpu` resolves to a build matching your CUDA version.  
> CPU-only users: replace `onnxruntime-gpu` with `onnxruntime` in `requirements.txt`.

### 3. Place model weights

Copy or symlink your trained YOLOv8 weights to:

```
anpr-engine/weights/plate_detector.pt
```

The OCR model (`global-plates-mobile-vit-v2-model`) is downloaded automatically
by `fast-plate-ocr` on first inference.

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — at minimum set `SERVICE_API_KEY` to match `anpr.internal-api-key`
in `backend/src/main/resources/application.yaml`.

---

## Running

```bash
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

For production (no reload):

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
```

> Use `--workers 1` — the in-memory job manager is not multi-process safe.

---

## Verify

- Health check: http://localhost:8000/health
- Model info:   http://localhost:8000/model-info
- Swagger UI:   http://localhost:8000/docs

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe |
| `GET` | `/model-info` | Detection and OCR model versions |
| `POST` | `/infer/image` | Infer a single image (multipart: `file`, `mediaId`, `cameraId?`) |
| `POST` | `/infer/video` | Infer a video asynchronously (returns `jobId`) |
| `GET` | `/infer/jobs/{jobId}/status` | Poll async video job status |
| `POST` | `/infer/frame` | Infer a single base64-encoded frame (stream ingestion) |
| `GET` | `/media/crops/{filename}` | Serve saved plate crop images |

All inference endpoints require `X-API-Key: <SERVICE_API_KEY>` header
(when `SERVICE_API_KEY` is non-empty in `.env`).

---

## Environment Variables

See [`.env.example`](.env.example) for all variables with descriptions.

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVICE_API_KEY` | `local-dev-internal-key-change-me` | Key clients must send as `X-API-Key`; must match Java's `anpr.internal-api-key` |
| `JAVA_BASE_URL` | `http://localhost:8080` | Java backend base URL |
| `DEVICE` | `cuda` | `cuda` or `cpu` |
| `DETECTION_CONF_THRESHOLD` | `0.4` | YOLOv8 confidence threshold |
| `FRAME_SKIP` | `2` | Process every Nth frame for video inference |
