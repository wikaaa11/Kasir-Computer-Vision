from __future__ import annotations

from collections import Counter
import re
from pathlib import Path
import threading
import time
from urllib.request import Request, urlopen
from typing import Any

import cv2
import numpy as np
import base64

try:
    from ultralytics import YOLO
except Exception:
    YOLO = None

_MODEL_PATH = Path(__file__).resolve().parent.parent / "best.pt"
_MODEL = YOLO(str(_MODEL_PATH)) if YOLO is not None else None

_ORB = cv2.ORB_create(nfeatures=1200)
_BF = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

_IMG_CACHE_TTL_SEC = 60 * 30
_img_cache_lock = threading.Lock()
_img_cache: dict[str, tuple[float, np.ndarray | None, np.ndarray | None]] = {}


def _tokenize(text: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", text.lower().strip()) if t}


# =============================
# IMAGE LOADERS
# =============================

def _read_image_from_url(url: str) -> np.ndarray | None:
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=4) as resp:
            raw = resp.read()
        arr = np.frombuffer(raw, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception:
        return None


def _read_image_from_base64(data_url: str) -> np.ndarray | None:
    try:
        _, encoded = data_url.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception:
        return None


# =============================
# TEMPLATE FEATURES
# =============================

def _get_template_features(source: str):
    now = time.time()

    with _img_cache_lock:
        cached = _img_cache.get(source)
        if cached and now - cached[0] < _IMG_CACHE_TTL_SEC:
            return cached[1], cached[2]

    if source.startswith("http"):
        img = _read_image_from_url(source)
    elif source.startswith("data:image"):
        img = _read_image_from_base64(source)
    else:
        img = None

    if img is None:
        with _img_cache_lock:
            _img_cache[source] = (now, None, None)
        return None, None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # PERBAIKAN: Adaptive histogram equalization (CLAHE) untuk contrast yang lebih baik
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    gray = cv2.resize(gray, (0, 0), fx=0.75, fy=0.75)

    kp, desc = _ORB.detectAndCompute(gray, None)

    if desc is None or kp is None or len(kp) < 12:
        with _img_cache_lock:
            _img_cache[source] = (now, None, None)
        return None, None

    kp_arr = np.array([[k.pt[0], k.pt[1]] for k in kp], dtype=np.float32)

    with _img_cache_lock:
        _img_cache[source] = (now, kp_arr, desc)

    return kp_arr, desc


# =============================
# FALLBACK MATCHING (FILTERED)
# =============================

def _template_match_fallback(frame, catalog):
    if not catalog:
        return None

    # PERBAIKAN: Adaptive histogram equalization (CLAHE) + turunkan MIN_MATCH lebih lanjut
    frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    frame_gray = clahe.apply(frame_gray)
    frame_gray = cv2.resize(frame_gray, (0, 0), fx=0.75, fy=0.75)

    frame_kp, frame_desc = _ORB.detectAndCompute(frame_gray, None)
    if frame_desc is None or frame_kp is None or len(frame_kp) < 20:
        return None

    best_item = None
    best_score = 0.0

    for item in catalog:
        # PERBAIKAN: Menggunakan key 'image_url' sesuai dari API pusat
        foto = str(item.get("image_url", "")).strip()

        if not (foto.startswith("http") or foto.startswith("data:image")):
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

            # PERBAIKAN: Turunkan Lowe's ratio dari 0.65 ke 0.6 (semakin toleran)
            if m.distance < 0.6 * n.distance:
                good.append(m)

        # PERBAIKAN: Turunkan MIN_MATCH dari 10 ke 8 (lebih aggressive)
        MIN_MATCH = 8
        if len(good) < MIN_MATCH:
            continue

        score = len(good) / max(1, len(tpl_desc))

        if score > best_score:
            best_score = score
            best_item = item

    # PERBAIKAN: Turunkan threshold dari 0.03 ke 0.02 (lebih aggressive detection)
    if best_item and best_score >= 0.02:
        return best_item

    return None


# =============================
# LABEL MATCHING
# =============================

def _find_best_catalog_match(label, catalog):
    lower = label.lower().strip()
    tokens = _tokenize(lower)

    for item in catalog:
        # PERBAIKAN: Menggunakan key 'name' untuk mencocokkan teks AI
        name = str(item.get("name", "")).lower()
        if lower in name or name in lower:
            return item

    best = None
    score = 0

    for item in catalog:
        # PERBAIKAN: Menggunakan key 'name' juga di sini
        name = str(item.get("name", "")).lower()
        name_tokens = _tokenize(name)

        overlap = len(tokens.intersection(name_tokens))
        if overlap > score:
            score = overlap
            best = item

    if best and score > 0:
        return best

    return None


# =============================
# MAIN DETECTION
# =============================

def detect_products(frame, catalog, include_debug=False):
    debug = {
        "modelReady": _MODEL is not None,
        "rawLabels": [],
        "mappedLabels": [],
        "fallbackUsed": False,
    }

    if _MODEL is None:
        fb = _template_match_fallback(frame, catalog)
        if not fb:
            return ([], debug) if include_debug else []

        debug["fallbackUsed"] = True
        result = [{
            "id": fb.get("id", ""),
            # PERBAIKAN: Menyesuaikan key output untuk name, price, dan cashbackReward
            "name": fb.get("name", "Unknown"),
            "price": float(fb.get("price", 0)),
            "quantity": 1,
            "points": float(fb.get("cashbackReward", 0)),
        }]
        return (result, debug) if include_debug else result

    # PERBAIKAN: Naik confidence agar false positive berkurang
    results = _MODEL.predict(
    frame,
    conf=0.5,
    iou=0.5,
    verbose=False,
    imgsz=640
)

    if not results or results[0].boxes is None:
        return ([], debug) if include_debug else []

    labels = [results[0].names[int(c)] for c in results[0].boxes.cls.tolist()]
    debug["rawLabels"] = labels

    detections = []

    # PERBAIKAN: Hitung quantity berdasarkan berapa kali label muncul di deteksi
    label_counts = Counter(labels)
    for label, count in label_counts.items():
        match = _find_best_catalog_match(label, catalog)
        if match:
            debug["mappedLabels"].append(label)
            detections.append({
                "id": match.get("id", ""),
                # PERBAIKAN: Menyesuaikan key output 
                "name": match.get("name", label),
                "price": float(match.get("price", 0)),
                "quantity": count,
                "points": float(match.get("cashbackReward", 0)),
            })

    if not detections:
        fb = _template_match_fallback(frame, catalog)
        if fb:
            debug["fallbackUsed"] = True
            detections.append({
                "id": fb.get("id", ""),
                # PERBAIKAN: Menyesuaikan key output 
                "name": fb.get("name", "Unknown"),
                "price": float(fb.get("price", 0)),
                "quantity": 1,
                "points": float(fb.get("cashbackReward", 0)),
            })

    return (detections, debug) if include_debug else detections