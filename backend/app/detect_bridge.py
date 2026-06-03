from __future__ import annotations

import base64
import json
import os
import sys
from contextlib import closing
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen

import cv2
import numpy as np
import pymysql  # type: ignore[import-not-found]

try:
    from .yolo_service import detect_products
except ImportError:
    from yolo_service import detect_products


def _normalize_catalog(raw_data: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_data, list) or len(raw_data) == 0:
        return []

    if isinstance(raw_data[0], list):
        if len(raw_data) <= 1:
            return []

        headers = [str(h).lower().strip() for h in raw_data[0]]
        idx = {
            "id": headers.index("id") if "id" in headers else -1,
            "nama": headers.index("nama") if "nama" in headers else -1,
            "harga": headers.index("harga") if "harga" in headers else -1,
            "poin": headers.index("poin") if "poin" in headers else -1,
            "foto": headers.index("foto") if "foto" in headers else -1,
            "kategori": headers.index("kategori") if "kategori" in headers else -1,
        }

        normalized: list[dict[str, Any]] = []
        for row in raw_data[1:]:
            if not isinstance(row, list):
                continue
            nama = row[idx["nama"]] if idx["nama"] >= 0 and idx["nama"] < len(row) else ""
            if not str(nama).strip():
                continue
            normalized.append(
                {
                    "id": row[idx["id"]] if idx["id"] >= 0 and idx["id"] < len(row) else "",
                    "nama": str(nama),
                    "harga": float(row[idx["harga"]] if idx["harga"] >= 0 and idx["harga"] < len(row) else 0),
                    "poin": float(row[idx["poin"]] if idx["poin"] >= 0 and idx["poin"] < len(row) else 0),
                    "foto": row[idx["foto"]] if idx["foto"] >= 0 and idx["foto"] < len(row) else "",
                    "kategori": row[idx["kategori"]] if idx["kategori"] >= 0 and idx["kategori"] < len(row) else "Umum",
                }
            )
        return normalized

    normalized: list[dict[str, Any]] = []
    for item in raw_data:
        if not isinstance(item, dict):
            continue
        nama = item.get("nama") or item.get("name") or ""
        if not str(nama).strip():
            continue
        normalized.append(
            {
                "id": item.get("id", ""),
                "nama": str(nama),
                "harga": float(item.get("harga", item.get("price", 0)) or 0),
                "poin": float(item.get("poin", item.get("points", 0)) or 0),
                "foto": item.get("foto", item.get("image", item.get("image_url", ""))),
                "kategori": item.get("kategori", item.get("category", "Umum")),
            }
        )
    return normalized


def _get_db_connection() -> pymysql.connections.Connection:
    return pymysql.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "ngolab_express_system"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def _rows_to_catalog(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    catalog: list[dict[str, Any]] = []
    for row in rows:
        catalog.append(
            {
                "id": row.get("code") or "",
                "nama": row.get("name") or "",
                "harga": float(row.get("price") or 0),
                "poin": float(row.get("cashback_reward") or 0),
                "foto": row.get("image_url") or "",
                "kategori": row.get("category_name") or str(row.get("category_id") or "Umum"),
            }
        )
    return catalog


def _fetch_catalog_from_database() -> list[dict[str, Any]]:
    query = """
        SELECT p.code, p.name, p.price, p.cashback_reward, p.image_url, p.category_id, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = 1 AND LOWER(TRIM(p.product_type)) = %s
        ORDER BY p.id DESC
    """
    product_type = os.getenv("PRODUCT_TYPE_FILTER", "computervision").strip().lower()

    with closing(_get_db_connection()) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (product_type,))
            rows = cur.fetchall()
    return _rows_to_catalog(rows)


def _fetch_catalog_from_google_sheet() -> list[dict[str, Any]]:
    gs_url = os.getenv(
        "GOOGLE_SHEET_WEBAPP_URL",
        "https://script.google.com/macros/s/AKfycbxC-MIdsxtbFktGhLU3Yh5dALiDeLoB1QwiFdHsXULB8aKCvgzOVVyIE12pjXePIPhDtA/exec",
    ).strip()
    if not gs_url:
        return []

    query = urlencode({"action": "GET_PRODUCTS"})
    request_url = f"{gs_url}?{query}"

    with urlopen(request_url, timeout=6) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return _normalize_catalog(payload)


def run_detection(image_base64: str, catalog: Any = None) -> dict[str, Any]:
    if not image_base64 or not isinstance(image_base64, str):
        raise ValueError("imageBase64 is required")

    image_bytes = base64.b64decode(image_base64)
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Invalid image payload")

    normalized_catalog = catalog or []
    if not isinstance(normalized_catalog, list):
        normalized_catalog = []

    # Prefer database as source of truth; fallback to Google Sheet if DB empty/unavailable
    if not normalized_catalog:
        try:
            normalized_catalog = _fetch_catalog_from_database()
        except Exception:
            normalized_catalog = []

    if not normalized_catalog:
        try:
            normalized_catalog = _fetch_catalog_from_google_sheet()
        except Exception:
            normalized_catalog = []

    if not normalized_catalog:
        raise RuntimeError("Catalog unavailable")

    detections, diagnostics = detect_products(frame, normalized_catalog, include_debug=True)
    return {
        "detections": detections,
        "diagnostics": {
            **diagnostics,
            "catalogSize": len(normalized_catalog),
        },
    }


def _main() -> int:
    raw_input = sys.stdin.read()
    payload = json.loads(raw_input or "{}")

    output = run_detection(
        image_base64=payload.get("imageBase64"),
        catalog=payload.get("catalog"),
    )

    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(_main())
    except Exception as exc:
        sys.stderr.write(str(exc))
        raise SystemExit(1)
