
import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, User, Package, 
  Sparkles, 
  ChevronRight, CreditCard, Tag, Loader2, RefreshCw
} from 'lucide-react';
import { CartItem, Product, Voucher } from '../types';
import { getCvProducts, toCatalogProduct } from '../src/cvApiService';

interface CashierPOSProps {
  cart: CartItem[];
  onAddToCart: (product: any) => void;
  onCheckout: () => void;
  onScanAI: () => void;
  isMember: boolean;
  memberInfo: any;
  selectedVoucher: Voucher | null;
  discountAmount: number;
}

const CashierPOS: React.FC<CashierPOSProps> = ({ 
  cart, onAddToCart, onCheckout, onScanAI,
  isMember, memberInfo, selectedVoucher, discountAmount
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const rawProducts = await getCvProducts();
      const normalized = rawProducts.map(toCatalogProduct);
      setProducts(normalized);
    } catch (error) {
      console.error("Gagal mengambil produk:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    (activeCategory === 'All' || p.kategori === activeCategory) &&
    p.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['All', ...new Set(products.map(p => p.kategori).filter(Boolean))];

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = (subtotal - discountAmount) * 0.11;
  const total = (subtotal - discountAmount) + tax;

  return (
    <div className="flex w-full h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center gap-4 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari produk..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl focus:outline-none font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchProducts}
            className="p-3 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={onScanAI}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Sparkles size={18} />
            Magic Scan
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${activeCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-bold text-sm uppercase tracking-widest">Sinkronisasi Database...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-300">
              <Package size={60} strokeWidth={1} />
              <p className="font-black text-xs uppercase tracking-widest mt-4">Produk tidak ditemukan</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => onAddToCart({
                  id: product.id,
                  name: product.nama,
                  price: product.harga,
                  points: product.poin,
                  imageUrl: product.foto
                })}
                className="bg-white p-5 rounded-[32px] border border-slate-100 hover:border-blue-500 hover:shadow-xl transition-all text-left group flex flex-col items-center gap-3 active:scale-95"
              >
                <div className="w-full aspect-square bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-50">
                  {product.foto ? (
                    <img src={product.foto} alt={product.nama} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={40} className="text-slate-200" />
                  )}
                </div>
                <div className="text-center w-full">
                  <h4 className="font-black text-slate-800 text-sm truncate px-2">{product.nama}</h4>
                  <p className="text-blue-600 font-black text-xs">Rp {product.harga.toLocaleString('id-ID')}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="w-[400px] bg-white rounded-[40px] shadow-xl border border-slate-50 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingCart size={20} />
            </div>
            <h3 className="font-black text-slate-800 text-lg">Ringkasan Pesanan</h3>
          </div>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            {cart.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
              <Package size={64} strokeWidth={1} />
              <p className="font-black text-xs uppercase tracking-widest mt-4">Keranjang Kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                <div className="flex-1">
                  <h5 className="font-bold text-slate-800 text-sm">{item.name}</h5>
                  <p className="text-xs text-blue-600 font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</span>
                  <span className="font-black text-sm">{item.quantity}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-slate-50/80 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMember ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                <User size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Customer</span>
                <span className="text-xs font-black text-slate-800">{isMember ? memberInfo.name : 'Guest'}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>

          <div className="flex justify-between items-end mb-4 pt-4 border-t border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</span>
            <span className="text-2xl font-black text-blue-600">Rp {total.toLocaleString('id-ID')}</span>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={onCheckout}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
          >
            <CreditCard size={18} />
            Bayar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashierPOS;
