import React, { useState } from 'react';
import { ShieldAlert, Plus, Search, Eye, Edit2, Trash2, X, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disiplinApi } from '../data/api';
import { toast } from 'sonner';

const tingkatConfig = {
  Ringan: { color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' },
  Sedang: { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200' },
  Berat:  { color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-200'    },
};

const jenisHukumanByTingkat: Record<string, string[]> = {
  Ringan: ['Teguran Lisan', 'Teguran Tertulis', 'Pernyataan Tidak Puas Secara Tertulis'],
  Sedang: ['Penundaan Kenaikan Gaji Berkala', 'Penundaan Kenaikan Pangkat', 'Penurunan Pangkat 1 Tingkat selama 1 Tahun'],
  Berat:  ['Penurunan Pangkat 1 Tingkat selama 3 Tahun', 'Pemindahan dalam rangka Penurunan Jabatan', 'Pembebasan dari Jabatan', 'Pemberhentian dengan Hormat atas permintaan Sendiri', 'Pemberhentian Tidak dengan Hormat'],
};

const EMPTY_FORM = {
  pegawai_id: '', tingkat_hukuman: 'Ringan', jenis_hukuman: '',
  uraian_pelanggaran: '', nomor_sk: '', tanggal_sk: '',
  tanggal_mulai_berlaku: '', tanggal_selesai: '', status_hukuman: 'Aktif',
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Disiplin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const filters = { tingkat_hukuman: filterTingkat || undefined };

  const { data: listResp, isLoading } = useQuery({
    queryKey: ['disiplin', filters],
    queryFn: () => disiplinApi.getAll(filters),
  });

  const { data: statsResp } = useQuery({
    queryKey: ['disiplin-stats'],
    queryFn: () => disiplinApi.stats(),
  });

  const rows: any[] = listResp?.data?.data ?? listResp?.data ?? [];
  const stats = statsResp?.data ?? { ringan: 0, sedang: 0, berat: 0 };

  const filtered = rows.filter(d => {
    if (!search) return true;
    const nama = (d.nama ?? '').toLowerCase();
    return nama.includes(search.toLowerCase()) || (d.jenis_hukuman ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const saveMut = useMutation({
    mutationFn: (payload: any) => editData
      ? disiplinApi.update(editData.id, payload)
      : disiplinApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disiplin'] });
      qc.invalidateQueries({ queryKey: ['disiplin-stats'] });
      toast.success(editData ? 'Data disiplin diperbarui' : 'Kasus disiplin dicatat');
      setShowModal(false);
    },
    onError: () => toast.error('Gagal menyimpan data'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => disiplinApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disiplin'] });
      qc.invalidateQueries({ queryKey: ['disiplin-stats'] });
      toast.success('Data disiplin dihapus');
      setShowDeleteConfirm(null);
    },
    onError: () => toast.error('Gagal menghapus data'),
  });

  const handleSK = async (id: number, nama: string) => {
    try {
      const res = await disiplinApi.skDisiplin(id);
      downloadBlob(res.data, `sk_disiplin_${nama}.pdf`);
      toast.success('SK Disiplin diunduh');
    } catch {
      toast.error('Gagal generate SK');
    }
  };

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditData(null); setShowModal(true); };
  const openEdit = (d: any) => {
    setEditData(d);
    setForm({
      pegawai_id: String(d.pegawai_id), tingkat_hukuman: d.tingkat_hukuman,
      jenis_hukuman: d.jenis_hukuman, uraian_pelanggaran: d.uraian_pelanggaran,
      nomor_sk: d.nomor_sk, tanggal_sk: d.tanggal_sk?.slice(0, 10) ?? '',
      tanggal_mulai_berlaku: d.tanggal_mulai_berlaku?.slice(0, 10) ?? '',
      tanggal_selesai: d.tanggal_selesai?.slice(0, 10) ?? '',
      status_hukuman: d.status_hukuman ?? 'Aktif',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.pegawai_id || !form.jenis_hukuman || !form.nomor_sk || !form.tanggal_sk || !form.tanggal_mulai_berlaku || !form.uraian_pelanggaran) {
      toast.error('Harap isi semua field wajib'); return;
    }
    saveMut.mutate({ ...form, tanggal_selesai: form.tanggal_selesai || null });
  };

  const tc = (t: string) => tingkatConfig[t as keyof typeof tingkatConfig] ?? tingkatConfig.Ringan;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">Disiplin Pegawai</h1>
          <p className="text-sm text-gray-500 mt-0.5">Penanganan kasus disiplin ASN sesuai PP No. 94 Tahun 2021</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
          <Plus className="w-4 h-4" /> Catat Kasus Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Hukuman Ringan', value: stats.ringan, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100', icon: '⚠️' },
          { label: 'Hukuman Sedang', value: stats.sedang, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: '🔶' },
          { label: 'Hukuman Berat',  value: stats.berat,  color: 'text-red-600',    bg: 'bg-red-50 border-red-100',     icon: '🔴' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.bg}`}>
            <p className="text-lg mb-0.5">{s.icon}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info Dasar Hukum */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">PP No. 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil</p>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              {Object.entries(jenisHukumanByTingkat).map(([tingkat, jenis]) => {
                const cfg = tc(tingkat);
                return (
                  <div key={tingkat} className={`p-2.5 rounded-lg text-xs ${cfg.bg} ${cfg.border} border`}>
                    <p className={`font-semibold mb-1 ${cfg.color}`}>Hukuman {tingkat}</p>
                    <ul className="space-y-0.5">{jenis.slice(0, 3).map(j => <li key={j} className="text-gray-600">• {j}</li>)}</ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari nama pegawai atau jenis hukuman..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterTingkat} onChange={e => setFilterTingkat(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Tingkat</option>
            <option value="Ringan">Ringan</option>
            <option value="Sedang">Sedang</option>
            <option value="Berat">Berat</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Jenis Hukuman</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Tingkat</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tgl SK</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">No. SK</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Tidak ada kasus disiplin yang ditemukan</p>
                </td></tr>
              ) : filtered.map((d: any) => {
                const cfg = tc(d.tingkat_hukuman);
                return (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailData(d)}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{d.nama}</p>
                      <p className="text-xs text-gray-400">{d.unit_kerja}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-700">{d.jenis_hukuman}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{d.tingkat_hukuman}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-600 hidden md:table-cell">{fmtDate(d.tanggal_sk)}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{d.nomor_sk || '—'}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{d.status_hukuman}</span>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setDetailData(d)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Detail"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleSK(d.id, d.nama)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Generate SK PDF"><FileText className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(d)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setShowDeleteConfirm(d.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">{editData ? 'Edit Kasus Disiplin' : 'Catat Kasus Disiplin Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">ID Pegawai *</label>
                <input type="text" value={form.pegawai_id} onChange={e => setForm(f => ({ ...f, pegawai_id: e.target.value }))} placeholder="ID Pegawai"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tingkat Hukuman *</label>
                  <select value={form.tingkat_hukuman} onChange={e => setForm(f => ({ ...f, tingkat_hukuman: e.target.value, jenis_hukuman: '' }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Hukuman *</label>
                  <select value={form.jenis_hukuman} onChange={e => setForm(f => ({ ...f, jenis_hukuman: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih Jenis</option>
                    {(jenisHukumanByTingkat[form.tingkat_hukuman] ?? []).map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK *</label>
                <input type="text" value={form.nomor_sk} onChange={e => setForm(f => ({ ...f, nomor_sk: e.target.value }))} placeholder="SK/DISIPLIN/..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal SK *</label>
                  <input type="date" value={form.tanggal_sk} onChange={e => setForm(f => ({ ...f, tanggal_sk: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Berlaku Mulai *</label>
                  <input type="date" value={form.tanggal_mulai_berlaku} onChange={e => setForm(f => ({ ...f, tanggal_mulai_berlaku: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Berlaku Sampai (opsional)</label>
                  <input type="date" value={form.tanggal_selesai} onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status Hukuman</label>
                  <input type="text" value={form.status_hukuman} onChange={e => setForm(f => ({ ...f, status_hukuman: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Uraian Pelanggaran *</label>
                <textarea rows={4} value={form.uraian_pelanggaran} onChange={e => setForm(f => ({ ...f, uraian_pelanggaran: e.target.value }))}
                  placeholder="Uraikan pelanggaran secara singkat dan jelas..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saveMut.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                {saveMut.isPending ? 'Menyimpan...' : editData ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailData(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Kasus Disiplin</h2>
              <button onClick={() => setDetailData(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {(() => { const cfg = tc(detailData.tingkat_hukuman); return (
                <div className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <p className={`text-sm font-semibold ${cfg.color}`}>Hukuman {detailData.tingkat_hukuman}</p>
                  <p className="text-gray-700 text-sm mt-0.5">{detailData.jenis_hukuman}</p>
                </div>
              ); })()}
              <div>
                <p className="text-xs text-gray-400 mb-1">Pegawai</p>
                <p className="text-sm font-medium text-gray-800">{detailData.nama}</p>
                <p className="text-xs text-gray-500">{detailData.jabatan} · {detailData.unit_kerja}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 mb-1">Nomor SK</p><p className="text-sm font-mono text-gray-800">{detailData.nomor_sk}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Tanggal SK</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggal_sk)}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Berlaku Mulai</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggal_mulai_berlaku)}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Status</p><span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{detailData.status_hukuman}</span></div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Uraian Pelanggaran</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{detailData.uraian_pelanggaran}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <button onClick={() => handleSK(detailData.id, detailData.nama)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                <FileText className="w-4 h-4" /> Generate SK PDF
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setDetailData(null); openEdit(detailData); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => setDetailData(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Hapus Kasus Disiplin?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Data ini akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={() => deleteMut.mutate(showDeleteConfirm!)} disabled={deleteMut.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
