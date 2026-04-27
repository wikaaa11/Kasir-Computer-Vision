
import React from 'react';
import { Trash2, Plus, Minus, ArrowRight, Ticket, Sparkles, Coins } from 'lucide-react';
import { CartItem, Voucher } from '../types';

interface CartPageProps {
  cart: CartItem[];
  isMember: boolean;
  selectedVoucher: Voucher | null;
  discountAmount: number;
  pointsUsed: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onReset: () => void;
  onGoToMembership: () => void;
  onGoToVouchers: () => void;
  onConfirm: () => void;
  t: any;
}

const CartPage: React.FC<CartPageProps> = ({ 
  cart, isMember, selectedVoucher, discountAmount, pointsUsed,
  onUpdateQuantity, onRemoveItem, onReset, onGoToMembership, onGoToVouchers, onConfirm, t
}) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discountAmount - pointsUsed);

  const getMembershipCardContent = () => {
    if (!isMember) {
      return {
        bg: 'bg-slate-900 text-white shadow-xl shadow-slate-200',
        iconBg: 'bg-slate-800 text-[#F97316]',
        icon: <Ticket size={32} />,
        title: t.membershipCard,
        desc: t.hasMembershipDesc,
        button: (
          <button 
            onClick={onGoToMembership}
            className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] rounded-2xl font-black text-xs uppercase tracking-widest transition-all shrink-0"
          >
            {t.scanMember}
          </button>
        )
      };
    }

    return {
      bg: 'bg-[#F97316] text-white shadow-xl shadow-orange-200',
      iconBg: 'bg-white/20',
      icon: <Sparkles size={32} />,
      title: t.activeMemberPortal,
      desc: t.activeMemberDesc,
      button: (
        <button 
          onClick={onGoToVouchers}
          className="px-6 py-3 bg-white text-orange-600 hover:bg-orange-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shrink-0"
        >
          {t.menuReward}
        </button>
      )
    };
  };

  const card = getMembershipCardContent();

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center py-6">
      <div className="w-full flex flex-col gap-6 md:gap-8 max-w-[1440px] animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          <div className="glass-card rounded-[32px] md:rounded-[40px] p-6 md:p-8 vision-shadow">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">{t.title}</h2>
              <span className="px-3 md:px-4 py-1 md:py-1.5 bg-slate-100 text-slate-500 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest">
                {cart.length} {t.items}
              </span>
            </div>

            <div className="space-y-4 max-h-[300px] md:max-h-[420px] overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-50 shadow-sm">
                  <div className="flex items-center gap-3 md:gap-4">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl object-cover" />
                    )}
                    <div>
                      <span className="block text-slate-800 font-bold text-base md:text-lg">{item.name}</span>
                      <span className="text-[#F97316] font-black text-xs md:text-sm">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6">
                    <div className="flex items-center gap-3 md:gap-4 bg-slate-50 px-2 md:px-3 py-1.5 md:py-2 rounded-xl md:rounded-2xl">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)} 
                        className="text-slate-400 hover:text-slate-800 transition-colors"
                      >
                        <Minus size={14}/>
                      </button>
                      <span className="w-6 md:w-8 text-center font-black text-base md:text-lg text-slate-900">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)} 
                        className="text-slate-400 hover:text-slate-800 transition-colors"
                      >
                        <Plus size={14}/>
                      </button>
                    </div>
                    <button onClick={() => onRemoveItem(item.id)} className="text-red-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-[32px] md:rounded-[40px] p-6 md:p-8 flex flex-col sm:flex-row items-center gap-4 md:gap-6 transition-all duration-500 ${card.bg}`}>
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[24px] flex items-center justify-center shrink-0 ${card.iconBg}`}>
              {React.cloneElement(card.icon as React.ReactElement, { size: 24 })}
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h3 className="font-black text-base md:text-lg truncate">{card.title}</h3>
              <p className="opacity-80 text-xs md:text-sm leading-tight">
                {card.desc}
              </p>
            </div>
            {card.button}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card rounded-[32px] md:rounded-[40px] p-6 md:p-8 vision-shadow border-2 border-white h-full flex flex-col">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 md:mb-8">{t.summary}</h2>
            
            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <div className="flex justify-between text-slate-500 text-sm md:text-base font-medium">
                <span>{t.subtotal}</span>
                <span className="font-bold text-slate-800">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              {selectedVoucher && discountAmount > 0 && (
                <div className="flex justify-between text-orange-600 text-sm md:text-base font-medium">
                  <div className="flex items-center gap-2"><Ticket size={14}/> <span>{t.voucher}</span></div>
                  <span className="font-black">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}

              {pointsUsed > 0 && (
                <div className="flex justify-between text-amber-600 text-sm md:text-base font-medium animate-in slide-in-from-left">
                  <div className="flex items-center gap-2"><Coins size={14}/> <span>{t.redeemPoints}</span></div>
                  <span className="font-black">- Rp {pointsUsed.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.totalFinal}</span>
                <span className="text-2xl md:text-3xl font-black text-[#F97316]">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="mt-auto space-y-3 md:space-y-4">
              <button onClick={onConfirm} className="w-full py-4 md:py-5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-2xl md:rounded-[32px] font-black text-base md:text-lg transition-all vision-shadow active:scale-95 flex items-center justify-center gap-3">
                {t.payNow} <ArrowRight size={20} />
              </button>
              <button onClick={onReset} className="w-full py-2 md:py-4 text-slate-400 font-bold text-xs md:text-sm">{t.cancel}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CartPage;
