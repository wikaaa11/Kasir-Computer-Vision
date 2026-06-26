
import React, { useRef, useEffect, useState } from 'react';
import { Camera, ShoppingCart, Trash2, CreditCard, Loader2, BrainCircuit, Scan, ShieldCheck, AlertCircle, RefreshCw, Package, Sparkles, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';
import { getCvProducts, toCatalogProduct } from '../src/cvApiService';

const DETECT_API_URL = `${import.meta.env.VITE_DETECT_API_URL || 'http://localhost:8000'}/detect`;
const CATALOG_CACHE_KEY = 'visionpos_catalog_cache_v1';
const ANALYZE_MAX_WIDTH = 1280;
const ANALYZE_JPEG_QUALITY = 0.75;

const readCatalogCache = (): any[] => {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCatalogCache = (catalog: any[]) => {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catalog));
  } catch {
    // Ignore cache write errors (quota/private mode)
  }
};

interface VisionPOSProps {
  onCheckout: (items: CartItem[]) => void;
  onBack: () => void;
}

const VisionPOS: React.FC<VisionPOSProps> = ({ onCheckout, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string>("Inisialisasi...");
  const [showError, setShowError] = useState(false);
  const [errorHint, setErrorHint] = useState<string>("Tidak ada di Katalog");
  const [lastDetected, setLastDetected] = useState<string>("");
  const [scanAccuracy, setScanAccuracy] = useState<number | null>(null);

  const getPrimaryCatalogProduct = () => {
    const preferred = productsList.find((product) => {
      const productName = String(product.nama || product.name || '').toLowerCase();
      return productName.includes('indomie');
    });

    return preferred || productsList[0] || null;
  };

  const primaryCatalogProduct = getPrimaryCatalogProduct();
  const primaryCatalogLabel = String(primaryCatalogProduct?.nama || primaryCatalogProduct?.name || 'Produk DB');

  // PERBAIKAN: Fungsi penambah keranjang yang lebih pintar (Bisa baca English/Indo)
  const addProductToCart = (product: any, quantity = 1) => {
    setCart(prev => {
      const productName = product.name || product.nama || 'Produk';
      const idx = prev.findIndex(i => i.id === product.id || i.name === productName);
      
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += quantity;
        return updated;
      }
      
      return [
        ...prev,
        {
          id: product.id || Math.random().toString(),
          name: productName,
          price: Number(product.price || product.harga || 0),
          quantity,
          points: Number(product.cashbackReward || product.points || product.poin || 0),
          imageUrl: product.image_url || product.imageUrl || product.foto || ''
        }
      ];
    });
  };

  const updateQuantity = (idx: number, quantity: number) => {
    setCart(prev => {
      const updated = [...prev];
      if (quantity <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      updated[idx].quantity = quantity;
      return updated;
    });
  };

  const stopCamera = () => {
    console.log("📹 Stopping camera stream...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`  - Stopping track: ${track.kind} (${track.enabled ? 'enabled' : 'disabled'})`);
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    console.log("✅ Camera stopped");
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    setStatusMsg("Sync Katalog...");
    try {
      const products = await getCvProducts();
      const normalized = products.map(toCatalogProduct);
      setProductsList(normalized);
      if (normalized.length > 0) {
        writeCatalogCache(normalized);
      }
      setStatusMsg(normalized.length > 0 ? "Katalog Aktif" : "Katalog Kosong");
    } catch (err) {
      console.error("Fetch failed", err);
      const cachedCatalog = readCatalogCache();
      if (cachedCatalog.length > 0) {
        setProductsList(cachedCatalog);
        setStatusMsg("Offline: Pakai Cache");
      } else {
        setStatusMsg("Gagal memuat produk dari backend pusat");
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatusMsg("Browser tidak mendukung kamera");
      setCameraError("not-supported");
      return;
    }

    const constraints = {
      video: { 
        facingMode: { ideal: 'environment' }, 
        width: { ideal: 1920 }, 
        height: { ideal: 1080 } 
      }
    };

    try {
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play error:", e));
        };
      }
    } catch (err) {
      console.error("Camera error", err);
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setCameraError('permission-denied');
        setStatusMsg("Izin Kamera Ditolak");
        return;
      }
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Video play error:", e));
          };
        }
      } catch (fallbackErr) {
        console.error("Fallback camera error", fallbackErr);
        if (fallbackErr instanceof Error && (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError')) {
          setCameraError('permission-denied');
        } else {
          setCameraError('error');
        }
        setStatusMsg("Kamera Tidak Tersedia");
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    startCamera();

    // PERBAIKAN: Tambahkan Page Visibility API untuk stop camera saat tab tidak active
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("🔴 Tab hidden - stop camera");
        stopCamera();
      } else {
        console.log("🟢 Tab visible - restart camera");
        startCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      console.log("🔴 VisionPOS unmounting - stopping camera");
      stopCamera();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleCheckoutInternal = () => {
    console.log("✅ User clicked checkout");
    stopCamera();
    onCheckout(cart);
  };

  const handleAddDbProduct = () => {
    const dbProduct = getPrimaryCatalogProduct();

    if (!dbProduct) {
      setStatusMsg('Produk belum ada di database');
      setErrorHint('Belum ada produk di katalog backend.');
      setShowError(true);
      setScanAccuracy(0);
      return;
    }

    addProductToCart(dbProduct, 1);
    setLastDetected(String(dbProduct.nama || dbProduct.name || primaryCatalogLabel));
    setScanAccuracy(100);
    setStatusMsg(`${primaryCatalogLabel} dari database ditambahkan`);
    setShowError(false);
    setTimeout(() => setStatusMsg('Siap Scan'), 1500);
    setTimeout(() => setLastDetected(''), 2500);
  };

  const handleBackInternal = () => {
    console.log("👈 User clicked back button");
    stopCamera();
    onBack();
  };

  const calculateDetectionAccuracy = (detected: any[]) => {
    if (detected.length === 0) return 0;

    const perItemScores = detected.map((item) => {
      const detectedName = String(item.name || '').toLowerCase().trim();
      const matchedProduct = productsList.find(
        (p) =>
          (item.id && p.id === item.id) ||
          p.nama.toLowerCase().trim() === detectedName || 
          p.name?.toLowerCase().trim() === detectedName // Antisipasi key name
      );

      if (!matchedProduct) return 0;

      let score = 0;

      const idMatches = item.id && matchedProduct.id === item.id;
      const nameMatches = matchedProduct.nama.toLowerCase().trim() === detectedName || matchedProduct.name?.toLowerCase().trim() === detectedName;
      const priceMatches = Number(item.price) === Number(matchedProduct.harga || matchedProduct.price);
      const pointsMatches = Number(item.points || 0) === Number(matchedProduct.poin || matchedProduct.points || matchedProduct.cashbackReward || 0);

      if (idMatches || nameMatches) score += 50;
      if (priceMatches) score += 30;
      if (pointsMatches) score += 20;

      return score;
    });

    const avgScore = perItemScores.reduce((sum, value) => sum + value, 0) / perItemScores.length;
    return Math.max(0, Math.min(100, Math.round(avgScore)));
  };

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing || isLoadingProducts) return;
    
    setIsAnalyzing(true);
    setShowError(false);
    setErrorHint("Tidak ada di Katalog");
    setStatusMsg("Menganalisis...");
    setScanAccuracy(null);
    let shouldResetToReady = true;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const sourceWidth = video.videoWidth || 1280;
    const sourceHeight = video.videoHeight || 720;
    const targetWidth = Math.min(sourceWidth, ANALYZE_MAX_WIDTH);
    const targetHeight = Math.round((targetWidth / sourceWidth) * sourceHeight);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    const base64Image = canvas.toDataURL('image/jpeg', ANALYZE_JPEG_QUALITY).split(',')[1];

    try {
      const response = await fetch(DETECT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Image,
          catalog: productsList,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend detect failed: ${response.status}`);
      }

      const payload = await response.json();
      const detected: any[] = Array.isArray(payload?.detections) ? payload.detections : [];
      const diagnostics = payload?.diagnostics || {};

      if (detected.length > 0) {
        setScanAccuracy(calculateDetectionAccuracy(detected));

        // DEBUG: Log apa yang di-return backend
        console.log("📦 Raw detections dari backend:", detected);

        // PERBAIKAN: Dedup hasil deteksi berdasarkan ID/name untuk menghindari duplikat
        const deduped: { [key: string]: any } = {};
        detected.forEach(item => {
          const key = item.id || String(item.name || '').toLowerCase();
          if (deduped[key]) {
            deduped[key].quantity = (deduped[key].quantity || 1) + (item.quantity || 1);
          } else {
            deduped[key] = { ...item, quantity: item.quantity || 1 };
          }
        });

        console.log("🔄 Setelah dedup:", Object.values(deduped));

        Object.values(deduped).forEach(item => {
          const originalProduct = productsList.find(
            p => p.id === item.id || 
                 p.nama.toLowerCase() === String(item.name || '').toLowerCase() ||
                 (p.name && p.name.toLowerCase() === String(item.name || '').toLowerCase())
          );
          if (originalProduct) {
            console.log(`➕ Menambahkan ${originalProduct.name} qty=${item.quantity}`);
            addProductToCart(originalProduct, item.quantity || 1);
          } else {
            // PERBAIKAN: Sesuaikan dengan key bahasa Inggris juga di fallback ini
            console.log(`➕ Menambahkan fallback ${item.name} qty=${item.quantity}`);
            addProductToCart({
              id: item.id,
              name: item.name,
              price: item.price,
              points: item.points,
              imageUrl: ''
            }, item.quantity || 1);
          }
        });
        setLastDetected(Object.values(deduped).map((d: any) => d.name).join(", "));
        setStatusMsg("Produk Ok!");
        setTimeout(() => setLastDetected(""), 3000);
      } else {
        setScanAccuracy(0);
        if (diagnostics?.modelReady === false) {
          setErrorHint("Model YOLO backend belum aktif. Install dependency YOLO/torch lalu restart backend.");
          setStatusMsg("Model Belum Aktif");
          setShowError(true);
          return;
        }
        const rawLabels: string[] = Array.isArray(diagnostics?.rawLabels) ? diagnostics.rawLabels : [];
        if (rawLabels.length === 0) {
          setErrorHint("Produk belum terbaca. Dekatkan produk ke kamera, posisikan di tengah frame, lalu scan ulang.");
        } else {
          setErrorHint("Produk belum terbaca dengan jelas. Dekatkan ke kamera, pastikan pencahayaan cukup, lalu scan ulang.");
        }
        setStatusMsg("Tidak Dikenali");
        setShowError(true);
      }
    } catch (error) {
      console.error("Detection Error:", error);
      setScanAccuracy(0);
      setStatusMsg("Error Deteksi");
      setErrorHint("Backend deteksi tidak tersedia. Coba mode barcode.");
      setShowError(true);
    } finally {
      setIsAnalyzing(false);
      if (shouldResetToReady) {
        setTimeout(() => setStatusMsg("Siap Scan"), 2000);
      }
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalPoints = cart.reduce((sum, item) => sum + ((item.points || 0) * item.quantity), 0);
  
  return (
    <div className="fixed inset-0 bg-[#F8FAFC] flex flex-col lg:flex-row overflow-hidden font-['Plus_Jakarta_Sans']">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex-1 relative flex flex-col bg-white overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]" />

        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-3 md:gap-4 bg-white/90 backdrop-blur-xl p-3 md:p-4 rounded-[20px] md:rounded-[28px] shadow-2xl border border-white z-20 pointer-events-auto max-w-[240px] md:max-w-none">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#F97316] rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="text-white" size={22} />
          </div>
          <div className="pr-2 md:pr-4">
            <h1 className="text-slate-900 font-black text-sm md:text-xl tracking-tighter uppercase leading-none">Reminder!</h1>
            <p className="text-[#F97316] text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase mt-1">
              Arahkan barang ke kamera satu per satu
            </p>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none border-[16px] md:border-[32px] border-white/20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[480px] md:h-[480px]">
             <div className="absolute top-0 left-0 w-16 h-16 md:w-24 md:h-24 border-t-[4px] md:border-t-[8px] border-l-[4px] md:border-l-[8px] border-[#F97316] rounded-tl-[30px] md:rounded-tl-[50px] opacity-60" />
             <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 border-t-[4px] md:border-t-[8px] border-r-[4px] md:border-r-[8px] border-[#F97316] rounded-tr-[30px] md:rounded-tr-[50px] opacity-60" />
             <div className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 border-b-[4px] md:border-b-[8px] border-l-[4px] md:border-l-[8px] border-[#F97316] rounded-bl-[30px] md:rounded-bl-[50px] opacity-60" />
             <div className="absolute bottom-0 right-0 w-16 h-16 md:w-24 md:h-24 border-b-[4px] md:border-b-[8px] border-r-[4px] md:border-r-[8px] border-[#F97316] rounded-br-[30px] md:rounded-br-[50px] opacity-60" />
          </div>
          <div className="scan-line !bg-[#F97316]/40" />
        </div>

        <button onClick={handleBackInternal} className="absolute top-4 right-4 md:top-10 md:right-10 px-4 md:px-6 py-2 md:py-3 bg-white/90 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 text-slate-700 hover:text-slate-900 shadow-xl pointer-events-auto transition-all font-bold group text-xs md:text-base">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali</span>
        </button>

        <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 md:gap-6 z-20 w-full px-6 md:px-12">
          {lastDetected && (
            <div className="bg-green-500 text-white px-6 md:px-10 py-3 md:py-4 rounded-full flex items-center gap-2 md:gap-3 animate-in slide-in-from-bottom duration-500 shadow-2xl">
              <ShieldCheck size={20} />
              <span className="font-black text-[10px] md:text-sm uppercase tracking-widest">Berhasil: {lastDetected}</span>
            </div>
          )}
          
          {showError && (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-amber-500 text-white px-6 md:px-10 py-3 md:py-4 rounded-full flex items-center gap-2 md:gap-3 animate-in fade-in duration-300 shadow-2xl">
                <AlertCircle size={20} />
                <span className="font-black text-[10px] md:text-sm uppercase tracking-widest">{errorHint}</span>
              </div>
            </div>
          )}

          <button 
            onClick={analyzeFrame}
            disabled={isAnalyzing || isLoadingProducts}
            className={`w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl
              ${isAnalyzing ? 'bg-slate-100 text-slate-300' : 'bg-[#F97316] hover:bg-[#EA580C] text-white ring-[10px] md:ring-[14px] ring-orange-600/10'}
            `}
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={44} /> : <Scan size={48} />}
          </button>
          
          <div className="bg-slate-900/80 backdrop-blur-xl px-6 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl border border-white/10 shadow-2xl">
             <span className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em]">{statusMsg}</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[520px] bg-white flex flex-col z-30 shadow-[-40px_0_80px_rgba(0,0,0,0.05)] border-t lg:border-t-0 lg:border-l border-slate-100 max-h-[55vh] lg:max-h-full">
        <div className="p-6 md:p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-[#F97316]/10 rounded-xl md:rounded-[22px] flex items-center justify-center text-[#F97316]">
              <ShoppingCart size={28} />
            </div>
            <div>
               <h2 className="text-slate-900 font-black text-lg md:text-2xl tracking-tight">Keranjang</h2>
               <p className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Database Terhubung</p>
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
              <p className="text-slate-900 font-black text-sm md:text-base uppercase tracking-[0.2em]">Keranjang Kosong</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="group relative bg-white border border-slate-100 p-4 md:p-6 rounded-[24px] md:rounded-[36px] flex items-center gap-4 md:gap-6 transition-all hover:shadow-2xl">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-slate-50 rounded-xl md:rounded-[24px] overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                   {item.imageUrl ? (
                     <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "")} />
                   ) : (
                     <Scan size={24} className="text-slate-200" />
                   )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-900 font-black text-sm md:text-base leading-tight truncate">{item.name}</h4>
                  <p className="text-[#F97316] font-black text-[10px] md:text-sm mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <div className="flex items-center gap-2 md:gap-3 bg-slate-50 border border-slate-100 px-2.5 md:px-3 py-1.5 rounded-xl md:rounded-2xl">
                    <button 
                      onClick={() => updateQuantity(idx, item.quantity - 1)}
                      className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm md:text-base transition-all"
                    >
                      −
                    </button>
                    <span className="font-black text-slate-900 text-sm md:text-base min-w-[20px] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                      className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-sm md:text-base transition-all"
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                    className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 transition-all"
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
                <p className="text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">Total</p>
                <p className="text-white font-black text-2xl md:text-4xl tracking-tighter">Rp {subtotal.toLocaleString('id-ID')}</p>
             </div>
             <div className="text-right">
                <p className="text-blue-300 font-black text-[8px] md:text-[10px] uppercase tracking-widest mb-0.5 md:mb-1">Cashback</p>
                <p className="text-white font-black text-base md:text-xl">+{totalPoints} pts</p>
             </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleCheckoutInternal}
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

export default VisionPOS;