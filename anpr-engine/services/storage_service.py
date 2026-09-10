import os
import uuid
import aiofiles
import cv2
import numpy as np

from config import settings

os.makedirs(settings.crop_dir, exist_ok=True)


async def save_crop(crop: np.ndarray, media_id: str, timestamp: str) -> str | None:
    """Writes a plate crop to local disk (Section 4 of SRS) and returns the
    relative URL path served by GET /media/crops/{filename}."""
    if not settings.save_crops:
        return None

    safe_timestamp = timestamp.replace(":", "-")
    filename = f"{media_id}_{safe_timestamp}_{uuid.uuid4().hex[:6]}.jpg"
    filepath = os.path.join(settings.crop_dir, filename)

    success, buffer = cv2.imencode(".jpg", crop)
    if not success:
        return None

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(buffer.tobytes())

    return f"/media/crops/{filename}"