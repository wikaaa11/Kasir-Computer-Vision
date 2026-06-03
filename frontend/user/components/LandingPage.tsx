
import React from 'react';
import { Camera, Zap, QrCode, UserPlus, Sparkles, ShoppingBasket, Clock } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  t: any;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, t }) => {
  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full max-w-full mx-auto py-8 lg:py-0">
        {/* Left Column: CTA */}
        <div className="flex flex-col items-center lg:items-start space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100/50 rounded-full border border-orange-200 text-[#EA580C] text-xs font-bold">
            <Zap size={14} fill="currentColor" />
            {t.integrated}
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-[#0F172A] leading-[1.1] tracking-tight">
              {t.heroTitle1}<br />
              <span className="text-[#F97316]">{t.heroTitle2}</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-md leading-relaxed mx-auto lg:mx-0">
              {t.heroDesc}
            </p>
          </div>

          <button 
            onClick={onStart}
            className="group flex items-center gap-4 bg-[#F97316] hover:bg-[#EA580C] text-white px-8 lg:px-10 py-4 lg:py-5 rounded-full text-lg lg:text-xl font-bold transition-all vision-shadow active:scale-95"
          >
            {t.startBtn}
            <Camera className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* Right Column: Grid of Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 relative">
          {/* Background Decorative Glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-100 rounded-full blur-[100px] opacity-30 pointer-events-none" />
          
          {/* Feature Card 1: Scan Produk */}
          <div className="bg-white p-8 rounded-[40px] vision-shadow border border-slate-50 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-5 text-[#F97316] group-hover:scale-110 transition-transform">
              <ShoppingBasket size={28} />
            </div>
            <h4 className="text-base font-black text-slate-900 mb-1">Scan Produk</h4>
            <p className="text-xs text-slate-400 font-medium">Camera & Barcode</p>
          </div>

          {/* Feature Card 2: Instant Checkout */}
          <div className="bg-white p-8 rounded-[40px] vision-shadow border border-slate-50 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-5 text-[#F97316] group-hover:scale-110 transition-transform">
              <Clock size={28} />
            </div>
            <h4 className="text-base font-black text-slate-900 mb-1">Instant Checkout</h4>
            <p className="text-xs text-slate-400 font-medium">Proses Cepat</p>
          </div>

          {/* Feature Card 3: Membership QR (Integrated - Spans 2 columns for better balance) */}
          <div className="col-span-1 sm:col-span-2 glass-card rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 vision-shadow border-2 border-white relative overflow-hidden group flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 hidden sm:block">
              <Sparkles size={100} className="text-[#F97316]" />
            </div>
            
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left max-w-[200px]">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3 text-[#F97316]">
                <UserPlus size={20} />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-1">{t.registerMember}</h4>
              <p className="text-xs text-slate-500 mb-3">Nikmati berbagai macam diskon setiap belanja.</p>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">{t.joinNow}</span>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 transition-transform hover:scale-110 duration-300 relative z-10">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=NGOLAB_MEMBER" 
                alt="QR" 
                className="w-20 h-20 sm:w-24 sm:h-24 grayscale-[0.2]"
              />
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <QrCode size={10} className="text-slate-300" />
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{t.scanMe}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
