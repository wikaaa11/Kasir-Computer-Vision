import React from 'react';
import { Camera, ShoppingBag, Users, QrCode } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  t: any;
}

const Check = () => (
  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
    <svg
      className="w-2.5 h-2.5 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

const ProductCard = ({
  name,
  sub,
  price,
  img,
}: {
  name: string;
  sub: string;
  price: string;
  img: string;
}) => (
  <div className="bg-white rounded-2xl px-3 py-2 flex items-center gap-2.5 min-w-[148px] shadow-[0_12px_28px_rgba(15,23,42,0.13)]">
    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
      <img src={img} alt={name} className="max-w-full max-h-full object-contain" />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-xs font-bold text-slate-800 leading-tight truncate">
          {name}
        </p>
        <Check />
      </div>
      <p className="text-[9px] text-slate-400 truncate">{sub}</p>
      <p className="text-xs font-extrabold text-slate-900 mt-0.5">{price}</p>
    </div>
  </div>
);

const MembershipCard = () => (
  <div className="w-full max-w-[445px] bg-white rounded-[20px] shadow-[0_12px_32px_rgba(15,23,42,0.10)] px-4 py-2.5 flex items-center gap-3">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2E1065] to-[#6D28D9] flex items-center justify-center flex-shrink-0">
      <Users size={25} className="text-white" strokeWidth={2.5} />
    </div>

    <div className="flex-1 min-w-0">
      <h3 className="text-base font-extrabold text-[#0F172A] leading-tight">
        Membership Ngolab
      </h3>
      <p className="mt-0.5 text-[12px] font-medium text-slate-500 leading-snug">
        Gabung jadi member dan nikmati diskon, poin, dan voucher eksklusif!
      </p>
    </div>

    <div className="h-12 w-px bg-slate-200 hidden sm:block" />

    <div className="flex flex-col items-center justify-center flex-shrink-0">
      <QrCode size={36} className="text-black" strokeWidth={2.5} />
      <p className="text-[10px] font-extrabold text-[#4C1D95] leading-none mt-0.5">
        Scan Me
      </p>
    </div>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onStart, t }) => {
  return (
    <div className="w-full min-h-full bg-white">
      <section className="w-full min-h-[calc(100vh-118px)] bg-white px-4 sm:px-6 lg:px-8 pt-14 pb-10 flex items-center">
        <div className="max-w-7xl mx-auto w-full bg-white grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 items-center">
          {/* LEFT */}
          <div className="flex flex-col items-start bg-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 rounded-full border border-orange-200 text-[#EA580C] text-xs font-extrabold">
              <ShoppingBag size={14} />
              Smart Shopping
            </div>

            <div className="mt-3 space-y-0.5">
              <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#0F172A] leading-[1.03] tracking-tight">
                {t?.heroTitle1 ?? 'Belanja Cepat,'}
              </h2>
              <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#F97316] leading-[1.03] tracking-tight">
                {t?.heroTitle2 ?? 'Tanpa Antre.'}
              </h2>
            </div>

            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed font-medium">
              {t?.heroDesc ??
                'Gunakan teknologi Computer Vision untuk mendeteksi barang Anda secara instan. Cukup foto, bayar, dan selesai!'}
            </p>

            <button
              onClick={onStart}
              className="mt-4 group inline-flex items-center gap-4 bg-[#F97316] hover:bg-[#EA580C] text-white px-8 py-3 rounded-full text-base font-extrabold transition-all shadow-lg shadow-orange-300/50 active:scale-95"
            >
              {t?.startBtn ?? 'Mulai Belanja'}
              <Camera size={20} className="group-hover:rotate-12 transition-transform" />
            </button>

            <div className="mt-8 lg:mt-12 w-full">
              <MembershipCard />
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex items-center justify-center h-[420px] lg:h-[420px] mt-4 lg:mt-0 bg-white">
            <div className="relative z-10 flex items-center justify-center w-[315px] h-[315px] lg:w-[430px] lg:h-[430px] bg-transparent">
              <img
                src="/keranjangg.png"
                alt="Shopping Cart"
                className="w-full h-full object-contain [filter:brightness(1.02)_contrast(1.02)]"
              />
            </div>

            <div className="absolute top-6 right-2 sm:right-6 lg:right-10 z-20 animate-float-slow">
              <ProductCard
                name="Chips"
                sub="Keripik Original"
                price="Rp 12.000"
                img="/chips.png"
              />
            </div>

            <div className="absolute top-[190px] lg:top-[205px] right-0 lg:right-4 z-20 hidden sm:block animate-float-slow">
              <ProductCard
                name="Milk"
                sub="Susu UHT 1L"
                price="Rp 18.000"
                img="/milk.png"
              />
            </div>

            <div className="absolute top-[40%] left-0 lg:left-8 z-20 animate-float-medium">
              <ProductCard
                name="Coffee"
                sub="Kopi Latte"
                price="Rp 15.000"
                img="/coffe.png"
              />
            </div>

            <div className="absolute bottom-6 left-8 lg:left-14 z-20 animate-float-slow">
              <ProductCard
                name="Water"
                sub="Air Mineral 600ml"
                price="Rp 5.000"
                img="/water.png"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;