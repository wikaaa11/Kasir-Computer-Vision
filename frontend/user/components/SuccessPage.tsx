import React from 'react';
import { Check, ArrowRight, ShoppingBag, Heart, ReceiptText } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#4B596A] p-3">
      <div className="relative flex w-full max-w-[380px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.35)]">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-green-100/60 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-green-100/70 blur-3xl" />
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-green-50/70 via-transparent to-transparent" />
        </div>

        <div className="relative z-20 flex flex-col items-center px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <img
              src="/logo.jpeg"
              alt="Ngolab Logo"
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-200/70">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-green-500 text-white shadow-[0_12px_26px_rgba(34,197,94,0.35)]">
                <Check size={30} strokeWidth={3.5} />
              </div>
            </div>
          </div>

          <h1 className="mt-4 text-center text-2xl font-black leading-tight text-slate-950">
            {t?.thankYou ?? 'Terima Kasih!'}
          </h1>

          <p className="mt-1 text-center text-sm font-black text-green-600">
            Pembayaran berhasil
          </p>

          <p className="mt-2 max-w-[290px] text-center text-xs font-medium leading-relaxed text-slate-500">
            Pembayaran Anda telah kami terima. Struk transaksi ditampilkan di
            bawah ini.
          </p>

          <div className="mt-4 w-full rounded-[20px] border border-slate-100 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <ReceiptText size={16} />
              </div>

              <h2 className="text-[11px] font-black uppercase tracking-wide text-green-600">
                Struk Transaksi
              </h2>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700">
                  ID Transaksi
                </span>

                <span className="text-right text-xs font-black text-slate-950 break-all">
                  {transactionId || 'CV-ORD-1780563640777'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700">
                  Total Lunas
                </span>

                <span className="text-right text-sm font-black text-orange-500">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex w-full items-center gap-3 rounded-[18px] border-2 border-green-200 bg-green-50 p-3 shadow-[0_8px_24px_rgba(34,197,94,0.16)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-400 text-white shadow-[0_8px_18px_rgba(34,197,94,0.25)]">
              <ShoppingBag size={20} />
            </div>

            <div>
              <h3 className="text-xs font-black text-green-800">
                Terima kasih telah berbelanja di Ngolab!
              </h3>
              <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-600">
                Semoga harimu menyenangkan. Sampai jumpa di transaksi
                berikutnya!
                <Heart
                  size={11}
                  className="ml-1 inline-block text-green-500"
                  fill="currentColor"
                />
              </p>
            </div>
          </div>

          <button
            onClick={onFinish}
            disabled={isSyncing}
            className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-orange-500 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(249,115,22,0.35)] transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
          >
            {isSyncing
              ? t?.finishing ?? 'Menyelesaikan...'
              : t?.finishShopping ?? 'Selesai Belanja'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;