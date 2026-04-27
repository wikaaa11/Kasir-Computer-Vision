
import React from 'react';
import { Check, Printer } from 'lucide-react';

interface SuccessPageProps {
  onFinish: () => void;
  total: number;
  transactionId: string;
  isSyncing?: boolean;
  t: any;
}

const SuccessPage: React.FC<SuccessPageProps> = ({
  onFinish,
  total,
  transactionId,
  isSyncing = false,
  t,
}) => {
  return (
    <div className="flex-1 w-full bg-slate-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-2xl p-8 flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 mb-2">
            <img
              src="/logo.jpeg"
              alt="Ngolab Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xs font-black text-orange-500">{t.ngolab2}</span>
        </div>
        <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-green-200 rounded-full scale-75 opacity-20" />
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white">
            <Check size={40} strokeWidth={3} />
          </div>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-2 text-center">
          {t.thankYou}
        </h2>
        <p className="text-sm text-slate-500 font-medium text-center mb-8">
          {t.receiptMessage}
        </p>
        <div className="w-full bg-slate-100/90 border border-slate-200 rounded-[22px] md:rounded-[28px] p-6 mb-8 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black text-slate-500">
              {t.transactionDetails}
            </span>
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
              <Printer size={18} />
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">
                {t.transactionId}
              </span>
              <span className="text-sm font-black text-slate-900">
                {transactionId || '#NG-XXXX'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">
                {t.totalPaid}
              </span>
              <span className="text-sm font-black text-orange-600">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          <div className="flex justify-center">
            <span className="text-xs font-black text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200">
              {t.status}
            </span>
          </div>
        </div>
        <button
          onClick={onFinish}
          disabled={isSyncing}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg active:scale-95 disabled:opacity-50 transition-all"
        >
          {isSyncing ? t.finishing : t.finishShopping}
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
