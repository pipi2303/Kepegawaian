import React, { useState, useMemo } from 'react';
import { ShieldCheck, Search, Plus, X, Edit2, Trash2, AlertTriangle, CheckCircle, Clock, Syringe, Activity, Eye } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { InsidenK3RS, VaksinasiRecord, MCURecord, JenisInsidenK3RS } from '../types';
import { toast } from 'sonner';

type TabType = 'insiden' | 'vaksinasi' | 'mcu';

const keparahanConfig = { 'Ringan': 'bg-yellow-50 text-yellow-700', 'Sedang': 'bg-orange-50 text-orange-700', 'Berat': 'bg-red-50 text-red-700' };
const statusInsidenConfig: Record<string, { bg: string; color: string }> = {
  'Dilaporkan': { bg: 'bg-blue-50', color: 'text-blue-700' },
  'Investigasi': { bg: 'bg-orange-50', color: 'text-orange-700' },
  'Selesai': { bg: 'bg-green-50', color: 'text-green-700' },
};
const vaksinasiStatusConfig = { 'Lengkap': 'bg-green-100 text-green-700', 'Sebagian': 'bg-yellow-100 text-yellow-700', 'Belum': 'bg-red-100 text-red-700' };
const mcuHasilConfig = { 'Layak Kerja': 'bg-green-100 text-green-700', 'Layak dengan Syarat': 'bg-yellow-100 text-yellow-700', 'Tidak Layak': 'bg-red-100 text-red-700' };

const jenisInsidenList: JenisInsidenK3RS[] = ['Kecelakaan Kerja', 'Pajanan Jarum Suntik', 'Pajanan Cairan Tubuh', 'Pajanan Radiasi', 'Kecelakaan Bahan Kimia', 'Near Miss', 'KTD Pegawai', 'Lainnya'];

export default function K3RS() {
  const { insidenK3RS, vaksinasi, mcu, pegawai, addInsiden, updateInsiden, deleteInsiden, addVaksinasi, updateVaksinasi, deleteVaksinasi, addMCU, updateMCU, deleteMCU } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('insiden');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailInsiden, setDetailInsiden] = useState<InsidenK3RS | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const getFullName = (id: string) => { const p = pegawai.find(x => x.id === id); if (!p) return '—'; return `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}`; };
  const getPegawai = (id: string) => pegawai.find(x => x.id === id);
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // Insiden form
  const emptyInsiden: Omit<InsidenK3RS, 'id'> = { pegawaiId: '', tanggal: '', jenisInsiden: 'Kecelakaan Kerja', lokasi: '', deskripsi: '', tindakanSegera: '', tindakLanjut: '', keparahan: 'Ringan', statusLaporan: 'Dilaporkan' };
  const [formInsiden, setFormInsiden] = useState<Omit<InsidenK3RS, 'id'>>(emptyInsiden);

  // Vaksinasi form
  const emptyVak: Omit<VaksinasiRecord, 'id'> = { pegawaiId: '', jenisVaksin: '', dosis: 1, tanggalVaksin: '', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Sebagian' };
  const [formVak, setFormVak] = useState<Omit<VaksinasiRecord, 'id'>>(emptyVak);

  // MCU form
  const emptyMCU: Omit<MCURecord, 'id'> = { pegawaiId: '', tanggal: '', jenisMCU: 'Berkala', hasilMCU: 'Layak Kerja', catatan: '', rekomendasiDokter: '', tanggalBerikutnya: '', fasilitasMCU: 'RSUD Abdul Moeloek' };
  const [formMCU, setFormMCU] = useState<Omit<MCURecord, 'id'>>(emptyMCU);

  const insidenFiltered = useMemo(() => insidenK3RS.filter(i => !search || getFullName(i.pegawaiId).toLowerCase().includes(search.toLowerCase()) || i.jenisInsiden.toLowerCase().includes(search.toLowerCase())), [insidenK3RS, search, pegawai]);
  const vakFiltered = useMemo(() => vaksinasi.filter(v => !search || getFullName(v.pegawaiId).toLowerCase().includes(search.toLowerCase()) || v.jenisVaksin.toLowerCase().includes(search.toLowerCase())), [vaksinasi, search, pegawai]);
  const mcuFiltered = useMemo(() => mcu.filter(m => !search || getFullName(m.pegawaiId).toLowerCase().includes(search.toLowerCase())), [mcu, search, pegawai]);

  const openAdd = () => {
    setEditId(null);
    if (activeTab === 'insiden') setFormInsiden(emptyInsiden);
    else if (activeTab === 'vaksinasi') setFormVak(emptyVak);
    else setFormMCU(emptyMCU);
    setShowModal(true);
  };

  const handleSave = () => {
    if (activeTab === 'insiden') {
      if (!formInsiden.pegawaiId || !formInsiden.tanggal || !formInsiden.deskripsi) { toast.error('Harap isi semua field wajib'); return; }
      if (editId) { updateInsiden({ ...formInsiden, id: editId }); toast.success('Data insiden diperbarui'); }
      else { addInsiden(formInsiden); toast.success('Laporan insiden K3RS berhasil disimpan'); }
    } else if (activeTab === 'vaksinasi') {
      if (!formVak.pegawaiId || !formVak.jenisVaksin) { toast.error('Harap isi field wajib'); return; }
      if (editId) { updateVaksinasi({ ...formVak, id: editId }); toast.success('Data vaksinasi diperbarui'); }
      else { addVaksinasi(formVak); toast.success('Data vaksinasi disimpan'); }
    } else {
      if (!formMCU.pegawaiId || !formMCU.tanggal) { toast.error('Harap isi field wajib'); return; }
      if (editId) { updateMCU({ ...formMCU, id: editId }); toast.success('Data MCU diperbarui'); }
      else { addMCU(formMCU); toast.success('Data MCU disimpan'); }
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (activeTab === 'insiden') deleteInsiden(id);
    else if (activeTab === 'vaksinasi') deleteVaksinasi(id);
    else deleteMCU(id);
    toast.success('Data berhasil dihapus'); setShowDeleteConfirm(null);
  };

  const totalInsiden = insidenK3RS.length;
  const beratInsiden = insidenK3RS.filter(i => i.keparahan === 'Berat').length;
  const vakTidakLengkap = vaksinasi.filter(v => v.status !== 'Lengkap').length;
  const mcuPerluTindak = mcu.filter(m => m.hasilMCU !== 'Layak Kerja').length;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">K3RS — Keselamatan & Kesehatan Kerja</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 1/1970 · Permenkes No. 66/2016 (K3RS) · UU No. 44/2009 Pasal 40</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Insiden K3 (2026)', value: totalInsiden, sub: `${beratInsiden} kasus berat`, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Insiden Dalam Proses', value: insidenK3RS.filter(i => i.statusLaporan !== 'Selesai').length, sub: 'Investigasi & Dilaporkan', color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Vaksinasi Tidak Lengkap', value: vakTidakLengkap, sub: 'Perlu tindak lanjut', color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'MCU Perlu Tindak Lanjut', value: mcuPerluTindak, sub: 'Monitoring lebih lanjut', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[{ key: 'insiden' as TabType, label: 'Laporan Insiden', count: insidenK3RS.length }, { key: 'vaksinasi' as TabType, label: 'Vaksinasi Wajib', count: vaksinasi.length }, { key: 'mcu' as TabType, label: 'Medical Check-Up', count: mcu.length }].map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); }} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label} <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-gray-50">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau jenis..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Insiden Table */}
        {activeTab === 'insiden' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai & Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis Insiden</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Lokasi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Deskripsi</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Keparahan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {insidenFiltered.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data insiden</td></tr>
                  : insidenFiltered.map(i => (
                    <tr key={i.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailInsiden(i)}>
                      <td className="px-4 py-3.5"><p className="font-medium text-gray-800 text-sm">{getFullName(i.pegawaiId)}</p><p className="text-xs text-gray-400">{fmtDate(i.tanggal)}</p></td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">{i.jenisInsiden}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{i.lokasi}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500 max-w-xs truncate">{i.deskripsi}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${keparahanConfig[i.keparahan]}`}>{i.keparahan}</span></td>
                      <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInsidenConfig[i.statusLaporan]?.bg} ${statusInsidenConfig[i.statusLaporan]?.color}`}>{i.statusLaporan}</span></td>
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailInsiden(i)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setEditId(i.id); setFormInsiden({ pegawaiId: i.pegawaiId, tanggal: i.tanggal, jenisInsiden: i.jenisInsiden, lokasi: i.lokasi, deskripsi: i.deskripsi, tindakanSegera: i.tindakanSegera || '', tindakLanjut: i.tindakLanjut || '', keparahan: i.keparahan, statusLaporan: i.statusLaporan }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setShowDeleteConfirm(i.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Vaksinasi Table */}
        {activeTab === 'vaksinasi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis Vaksin</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Dosis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tgl Vaksin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Fasilitas</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {vakFiltered.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data</td></tr>
                  : vakFiltered.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{getFullName(v.pegawaiId)}</p><p className="text-xs text-gray-400">{getPegawai(v.pegawaiId)?.unitKerja}</p></td>
                      <td className="px-4 py-3.5 text-sm text-gray-700">{v.jenisVaksin}</td>
                      <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-700">{v.dosis}x</td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{fmtDate(v.tanggalVaksin)}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{v.fasilitasVaksin}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${vaksinasiStatusConfig[v.status]}`}>{v.status}</span></td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditId(v.id); setFormVak({ pegawaiId: v.pegawaiId, jenisVaksin: v.jenisVaksin, dosis: v.dosis, tanggalVaksin: v.tanggalVaksin, fasilitasVaksin: v.fasilitasVaksin || '', tanggalBooster: v.tanggalBooster || '', status: v.status }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setShowDeleteConfirm(v.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MCU Table */}
        {activeTab === 'mcu' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal MCU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jenis MCU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Catatan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden xl:table-cell">MCU Berikutnya</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Hasil</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {mcuFiltered.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data</td></tr>
                  : mcuFiltered.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{getFullName(m.pegawaiId)}</p><p className="text-xs text-gray-400">{getPegawai(m.pegawaiId)?.jabatan}</p></td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">{fmtDate(m.tanggal)}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{m.jenisMCU}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500 max-w-xs truncate">{m.catatan || '—'}</td>
                      <td className="px-4 py-3.5 hidden xl:table-cell text-xs text-gray-500">{fmtDate(m.tanggalBerikutnya)}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${mcuHasilConfig[m.hasilMCU]}`}>{m.hasilMCU}</span></td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditId(m.id); setFormMCU({ pegawaiId: m.pegawaiId, tanggal: m.tanggal, jenisMCU: m.jenisMCU, hasilMCU: m.hasilMCU, catatan: m.catatan || '', rekomendasiDokter: m.rekomendasiDokter || '', tanggalBerikutnya: m.tanggalBerikutnya || '', fasilitasMCU: m.fasilitasMCU || '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setShowDeleteConfirm(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit' : 'Tambah'} {activeTab === 'insiden' ? 'Laporan Insiden' : activeTab === 'vaksinasi' ? 'Data Vaksinasi' : 'Data MCU'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={activeTab === 'insiden' ? formInsiden.pegawaiId : activeTab === 'vaksinasi' ? formVak.pegawaiId : formMCU.pegawaiId}
                  onChange={e => {
                    if (activeTab === 'insiden') setFormInsiden(f => ({ ...f, pegawaiId: e.target.value }));
                    else if (activeTab === 'vaksinasi') setFormVak(f => ({ ...f, pegawaiId: e.target.value }));
                    else setFormMCU(f => ({ ...f, pegawaiId: e.target.value }));
                  }} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>

              {activeTab === 'insiden' && <>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal *</label><input type="date" value={formInsiden.tanggal} onChange={e => setFormInsiden(f => ({ ...f, tanggal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Keparahan</label>
                    <select value={formInsiden.keparahan} onChange={e => setFormInsiden(f => ({ ...f, keparahan: e.target.value as InsidenK3RS['keparahan'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Ringan', 'Sedang', 'Berat'].map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Insiden *</label>
                  <select value={formInsiden.jenisInsiden} onChange={e => setFormInsiden(f => ({ ...f, jenisInsiden: e.target.value as JenisInsidenK3RS }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {jenisInsidenList.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Lokasi Kejadian</label><input value={formInsiden.lokasi} onChange={e => setFormInsiden(f => ({ ...f, lokasi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Deskripsi Kejadian *</label><textarea rows={3} value={formInsiden.deskripsi} onChange={e => setFormInsiden(f => ({ ...f, deskripsi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tindakan Segera</label><input value={formInsiden.tindakanSegera || ''} onChange={e => setFormInsiden(f => ({ ...f, tindakanSegera: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status Laporan</label>
                  <select value={formInsiden.statusLaporan} onChange={e => setFormInsiden(f => ({ ...f, statusLaporan: e.target.value as InsidenK3RS['statusLaporan'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Dilaporkan', 'Investigasi', 'Selesai'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>}

              {activeTab === 'vaksinasi' && <>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Vaksin *</label>
                  <select value={formVak.jenisVaksin} onChange={e => setFormVak(f => ({ ...f, jenisVaksin: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih --</option>
                    {['Hepatitis B', 'COVID-19 (Primer + Booster)', 'COVID-19 (Booster ke-2)', 'Influenza (Tahunan)', 'Tetanus', 'MMR', 'Tifoid'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jumlah Dosis</label><input type="number" min={1} max={5} value={formVak.dosis} onChange={e => setFormVak(f => ({ ...f, dosis: parseInt(e.target.value) }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                    <select value={formVak.status} onChange={e => setFormVak(f => ({ ...f, status: e.target.value as VaksinasiRecord['status'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Lengkap', 'Sebagian', 'Belum'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Vaksin</label><input type="date" value={formVak.tanggalVaksin} onChange={e => setFormVak(f => ({ ...f, tanggalVaksin: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Fasilitas Vaksinasi</label><input value={formVak.fasilitasVaksin || ''} onChange={e => setFormVak(f => ({ ...f, fasilitasVaksin: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </>}

              {activeTab === 'mcu' && <>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal MCU *</label><input type="date" value={formMCU.tanggal} onChange={e => setFormMCU(f => ({ ...f, tanggal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis MCU</label>
                    <select value={formMCU.jenisMCU} onChange={e => setFormMCU(f => ({ ...f, jenisMCU: e.target.value as MCURecord['jenisMCU'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Awal Kerja', 'Berkala', 'Khusus Pajanan', 'Pra-Pensiun'].map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Hasil MCU</label>
                  <select value={formMCU.hasilMCU} onChange={e => setFormMCU(f => ({ ...f, hasilMCU: e.target.value as MCURecord['hasilMCU'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Layak Kerja', 'Layak dengan Syarat', 'Tidak Layak'].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan</label><textarea rows={2} value={formMCU.catatan || ''} onChange={e => setFormMCU(f => ({ ...f, catatan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Rekomendasi Dokter</label><input value={formMCU.rekomendasiDokter || ''} onChange={e => setFormMCU(f => ({ ...f, rekomendasiDokter: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Fasilitas MCU</label><input value={formMCU.fasilitasMCU || ''} onChange={e => setFormMCU(f => ({ ...f, fasilitasMCU: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">MCU Berikutnya</label><input type="date" value={formMCU.tanggalBerikutnya || ''} onChange={e => setFormMCU(f => ({ ...f, tanggalBerikutnya: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              </>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editId ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Insiden Modal */}
      {detailInsiden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailInsiden(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Laporan Insiden K3RS</h2>
              <button onClick={() => setDetailInsiden(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-xl border ${detailInsiden.keparahan === 'Berat' ? 'bg-red-50 border-red-100' : detailInsiden.keparahan === 'Sedang' ? 'bg-orange-50 border-orange-100' : 'bg-yellow-50 border-yellow-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{detailInsiden.jenisInsiden}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${keparahanConfig[detailInsiden.keparahan]}`}>{detailInsiden.keparahan}</span>
                </div>
                <p className="text-sm text-gray-700">{getFullName(detailInsiden.pegawaiId)}</p>
                <p className="text-xs text-gray-500">{fmtDate(detailInsiden.tanggal)} · {detailInsiden.lokasi}</p>
              </div>
              <div><p className="text-xs text-gray-400 mb-1">Deskripsi Kejadian</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detailInsiden.deskripsi}</p></div>
              {detailInsiden.tindakanSegera && <div><p className="text-xs text-gray-400 mb-1">Tindakan Segera</p><p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-100">{detailInsiden.tindakanSegera}</p></div>}
              {detailInsiden.tindakLanjut && <div><p className="text-xs text-gray-400 mb-1">Tindak Lanjut</p><p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">{detailInsiden.tindakLanjut}</p></div>}
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-gray-400">Status Laporan</p><span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1 inline-block ${statusInsidenConfig[detailInsiden.statusLaporan]?.bg} ${statusInsidenConfig[detailInsiden.statusLaporan]?.color}`}>{detailInsiden.statusLaporan}</span></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end"><button onClick={() => setDetailInsiden(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg">Tutup</button></div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Hapus Data?</h3>
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
