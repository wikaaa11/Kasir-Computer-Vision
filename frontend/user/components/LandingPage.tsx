import React from 'react';
import {
  Camera,
  Zap,
  ShieldCheck,
  Target,
  ArrowRight,
  Gift,
  Percent,
  QrCode,
  Users,
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  t: any;
}

const Check = () => (
  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
    <svg
      className="w-3 h-3 text-green-500"
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
  <div className="bg-white rounded-2xl border border-slate-100 px-3 py-2.5 flex items-center gap-3 min-w-[170px] shadow-[0_14px_35px_rgba(15,23,42,0.16)] hover:shadow-[0_18px_45px_rgba(15,23,42,0.20)] transition-all duration-300">
    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
      <img
        src={img}
        alt={name}
        className="max-w-full max-h-full object-contain"
      />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-800 leading-tight truncate">
          {name}
        </p>
        <Check />
      </div>
      <p className="text-[10px] text-slate-400 truncate">{sub}</p>
      <p className="text-sm font-extrabold text-slate-900 mt-0.5">{price}</p>
    </div>
  </div>
);

const FeatureItem = ({
  icon,
  title,
  desc,
  color,
  bg,
  border,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
}) => (
  <div className="flex items-center gap-4 px-4 md:px-5 py-4 lg:border-r lg:last:border-r-0 border-slate-200">
    <div
      className={`w-16 h-16 rounded-[20px] ${bg} ${border} flex items-center justify-center flex-shrink-0`}
    >
      <div className={color}>{icon}</div>
    </div>

    <div>
      <h3 className="text-lg font-extrabold text-[#0F172A] leading-tight">
        {title}
      </h3>
      <p className="mt-1 text-sm font-medium text-slate-500 leading-snug">
        {desc}
      </p>
    </div>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onStart, t }) => {
  return (
    <div className="w-full bg-white overflow-x-hidden">
      {/* HERO */}
      <section className="w-full py-14 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-0 items-center">
          {/* LEFT */}
          <div className="flex flex-col items-start space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-200 text-[#EA580C] text-xs font-bold">
              <Zap size={14} fill="currentColor" />
              YOLO Vision
            </div>

            <div className="space-y-2">
              <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] leading-tight tracking-tight">
                {t?.heroTitle1 ?? 'Belanja Cepat,'}
              </h2>
              <h2 className="text-5xl sm:text-6xl font-extrabold text-[#F97316] leading-tight tracking-tight">
                {t?.heroTitle2 ?? 'Tanpa Antre.'}
              </h2>
            </div>

            <p className="text-base text-slate-600 max-w-md leading-relaxed font-medium">
              {t?.heroDesc ??
                'Gunakan teknologi Computer Vision untuk mendeteksi barang Anda secara instan. Cukup foto, bayar, dan selesai!'}
            </p>

            <button
              onClick={onStart}
              className="group inline-flex items-center gap-3 bg-[#F97316] hover:bg-[#EA580C] text-white px-8 py-4 rounded-full text-base font-bold transition-all shadow-lg shadow-orange-300/50 active:scale-95"
            >
              {t?.startBtn ?? 'Mulai Belanja'}
              <Camera size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>

          {/* RIGHT */}
          <div className="relative flex items-center justify-center h-[470px] lg:h-[540px]">
            <div className="relative z-10 flex items-center justify-center w-[380px] h-[380px] lg:w-[500px] lg:h-[500px] bg-white">
              <img
                src="/keranjangg.png"
                alt="Shopping Cart"
                className="w-full h-full object-contain bg-white [filter:brightness(1.02)_contrast(1.02)]"
              />
            </div>

            <div className="absolute top-8 right-8 lg:right-10 animate-float-slow z-20">
              <ProductCard
                name="Chips"
                sub="Keripik Original"
                price="Rp 12.000"
                img="/chips.png"
              />
            </div>

            <div className="absolute top-[240px] lg:top-[270px] right-2 lg:right-4 animate-float-slow z-20 hidden sm:block">
              <ProductCard
                name="Milk"
                sub="Susu UHT 1L"
                price="Rp 18.000"
                img="/milk.png"
              />
            </div>

            <div className="absolute top-[34%] left-2 lg:left-4 animate-float-medium z-20">
              <ProductCard
                name="Coffee"
                sub="Kopi Latte"
                price="Rp 15.000"
                img="/coffe.png"
              />
            </div>

            <div className="absolute bottom-10 left-8 lg:left-10 animate-float-slow z-20">
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

      {/* FEATURE BAR */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[26px] border border-purple-100 px-3 md:px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <FeatureItem
                icon={<Target size={34} strokeWidth={3} />}
                title="Deteksi Akurat"
                desc="Menggunakan YOLOv8 real-time"
                color="text-orange-600"
                bg="bg-orange-50"
                border="border border-orange-100"
              />

              <FeatureItem
                icon={<Zap size={34} strokeWidth={3} />}
                title="Cepat"
                desc="Proses hanya dalam hitungan menit"
                color="text-orange-600"
                bg="bg-orange-50"
                border="border border-orange-100"
              />

              <FeatureItem
                icon={<ShieldCheck size={36} strokeWidth={3} />}
                title="Aman & Privat"
                desc="Data 100% privat dan aman"
                color="text-green-500"
                bg="bg-green-50"
                border="border border-green-100"
              />

              <FeatureItem
                icon={<Users size={36} strokeWidth={3} />}
                title="0 Antrian"
                desc="Belanja tanpa antre, lebih efisien"
                color="text-purple-500"
                bg="bg-purple-50"
                border="border border-purple-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* MEMBERSHIP BANNER */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#07155A] via-[#1B1768] to-[#8B2CEB] px-8 sm:px-10 lg:px-14 py-10 shadow-2xl">
            <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-purple-500/35 rounded-full blur-3xl" />
            <div className="absolute right-10 -bottom-20 w-80 h-72 bg-fuchsia-500/25 rounded-full blur-3xl" />
            <div className="absolute left-[40%] bottom-[-80px] w-[420px] h-[220px] bg-purple-600/30 rounded-full blur-2xl" />

            <div className="absolute left-[48%] top-[36%] text-yellow-300 text-3xl">✦</div>
            <div className="absolute left-[58%] bottom-[22%] text-pink-400 text-4xl">✦</div>
            <div className="absolute right-[25%] top-[14%] text-yellow-300 text-4xl">✦</div>
            <div className="absolute right-[4%] top-[22%] text-yellow-300 text-4xl">✦</div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="max-w-xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white text-sm font-bold mb-5">
                  <Users size={16} />
                  Membership Ngolab
                </div>

                <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                  Gabung Jadi Member
                </h2>

                <p className="mt-3 text-white/85 text-base lg:text-lg leading-relaxed max-w-lg">
                  Nikmati berbagai macam diskon, reward point, voucher eksklusif,
                  dan promo spesial setiap transaksi.
                </p>

                <button
                  onClick={onStart}
                  className="mt-7 bg-green-500 hover:bg-green-600 text-white font-extrabold px-8 py-4 rounded-full inline-flex items-center gap-3 transition-all shadow-lg shadow-green-500/30 active:scale-95"
                >
                  Join Now
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="relative w-full lg:w-[500px] h-[220px] hidden sm:block">
                <div className="absolute left-5 top-4 w-[80px] h-[80px] rounded-[24px] bg-gradient-to-b from-[#B450FF] to-[#8127F3] flex items-center justify-center shadow-2xl">
                  <Percent size={45} className="text-white" />
                </div>

                <div className="absolute left-[130px] top-[75px] w-[105px] h-[105px] rounded-[24px] bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center rotate-[12deg] shadow-2xl">
                  <Gift size={58} className="text-yellow-300" />
                </div>

                <div className="absolute right-4 top-0 bg-white rounded-[24px] w-[150px] h-[190px] flex flex-col items-center justify-center shadow-2xl">
                  <div className="w-[105px] h-[105px] flex items-center justify-center">
                    <QrCode size={95} className="text-black" />
                  </div>

                  <p className="mt-2 text-[#2B1A87] text-lg font-extrabold">
                    Scan Me
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;