import torch
import numpy as np
from ultralytics import YOLO

from config import settings


class PlateDetector:
    def __init__(self):
        self.device = settings.device if torch.cuda.is_available() else "cpu"
        if self.device != settings.device:
            print(f"[PlateDetector] CUDA not available — falling back to CPU")

        # Loads our own fine-tuned weights (weights/plate_detector.pt),
        # trained on the IND-VNP Indian vehicle dataset.
        self.model = YOLO(settings.yolo_weights_path)
        self.model.to(self.device)

    def detect(self, frame: np.ndarray, conf: float | None = None) -> list[dict]:
        conf = conf if conf is not None else settings.detection_conf_threshold
        use_half = self.device == "cuda"

        results = self.model(
            frame, conf=conf, device=self.device, half=use_half, verbose=False
        )[0]

        detections = []
        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append({
                "bbox_xyxy": [int(x1), int(y1), int(x2), int(y2)],
                "bbox_xywh": [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                "conf": float(box.conf[0]),
            })
        return detections