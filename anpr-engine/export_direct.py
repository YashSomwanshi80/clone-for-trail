"""
export_direct.py — Direct Keras → ONNX export (no torch, no albumentations).

Use this as a fallback if the fast-plate-ocr CLI fails due to a WDAC / Application
Control policy blocking torch DLL imports.

Usage (from anpr-engine root, with venv active):
    python export_direct.py

The TEMP/TMP redirect below ensures tf2onnx writes its intermediate file to a
project-local folder rather than the system %TEMP% (which may be permission-locked).
"""

import os
import tempfile

PROJECT_ROOT = os.path.dirname(__file__)
TEMP_DIR = os.path.join(PROJECT_ROOT, "tmp")

# Redirect temp writes to the project-local tmp/ folder before importing anything.
# This avoids Windows permission errors when tf2onnx writes an intermediate .onnx file.
os.environ["TEMP"] = TEMP_DIR
os.environ["TMP"] = TEMP_DIR
os.environ["TMPDIR"] = TEMP_DIR
tempfile.tempdir = TEMP_DIR

os.makedirs(TEMP_DIR, exist_ok=True)

import sys

import numpy as np
import tensorflow as tf

try:
    import keras
except ImportError:
    from tensorflow import keras

# Import the custom OCR model modules so Keras can resolve serializable custom
# classes/functions when loading the saved model before export.
import fast_plate_ocr.train.model.layers  # noqa: F401
import fast_plate_ocr.train.model.loss  # noqa: F401
import fast_plate_ocr.train.model.metric  # noqa: F401
from fast_plate_ocr.train.model.config import load_plate_config_from_yaml
from fast_plate_ocr.train.utilities.utils import load_keras_model

import tf2onnx

# ---------------------------------------------------------------------------
MODEL_PATH  = os.path.join("trained_models", "2026-09-12_14-13-52", "best.keras")
OUTPUT_PATH = os.path.join("trained_models", "best.onnx")
OPSET       = 18
# ---------------------------------------------------------------------------


def main() -> None:
    if not os.path.isfile(MODEL_PATH):
        print(f"ERROR: model not found at '{MODEL_PATH}'")
        sys.exit(1)

    print(f"Loading Keras model from: {MODEL_PATH}")
    plate_config = load_plate_config_from_yaml(os.path.join("config", "indian_plates.yaml"))
    model = load_keras_model(MODEL_PATH, plate_config)
    model.summary()

    input_shape = model.inputs[0].shape
    input_dtype = model.inputs[0].dtype
    print(f"\nModel input: shape={input_shape}, dtype={input_dtype}")

    # Build a concrete TF function for tf2onnx
    input_sig = [tf.TensorSpec(input_shape, input_dtype, name="input")]

    @tf.function(input_signature=input_sig)
    def _model_fn(x: tf.Tensor) -> tf.Tensor:
        return model(x, training=False)

    print(f"\nExporting to ONNX (opset {OPSET}) → {OUTPUT_PATH} ...")
    os.makedirs(os.path.dirname(OUTPUT_PATH) or ".", exist_ok=True)

    model_proto, _ = tf2onnx.convert.from_function(
        _model_fn,
        input_signature=input_sig,
        opset=OPSET,
        output_path=OUTPUT_PATH,
    )

    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n✓ Export complete. Saved to: {OUTPUT_PATH}  ({size_mb:.1f} MB)")
    print("\nNext step: update config.py → ocr_model_name to point at this file,")
    print("or keep the pretrained model for demo and use this for evaluation only.")


if __name__ == "__main__":
    main()
