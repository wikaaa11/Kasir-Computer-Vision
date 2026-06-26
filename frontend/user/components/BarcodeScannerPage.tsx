import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Barcode,
  ShoppingCart,
  Package,
  Loader2,
  CreditCard,
  Scan,
  Trash2,
} from 'lucide-react';
import { CartItem } from '../types';
import {
  getCvProductByBarcode,
  getCvProducts,
  toCatalogProduct,
} from '../src/cvApiService';

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
  setCart,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('Inisialisasi...');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const cartPanelRef = useRef<HTMLDivElement>(null);

  const fetchProducts = async () => {
    setStatusMsg('Sync Katalog...');

    try {
      const products = await getCvProducts();
      const normalized = products.map(toCatalogProduct);

      setStatusMsg(normalized.length > 0 ? 'Siap Scan' : 'Katalog Kosong');
    } catch (err) {
      console.error('Fetch failed', err);
      setStatusMsg('Gagal memuat katalog backend');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const addProductToCart = (product: any) => {
    setCart((prev) => {
      const productName = product.name || product.nama || 'Produk';
      const productPrice = Number(product.price || product.harga || 0);
      const productPoints = Number(
        product.cashbackReward || product.points || product.poin || 0
      );
      const productImage =
        product.image_url || product.imageUrl || product.foto || '';

      const existingIdx = prev.findIndex(
        (item) => item.id === product.id || item.name === productName
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }

      return [
        ...prev,
        {
          id: product.id || Math.random().toString(),
          name: productName,
          price: productPrice,
          quantity: 1,
          points: productPoints,
          imageUrl: productImage,
        },
      ];
    });
  };

  const updateQuantity = (idx: number, quantity: number) => {
    setCart((prev) => {
      const updated = [...prev];

      if (quantity <= 0) {
        return updated.filter((_, i) => i !== idx);
      }

      updated[idx].quantity = quantity;
      return updated;
    });
  };

  const removeCartItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleScanByBarcode = async (barcodeValue?: string) => {
    if (isProcessing) return;

    const cleanBarcode = String(barcodeValue || barcodeInput).trim();

    if (!cleanBarcode) return;

    setIsProcessing(true);
    setStatusMsg('Memindai...');

    try {
      const foundProduct = await getCvProductByBarcode(cleanBarcode);
      const normalizedProduct = toCatalogProduct(foundProduct);

      addProductToCart(normalizedProduct);

      setStatusMsg('Berhasil masuk keranjang!');
      setBarcodeInput('');

      setTimeout(() => {
        cartPanelRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        barcodeInputRef.current?.focus();
        setStatusMsg('Siap Scan');
      }, 300);
    } catch (error) {
      console.error('Barcode scan error:', error);

      const friendlyMessage =
        error instanceof Error
          ? error.message
          : 'Barcode tidak ditemukan. Pastikan barcode benar atau gunakan mode AI.';

      setStatusMsg('Barcode Tidak Ditemukan');
      alert(friendlyMessage);

      setBarcodeInput('');

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 300);
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalPoints = cart.reduce(
    (sum, item) => sum + ((item.points || 0) * item.quantity),
    0
  );

  return (
    <div
      className="fixed inset-0 bg-[#F8FAFC] flex flex-col lg:flex-row overflow-hidden font-['Plus_Jakarta_Sans']"
      onClick={() => barcodeInputRef.current?.focus()}
    >
      <input
        ref={barcodeInputRef}
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleScanByBarcode(e.currentTarget.value);
          }
        }}
        autoFocus
        className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none"
      />

      <div className="flex-1 flex flex-col bg-slate-50 relative overflow-y-auto lg:overflow-hidden">
        <div className="p-4 md:p-6 flex justify-between items-center z-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl text-slate-700 font-bold shadow-sm border border-white text-xs md:text-sm"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center py-10 lg:py-0">
          <div className="relative mb-8 md:mb-12">
            <div
              className={`w-56 h-56 md:w-72 md:h-72 bg-white rounded-[40px] md:rounded-[56px] vision-shadow flex flex-col items-center justify-center border-4 ${
                isProcessing ? 'border-[#F97316]' : 'border-transparent'
              } transition-all duration-300 relative overflow-hidden`}
            >
              <div className="scan-line !bg-[#F97316]/20" />

              {isProcessing ? (
                <Loader2 size={96} className="text-[#F97316] animate-spin" />
              ) : (
                <>
                  <Barcode size={80} className="text-slate-300 md:hidden" />
                  <Barcode
                    size={120}
                    className="text-slate-300 hidden md:block"
                  />
                </>
              )}

              <div className="mt-4 md:mt-6 text-[8px] md:text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">
                {statusMsg}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-10 h-10 md:w-14 md:h-14 bg-[#F97316] rounded-full flex items-center justify-center text-white font-black text-base md:text-xl shadow-2xl border-4 border-white animate-in zoom-in duration-300">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </div>
            )}
          </div>

          <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 md:mb-3 tracking-tight">
            Scan Barcode Anda
          </h2>

          <p className="text-sm md:text-base text-slate-400 max-w-xs leading-relaxed">
            Arahkan scanner ke barcode produk. Produk akan otomatis masuk ke
            keranjang.
          </p>
        </div>
      </div>

      <div
        ref={cartPanelRef}
        className="w-full lg:w-[520px] bg-white flex flex-col z-30 shadow-[-40px_0_80px_rgba(0,0,0,0.05)] border-t lg:border-t-0 lg:border-l border-slate-100 max-h-[55vh] lg:max-h-full"
      >
        <div className="p-6 md:p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-[#F97316]/10 rounded-xl md:rounded-[22px] flex items-center justify-center text-[#F97316]">
              <ShoppingCart size={28} />
            </div>

            <div>
              <h2 className="text-slate-900 font-black text-lg md:text-2xl tracking-tight">
                Keranjang
              </h2>
              <p className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
                Database Terhubung
              </p>
            </div>
          </div>

          <div className="px-3 md:px-5 py-1.5 md:py-2 bg-slate-900 rounded-full text-white font-black text-[9px] md:text-[11px] uppercase tracking-widest">
            {cart.length} ITEMS
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 md:space-y-6 bg-white">
          {cart.length === 0 ? (
            <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 opacity-40">
              <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-50 rounded-[32px] md:rounded-[48px] flex items-center justify-center border-2 border-dashed border-slate-200">
                <Package size={48} className="text-slate-200" />
              </div>

              <p className="text-slate-900 font-black text-sm md:text-base uppercase tracking-[0.2em]">
                Keranjang Kosong
              </p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="group relative bg-white border border-slate-100 p-4 md:p-6 rounded-[24px] md:rounded-[36px] flex items-center gap-4 md:gap-6 transition-all hover:shadow-2xl"
              >
                <div className="w-14 h-14 md:w-20 md:h-20 bg-slate-50 rounded-xl md:rounded-[24px] overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '';
                      }}
                    />
                  ) : (
                    <Scan size={24} className="text-slate-200" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-900 font-black text-sm md:text-base leading-tight truncate">
                    {item.name}
                  </h4>
                  <p className="text-[#F97316] font-black text-[10px] md:text-sm mt-1">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <div className="flex items-center gap-2 md:gap-3 bg-slate-50 border border-slate-100 px-2.5 md:px-3 py-1.5 rounded-xl md:rounded-2xl">
                    <button
                      onClick={() => updateQuantity(idx, item.quantity - 1)}
                      className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm md:text-base transition-all"
                    >
                      −
                    </button>

                    <span className="font-black text-slate-900 text-sm md:text-base min-w-[20px] text-center">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                      className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-sm md:text-base transition-all"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeCartItem(idx)}
                    className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 transition-all"
                    title="Hapus produk"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 pb-10 md:p-10 bg-slate-900 text-white rounded-t-[32px] md:rounded-t-[50px] shadow-2xl">
          <div className="flex justify-between items-end mb-6 md:mb-10">
            <div className="space-y-0.5 md:space-y-1">
              <p className="text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">
                Total
              </p>
              <p className="text-white font-black text-2xl md:text-4xl tracking-tighter">
                Rp {subtotal.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="text-right">
              <p className="text-blue-300 font-black text-[8px] md:text-[10px] uppercase tracking-widest mb-0.5 md:mb-1">
                Cashback
              </p>
              <p className="text-white font-black text-base md:text-xl">
                +{totalPoints} pts
              </p>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={onFinish}
            className="w-full py-4 md:py-6 bg-[#F97316] hover:bg-[#EA580C] disabled:bg-white/10 disabled:text-white/20 text-white rounded-[24px] md:rounded-[32px] font-black text-[10px] md:text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 md:gap-4 active:scale-[0.98]"
          >
            <CreditCard size={22} />
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerPage;