
import React from 'react';
import { User, QrCode, ArrowRight, X, Loader2 } from 'lucide-react';

interface MembershipPageProps {
  onSkip: () => void;
  onDetected: (memberCode: string) => void;
  isChecking?: boolean;
  t: any;
}

const MembershipPage: React.FC<MembershipPageProps> = ({ onSkip, onDetected, isChecking = false, t }) => {
  const [memberCode, setMemberCode] = React.useState('MEM-001');

  const handleCheckMember = () => {
    const cleanCode = memberCode.trim();
    if (!cleanCode) {
      alert('Masukkan kode member terlebih dahulu.');
      return;
    }
    onDetected(cleanCode);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] bg-[#F97316] rounded-full blur-[170px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_45%)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center px-3 md:px-4 py-3 rounded-[24px] border border-white/10 bg-slate-900/25 backdrop-blur-md">
        <div className="mb-3 md:mb-4 flex flex-col items-center">
          <div className="w-10 h-10 md:w-11 md:h-11 bg-white rounded-xl flex items-center justify-center vision-shadow overflow-hidden border border-slate-100 mb-1.5">
            <img 
              src="/logo.jpeg" 
              alt="Ngolab Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-[9px] md:text-[10px] font-black text-[#F97316] tracking-widest uppercase">{t.title}</span>
        </div>

        <div className="mb-4 md:mb-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-600/15 rounded-full text-[#F97316] text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-2.5">
            <User size={12} /> {t.check}
          </div>
          <h2 className="text-[30px] md:text-[36px] leading-[1.05] font-black text-white mb-2">{t.scanCard}</h2>
          <p className="text-sm md:text-[15px] text-slate-400 max-w-[520px]">{t.discountDesc}</p>
        </div>

        {/* Scan Frame */}
        <div className="relative w-full aspect-square max-w-[230px] md:max-w-[260px] mb-4 md:mb-5">
          <div className="absolute inset-0 border-2 border-white/10 rounded-[28px] md:rounded-[40px]" />
          <div className="absolute top-0 left-0 w-9 h-9 md:w-10 md:h-10 border-t-4 border-l-4 border-[#F97316] rounded-tl-[20px] md:rounded-tl-[28px]" />
          <div className="absolute top-0 right-0 w-9 h-9 md:w-10 md:h-10 border-t-4 border-r-4 border-[#F97316] rounded-tr-[20px] md:rounded-tr-[28px]" />
          <div className="absolute bottom-0 left-0 w-9 h-9 md:w-10 md:h-10 border-b-4 border-l-4 border-[#F97316] rounded-bl-[20px] md:rounded-bl-[28px]" />
          <div className="absolute bottom-0 right-0 w-9 h-9 md:w-10 md:h-10 border-b-4 border-r-4 border-[#F97316] rounded-br-[20px] md:rounded-br-[28px]" />
          
          <div className="absolute inset-5 md:inset-7 flex items-center justify-center">
            {isChecking ? (
              <Loader2 size={64} className="text-[#F97316] animate-spin opacity-60" />
            ) : (
              <QrCode size={96} className="text-white/20" />
            )}
            {!isChecking && <div className="scan-line !bg-[#F97316]" />}
          </div>
        </div>

        <div className="w-full mb-3">
          <input
            value={memberCode}
            onChange={(e) => setMemberCode(e.target.value)}
            placeholder="Contoh: MEM-001"
            className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#F97316]"
          />
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <button 
            onClick={handleCheckMember}
            disabled={isChecking}
            className="w-full py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-[22px] md:rounded-[26px] font-black text-base md:text-[17px] transition-all vision-shadow active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isChecking ? t.check + '...' : t.simulateScan}
            {!isChecking && <ArrowRight size={20} />}
          </button>
          
          <button 
            onClick={onSkip}
            disabled={isChecking}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-[22px] md:rounded-[26px] font-bold text-sm md:text-[15px] transition-all flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <X size={18} />
            {t.noMember}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipPage;
