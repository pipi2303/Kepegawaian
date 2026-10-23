import React, { useState } from 'react';
import { FileSignature, Search, Plus, Eye, Edit2, Trash2, X, CheckCircle, AlertTriangle, Clock, XCircle, FileText, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kontrakApi } from '../data/api';
import http from '../lib/http';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusConfig: Record<string, { bg: string; color: string; icon: any }> = {
  'Aktif':         { bg: 'bg-green-50',  color: 'text-green-700',  icon: CheckCircle },
  'Akan Berakhir': { bg: 'bg-yellow-50', color: 'text-yellow-700', icon: Clock },
  'Diperpanjang':  { bg: 'bg-blue-50',   color: 'text-blue-700',   icon: CheckCircle },
  'Berakhir':      { bg: 'bg-red-50',    color: 'text-red-700',    icon: AlertTriangle },
};

const EMPTY_FORM = {
  pegawai_id: '', nomor_perjanjian: '', tanggal_mulai: '', tanggal_selesai: '',
  gaji_kontrak: '', posisi_tugas: '', status_kontrak: 'Aktif', file_kontrak: '',
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Kontrak() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showPerpanjangModal, setShowPerpanjangModal] = useState<any | null>(null);
  const [perpanjangDate, setPerpanjangDate] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: listResp, isLoading } = useQuery({
    queryKey: ['kontrak', filterStatus],
    queryFn: () => kontrakApi.getAll({ status_kontrak: filterStatus || undefined }),
  });

  const { data: expiringResp } = useQuery({
    queryKey: ['kontrak-expiring'],
    queryFn: () => kontrakApi.expiring(30),
    staleTime: 5 * 60 * 1000,
  });

  const rows: any[] = listResp?.data?.data ?? listResp?.data ?? [];
  const expiring7: any[]  = expiringResp?.data?.expiring_7  ?? [];
  const expiring30: any[] = expiringResp?.data?.expiring_30 ?? [];

  const filtered = rows.filter(k => {
    if (!search) return true;
    return (k.nama ?? '').toLowerCase().includes(search.toLowerCase())
      || (k.nomor_perjanjian ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const saveMut = useMutation({
    mutationFn: (payload: any) => editData
      ? kontrakApi.update(editData.id, payload)
      : kontrakApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kontrak'] });
      qc.invalidateQueries({ queryKey: ['kontrak-expiring'] });
      toast.success(editData ? 'Kontrak diperbarui' : 'Kontrak ditambahkan');
      setShowModal(false);
    },
    onError: () => toast.error('Gagal menyimpan kontrak'),
  });

  const perpanjangMut = useMutation({
    mutationFn: ({ id, tgl }: { id: number; tgl: string }) =>
      kontrakApi.perpanjang(id, { tanggal_selesai_baru: tgl }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kontrak'] });
      qc.invalidateQueries({ queryKey: ['kontrak-expiring'] });
      toast.success('Kontrak berhasil diperpanjang');
      setShowPerpanjangModal(null);
    },
    onError: () => toast.error('Gagal memperpanjang kontrak'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => http.delete(`/kontrak/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kontrak'] });
      toast.success('Kontrak dihapus');
      setShowDeleteConfirm(null);
    },
  });

  const handlePDF = async (k: any) => {
    try {
      const res = await kontrakApi.generatePDF({ kontrak_id: k.id });
      downloadBlob(res.data, `kontrak_${k.nip}_${k.nomor_perjanjian}.pdf`);
      toast.success('PDF kontrak diunduh');
    } catch {
      toast.error('Gagal generate PDF');
    }
  };

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditData(null); setShowModal(true); };
  const openEdit = (k: any) => {
    setEditData(k);
    setForm({
      pegawai_id: String(k.pegawai_id),
      nomor_perjanjian: k.nomor_perjanjian,
      tanggal_mulai: k.tanggal_mulai?.slice(0, 10) ?? '',
      tanggal_selesai: k.tanggal_selesai?.slice(0, 10) ?? '',
      gaji_kontrak: k.gaji_kontrak ?? '',
      posisi_tugas: k.posisi_tugas,
      status_kontrak: k.status_kontrak,
      file_kontrak: k.file_kontrak ?? '',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.pegawai_id || !form.nomor_perjanjian || !form.tanggal_mulai || !form.tanggal_selesai || !form.posisi_tugas) {
      toast.error('Harap isi semua field wajib'); return;
    }
    saveMut.mutate({ ...form, gaji_kontrak: form.gaji_kontrak || null, file_kontrak: form.file_kontrak || null });
  };

  const scOf = (s: string) => statusConfig[s] ?? statusConfig['Berakhir'];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kontrak & Hubungan Kerja</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manajemen kontrak pegawai dengan notifikasi expiry otomatis</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah Kontrak
        </button>
      </div>

      {/* Expiry Alert Cards */}
      {expiring7.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Kritis: {expiring7.length} kontrak berakhir dalam 7 hari</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {expiring7.map((k: any) => (
                  <span key={k.id} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    {k.nama} ({k.hari_tersisa} hr)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {expiring30.length > 0 && expiring7.length !== expiring30.length && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">{expiring30.length} kontrak berakhir dalam 30 hari — segera proses perpanjangan</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {expiring30.filter((k: any) => k.hari_tersisa > 7).map((k: any) => (
                  <span key={k.id} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                    {k.nama} ({k.hari_tersisa} hr)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau nomor kontrak..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Status</option>
            {['Aktif', 'Akan Berakhir', 'Diperpanjang', 'Berakhir'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nomor Perjanjian</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Posisi</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Periode</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Sisa Hari</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data kontrak</td></tr>
              ) : filtered.map((k: any) => {
                const sc = scOf(k.status_kontrak);
                const Icon = sc.icon;
                const sisa = k.hari_tersisa;
                return (
                  <tr key={k.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailData(k)}>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-sm text-gray-800">{k.nama}</p>
                      <p className="text-xs text-gray-400">{k.unit_kerja}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-700">{k.nomor_perjanjian}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{k.posisi_tugas}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-xs text-gray-700">{fmtDate(k.tanggal_mulai)} — {fmtDate(k.tanggal_selesai)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {sisa !== null && sisa !== undefined ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${sisa <= 7 ? 'bg-red-100 text-red-700' : sisa <= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                          {sisa > 0 ? `${sisa} hr` : 'Berakhir'}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                        <Icon className="w-3 h-3" />{k.status_kontrak}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setDetailData(k)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Detail"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setShowPerpanjangModal(k); setPerpanjangDate(''); }} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600" title="Perpanjang"><RefreshCw className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handlePDF(k)} className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600" title="Download PDF"><FileText className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(k)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowDeleteConfirm(k.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailData(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Kontrak Kerja</h2>
              <button onClick={() => setDetailData(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{detailData.nama}</p>
                  <p className="text-xs text-gray-500">{detailData.posisi_tugas} · {detailData.unit_kerja}</p>
                </div>
                {(() => { const sc = scOf(detailData.status_kontrak); return (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>{detailData.status_kontrak}</span>
                ); })()}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Nomor Perjanjian', detailData.nomor_perjanjian],
                  ['NIP', detailData.nip],
                  ['Mulai Berlaku', fmtDate(detailData.tanggal_mulai)],
                  ['Berakhir', fmtDate(detailData.tanggal_selesai)],
                  ['Gaji Kontrak', detailData.gaji_kontrak ? `Rp ${fmt(detailData.gaji_kontrak)}/bln` : 'Sesuai perjanjian'],
                  ['Sisa Hari', detailData.hari_tersisa !== null ? `${detailData.hari_tersisa} hari` : '—'],
                ].map(([l, v]) => (
                  <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="text-sm text-gray-800 mt-0.5">{v}</p></div>
                ))}
              </div>
              {detailData.hari_tersisa !== null && detailData.hari_tersisa <= 30 && detailData.hari_tersisa > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-xs text-yellow-800 font-medium">Kontrak berakhir dalam {detailData.hari_tersisa} hari — segera proses perpanjangan</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <div className="flex gap-2">
                <button onClick={() => { setShowPerpanjangModal(detailData); setPerpanjangDate(''); setDetailData(null); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <RefreshCw className="w-3.5 h-3.5" /> Perpanjang
                </button>
                <button onClick={() => handlePDF(detailData)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setDetailData(null); openEdit(detailData); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                <button onClick={() => setDetailData(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Perpanjang Modal */}
      {showPerpanjangModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPerpanjangModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Perpanjang Kontrak</h3>
            <p className="text-sm text-gray-500 mb-4">{showPerpanjangModal.nama} — {showPerpanjangModal.nomor_perjanjian}</p>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Selesai Baru *</label>
            <input type="date" value={perpanjangDate} onChange={e => setPerpanjangDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowPerpanjangModal(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={() => { if (!perpanjangDate) { toast.error('Pilih tanggal selesai baru'); return; } perpanjangMut.mutate({ id: showPerpanjangModal.id, tgl: perpanjangDate }); }}
                disabled={perpanjangMut.isPending}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60">
                {perpanjangMut.isPending ? 'Menyimpan...' : 'Perpanjang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editData ? 'Edit Kontrak' : 'Tambah Kontrak Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">ID Pegawai *</label>
                <input value={form.pegawai_id} onChange={e => setForm(f => ({ ...f, pegawai_id: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor Perjanjian *</label>
                <input value={form.nomor_perjanjian} onChange={e => setForm(f => ({ ...f, nomor_perjanjian: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Posisi/Tugas *</label>
                <input value={form.posisi_tugas} onChange={e => setForm(f => ({ ...f, posisi_tugas: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Mulai *</label>
                  <input type="date" value={form.tanggal_mulai} onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Selesai *</label>
                  <input type="date" value={form.tanggal_selesai} onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Gaji Kontrak (Rp)</label>
                  <input type="number" value={form.gaji_kontrak} onChange={e => setForm(f => ({ ...f, gaji_kontrak: e.target.value }))} placeholder="Opsional"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.status_kontrak} onChange={e => setForm(f => ({ ...f, status_kontrak: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Aktif', 'Akan Berakhir', 'Diperpanjang', 'Berakhir'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saveMut.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {saveMut.isPending ? 'Menyimpan...' : editData ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Hapus Kontrak?</h3>
            <p className="text-sm text-gray-500 mb-4">Data kontrak ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={() => deleteMut.mutate(showDeleteConfirm!)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
