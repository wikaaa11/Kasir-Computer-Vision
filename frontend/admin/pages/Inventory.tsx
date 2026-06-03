
import React, { useState } from 'react';
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
  Link as LinkIcon,
  AlertTriangle,
  Camera
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface InventoryProps {
  adminRole: 'super_admin' | 'kiosk_admin' | 'cv_admin';
  products: any[];
  allProducts: any[];
  categories: any[];
  onCreateProduct: (product: any) => Promise<boolean>;
  onUpdateProduct: (productCode: string, product: any) => Promise<boolean>;
  onDeleteProduct: (productCode: string) => Promise<boolean>;
}

const Inventory: React.FC<InventoryProps> = ({ adminRole, products, allProducts, categories, onCreateProduct, onUpdateProduct, onDeleteProduct }) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const productTypeLabel = adminRole === 'kiosk_admin' ? 'kiosk' : 'cv';
  const retailCategory = categories.find((category) => String(category.name || '').trim().toLowerCase() === 'retail');

  const getDefaultCategoryId = () => {
    if (retailCategory && typeof retailCategory.id !== 'undefined' && retailCategory.id !== null) {
      return String(retailCategory.id);
    }
    if (Array.isArray(categories) && categories.length > 0 && typeof categories[0].id !== 'undefined' && categories[0].id !== null) {
      return String(categories[0].id);
    }
    return 'retail';
  };

  const [newProduct, setNewProduct] = useState({ 
    id: '', 
    nama: '', 
    barcode: '',
    harga: '', 
    poin: '', 
    deskripsi: '', 
    foto: '',
    product_type: productTypeLabel,
    category_id: getDefaultCategoryId()
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

  const filteredProducts = products.filter(p => 
    (p.nama?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (p.id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const getCategoryName = (categoryId: any) => {
    const match = categories.find((category) =>
      String(category.id) === String(categoryId) || String(category.name) === String(categoryId)
    );
    if (String(categoryId).toLowerCase() === 'retail') return 'Retail';
    const categoryName = match?.name || String(categoryId || 'Retail');
    return productTypeLabel === 'cv' ? 'Retail' : categoryName;
  };

  const handleGenerateDesc = async (name: string) => {
    if (!name) return;
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: `Buat deskripsi singkat pemasaran untuk produk retail bernama: ${name}. Gunakan bahasa Indonesia yang menarik.` }] }],
      });
      setNewProduct(prev => ({ ...prev, deskripsi: response.text || '' }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  // PERBAIKAN: Compress image sebelum convert ke base64 untuk hindari packet size error
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize jika lebih dari 800px
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
            // Compress dengan quality 0.7 (70%)
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

  const handleBarcodeExtraction = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: file.type, data: base64 } },
            { text: "Extract the barcode number from this image. Return ONLY the number." }
          ]
        }],
      });
      const barcode = response.text?.trim().replace(/[^0-9]/g, '');
      if (barcode) {
        setNewProduct(prev => ({ ...prev, barcode }));
      } else {
        alert("Barcode tidak terdeteksi. Pastikan gambar jelas.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memproses gambar.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const selectedCategory = categories.find((category) => String(category.id) === String(newProduct.category_id)) || retailCategory;
      const categoryCode = String(selectedCategory?.name || 'Retail').trim();

      const productData = {
        ...newProduct,
        harga: Number(newProduct.harga),
        poin: Number(newProduct.poin),
        product_type: newProduct.product_type || productTypeLabel,
        category_id: Number(isNaN(Number(newProduct.category_id)) ? (selectedCategory?.id ?? 1) : Number(newProduct.category_id)),
        category_code: categoryCode || (String(newProduct.category_id).toLowerCase() === 'retail' ? 'Retail' : undefined),
      };

      let success = false;
      if (isEditing) {
        success = await onUpdateProduct(productData.id, productData);
      } else {
        success = await onCreateProduct(productData);
      }

      if (success) setIsModalOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      const message = err instanceof Error ? err.message : 'Gagal menyimpan produk.';
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const processDelete = async (id: string) => {
    console.log("Attempting to delete product with ID:", id);
    try {
      const success = await onDeleteProduct(id);
      if (success) setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete error:', err);
      const message = err instanceof Error ? err.message : 'Gagal menghapus produk.';
      alert(message);
    }
  };

  const openEditModal = (product: any) => {
    const categoryKey = String(product.category_code || product.category_name || '').trim();
    const matchedCategoryId = categories.find((c) => String(c.name) === categoryKey)?.id ?? product.category_id ?? '1';
    const retailCategoryId = categories.find((c) => String(c.name || '').trim().toLowerCase() === 'retail')?.id ?? matchedCategoryId;

    setNewProduct({
      id: product.id || '',
      nama: product.nama || '',
      barcode: product.barcode || '',
      harga: String(product.harga || ''),
      poin: String(product.poin || ''),
      deskripsi: product.deskripsi || '',
      foto: product.foto || '',
        product_type: product.product_type || productTypeLabel,
        category_id: String(productTypeLabel === 'cv' ? retailCategoryId : matchedCategoryId || '1')
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Kelola katalog produk sesuai database Google Sheet Anda.</p>
        </div>
        <button onClick={() => { 
          setIsEditing(false); 
          setNewProduct({ id: getNextProductCode(), nama: '', barcode: '', harga: '', poin: '', deskripsi: '', foto: '', product_type: productTypeLabel, category_id: getDefaultCategoryId() });
          setIsModalOpen(true); 
        }} className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100">
          <Plus size={20} />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Cari ID atau Nama Produk..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4">Total: {filteredProducts.length} Produk</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Harga & Poin</th>
                <th className="px-6 py-4">Product Type</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.map((p, idx) => {
                const isDeleting = deleteConfirmId === p.id;

                return (
                  <tr key={`${p.id}-${idx}`} className={`transition-colors group ${isDeleting ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={p.foto || 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=100'} alt="" className="w-10 h-10 rounded-lg object-cover border bg-slate-100" />
                        <div>
                          <p className="font-bold text-slate-800">{p.nama}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-400 font-mono uppercase">{p.id}</p>
                            {p.barcode && <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded font-mono">#{p.barcode}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                        {getCategoryName(p.category_code ?? p.category_name ?? p.category_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">Rp {Number(p.harga).toLocaleString()}</p>
                      <p className="text-[10px] text-amber-600 font-bold flex items-center"><Star size={10} className="mr-0.5 fill-amber-600" /> {p.poin} Pts</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-[10px] font-bold uppercase">{p.product_type || 'cv'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isDeleting ? (
                        <div className="flex items-center justify-end space-x-2 animate-in fade-in zoom-in-95 duration-200">
                          <button 
                            onClick={() => processDelete(p.id)}
                            className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700 shadow-sm"
                          >
                            Ya, Hapus
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-300"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditModal(p)} 
                            title="Edit" 
                            className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(p.id)} 
                            title="Hapus" 
                            className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                       <Search size={32} className="opacity-20" />
                       <p className="font-medium">Tidak ada produk ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600 text-white rounded-xl">
                   {isEditing ? <Edit3 size={18} /> : <Plus size={18} />}
                </div>
                <h3 className="font-bold text-slate-800">{isEditing ? 'Update Product' : 'Add New Product'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Tag size={10} /> SKU / Code</label>
                  <input required placeholder="Contoh: PRD-001" disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500 transition-all" value={newProduct.id} onChange={(e) => setNewProduct({...newProduct, id: e.target.value})} />
                  <p className="text-[9px] text-slate-400">Kode dibuat otomatis berdasarkan data terakhir.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">Nama Produk</label>
                  <input required placeholder="Nama barang..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all" value={newProduct.nama} onChange={(e) => setNewProduct({...newProduct, nama: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
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
                <p className="text-[9px] text-slate-400">Tambah kategori baru di tabel categories, dropdown ini akan ikut muncul.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">Barcode (GTIN/EAN)</label>
                <div className="flex gap-2">
                  <input 
                    placeholder="Masukkan atau scan barcode..." 
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono" 
                    value={newProduct.barcode} 
                    onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})} 
                  />
                  <label className="cursor-pointer bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm">
                    {loadingAi ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    <span className="text-xs font-bold whitespace-nowrap">Foto Barcode</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBarcodeExtraction} disabled={loadingAi} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harga (Rp)</label>
                  <input required type="number" placeholder="0" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" value={newProduct.harga} onChange={(e) => setNewProduct({...newProduct, harga: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cashback Reward</label>
                  <input type="number" placeholder="0" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" value={newProduct.poin} onChange={(e) => setNewProduct({...newProduct, poin: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Type (Readonly)</label>
                <input
                  readOnly
                  value={newProduct.product_type}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><LinkIcon size={10} /> Foto Produk</label>
                <div className="space-y-3">
                  {/* Tab untuk URL atau Upload */}
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors text-xs font-bold text-slate-600">
                      <input type="radio" name="photoMethod" value="url" checked={newProduct.foto?.startsWith('http') || !newProduct.foto?.includes(',') ? true : false} onChange={() => {}} className="w-4 h-4" />
                      Link URL
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors text-xs font-bold text-slate-600">
                      <input type="radio" name="photoMethod" value="upload" checked={newProduct.foto?.includes(',') ? true : false} onChange={() => {}} className="w-4 h-4" />
                      Upload Folder
                    </label>
                  </div>

                  {/* Input URL */}
                  <div className="flex gap-2">
                    <input 
                      placeholder="https://example.com/image.jpg" 
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all" 
                      value={newProduct.foto?.startsWith('http') ? newProduct.foto : ''} 
                      onChange={(e) => setNewProduct({...newProduct, foto: e.target.value})} 
                    />
                  </div>

                  {/* File Upload */}
                  <label className="cursor-pointer block">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setNewProduct({...newProduct, foto: compressed});
                          } catch (error) {
                            console.error('Compress error:', error);
                            alert('Gagal memproses gambar. Coba gambar lain.');
                          }
                        }
                      }}
                    />
                    <div className="px-4 py-3 bg-orange-50 border-2 border-dashed border-orange-200 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors">
                      <ImageIcon size={18} className="text-orange-600" />
                      <span className="text-sm font-semibold text-orange-700">Klik untuk upload foto dari folder</span>
                    </div>
                  </label>
                </div>

                {/* Preview */}
                {newProduct.foto && (
                  <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                    <img src={newProduct.foto} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid')} />
                  </div>
                )}
                
                <p className="text-[9px] text-slate-400 font-medium">Upload dari folder atau gunakan URL gambar publik. Gambar akan disimpan sebagai base64.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi Pemasaran</label>
                  <button type="button" onClick={() => handleGenerateDesc(newProduct.nama)} className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-orange-100 transition-colors">
                    {loadingAi ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Auto-Generate AI
                  </button>
                </div>
                <textarea rows={3} placeholder="Ceritakan tentang produk ini..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" value={newProduct.deskripsi} onChange={(e) => setNewProduct({...newProduct, deskripsi: e.target.value})} />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSaving} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50">
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                  {isEditing ? 'Perbarui Data Produk' : 'Simpan Produk ke Cloud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Inventory;
