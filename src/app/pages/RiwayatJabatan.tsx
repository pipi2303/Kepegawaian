import React, { useState, useMemo } from 'react';
import { Briefcase, Plus, Search, X, Eye, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { RiwayatJabatan as RJType } from '../types';
import { toast } from 'sonner';

const jenisColor: Record<string, string> = {
  'Struktural': 'bg-purple-100 text-purple-700',
  'Fungsional': 'bg-blue-100 text-blue-700',
  'Pelaksana': 'bg-gray-100 text-gray-600',
};

const EMPTY_FORM: Omit<RJType, 'id'> = {
  pegawaiId: '', jabatan: '', unitKerja: '', golongan: '',
  tmtMulai: '', tmtSelesai: '', nomorSK: '', tanggalSK: '',
  jenisJabatan: 'Fungsional',
};

export default function RiwayatJabatan() {
  const { riwayatJabatan, pegawai, addRiwayatJabatan, updateRiwayatJabatan, deleteRiwayatJabatan } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editData, setEditData] = useState<RJType | null>(null);
  const [detailData, setDetailData] = useState<RJType | null>(null);
  const [form, setForm] = useState<Omit<RJType, 'id'>>({ ...EMPTY_FORM });
  const [expandedPegawai, setExpandedPegawai] = useState<Set<string>>(new Set());

  const getPegawai = (id: string) => pegawai.find(p => p.id === id);
  const getFullName = (id: string) => {
    const p = getPegawai(id);
    if (!p) return '-';
    return `${p.gelarDepan || ''} ${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`.trim();
  };
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sekarang';

  const filtered = useMemo(() => riwayatJabatan.filter(r => {
    const matchJenis = !filterJenis || r.jenisJabatan === filterJenis;
    return matchJenis;
  }), [riwayatJabatan, filterJenis]);

  // Pegawai yang punya riwayat jabatan
  const pegawaiWithRJ = useMemo(() => pegawai.filter(p => {
    const rj = riwayatJabatan.filter(r => r.pegawaiId === p.id);
    if (rj.length === 0) return false;
    if (!search) return true;
    return p.nama.toLowerCase().includes(search.toLowerCase()) || p.nip.includes(search);
  }), [pegawai, riwayatJabatan, search]);

  const toggleExpand = (id: string) => {
    setExpandedPegawai(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openAdd = (prefilledPegawaiId?: string) => {
    setEditData(null);
    setForm({ ...EMPTY_FORM, pegawaiId: prefilledPegawaiId || '' });
    setShowModal(true);
  };

  const openEdit = (r: RJType) => {
    setEditData(r);
    setForm({ pegawaiId: r.pegawaiId, jabatan: r.jabatan, unitKerja: r.unitKerja, golongan: r.golongan, tmtMulai: r.tmtMulai, tmtSelesai: r.tmtSelesai || '', nomorSK: r.nomorSK, tanggalSK: r.tanggalSK, jenisJabatan: r.jenisJabatan });
    setShowModal(true);
  };

  const openDetail = (r: RJType) => { setDetailData(r); setShowDetailModal(true); };

  const handleSave = () => {
    if (!form.pegawaiId || !form.jabatan || !form.tmtMulai || !form.nomorSK) {
      toast.error('Harap isi semua field yang wajib diisi');
      return;
    }
    if (editData) {
      updateRiwayatJabatan({ ...editData, ...form, tmtSelesai: form.tmtSelesai || undefined });
      toast.success('Riwayat jabatan berhasil diperbarui');
    } else {
      addRiwayatJabatan({ ...form, tmtSelesai: form.tmtSelesai || undefined });
      toast.success('Riwayat jabatan berhasil ditambahkan');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteRiwayatJabatan(id);
    setShowDeleteConfirm(null);
    toast.success('Riwayat jabatan berhasil dihapus');
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">Riwayat Jabatan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Riwayat penempatan jabatan seluruh pegawai ASN</p>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Riwayat
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Riwayat', value: riwayatJabatan.length, cls: 'bg-white border-gray-100' },
          { label: 'Jabatan Struktural', value: riwayatJabatan.filter(r => r.jenisJabatan === 'Struktural').length, cls: 'bg-purple-50 border-purple-100' },
          { label: 'Jabatan Fungsional', value: riwayatJabatan.filter(r => r.jenisJabatan === 'Fungsional').length, cls: 'bg-blue-50 border-blue-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border shadow-sm p-4 ${s.cls}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-semibold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter & View Toggle */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari nama atau NIP pegawai..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Jenis</option>
            <option value="Struktural">Struktural</option>
            <option value="Fungsional">Fungsional</option>
            <option value="Pelaksana">Pelaksana</option>
          </select>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['grouped', 'list'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${viewMode === v ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {v === 'grouped' ? 'Per Pegawai' : 'Semua Data'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Grouped View ─── */}
      {viewMode === 'grouped' && (
        <div className="space-y-3">
          {pegawaiWithRJ.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada riwayat jabatan</p>
            </div>
          ) : pegawaiWithRJ.map(p => {
            const rjPegawai = filtered.filter(r => r.pegawaiId === p.id).sort((a, b) => new Date(b.tmtMulai).getTime() - new Date(a.tmtMulai).getTime());
            const isExpanded = expandedPegawai.has(p.id);
            if (rjPegawai.length === 0) return null;
            const latest = rjPegawai[0];

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Pegawai header */}
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => toggleExpand(p.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">{p.nama.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{getFullName(p.id)}</p>
                      <p className="text-xs text-gray-500">{p.jabatan} · {p.unitKerja}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${jenisColor[latest.jenisJabatan]}`}>{latest.jenisJabatan}</span>
                    <span className="text-xs text-gray-400">{rjPegawai.length} riwayat</span>
                    <button onClick={e => { e.stopPropagation(); openAdd(p.id); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Tambah riwayat"><Plus className="w-4 h-4" /></button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Timeline */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <div className="relative pl-6">
                      <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
                      <div className="space-y-4">
                        {rjPegawai.map((r, idx) => (
                          <div key={r.id} className="relative flex items-start gap-3 cursor-pointer group" onClick={() => openDetail(r)}>
                            <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 border-white flex-shrink-0 mt-1 ${idx === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div className="flex-1 p-3 bg-gray-50 rounded-xl hover:bg-blue-50/40 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{r.jabatan}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{r.unitKerja} · Gol. {r.golongan}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <p className="text-xs text-gray-400">{fmtDate(r.tmtMulai)} — {fmtDate(r.tmtSelesai || '')}</p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${jenisColor[r.jenisJabatan]}`}>{r.jenisJabatan}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">SK: {r.nomorSK}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => openDetail(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => openEdit(r)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setShowDeleteConfirm(r.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── List View ─── */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-2.5 border-b border-gray-100">
            <p className="text-xs text-gray-500">Menampilkan <span className="font-semibold text-gray-700">{filtered.length}</span> riwayat jabatan</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jabatan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Unit Kerja</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Gol.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Periode</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Jenis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">No. SK</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-sm">Tidak ada riwayat jabatan</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => openDetail(r)}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{getFullName(r.pegawaiId)}</p>
                      <p className="text-xs text-gray-400">{getPegawai(r.pegawaiId)?.nip}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{r.jabatan}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{r.unitKerja}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-center">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{r.golongan}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-center">
                      <p className="text-xs text-gray-600">{fmtDate(r.tmtMulai)}</p>
                      <p className="text-xs text-gray-400">s.d. {fmtDate(r.tmtSelesai || '')}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${jenisColor[r.jenisJabatan]}`}>{r.jenisJabatan}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500 max-w-[140px] truncate">{r.nomorSK}</td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDetail(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(r)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setShowDeleteConfirm(r.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Form Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">{editData ? 'Edit Riwayat Jabatan' : 'Tambah Riwayat Jabatan'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={form.pegawaiId} onChange={e => setForm(f => ({ ...f, pegawaiId: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih Pegawai</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.gelarDepan || ''} {p.nama} — {p.unitKerja}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Nama Jabatan *</label>
                <input type="text" value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
                  placeholder="Contoh: Dokter Ahli Muda"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Jabatan</label>
                  <select value={form.jenisJabatan} onChange={e => setForm(f => ({ ...f, jenisJabatan: e.target.value as any }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Struktural">Struktural</option>
                    <option value="Fungsional">Fungsional</option>
                    <option value="Pelaksana">Pelaksana</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Golongan</label>
                  <input type="text" value={form.golongan} onChange={e => setForm(f => ({ ...f, golongan: e.target.value }))}
                    placeholder="III/c"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Unit Kerja</label>
                <input type="text" value={form.unitKerja} onChange={e => setForm(f => ({ ...f, unitKerja: e.target.value }))}
                  placeholder="Nama unit kerja"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">TMT Mulai *</label>
                  <input type="date" value={form.tmtMulai} onChange={e => setForm(f => ({ ...f, tmtMulai: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">TMT Selesai <span className="text-gray-400">(kosong = masih aktif)</span></label>
                  <input type="date" value={form.tmtSelesai || ''} onChange={e => setForm(f => ({ ...f, tmtSelesai: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK *</label>
                  <input type="text" value={form.nomorSK} onChange={e => setForm(f => ({ ...f, nomorSK: e.target.value }))}
                    placeholder="SK/JAB/..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal SK</label>
                  <input type="date" value={form.tanggalSK} onChange={e => setForm(f => ({ ...f, tanggalSK: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editData ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Riwayat Jabatan</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><p className="text-xs text-gray-400 mb-1">Pegawai</p>
                <p className="text-sm font-semibold text-gray-800">{getFullName(detailData.pegawaiId)}</p>
                <p className="text-xs text-gray-500">{getPegawai(detailData.pegawaiId)?.jabatan}</p>
              </div>
              <div className={`p-3 rounded-xl ${jenisColor[detailData.jenisJabatan]}`}>
                <p className="text-xs font-semibold mb-1">Jabatan {detailData.jenisJabatan}</p>
                <p className="text-sm font-medium">{detailData.jabatan}</p>
                <p className="text-xs mt-0.5">{detailData.unitKerja} · Gol. {detailData.golongan}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 mb-1">TMT Mulai</p><p className="text-sm text-gray-800">{fmtDate(detailData.tmtMulai)}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">TMT Selesai</p><p className="text-sm text-gray-800">{detailData.tmtSelesai ? fmtDate(detailData.tmtSelesai) : <span className="text-green-600">Masih Aktif</span>}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Nomor SK</p><p className="text-sm font-mono text-gray-800">{detailData.nomorSK}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Tanggal SK</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggalSK)}</p></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowDetailModal(false); openEdit(detailData); }} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 className="w-4 h-4" /> Edit</button>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Hapus Riwayat Jabatan?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Data riwayat jabatan ini akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
