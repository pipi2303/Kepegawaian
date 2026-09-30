import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Building2 } from 'lucide-react';

interface Props {
  status?: string;
  errors?: Record<string, string>;
}

export default function LoginPage({ status, errors }: Props) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post('/login', form);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-[#013E37] to-teal-900 flex items-center justify-center p-4">
      <Head title="Masuk ke Sistem HCMS RSUDAM" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#013E37]/10 text-[#013E37] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#013E37]/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HCMS RSUDAM</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Informasi SDM & Kepegawaian Rumah Sakit</p>
        </div>

        {status && (
          <div className="mb-4 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            {status}
          </div>
        )}

        {errors?.email && (
          <div className="mb-4 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.email}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              NIP atau Email Resmi
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="19850101... atau nama@intramedika.hospital"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/20 focus:border-[#013E37] transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/20 focus:border-[#013E37] transition"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm py-1">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-[#013E37] focus:ring-[#013E37]"
              />
              <span>Ingat saya</span>
            </label>
            <a href="#" className="text-xs text-[#013E37] hover:underline font-medium">Lupa kata sandi?</a>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#013E37] hover:bg-[#025046] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#013E37]/20 transition"
          >
            <span>Masuk ke Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Keamanan Terenkripsi & Standar Akreditasi KARS</span>
        </div>
      </div>
    </div>
  );
}
