import React, { useState, useMemo } from 'react';
import { FileSignature, Search, Plus, Eye, Edit2, Trash2, X, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { KontrakRecord } from '../types';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const statusConfig = {
  'Aktif': { bg: 'bg-green-50', color: 'text-green-700', icon: CheckCircle },
  'Berakhir': { bg: 'bg-red-50', color: 'text-red-700', icon: AlertTriangle },
  'Diperpanjang': { bg: 'bg-blue-50', color: 'text-blue-700', icon: CheckCircle },
  'Dibatalkan': { bg: 'bg-gray-50', color: 'text-gray-600', icon: XCircle },
};
const jenisConfig: Record<string, string> = {
  'PKWT': 'bg-blue-100 text-blue-700',
  'PKWTT': 'bg-green-100 text-green-700',
  'Dokter Mitra': 'bg-purple-100 text-purple-700',
  'Dokter Paruh Waktu': 'bg-indigo-100 text-indigo-700',
  'Tenaga Alih Daya': 'bg-orange-100 text-orange-700',
};

export default function Kontrak() {
  const { kontrak, pegawai, addKontrak, updateKontrak, deleteKontrak } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<KontrakRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const emptyForm: Omit<KontrakRecord, 'id'> = { pegawaiId: '', jenisKontrak: 'PKWT', nomorKontrak: '', tanggalMulai: '', tanggalSelesai: '', jabatanKontrak: '', unitKerja: '', nilaiKontrak: undefined, jadwalPraktik: '', statusKontrak: 'Aktif', catatanKontrak: '' };
  const [form, setForm] = useState<Omit<KontrakRecord, 'id'>>(emptyForm);

  const getFullName = (id: string) => { const p = pegawai.find(x => x.id === id); if (!p) return '—'; return `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`; };
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const daysLeft = (dateStr?: string) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filtered = useMemo(() => kontrak.filter(k => {
    const nm = getFullName(k.pegawaiId).toLowerCase();
    const ok = !search || nm.includes(search.toLowerCase()) || k.nomorKontrak.toLowerCase().includes(search.toLowerCase());
    const okJ = !filterJenis || k.jenisKontrak === filterJenis;
    const okS = !filterStatus || k.statusKontrak === filterStatus;
    return ok && okJ && okS;
  }), [kontrak, search, filterJenis, filterStatus, pegawai]);

  const handleSave = () => {
    if (!form.pegawaiId || !form.nomorKontrak || !form.tanggalMulai) { toast.error('Harap isi semua field wajib'); return; }
    if (editId) { updateKontrak({ ...form, id: editId }); toast.success('Kontrak diperbarui'); }
    else { addKontrak(form); toast.success('Kontrak kerja baru ditambahkan'); }
    setShowModal(false);
  };

  const aktifCount = kontrak.filter(k => k.statusKontrak === 'Aktif').length;
  const akanBerakhir = kontrak.filter(k => k.statusKontrak === 'Aktif' && k.tanggalSelesai && (daysLeft(k.tanggalSelesai) || 0) <= 60 && (daysLeft(k.tanggalSelesai) || 0) > 0).length;
  const berakhirCount = kontrak.filter(k => k.statusKontrak === 'Berakhir').length;
  const mitraCount = kontrak.filter(k => k.jenisKontrak === 'Dokter Mitra' || k.jenisKontrak === 'Dokter Paruh Waktu').length;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kontrak & Hubungan Kerja</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 13/2003 Pasal 50–66 · UU Cipta Kerja No. 6/2023 · Regulasi Dokter Mitra RS</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah Kontrak
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Kontrak Aktif', value: aktifCount, sub: 'Berjalan', color: 'text-green-600' },
          { label: 'Akan Berakhir (60 hari)', value: akanBerakhir, sub: 'Perlu perpanjangan', color: akanBerakhir > 0 ? 'text-yellow-600' : 'text-gray-500' },
          { label: 'Kontrak Berakhir', value: berakhirCount, sub: 'Tidak diperpanjang', color: 'text-red-600' },
          { label: 'Dokter Mitra/Paruh Waktu', value: mitraCount, sub: 'PKS aktif', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau nomor kontrak..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Jenis</option>
            {['PKWT', 'PKWTT', 'Dokter Mitra', 'Dokter Paruh Waktu', 'Tenaga Alih Daya'].map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Status</option>
            {['Aktif', 'Berakhir', 'Diperpanjang', 'Dibatalkan'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nomor Kontrak</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jabatan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Periode</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data kontrak</td></tr>
                : filtered.map(k => {
                  const sc = statusConfig[k.statusKontrak];
                  const Icon = sc.icon;
                  const days = daysLeft(k.tanggalSelesai);
                  return (
                    <tr key={k.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailData(k)}>
                      <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{getFullName(k.pegawaiId)}</p><p className="text-xs text-gray-400">{k.unitKerja}</p></td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-700">{k.nomorKontrak}</td>
                      <td className="px-4 py-3.5"><span className={`text-xs px-2 py-0.5 rounded font-medium ${jenisConfig[k.jenisKontrak]}`}>{k.jenisKontrak}</span></td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{k.jabatanKontrak}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-gray-700">{fmtDate(k.tanggalMulai)} — {k.tanggalSelesai ? fmtDate(k.tanggalSelesai) : 'Tidak Terbatas'}</p>
                        {k.statusKontrak === 'Aktif' && days !== null && days <= 60 && days > 0 && <p className="text-xs text-yellow-600 mt-0.5">⚠ {days} hari lagi</p>}
                      </td>
                      <td className="px-4 py-3.5 text-center"><span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}><Icon className="w-3 h-3" />{k.statusKontrak}</span></td>
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailData(k)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setEditId(k.id); setForm({ pegawaiId: k.pegawaiId, jenisKontrak: k.jenisKontrak, nomorKontrak: k.nomorKontrak, tanggalMulai: k.tanggalMulai, tanggalSelesai: k.tanggalSelesai || '', jabatanKontrak: k.jabatanKontrak, unitKerja: k.unitKerja, nilaiKontrak: k.nilaiKontrak, jadwalPraktik: k.jadwalPraktik || '', statusKontrak: k.statusKontrak, catatanKontrak: k.catatanKontrak || '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setShowDeleteConfirm(k.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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
                <div><p className="font-semibold text-gray-800">{getFullName(detailData.pegawaiId)}</p><p className="text-xs text-gray-500">{detailData.jabatanKontrak}</p></div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[detailData.statusKontrak].bg} ${statusConfig[detailData.statusKontrak].color}`}>{detailData.statusKontrak}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[['Nomor Kontrak', detailData.nomorKontrak], ['Jenis Kontrak', detailData.jenisKontrak], ['Unit Kerja', detailData.unitKerja], ['Mulai Berlaku', fmtDate(detailData.tanggalMulai)], ['Berakhir', detailData.tanggalSelesai ? fmtDate(detailData.tanggalSelesai) : 'Tidak Terbatas'], ['Nilai Kontrak', detailData.nilaiKontrak ? `Rp ${fmt(detailData.nilaiKontrak)}/bln` : 'Sesuai Tarif Jasa Medis']].map(([l, v]) => (
                  <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="text-sm text-gray-800 mt-0.5">{v}</p></div>
                ))}
              </div>
              {detailData.jadwalPraktik && <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-400 mb-1">Jadwal Praktik</p><p className="text-sm text-blue-800">{detailData.jadwalPraktik}</p></div>}
              {detailData.catatanKontrak && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400 mb-1">Catatan</p><p className="text-sm text-gray-700">{detailData.catatanKontrak}</p></div>}
              {detailData.statusKontrak === 'Aktif' && detailData.tanggalSelesai && (daysLeft(detailData.tanggalSelesai) || 0) <= 60 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100"><p className="text-xs text-yellow-800 font-medium">⚠ Kontrak akan berakhir dalam {daysLeft(detailData.tanggalSelesai)} hari — segera proses perpanjangan</p></div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <button onClick={() => { setDetailData(null); setEditId(detailData.id); setForm({ pegawaiId: detailData.pegawaiId, jenisKontrak: detailData.jenisKontrak, nomorKontrak: detailData.nomorKontrak, tanggalMulai: detailData.tanggalMulai, tanggalSelesai: detailData.tanggalSelesai || '', jabatanKontrak: detailData.jabatanKontrak, unitKerja: detailData.unitKerja, nilaiKontrak: detailData.nilaiKontrak, jadwalPraktik: detailData.jadwalPraktik || '', statusKontrak: detailData.statusKontrak, catatanKontrak: detailData.catatanKontrak || '' }); setShowModal(true); }} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
              <button onClick={() => setDetailData(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg">Tutup</button>
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
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit Kontrak' : 'Tambah Kontrak Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={form.pegawaiId} onChange={e => { const p = pegawai.find(x => x.id === e.target.value); setForm(f => ({ ...f, pegawaiId: e.target.value, jabatanKontrak: p?.jabatan || '', unitKerja: p?.unitKerja || '' })); }} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Kontrak</label>
                  <select value={form.jenisKontrak} onChange={e => setForm(f => ({ ...f, jenisKontrak: e.target.value as KontrakRecord['jenisKontrak'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['PKWT', 'PKWTT', 'Dokter Mitra', 'Dokter Paruh Waktu', 'Tenaga Alih Daya'].map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.statusKontrak} onChange={e => setForm(f => ({ ...f, statusKontrak: e.target.value as KontrakRecord['statusKontrak'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Aktif', 'Berakhir', 'Diperpanjang', 'Dibatalkan'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor Kontrak *</label><input value={form.nomorKontrak} onChange={e => setForm(f => ({ ...f, nomorKontrak: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan dalam Kontrak</label><input value={form.jabatanKontrak} onChange={e => setForm(f => ({ ...f, jabatanKontrak: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Mulai *</label><input type="date" value={form.tanggalMulai} onChange={e => setForm(f => ({ ...f, tanggalMulai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Selesai</label><input type="date" value={form.tanggalSelesai || ''} onChange={e => setForm(f => ({ ...f, tanggalSelesai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              {(form.jenisKontrak === 'Dokter Mitra' || form.jenisKontrak === 'Dokter Paruh Waktu') && <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jadwal Praktik</label><input value={form.jadwalPraktik || ''} onChange={e => setForm(f => ({ ...f, jadwalPraktik: e.target.value }))} placeholder="Senin, Rabu 08:00–14:00" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>}
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nilai Kontrak (Rp/bln)</label><input type="number" value={form.nilaiKontrak || ''} onChange={e => setForm(f => ({ ...f, nilaiKontrak: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="Kosongkan jika sesuai tarif jasa" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan</label><textarea rows={2} value={form.catatanKontrak || ''} onChange={e => setForm(f => ({ ...f, catatanKontrak: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editId ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Hapus Kontrak?</h3>
            <p className="text-sm text-gray-500 mb-4">Data kontrak ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={() => { deleteKontrak(showDeleteConfirm); toast.success('Kontrak dihapus'); setShowDeleteConfirm(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
