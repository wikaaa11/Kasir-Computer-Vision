
import React from 'react';
import { Camera, Barcode, ArrowLeft, Sparkles, Zap, Smartphone, ChevronRight, Cpu, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface SelectInputPageProps {
  onSelectAI: () => void;
  onSelectBarcode: () => void;
  onBack: () => void;
  t: any;
}

const SelectInputPage: React.FC<SelectInputPageProps> = ({ onSelectAI, onSelectBarcode, onBack, t }) => {
  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl relative overflow-y-auto md:overflow-hidden pb-10">
      <div className="w-full flex flex-col items-start z-10 pt-4 md:pt-6 px-4">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-slate-900 hover:border-slate-200 hover:shadow-lg font-bold transition-all active:scale-95 group shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">{t.back}</span>
        </motion.button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start md:justify-center py-6 md:py-10 z-10 px-4">
        <div className="w-full max-w-5xl flex flex-col items-center">
          <div className="text-center mb-8 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-4xl md:text-7xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight leading-[1.1] md:leading-[0.9]">
                {t.title} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-700">{t.subtitle}</span>
              </h2>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-slate-500 max-w-xl mx-auto text-sm md:text-xl leading-relaxed font-medium"
            >
              {t.desc}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 w-full max-w-4xl">
            {/* AI Option Card */}
            <motion.button 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
              onClick={onSelectAI}
              className="group relative bg-white p-6 md:p-10 lg:p-12 rounded-[32px] md:rounded-[56px] border-2 border-slate-100 hover:border-orange-500 hover:shadow-[0_40px_80px_rgba(249,115,22,0.15)] transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute top-4 md:top-8 right-4 md:right-8 px-3 md:px-4 py-1.5 bg-orange-500 text-white rounded-full flex items-center gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-wider shadow-lg shadow-orange-200/50 z-20">
                <Sparkles size={10} fill="currentColor" className="md:w-3 md:h-3" /> {t.popular}
              </div>

              <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-orange-50 rounded-[28px] md:rounded-[40px] text-orange-500 mb-6 md:mb-10 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-sm border border-orange-100/50">
                <Camera size={48} className="md:w-16 md:h-16" />
              </div>

              <div className="relative z-10 space-y-2 md:space-y-4">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t.aiTitle}</h3>
                <p className="text-slate-500 text-xs md:text-base max-w-[260px] mx-auto leading-relaxed font-medium">
                  {t.aiDesc}
                </p>
              </div>

              <div className="relative z-10 mt-8 md:mt-12 flex items-center gap-3 text-orange-500 font-bold text-sm md:text-base group-hover:gap-5 transition-all duration-300">
                {t.aiSelect} <ChevronRight size={18} strokeWidth={3} />
              </div>
            </motion.button>

            {/* Barcode Option Card */}
            <motion.button 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
              onClick={onSelectBarcode}
              className="group relative bg-white p-6 md:p-10 lg:p-12 rounded-[32px] md:rounded-[56px] border-2 border-slate-100 hover:border-slate-900 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="absolute top-4 md:top-8 right-4 md:right-8 px-3 md:px-4 py-1.5 bg-slate-900 text-white rounded-full flex items-center gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-wider shadow-lg shadow-slate-200/50 z-20">
                <Zap size={10} fill="currentColor" className="md:w-3 md:h-3" /> {t.fast}
              </div>

              <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-slate-50 rounded-[28px] md:rounded-[40px] text-slate-900 mb-6 md:mb-10 group-hover:-rotate-6 group-hover:scale-110 transition-all duration-500 shadow-sm border border-slate-100/50">
                <Barcode size={48} className="md:w-16 md:h-16" />
              </div>

              <div className="relative z-10 space-y-2 md:space-y-4">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t.barcodeTitle}</h3>
                <p className="text-slate-500 text-xs md:text-base max-w-[260px] mx-auto leading-relaxed font-medium">
                  {t.barcodeDesc}
                </p>
              </div>

              <div className="relative z-10 mt-8 md:mt-12 flex items-center gap-3 text-slate-900 font-bold text-sm md:text-base group-hover:gap-5 transition-all duration-300">
                {t.barcodeSelect} <ChevronRight size={18} strokeWidth={3} />
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectInputPage;
