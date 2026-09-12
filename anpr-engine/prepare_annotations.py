"""
prepare_annotations.py

Takes the raw annotations.csv (with bare filenames like 'image_2244.png')
and:
  1. Rewrites image_path to full absolute paths pointing at the actual
     cropped plate images folder.
  2. Verifies every image file actually exists on disk (flags any that
     are missing so you catch labeling/typo errors before training).
  3. Splits the result into train_annotations.csv and val_annotations.csv
     (default 85/15 split).

Usage (from anpr-engine folder, with venv activated):
    python prepare_annotations.py

Edit the three paths below if your folders differ.
"""

import csv
import os
import random

# ---- EDIT THESE THREE PATHS IF NEEDED ----
INPUT_CSV = r"C:\Users\HP\Downloads\annotations.csv"
IMAGES_DIR = r"C:\Users\HP\Downloads\IND-VNP_ Indian Vehicle and Number Plate Image Dataset\Dataset\Raw Dataset\Number_Plates"
OUTPUT_DIR = r"C:\SIH\NeuraTransit\anpr-engine\ocr_dataset"
# -------------------------------------------

VAL_FRACTION = 0.15
SEED = 42

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    rows = []
    missing = []

    with open(INPUT_CSV, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row["image_path"].strip()
            plate_text = row["plate_text"].strip()

            full_path = os.path.join(IMAGES_DIR, filename)

            if not os.path.isfile(full_path):
                missing.append(filename)
                continue

            # fast-plate-ocr's train script expects image_path to be relative
            # to the CSV's own folder (it naively joins csv_dir + image_path,
            # it does NOT detect/skip already-absolute paths). So we compute
            # the path relative to OUTPUT_DIR (where the CSV will live),
            # not an absolute path.
            relative_path = os.path.relpath(full_path, start=OUTPUT_DIR)

            rows.append({"image_path": relative_path, "plate_text": plate_text})

    print(f"Total rows in input CSV: {len(rows) + len(missing)}")
    print(f"Valid rows (image found): {len(rows)}")

    if missing:
        print(f"\nWARNING: {len(missing)} rows reference images that were NOT found:")
        for m in missing[:20]:
            print(f"  - {m}")
        if len(missing) > 20:
            print(f"  ...and {len(missing) - 20} more.")
        print("These rows were EXCLUDED from the output. Check for typos or wrong folder.\n")

    if not rows:
        print("ERROR: No valid rows found. Check IMAGES_DIR path. Aborting.")
        return

    random.seed(SEED)
    random.shuffle(rows)

    val_count = max(1, int(len(rows) * VAL_FRACTION))
    val_rows = rows[:val_count]
    train_rows = rows[val_count:]

    train_path = os.path.join(OUTPUT_DIR, "train_annotations.csv")
    val_path = os.path.join(OUTPUT_DIR, "val_annotations.csv")

    for path, data in [(train_path, train_rows), (val_path, val_rows)]:
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["image_path", "plate_text"])
            writer.writeheader()
            writer.writerows(data)

    print(f"Train set: {len(train_rows)} rows -> {train_path}")
    print(f"Val set:   {len(val_rows)} rows -> {val_path}")
    print("\nDone. Use these two files as --annotations and --val-annotations in training.")

if __name__ == "__main__":
    main()