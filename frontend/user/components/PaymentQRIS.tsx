import React from 'react';
import {
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Zap,
  Wallet,
  Info,
  ArrowRight,
} from 'lucide-react';

interface PaymentQRISProps {
  onBack: () => void;
  onSuccess: () => void;
  total: number;
  t: any;
}

const PaymentQRIS: React.FC<PaymentQRISProps> = ({
  onBack,
  onSuccess,
  total,
  t,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#4B596A] p-3">
      <div className="relative flex w-full max-w-[380px] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.35)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-[210px] h-44 w-44 rounded-full bg-orange-100/50 blur-3xl" />
          <div className="absolute -right-16 bottom-20 h-44 w-44 rounded-full bg-orange-100/40 blur-3xl" />
          <div className="absolute right-8 top-8 grid grid-cols-5 gap-1.5 opacity-25">
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className="h-1 w-1 rounded-full bg-orange-300" />
            ))}
          </div>
        </div>

        

        <div className="relative z-10 flex flex-col items-center px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <img
              src="/logo.jpeg"
              alt="Ngolab Logo"
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <p className="mt-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-orange-500">
            Ngolab Payment
          </p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-orange-500">
            <QrCode size={13} />
            <span className="text-[9px] font-black uppercase tracking-[0.22em]">
              Scan & Bayar
            </span>
          </div>

          <h1 className="mt-3 text-center text-[28px] font-black leading-tight text-slate-950">
            QRIS Pembayaran
          </h1>

          <p className="mt-1 max-w-[300px] text-center text-[11px] font-medium leading-relaxed text-slate-500">
            Scan kode QRIS berikut menggunakan aplikasi pembayaran pilihan Anda
          </p>

          <div className="relative mt-3 rounded-[24px] bg-white p-2 shadow-[0_12px_32px_rgba(249,115,22,0.16)]">
            <div className="absolute -inset-2 -z-10 rounded-[28px] bg-orange-50/70" />

            <div className="rounded-[18px] border border-orange-100 bg-white p-3 shadow-inner">
              <img
                src="/QRIS%20NGOLAB_page-0001.jpg"
                alt="QRIS Code"
                className="h-28 w-28 object-contain"
              />
            </div>
          </div>

          <div className="mt-3 grid w-full grid-cols-3 gap-2 rounded-[18px] bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <FeatureItem icon={<ShieldCheck size={15} />} title="Aman" desc="Scan QRIS" />
            <FeatureItem icon={<Zap size={15} />} title="Cepat" desc="Praktis" />
            <FeatureItem icon={<Wallet size={15} />} title="E-Wallet" desc="Bank QRIS" />
          </div>

          <div className="mt-2 flex w-full gap-2 rounded-xl bg-orange-50 px-2.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
              <Info size={12} />
            </div>

            <div>
              <h3 className="text-[11px] font-black text-orange-800">
                Setelah pembayaran berhasil
              </h3>
              <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-slate-600">
                Tekan tombol simulasi bayar untuk melanjutkan transaksi.
              </p>
            </div>
          </div>

          <div className="mt-3 w-full border-t border-slate-100 pt-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Total Tagihan
                </p>
                <p className="mt-0.5 text-xl font-black text-slate-950">
                  Rp {total.toLocaleString('id-ID')}
                </p>
              </div>

              <button
                onClick={onSuccess}
                className="group flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)] hover:bg-orange-600 active:scale-95"
              >
                {t?.simulatePay ?? 'Simulasi Bayar'}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 group-hover:translate-x-1">
                  <ArrowRight size={13} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex flex-col items-center text-center">
    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-500">
      {icon}
    </div>
    <p className="text-[9px] font-black text-slate-800">{title}</p>
    <p className="mt-0.5 text-[8px] font-medium text-slate-500">{desc}</p>
  </div>
);

export default PaymentQRIS;