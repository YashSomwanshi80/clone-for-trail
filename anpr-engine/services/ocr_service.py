import re
import cv2
import numpy as np
from fast_plate_ocr import LicensePlateRecognizer

from config import settings  # use "from app.config import settings" if you kept the app/ package

# Rough Indian plate pattern: e.g. MH12AB1234, DL01CA0001, KA05MH1234.
# Used to flag implausible OCR reads — not a hard filter, since some
# states/vehicle classes deviate from this.
INDIAN_PLATE_PATTERN = re.compile(r"^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$")


class PlateOCR:
    def __init__(self):
        self.recognizer = LicensePlateRecognizer(settings.ocr_model_name)

    def read_plate(self, plate_crop: np.ndarray) -> tuple[str, float]:
        # fast-plate-ocr expects RGB, channels_last, uint8 — OpenCV crops are BGR
        rgb = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2RGB) if plate_crop.ndim == 3 else plate_crop

        preds = self.recognizer.run(rgb, return_confidence=True)
        if not preds:
            return "", 0.0

        pred = preds[0]
        plate_text = self._normalize(pred.plate)

        # char_probs is per-character confidence — average into one overall score
        char_probs = getattr(pred, "char_probs", None)
        confidence = float(np.mean(char_probs)) if char_probs is not None and len(char_probs) else 1.0

        return plate_text, confidence

    def _normalize(self, text: str) -> str:
        return re.sub(r"[^A-Z0-9]", "", text.upper())

    def is_plausible_indian_plate(self, text: str) -> bool:
        return bool(INDIAN_PLATE_PATTERN.match(text))