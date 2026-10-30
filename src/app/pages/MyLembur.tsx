import React, { useState, useMemo } from 'react';
import { Timer, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

type LemburRecord = {
  id: number;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  jenis_hari: string;
  alasan: string;
  status: 'Diajukan' | 'Disetujui' | 'Ditolak';
  upah_lembur?: number;
  catatan?: string;
};

const statusConfig = {
  Diajukan:  { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  Disetujui: { color: 'text-green-700',  bg: 'bg-green-100'  },
  Ditolak:   { color: 'text-red-700',    bg: 'bg-red-100'    },
};

const JENIS_HARI = ['Hari Kerja', 'Hari Libur', 'Hari Raya'];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

function hitungDurasi(mulai: string, selesai: string): number {
  if (!mulai || !selesai) return 0;
  const [mH, mM] = mulai.split(':').map(Number);
  const [sH, sM] = selesai.split(':').map(Number);
  const totalMin = (sH * 60 + sM) - (mH * 60 + mM);
  return totalMin > 0 ? Math.round((totalMin / 60) * 10) / 10 : 0;
}

const EMPTY_FORM = { tanggal: '', jam_mulai: '', jam_selesai: '', jenis_hari: 'Hari Kerja', alasan: '' };

export default function MyLembur() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const durasi = useMemo(
    () => hitungDurasi(form.jam_mulai, form.jam_selesai),
    [form.jam_mulai, form.jam_selesai],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['self-lembur'],
    queryFn: () =>
      http.get('/self/lembur').then(r => {
        const d = r.data;
        return (d?.data?.data ?? d?.data ?? d ?? []) as LemburRecord[];
      }),
    staleTime: 30000,
    meta: { onError: () => toast.error('Gagal memuat data lembur') },
  });

  const mutation = useMutation({
    mutationFn: () =>
      http.post('/self/lembur', {
        tanggal: form.tanggal,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        jenis_hari: form.jenis_hari,
        alasan: form.alasan,
      }),
    onSuccess: () => {
      toast.success('Pengajuan lembur berhasil dikirim');
      setForm({ ...EMPTY_FORM });
      qc.invalidateQueries({ queryKey: ['self-lembur'] });
    },
    onError: () => toast.error('Gagal mengajukan lembur'),
  });

  const list: LemburRecord[] = data ?? [];
  const canSubmit = form.tanggal && form.jam_mulai && form.jam_selesai && form.alasan && durasi > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Timer size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Lembur Saya</h1>
            <p className="text-sm text-gray-500 mt-0.5">Ajukan dan pantau permohonan lembur Anda.</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-xs text-orange-800">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            Batas lembur: maks. <strong>3 jam/hari</strong> dan <strong>14 jam/minggu</strong> (UU No. 13/2003 Pasal 78).
          </span>
        </div>

        {/* Submit form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Ajukan Lembur</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
              <input
                type="date"
                value={form.tanggal}
                onChange={e => set('tanggal', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Hari</label>
              <select
                value={form.jenis_hari}
                onChange={e => set('jenis_hari', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                {JENIS_HARI.map(j => <option key={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jam Mulai</label>
              <input
                type="time"
                value={form.jam_mulai}
                onChange={e => set('jam_mulai', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Jam Selesai
                {durasi > 0 && (
                  <span className={`ml-2 font-semibold ${durasi > 3 ? 'text-red-600' : 'text-orange-600'}`}>
                    → {durasi} jam
                  </span>
                )}
              </label>
              <input
                type="time"
                value={form.jam_selesai}
                onChange={e => set('jam_selesai', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Alasan</label>
              <textarea
                value={form.alasan}
                onChange={e => set('alasan', e.target.value)}
                rows={2}
                placeholder="Jelaskan alasan lembur…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="mt-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {mutation.isPending ? 'Mengirim…' : 'Ajukan Lembur'}
          </button>
        </div>

        {/* History */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Riwayat Pengajuan
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <Timer size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">Belum ada pengajuan lembur</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tanggal</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Waktu</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Durasi</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Jenis Hari</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {list.map(r => {
                      const sc = statusConfig[r.status] ?? statusConfig.Diajukan;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDate(r.tanggal)}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                            {r.jam_mulai} – {r.jam_selesai}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 font-medium">{r.durasi_jam}j</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{r.jenis_hari}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.color} ${sc.bg}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px]">
                            {r.status === 'Disetujui' && r.upah_lembur != null ? (
                              <span className="text-green-700 font-medium">{fmtRupiah(r.upah_lembur)}</span>
                            ) : r.status === 'Ditolak' && r.catatan ? (
                              <span className="text-red-600">{r.catatan}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
