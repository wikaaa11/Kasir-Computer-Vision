import React from 'react';
import { Globe, User, ChevronDown } from 'lucide-react';
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
  lang,
  onLangChange,
  t,
}) => {
  if (hideHeaderFooter) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        {children}
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col overflow-hidden">
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLangChange(lang === 'id' ? 'en' : 'id')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-xs font-semibold"
            >
              <Globe size={13} />
              {lang === 'id' ? 'Indonesia' : 'English'}
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
              <User size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 min-h-0 bg-white overflow-hidden">
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