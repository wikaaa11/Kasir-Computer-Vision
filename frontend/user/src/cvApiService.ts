export interface CvProduct {
  product_code: string;
  product_name: string;
  price: number;
  barcode?: string | null;
  image_url?: string | null;
  category_name?: string | null;
  cashback_reward?: number | null;
  points?: number | null;
}

export interface CvMember {
  member_code: string;
  member_name?: string;
  nama_member?: string;
  name?: string;
  tier?: string;
  points?: number;
}

export interface CvVoucher {
  voucher_code: string;
  voucher_name: string;
  description?: string;
  discount_type: "PERCENT" | "FIXED";
  discount_value: number;
  min_transaction?: number;
  is_member_only?: boolean;
}

export interface CvOrderPayload {
  order: {
    order_code: string;
    service_type: string;
    tipe_pelanggan: "GUEST" | "MEMBER";
    nama_pelanggan: string;
    subtotal: number;
    discount: number;
    total: number;
    payment_method: string;
    member_code: string | null;
    voucher_code: string | null;
    points_earned: number;
    points_used: number;
    order_type: string;
  };
  items: Array<{
    product_code: string;
    product_name_snapshot: string;
    price_snapshot: number;
    qty: number;
    subtotal: number;
  }>;
}

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  products?: CvProduct[];
  product?: CvProduct;
  member?: CvMember;
  vouchers?: CvVoucher[];
};

const CV_API_BASE_URL = (import.meta.env.VITE_CV_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

const buildUrl = (path: string) => `${CV_API_BASE_URL}${path}`;

const pickErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybeError = (payload as { error?: unknown }).error;
  if (typeof maybeError === "string" && maybeError.trim()) {
    return maybeError;
  }

  const maybeMessage = (payload as { message?: unknown }).message;
  if (typeof maybeMessage === "string" && maybeMessage.trim()) {
    return maybeMessage;
  }

  return fallback;
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    });
  } catch {
    throw new Error("Tidak bisa terhubung ke backend pusat.");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(pickErrorMessage(payload, `Request gagal (${response.status}).`));
  }

  if (payload && typeof payload === "object") {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.success === false) {
      throw new Error(pickErrorMessage(payload, "Backend mengembalikan status gagal."));
    }
    if ("data" in envelope && typeof envelope.data !== "undefined") {
      return envelope.data as T;
    }
  }

  return payload as T;
};

export const toCatalogProduct = (product: CvProduct) => ({
  id: String(product.product_code || "").trim(),
  nama: String(product.product_name || "Produk").trim() || "Produk",
  harga: Number(product.price || 0),
  poin: Number(product.points ?? product.cashback_reward ?? 0),
  foto: String(product.image_url || "").trim(),
  kategori: String(product.category_name || "Umum").trim() || "Umum",
  barcode: String(product.barcode || "").trim(),
});

export const getCvProducts = async (): Promise<CvProduct[]> => {
  const response = await requestJson<CvProduct[] | ApiEnvelope<CvProduct[]>>("/api/cv/products");
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === "object" && Array.isArray(response.products)) {
    return response.products;
  }
  return [];
};

export const getCvProductByBarcode = async (barcode: string): Promise<CvProduct> => {
  const cleanBarcode = String(barcode || "").trim();
  if (!cleanBarcode) {
    throw new Error("Silakan masukkan barcode terlebih dahulu.");
  }

  try {
    const response = await requestJson<CvProduct | ApiEnvelope<CvProduct>>(
      `/api/cv/products/by-barcode/${encodeURIComponent(cleanBarcode)}`,
    );
    if (response && typeof response === "object" && "product" in response && response.product) {
      return response.product;
    }
    return response as CvProduct;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Produk tidak ditemukan.";
    throw new Error(`Barcode tidak ditemukan. ${message}`);
  }
};

export const getCvMemberByCode = async (memberCode: string): Promise<CvMember> => {
  const cleanCode = String(memberCode || "").trim();
  if (!cleanCode) {
    throw new Error("Kode member belum diisi.");
  }

  const response = await requestJson<CvMember | ApiEnvelope<CvMember>>(
    `/api/cv/members/${encodeURIComponent(cleanCode)}`,
  );
  if (response && typeof response === "object" && "member" in response && response.member) {
    return response.member;
  }
  return response as CvMember;
};

export const getCvActiveVouchers = async (): Promise<CvVoucher[]> => {
  const response = await requestJson<CvVoucher[] | ApiEnvelope<CvVoucher[]>>("/api/cv/vouchers/active");
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === "object" && Array.isArray(response.vouchers)) {
    return response.vouchers;
  }
  return [];
};

export const submitCvOrder = async (payload: CvOrderPayload): Promise<void> => {
  await requestJson<unknown>("/api/cv/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
