import React, { useState, useMemo } from 'react';
import { GraduationCap, Plus, Search, Eye, Edit2, Trash2, X, BookOpen, Award, Clock, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { DiklatRecord } from '../types';
import { toast } from 'sonner';

const jenisConfig = {
  Teknis: { color: 'text-blue-700', bg: 'bg-blue-100' },
  Fungsional: { color: 'text-purple-700', bg: 'bg-purple-100' },
  Manajerial: { color: 'text-indigo-700', bg: 'bg-indigo-100' },
  Sosiokultural: { color: 'text-teal-700', bg: 'bg-teal-100' },
  Orientasi: { color: 'text-green-700', bg: 'bg-green-100' },
};
const statusConfig = {
  Direncanakan: { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Calendar },
  Berlangsung: { color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  Selesai: { color: 'text-green-700', bg: 'bg-green-100', icon: Award },
};

const EMPTY_FORM = {
  pegawaiId: '', namaDiklat: '', jenisDiklat: 'Teknis' as DiklatRecord['jenisDiklat'],
  penyelenggara: '', tempatPelaksanaan: '', tanggalMulai: '', tanggalSelesai: '',
  jumlahJP: 0, nomorSertifikat: '', status: 'Selesai' as DiklatRecord['status'],
};

export default function Diklat() {
  const { diklat, pegawai, addDiklat, updateDiklat, deleteDiklat } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPegawai, setFilterPegawai] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editData, setEditData] = useState<DiklatRecord | null>(null);
  const [detailData, setDetailData] = useState<DiklatRecord | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const getPegawai = (id: string) => pegawai.find(p => p.id === id);
  const getFullName = (id: string) => {
    const p = getPegawai(id);
    if (!p) return '-';
    return `${p.gelarDepan || ''} ${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`.trim();
  };

  const filtered = useMemo(() => diklat.filter(d => {
    const nama = getFullName(d.pegawaiId).toLowerCase();
    const matchSearch = !search || nama.includes(search.toLowerCase()) || d.namaDiklat.toLowerCase().includes(search.toLowerCase()) || d.penyelenggara.toLowerCase().includes(search.toLowerCase());
    const matchJenis = !filterJenis || d.jenisDiklat === filterJenis;
    const matchStatus = !filterStatus || d.status === filterStatus;
    const matchPegawai = !filterPegawai || d.pegawaiId === filterPegawai;
    return matchSearch && matchJenis && matchStatus && matchPegawai;
  }), [diklat, search, filterJenis, filterStatus, filterPegawai, pegawai]);

  const stats = {
    total: diklat.length,
    selesai: diklat.filter(d => d.status === 'Selesai').length,
    berlangsung: diklat.filter(d => d.status === 'Berlangsung').length,
    totalJP: diklat.filter(d => d.status === 'Selesai').reduce((sum, d) => sum + d.jumlahJP, 0),
  };

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditData(null); setShowModal(true); };
  const openEdit = (d: DiklatRecord) => {
    setEditData(d);
    setForm({ pegawaiId: d.pegawaiId, namaDiklat: d.namaDiklat, jenisDiklat: d.jenisDiklat, penyelenggara: d.penyelenggara, tempatPelaksanaan: d.tempatPelaksanaan, tanggalMulai: d.tanggalMulai, tanggalSelesai: d.tanggalSelesai, jumlahJP: d.jumlahJP, nomorSertifikat: d.nomorSertifikat || '', status: d.status });
    setShowModal(true);
  };
  const openDetail = (d: DiklatRecord) => { setDetailData(d); setShowDetailModal(true); };

  const handleSave = () => {
    if (!form.pegawaiId || !form.namaDiklat || !form.penyelenggara || !form.tanggalMulai) {
      toast.error('Harap isi semua field yang wajib diisi');
      return;
    }
    if (editData) {
      updateDiklat({ ...editData, ...form });
      toast.success('Data diklat berhasil diperbarui');
    } else {
      addDiklat(form as Omit<DiklatRecord, 'id'>);
      toast.success('Data diklat berhasil ditambahkan');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteDiklat(id);
    setShowDeleteConfirm(null);
    toast.success('Data diklat berhasil dihapus');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const getDuration = (mulai: string, selesai: string) => {
    const days = Math.ceil((new Date(selesai).getTime() - new Date(mulai).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} hari`;
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">Diklat & Pengembangan Kompetensi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Riwayat pelatihan dan pengembangan ASN sesuai PP No. 11 Tahun 2017</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Riwayat Diklat
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Diklat', value: stats.total, color: 'text-gray-700', bg: 'bg-white border-gray-100', icon: BookOpen },
          { label: 'Diklat Selesai', value: stats.selesai, color: 'text-green-600', bg: 'bg-green-50 border-green-100', icon: Award },
          { label: 'Sedang Berlangsung', value: stats.berlangsung, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: Clock },
          { label: 'Total JP (Selesai)', value: `${stats.totalJP} JP`, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', icon: GraduationCap },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border shadow-sm ${s.bg}`}>
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari nama diklat, pegawai, penyelenggara..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Jenis</option>
            {Object.keys(jenisConfig).map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="Direncanakan">Direncanakan</option>
            <option value="Berlangsung">Berlangsung</option>
            <option value="Selesai">Selesai</option>
          </select>
          <select value={filterPegawai} onChange={e => setFilterPegawai(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Pegawai</option>
            {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-sm text-gray-500">Menampilkan <span className="font-semibold text-gray-800">{filtered.length}</span> dari {diklat.length} riwayat diklat</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nama Diklat</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jenis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Penyelenggara</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tanggal</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">JP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                  <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Tidak ada riwayat diklat yang ditemukan</p>
                </td></tr>
              ) : filtered.map(d => {
                const jc = jenisConfig[d.jenisDiklat];
                const sc = statusConfig[d.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={d.id} className="hover:bg-blue-50/20 transition-colors cursor-pointer" onClick={() => openDetail(d)}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{getFullName(d.pegawaiId)}</p>
                      <p className="text-xs text-gray-400">{getPegawai(d.pegawaiId)?.unitKerja}</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="text-sm text-gray-800 truncate">{d.namaDiklat}</p>
                      <p className="text-xs text-gray-400">{d.tempatPelaksanaan}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${jc.bg} ${jc.color}`}>{d.jenisDiklat}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-600">{d.penyelenggara}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-center">
                      <p className="text-xs text-gray-600">{formatDate(d.tanggalMulai)}</p>
                      <p className="text-xs text-gray-400">s.d. {formatDate(d.tanggalSelesai)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm font-semibold text-gray-700">{d.jumlahJP}</span>
                      <p className="text-xs text-gray-400">JP</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />{d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDetail(d)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Detail"><Eye className="w-4 h-4" /></button>
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
              <h2 className="font-semibold text-gray-800">{editData ? 'Edit Riwayat Diklat' : 'Tambah Riwayat Diklat'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
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
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Nama Diklat / Pelatihan *</label>
                <input type="text" value={form.namaDiklat} onChange={e => setForm(f => ({ ...f, namaDiklat: e.target.value }))}
                  placeholder="Contoh: Pelatihan Manajemen ASN" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Diklat *</label>
                  <select value={form.jenisDiklat} onChange={e => setForm(f => ({ ...f, jenisDiklat: e.target.value as any }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.keys(jenisConfig).map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Direncanakan">Direncanakan</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Penyelenggara *</label>
                <input type="text" value={form.penyelenggara} onChange={e => setForm(f => ({ ...f, penyelenggara: e.target.value }))}
                  placeholder="Contoh: BPSDM Provinsi Lampung" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Tempat Pelaksanaan</label>
                <input type="text" value={form.tempatPelaksanaan} onChange={e => setForm(f => ({ ...f, tempatPelaksanaan: e.target.value }))}
                  placeholder="Contoh: Bandung, Jawa Barat" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Mulai *</label>
                  <input type="date" value={form.tanggalMulai} onChange={e => setForm(f => ({ ...f, tanggalMulai: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Selesai *</label>
                  <input type="date" value={form.tanggalSelesai} onChange={e => setForm(f => ({ ...f, tanggalSelesai: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jumlah JP (Jam Pelajaran)</label>
                  <input type="number" value={form.jumlahJP || ''} onChange={e => setForm(f => ({ ...f, jumlahJP: parseInt(e.target.value) || 0 }))}
                    placeholder="Contoh: 40" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor Sertifikat</label>
                  <input type="text" value={form.nomorSertifikat} onChange={e => setForm(f => ({ ...f, nomorSertifikat: e.target.value }))}
                    placeholder="No. sertifikat kelulusan" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editData ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Riwayat Diklat</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-3 rounded-xl ${jenisConfig[detailData.jenisDiklat].bg}`}>
                <p className={`text-xs font-semibold ${jenisConfig[detailData.jenisDiklat].color}`}>Diklat {detailData.jenisDiklat}</p>
                <p className="text-gray-800 font-medium text-sm mt-1">{detailData.namaDiklat}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Peserta</p>
                <p className="text-sm font-medium text-gray-800">{getFullName(detailData.pegawaiId)}</p>
                <p className="text-xs text-gray-500">{getPegawai(detailData.pegawaiId)?.jabatan}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 mb-1">Penyelenggara</p><p className="text-sm text-gray-800">{detailData.penyelenggara}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Tempat</p><p className="text-sm text-gray-800">{detailData.tempatPelaksanaan || '—'}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Tanggal Pelaksanaan</p>
                  <p className="text-sm text-gray-800">{formatDate(detailData.tanggalMulai)}</p>
                  <p className="text-xs text-gray-500">s.d. {formatDate(detailData.tanggalSelesai)}</p>
                </div>
                <div><p className="text-xs text-gray-400 mb-1">Durasi & JP</p>
                  <p className="text-sm text-gray-800">{getDuration(detailData.tanggalMulai, detailData.tanggalSelesai)}</p>
                  <p className="text-xs text-gray-500">{detailData.jumlahJP} Jam Pelajaran</p>
                </div>
              </div>
              {detailData.nomorSertifikat && (
                <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                  <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-700 font-medium">Sertifikat Diterbitkan</p>
                    <p className="text-xs text-green-600 font-mono">{detailData.nomorSertifikat}</p>
                  </div>
                </div>
              )}
              <div><p className="text-xs text-gray-400 mb-1">Status</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[detailData.status].bg} ${statusConfig[detailData.status].color}`}>
                  {detailData.status}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowDetailModal(false); openEdit(detailData); }}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Hapus Riwayat Diklat?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Data riwayat diklat ini akan dihapus permanen.</p>
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
