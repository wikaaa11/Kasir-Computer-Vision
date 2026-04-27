
import React from 'react';
import { Shield, Cpu, Info, User, Moon, Globe, ExternalLink, FileSpreadsheet } from 'lucide-react';

const SettingsSection = ({ title, description, children, icon: Icon }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex items-start space-x-4 mb-6">
      <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 text-sm">Konfigurasi preferensi dashboard dan profil administrator.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Quick Links Section */}
        <SettingsSection 
          title="Cloud Resources" 
          description="Akses cepat ke database dan backend sistem Anda."
          icon={Globe}
        >
          <div className="flex flex-col sm:flex-row gap-4">
             <a 
               href="https://script.google.com" 
               target="_blank" 
               rel="noreferrer" 
               className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:border-orange-300 transition-all group"
             >
               <div className="flex items-center justify-between mb-1">
                  <Globe size={16} className="text-orange-500" />
                  <ExternalLink size={12} className="text-slate-400 group-hover:text-orange-500" />
               </div>
               <p className="font-bold text-slate-800 text-sm">Buka Apps Script</p>
               <p className="text-[10px] text-slate-400">Akses kode backend sistem.</p>
             </a>

             <a 
               href="https://docs.google.com/spreadsheets" 
               target="_blank" 
               rel="noreferrer" 
               className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:border-green-300 transition-all group"
             >
               <div className="flex items-center justify-between mb-1">
                  <FileSpreadsheet size={16} className="text-green-500" />
                  <ExternalLink size={12} className="text-slate-400 group-hover:text-green-500" />
               </div>
               <p className="font-bold text-slate-800 text-sm">Buka Google Sheet</p>
               <p className="text-[10px] text-slate-400">Lihat data transaksi mentah.</p>
             </a>
          </div>
        </SettingsSection>

        <SettingsSection 
          title="Profile & Security" 
          description="Update informasi akun administrator Anda."
          icon={User}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Name</label>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" defaultValue="Administrator Utama" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" defaultValue="admin@visioncashier.pro" />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection 
          title="AI Recognition Model" 
          description="Pilih model visi komputer yang akan digunakan."
          icon={Cpu}
        >
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="p-4 border-2 border-orange-600 bg-orange-50 rounded-2xl text-left transition-all">
                 <p className="font-bold text-orange-600 text-sm">Gemini 3 Flash</p>
                 <p className="text-[10px] text-orange-400">Tercepat & Direkomendasikan</p>
              </button>
              <button className="p-4 border border-slate-100 bg-white rounded-2xl text-left opacity-40 cursor-not-allowed">
                 <p className="font-bold text-slate-700 text-sm">Gemini 3 Pro</p>
                 <p className="text-[10px] text-slate-400">Presisi Tinggi (Tersedia Segera)</p>
              </button>
           </div>
        </SettingsSection>

        <SettingsSection 
          title="System Info" 
          description="Informasi mengenai versi aplikasi."
          icon={Info}
        >
          <div className="bg-slate-50 p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">App Version</span>
              <span className="text-slate-900 font-bold">8.2.0-PRO</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Backend Integration</span>
              <span className="text-green-600 font-bold">Connected (Hardcoded)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Last Sync</span>
              <span className="text-slate-900 font-bold">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
};

export default SettingsPage;
