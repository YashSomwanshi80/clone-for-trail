import cv2
import numpy as np


def preprocess_crop(crop: np.ndarray) -> np.ndarray:
    """Cleans up a plate crop before OCR: upscales small/far plates, denoises
    and sharpens for motion blur, and corrects for uneven lighting."""
    h, w = crop.shape[:2]

    if h < 40:
        scale = 60 / h
        crop = cv2.resize(crop, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

    crop = cv2.fastNlMeansDenoisingColored(crop, None, 5, 5, 7, 21)

    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    crop = cv2.filter2D(crop, -1, kernel)

    lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    crop = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)

    return crop