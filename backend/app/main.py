from __future__ import annotations

from contextlib import closing
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Query
from pydantic import BaseModel, Field
import pymysql
import logging

from .detect_bridge import run_detection
from .detect_bridge import _fetch_catalog_from_google_sheet, _fetch_catalog_from_database


class DetectRequest(BaseModel):
    imageBase64: str
    catalog: list[dict] | None = None


class OrderItemPayload(BaseModel):
    product_code: str | None = None
    product_name_snapshot: str | None = None
    price_snapshot: float | int | None = None
    qty: int | None = None
    subtotal: float | int | None = None


class CreateOrderPayload(BaseModel):
    order: dict
    items: list[OrderItemPayload] = Field(default_factory=list)


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


def _has_column(table_name: str, column_name: str) -> bool:
    query = """
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = %s
          AND COLUMN_NAME = %s
        LIMIT 1
    """

    with closing(_get_db_connection()) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (table_name, column_name))
            return cur.fetchone() is not None


def _fetch_orders_from_database(filter_order_type: str | None = None) -> list[dict[str, Any]]:
    has_order_type = _has_column("orders", "order_type")
    has_order_code = _has_column("orders", "order_code")
    has_member_id = _has_column("orders", "member_id")
    has_voucher_id = _has_column("orders", "voucher_id")
    has_points_earned = _has_column("orders", "points_earned")
    has_points_used = _has_column("orders", "points_used")
    has_tipe_pelanggan = _has_column("orders", "tipe_pelanggan")
    has_nama_pelanggan = _has_column("orders", "nama_pelanggan")
    has_created_at = _has_column("orders", "created_at")
    has_order_id_link = _has_column("order_items", "order_id")
    has_product_id_link = _has_column("order_items", "product_id")
    has_order_item_type = _has_column("order_items", "order_item_type")

    with closing(_get_db_connection()) as conn:
        with conn.cursor() as cur:
            if has_order_type and filter_order_type:
                select_parts = [
                    "id",
                    "order_code" if has_order_code else "NULL AS order_code",
                    "COALESCE(total, 0) AS total",
                    "COALESCE(subtotal, 0) AS subtotal",
                    "COALESCE(discount, 0) AS discount",
                    "COALESCE(payment_method, '') AS payment_method",
                    "COALESCE(member_id, '') AS member_id" if has_member_id else "NULL AS member_id",
                    "COALESCE(voucher_id, '') AS voucher_id" if has_voucher_id else "NULL AS voucher_id",
                    "COALESCE(points_earned, 0) AS points_earned" if has_points_earned else "0 AS points_earned",
                    "COALESCE(points_used, 0) AS points_used" if has_points_used else "0 AS points_used",
                    "COALESCE(tipe_pelanggan, '') AS tipe_pelanggan" if has_tipe_pelanggan else "'' AS tipe_pelanggan",
                    "COALESCE(nama_pelanggan, '') AS nama_pelanggan" if has_nama_pelanggan else "'' AS nama_pelanggan",
                    "created_at" if has_created_at else "NULL AS created_at",
                    "order_type",
                ]

                cur.execute(
                    f"""
                    SELECT {', '.join(select_parts)}
                    FROM orders
                    WHERE LOWER(order_type) = %s
                    ORDER BY created_at DESC
                    LIMIT 200
                    """,
                    (filter_order_type,),
                )
                order_rows = cur.fetchall() or []
            else:
                if not _has_column("products", "product_type"):
                    raise RuntimeError("Kolom product_type belum tersedia pada products.")

                if not has_order_id_link:
                    raise RuntimeError("Kolom order_id tidak tersedia di order_items.")
                if not has_product_id_link:
                    raise RuntimeError("Kolom product_id tidak tersedia di order_items.")

                select_parts = [
                    "DISTINCT o.id",
                    "o.order_code" if has_order_code else "NULL AS order_code",
                    "COALESCE(o.total, 0) AS total",
                    "COALESCE(o.subtotal, 0) AS subtotal",
                    "COALESCE(o.discount, 0) AS discount",
                    "COALESCE(o.payment_method, '') AS payment_method",
                    "COALESCE(o.member_id, '') AS member_id" if has_member_id else "NULL AS member_id",
                    "COALESCE(o.voucher_id, '') AS voucher_id" if has_voucher_id else "NULL AS voucher_id",
                    "COALESCE(o.points_earned, 0) AS points_earned" if has_points_earned else "0 AS points_earned",
                    "COALESCE(o.points_used, 0) AS points_used" if has_points_used else "0 AS points_used",
                    "COALESCE(o.tipe_pelanggan, '') AS tipe_pelanggan" if has_tipe_pelanggan else "'' AS tipe_pelanggan",
                    "COALESCE(o.nama_pelanggan, '') AS nama_pelanggan" if has_nama_pelanggan else "'' AS nama_pelanggan",
                    "o.created_at" if has_created_at else "NULL AS created_at",
                ]

                cur.execute(
                    f"""
                    SELECT {', '.join(select_parts)}
                    FROM orders o
                    JOIN order_items oi ON oi.order_id = o.id
                    JOIN products p ON p.id = oi.product_id
                    WHERE LOWER(COALESCE(p.product_type, '')) = 'cv'
                    ORDER BY o.created_at DESC
                    LIMIT 200
                    """
                )
                order_rows = cur.fetchall() or []

        orders: list[dict[str, Any]] = []
        for order in order_rows:
            order_id = order.get("id")
            items: list[dict[str, Any]] = []
            if order_id not in (None, ""):
                item_select_parts = [
                    "COALESCE(oi.product_name_snapshot, p.product_name, p.name, p.nama, oi.product_code, '') AS productName",
                    "COALESCE(oi.price_snapshot, 0) AS price",
                    "COALESCE(oi.qty, 0) AS qty",
                    "COALESCE(oi.subtotal, 0) AS subtotal",
                    "COALESCE(oi.order_item_type, '') AS order_item_type" if has_order_item_type else "'' AS order_item_type",
                ]
                if has_product_id_link:
                    item_select_parts.append("oi.product_id AS product_id")

                with conn.cursor() as cur:
                    cur.execute(
                        f"""
                        SELECT {', '.join(item_select_parts)}
                        FROM order_items oi
                        LEFT JOIN products p ON p.id = oi.product_id
                        WHERE oi.order_id = %s
                        {"AND LOWER(COALESCE(oi.order_item_type, '')) = 'computervision'" if has_order_item_type else ''}
                        ORDER BY oi.id ASC
                        """,
                        (order_id,),
                    )
                    items = cur.fetchall() or []

            if not items:
                continue

            created_at = order.get("created_at")
            if hasattr(created_at, "isoformat"):
                created_at = created_at.isoformat()

            orders.append({**order, "created_at": created_at, "items": items})

    return orders


def _clean_text(value: object, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text if text else fallback


def _clean_number(value: object, fallback: float = 0) -> float:
    try:
        if value is None:
            return float(fallback)
        return float(value)
    except Exception:
        return float(fallback)


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

# basic logging for troubleshooting order creation
logging.basicConfig(level=logging.INFO)

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
@app.get("/api/cv")
def root() -> dict:
    return {"status": "ok", "service": "vision-yolo", "endpoints": ["/health", "/detect", "/api/cv/products", "/api/cv/orders"]}


@app.get("/health")
@app.get("/api/cv/health")
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
@app.get("/api/cv/products")
def products(productType: str | None = Query(default=None), activeOnly: bool = Query(default=True)) -> dict:
    try:
        normalized_type = _normalize_product_type(productType) if productType else None
        # Prefer database as source of truth; fallback to Google Sheet
        items: list[dict] = []
        try:
            db_catalog = _fetch_catalog_from_database()
            # transform db_catalog to same normalized shape used by _get_products_from_gs
            items = []
            for item in db_catalog:
                item_product_type = _normalize_product_type(item.get("product_type"))
                item_active = _normalize_active(item.get("is_active", 1))
                if normalized_type and item_product_type != normalized_type:
                    continue
                if activeOnly and item_active != 1:
                    continue
                items.append(
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
                        "category_id": int(item.get("category_id") or 1),
                        "product_type": item_product_type,
                        "is_active": item_active,
                        "visual_samples": int(item.get("visual_samples", 0) or 0),
                    }
                )
        except Exception:
            items = _get_products_from_gs(product_type=normalized_type, active_only=activeOnly)
        return {"data": items}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class ProductUpdatePayload(BaseModel):
    product_type: str | None = None
    category_code: str | None = None
    category_id: int | None = None
    name: str | None = None
    price: float | None = None
    image_url: str | None = None
    is_active: int | None = None
    visual_samples: int | None = None


@app.put("/api/cv/products/{product_id}")
def update_product(product_id: str, payload: ProductUpdatePayload) -> dict:
    try:
        # attempt to update DB products table if available
        with closing(_get_db_connection()) as conn:
            with conn.cursor() as cur:
                # build update statement dynamically based on available columns and payload
                updates = []
                params: list[object] = []

                def try_add(column: str, value: object) -> None:
                    if value is None:
                        return
                    if _has_column("products", column):
                        updates.append(f"{column} = %s")
                        params.append(value)

                try_add("product_type", payload.product_type)
                try_add("category_id", payload.category_id)
                try_add("name", payload.name)
                try_add("price", payload.price)
                try_add("image_url", payload.image_url)
                try_add("is_active", payload.is_active)
                try_add("visual_samples", payload.visual_samples)

                # category_code may be stored as category_name or code in schema
                if payload.category_code is not None:
                    if _has_column("products", "category_name"):
                        updates.append("category_name = %s")
                        params.append(payload.category_code)
                    elif _has_column("products", "category_code"):
                        updates.append("category_code = %s")
                        params.append(payload.category_code)

                if not updates:
                    raise HTTPException(status_code=400, detail="No updatable fields available or provided.")

                # identify product by id or code
                # try matching on code or id columns
                # prefer 'code' column if exists
                id_where = None
                if _has_column("products", "code"):
                    id_where = ("code", product_id)
                elif _has_column("products", "id"):
                    id_where = ("id", product_id)
                else:
                    raise HTTPException(status_code=500, detail="Products table has no id/code column to identify row.")

                params.append(id_where[1])
                sql = f"UPDATE products SET {', '.join(updates)} WHERE {id_where[0]} = %s"
                cur.execute(sql, tuple(params))
                conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/categories")
@app.get("/api/cv/categories")
def categories(activeOnly: bool = Query(default=True)) -> dict:
    try:
        items = _get_products_from_gs(active_only=activeOnly)
        return {"data": _get_categories_from_products(items)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/orders")
@app.get("/api/cv/orders")
def orders(order_type: str | None = Query(default=None)) -> dict:
    try:
        clean_order_type = str(order_type or "").strip().lower() or None
        items = _fetch_orders_from_database(clean_order_type)
        return {"success": True, "orders": items, "data": items}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/orders")
@app.post("/api/cv/orders")
def create_order(payload: CreateOrderPayload) -> dict:
    order_data = payload.order or {}
    items = payload.items or []

    try:
        with closing(_get_db_connection()) as conn:
            with conn.cursor() as cur:
                order_columns: list[str] = []
                order_values: list[object] = []

                def add_order_field(column: str, value: object) -> None:
                    if _has_column("orders", column):
                        order_columns.append(column)
                        order_values.append(value)

                add_order_field("order_code", _clean_text(order_data.get("order_code")))
                add_order_field("service_type", _clean_text(order_data.get("service_type"), "Computer Vision"))
                add_order_field("tipe_pelanggan", _clean_text(order_data.get("tipe_pelanggan"), "GUEST"))
                add_order_field("nama_pelanggan", _clean_text(order_data.get("nama_pelanggan"), "Guest"))
                add_order_field("subtotal", _clean_number(order_data.get("subtotal")))
                add_order_field("discount", _clean_number(order_data.get("discount")))
                add_order_field("total", _clean_number(order_data.get("total")))
                add_order_field("payment_method", _clean_text(order_data.get("payment_method"), "QRIS"))
                add_order_field("member_id", order_data.get("member_id"))
                add_order_field("voucher_id", order_data.get("voucher_id"))
                add_order_field("points_earned", _clean_number(order_data.get("points_earned")))
                add_order_field("points_used", _clean_number(order_data.get("points_used")))
                add_order_field("order_type", _clean_text(order_data.get("order_type"), "computervision"))

                if not order_columns:
                    raise RuntimeError("Tabel orders tidak punya kolom yang bisa diisi.")

                placeholders = ", ".join(["%s"] * len(order_columns))
                column_sql = ", ".join(order_columns)

                cur.execute(
                    f"INSERT INTO orders ({column_sql}) VALUES ({placeholders})",
                    order_values,
                )

                inserted_order_id = cur.lastrowid
                inserted_order_code = _clean_text(order_data.get("order_code"))

                # log order insert
                try:
                    logging.info(f"create_order: inserted_order_id={inserted_order_id} order_code={inserted_order_code} num_items={len(items)}")
                except Exception:
                    pass

                for item in items:
                    item_columns: list[str] = []
                    item_values: list[object] = []

                    def add_item_field(column: str, value: object) -> None:
                        if _has_column("order_items", column):
                            item_columns.append(column)
                            item_values.append(value)

                    add_item_field("order_id", inserted_order_id)

                    # Try to resolve product_id from products table using product_code or id
                    resolved_product_id = None
                    try:
                        # prefer matching by code column if available
                        if _has_column("products", "code"):
                            cur.execute("SELECT id FROM products WHERE code = %s LIMIT 1", (_clean_text(item.product_code),))
                            row = cur.fetchone()
                            if row and row.get("id"):
                                resolved_product_id = row.get("id")

                        # fallback: try matching by id column (product_code may already be an id)
                        if resolved_product_id is None and _has_column("products", "id"):
                            cur.execute("SELECT id FROM products WHERE id = %s LIMIT 1", (_clean_text(item.product_code),))
                            row = cur.fetchone()
                            if row and row.get("id"):
                                resolved_product_id = row.get("id")
                    except Exception:
                        resolved_product_id = None

                    # log resolution result for troubleshooting
                    try:
                        logging.info(f"create_order: product_code={_clean_text(item.product_code)} resolved_product_id={resolved_product_id}")
                    except Exception:
                        pass

                    if resolved_product_id is not None:
                        add_item_field("product_id", resolved_product_id)

                    add_item_field("product_name_snapshot", _clean_text(item.product_name_snapshot))
                    add_item_field("price_snapshot", _clean_number(item.price_snapshot))
                    add_item_field("qty", int(item.qty or 0))
                    add_item_field("subtotal", _clean_number(item.subtotal))

                    # debug: log computed columns/values before insert
                    try:
                        logging.info(f"create_order:item computed - product_code={_clean_text(item.product_code)} columns={item_columns} values={item_values}")
                    except Exception:
                        pass

                    if item_columns:
                        cur.execute(
                            f"INSERT INTO order_items ({', '.join(item_columns)}) VALUES ({', '.join(['%s'] * len(item_columns))})",
                            item_values,
                        )
                    else:
                        try:
                            logging.warning(f"create_order: skipping order_items insert because no matching columns for item")
                        except Exception:
                            pass

            conn.commit()

        return {"success": True, "order_code": order_data.get("order_code"), "items": len(items)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/detect")
def detect(payload: DetectRequest) -> dict:
    try:
        return run_detection(payload.imageBase64, payload.catalog)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
