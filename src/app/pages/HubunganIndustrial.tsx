import React, { useState, useMemo } from 'react';
import { Scale, Search, Plus, Eye, Edit2, Trash2, X, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { GrievanceRecord, PHKRecord } from '../types';
import { toast } from 'sonner';

type TabType = 'grievance' | 'phk';

const grievanceStatusConfig: Record<string, { bg: string; color: string }> = {
  'Diterima': { bg: 'bg-blue-50', color: 'text-blue-700' },
  'Mediasi': { bg: 'bg-yellow-50', color: 'text-yellow-700' },
  'Selesai': { bg: 'bg-green-50', color: 'text-green-700' },
  'Diteruskan ke Disnaker': { bg: 'bg-red-50', color: 'text-red-700' },
};
const kategoriBg: Record<string, string> = {
  'Gaji': 'bg-green-100 text-green-700', 'Lingkungan Kerja': 'bg-blue-100 text-blue-700',
  'Diskriminasi': 'bg-red-100 text-red-700', 'Keselamatan Kerja': 'bg-orange-100 text-orange-700',
  'Kontrak': 'bg-purple-100 text-purple-700', 'Lainnya': 'bg-gray-100 text-gray-600',
};
const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function HubunganIndustrial() {
  const { grievance, phk, pegawai, addGrievance, updateGrievance, deleteGrievance, addPHK, updatePHK, deletePHK } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('grievance');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<GrievanceRecord | PHKRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const emptyGrievance: Omit<GrievanceRecord, 'id'> = { pegawaiId: '', tanggalPengaduan: '', kategori: 'Gaji', deskripsi: '', status: 'Diterima', resolusi: '', tanggalResolusi: '', mediator: '' };
  const emptyPHK: Omit<PHKRecord, 'id'> = { pegawaiId: '', alasanPHK: '', jenisPHK: 'Pengunduran Diri', tanggalPHK: '', masaKerja: '', pesangon: 0, uangPisah: 0, uangPenggantianHak: 0, totalPesangon: 0, nomorSK: '', status: 'Proses', catatan: '' };
  const [formGrievance, setFormGrievance] = useState<Omit<GrievanceRecord, 'id'>>(emptyGrievance);
  const [formPHK, setFormPHK] = useState<Omit<PHKRecord, 'id'>>(emptyPHK);

  const getFullName = (id: string) => { const p = pegawai.find(x => x.id === id); return p ? `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}` : '—'; };
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const filteredGrievance = useMemo(() => grievance.filter(g => !search || getFullName(g.pegawaiId).toLowerCase().includes(search.toLowerCase()) || g.deskripsi.toLowerCase().includes(search.toLowerCase())), [grievance, search, pegawai]);
  const filteredPHK = useMemo(() => phk.filter(p => !search || getFullName(p.pegawaiId).toLowerCase().includes(search.toLowerCase())), [phk, search, pegawai]);

  const handleSave = () => {
    if (activeTab === 'grievance') {
      if (!formGrievance.pegawaiId || !formGrievance.tanggalPengaduan || !formGrievance.deskripsi) { toast.error('Harap isi field wajib'); return; }
      if (editId) { updateGrievance({ ...formGrievance, id: editId }); toast.success('Pengaduan diperbarui'); }
      else { addGrievance(formGrievance); toast.success('Pengaduan berhasil dicatat'); }
    } else {
      if (!formPHK.pegawaiId || !formPHK.tanggalPHK) { toast.error('Harap isi field wajib'); return; }
      const total = formPHK.pesangon + formPHK.uangPisah + formPHK.uangPenggantianHak;
      if (editId) { updatePHK({ ...formPHK, totalPesangon: total, id: editId }); toast.success('Data PHK diperbarui'); }
      else { addPHK({ ...formPHK, totalPesangon: total }); toast.success('Data PHK dicatat'); }
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (activeTab === 'grievance') deleteGrievance(id);
    else deletePHK(id);
    toast.success('Data dihapus'); setShowDeleteConfirm(null);
  };

  const pendingGrievance = grievance.filter(g => g.status !== 'Selesai').length;
  const totalPesangon = phk.reduce((a, p) => a + p.totalPesangon, 0);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Hubungan Industrial & PKB</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 13/2003 Pasal 102–135 · UU Cipta Kerja No. 6/2023 · Peraturan Perusahaan RS</p>
        </div>
        <button onClick={() => { setEditId(null); if (activeTab === 'grievance') setFormGrievance(emptyGrievance); else setFormPHK(emptyPHK); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengaduan (Grievance)', value: grievance.length, sub: `${pendingGrievance} belum selesai`, color: 'text-blue-600' },
          { label: 'Pengaduan Aktif', value: pendingGrievance, sub: 'Perlu tindak lanjut', color: pendingGrievance > 0 ? 'text-yellow-600' : 'text-gray-500' },
          { label: 'Proses PHK/Pensiun', value: phk.length, sub: 'Termasuk pensiun', color: 'text-orange-600' },
          { label: 'Est. Total Pesangon', value: `Rp ${(totalPesangon / 1e6).toFixed(0)}jt`, sub: 'Semua proses', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* PKB Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Peraturan Perusahaan (PP) & PKB RSUD Abdul Moeloek</p>
            <p className="text-xs text-blue-600 mt-1">PP RSUD AM Rev. III/2024 · Berlaku: 1 Jan 2024 – 31 Des 2025 · Status: <span className="font-semibold">Dalam Proses Pembaruan</span></p>
            <p className="text-xs text-blue-500 mt-0.5">Catatan: RSUD Abdul Moeloek belum memiliki Serikat Pekerja yang terdaftar. Hubungan industrial diatur melalui Peraturan Perusahaan sesuai UU No. 13/2003.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[{ key: 'grievance' as TabType, label: 'Pengaduan & Mediasi', count: grievance.length }, { key: 'phk' as TabType, label: 'PHK & Pensiun', count: phk.length }].map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); }} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label} <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-b border-gray-50">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau deskripsi..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Grievance Table */}
        {activeTab === 'grievance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tgl Pengaduan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Deskripsi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Mediator</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredGrievance.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada pengaduan</td></tr>
                  : filteredGrievance.map(g => {
                    const sc = grievanceStatusConfig[g.status];
                    return (
                      <tr key={g.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailData(g)}>
                        <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{getFullName(g.pegawaiId)}</p><p className="text-xs text-gray-400">{pegawai.find(p => p.id === g.pegawaiId)?.unitKerja}</p></td>
                        <td className="px-4 py-3.5 text-xs text-gray-700">{fmtDate(g.tanggalPengaduan)}</td>
                        <td className="px-4 py-3.5"><span className={`text-xs px-2 py-0.5 rounded font-medium ${kategoriBg[g.kategori]}`}>{g.kategori}</span></td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500 max-w-xs truncate">{g.deskripsi}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{g.mediator || '—'}</td>
                        <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>{g.status}</span></td>
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setDetailData(g)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setEditId(g.id); setFormGrievance({ pegawaiId: g.pegawaiId, tanggalPengaduan: g.tanggalPengaduan, kategori: g.kategori, deskripsi: g.deskripsi, status: g.status, resolusi: g.resolusi || '', tanggalResolusi: g.tanggalResolusi || '', mediator: g.mediator || '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setShowDeleteConfirm(g.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* PHK Table */}
        {activeTab === 'phk' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis PHK</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tanggal PHK</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Masa Kerja</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Total Pesangon</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPHK.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data PHK</td></tr>
                  : filteredPHK.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailData(p)}>
                      <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{getFullName(p.pegawaiId)}</p><p className="text-xs text-gray-400">{pegawai.find(x => x.id === p.pegawaiId)?.jabatan}</p></td>
                      <td className="px-4 py-3.5"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{p.jenisPHK}</span></td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-700">{fmtDate(p.tanggalPHK)}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{p.masaKerja}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-right text-xs font-medium text-gray-800">{p.totalPesangon > 0 ? `Rp ${fmt(p.totalPesangon)}` : '—'}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td>
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditId(p.id); setFormPHK({ pegawaiId: p.pegawaiId, alasanPHK: p.alasanPHK, jenisPHK: p.jenisPHK, tanggalPHK: p.tanggalPHK, masaKerja: p.masaKerja, pesangon: p.pesangon, uangPisah: p.uangPisah, uangPenggantianHak: p.uangPenggantianHak, totalPesangon: p.totalPesangon, nomorSK: p.nomorSK || '', status: p.status, catatan: p.catatan || '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setShowDeleteConfirm(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailData(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{'kategori' in detailData ? 'Detail Pengaduan' : 'Detail PHK'}</h2>
              <button onClick={() => setDetailData(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800">{getFullName(detailData.pegawaiId)}</p>
                <p className="text-xs text-gray-400">{pegawai.find(p => p.id === detailData.pegawaiId)?.jabatan}</p>
              </div>
              {'kategori' in detailData ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-400">Tgl Pengaduan</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggalPengaduan)}</p></div>
                    <div><p className="text-xs text-gray-400">Kategori</p><span className={`text-xs px-2 py-0.5 rounded font-medium ${kategoriBg[detailData.kategori]}`}>{detailData.kategori}</span></div>
                  </div>
                  <div><p className="text-xs text-gray-400 mb-1">Deskripsi Pengaduan</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detailData.deskripsi}</p></div>
                  {detailData.resolusi && <div><p className="text-xs text-gray-400 mb-1">Resolusi</p><p className="text-sm text-green-800 bg-green-50 p-3 rounded-lg border border-green-100">{detailData.resolusi}</p></div>}
                  {detailData.mediator && <div><p className="text-xs text-gray-400">Mediator</p><p className="text-sm text-gray-800">{detailData.mediator}</p></div>}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {[['Jenis PHK', detailData.jenisPHK], ['Tanggal PHK', fmtDate(detailData.tanggalPHK)], ['Masa Kerja', detailData.masaKerja], ['Status', detailData.status]].map(([l, v]) => (
                      <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="text-sm text-gray-800 mt-0.5">{v}</p></div>
                    ))}
                  </div>
                  <div><p className="text-xs text-gray-400 mb-1">Alasan PHK</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detailData.alasanPHK}</p></div>
                  <div className="p-4 bg-blue-50 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-blue-700">KOMPONEN PESANGON</p>
                    {[['Uang Pesangon', detailData.pesangon], ['Uang Pisah/UPMK', detailData.uangPisah], ['Uang Penggantian Hak', detailData.uangPenggantianHak]].filter(([, v]) => (v as number) > 0).map(([l, v]) => (
                      <div key={l as string} className="flex justify-between text-sm"><span className="text-blue-700">{l as string}</span><span className="font-medium text-blue-900">Rp {fmt(v as number)}</span></div>
                    ))}
                    <div className="flex justify-between font-bold border-t border-blue-200 pt-2"><span className="text-blue-800">Total</span><span className="text-blue-900">Rp {fmt(detailData.totalPesangon)}</span></div>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end"><button onClick={() => setDetailData(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg">Tutup</button></div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit' : 'Tambah'} {activeTab === 'grievance' ? 'Pengaduan' : 'Data PHK'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={activeTab === 'grievance' ? formGrievance.pegawaiId : formPHK.pegawaiId}
                  onChange={e => activeTab === 'grievance' ? setFormGrievance(f => ({ ...f, pegawaiId: e.target.value })) : setFormPHK(f => ({ ...f, pegawaiId: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              {activeTab === 'grievance' ? <>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tgl Pengaduan *</label><input type="date" value={formGrievance.tanggalPengaduan} onChange={e => setFormGrievance(f => ({ ...f, tanggalPengaduan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Kategori</label>
                    <select value={formGrievance.kategori} onChange={e => setFormGrievance(f => ({ ...f, kategori: e.target.value as GrievanceRecord['kategori'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Gaji', 'Lingkungan Kerja', 'Diskriminasi', 'Keselamatan Kerja', 'Kontrak', 'Lainnya'].map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Deskripsi Pengaduan *</label><textarea rows={3} value={formGrievance.deskripsi} onChange={e => setFormGrievance(f => ({ ...f, deskripsi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={formGrievance.status} onChange={e => setFormGrievance(f => ({ ...f, status: e.target.value as GrievanceRecord['status'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Diterima', 'Mediasi', 'Selesai', 'Diteruskan ke Disnaker'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Mediator</label><input value={formGrievance.mediator || ''} onChange={e => setFormGrievance(f => ({ ...f, mediator: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Resolusi</label><textarea rows={2} value={formGrievance.resolusi || ''} onChange={e => setFormGrievance(f => ({ ...f, resolusi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
              </> : <>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis PHK</label>
                    <select value={formPHK.jenisPHK} onChange={e => setFormPHK(f => ({ ...f, jenisPHK: e.target.value as PHKRecord['jenisPHK'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Pengunduran Diri', 'PHK oleh Perusahaan', 'Berakhirnya Kontrak', 'Pensiun Dini', 'Meninggal'].map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal PHK *</label><input type="date" value={formPHK.tanggalPHK} onChange={e => setFormPHK(f => ({ ...f, tanggalPHK: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Alasan PHK</label><textarea rows={2} value={formPHK.alasanPHK} onChange={e => setFormPHK(f => ({ ...f, alasanPHK: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Masa Kerja</label><input value={formPHK.masaKerja} onChange={e => setFormPHK(f => ({ ...f, masaKerja: e.target.value }))} placeholder="Contoh: 15 Tahun 3 Bulan" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-3 gap-3">
                  {[['Uang Pesangon', 'pesangon'], ['Uang Pisah/UPMK', 'uangPisah'], ['Uang Penggantian Hak', 'uangPenggantianHak']].map(([l, k]) => (
                    <div key={k}><label className="text-xs font-medium text-gray-700 block mb-1.5">{l} (Rp)</label><input type="number" value={(formPHK as any)[k] || 0} onChange={e => setFormPHK(f => ({ ...f, [k]: parseInt(e.target.value) || 0 }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  ))}
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan</label><textarea rows={2} value={formPHK.catatan || ''} onChange={e => setFormPHK(f => ({ ...f, catatan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
              </>}
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
            <h3 className="font-semibold mb-2">Hapus Data?</h3>
            <p className="text-sm text-gray-500 mb-4">Data ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
