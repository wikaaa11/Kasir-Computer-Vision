import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Sparkles,
  X,
  Check,
  Star,
  Loader2,
  Image as ImageIcon,
  Tag,
  Camera,
  Package,
  Grid2X2,
  Tags,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface InventoryProps {
  adminRole: 'super_admin' | 'kiosk_admin' | 'cv_admin';
  products: any[];
  allProducts: any[];
  categories: any[];
  onCreateProduct: (product: any) => Promise<boolean>;
  onUpdateProduct: (productCode: string, product: any) => Promise<boolean>;
  onDeleteProduct: (productCode: string) => Promise<boolean>;
}

const Inventory: React.FC<InventoryProps> = ({
  adminRole,
  products,
  allProducts,
  categories,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingProductCode, setEditingProductCode] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const productTypeLabel = adminRole === 'kiosk_admin' ? 'kiosk' : 'cv';

  const retailCategory = categories.find(
    (category) =>
      String(category.name || '').trim().toLowerCase() === 'retail'
  );

  const getDefaultCategoryId = () => {
    if (retailCategory?.id !== undefined && retailCategory?.id !== null) {
      return String(retailCategory.id);
    }

    if (Array.isArray(categories) && categories.length > 0) {
      return String(categories[0].id ?? 'retail');
    }

    return 'retail';
  };

  const toNumber = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const formatRupiah = (value: unknown) =>
    `Rp ${toNumber(value).toLocaleString('id-ID')}`;

  const getCashbackReward = (product: any) => {
    return toNumber(
      product?.cashbackReward ??
        product?.cashback_reward ??
        product?.cashback ??
        product?.points ??
        product?.poin ??
        0
    );
  };

  const getProductName = (product: any) =>
    product.nama || product.name || product.product_name || 'Produk';

  const getProductCode = (product: any) =>
    product.id || product.code || product.product_code || '';

  const getProductPrice = (product: any) =>
    toNumber(product.harga ?? product.price ?? 0);

  const getProductImage = (product: any) =>
    product.foto ||
    product.image_url ||
    product.image ||
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=100';

  const [newProduct, setNewProduct] = useState({
    id: '',
    nama: '',
    barcode: '',
    harga: '',
    cashback_reward: '',
    deskripsi: '',
    foto: '',
    product_type: productTypeLabel,
    category_id: getDefaultCategoryId(),
  });

  const getNextProductCode = () => {
    const pattern = /^PRD-(\d+)$/i;

    const numbers = allProducts
      .map((product) => String(product.id || product.code || '').trim())
      .map((code) => code.match(pattern)?.[1])
      .filter((value): value is string => Boolean(value))
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    const nextNumber = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;

    return `PRD-${String(nextNumber).padStart(3, '0')}`;
  };

  const resetForm = () => {
    setNewProduct({
      id: getNextProductCode(),
      nama: '',
      barcode: '',
      harga: '',
      cashback_reward: '',
      deskripsi: '',
      foto: '',
      product_type: productTypeLabel,
      category_id: getDefaultCategoryId(),
    });
  };

  const filteredProducts = products.filter((p) => {
    const keyword = searchQuery.toLowerCase();

    return (
      String(getProductName(p)).toLowerCase().includes(keyword) ||
      String(getProductCode(p)).toLowerCase().includes(keyword) ||
      String(p.barcode || '').toLowerCase().includes(keyword)
    );
  });

  const getCategoryName = (categoryId: any) => {
    const match = categories.find(
      (category) =>
        String(category.id) === String(categoryId) ||
        String(category.name) === String(categoryId)
    );

    if (String(categoryId).toLowerCase() === 'retail') return 'Retail';

    const categoryName = match?.name || String(categoryId || 'Retail');

    return productTypeLabel === 'cv' ? 'Retail' : categoryName;
  };

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalCategories = new Set(
      products.map((p) =>
        String(
          p.category_code ?? p.category_name ?? p.category_id ?? p.category ?? ''
        ).toLowerCase()
      )
    ).size;

    const sortedByPrice = [...products].sort(
      (a, b) => getProductPrice(b) - getProductPrice(a)
    );

    const highest = sortedByPrice[0] || null;
    const lowest =
      [...products].sort(
        (a, b) => getProductPrice(a) - getProductPrice(b)
      )[0] || null;

    return {
      totalProducts,
      totalCategories,
      highest,
      lowest,
    };
  }, [products]);

  const handleGenerateDesc = async (name: string) => {
    if (!name) return;

    setLoadingAi(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Buat deskripsi singkat pemasaran untuk produk retail bernama: ${name}. Gunakan bahasa Indonesia yang menarik.`,
              },
            ],
          },
        ],
      });

      setNewProduct((prev) => ({
        ...prev,
        deskripsi: response.text || '',
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');

          let width = img.width;
          let height = img.height;

          const maxWidth = 800;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            reject('Canvas context error');
          }
        };

        img.onerror = () => reject('Image load error');
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject('File read error');
      reader.readAsDataURL(file);
    });
  };

  const handleBarcodeExtraction = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingAi(true);

    try {
      const reader = new FileReader();

      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64,
                },
              },
              {
                text: 'Extract the barcode number from this image. Return ONLY the number.',
              },
            ],
          },
        ],
      });

      const barcode = response.text?.trim().replace(/[^0-9]/g, '');

      if (barcode) {
        setNewProduct((prev) => ({ ...prev, barcode }));
      } else {
        alert('Barcode tidak terdeteksi. Pastikan gambar jelas.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memproses gambar.');
    } finally {
      setLoadingAi(false);
    }
  };

  const buildProductData = () => {
    const selectedCategory =
      categories.find(
        (category) => String(category.id) === String(newProduct.category_id)
      ) || retailCategory;

    const categoryCode = String(selectedCategory?.name || 'Retail').trim();
    const cashbackRewardValue = toNumber(newProduct.cashback_reward);

    return {
      ...newProduct,
      name: newProduct.nama,
      harga: toNumber(newProduct.harga),
      price: toNumber(newProduct.harga),
      image: newProduct.foto,
      image_url: newProduct.foto,
      description: newProduct.deskripsi,
      cashbackReward: cashbackRewardValue,
      cashback_reward: cashbackRewardValue,
      points: cashbackRewardValue,
      poin: cashbackRewardValue,
      product_type: newProduct.product_type || productTypeLabel,
      productType: newProduct.product_type || productTypeLabel,
      category_id: Number(
        isNaN(Number(newProduct.category_id))
          ? selectedCategory?.id ?? 1
          : Number(newProduct.category_id)
      ),
      category_code:
        categoryCode ||
        (String(newProduct.category_id).toLowerCase() === 'retail'
          ? 'Retail'
          : undefined),
    };
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const success = await onCreateProduct(buildProductData());

      if (success) {
        setIsCreateFormOpen(false);
        resetForm();
      }
    } catch (err) {
      console.error('Create error:', err);
      alert(err instanceof Error ? err.message : 'Gagal menyimpan produk.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductCode) return;

    setIsSaving(true);

    try {
      const success = await onUpdateProduct(editingProductCode, buildProductData());

      if (success) {
        setEditingProductCode(null);
        resetForm();
      }
    } catch (err) {
      console.error('Update error:', err);
      alert(err instanceof Error ? err.message : 'Gagal memperbarui produk.');
    } finally {
      setIsSaving(false);
    }
  };

  const processDelete = async (id: string) => {
    try {
      const success = await onDeleteProduct(id);

      if (success) setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete error:', err);

      const message =
        err instanceof Error ? err.message : 'Gagal menghapus produk.';

      alert(message);
    }
  };

  const openEditForm = (product: any) => {
    const productCode = getProductCode(product);

    const categoryKey = String(
      product.category_code || product.category_name || ''
    ).trim();

    const matchedCategoryId =
      categories.find((c) => String(c.name) === categoryKey)?.id ??
      product.category_id ??
      '1';

    const retailCategoryId =
      categories.find(
        (c) => String(c.name || '').trim().toLowerCase() === 'retail'
      )?.id ?? matchedCategoryId;

    setNewProduct({
      id: product.id || product.code || product.product_code || '',
      nama: product.nama || product.name || product.product_name || '',
      barcode: product.barcode || '',
      harga: String(product.harga ?? product.price ?? ''),
      cashback_reward: String(getCashbackReward(product)),
      deskripsi: product.deskripsi || product.description || '',
      foto: product.foto || product.image_url || product.image || '',
      product_type:
        product.product_type || product.productType || productTypeLabel,
      category_id: String(
        productTypeLabel === 'cv'
          ? retailCategoryId
          : matchedCategoryId || '1'
      ),
    });

    setIsCreateFormOpen(false);
    setEditingProductCode(productCode);
  };

  const closeForm = () => {
    setIsCreateFormOpen(false);
    setEditingProductCode(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-white space-y-7 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Inventory Management
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Kelola katalog produk sesuai database Google Sheet Anda.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProductCode(null);
            resetForm();
            setIsCreateFormOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_25px_rgba(249,115,22,0.28)] transition-all hover:bg-orange-700 active:scale-95"
        >
          <Plus size={18} />
          Tambah Produk Baru
        </button>
      </div>

      {isCreateFormOpen && (
        <ProductFormCard
          title="Tambah Produk Baru"
          subtitle="Lengkapi data produk baru untuk ditampilkan di inventory."
          icon={<Plus size={22} />}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          categories={categories}
          loadingAi={loadingAi}
          isSaving={isSaving}
          onSubmit={handleCreateProduct}
          onClose={closeForm}
          onGenerateDesc={handleGenerateDesc}
          onBarcodeExtraction={handleBarcodeExtraction}
          compressImage={compressImage}
          submitLabel="Simpan"
        />
      )}

      <div className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400"
              size={23}
            />

            <input
              type="text"
              placeholder="Cari ID atau Nama Produk..."
              className="w-full bg-transparent py-2 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden text-[11px] font-black uppercase tracking-widest text-slate-500 sm:block">
            Total: {filteredProducts.length} Produk
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <SummaryCard
          icon={<Package size={28} />}
          iconClass="bg-violet-100 text-violet-600"
          title="Total Produk"
          value={stats.totalProducts}
          desc="Semua produk terdaftar"
        />

        <SummaryCard
          icon={<Grid2X2 size={28} />}
          iconClass="bg-green-100 text-green-600"
          title="Kategori"
          value={stats.totalCategories || categories.length}
          desc="Kategori produk aktif"
        />

        <SummaryCard
          icon={<Tags size={28} />}
          iconClass="bg-orange-100 text-orange-600"
          title="Harga Tertinggi"
          value={
            stats.highest ? formatRupiah(getProductPrice(stats.highest)) : 'Rp 0'
          }
          desc={stats.highest ? getProductName(stats.highest) : '-'}
        />

        <SummaryCard
          icon={<Tag size={28} />}
          iconClass="bg-blue-100 text-blue-600"
          title="Harga Terendah"
          value={
            stats.lowest ? formatRupiah(getProductPrice(stats.lowest)) : 'Rp 0'
          }
          desc={stats.lowest ? getProductName(stats.lowest) : '-'}
        />
      </div>

      <div className="overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-orange-100 bg-orange-50 text-[11px] font-black uppercase tracking-wider text-orange-700">
                <th className="px-6 py-5">Produk</th>
                <th className="px-6 py-5">Kategori</th>
                <th className="px-6 py-5">Harga & Poin</th>
                <th className="px-6 py-5">Product Type</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p, idx) => {
                const productCode = getProductCode(p);
                const isDeleting = deleteConfirmId === productCode;
                const isEditingThisRow = editingProductCode === productCode;
                const cashbackReward = getCashbackReward(p);

                return (
                  <React.Fragment key={`${productCode}-${idx}`}>
                    <tr
                      className={`transition ${
                        isEditingThisRow
                          ? 'bg-orange-50/40'
                          : isDeleting
                            ? 'bg-amber-50'
                            : 'hover:bg-orange-50/20'
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                            <img
                              src={getProductImage(p)}
                              alt={getProductName(p)}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>

                          <div>
                            <p className="text-base font-black text-slate-950">
                              {getProductName(p)}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">
                                {productCode}
                              </span>

                              {p.barcode && (
                                <span className="rounded-md bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-600">
                                  #{p.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-black uppercase text-violet-600">
                          {getCategoryName(
                            p.category_code ??
                              p.category_name ??
                              p.category_id ??
                              p.category
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-base font-black text-slate-950">
                          {formatRupiah(getProductPrice(p))}
                        </p>

                        <p className="mt-1 flex items-center text-xs font-black text-orange-600">
                          <Star
                            size={13}
                            className="mr-1 fill-orange-500 text-orange-500"
                          />
                          {cashbackReward.toLocaleString('id-ID')} Pts
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-lg bg-orange-50 px-3 py-2 text-[10px] font-black uppercase text-orange-600">
                          {p.product_type || p.productType || 'cv'}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => processDelete(productCode)}
                              className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-600"
                            >
                              Ya, Hapus
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-200"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() =>
                                isEditingThisRow
                                  ? closeForm()
                                  : openEditForm(p)
                              }
                              title="Edit"
                              className={`flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition ${
                                isEditingThisRow
                                  ? 'text-orange-600 ring-2 ring-orange-100'
                                  : 'text-slate-600 hover:text-orange-600'
                              }`}
                            >
                              <Edit3 size={18} />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(productCode)}
                              title="Hapus"
                              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-red-500 shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:bg-red-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isEditingThisRow && (
                      <tr className="bg-orange-50/30">
                        <td colSpan={5} className="px-6 pb-6 pt-0">
                          <ProductFormCard
                            title={`Edit Produk: ${getProductName(p)}`}
                            subtitle="Form edit muncul tepat di bawah produk yang sedang dipilih."
                            icon={<Edit3 size={21} />}
                            newProduct={newProduct}
                            setNewProduct={setNewProduct}
                            categories={categories}
                            loadingAi={loadingAi}
                            isSaving={isSaving}
                            onSubmit={handleUpdateProduct}
                            onClose={closeForm}
                            onGenerateDesc={handleGenerateDesc}
                            onBarcodeExtraction={handleBarcodeExtraction}
                            compressImage={compressImage}
                            submitLabel="Perbarui"
                            compact
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={38} className="text-slate-200" />
                      <p className="mt-3 font-black text-slate-950">
                        Tidak ada produk ditemukan
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Coba gunakan kata kunci lain.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .input-style {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          outline: none;
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
};

const ProductFormCard = ({
  title,
  subtitle,
  icon,
  newProduct,
  setNewProduct,
  categories,
  loadingAi,
  isSaving,
  onSubmit,
  onClose,
  onGenerateDesc,
  onBarcodeExtraction,
  compressImage,
  submitLabel,
  compact = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  newProduct: any;
  setNewProduct: React.Dispatch<React.SetStateAction<any>>;
  categories: any[];
  loadingAi: boolean;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onGenerateDesc: (name: string) => void;
  onBarcodeExtraction: (e: React.ChangeEvent<HTMLInputElement>) => void;
  compressImage: (file: File) => Promise<string>;
  submitLabel: string;
  compact?: boolean;
}) => {
  return (
    <div
      className={`overflow-hidden rounded-[26px] border border-orange-100 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.07)] ${
        compact ? 'mt-4' : ''
      }`}
    >
      <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-white px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-100">
            {icon}
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-950">{title}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-orange-50 hover:text-orange-600"
        >
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 bg-white lg:grid-cols-[1fr_300px]"
      >
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="SKU / Code">
              <input
                required
                disabled
                value={newProduct.id}
                className="input-style bg-slate-50 text-slate-500"
              />
            </Field>

            <Field label="Nama Produk">
              <input
                required
                placeholder="Contoh: Snickers"
                value={newProduct.nama}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, nama: e.target.value })
                }
                className="input-style bg-white text-slate-800 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Kategori">
              <select
                value={newProduct.category_id}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    category_id: e.target.value,
                  })
                }
                className="input-style bg-white text-slate-700 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option value="1">Retail</option>
                )}
              </select>
            </Field>

            <Field label="Barcode">
              <div className="flex gap-2">
                <input
                  placeholder="Masukkan barcode..."
                  value={newProduct.barcode}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      barcode: e.target.value,
                    })
                  }
                  className="input-style flex-1 bg-white font-mono text-slate-800 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />

                <label className="flex cursor-pointer items-center justify-center rounded-2xl bg-slate-950 px-4 text-white transition hover:bg-slate-800">
                  {loadingAi ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onBarcodeExtraction}
                    disabled={loadingAi}
                  />
                </label>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Harga Produk">
              <input
                required
                type="number"
                placeholder="0"
                value={newProduct.harga}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, harga: e.target.value })
                }
                className="input-style bg-white text-slate-800 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </Field>

            <Field label="Cashback Reward">
              <input
                type="number"
                placeholder="0"
                value={newProduct.cashback_reward}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    cashback_reward: e.target.value,
                  })
                }
                className="input-style bg-white text-slate-800 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </Field>
          </div>

          <Field label="Product Type">
            <input
              readOnly
              value={newProduct.product_type}
              className="input-style bg-slate-50 font-black uppercase text-orange-600"
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Deskripsi Produk
              </label>

              <button
                type="button"
                onClick={() => onGenerateDesc(newProduct.nama)}
                className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black text-orange-600 transition hover:bg-orange-100"
              >
                {loadingAi ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                Generate AI
              </button>
            </div>

            <textarea
              rows={4}
              placeholder="Ceritakan tentang produk ini..."
              value={newProduct.deskripsi}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  deskripsi: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>
        </div>

        <aside className="border-t border-slate-100 bg-orange-50/30 p-6 lg:border-l lg:border-t-0">
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Foto Produk
            </p>

            <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              {newProduct.foto ? (
                <img
                  src={newProduct.foto}
                  alt="Preview"
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon size={36} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-400">
                    Belum ada gambar
                  </p>
                </div>
              )}
            </div>

            <input
              placeholder="https://example.com/image.jpg"
              value={newProduct.foto?.startsWith('http') ? newProduct.foto : ''}
              onChange={(e) =>
                setNewProduct({ ...newProduct, foto: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />

            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    try {
                      const compressed = await compressImage(file);
                      setNewProduct({ ...newProduct, foto: compressed });
                    } catch (error) {
                      console.error('Compress error:', error);
                      alert('Gagal memproses gambar. Coba gambar lain.');
                    }
                  }
                }}
              />

              <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-200 bg-white px-4 py-4 text-sm font-black text-orange-600 transition hover:bg-orange-50">
                <ImageIcon size={18} />
                Upload Foto
              </div>
            </label>

            <div className="rounded-2xl bg-white p-4 text-xs font-medium leading-relaxed text-slate-500">
              Pastikan gambar produk jelas dan tidak terlalu gelap agar mudah
              dikenali sistem.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3 text-sm font-black text-white shadow-lg shadow-orange-100 transition hover:bg-orange-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                {submitLabel}
              </button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
};

const SummaryCard = ({
  icon,
  iconClass,
  title,
  value,
  desc,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  value: string | number;
  desc: string;
}) => {
  return (
    <div className="relative min-h-[150px] overflow-hidden rounded-[22px] border border-slate-100 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-[0_10px_20px_rgba(15,23,42,0.08)] ${iconClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{value}</h3>
        </div>
      </div>

      <p className="absolute bottom-5 left-5 text-xs font-semibold text-slate-500">
        {desc}
      </p>

      <div className="absolute bottom-5 right-5 h-9 w-20 rounded-full bg-gradient-to-r from-transparent via-orange-100 to-orange-200 opacity-70" />
    </div>
  );
};

export default Inventory;