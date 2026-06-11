import React from 'react';
import { Language } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  hideHeaderFooter?: boolean;
  lang: Language;
  onLangChange: (lang: Language) => void;
  t: any;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideHeaderFooter = false,
  t,
}) => {
  if (hideHeaderFooter) {
    return (
      <div className="min-h-screen w-full bg-white overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* HEADER */}
      <header className="w-full bg-white border-b border-slate-200 shrink-0">
        <div className="w-full px-4 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="/logo.jpeg"
                alt="Ngolab Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <div className="leading-none">
              <p className="text-base font-extrabold text-[#0F172A] tracking-tight">
                Ngolab
              </p>
              <p className="text-[9px] font-bold text-[#F97316] tracking-[0.18em] uppercase">
                Computer-Vision
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 bg-white overflow-x-hidden overflow-y-auto">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="w-full h-[52px] bg-white border-t border-slate-200 flex items-center justify-center shrink-0">
        <p className="text-[13px] font-medium text-slate-400">
          {t?.copyright ??
            '© 2024 Ngolab System • Mitra Terpercaya Belanja Anda'}
        </p>
      </footer>
    </div>
  );
};

export default Layout;