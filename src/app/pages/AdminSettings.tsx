import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { pengaturanApi, licenseApi } from '../data/api';
import { useNavigate } from 'react-router';

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "text-xs font-medium text-gray-700 mb-1 block";

const KELAS_RS = ['A', 'B', 'C', 'D'];
const AKREDITASI = ['KARS', 'JCI', 'Paripurna', 'Madya', 'Dasar', 'Belum Terakreditasi'];

const EMPTY = {
  nama_rs: '', kota_rs: '', kelas_rs: '', akreditasi_rs: '',
  alamat_rs: '', no_telp_rs: '', email_rs: '', direktur_rs: '', logo_rs: '',
};

export default function AdminSettings() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['pengaturan'],
    queryFn: pengaturanApi.get,
  });

  const { data: license } = useQuery({
    queryKey: ['license'],
    queryFn: licenseApi.info,
  });

  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (settings) setForm({ ...EMPTY, ...settings });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: pengaturanApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pengaturan'] });
      toast.success('Pengaturan berhasil disimpan');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menyimpan pengaturan'),
  });

  function field(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  // License info
  const lic = license?.data ?? license ?? null;
  const licExpiry  = lic?.expiry_date ? new Date(lic.expiry_date) : null;
  const licDaysLeft = licExpiry ? Math.ceil((licExpiry.getTime() - Date.now()) / 86_400_000) : null;
  const licActive  = licDaysLeft !== null && licDaysLeft > 0;
  const licPct     = licDaysLeft !== null ? Math.max(0, Math.min(100, Math.round((licDaysLeft / 365) * 100))) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-gray-800 font-semibold text-lg leading-tight">Pengaturan Admin</h1>
          <p className="text-sm text-gray-500">Konfigurasi sistem dan informasi rumah sakit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT — RS Info form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Informasi Rumah Sakit</h2>

          {loadingSettings ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nama RS</label>
                  <input type="text" value={form.nama_rs} onChange={e => field('nama_rs', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kota</label>
                  <input type="text" value={form.kota_rs} onChange={e => field('kota_rs', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Kelas RS</label>
                  <select value={form.kelas_rs} onChange={e => field('kelas_rs', e.target.value)} className={inputCls}>
                    <option value="">Pilih Kelas</option>
                    {KELAS_RS.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Akreditasi</label>
                  <select value={form.akreditasi_rs} onChange={e => field('akreditasi_rs', e.target.value)} className={inputCls}>
                    <option value="">Pilih Akreditasi</option>
                    {AKREDITASI.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Alamat</label>
                <textarea
                  value={form.alamat_rs}
                  onChange={e => field('alamat_rs', e.target.value)}
                  rows={3}
                  className={inputCls + ' resize-none'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>No. Telepon</label>
                  <input type="text" value={form.no_telp_rs} onChange={e => field('no_telp_rs', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email RS</label>
                  <input type="email" value={form.email_rs} onChange={e => field('email_rs', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Direktur</label>
                <input type="text" value={form.direktur_rs} onChange={e => field('direktur_rs', e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Logo URL</label>
                <input type="text" value={form.logo_rs} onChange={e => field('logo_rs', e.target.value)} className={inputCls} placeholder="https://..." />
              </div>

              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending}
                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div className="space-y-5">
          {/* License card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Informasi Lisensi</h2>
            </div>

            {lic === null ? (
              <p className="text-sm text-gray-400 italic">Data lisensi tidak tersedia</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">{lic.rs_name ?? form.nama_rs ?? '-'}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${licActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {licActive ? 'AKTIF' : 'KADALUARSA'}
                  </span>
                </div>

                {licExpiry && (
                  <p className="text-xs text-gray-500">
                    Berlaku hingga:{' '}
                    <span className="font-medium text-gray-700">
                      {licExpiry.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </p>
                )}

                {licDaysLeft !== null && (
                  <p className="text-xs text-gray-500">
                    Sisa: <span className={`font-semibold ${licDaysLeft < 30 ? 'text-red-600' : 'text-gray-700'}`}>{licDaysLeft} hari</span>
                  </p>
                )}

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${licDaysLeft !== null && licDaysLeft < 30 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${licPct}%` }}
                  />
                </div>

                {/* Warning banner */}
                {licDaysLeft !== null && licDaysLeft < 30 && licDaysLeft > 0 && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      Lisensi akan kadaluarsa dalam <strong>{licDaysLeft} hari</strong>. Segera perbarui lisensi Anda.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* System info card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-4">Sistem</h2>

            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Versi Aplikasi</span>
                <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {import.meta.env.VITE_APP_VERSION ?? '1.0.0'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Environment</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  import.meta.env.MODE === 'production' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {import.meta.env.MODE ?? 'production'}
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tautan Cepat</p>
            <div className="space-y-2">
              {[
                { label: 'Audit Trail',  path: '/activity-log' },
                { label: 'Import Data',  path: '/pegawai' },
                { label: 'Integrasi',    path: '/credentialing' },
              ].map(link => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                >
                  {link.label}
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
