
import React from 'react';
import { ArrowLeft, Home, CheckCircle2 } from 'lucide-react';

interface PaymentCashProps {
  onBack: () => void;
  onSuccess: () => void;
  total: number;
  t: any;
}

const PaymentCash: React.FC<PaymentCashProps> = ({ onBack, onSuccess, total, t }) => {
  return (
    <div className="flex-1 w-full bg-[#4B5563] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[56px] vision-shadow p-10 flex flex-col items-center relative">
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 p-3 rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="mt-12 mb-8 bg-amber-50 px-6 py-2 rounded-2xl flex items-center gap-3 border border-amber-100">
          <Home size={18} className="text-amber-600" />
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">{t.cashCheckout}</span>
        </div>

        <h2 className="text-4xl font-black text-slate-900 mb-4 text-center">{t.cashierDesk}</h2>
        <p className="text-slate-400 font-medium text-center mb-12 max-w-[280px]">
          {t.queueNumber}
        </p>

        <div className="w-full bg-[#F97316] rounded-[40px] p-8 vision-shadow relative overflow-hidden mb-12">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-12" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-8 translate-y-8" />
          
          <div className="relative flex flex-col items-center text-center">
            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] mb-4">{t.yourQueueNumber}</span>
            <span className="text-8xl font-black text-white leading-none mb-8">A-042</span>
            
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">{t.cashierReady}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onSuccess}
          className="w-full py-5 px-6 bg-slate-100 hover:bg-orange-50 hover:text-[#F97316] transition-all rounded-[32px] flex items-center justify-center gap-3 group"
        >
          <span className="font-bold text-slate-600 group-hover:text-[#F97316]">{t.confirmStaff}</span>
          <CheckCircle2 size={20} className="text-slate-400 group-hover:text-[#F97316]" />
        </button>

        <div className="w-full flex justify-between items-end mt-12 pt-8 border-t border-slate-100">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.totalBill}</span>
            <span className="text-3xl font-black text-slate-900">Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCash;
