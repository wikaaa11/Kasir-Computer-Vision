
import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Camera, Info, Loader2, Sparkles } from 'lucide-react';
import { CartItem } from '../types';

const DETECT_API_URL = `${import.meta.env.VITE_DETECT_API_URL || 'http://localhost:8000'}/detect`;

const PRODUCT_CATALOG = [
  { id: '1', nama: 'Tumbler with flower pattern', harga: 75000, poin: 350, kategori: 'Home' },
  { id: '2', nama: 'Black and white patterned pillow', harga: 50000, poin: 150, kategori: 'Home' },
  { id: '3', nama: 'Stainless Steel Fork', harga: 15000, poin: 50, kategori: 'Kitchen' },
  { id: '4', nama: 'Coffee Mug', harga: 35000, poin: 100, kategori: 'Kitchen' },
];

interface ScanningPageProps {
  onBack: () => void;
  onCapture: (detectedItems: CartItem[]) => void;
}

const ScanningPage: React.FC<ScanningPageProps> = ({ onBack, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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

  const setupCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Browser does not support camera");
      setCameraError("not-supported");
      return;
    }

    const constraints = {
      video: { 
        facingMode: { ideal: 'environment' }, 
        width: 1280, 
        height: 720 
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
      console.error("Camera access denied", err);
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setCameraError('permission-denied');
        return;
      }
      // Fallback
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
      }
    }
  };

  useEffect(() => {
    setupCamera();

    // PERBAIKAN: Tambahkan Page Visibility API untuk stop camera saat tab tidak active
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("🔴 Tab hidden - stop camera");
        stopCamera();
      } else {
        console.log("🟢 Tab visible - restart camera");
        setupCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      console.log("🔴 ScanningPage unmounting - stopping camera");
      stopCamera();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleBackInternal = () => {
    console.log("👈 User clicked back button");
    stopCamera();
    onBack();
  };

  const handleAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      const response = await fetch(DETECT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Image,
          catalog: PRODUCT_CATALOG,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend detect failed: ${response.status}`);
      }

      const payload = await response.json();
      const result = Array.isArray(payload?.detections) ? payload.detections : [];

      if (result.length > 0) {
        stopCamera();
        onCapture(result);
      } else {
        alert("Barang tidak dikenali. Pastikan barang ada dalam katalog dan terlihat jelas.");
      }
    } catch (error) {
      console.error("Detection Error:", error);
      alert("Backend deteksi belum tersedia. Coba lagi atau gunakan barcode.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] w-full h-screen">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="p-6 flex justify-between items-center z-10">
        <button 
          onClick={handleBackInternal}
          className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl text-slate-700 font-bold text-sm shadow-sm"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-full shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-slate-800 tracking-wider uppercase">
            AI Sensor: Aktif
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="relative w-full max-w-lg aspect-[3/4] bg-slate-900 rounded-[40px] overflow-hidden vision-shadow border-[8px] border-white">
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-[#F97316] text-white text-[10px] font-black px-4 py-1.5 rounded-b-xl uppercase tracking-tighter flex items-center gap-2">
                <Sparkles size={12} /> YOLO Vision
               </div>
            </div>

            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-all duration-500 ${isAnalyzing ? 'brightness-50 grayscale' : 'brightness-110'}`} 
            />
            
            <div className="scan-line" />
            
            <div className="absolute top-10 left-10 w-8 h-8 border-t-4 border-l-4 border-white/60 rounded-tl-lg" />
            <div className="absolute top-10 right-10 w-8 h-8 border-t-4 border-r-4 border-white/60 rounded-tr-lg" />
            <div className="absolute bottom-10 left-10 w-8 h-8 border-b-4 border-l-4 border-white/60 rounded-bl-lg" />
            <div className="absolute bottom-10 right-10 w-8 h-8 border-b-4 border-r-4 border-white/60 rounded-br-lg" />
          </>

          {isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-30">
              <Loader2 size={48} className="text-white animate-spin mb-4" />
              <p className="text-white font-black text-sm uppercase tracking-widest">Menganalisis...</p>
            </div>
          )}
        </div>
      </div>

      <div className="pb-12 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-24 h-24 bg-[#F97316] rounded-full flex items-center justify-center vision-shadow ring-8 ring-orange-50/10 transition-all active:scale-90 hover:bg-[#EA580C] disabled:bg-slate-400 disabled:ring-slate-100"
          >
            {isAnalyzing ? <Loader2 size={40} className="text-white animate-spin" /> : <Camera size={40} className="text-white" />}
          </button>
          <span className="text-sm font-black text-[#F97316] uppercase tracking-widest animate-pulse">
            {isAnalyzing ? 'Sedang Memproses' : 'Ketuk untuk Deteksi AI'}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 border border-slate-100 shadow-sm">
          <Info size={16} className="text-slate-400" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
            Arahkan kamera ke semua belanjaan Anda
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScanningPage;
