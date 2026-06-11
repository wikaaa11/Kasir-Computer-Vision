import React, { useEffect, useId, useRef, useState } from 'react';
import { User, X, Camera, AlertCircle, ScanLine } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface MembershipPageProps {
  onSkip: () => void;
  onDetected: (memberCode: string) => void;
  isChecking?: boolean;
  t: any;
}

const MembershipPage: React.FC<MembershipPageProps> = ({
  onSkip,
  onDetected,
  isChecking = false,
  t,
}) => {
  const qrReaderId = useId().replace(/:/g, '');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasDetectedRef = useRef(false);
  const isScannerRunningRef = useRef(false);

  const extractMemberCode = (decodedText: string): string | null => {
    const trimmed = decodedText.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);

      if (parsed && typeof parsed === 'object') {
        return (
          parsed.user_id ||
          parsed.member_id ||
          parsed.memberCode ||
          parsed.code ||
          null
        );
      }
    } catch {
      return trimmed;
    }

    return trimmed;
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (isScannerRunningRef.current) {
        await scanner.stop();
      }

      scanner.clear();
    } catch (err) {
      console.error('Failed to stop scanner:', err);
    } finally {
      scannerRef.current = null;
      isScannerRunningRef.current = false;
    }
  };

  const onQrResult = async (decodedText: string) => {
    if (isChecking || hasDetectedRef.current) return;

    const code = extractMemberCode(decodedText);
    if (!code) return;

    hasDetectedRef.current = true;
    await stopScanner();
    onDetected(code);
  };

  const startScanner = async () => {
    if (isChecking || scannerRef.current) return;

    const readerElement = document.getElementById(qrReaderId);
    if (!readerElement) return;

    try {
      setScanError(null);
      setIsCameraStarting(true);
      hasDetectedRef.current = false;

      const html5QrCode = new Html5Qrcode(qrReaderId, {
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 180, height: 180 },
          aspectRatio: 1,
        },
        onQrResult,
        () => {}
      );

      isScannerRunningRef.current = true;
      setIsCameraStarting(false);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);

      scannerRef.current = null;
      isScannerRunningRef.current = false;
      setIsCameraStarting(false);

      setScanError(
        err?.message ||
          'Tidak dapat mengakses kamera. Pastikan izin kamera diizinkan.'
      );
    }
  };

  const handleSkip = async () => {
    await stopScanner();
    onSkip();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      window.clearTimeout(timer);
      stopScanner();
    };
  }, [isChecking]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-slate-900 p-3 md:p-4">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F97316] opacity-10 blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_45%)]" />

      <div className="relative z-10 flex w-full max-w-[340px] flex-col items-center rounded-[22px] border border-white/10 bg-slate-900/25 px-3 py-3 backdrop-blur-md">
        <div className="mb-2.5 flex flex-col items-center">
          <div className="vision-shadow mb-1.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white">
            <img
              src="/logo.jpeg"
              alt="Ngolab Logo"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <span className="text-[8px] font-black uppercase tracking-widest text-[#F97316]">
            {t.title}
          </span>
        </div>

        <div className="mb-3 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-600/15 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-[#F97316]">
            <User size={11} />
            {t.check}
          </div>

          <h2 className="mb-1.5 text-[26px] font-black leading-[1.05] text-white">
            {t.scanCard}
          </h2>

          <p className="text-xs text-slate-400">
            Arahkan QR/barcode membership ke kamera.
          </p>
        </div>

        <div className="relative mb-3 aspect-square w-full max-w-[205px]">
          <div className="absolute inset-0 rounded-[26px] border-2 border-white/10" />

          <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-[18px] border-l-4 border-t-4 border-[#F97316]" />
          <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-[18px] border-r-4 border-t-4 border-[#F97316]" />
          <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-[18px] border-b-4 border-l-4 border-[#F97316]" />
          <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-[18px] border-b-4 border-r-4 border-[#F97316]" />

          <div className="absolute inset-4 overflow-hidden rounded-[18px] bg-slate-950">
            <div
              id={qrReaderId}
              className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
            />

            {isCameraStarting && !scanError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-300">
                <Camera size={24} className="mb-2 text-orange-400" />
                <p className="text-[11px] font-bold">Membuka kamera...</p>
              </div>
            )}

            {scanError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-3 text-center">
                <AlertCircle size={24} className="mb-2 text-red-400" />
                <div className="mb-1.5 text-[11px] font-bold text-red-400">
                  Kamera tidak aktif
                </div>
                <div className="text-[9px] leading-relaxed text-slate-400">
                  {scanError}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 w-full rounded-[20px] border border-orange-500/20 bg-orange-500/10 p-3">
          <div className="mb-2 flex items-center gap-2">
            <ScanLine size={15} className="text-[#F97316]" />
            <p className="text-[11px] font-black uppercase tracking-widest text-white">
              Langkah Scan
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium leading-relaxed text-slate-300">
              1. Buka QR/barcode membership pelanggan.
            </p>
            <p className="text-[11px] font-medium leading-relaxed text-slate-300">
              2. Arahkan kode ke area kotak scan.
            </p>
            <p className="text-[11px] font-medium leading-relaxed text-slate-300">
              3. Tunggu sampai kode terbaca otomatis.
            </p>
          </div>
        </div>

        <button
          onClick={handleSkip}
          disabled={isChecking}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-white/5 py-3 text-xs font-bold text-slate-400 transition-all hover:bg-white/10 disabled:opacity-30"
        >
          <X size={16} />
          {t.noMember}
        </button>
      </div>
    </div>
  );
};

export default MembershipPage;