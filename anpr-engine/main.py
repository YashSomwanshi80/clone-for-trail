import os

from fastapi import FastAPI

from config import settings
from routers import health, infer, media

os.makedirs(settings.crop_dir, exist_ok=True)
os.makedirs("data", exist_ok=True)

app = FastAPI(
    title="ANPR Inference Service",
    version="2.0.0",
    description=(
        "Stateless detection+OCR service — turns raw image/video bytes into "
        "structured plate-detection results and forwards them to the Java backend."
    ),
)

app.include_router(health.router)
app.include_router(infer.router)
app.include_router(media.router)