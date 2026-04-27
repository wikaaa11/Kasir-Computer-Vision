from __future__ import annotations

from collections import Counter
import re
import threading
import time
from urllib.error import URLError
from urllib.request import Request, urlopen
from typing import Any

import cv2
import numpy as np
try:
    from ultralytics import YOLO
except Exception:
    YOLO = None  # type: ignore[assignment]

# COCO-pretrained model. Replace with your fine-tuned weights for production retail detection.
# Keep backend bootable even when ultralytics/torch is not installed yet.
_MODEL = YOLO("yolov8n.pt") if YOLO is not None else None

_ORB = cv2.ORB_create(nfeatures=1200)
_BF = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
_IMG_CACHE_TTL_SEC = 60 * 30
_img_cache_lock = threading.Lock()
_img_cache: dict[str, tuple[float, np.ndarray | None, np.ndarray | None]] = {}

def _tokenize(text: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", text.lower().strip()) if t}


def _read_image_from_url(url: str) -> np.ndarray | None:
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=4) as resp:
            raw = resp.read()
        arr = np.frombuffer(raw, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except (URLError, TimeoutError, ValueError):
        return None
    except Exception:
        return None


def _get_template_features(url: str) -> tuple[np.ndarray | None, np.ndarray | None]:
    now = time.time()
    with _img_cache_lock:
        cached = _img_cache.get(url)
        if cached and now - cached[0] < _IMG_CACHE_TTL_SEC:
            return cached[1], cached[2]

    img = _read_image_from_url(url)
    if img is None:
        with _img_cache_lock:
            _img_cache[url] = (now, None, None)
        return None, None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (0, 0), fx=0.75, fy=0.75)
    keypoints, desc = _ORB.detectAndCompute(gray, None)

    if desc is None or keypoints is None or len(keypoints) < 12:
        with _img_cache_lock:
            _img_cache[url] = (now, None, None)
        return None, None

    kp_arr = np.array([[kp.pt[0], kp.pt[1]] for kp in keypoints], dtype=np.float32)
    with _img_cache_lock:
        _img_cache[url] = (now, kp_arr, desc)
    return kp_arr, desc


def _template_match_fallback(frame: np.ndarray, catalog: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not catalog:
        return None

    frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    frame_gray = cv2.resize(frame_gray, (0, 0), fx=0.75, fy=0.75)
    frame_kp, frame_desc = _ORB.detectAndCompute(frame_gray, None)
    if frame_desc is None or frame_kp is None or len(frame_kp) < 20:
        return None

    best_item: dict[str, Any] | None = None
    best_score = 0.0

    for item in catalog:
        foto = str(item.get("foto", "")).strip()
        if not foto.startswith("http"):
            continue

        _, tpl_desc = _get_template_features(foto)
        if tpl_desc is None:
            continue

        try:
            knn = _BF.knnMatch(tpl_desc, frame_desc, k=2)
        except cv2.error:
            continue

        good = []
        for pair in knn:
            if len(pair) < 2:
                continue
            m, n = pair
            if m.distance < 0.75 * n.distance:
                good.append(m)

        # Normalize against template descriptor length to prevent bias.
        score = len(good) / max(1, len(tpl_desc))
        if score > best_score:
            best_score = score
            best_item = item

    # Conservative threshold to avoid random false positives.
    if best_item and best_score >= 0.02:
        return best_item
    return None


def _find_best_catalog_match(label: str, catalog: list[dict[str, Any]]) -> dict[str, Any] | None:
    lower_label = label.lower().strip()
    label_tokens = _tokenize(lower_label)

    # 1) Exact/contains match against product name.
    for item in catalog:
        name = str(item.get("nama", "")).lower().strip()
        if not name:
            continue
        if lower_label == name or lower_label in name or name in lower_label:
            return item

    # 1.5) Token overlap match (e.g. "freshcare bottle" vs "freshcare matcha").
    best_item = None
    best_score = 0
    for item in catalog:
        name = str(item.get("nama", "")).lower().strip()
        if not name:
            continue
        name_tokens = _tokenize(name)
        if not name_tokens:
            continue
        overlap = len(label_tokens.intersection(name_tokens))
        if overlap > best_score:
            best_score = overlap
            best_item = item
    if best_item and best_score > 0:
        return best_item

    return None


def detect_products(
    frame,
    catalog: list[dict[str, Any]],
    include_debug: bool = False,
) -> list[dict[str, Any]] | tuple[list[dict[str, Any]], dict[str, Any]]:
    debug: dict[str, Any] = {
        "modelReady": _MODEL is not None,
        "rawLabels": [],
        "mappedLabels": [],
        "fallbackUsed": False,
    }

    if _MODEL is None:
        fallback = _template_match_fallback(frame, catalog)
        if not fallback:
            if include_debug:
                return [], debug
            return []
        debug["fallbackUsed"] = True
        detections = [
            {
                "id": fallback.get("id", ""),
                "name": fallback.get("nama", "Unknown"),
                "price": float(fallback.get("harga", 0) or 0),
                "quantity": 1,
                "points": float(fallback.get("poin", 0) or 0),
            }
        ]
        if include_debug:
            return detections, debug
        return detections

    # Lower confidence to be more tolerant for low-light, close-range cashier camera frames.
    results = _MODEL.predict(frame, verbose=False, conf=0.10)
    if not results:
        if include_debug:
            return [], debug
        return []

    first = results[0]
    boxes = first.boxes
    if boxes is None or len(boxes) == 0:
        if include_debug:
            return [], debug
        return []

    labels: list[str] = []
    for cls_idx in boxes.cls.tolist():
        idx = int(cls_idx)
        labels.append(first.names[idx])
    debug["rawLabels"] = labels

    counts = Counter(labels)
    # Consolidate by product key to avoid double-counting one object
    # that appears as multiple labels in the same frame.
    detections_by_key: dict[str, dict[str, Any]] = {}

    for label, qty in counts.items():
        matched = _find_best_catalog_match(label, catalog)
        if not matched:
            continue

        debug["mappedLabels"].append(label)

        detection = {
            "id": matched.get("id", ""),
            "name": matched.get("nama", label),
            "price": float(matched.get("harga", 0) or 0),
            # Treat one capture action as one add-per-product to avoid double counts
            # caused by noisy multi-box detections on the same item.
            "quantity": 1,
            "points": float(matched.get("poin", 0) or 0),
        }
        key = str(detection["id"] or detection["name"])
        if key in detections_by_key:
            # Keep the highest quantity for one product per frame instead of summing.
            detections_by_key[key]["quantity"] = max(
                int(detections_by_key[key]["quantity"]),
                int(detection["quantity"]),
            )
        else:
            detections_by_key[key] = detection

    detections: list[dict[str, Any]] = list(detections_by_key.values())

    # Fallback: if YOLO did not map any item, try image-template matching using catalog photos.
    if not detections:
        fallback = _template_match_fallback(frame, catalog)
        if fallback:
            debug["fallbackUsed"] = True
            detections.append(
                {
                    "id": fallback.get("id", ""),
                    "name": fallback.get("nama", "Unknown"),
                    "price": float(fallback.get("harga", 0) or 0),
                    "quantity": 1,
                    "points": float(fallback.get("poin", 0) or 0),
                }
            )

    if include_debug:
        return detections, debug
    return detections
