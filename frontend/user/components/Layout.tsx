
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

const Layout: React.FC<LayoutProps> = ({ children, hideHeaderFooter = false, lang, onLangChange, t }) => {
  if (hideHeaderFooter) return <div className="flex-1 flex flex-col">{children}</div>;

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-[#F8FAFC]">
      {/* ── HEADER ── */}
      <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="w-full px-4 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden flex-shrink-0">
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
              <p className="text-base font-extrabold text-[#0F172A] tracking-tight">Ngolab</p>
              <p className="text-[9px] font-bold text-[#F97316] tracking-[0.18em] uppercase">Computer-Vision</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => onLangChange(lang === 'id' ? 'en' : 'id')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-semibold"
            >
              <Globe size={13} />
              {lang === 'id' ? 'Indonesia' : 'English'}
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {/* User icon */}
            <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all">
              <User size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full border-t border-slate-100 bg-white py-4">
        <p className="text-center text-slate-400 text-xs">
          {t?.copyright ?? '© 2024 Ngolab System • YOLO Vision • Belanja Tanpa Antre'}
        </p>
      </footer>
    </div>
  );
};

export default Layout;
