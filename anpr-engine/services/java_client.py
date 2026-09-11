import asyncio
import httpx

from config import settings
from schemas import DetectionResult


def _to_java_payload(detection: DetectionResult) -> dict:
    """
    Maps Python's DetectionResult → Java's DetectionEventRequest record exactly.

    Java record (DetectionEventRequest):
        mediaId            @NotBlank String
        cameraId           String (nullable)
        plateNumber        @NotBlank String
        confidence         @NotNull Double
        lat                @NotNull Double
        lng                @NotNull Double
        direction          String (nullable)
        timestamp          @NotNull Instant  ← ISO-8601 string serialises fine
        croppedPlateImagePath  String (nullable)
        ocrEngineVersion   String (nullable)

    Python's DetectionResult has a nested `geo: Optional[GeoPoint]` and an extra
    `bbox: list[int]` field.  Neither of those match Java's flat lat/lng, and
    `bbox` is entirely unknown to Java — sending it causes a JSON parse error
    with strict validation or silently drops the field depending on the
    ObjectMapper config.  Either way it is wrong, so we project only the fields
    Java actually declares.
    """
    return {
        "mediaId": detection.mediaId,
        "cameraId": detection.cameraId,
        "plateNumber": detection.plateNumber,
        "confidence": detection.confidence,
        "lat": detection.geo.lat if detection.geo else 0.0,
        "lng": detection.geo.lng if detection.geo else 0.0,
        "direction": detection.direction,
        "timestamp": detection.timestamp,        # ISO-8601 string — Java deserialises as Instant
        "croppedPlateImagePath": detection.croppedPlateImagePath,
        "ocrEngineVersion": detection.ocrEngineVersion,
    }


async def _post_with_retry(url: str, json_body: dict) -> bool:
    # BUG FIX: was "X-API-Key" — Java's InternalApiKeyFilter checks the header
    # named "X-Internal-Api-Key" (see InternalApiKeyFilter.java line 24).
    # Using the wrong name means every request gets a 403 FORBIDDEN.
    headers = {"X-Internal-Api-Key": settings.service_api_key}
    async with httpx.AsyncClient(timeout=settings.outbound_timeout_seconds) as client:
        for attempt in range(1, settings.outbound_retry_attempts + 1):
            try:
                resp = await client.post(url, json=json_body, headers=headers)
                resp.raise_for_status()
                return True
            except (httpx.HTTPError, httpx.TimeoutException) as exc:
                if attempt == settings.outbound_retry_attempts:
                    print(f"[java_client] Giving up posting to {url} after {attempt} attempts: {exc}")
                    return False
                await asyncio.sleep(0.5 * attempt)  # simple linear backoff
    return False


async def send_detection(detection: DetectionResult) -> bool:
    url = f"{settings.java_base_url}{settings.java_detections_endpoint}"
    return await _post_with_retry(url, _to_java_payload(detection))


async def send_detections_batch(detections: list[DetectionResult]) -> bool:
    url = f"{settings.java_base_url}{settings.java_detections_batch_endpoint}"
    # Java's DetectionEventBatchRequest: { detections: List<DetectionEventRequest> }
    return await _post_with_retry(url, {"detections": [_to_java_payload(d) for d in detections]})