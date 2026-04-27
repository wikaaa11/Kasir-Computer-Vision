
import React, { useMemo, useState } from 'react';
import { Target, Lock, User, ArrowRight, Loader2, AlertCircle, Cpu } from 'lucide-react';
import type { AdminRole, AdminUser } from '../types';

interface LoginProps {
  onLogin: (user: AdminUser) => void;
}

type LoginRole = Extract<AdminRole, 'cv_admin'>;

const ROLE_CONFIG: Record<LoginRole, { label: string; name: string; username: string; password: string; icon: any }> = {
  cv_admin: {
    label: 'Computer Vision Admin',
    name: 'CV Admin',
    username: 'admin',
    password: 'admin123',
    icon: Cpu,
  },
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<LoginRole>('cv_admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(() => ROLE_CONFIG[selectedRole], [selectedRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      if (username === selectedAccount.username && password === selectedAccount.password) {
        onLogin({ name: selectedAccount.name, role: selectedRole });
      } else {
        setError('Username atau password salah.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-orange-200">
            <Target size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vision<span className="text-orange-600">Admin</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Enterprise Retail Management Console</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 gap-2 mb-6">
            {(Object.keys(ROLE_CONFIG) as LoginRole[]).map((role) => {
              const config = ROLE_CONFIG[role];
              const Icon = config.icon;
              const active = selectedRole === role;

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 rounded-2xl border text-left transition-all ${active ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-200 hover:bg-orange-50/50'}`}
                >
                  <Icon size={16} className="mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">{config.label}</p>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  required
                  placeholder={selectedAccount.username} 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder={selectedAccount.password} 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">
                Login cepat: {selectedAccount.username} / {selectedAccount.password}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-orange-600 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-[10px] mt-8 font-bold uppercase tracking-widest">
          Authorized Personnel Only • IP Logged
        </p>
      </div>
    </div>
  );
};

export default Login;
