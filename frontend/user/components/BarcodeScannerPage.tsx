
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Barcode, ShoppingCart, Package, RefreshCw, Loader2, CreditCard } from 'lucide-react';
import { CartItem } from '../types';
import { getCvProductByBarcode, getCvProducts, toCatalogProduct } from '../src/cvApiService';

interface BarcodeScannerPageProps {
  onBack: () => void;
  onFinish: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const BarcodeScannerPage: React.FC<BarcodeScannerPageProps> = ({ 
  onBack, 
  onFinish, 
  cart, 
  setCart
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string>("Inisialisasi...");
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    setStatusMsg("Sync Katalog...");
    try {
      const products = await getCvProducts();
      const normalized = products.map(toCatalogProduct);
      setProductsList(normalized);
      setStatusMsg(normalized.length > 0 ? "Siap Scan" : "Katalog Kosong");
    } catch (err) {
      console.error("Fetch failed", err);
      setStatusMsg("Gagal memuat katalog backend");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProductToCart = (product: any) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, {
        id: product.id,
        name: product.nama,
        price: product.harga,
        quantity: 1,
        points: product.poin,
        imageUrl: product.foto
      }];
    });
  };

  const handleScanByBarcode = async () => {
    if (isProcessing) return;

    const cleanBarcode = barcodeInput.trim();
    if (!cleanBarcode) {
      alert('Masukkan barcode dulu sebelum scan.');
      return;
    }
    
    setIsProcessing(true);
    setStatusMsg("Memindai...");

    try {
      const foundProduct = await getCvProductByBarcode(cleanBarcode);
      const normalizedProduct = toCatalogProduct(foundProduct);
      addProductToCart(normalizedProduct);
      setStatusMsg("Berhasil!");
      setBarcodeInput('');
      setTimeout(() => setStatusMsg("Siap Scan"), 1500);
    } catch (error) {
      console.error('Barcode scan error:', error);
      const friendlyMessage = error instanceof Error
        ? error.message
        : 'Barcode tidak ditemukan. Pastikan barcode benar atau gunakan mode AI.';
      setStatusMsg("Barcode Tidak Ditemukan");
      alert(friendlyMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateScan = () => {
    if (productsList.length === 0 || isProcessing) return;
    const randomProduct = productsList[Math.floor(Math.random() * productsList.length)];
    addProductToCart(randomProduct);
    setStatusMsg("Berhasil!");
    setTimeout(() => setStatusMsg("Siap Scan"), 1200);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] flex flex-col lg:flex-row overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Main Scanner Area */}
      <div className="flex-1 flex flex-col bg-slate-50 relative overflow-y-auto lg:overflow-hidden">
        <div className="p-4 md:p-6 flex justify-between items-center z-10">
          <button onClick={onBack} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl text-slate-700 font-bold shadow-sm border border-white text-xs md:text-sm">
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={fetchProducts} className="p-2 bg-white/80 backdrop-blur-md rounded-xl text-slate-400 hover:text-[#F97316] shadow-sm border border-white transition-colors">
              <RefreshCw size={18} className={isLoadingProducts ? 'animate-spin' : ''} />
            </button>
            <div className="px-3 md:px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[8px] md:text-xs uppercase tracking-widest">
              Scanner Mode
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center py-10 lg:py-0">
          <div className="relative mb-8 md:mb-12">
            <div className={`w-56 h-56 md:w-72 md:h-72 bg-white rounded-[40px] md:rounded-[56px] vision-shadow flex flex-col items-center justify-center border-4 ${isProcessing ? 'border-[#F97316]' : 'border-transparent'} transition-all duration-300 relative overflow-hidden`}>
              <div className="scan-line !bg-[#F97316]/20" />
              <Barcode size={80} className={isProcessing ? 'text-[#F97316] animate-pulse' : 'text-slate-300 md:hidden'} />
              <Barcode size={120} className={isProcessing ? 'text-[#F97316] animate-pulse' : 'text-slate-300 hidden md:block'} />
              <div className="mt-4 md:mt-6 text-[8px] md:text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">{statusMsg}</div>
            </div>
            {cart.length > 0 && (
              <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-10 h-10 md:w-14 md:h-14 bg-[#F97316] rounded-full flex items-center justify-center text-white font-black text-base md:text-xl shadow-2xl border-4 border-white animate-in zoom-in duration-300">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </div>
            )}
          </div>

          <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 md:mb-3 tracking-tight">Scan Barcode Anda</h2>
          <p className="text-sm md:text-base text-slate-400 mb-8 md:mb-12 max-w-xs leading-relaxed">Dekatkan barcode produk ke sensor pemindai di depan Anda.</p>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            <input
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Masukkan barcode produk"
              className="w-full py-3 px-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 focus:outline-none focus:border-[#F97316]"
            />
            <button 
              onClick={handleScanByBarcode}
              disabled={isLoadingProducts || isProcessing}
              className="group py-4 md:py-5 bg-[#F97316] border-2 border-[#F97316] rounded-[24px] md:rounded-[32px] font-black text-sm md:text-base text-white hover:bg-[#EA580C] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Barcode size={20} className="group-hover:scale-110 transition-transform" />}
              Scan by Barcode
            </button>
            <button 
              onClick={handleSimulateScan}
              disabled={isLoadingProducts || isProcessing}
              className="group py-4 md:py-5 bg-white border-2 border-slate-200 rounded-[24px] md:rounded-[32px] font-black text-sm md:text-base text-slate-600 hover:border-[#F97316] hover:text-[#F97316] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Barcode size={20} className="group-hover:scale-110 transition-transform" />}
              Simulasi Scan Barang
            </button>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-[480px] bg-white flex flex-col z-30 shadow-[-40px_0_80px_rgba(0,0,0,0.05)] border-t lg:border-t-0 lg:border-l border-slate-100 max-h-[55vh] lg:max-h-full">
        <div className="p-4 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#F97316]/10 rounded-xl md:rounded-2xl flex items-center justify-center text-[#F97316]">
              <ShoppingCart size={24} />
            </div>
            <div>
               <h2 className="text-slate-900 font-black text-lg md:text-xl tracking-tight">Keranjang</h2>
               <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">Scanner Terhubung</p>
            </div>
          </div>
          <div className="px-3 md:px-4 py-1 md:py-1.5 bg-slate-900 rounded-full text-white font-black text-[8px] md:text-[10px] uppercase tracking-widest">
            {cart.length} ITEMS
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 bg-white">
          {cart.length === 0 ? (
            <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 opacity-40">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 rounded-[32px] md:rounded-[40px] flex items-center justify-center border-2 border-dashed border-slate-200">
                <Package size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">Belum ada barang</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="group relative bg-white border border-slate-100 p-4 md:p-5 rounded-[24px] md:rounded-[32px] flex items-center gap-4 md:gap-5 transition-all hover:shadow-xl">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-105 transition-transform">
                   {item.imageUrl ? (
                     <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "")} />
                   ) : (
                     <Barcode size={20} className="text-slate-200" />
                   )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-900 font-black text-xs md:text-sm leading-tight truncate">{item.name}</h4>
                  <p className="text-[#F97316] font-black text-[10px] md:text-xs mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg md:rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest">Qty</span>
                  <span className="font-black text-slate-900 text-[10px] md:text-xs">{item.quantity}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 pb-10 md:p-8 bg-slate-900 text-white rounded-t-[32px] md:rounded-t-[40px] shadow-2xl">
          <div className="flex justify-between items-center mb-6 md:mb-8">
             <div className="space-y-0.5">
                <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.3em]">Total Bayar</p>
                <p className="text-white font-black text-2xl md:text-3xl tracking-tighter">Rp {subtotal.toLocaleString('id-ID')}</p>
             </div>
             <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center">
                <CreditCard size={20} className="text-blue-400" />
             </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={onFinish}
            className="w-full py-4 md:py-5 bg-[#F97316] hover:bg-[#EA580C] disabled:bg-white/10 disabled:text-white/20 text-white rounded-[24px] md:rounded-[28px] font-black text-[10px] md:text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerPage;
