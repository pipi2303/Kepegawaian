import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Hospital, Eye, EyeOff, LogIn, Shield, Users, User, Lock } from 'lucide-react';
import { useAppContext, appUsers } from '../context/AppContext';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const success = login(username, password);
    setLoading(false);
    if (success) {
      toast.success('Login berhasil! Selamat datang di HCMS Application');
      navigate('/');
    } else {
      setError('Username atau password salah. Silakan coba kembali.');
    }
  };

  const quickLogin = (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
  };

  const roleColor = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    direktur: 'bg-purple-100 text-purple-700 border-purple-200',
    kepala_unit: 'bg-blue-100 text-blue-700 border-blue-200',
    pegawai: 'bg-green-100 text-green-700 border-green-200',
  };
  const roleLabel = {
    admin: 'Admin',
    direktur: 'Direktur',
    kepala_unit: 'Kepala Unit',
    pegawai: 'Pegawai',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#013E37] via-[#012B26] to-[#01241F] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 shadow-2xl rounded-2xl overflow-hidden">
        {/* Left Panel */}
        <div className="hidden lg:flex flex-col justify-between bg-[#012B26] p-10 text-white">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-xl bg-[#FFEFB2]/20 flex items-center justify-center">
                <Hospital className="w-7 h-7 text-[#FFEFB2]" />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight text-[#FFEFB2]">HCMS Application</p>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4 leading-snug">
              Sistem Informasi<br />Manajemen Pegawai
            </h1>
            <p className="text-[#FFEFB2]/70 text-sm leading-relaxed">
              Platform pengelolaan data ASN terpadu sesuai PP No. 11/2017 dan PermenPAN-RB No. 6/2022 untuk Rumah Sakit.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: Users, text: 'Pengelolaan Data Pegawai PNS/PPPK/Honorer' },
              { icon: Shield, text: 'Sistem Persetujuan Cuti Multi-Level' },
              { icon: Lock, text: 'Akses berbasis Peran (RBAC)' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFEFB2]/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-[#FFEFB2]/70" />
                </div>
                <p className="text-[#FFEFB2]/70 text-sm">{f.text}</p>
              </div>
            ))}
            <p className="text-[#FFEFB2]/40 text-xs mt-4 border-t border-white/10 pt-4">
              HCMS Application v2.0 · Hak Cipta © 2026
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-white p-8 lg:p-10 flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#013E37] flex items-center justify-center">
              <Hospital className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800">HCMS Application</p>
              <p className="text-gray-500 text-xs">HCMS v2.0</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Masuk ke HCMS</h2>
          <p className="text-gray-500 text-sm mb-6">Gunakan akun yang telah diberikan oleh Admin</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Username / Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/40 focus:border-[#013E37]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/40 focus:border-[#013E37]"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#013E37] text-[#FFEFB2] rounded-xl font-medium text-sm hover:bg-[#025046] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}