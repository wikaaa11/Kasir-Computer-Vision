
import React from 'react';
import { Globe, HelpCircle } from 'lucide-react';
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
    <div className="flex-1 flex flex-col w-full px-4 md:px-6 py-4 md:py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 md:mb-12 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center vision-shadow overflow-hidden border border-slate-100">
            <img 
              src="/logo.jpeg" 
              alt="Ngolab Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[#0F172A] leading-none">Ngolab</h1>
            <p className="text-[8px] md:text-[10px] font-semibold text-[#F97316] tracking-widest uppercase">computer-vision</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => onLangChange(lang === 'id' ? 'en' : 'id')}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs md:text-sm font-medium"
          >
            <Globe size={14} />
            {lang === 'id' ? 'Indonesia' : 'English'}
          </button>
          <button className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs md:text-sm font-medium">
            <HelpCircle size={14} />
            <span className="hidden xs:inline">{t.help}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col flex-1 items-center justify-center px-4 md:px-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-slate-400 text-xs max-w-[1600px] mx-auto w-full">
        <p>{t.copyright}</p>
      </footer>
    </div>
  );
};

export default Layout;
