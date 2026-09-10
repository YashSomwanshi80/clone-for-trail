import base64
import time
from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import APIKeyHeader

from config import settings
from schemas import DetectionResult, FrameRequest, JobStatus
from services.detection_service import PlateDetector
from services.ocr_service import PlateOCR
from services.job_manager import job_manager
from services.storage_service import save_crop
from services.java_client import send_detection, send_detections_batch
from utils.preprocessing import preprocess_crop

router = APIRouter(prefix="/infer", tags=["inference"])

# Loaded once at import time so model weights stay resident in memory/VRAM
# instead of being reloaded on every request.
detector = PlateDetector()
ocr = PlateOCR()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def verify_api_key(key: str = Depends(api_key_header)):
    if settings.service_api_key and key != settings.service_api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return key


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _run_pipeline_on_frame(
    frame: np.ndarray, media_id: str, camera_id: str | None, timestamp: str
) -> list[DetectionResult]:
    """Shared by /image, /video and /frame — detect, crop, preprocess, OCR,
    save crop, and build the Section 5 result contract for each plate found."""
    results: list[DetectionResult] = []
    detections = detector.detect(frame)

    for det in detections:
        x1, y1, x2, y2 = det["bbox_xyxy"]
        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            continue

        crop = preprocess_crop(crop)
        plate_text, ocr_conf = ocr.read_plate(crop)
        crop_path = await save_crop(crop, media_id, timestamp)

        results.append(
            DetectionResult(
                mediaId=media_id,
                cameraId=camera_id,
                plateNumber=plate_text,
                confidence=round(min(det["conf"], ocr_conf), 4),
                bbox=det["bbox_xywh"],
                direction=None,  # TODO: populate from camera registry lookup (Section 6.6)
                geo=None,        # TODO: populate from camera registry lookup (Section 6.6)
                timestamp=timestamp,
                croppedPlateImagePath=crop_path,
                ocrEngineVersion=settings.ocr_engine_version,
            )
        )
    return results


@router.post("/image", dependencies=[Depends(verify_api_key)])
async def infer_image(
    file: UploadFile = File(...),
    mediaId: str = Form(...),
    cameraId: str | None = Form(None),
):
    contents = await file.read()
    npimg = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    timestamp = _now_iso()
    detections = await _run_pipeline_on_frame(frame, mediaId, cameraId, timestamp)

    for d in detections:
        await send_detection(d)

    return {"detections": [d.model_dump() for d in detections]}


async def _process_video_job(job_id: str, video_path: str, media_id: str, camera_id: str | None):
    cap = cv2.VideoCapture(video_path)
    frame_idx = 0
    batch: list[DetectionResult] = []

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % settings.frame_skip == 0:
                timestamp = _now_iso()
                detections = await _run_pipeline_on_frame(frame, media_id, camera_id, timestamp)

                if detections:
                    batch.extend(detections)
                    await job_manager.increment_detections(job_id, len(detections))

                if len(batch) >= 10:
                    await send_detections_batch(batch)
                    batch = []

            frame_idx += 1

        if batch:
            await send_detections_batch(batch)

        await job_manager.update(job_id, status="DONE")
    except Exception as exc:
        print(f"[infer_video] job {job_id} failed: {exc}")
        await job_manager.update(job_id, status="FAILED")
    finally:
        cap.release()


@router.post("/video", status_code=202, dependencies=[Depends(verify_api_key)])
async def infer_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    mediaId: str = Form(...),
    cameraId: str | None = Form(None),
):
    contents = await file.read()
    temp_path = f"data/tmp_{mediaId}.mp4"
    with open(temp_path, "wb") as f:
        f.write(contents)

    job_id = job_manager.create_job()
    background_tasks.add_task(_process_video_job, job_id, temp_path, mediaId, cameraId)

    return {"jobId": job_id}


@router.post("/frame", dependencies=[Depends(verify_api_key)])
async def infer_frame(payload: FrameRequest):
    frame_bytes = base64.b64decode(payload.frameBytes)
    npimg = np.frombuffer(frame_bytes, np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode frame")

    media_id = f"{payload.cameraId}_{int(time.time() * 1000)}"
    detections = await _run_pipeline_on_frame(frame, media_id, payload.cameraId, payload.timestamp)

    for d in detections:
        await send_detection(d)

    return {"detections": [d.model_dump() for d in detections]}


@router.get("/jobs/{job_id}/status", response_model=JobStatus)
async def get_job_status(job_id: str):
    status = job_manager.get(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return status