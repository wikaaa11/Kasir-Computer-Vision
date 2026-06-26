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
  username?: string;

  id?: string | number;
  user_id?: string | number;
  code?: string | number;

  tier?: string;
  membership_level?: string;
  memberLevel?: string;

  points?: number | string;
  total_points?: number | string;
  totalPoints?: number | string;

  cashbackPoints?: number | string;
  cashback_points?: number | string;

  commission_points?: number | string;
  affiliate_total_points?: number | string;
  affiliate_tier?: string | null;
  level?: string | null;
  affiliate?: string | null;

  phone?: string | null;
  phone_number?: string | null;
  profile_picture?: string | null;
}

export interface CvVoucher {
  id?: string;
  voucher_id?: string | number;
  userVoucherId?: string | number;
  user_voucher_id?: string | number;

  code?: string;
  voucher_code: string;
  voucherCode?: string;

  name?: string;
  title?: string;
  voucher_name: string;
  voucherName?: string;

  description?: string;

  type?: 'PERCENT' | 'FIXED' | string;
  voucher_type?: string;
  discountType?: 'PERCENT' | 'FIXED' | string;
  discount_type: 'PERCENT' | 'FIXED';

  discount?: number | string;
  discountValue?: number | string;
  discount_value: number;
  value?: number | string;
  value_amount?: number | string;
  amount?: number | string;
  nominal?: number | string;

  minPurchase?: number | string;
  min_purchase?: number | string;
  minTransaction?: number | string;
  min_transaction?: number;

  maxDiscount?: number | string;
  max_discount?: number | string;

  image_url?: string | null;
  image?: string | null;

  is_member_only?: boolean;
  isMemberOnly?: boolean;

  status?: string;

  expiredAt?: string | null;
  expired_at?: string | null;

  claimedAt?: string | null;
  claimed_at?: string | null;

  isAvailable?: boolean;
  is_available?: boolean;
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
    user_id?: string | null;

    voucher_code: string | null;
    points_earned: number;
    points_used: number;
    order_type: string;

    user_voucher_id?: string | number | null;
    voucher_id?: string | number | null;
  };

  items: Array<{
    product_id?: number;
    product_code?: string;
    product_name_snapshot: string;
    price_snapshot: number;
    qty: number;
    subtotal: number;

    points?: number;
    poin?: number;
    cashbackReward?: number;
    cashback_reward?: number;
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

const normalizeBaseUrl = (value: string) => {
  return String(value || '')
    .trim()
    .replace(/^http:\/\/\s+/i, 'http://')
    .replace(/^https:\/\/\s+/i, 'https://')
    .replace(/\/+$/, '');
};

const CV_API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_CV_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    'http://localhost:4000'
);

const buildUrl = (path: string) => {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Kalau env terlanjur berisi http://localhost:4000/api/cv
  // dan path juga /api/cv/..., bagian /api/cv tidak akan dobel.
  if (
    CV_API_BASE_URL.endsWith('/api/cv') &&
    cleanPath.startsWith('/api/cv/')
  ) {
    cleanPath = cleanPath.replace(/^\/api\/cv/, '');
  }

  return `${CV_API_BASE_URL}${cleanPath}`;
};

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
  const url = buildUrl(path);
  const method = init?.method || 'GET';

  console.log(`[CV API] ${method} ${url}`);

  let response: Response;

  try {
    const headers = new Headers(init?.headers || {});
    headers.set('Accept', 'application/json');

    const hasBody = typeof init?.body !== 'undefined';
    const isFormData =
      typeof FormData !== 'undefined' && init?.body instanceof FormData;

    if (hasBody && !isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    console.error('[CV API] Fetch gagal:', url, error);
    throw new Error(
      `Tidak bisa terhubung ke backend pusat. URL gagal: ${url}`
    );
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
  if (value === undefined || value === null || value === '') return 0;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value).trim();

  // Format Indonesia: 10.000,50 -> 10000.50
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) {
    const cleaned = raw.replace(/\./g, '').replace(',', '.');
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  const cleaned = raw.replace(/[^\d.-]/g, '');
  const numeric = Number(cleaned);

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

const normalizeMember = (member: CvMember, fallbackCode: string): CvMember => {
  const memberCode = String(
    member.member_code ??
      member.user_id ??
      member.id ??
      member.code ??
      fallbackCode
  ).trim();

  const memberName =
    String(
      member.member_name ??
        member.nama_member ??
        member.name ??
        member.username ??
        'Member'
    ).trim() || 'Member';

  const tier = String(
    member.tier ??
      member.membership_level ??
      member.memberLevel ??
      'Silver'
  ).trim();

  const cashbackPoints = toNumber(
    member.cashback_points ??
      member.cashbackPoints ??
      member.points ??
      0
  );

  const totalPoints = toNumber(
    member.total_points ??
      member.totalPoints ??
      0
  );

  return {
    ...member,
    id: member.id ?? memberCode,
    user_id: member.user_id ?? memberCode,
    member_code: memberCode,
    member_name: memberName,
    nama_member: memberName,
    name: memberName,
    username: member.username ?? memberName,

    tier,
    membership_level: member.membership_level ?? tier,
    memberLevel: member.memberLevel ?? tier,

    // points dibuat sama dengan cashback_points supaya App.tsx lama tetap aman.
    points: cashbackPoints,
    cashbackPoints,
    cashback_points: cashbackPoints,

    totalPoints,
    total_points: totalPoints,
  };
};

const normalizeVoucher = (voucher: any): CvVoucher => {
  const rawDiscountType = String(
    voucher.discountType ||
      voucher.discount_type ||
      voucher.type ||
      voucher.voucher_type ||
      'FIXED'
  ).toUpperCase();

  const discountType: 'PERCENT' | 'FIXED' =
    rawDiscountType === 'PERCENT' ||
    rawDiscountType === 'PERCENTAGE' ||
    rawDiscountType === 'DISCOUNT'
      ? 'PERCENT'
      : 'FIXED';

  const voucherCode = String(
    voucher.voucher_code ||
      voucher.voucherCode ||
      voucher.code ||
      voucher.id ||
      voucher.voucher_id ||
      ''
  ).trim();

  const voucherName =
    String(
      voucher.voucher_name ||
        voucher.voucherName ||
        voucher.name ||
        voucher.title ||
        voucher.voucher_title ||
        'Voucher'
    ).trim() || 'Voucher';

  const discountValue = toNumber(
    voucher.discount_value ??
      voucher.discountValue ??
      voucher.discount ??
      voucher.value_amount ??
      voucher.value ??
      voucher.amount ??
      voucher.nominal ??
      0
  );

  const minTransaction = toNumber(
    voucher.min_transaction ??
      voucher.minTransaction ??
      voucher.minimum_transaction ??
      voucher.minimum_purchase ??
      voucher.min_purchase ??
      voucher.minPurchase ??
      0
  );

  const maxDiscount = toNumber(
    voucher.max_discount ??
      voucher.maxDiscount ??
      voucher.maximum_discount ??
      0
  );

  const userVoucherId =
    voucher.userVoucherId ??
    voucher.user_voucher_id ??
    voucher.userVoucherID ??
    voucher.user_voucherId ??
    voucher.id ??
    null;

  const voucherId =
    voucher.voucher_id ??
    voucher.voucherId ??
    null;

  const expiredAt =
    voucher.expiredAt ??
    voucher.expired_at ??
    voucher.userVoucherExpiredAt ??
    voucher.valid_until ??
    voucher.expires_at ??
    null;

  const claimedAt =
    voucher.claimedAt ??
    voucher.claimed_at ??
    voucher.created_at ??
    null;

  return {
    ...voucher,

    id: String(userVoucherId || voucherId || voucherCode),
    voucher_id: voucherId || '',
    userVoucherId: userVoucherId || '',
    user_voucher_id: userVoucherId || '',

    code: voucherCode,
    voucher_code: voucherCode,
    voucherCode,

    name: voucherName,
    title: voucherName,
    voucher_name: voucherName,
    voucherName,

    description: String(
      voucher.description ||
        voucher.desc ||
        voucher.detail ||
        'Voucher tersedia untuk transaksi Anda.'
    ),

    type: discountType,
    voucher_type: voucher.voucher_type || voucher.type || discountType,
    discountType,
    discount_type: discountType,

    discount: discountValue,
    discountValue,
    discount_value: discountValue,
    value: discountValue,
    value_amount: discountValue,

    minPurchase: minTransaction,
    min_purchase: minTransaction,
    minTransaction,
    min_transaction: minTransaction,

    maxDiscount,
    max_discount: maxDiscount,

    image_url: voucher.image_url || voucher.image || null,
    image: voucher.image || voucher.image_url || null,

    is_member_only:
      typeof voucher.is_member_only !== 'undefined'
        ? Boolean(voucher.is_member_only)
        : true,

    isMemberOnly:
      typeof voucher.isMemberOnly !== 'undefined'
        ? Boolean(voucher.isMemberOnly)
        : true,

    status: String(voucher.status || 'ACTIVE'),

    expiredAt,
    expired_at: expiredAt,

    claimedAt,
    claimed_at: claimedAt,

    isAvailable:
      typeof voucher.isAvailable !== 'undefined'
        ? Boolean(voucher.isAvailable)
        : true,

    is_available:
      typeof voucher.is_available !== 'undefined'
        ? Boolean(voucher.is_available)
        : true,
  };
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

  let member: CvMember;

  if (
    response &&
    typeof response === 'object' &&
    'member' in response &&
    response.member
  ) {
    member = response.member;
  } else {
    member = response as CvMember;
  }

  return normalizeMember(member, cleanCode);
};

export const lookupCvMemberByQr = async (
  qrCode: string
): Promise<CvMember> => {
  const cleanCode = String(qrCode || '').trim();

  if (!cleanCode) {
    throw new Error('QR membership belum terbaca.');
  }

  const response = await requestJson<CvMember | ApiEnvelope<CvMember>>(
    '/api/cv/members/qr-lookup',
    {
      method: 'POST',
      body: JSON.stringify({
        code: cleanCode,
        qr_code: cleanCode,
        member_code: cleanCode,
      }),
    }
  );

  let member: CvMember;

  if (
    response &&
    typeof response === 'object' &&
    'member' in response &&
    response.member
  ) {
    member = response.member;
  } else {
    member = response as CvMember;
  }

  return normalizeMember(member, cleanCode);
};

export const getCvMemberVouchers = async (
  userId: string | number
): Promise<CvVoucher[]> => {
  const cleanUserId = String(userId || '').trim();

  if (!cleanUserId) {
    throw new Error('User ID member belum tersedia untuk mengambil voucher.');
  }

  try {
    const response = await requestJson<CvVoucher[] | ApiEnvelope<CvVoucher[]>>(
      `/api/cv/members/${encodeURIComponent(cleanUserId)}/vouchers`
    );

    let vouchers: CvVoucher[] = [];

    if (Array.isArray(response)) {
      vouchers = response;
    } else if (
      response &&
      typeof response === 'object' &&
      Array.isArray(response.vouchers)
    ) {
      vouchers = response.vouchers;
    }

    return vouchers.map(normalizeVoucher);
  } catch (error) {
    console.warn('[CV API] Voucher member tidak ditemukan:', error);
    return [];
  }
};

// Tetap dipertahankan supaya file lama yang masih import getCvActiveVouchers tidak error.
// Tapi untuk voucher gamifikasi member, gunakan getCvMemberVouchers(userId).
export const getCvActiveVouchers = async (): Promise<CvVoucher[]> => {
  try {
    const response = await requestJson<CvVoucher[] | ApiEnvelope<CvVoucher[]>>(
      '/api/cv/vouchers/active'
    );

    let vouchers: CvVoucher[] = [];

    if (Array.isArray(response)) {
      vouchers = response;
    } else if (
      response &&
      typeof response === 'object' &&
      Array.isArray(response.vouchers)
    ) {
      vouchers = response.vouchers;
    }

    return vouchers.map(normalizeVoucher);
  } catch (error) {
    console.warn('[CV API] Voucher aktif tidak ditemukan:', error);
    return [];
  }
};

export const submitCvOrder = async (
  payload: CvOrderPayload
): Promise<unknown> => {
  return requestJson<unknown>('/api/cv/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};