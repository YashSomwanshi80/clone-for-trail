import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from config import settings

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/crops/{filename}")
def get_crop(filename: str):
    filepath = os.path.join(settings.crop_dir, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Crop not found")
    return FileResponse(filepath, media_type="image/jpeg")