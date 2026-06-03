
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Target, 
  Link as LinkIcon, 
  Search, 
  CheckCircle2, 
  Scan, 
  Loader2, 
  ArrowRight,
  AlertCircle,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface CVMonitorProps {
  products: any[];
  onSync: (products: any[]) => Promise<boolean>;
}

const CVMonitor: React.FC<CVMonitorProps> = ({ products, onSync }) => {
  const [isActive, setIsActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastMapped, setLastMapped] = useState("");
  const [selectedMapping, setSelectedMapping] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedItems, setDetectedItems] = useState<any[]>([]);

  const inventoryToMap = products.filter(p => {
    const s = searchQuery.toLowerCase();
    return (String(p.nama || '').toLowerCase().includes(s)) || (String(p.id || '').toLowerCase().includes(s)) || (String(p.category_name || '').toLowerCase().includes(s));
  });

  useEffect(() => {
    if (isActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(console.error);
    } else {
      if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  }, [isActive]);

  const performAIScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    setIsScanning(true);
    setDetectedItems([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { 
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64 } }, 
            { text: "Detect all retail products. JSON format: [{label, box_2d: [y1,x1,y2,x2]}]" }
          ] 
        },
        config: { responseMimeType: 'application/json' }
      });
      const results = JSON.parse(response.text || '[]');
      setDetectedItems(results.map((item: any, i: number) => ({
        id: `d-${i}`, label: item.label,
        y: (item.box_2d[0] / 10), x: (item.box_2d[1] / 10),
        h: ((item.box_2d[2] - item.box_2d[0]) / 10), w: ((item.box_2d[3] - item.box_2d[1]) / 10)
      })));
    } catch (err) { alert("Scan Gagal"); } finally { setIsScanning(false); }
  };

  const handleMapProduct = async (product: any) => {
    if (!selectedMapping || isSyncing) return;
    
    setIsSyncing(true);
    setLastMapped(product.nama);

    try {
      const updated = products.map(p => 
        p.id === product.id ? { ...p, visual_samples: (Number(p.visual_samples) || 0) + 1 } : p
      );
      
      const success = await onSync(updated);
      
      if (success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setDetectedItems(prev => prev.filter(item => item.id !== selectedMapping.id));
        setSelectedMapping(null);
      } else {
        alert("Gagal sinkronisasi ke Google Sheets.");
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 relative">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-green-500">
            <div className="bg-white/20 p-1.5 rounded-full"><Check size={16} /></div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Mapping Berhasil!</span>
              <span className="text-[10px] opacity-80">{lastMapped} telah terhubung ke AI.</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vision Mapping</h1>
          <p className="text-slate-500 text-sm">Hubungkan deteksi AI ke data Google Sheets.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsActive(!isActive)} className={`px-4 py-2 rounded-xl font-bold border transition-all ${isActive ? 'bg-white border-slate-200 text-slate-600' : 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100'}`}>
            <Camera size={18} className="inline mr-2" /> {isActive ? 'Stop Camera' : 'Start Mapping'}
          </button>
          {isActive && (
            <button onClick={performAIScan} disabled={isScanning} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-slate-200">
              {isScanning ? <Loader2 className="animate-spin inline mr-2" /> : <Scan className="inline mr-2" />} Ambil Gambar
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        <div className="col-span-12 lg:col-span-8 bg-slate-900 rounded-3xl relative overflow-hidden shadow-inner border-4 border-slate-800">
          {!isActive && !detectedItems.length && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-4">
              <div className="p-6 bg-slate-800 rounded-full"><Target size={48} className="opacity-20" /></div>
              <p className="text-sm font-medium">Klik "Start Mapping" untuk mulai</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
          <video ref={videoRef} className={`w-full h-full object-cover transition-opacity duration-500 ${isScanning ? 'opacity-50' : 'opacity-100'}`} autoPlay playsInline muted />
          
          {detectedItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setSelectedMapping(item)} 
              className={`absolute border-2 transition-all duration-300 group ${selectedMapping?.id === item.id ? 'border-orange-400 bg-orange-400/20 shadow-[0_0_20px_rgba(249,115,22,0.5)]' : 'border-white/50 hover:border-white'}`}
              style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%` }}
            >
              <span className={`absolute -top-7 left-0 whitespace-nowrap px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${selectedMapping?.id === item.id ? 'bg-orange-500 text-white' : 'bg-black/60 text-white opacity-0 group-hover:opacity-100'}`}>
                {item.label}
              </span>
            </button>
          ))}

          {isScanning && (
            <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center backdrop-blur-[2px]">
               <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-100">
                  <Loader2 className="animate-spin text-orange-600" size={24} />
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">Menganalisis Objek...</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Powered by Gemini AI</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
           <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col h-full shadow-sm">
             {!selectedMapping ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-10">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                    <Target size={32} />
                 </div>
                 <div className="space-y-1">
                   <p className="font-bold text-slate-800">Mapping Queue</p>
                   <p className="text-xs text-slate-400 max-w-[200px]">Pilih kotak objek pada kamera untuk mulai menghubungkan data.</p>
                 </div>
               </div>
             ) : (
               <>
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Map Selection</h3>
                    <button onClick={() => setSelectedMapping(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
                 </div>
                 
                 <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-100"><Sparkles size={20} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">AI Detected</p>
                        <p className="font-bold text-orange-900 leading-tight">{selectedMapping.label}</p>
                      </div>
                   </div>
                   <ArrowRight size={18} className="text-orange-300" />
                 </div>

                 <div className="relative mb-4">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input 
                     placeholder="Cari produk di inventory..." 
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all" 
                     value={searchQuery} 
                     onChange={e => setSearchQuery(e.target.value)} 
                   />
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                   {inventoryToMap.map((p, idx) => (
                     <button 
                       key={`${p.id}-${idx}`} 
                       disabled={isSyncing}
                       onClick={() => handleMapProduct(p)} 
                       className="w-full p-3 bg-white border border-slate-100 rounded-2xl hover:border-orange-300 hover:shadow-md transition-all flex items-center gap-3 text-left group disabled:opacity-50"
                     >
                       <img src={p.foto || 'https://via.placeholder.com/100'} className="w-10 h-10 rounded-xl object-cover border border-slate-100" />
                       <div className="flex-1 overflow-hidden">
                         <p className="text-xs font-bold text-slate-800 truncate">{p.nama}</p>
                         <p className="text-[9px] text-slate-400 font-mono">{p.id}</p>
                         <p className="text-[9px] text-slate-500 truncate">{p.category_name || 'Umum'} • {p.product_type || 'cv'}</p>
                       </div>
                       {isSyncing ? <Loader2 size={16} className="animate-spin text-orange-600" /> : <CheckCircle2 size={20} className={p.visual_samples > 0 ? 'text-green-500' : 'text-slate-100 group-hover:text-orange-200'} />}
                     </button>
                   ))}
                   {inventoryToMap.length === 0 && <p className="text-center text-[10px] text-slate-400 py-4 italic">Produk tidak ditemukan</p>}
                 </div>
               </>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
export default CVMonitor;
