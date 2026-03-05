import React, { useState, useMemo } from 'react';
import { ShieldAlert, Plus, Search, Eye, Edit2, Trash2, X, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { DisiplinRecord } from '../types';
import { toast } from 'sonner';

const tingkatConfig = {
  Ringan: { color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  Sedang: { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200', dot: 'bg-orange-500' },
  Berat: { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', dot: 'bg-red-500' },
};
const statusConfig = {
  Investigasi: { color: 'text-blue-700', bg: 'bg-blue-100', icon: Search },
  Proses: { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  Selesai: { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  Banding: { color: 'text-purple-700', bg: 'bg-purple-100', icon: AlertTriangle },
};

const jenisHukumanByTingkat = {
  Ringan: ['Teguran Lisan', 'Teguran Tertulis', 'Pernyataan Tidak Puas Secara Tertulis'],
  Sedang: ['Penundaan Kenaikan Gaji Berkala', 'Penundaan Kenaikan Pangkat', 'Penurunan Pangkat 1 Tingkat selama 1 Tahun'],
  Berat: ['Penurunan Pangkat 1 Tingkat selama 3 Tahun', 'Pemindahan dalam rangka Penurunan Jabatan', 'Pembebasan dari Jabatan', 'Pemberhentian dengan Hormat atas permintaan Sendiri', 'Pemberhentian Tidak dengan Hormat'],
};

const EMPTY_FORM = {
  pegawaiId: '', jenisHukuman: '', tingkatHukuman: 'Ringan' as 'Ringan' | 'Sedang' | 'Berat',
  tanggalKejadian: '', tanggalSK: '', nomorSK: '', kronologi: '',
  status: 'Investigasi' as DisiplinRecord['status'], pejabatPenetap: '',
};

export default function Disiplin() {
  const { disiplin, pegawai, addDisiplin, updateDisiplin, deleteDisiplin } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editData, setEditData] = useState<DisiplinRecord | null>(null);
  const [detailData, setDetailData] = useState<DisiplinRecord | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const getPegawai = (id: string) => pegawai.find(p => p.id === id);
  const getFullName = (id: string) => {
    const p = getPegawai(id);
    if (!p) return '-';
    return `${p.gelarDepan || ''} ${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`.trim();
  };

  const filtered = useMemo(() => disiplin.filter(d => {
    const nama = getFullName(d.pegawaiId).toLowerCase();
    const matchSearch = !search || nama.includes(search.toLowerCase()) || d.jenisHukuman.toLowerCase().includes(search.toLowerCase());
    const matchTingkat = !filterTingkat || d.tingkatHukuman === filterTingkat;
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchTingkat && matchStatus;
  }), [disiplin, search, filterTingkat, filterStatus, pegawai]);

  const stats = {
    ringan: disiplin.filter(d => d.tingkatHukuman === 'Ringan').length,
    sedang: disiplin.filter(d => d.tingkatHukuman === 'Sedang').length,
    berat: disiplin.filter(d => d.tingkatHukuman === 'Berat').length,
    proses: disiplin.filter(d => d.status !== 'Selesai').length,
  };

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditData(null); setShowModal(true); };
  const openEdit = (d: DisiplinRecord) => {
    setEditData(d);
    setForm({
      pegawaiId: d.pegawaiId, jenisHukuman: d.jenisHukuman, tingkatHukuman: d.tingkatHukuman,
      tanggalKejadian: d.tanggalKejadian, tanggalSK: d.tanggalSK || '', nomorSK: d.nomorSK || '',
      kronologi: d.kronologi, status: d.status, pejabatPenetap: d.pejabatPenetap || '',
    });
    setShowModal(true);
  };
  const openDetail = (d: DisiplinRecord) => { setDetailData(d); setShowDetailModal(true); };

  const handleSave = () => {
    if (!form.pegawaiId || !form.jenisHukuman || !form.tanggalKejadian || !form.kronologi) {
      toast.error('Harap isi semua field yang wajib diisi');
      return;
    }
    if (editData) {
      updateDisiplin({ ...editData, ...form });
      toast.success('Data disiplin berhasil diperbarui');
    } else {
      addDisiplin(form as Omit<DisiplinRecord, 'id'>);
      toast.success('Kasus disiplin berhasil dicatat');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteDisiplin(id);
    setShowDeleteConfirm(null);
    toast.success('Data disiplin berhasil dihapus');
  };

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Hukuman Ringan', value: stats.ringan, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100', icon: '⚠️' },
          { label: 'Hukuman Sedang', value: stats.sedang, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: '🔶' },
          { label: 'Hukuman Berat', value: stats.berat, color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: '🔴' },
          { label: 'Dalam Proses', value: stats.proses, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: '⏳' },
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
              {Object.entries(jenisHukumanByTingkat).map(([tingkat, jenis]) => (
                <div key={tingkat} className={`p-2.5 rounded-lg text-xs ${tingkatConfig[tingkat as keyof typeof tingkatConfig].bg} ${tingkatConfig[tingkat as keyof typeof tingkatConfig].border} border`}>
                  <p className={`font-semibold mb-1 ${tingkatConfig[tingkat as keyof typeof tingkatConfig].color}`}>Hukuman {tingkat}</p>
                  <ul className="space-y-0.5">
                    {jenis.slice(0, 3).map(j => <li key={j} className="text-gray-600">• {j}</li>)}
                  </ul>
                </div>
              ))}
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
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="Investigasi">Investigasi</option>
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
            <option value="Banding">Banding</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Jenis Hukuman</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Tingkat</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tgl Kejadian</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">No. SK</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Tidak ada kasus disiplin yang ditemukan</p>
                </td></tr>
              ) : filtered.map(d => {
                const tc = tingkatConfig[d.tingkatHukuman];
                const sc = statusConfig[d.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => openDetail(d)}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{getFullName(d.pegawaiId)}</p>
                      <p className="text-xs text-gray-400">{getPegawai(d.pegawaiId)?.unitKerja}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-700">{d.jenisHukuman}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tc.bg} ${tc.color}`}>
                        {d.tingkatHukuman}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-600 hidden md:table-cell">
                      {new Date(d.tanggalKejadian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{d.nomorSK || '—'}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${sc.bg} ${sc.color}`}>
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
              <h2 className="font-semibold text-gray-800">{editData ? 'Edit Kasus Disiplin' : 'Catat Kasus Disiplin Baru'}</h2>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tingkat Hukuman *</label>
                  <select value={form.tingkatHukuman} onChange={e => setForm(f => ({ ...f, tingkatHukuman: e.target.value as any, jenisHukuman: '' }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Hukuman *</label>
                  <select value={form.jenisHukuman} onChange={e => setForm(f => ({ ...f, jenisHukuman: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih Jenis</option>
                    {jenisHukumanByTingkat[form.tingkatHukuman].map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Kejadian *</label>
                  <input type="date" value={form.tanggalKejadian} onChange={e => setForm(f => ({ ...f, tanggalKejadian: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Investigasi">Investigasi</option>
                    <option value="Proses">Proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Banding">Banding</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal SK</label>
                  <input type="date" value={form.tanggalSK} onChange={e => setForm(f => ({ ...f, tanggalSK: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK</label>
                  <input type="text" value={form.nomorSK} onChange={e => setForm(f => ({ ...f, nomorSK: e.target.value }))} placeholder="SK/DISIPLIN/..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Pejabat Penetap</label>
                <input type="text" value={form.pejabatPenetap} onChange={e => setForm(f => ({ ...f, pejabatPenetap: e.target.value }))} placeholder="Nama pejabat yang menetapkan hukuman"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Kronologi Kasus *</label>
                <textarea rows={4} value={form.kronologi} onChange={e => setForm(f => ({ ...f, kronologi: e.target.value }))}
                  placeholder="Uraikan kronologi kasus secara singkat dan jelas..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
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
              <h2 className="font-semibold text-gray-800">Detail Kasus Disiplin</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-3 rounded-xl border ${tingkatConfig[detailData.tingkatHukuman].bg} ${tingkatConfig[detailData.tingkatHukuman].border}`}>
                <p className={`text-sm font-semibold ${tingkatConfig[detailData.tingkatHukuman].color}`}>Hukuman {detailData.tingkatHukuman}</p>
                <p className="text-gray-700 text-sm mt-0.5">{detailData.jenisHukuman}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Pegawai</p>
                <p className="text-sm font-medium text-gray-800">{getFullName(detailData.pegawaiId)}</p>
                <p className="text-xs text-gray-500">{getPegawai(detailData.pegawaiId)?.jabatan} · {getPegawai(detailData.pegawaiId)?.unitKerja}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 mb-1">Tanggal Kejadian</p><p className="text-sm text-gray-800">{new Date(detailData.tanggalKejadian).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Status</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[detailData.status].bg} ${statusConfig[detailData.status].color}`}>{detailData.status}</span>
                </div>
                {detailData.tanggalSK && <div><p className="text-xs text-gray-400 mb-1">Tanggal SK</p><p className="text-sm text-gray-800">{new Date(detailData.tanggalSK).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>}
                {detailData.nomorSK && <div><p className="text-xs text-gray-400 mb-1">Nomor SK</p><p className="text-sm font-mono text-gray-800">{detailData.nomorSK}</p></div>}
              </div>
              {detailData.pejabatPenetap && <div><p className="text-xs text-gray-400 mb-1">Pejabat Penetap</p><p className="text-sm text-gray-800">{detailData.pejabatPenetap}</p></div>}
              <div>
                <p className="text-xs text-gray-400 mb-1">Kronologi Kasus</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{detailData.kronologi}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowDetailModal(false); openEdit(detailData); }}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
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
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Hapus Kasus Disiplin?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Data kasus disiplin ini akan dihapus secara permanen.</p>
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
