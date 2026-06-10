export interface CvProduct {
  id?: string;
  product_id?: string | number;
  product_code?: string;
  code?: string;

  name?: string;
  product_name?: string;
  nama?: string;

  price?: number | string;
  harga?: number | string;

  barcode?: string | null;

  image_url?: string | null;
  image?: string | null;
  foto?: string | null;

  category?: string | null;
  category_code?: string | null;
  category_name?: string | null;
  category_id?: string | number | null;

  product_type?: string | null;
  productType?: string | null;

  cashbackReward?: number | string | null;
  cashback_reward?: number | string | null;
  cashback?: number | string | null;
  points?: number | string | null;
  poin?: number | string | null;

  description?: string | null;
  deskripsi?: string | null;
  isRecommended?: number | boolean;
  isActive?: number | boolean;
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
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_transaction?: number;
  is_member_only?: boolean;
}

export interface CvOrderPayload {
  order: {
    order_code: string;
    service_type: string;
    tipe_pelanggan: 'GUEST' | 'MEMBER';
    nama_pelanggan: string;
    subtotal: number;
    discount: number;
    tax?: number;
    total: number;
    payment_method: string;
    member_code: string | null;
    voucher_code: string | null;
    points_earned: number;
    points_used: number;
    order_type: string;
  };
  items: Array<{
    product_id?: number;
    product_code?: string;
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

const CV_API_BASE_URL = (
  import.meta.env.VITE_CV_API_BASE_URL || 'http://localhost:8000'
).replace(/\/$/, '');

const buildUrl = (path: string) => `${CV_API_BASE_URL}${path}`;

const pickErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const maybeError = (payload as { error?: unknown }).error;
  if (typeof maybeError === 'string' && maybeError.trim()) {
    return maybeError;
  }

  const maybeMessage = (payload as { message?: unknown }).message;
  if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
    return maybeMessage;
  }

  return fallback;
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      ...init,
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke backend pusat.');
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      pickErrorMessage(payload, `Request gagal (${response.status}).`)
    );
  }

  if (payload && typeof payload === 'object') {
    const envelope = payload as ApiEnvelope<T>;

    if (envelope.success === false) {
      throw new Error(
        pickErrorMessage(payload, 'Backend mengembalikan status gagal.')
      );
    }

    if ('data' in envelope && typeof envelope.data !== 'undefined') {
      return envelope.data as T;
    }
  }

  return payload as T;
};

const toNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getCashbackReward = (product: CvProduct): number => {
  return toNumber(
    product.cashbackReward ??
      product.cashback_reward ??
      product.cashback ??
      product.points ??
      product.poin ??
      0
  );
};

export const toCatalogProduct = (product: CvProduct) => {
  const productCode = String(
    product.id || product.product_id || product.product_code || product.code || ''
  ).trim();

  const productName =
    String(product.name || product.product_name || product.nama || 'Produk').trim() ||
    'Produk';

  const productPrice = toNumber(product.price ?? product.harga ?? 0);
  const cashbackReward = getCashbackReward(product);

  const productImage = String(
    product.image_url || product.image || product.foto || ''
  ).trim();

  const categoryName =
    String(
      product.category ||
        product.category_code ||
        product.category_name ||
        'Umum'
    ).trim() || 'Umum';

  const productType = String(
    product.product_type || product.productType || 'cv'
  ).trim();

  const description = String(
    product.description || product.deskripsi || ''
  ).trim();

  return {
    id: productCode,
    product_id: product.product_id,
    product_code: product.product_code || product.code || productCode,
    code: product.code || product.product_code || productCode,

    nama: productName,
    name: productName,
    product_name: productName,

    harga: productPrice,
    price: productPrice,

    cashbackReward,
    cashback_reward: cashbackReward,
    cashback: cashbackReward,
    poin: cashbackReward,
    points: cashbackReward,

    foto: productImage,
    image_url: productImage,
    image: productImage,

    kategori: categoryName,
    category: categoryName,
    category_code: product.category_code || categoryName,
    category_name: product.category_name || categoryName,
    category_id: product.category_id,

    barcode: String(product.barcode || '').trim(),

    product_type: productType,
    productType,

    description,
    deskripsi: description,

    isRecommended: product.isRecommended,
    isActive: product.isActive,
  };
};

export const getCvProducts = async (): Promise<CvProduct[]> => {
  const response = await requestJson<CvProduct[] | ApiEnvelope<CvProduct[]>>(
    '/api/cv/products'
  );

  let products: CvProduct[] = [];

  if (Array.isArray(response)) {
    products = response;
  } else if (
    response &&
    typeof response === 'object' &&
    Array.isArray(response.products)
  ) {
    products = response.products;
  }

  return products.map(toCatalogProduct);
};

export const getCvProductByBarcode = async (
  barcode: string
): Promise<CvProduct> => {
  const cleanBarcode = String(barcode || '').trim();

  if (!cleanBarcode) {
    throw new Error('Silakan masukkan barcode terlebih dahulu.');
  }

  try {
    const response = await requestJson<CvProduct | ApiEnvelope<CvProduct>>(
      `/api/cv/products/by-barcode/${encodeURIComponent(cleanBarcode)}`
    );

    let product: CvProduct;

    if (
      response &&
      typeof response === 'object' &&
      'product' in response &&
      response.product
    ) {
      product = response.product;
    } else {
      product = response as CvProduct;
    }

    return toCatalogProduct(product);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Produk tidak ditemukan.';

    throw new Error(`Barcode tidak ditemukan. ${message}`);
  }
};

export const getCvMemberByCode = async (
  memberCode: string
): Promise<CvMember> => {
  const cleanCode = String(memberCode || '').trim();

  if (!cleanCode) {
    throw new Error('Kode member belum diisi.');
  }

  const response = await requestJson<CvMember | ApiEnvelope<CvMember>>(
    `/api/cv/members/${encodeURIComponent(cleanCode)}`
  );

  if (
    response &&
    typeof response === 'object' &&
    'member' in response &&
    response.member
  ) {
    return response.member;
  }

  return response as CvMember;
};

export const getCvActiveVouchers = async (): Promise<CvVoucher[]> => {
  const response = await requestJson<CvVoucher[] | ApiEnvelope<CvVoucher[]>>(
    '/api/cv/vouchers/active'
  );

  if (Array.isArray(response)) {
    return response;
  }

  if (
    response &&
    typeof response === 'object' &&
    Array.isArray(response.vouchers)
  ) {
    return response.vouchers;
  }

  return [];
};

export const submitCvOrder = async (
  payload: CvOrderPayload
): Promise<void> => {
  await requestJson<unknown>('/api/cv/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};