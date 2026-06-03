import React from 'react';
import {
  Camera,
  Barcode,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Lightbulb,
  Globe2,
  UserRound,
} from 'lucide-react';

interface SelectInputPageProps {
  onSelectAI: () => void;
  onSelectBarcode: () => void;
  onBack: () => void;
}

const BenefitItem = ({
  text,
  color = 'orange',
}: {
  text: string;
  color?: 'orange' | 'blue';
}) => (
  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
    <CheckCircle
      size={18}
      className={color === 'orange' ? 'text-orange-500' : 'text-blue-600'}
      fill="currentColor"
    />
    <span>{text}</span>
  </div>
);

const SelectInputPage: React.FC<SelectInputPageProps> = ({
  onSelectAI,
  onSelectBarcode,
  onBack,
}) => {
  return (
    <div className="min-h-screen w-full bg-white px-4 py-6">
      <div className="mx-auto w-full max-w-7xl px-4">
        {/* HEADER */}
        

        {/* BACK */}
        <button
          onClick={onBack}
          className="mt-12 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-5 py-3 text-sm font-bold text-orange-500 transition hover:bg-orange-100"
        >
          <ArrowLeft size={16} />
          Kembali ke Beranda
        </button>

        {/* TITLE */}
        <div className="relative mt-4 text-center">
          <div className="absolute right-10 top-0 hidden h-40 w-40 rounded-full bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:12px_12px] opacity-40 md:block" />

          <h2 className="text-4xl font-extrabold text-slate-950 md:text-5xl">
            Pilih Metode Input
          </h2>

          <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-orange-500" />

          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-slate-500">
            Gunakan kecerdasan YOLO untuk deteksi otomatis atau gunakan
            pemindai barcode konvensional.
          </p>
        </div>

        {/* CARDS */}
        <div className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-1 gap-7 lg:grid-cols-2">
          {/* CAMERA */}
          <button
            onClick={onSelectAI}
            className="group relative overflow-hidden rounded-[28px] border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/40 to-white p-8 text-left transition-all hover:-translate-y-1 hover:border-orange-400 hover:shadow-[0_18px_45px_rgba(249,115,22,0.18)]"
          >
            <div className="absolute left-7 top-7 inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-500">
              <Sparkles size={15} />
              Rekomendasi
            </div>

            <div className="mt-14 flex h-56 items-center justify-center">
              <div className="relative">
              <img
                src="/camera.png"
                alt="Scan Camera"
              className="h-60 w-80 object-contain"
              />
              </div>
            </div>

            <h3 className="mt-8 text-2xl font-extrabold text-slate-950">
              Scan Camera (YOLO)
            </h3>

            <p className="mt-3 max-w-sm text-base font-medium leading-relaxed text-slate-500">
              Gunakan kamera dan YOLO untuk mendeteksi dan menghitung barang
              secara otomatis.
            </p>

            <div className="mt-6 space-y-4">
              <BenefitItem text="Deteksi real-time dengan YOLOv8" />
              <BenefitItem text="Mengenali banyak objek" />
              <BenefitItem text="Akurat bahkan dengan sudut miring" />
              <BenefitItem text="Cepat dan efisien" />
            </div>

            <div className="mt-8 flex items-center justify-center gap-3 rounded-full bg-orange-500 px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-orange-500/30 transition group-hover:bg-orange-600">
              Gunakan Kamera
              <Camera size={22} />
            </div>
          </button>

          {/* BARCODE */}
          <button
            onClick={onSelectBarcode}
            className="group relative overflow-hidden rounded-[28px] border-2 border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-white p-8 text-left transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-[0_18px_45px_rgba(37,99,235,0.18)]"
          >
            <div className="mt-8 flex h-56 items-center justify-center">
              <img
                src="/barcode.png"
                alt="Scan Barcode"
                className="h-52 w-72 object-contain"
              />
            </div>

            <h3 className="mt-8 text-2xl font-extrabold text-slate-950">
              Scan Barcode
            </h3>

            <p className="mt-3 max-w-sm text-base font-medium leading-relaxed text-slate-500">
              Gunakan alat pemindai untuk memasukkan barang satu per satu.
            </p>

            <div className="mt-6 space-y-4">
              <BenefitItem color="blue" text="Input manual per item" />
              <BenefitItem color="blue" text="Cocok untuk barang dengan barcode" />
              <BenefitItem color="blue" text="Stabil dan mudah digunakan" />
            </div>

            <div className="mt-14 flex items-center justify-center gap-3 rounded-full bg-blue-600 px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-600/30 transition group-hover:bg-blue-700">
              Gunakan Scanner
              <Barcode size={24} />
            </div>
          </button>
        </div>

        {/* INFO */}
        <div className="mx-auto mt-10 flex max-w-5xl items-center gap-5 rounded-[24px] border border-slate-100 bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
            <Lightbulb size={30} />
          </div>

          <div>
            <h4 className="text-base font-extrabold text-slate-900">
              YOLO (You Only Look Once)
            </h4>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">
              Teknologi AI canggih yang dapat mendeteksi banyak objek dalam satu
              gambar secara real-time. Lebih cepat, lebih pintar, dan minim
              kesalahan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectInputPage;