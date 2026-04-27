
import React, { useEffect, useMemo, useState } from 'react';
import { 
  Ticket, Star, ArrowLeft, 
  User, Award, Crown, Check, XCircle, Zap, Coins, ArrowRight
} from 'lucide-react';
import { Voucher, CartItem } from '../types';
import { getCvActiveVouchers } from '../src/cvApiService';

interface VoucherSelectionPageProps {
  isMember: boolean;
  memberData: { id: string, name: string, tier: string, points: number } | null;
  selectedVoucherId?: string;
  pointsUsed: number;
  onSelectPoints: (points: number) => void;
  onSelect: (voucher: Voucher | null) => void;
  onBack: () => void;
  cart: CartItem[];
  t: any;
}

type TierVisual = {
  bg: string;
  badge: string;
  icon: React.ReactElement<{ size?: number }>;
};

const getTierStyles = (tier: string = 'Silver'): TierVisual => {
  switch (tier.toLowerCase()) {
    case 'platinum':
      return {
        bg: 'bg-gradient-to-br from-orange-800 via-amber-900 to-orange-900',
        badge: 'bg-white/10 border-white/20 text-orange-200',
        icon: <Crown size={16} />
      };
    case 'gold':
      return {
        bg: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700',
        badge: 'bg-white/20 border-white/30 text-white',
        icon: <Star size={16} />
      };
    default:
      return {
        bg: 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700',
        badge: 'bg-white/20 border-white/30 text-white',
        icon: <Award size={16} />
      };
  }
};

const VoucherSelectionPage: React.FC<VoucherSelectionPageProps> = ({ 
  isMember, memberData, selectedVoucherId, pointsUsed, onSelectPoints, onSelect, onBack, cart, t
}) => {
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState<boolean>(true);

  useEffect(() => {
    const loadVouchers = async () => {
      setIsLoadingVouchers(true);
      try {
        const rawVouchers = await getCvActiveVouchers();
        const mapped: Voucher[] = rawVouchers.map((voucher) => ({
          id: String(voucher.voucher_code || ''),
          title: String(voucher.voucher_name || 'Voucher'),
          description: String(voucher.description || 'Promo aktif untuk transaksi Anda.'),
          discountType: String(voucher.discount_type || 'FIXED').toUpperCase() === 'PERCENT' ? 'PERCENT' : 'FIXED',
          value: Number(voucher.discount_value || 0),
          minTransaction: Number(voucher.min_transaction || 0),
          isMemberOnly: Boolean(voucher.is_member_only),
        }));
        setAvailableVouchers(mapped);
      } catch (error) {
        console.error('Load vouchers failed:', error);
        setAvailableVouchers([]);
      } finally {
        setIsLoadingVouchers(false);
      }
    };

    loadVouchers();
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [cart]
  );
  const totalPointsPotential = useMemo(
    () => cart.reduce((sum, item) => sum + ((item.points || 0) * item.quantity), 0),
    [cart]
  );

  // Maksimal poin yang bisa digunakan adalah saldo member atau seharga subtotal
  const maxRedeemable = useMemo(
    () => (memberData ? Math.min(memberData.points, subtotal) : 0),
    [memberData, subtotal]
  );

  const handleTogglePoints = () => {
    if (pointsUsed > 0) {
      onSelectPoints(0);
    } else {
      onSelectPoints(maxRedeemable);
    }
  };

  const tier = useMemo(() => getTierStyles(memberData?.tier), [memberData?.tier]);

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] z-50 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all">
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center vision-shadow overflow-hidden border border-slate-100">
              <img 
                src="/logo.jpeg" 
                alt="Ngolab Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-900 leading-none uppercase tracking-tighter">{t.title}</h1>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <aside className="w-full lg:w-[380px] border-b lg:border-b-0 lg:border-r border-slate-100 bg-white flex flex-col overflow-hidden max-h-[40vh] lg:max-h-full">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {isMember && memberData ? (
              <>
                <div className={`aspect-[2/1] lg:aspect-[1.6/1] w-full rounded-[24px] md:rounded-[32px] ${tier.bg} text-white p-5 md:p-6 vision-shadow relative overflow-hidden shrink-0`}>
                  <div className="relative h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                          <User size={16} />
                        </div>
                        <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-1.5 ${tier.badge}`}>
                          {tier.icon && React.cloneElement(tier.icon, { size: 14 })} {memberData.tier}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-black mb-1 leading-none">{memberData.name}</h3>
                        <p className="text-[8px] md:text-[10px] font-mono opacity-50 tracking-widest">{memberData.id}</p>
                      </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                       <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.pointBalance}</p>
                       <p className="text-xl md:text-2xl font-black text-slate-900">{memberData.points.toLocaleString('id-ID')} <span className="text-[9px] md:text-[10px] text-slate-400">{t.pts}</span></p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                       <Coins size={20} />
                    </div>
                  </div>
                  
                  <div className="pt-3 md:pt-4 border-t border-slate-200">
                    <button 
                      onClick={handleTogglePoints}
                      disabled={maxRedeemable === 0}
                      className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg
                        ${pointsUsed > 0 
                          ? 'bg-red-50 text-red-600 border border-red-100' 
                          : 'bg-[#F97316] text-white hover:bg-[#EA580C] shadow-orange-500/20'}
                        ${maxRedeemable === 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                      `}
                    >
                      {pointsUsed > 0 ? (
                        <>{t.cancelPoints}</>
                      ) : (
                        <>{t.usePoints.replace('{points}', maxRedeemable.toLocaleString('id-ID'))}</>
                      )}
                    </button>
                    {pointsUsed > 0 && (
                      <p className="text-center text-[9px] md:text-[10px] text-green-600 font-bold mt-2 md:mt-3 animate-pulse">
                         {t.successMessage.replace('{amount}', pointsUsed.toLocaleString('id-ID'))}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-orange-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-orange-100 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] md:text-[9px] font-black text-orange-400 uppercase tracking-widest">{t.potentialCashback}</p>
                    <p className="text-base md:text-lg font-black text-[#F97316]">+{totalPointsPotential} <span className="text-[9px] md:text-[10px]">{t.pts}</span></p>
                  </div>
                  <Zap size={19} className="text-orange-400" />
                </div>
              </>
            ) : (
              <div className="aspect-[2/1] lg:aspect-[1.6/1] w-full rounded-[24px] md:rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 p-6 md:p-8 flex flex-col items-center justify-center text-center shrink-0">
                <User size={28} className="text-slate-300 mb-2" />
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.guestMode}</p>
                <p className="text-[8px] md:text-[10px] text-slate-400 mt-2">{t.loginMemberMsg}</p>
              </div>
            )}
          </div>

          <div className="p-4 md:p-8 border-t border-slate-100 bg-white">
            <button 
              onClick={onBack}
              className="w-full py-4 md:py-5 bg-slate-900 hover:bg-black text-white rounded-xl md:rounded-[24px] font-black text-xs md:text-sm uppercase tracking-widest transition-all vision-shadow flex items-center justify-center gap-2 md:gap-3 active:scale-95"
            >
              {t.continuePay}
              <ArrowRight size={17} />
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12 space-y-8 md:space-y-12 bg-slate-50/30">
          <section className="animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">{t.availableVouchers}</h2>
              <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Zap size={12} fill="currentColor" className="text-slate-400" /> {t.maxSavings}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {availableVouchers.map((voucher) => {
                const isDisabled = voucher.isMemberOnly && !isMember;
                const isSelected = selectedVoucherId === voucher.id;

                return (
                  <button 
                    key={voucher.id} 
                    disabled={isDisabled} 
                    onClick={() => onSelect(isSelected ? null : voucher)} 
                    className={`group text-left rounded-[32px] md:rounded-[40px] transition-all flex flex-col h-full overflow-hidden border-2 relative
                      ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' : 'bg-white border-white shadow-lg shadow-slate-200/50 active:scale-[0.98]'}
                      ${isSelected ? 'grayscale opacity-50 border-orange-200 scale-[0.99]' : 'hover:border-orange-500'}
                    `}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-white/10 z-10 flex items-center justify-center">
                         <div className="bg-slate-900 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center gap-1.5 md:gap-2 shadow-2xl scale-110">
                           <Check size={13} className="text-orange-400" /> {t.voucherAttached}
                         </div>
                      </div>
                    )}

                    <div className={`px-6 md:px-8 py-4 md:py-5 flex items-center justify-between transition-colors ${isSelected ? 'bg-slate-400 text-white' : (voucher.isMemberOnly ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white')}`}>
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                        <Ticket size={11} /> {voucher.isMemberOnly ? t.memberReward : t.publicPromo}
                      </span>
                    </div>

                    <div className="p-6 md:p-8 flex-1 flex flex-col">
                      <div className="text-3xl md:text-5xl font-black text-slate-900 mb-2 md:mb-3 tracking-tighter">
                        {voucher.discountType === 'PERCENT' ? `${voucher.value}%` : `Rp ${voucher.value / 1000}k`} <span className="text-base md:text-xl uppercase text-slate-300">{t.off}</span>
                      </div>
                      <h5 className="font-black text-slate-900 text-sm md:text-base uppercase mb-1 md:mb-2">{voucher.title}</h5>
                      <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed mb-4 md:mb-6">{voucher.description}</p>
                      
                      <div className={`mt-auto pt-3 md:pt-4 border-t border-slate-50 flex items-center font-bold text-[10px] md:text-xs uppercase tracking-widest transition-opacity
                        ${isSelected ? 'text-red-500 opacity-100' : 'text-orange-500 opacity-0 group-hover:opacity-100'}
                      `}>
                        {isSelected ? (
                          <span className="flex items-center gap-1.5 md:gap-2"><XCircle size={13}/> {t.cancelVoucher}</span>
                        ) : (
                          t.useVoucher
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {!isLoadingVouchers && availableVouchers.length === 0 && (
                <div className="col-span-full bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400 font-bold">
                  Tidak ada voucher aktif dari backend.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default VoucherSelectionPage;
