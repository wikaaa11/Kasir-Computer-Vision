import React from 'react';
import { Camera, Barcode, ArrowLeft, Sparkles, Zap } from 'lucide-react';

interface SelectInputPageProps {
  onSelectAI: () => void;
  onSelectBarcode: () => void;
  onBack: () => void;
}

const SelectInputPage: React.FC<SelectInputPageProps> = ({ onSelectAI, onSelectBarcode, onBack }) => {
  return (
    <div className="w-full max-w-5xl px-6 py-8 md:py-12 animate-in fade-in zoom-in duration-300 mx-auto flex flex-col items-center">
      <button
        onClick={onBack}
        className="mb-6 self-start inline-flex items-center gap-3 text-orange-700 hover:text-orange-900 bg-white/95 border border-orange-100 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-colors text-sm md:text-base"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-orange-600">
          <ArrowLeft size={16} />
        </span>
        <span className="font-semibold">Kembali ke Beranda</span>
      </button>

      <div className="text-center mb-8 md:mb-12 w-full">
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-3">Pilih Metode Input</h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-lg">Gunakan kecerdasan buatan untuk deteksi otomatis atau gunakan pemindai barcode konvensional.</p>
      </div>

      <div className="space-y-6 w-full max-w-4xl">
        {/* AI Option */}
        <button
          onClick={onSelectAI}
          className="group relative bg-white p-6 md:p-8 rounded-[28px] border border-orange-100 hover:border-orange-200 hover:shadow-2xl transition-all w-full flex items-center gap-6 md:gap-8 overflow-hidden"
        >
          <div className="absolute top-4 right-4 bg-orange-50 p-2 rounded-lg text-orange-500">
            <Sparkles size={16} />
          </div>
          <div className="w-20 h-20 md:w-28 md:h-28 bg-orange-50 rounded-[20px] flex items-center justify-center text-orange-500 flex-shrink-0">
            <Camera size={48} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-1">Scan Camera</h3>
            <p className="text-slate-500 text-sm md:text-base">Arahkan barang ke kamera satu per satu untuk memulai scan.</p>
          </div>
          <div className="px-5 md:px-7 py-3 md:py-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-[10px] md:text-xs uppercase tracking-[0.24em] shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105 flex-shrink-0">
            Gunakan
          </div>
        </button>

        {/* Barcode Option */}
        <button
          onClick={onSelectBarcode}
          className="group relative bg-white p-6 md:p-8 rounded-[28px] border border-orange-100 hover:border-orange-200 hover:shadow-2xl transition-all w-full flex items-center gap-6 md:gap-8 overflow-hidden"
        >
          <div className="absolute top-4 right-4 bg-orange-50 p-2 rounded-lg text-orange-500">
            <Zap size={16} />
          </div>
          <div className="w-20 h-20 md:w-28 md:h-28 bg-orange-50 rounded-[20px] flex items-center justify-center text-orange-500 flex-shrink-0">
            <Barcode size={48} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-1">Scan Barcode</h3>
            <p className="text-slate-500 text-sm md:text-base">Gunakan alat pemindai untuk memasukkan barang satu per satu.</p>
          </div>
          <div className="px-5 md:px-7 py-3 md:py-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-[10px] md:text-xs uppercase tracking-[0.24em] shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105 flex-shrink-0">
            Gunakan
          </div>
        </button>
      </div>
    </div>
  );
};

export default SelectInputPage;
