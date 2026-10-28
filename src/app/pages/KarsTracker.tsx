import React, { useState } from 'react';
import { ClipboardCheck, Search, X, Edit2, ChevronDown, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

type KarsStatus = 'Belum' | 'Proses' | 'Lengkap' | 'Tidak Berlaku';

interface KarsItem {
  id: number;
  bab: string;
  kode_standar: string;
  judul_standar: string;
  elemen_penilaian?: string;
  status: KarsStatus;
  pic?: { id: number; nama: string };
  target_tanggal?: string;
  tanggal_selesai?: string;
  catatan?: string;
}

interface Summary {
  total: number;
  belum: number;
  proses: number;
  lengkap: number;
  tidak_berlaku: number;
  pct_lengkap: number;
}

const BAB_LIST = ['KKS', 'PMKP', 'TKRS', 'MFK'];
const STATUS_LIST: KarsStatus[] = ['Belum', 'Proses', 'Lengkap', 'Tidak Berlaku'];

const statusCfg: Record<KarsStatus, { bg: string; text: string; ring: string }> = {
  Belum:          { bg: 'bg-red-100',   text: 'text-red-700',   ring: 'ring-red-200' },
  Proses:         { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-200' },
  Lengkap:        { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  'Tidak Berlaku':{ bg: 'bg-gray-100',  text: 'text-gray-600',  ring: 'ring-gray-200' },
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const EMPTY_FORM = { status: 'Belum' as KarsStatus, catatan: '', target_tanggal: '', pic_id: '' };

export default function KarsTracker() {
  const qc = useQueryClient();
  const [filterBab, setFilterBab] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<KarsItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [openStatusFor, setOpenStatusFor] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['kars', filterBab, filterStatus],
    queryFn: () => http.get('/kars', {
      params: {
        ...(filterBab ? { bab: filterBab } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
      },
    }).then(r => r.data),
    staleTime: 30000,
  });

  const items: KarsItem[] = data?.data ?? [];
  const summary: Summary = data?.summary ?? { total: 0, belum: 0, proses: 0, lengkap: 0, tidak_berlaku: 0, pct_lengkap: 0 };

  const filtered = search
    ? items.filter(i =>
        i.kode_standar.toLowerCase().includes(search.toLowerCase()) ||
        i.judul_standar.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  // Group by bab
  const grouped = filtered.reduce<Record<string, KarsItem[]>>((acc, item) => {
    if (!acc[item.bab]) acc[item.bab] = [];
    acc[item.bab].push(item);
    return acc;
  }, {});

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: object }) =>
      http.put(`/kars/${id}`, payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kars'] });
      toast.success('Data KARS diperbarui');
      setEditItem(null);
    },
    onError: () => toast.error('Gagal memperbarui data'),
  });

  const quickStatus = (id: number, status: KarsStatus) => {
    updateMut.mutate({ id, payload: { status } });
    setOpenStatusFor(null);
  };

  const openEdit = (item: KarsItem) => {
    setEditItem(item);
    setForm({
      status: item.status,
      catatan: item.catatan ?? '',
      target_tanggal: item.target_tanggal?.slice(0, 10) ?? '',
      pic_id: item.pic ? String(item.pic.id) : '',
    });
  };

  const handleSave = () => {
    if (!editItem) return;
    updateMut.mutate({
      id: editItem.id,
      payload: {
        status: form.status,
        catatan: form.catatan || undefined,
        target_tanggal: form.target_tanggal || undefined,
        pic_id: form.pic_id ? Number(form.pic_id) : undefined,
      },
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tracker Akreditasi KARS</h1>
            <p className="text-sm text-gray-500">Pemantauan kelengkapan dokumen standar akreditasi</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Belum',          value: summary.belum,         color: 'text-red-600',      bg: 'bg-red-50 border-red-100' },
          { label: 'Proses',         value: summary.proses,        color: 'text-yellow-600',   bg: 'bg-yellow-50 border-yellow-100' },
          { label: 'Lengkap',        value: summary.lengkap,       color: 'text-emerald-600',  bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Tidak Berlaku',  value: summary.tidak_berlaku, color: 'text-gray-500',     bg: 'bg-gray-50 border-gray-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Kelengkapan Dokumen</span>
          <span className="text-sm font-semibold text-emerald-700">{summary.pct_lengkap}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${summary.pct_lengkap}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{summary.lengkap} dari {summary.total} standar lengkap</p>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari kode atau judul standar..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select value={filterBab} onChange={e => setFilterBab(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Semua BAB</option>
            {BAB_LIST.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Semua Status</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Memuat data...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardCheck className="w-10 h-10 mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">Tidak ada data ditemukan</p>
          </div>
        ) : Object.entries(grouped).map(([bab, bItems]) => (
          <div key={bab}>
            <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100">
              <span className="text-xs font-semibold text-emerald-700">BAB {bab}</span>
              <span className="ml-2 text-xs text-gray-400">({bItems.length} standar)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-24">Kode</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Judul Standar</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden md:table-cell">PIC</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 hidden lg:table-cell">Target</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bItems.map(item => {
                    const cfg = statusCfg[item.status];
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-gray-600">{item.kode_standar}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-800">{item.judul_standar}</p>
                          {item.elemen_penilaian && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.elemen_penilaian}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center relative">
                          <button
                            onClick={() => setOpenStatusFor(openStatusFor === item.id ? null : item.id)}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text} hover:ring-2 ${cfg.ring}`}
                          >
                            {item.status}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {openStatusFor === item.id && (
                            <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-40">
                              {STATUS_LIST.map(s => (
                                <button
                                  key={s}
                                  onClick={() => quickStatus(item.id, s)}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${s === item.status ? 'font-semibold' : ''}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">
                          {item.pic?.nama ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-center text-xs text-gray-500">
                          {fmtDate(item.target_tanggal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Click outside to close status dropdown */}
      {openStatusFor !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenStatusFor(null)} />
      )}

      {/* Info box */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-800">
          Klik badge status untuk mengubah status secara cepat, atau gunakan tombol edit untuk mengisi detail lengkap
          termasuk PIC, catatan, dan target tanggal penyelesaian.
        </p>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 className="font-semibold text-gray-800">Edit Standar KARS</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editItem.kode_standar} · {editItem.judul_standar}</p>
              </div>
              <button onClick={() => setEditItem(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as KarsStatus }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">ID PIC (Pegawai)</label>
                <input
                  type="number" value={form.pic_id}
                  onChange={e => setForm(f => ({ ...f, pic_id: e.target.value }))}
                  placeholder="ID pegawai penanggung jawab"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Target Tanggal</label>
                <input
                  type="date" value={form.target_tanggal}
                  onChange={e => setForm(f => ({ ...f, target_tanggal: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan</label>
                <textarea
                  rows={3} value={form.catatan}
                  onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
                  placeholder="Catatan perkembangan atau kendala..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={updateMut.isPending}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
              >
                {updateMut.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
