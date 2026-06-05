import React from 'react';
import {
  Camera,
  Barcode,
  ArrowLeft,
  Sparkles,
  CheckCircle,
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
  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
    <CheckCircle
      size={14}
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
    <div className="w-full h-full min-h-full overflow-hidden bg-white px-4 py-2">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col bg-white px-4">
        {/* BACK */}
        <button
          onClick={onBack}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-500 transition hover:bg-orange-100"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </button>

        {/* TITLE */}
        <div className="relative mt-1 text-center">
          <h2 className="text-2xl font-extrabold text-slate-950 md:text-3xl">
            Pilih Metode Input
          </h2>

          <div className="mx-auto mt-1.5 h-1 w-10 rounded-full bg-orange-500" />

          <p className="mx-auto mt-1.5 max-w-xl text-xs font-medium leading-relaxed text-slate-500">
            Gunakan YOLO untuk deteksi otomatis atau pemindai barcode konvensional.
          </p>
        </div>

        {/* CARDS */}
        <div className="mx-auto mt-10 grid w-full max-w-[900px] grid-cols-1 gap-4 bg-white lg:grid-cols-2">
          {/* CAMERA */}
          <button
            onClick={onSelectAI}
            className="group relative flex h-[400px] flex-col overflow-hidden rounded-[24px] border-2 border-orange-200 bg-white p-5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-[0_16px_40px_rgba(249,115,22,0.16)]"
          >
            <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-500">
              <Sparkles size={13} />
              Rekomendasi
            </div>

            <div className="mt-6 flex h-24 items-center justify-center bg-white">
              <img
                src="/camera.png"
                alt="Scan Camera"
                className="h-28 w-44 object-contain bg-white"
              />
            </div>

            <h3 className="mt-3 text-base font-extrabold text-slate-950">
              Scan Camera (YOLO)
            </h3>

            <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-slate-500">
              Gunakan kamera dan YOLO untuk mendeteksi produk secara otomatis.
            </p>

            <div className="mt-3 space-y-1.5">
              <BenefitItem text="Deteksi real-time dengan YOLOv8" />
              <BenefitItem text="Mengenali satu produk dari foto" />
              <BenefitItem text="Akurat dengan sudut miring" />
              <BenefitItem text="Cepat dan efisien" />
            </div>

            <div className="mt-auto flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-orange-500/25 transition group-hover:bg-orange-600">
              Gunakan Kamera
              <Camera size={17} />
            </div>
          </button>

          {/* BARCODE */}
          <button
            onClick={onSelectBarcode}
            className="group relative flex h-[400px] flex-col overflow-hidden rounded-[24px] border-2 border-blue-200 bg-white p-5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-[0_16px_40px_rgba(37,99,235,0.16)]"
          >
            <div className="mt-6 flex h-24 items-center justify-center bg-white">
              <img
                src="/barcode.png"
                alt="Scan Barcode"
                className="h-28 w-44 object-contain bg-white"
              />
            </div>

            <h3 className="mt-3 text-base font-extrabold text-slate-950">
              Scan Barcode
            </h3>

            <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-slate-500">
              Gunakan alat pemindai untuk memasukkan barang satu per satu.
            </p>

            <div className="mt-3 space-y-1.5">
              <BenefitItem color="blue" text="Input manual per item" />
              <BenefitItem color="blue" text="Cocok untuk barang barcode" />
              <BenefitItem color="blue" text="Stabil dan mudah digunakan" />
              <BenefitItem color="blue" text="Proses sederhana" />
            </div>

            <div className="mt-auto flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/25 transition group-hover:bg-blue-700">
              Gunakan Scanner
              <Barcode size={18} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectInputPage;