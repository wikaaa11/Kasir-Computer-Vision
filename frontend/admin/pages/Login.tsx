import React, { useMemo, useState } from 'react';
import {
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  Check,
} from 'lucide-react';
import type { AdminRole, AdminUser } from '../types';

interface LoginProps {
  onLogin: (user: AdminUser) => void;
}

type LoginRole = Extract<AdminRole, 'cv_admin'>;

const ROLE_CONFIG: Record<
  LoginRole,
  {
    label: string;
    name: string;
    username: string;
    password: string;
  }
> = {
  cv_admin: {
    label: 'Computer Vision Admin',
    name: 'CV Admin',
    username: 'admin',
    password: 'admin123',
  },
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [selectedRole] = useState<LoginRole>('cv_admin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => ROLE_CONFIG[selectedRole],
    [selectedRole]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      if (
        username === selectedAccount.username &&
        password === selectedAccount.password
      ) {
        onLogin({ name: selectedAccount.name, role: selectedRole });
      } else {
        setError('Username atau password salah.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FFF7ED] p-6">
      <div className="grid h-[560px] w-full max-w-4xl grid-cols-1 overflow-hidden rounded-[26px] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] lg:grid-cols-[1fr_0.72fr]">
        {/* LEFT IMAGE */}
        <div className="relative hidden overflow-hidden bg-[#FFE8D4] lg:block">
          <img
            src="/login.png"
            alt="Vision Admin Illustration"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-white/10" />
        </div>

        {/* RIGHT FORM */}
        <div className="relative flex items-center justify-center bg-white px-6 py-5">
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-orange-50/50 to-transparent" />

          <div className="relative z-10 w-full max-w-[310px]">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-4 ring-slate-50">
                <img
                  src="/logo.jpeg"
                  alt="Ngolab Logo"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              <h1 className="text-[19px] font-black tracking-tight text-[#0F172A]">
                Selamat datang kembali! 👋
              </h1>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Masuk untuk melanjutkan ke dashboard VisionAdmin
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold text-slate-800">
                  Username
                </label>

                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <User size={16} />
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Masukkan username"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold text-slate-800">
                  Password
                </label>

                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <Lock size={16} />
                  </div>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-11 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    <Eye size={17} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-0.5">
                <button
                  type="button"
                  onClick={() => setRemember((prev) => !prev)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"
                >
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-md transition ${
                      remember
                        ? 'bg-orange-500 text-white'
                        : 'border border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check size={12} strokeWidth={4} />
                  </span>
                  Ingat saya
                </button>

                <button
                  type="button"
                  className="text-[11px] font-extrabold text-orange-500 transition hover:text-orange-600"
                >
              
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2 text-[11px] font-bold text-red-500">
                  <AlertCircle size={13} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-1.5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-xs font-black text-white shadow-[0_10px_22px_rgba(249,115,22,0.22)] transition-all hover:from-orange-600 hover:to-orange-600 active:scale-[0.98] disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-[8px] font-bold uppercase tracking-[0.18em] text-slate-300">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;