
import React, { useEffect, useState } from 'react';
import { ArrowLeft, QrCode } from 'lucide-react';

interface PaymentQRISProps {
  onBack: () => void;
  onSuccess: () => void;
  total: number;
  t: any;
}

const PaymentQRIS: React.FC<PaymentQRISProps> = ({ onBack, onSuccess, total, t }) => {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 200);

    // Diperpanjang menjadi 15000ms (15 detik) agar pengguna sempat melihat QR
    const timer = setTimeout(() => {
      onSuccess();
    }, 15000); 

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onSuccess]);

  return (
    <div className="flex-1 w-full bg-[#4B5563] flex flex-col items-center justify-center p-2 md:p-6">
      <div className="w-full max-w-sm md:max-w-md bg-white rounded-[26px] md:rounded-[40px] vision-shadow p-3 md:p-6 flex flex-col items-center relative overflow-hidden max-h-[calc(100vh-0.5rem)] md:max-h-none">
        <div className="mb-1 md:mb-2 flex flex-col items-center">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-lg flex items-center justify-center vision-shadow overflow-hidden border border-slate-100 mb-1">
            <img 
              src="/logo.jpeg" 
              alt="Ngolab Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-[6px] md:text-[7px] font-black text-[#F97316] tracking-widest uppercase">{t.ngolab}</span>
        </div>

        <button 
          onClick={onBack}
          className="absolute top-3 left-3 md:top-4 md:left-4 p-1.5 md:p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="mt-1 md:mt-4 mb-2 md:mb-3 bg-orange-50 px-2.5 md:px-4 py-1 md:py-1.5 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-2.5">
          <QrCode size={12} className="text-[#F97316]" />
          <span className="text-[7px] md:text-[9px] font-black text-[#F97316] uppercase tracking-[0.2em]">{t.scanPay}</span>
        </div>

        <h2 className="text-lg md:text-3xl font-black text-slate-900 mb-2 md:mb-3 text-center">{t.qrisPayment}</h2>
        
        <div className="relative p-2 md:p-5 bg-slate-50 rounded-[24px] md:rounded-[34px] mb-2 md:mb-4 vision-shadow">
          <div className="bg-white p-1.5 md:p-3 rounded-xl md:rounded-2xl">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VP_${total}_${Date.now()}`} 
              alt="QRIS Code" 
              className="w-24 h-24 md:w-40 md:h-40"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 mb-2 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" style={{ animationDelay: '100ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" style={{ animationDelay: '200ms' }} />
            </div>
            <span className="text-[7px] md:text-[10px] font-black text-[#F97316] uppercase tracking-[0.2em]">{t.verifying}</span>
          </div>
          <p className="hidden md:block text-[9px] text-slate-400 font-bold text-center max-w-[200px] uppercase tracking-wider leading-relaxed">
            {t.verifyMessage}
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row justify-between items-center sm:items-end border-t border-slate-100 pt-2.5 md:pt-4 gap-2 md:gap-3">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.totalBill}</span>
            <span className="text-base md:text-2xl font-black text-slate-900">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <button 
            onClick={onSuccess}
            className="w-full sm:w-auto px-4 md:px-6 py-1.5 md:py-3 bg-[#F97316] text-white rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest hover:bg-[#EA580C] transition-all active:scale-95 shadow-lg"
          >
            {t.simulatePay}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentQRIS;
