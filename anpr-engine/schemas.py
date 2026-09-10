from typing import Optional, Literal
from pydantic import BaseModel


class GeoPoint(BaseModel):
    lat: float
    lng: float


class DetectionResult(BaseModel):
    """Matches Section 5 of the SRS exactly — this exact shape is returned
    synchronously and is what gets POSTed to Java."""
    mediaId: str
    cameraId: Optional[str] = None
    plateNumber: str
    confidence: float
    bbox: list[int]  # [x, y, w, h]
    direction: Optional[Literal["N", "S", "E", "W", "NE", "NW", "SE", "SW"]] = None
    geo: Optional[GeoPoint] = None
    timestamp: str
    croppedPlateImagePath: Optional[str] = None
    ocrEngineVersion: str


class JobStatus(BaseModel):
    status: Literal["PROCESSING", "DONE", "FAILED"]
    detectionsCount: int = 0


class ModelInfo(BaseModel):
    detectionModelVersion: str
    ocrModelVersion: str


class FrameRequest(BaseModel):
    cameraId: str
    timestamp: str
    frameBytes: str  # base64-encoded, used by the Stream Ingestion Layer