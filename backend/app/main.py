from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Query
from pydantic import BaseModel

from .detect_bridge import run_detection
from .detect_bridge import _fetch_catalog_from_google_sheet


class DetectRequest(BaseModel):
    imageBase64: str
    catalog: list[dict] | None = None


def _normalize_product_type(value: object) -> str:
    text = str(value or "").strip().lower()
    return text if text else "computervision"


def _normalize_active(value: object) -> int:
    if isinstance(value, bool):
        return 1 if value else 0
    text = str(value or "").strip().lower()
    if text in {"1", "true", "yes", "y"}:
        return 1
    if text in {"0", "false", "no", "n"}:
        return 0
    return 1


def _get_products_from_gs(product_type: str | None = None, active_only: bool = True) -> list[dict]:
    catalog = _fetch_catalog_from_google_sheet()
    result: list[dict] = []
    for item in catalog:
        item_product_type = _normalize_product_type(item.get("product_type"))
        item_active = _normalize_active(item.get("is_active", 1))

        if product_type and item_product_type != product_type:
            continue
        if active_only and item_active != 1:
            continue

        result.append(
            {
                "id": str(item.get("id", "")),
                "code": str(item.get("id", "")),
                "nama": str(item.get("nama", "")),
                "name": str(item.get("nama", "")),
                "harga": float(item.get("harga", 0) or 0),
                "price": float(item.get("harga", 0) or 0),
                "poin": float(item.get("poin", 0) or 0),
                "cashback_reward": float(item.get("poin", 0) or 0),
                "deskripsi": str(item.get("deskripsi", "") or ""),
                "description": str(item.get("deskripsi", "") or ""),
                "foto": str(item.get("foto", "") or ""),
                "image_url": str(item.get("foto", "") or ""),
                "category_name": str(item.get("kategori", "Umum") or "Umum"),
                "category_id": 1,
                "product_type": item_product_type,
                "is_active": item_active,
                "visual_samples": int(item.get("visual_samples", 0) or 0),
            }
        )
    return result


def _get_categories_from_products(products: list[dict]) -> list[dict]:
    names = sorted({str(p.get("category_name", "Umum") or "Umum") for p in products})
    return [
        {
            "id": idx + 1,
            "code": f"CAT-{idx + 1:03d}",
            "name": name,
            "is_active": 1,
        }
        for idx, name in enumerate(names)
    ]


app = FastAPI(title="Vision YOLO API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "vision-yolo", "endpoints": ["/health", "/detect"]}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/health/db")
def health_db() -> dict:
    try:
        products = _get_products_from_gs(active_only=False)
        return {
            "status": "ok",
            "dbConnected": True,
            "source": "google_sheet",
            "totalProducts": len(products),
        }
    except Exception as exc:
        return {
            "status": "degraded",
            "dbConnected": False,
            "source": "google_sheet",
            "detail": str(exc),
        }


@app.get("/products")
def products(productType: str | None = Query(default=None), activeOnly: bool = Query(default=True)) -> dict:
    try:
        normalized_type = _normalize_product_type(productType) if productType else None
        items = _get_products_from_gs(product_type=normalized_type, active_only=activeOnly)
        return {"data": items}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/categories")
def categories(activeOnly: bool = Query(default=True)) -> dict:
    try:
        items = _get_products_from_gs(active_only=activeOnly)
        return {"data": _get_categories_from_products(items)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/detect")
def detect(payload: DetectRequest) -> dict:
    try:
        return run_detection(payload.imageBase64, payload.catalog)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
