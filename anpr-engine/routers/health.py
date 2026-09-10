from fastapi import APIRouter

from config import settings
from schemas import ModelInfo

router = APIRouter(tags=["system"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/model-info", response_model=ModelInfo)
def model_info():
    return ModelInfo(
        detectionModelVersion=settings.detection_model_version,
        ocrModelVersion=settings.ocr_engine_version,
    )