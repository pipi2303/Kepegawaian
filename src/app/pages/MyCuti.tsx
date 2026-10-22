import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Clock, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { selfApi } from '../data/api';
import { toast } from 'sonner';

const JENIS_CUTI = [
  'Cuti Tahunan',
  'Cuti Sakit',
  'Cuti Melahirkan',
  'Cuti Besar',
  'Cuti Alasan Penting',
  'Cuti di Luar Tanggungan Negara',
];

const statusConfig: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  Pending:   { icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-yellow-50 text-yellow-700', label: 'Menunggu' },
  Disetujui: { icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-green-50 text-green-700', label: 'Disetujui' },
  Ditolak:   { icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-red-50 text-red-700', label: 'Ditolak' },
};

function hitungHariKerja(mulai: string, selesai: string) {
  if (!mulai || !selesai) return 0;
  const start = new Date(mulai), end = new Date(selesai);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const EMPTY = { jenis_cuti: '', tanggal_mulai: '', tanggal_selesai: '', alasan: '', alamat_selama_cuti: '' };

export default function MyCuti() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'riwayat' | 'ajukan'>('riwayat');
  const [form, setForm] = useState({ ...EMPTY });

  const { data: cutiData, isLoading: loadingCuti } = useQuery({
    queryKey: ['self-cuti'],
    queryFn: () => selfApi.getCuti(),
  });

  const { data: sisaData } = useQuery({
    queryKey: ['self-sisa-cuti'],
    queryFn: selfApi.sisaCuti,
  });

  const submitMut = useMutation({
    mutationFn: selfApi.submitCuti,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['self-cuti'] });
      qc.invalidateQueries({ queryKey: ['self-sisa-cuti'] });
      toast.success('Pengajuan cuti berhasil dikirim');
      setForm({ ...EMPTY });
      setTab('riwayat');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal mengajukan cuti'),
  });

  const jumlahHari = hitungHariKerja(form.tanggal_mulai, form.tanggal_selesai);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMut.mutate({ ...form, jumlah_hari: jumlahHari });
  };

  const cuti: any[] = cutiData?.data ?? [];
  const sisa = sisaData?.data;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      <h1 className="text-xl font-semibold text-gray-800">Cuti Saya</h1>

      {/* Sisa cuti cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500">Cuti Tahunan Tersisa</p>
          <p className="text-2xl font-bold text-[#013E37] mt-1">{sisa?.sisa_cuti_tahunan ?? '-'}</p>
          <p className="text-xs text-gray-400">dari {sisa?.kuota_tahunan ?? 12} hari</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500">Cuti Sakit</p>
          <p className="text-sm font-medium text-gray-700 mt-1">Tidak Terbatas</p>
          <p className="text-xs text-gray-400">dengan surat dokter</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500">Cuti Melahirkan</p>
          <p className="text-sm font-medium text-gray-700 mt-1">3 Bulan</p>
          <p className="text-xs text-gray-400">sesuai PP 11/2017</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(['riwayat', 'ajukan'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-white text-[#013E37] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'riwayat' ? <><CalendarDays className="w-4 h-4" /> Riwayat</> : <><Plus className="w-4 h-4" /> Ajukan Baru</>}
          </button>
        ))}
      </div>

      {/* Riwayat Tab */}
      {tab === 'riwayat' && (
        <div className="space-y-3">
          {loadingCuti && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#013E37]" />
            </div>
          )}
          {!loadingCuti && cuti.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada riwayat cuti</p>
            </div>
          )}
          {cuti.map((c: any) => {
            const s = statusConfig[c.status] ?? statusConfig['Pending'];
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{c.jenis_cuti}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.tanggal_mulai} s/d {c.tanggal_selesai} · {c.jumlah_hari} hari
                    </p>
                    {c.alasan && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.alasan}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${s.cls}`}>
                    {s.icon} {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ajukan Tab */}
      {tab === 'ajukan' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Jenis Cuti</label>
            <select
              required
              value={form.jenis_cuti}
              onChange={e => setForm(f => ({ ...f, jenis_cuti: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30"
            >
              <option value="">-- Pilih Jenis Cuti --</option>
              {JENIS_CUTI.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Tanggal Mulai</label>
              <input
                required
                type="date"
                value={form.tanggal_mulai}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Tanggal Selesai</label>
              <input
                required
                type="date"
                value={form.tanggal_selesai}
                min={form.tanggal_mulai || new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30"
              />
            </div>
          </div>

          {jumlahHari > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{jumlahHari} hari kerja · Sisa cuti tahunan: {sisa?.sisa_cuti_tahunan ?? '-'} hari</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Alasan</label>
            <textarea
              required
              minLength={5}
              rows={3}
              value={form.alasan}
              onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))}
              placeholder="Jelaskan alasan pengajuan cuti..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Alamat Selama Cuti (opsional)</label>
            <input
              type="text"
              value={form.alamat_selama_cuti}
              onChange={e => setForm(f => ({ ...f, alamat_selama_cuti: e.target.value }))}
              placeholder="Alamat yang dapat dihubungi..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30"
            />
          </div>

          <button
            type="submit"
            disabled={submitMut.isPending || jumlahHari === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#013E37] text-white text-sm font-medium rounded-lg hover:bg-[#025046] disabled:opacity-50 transition-colors"
          >
            {submitMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Kirim Pengajuan Cuti
          </button>
        </form>
      )}
    </div>
  );
}
