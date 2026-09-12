import asyncio
import httpx

from config import settings
from schemas import DetectionResult


async def _post_with_retry(url: str, json_body: dict) -> bool:
    headers = {"X-API-Key": settings.service_api_key}
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
    return await _post_with_retry(url, detection.model_dump())


async def send_detections_batch(detections: list[DetectionResult]) -> bool:
    url = f"{settings.java_base_url}{settings.java_detections_batch_endpoint}"
    return await _post_with_retry(url, {"detections": [d.model_dump() for d in detections]})