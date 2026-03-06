import React, { useState, useMemo } from 'react';
import { Users2, Search, Plus, Edit2, Trash2, X, Calendar, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { AnggotaKomite, KegiatanKomite } from '../types';
import { toast } from 'sonner';

type TabType = 'anggota' | 'kegiatan';

const komiteList = ['Komite Medik', 'Komite Keperawatan', 'Komite Nakes Lain', 'Komite K3RS', 'Komite Etik & Hukum'];
const komiteColor: Record<string, string> = {
  'Komite Medik': 'bg-blue-100 text-blue-700',
  'Komite Keperawatan': 'bg-green-100 text-green-700',
  'Komite Nakes Lain': 'bg-teal-100 text-teal-700',
  'Komite K3RS': 'bg-orange-100 text-orange-700',
  'Komite Etik & Hukum': 'bg-purple-100 text-purple-700',
};
const statusKegiatanConfig: Record<string, { bg: string; color: string }> = {
  'Dijadwalkan': { bg: 'bg-blue-50', color: 'text-blue-700' },
  'Berlangsung': { bg: 'bg-yellow-50', color: 'text-yellow-700' },
  'Selesai': { bg: 'bg-green-50', color: 'text-green-700' },
};

export default function KomiteRS() {
  const { anggotaKomite, kegiatanKomite, pegawai, addAnggotaKomite, updateAnggotaKomite, deleteAnggotaKomite, addKegiatanKomite, updateKegiatanKomite, deleteKegiatanKomite } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('anggota');
  const [search, setSearch] = useState('');
  const [filterKomite, setFilterKomite] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const emptyAnggota: Omit<AnggotaKomite, 'id'> = { pegawaiId: '', namaKomite: 'Komite Medik', subKomite: '', jabatanKomite: '', tanggalMulai: '', tanggalSelesai: '', statusKomite: 'Aktif', nomorSK: '' };
  const emptyKegiatan: Omit<KegiatanKomite, 'id'> = { namaKomite: 'Komite Medik', tanggal: '', jenisKegiatan: 'Rapat Rutin', agenda: '', peserta: [], status: 'Dijadwalkan', hasilKeputusan: '' };
  const [formAnggota, setFormAnggota] = useState<Omit<AnggotaKomite, 'id'>>(emptyAnggota);
  const [formKegiatan, setFormKegiatan] = useState<Omit<KegiatanKomite, 'id'>>(emptyKegiatan);

  const getFullName = (id: string) => { const p = pegawai.find(x => x.id === id); return p ? `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}` : '—'; };
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const filteredAnggota = useMemo(() => anggotaKomite.filter(a => {
    const ok = !search || getFullName(a.pegawaiId).toLowerCase().includes(search.toLowerCase()) || a.jabatanKomite.toLowerCase().includes(search.toLowerCase());
    const okK = !filterKomite || a.namaKomite === filterKomite;
    return ok && okK;
  }), [anggotaKomite, search, filterKomite, pegawai]);

  const filteredKegiatan = useMemo(() => kegiatanKomite.filter(k => {
    const ok = !search || k.namaKomite.toLowerCase().includes(search.toLowerCase()) || k.agenda.toLowerCase().includes(search.toLowerCase());
    const okK = !filterKomite || k.namaKomite === filterKomite;
    return ok && okK;
  }), [kegiatanKomite, search, filterKomite]);

  const handleSave = () => {
    if (activeTab === 'anggota') {
      if (!formAnggota.pegawaiId || !formAnggota.tanggalMulai) { toast.error('Harap isi field wajib'); return; }
      if (editId) { updateAnggotaKomite({ ...formAnggota, id: editId }); toast.success('Data anggota diperbarui'); }
      else { addAnggotaKomite(formAnggota); toast.success('Anggota komite ditambahkan'); }
    } else {
      if (!formKegiatan.tanggal || !formKegiatan.agenda) { toast.error('Harap isi field wajib'); return; }
      if (editId) { updateKegiatanKomite({ ...formKegiatan, id: editId }); toast.success('Kegiatan diperbarui'); }
      else { addKegiatanKomite(formKegiatan); toast.success('Kegiatan komite dijadwalkan'); }
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (activeTab === 'anggota') deleteAnggotaKomite(id);
    else deleteKegiatanKomite(id);
    toast.success('Data dihapus'); setShowDeleteConfirm(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Komite Rumah Sakit</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 44/2009 Pasal 33–37 · Permenkes No. 755/2011 (Komite Medik) · Hospital Bylaws</p>
        </div>
        <button onClick={() => { setEditId(null); if (activeTab === 'anggota') setFormAnggota(emptyAnggota); else setFormKegiatan(emptyKegiatan); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Komite Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {komiteList.map(k => {
          const aktif = anggotaKomite.filter(a => a.namaKomite === k && a.statusKomite === 'Aktif').length;
          const keg = kegiatanKomite.filter(kg => kg.namaKomite === k).length;
          return (
            <div key={k} className="bg-white rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all" onClick={() => { setFilterKomite(filterKomite === k ? '' : k); }}>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${komiteColor[k]}`}>{k.replace('Komite ', '')}</span>
              <p className="text-lg font-bold text-gray-800 mt-1.5">{aktif}<span className="text-xs text-gray-400 font-normal ml-1">anggota</span></p>
              <p className="text-xs text-gray-400">{keg} kegiatan</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[{ key: 'anggota' as TabType, label: 'Keanggotaan Komite', count: anggotaKomite.length }, { key: 'kegiatan' as TabType, label: 'Kegiatan & Rapat', count: kegiatanKomite.length }].map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); }} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label} <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterKomite} onChange={e => setFilterKomite(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Komite</option>
            {komiteList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Anggota Table */}
        {activeTab === 'anggota' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Anggota</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Komite</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Sub Komite</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jabatan dalam Komite</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Masa Jabatan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAnggota.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data</td></tr>
                  : filteredAnggota.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{getFullName(a.pegawaiId)}</p><p className="text-xs text-gray-400">{pegawai.find(p => p.id === a.pegawaiId)?.jabatan}</p></td>
                      <td className="px-4 py-3.5"><span className={`text-xs px-2 py-0.5 rounded font-medium ${komiteColor[a.namaKomite]}`}>{a.namaKomite}</span></td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{a.subKomite || '—'}</td>
                      <td className="px-4 py-3.5 text-xs font-medium text-gray-700">{a.jabatanKomite}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{fmtDate(a.tanggalMulai)} — {a.tanggalSelesai ? fmtDate(a.tanggalSelesai) : 'Sekarang'}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${a.statusKomite === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.statusKomite}</span></td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditId(a.id); setFormAnggota({ pegawaiId: a.pegawaiId, namaKomite: a.namaKomite, subKomite: a.subKomite || '', jabatanKomite: a.jabatanKomite, tanggalMulai: a.tanggalMulai, tanggalSelesai: a.tanggalSelesai || '', statusKomite: a.statusKomite, nomorSK: a.nomorSK || '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setShowDeleteConfirm(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Kegiatan Table */}
        {activeTab === 'kegiatan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Komite</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Agenda</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Hasil Keputusan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredKegiatan.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada kegiatan</td></tr>
                  : filteredKegiatan.map(k => {
                    const sc = statusKegiatanConfig[k.status];
                    return (
                      <tr key={k.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3.5"><span className={`text-xs px-2 py-0.5 rounded font-medium ${komiteColor[k.namaKomite]}`}>{k.namaKomite}</span></td>
                        <td className="px-4 py-3.5 text-xs text-gray-700">{fmtDate(k.tanggal)}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">{k.jenisKegiatan}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600 max-w-xs truncate">{k.agenda}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500 max-w-xs truncate">{k.hasilKeputusan || '—'}</td>
                        <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>{k.status}</span></td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditId(k.id); setFormKegiatan({ namaKomite: k.namaKomite, tanggal: k.tanggal, jenisKegiatan: k.jenisKegiatan, agenda: k.agenda, peserta: k.peserta, status: k.status, hasilKeputusan: k.hasilKeputusan || '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setShowDeleteConfirm(k.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit' : 'Tambah'} {activeTab === 'anggota' ? 'Anggota Komite' : 'Kegiatan Komite'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {activeTab === 'anggota' ? <>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                  <select value={formAnggota.pegawaiId} onChange={e => setFormAnggota(f => ({ ...f, pegawaiId: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih Pegawai --</option>
                    {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Komite</label>
                    <select value={formAnggota.namaKomite} onChange={e => setFormAnggota(f => ({ ...f, namaKomite: e.target.value as AnggotaKomite['namaKomite'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {komiteList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                    <select value={formAnggota.statusKomite} onChange={e => setFormAnggota(f => ({ ...f, statusKomite: e.target.value as 'Aktif' | 'Tidak Aktif' }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Aktif">Aktif</option><option value="Tidak Aktif">Tidak Aktif</option>
                    </select>
                  </div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Sub Komite</label><input value={formAnggota.subKomite || ''} onChange={e => setFormAnggota(f => ({ ...f, subKomite: e.target.value }))} placeholder="Subkomite Kredensial, dll." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan dalam Komite *</label><input value={formAnggota.jabatanKomite} onChange={e => setFormAnggota(f => ({ ...f, jabatanKomite: e.target.value }))} placeholder="Ketua, Sekretaris, Anggota..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Mulai *</label><input type="date" value={formAnggota.tanggalMulai} onChange={e => setFormAnggota(f => ({ ...f, tanggalMulai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Selesai</label><input type="date" value={formAnggota.tanggalSelesai || ''} onChange={e => setFormAnggota(f => ({ ...f, tanggalSelesai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK</label><input value={formAnggota.nomorSK || ''} onChange={e => setFormAnggota(f => ({ ...f, nomorSK: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </> : <>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Komite</label>
                    <select value={formKegiatan.namaKomite} onChange={e => setFormKegiatan(f => ({ ...f, namaKomite: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {komiteList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal *</label><input type="date" value={formKegiatan.tanggal} onChange={e => setFormKegiatan(f => ({ ...f, tanggal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Kegiatan</label>
                  <select value={formKegiatan.jenisKegiatan} onChange={e => setFormKegiatan(f => ({ ...f, jenisKegiatan: e.target.value as KegiatanKomite['jenisKegiatan'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Rapat Rutin', 'Sidang Kredensial', 'Sidang Disiplin', 'Evaluasi Kinerja', 'Rapat Luar Biasa'].map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Agenda *</label><textarea rows={2} value={formKegiatan.agenda} onChange={e => setFormKegiatan(f => ({ ...f, agenda: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={formKegiatan.status} onChange={e => setFormKegiatan(f => ({ ...f, status: e.target.value as KegiatanKomite['status'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Dijadwalkan', 'Berlangsung', 'Selesai'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Hasil Keputusan</label><textarea rows={2} value={formKegiatan.hasilKeputusan || ''} onChange={e => setFormKegiatan(f => ({ ...f, hasilKeputusan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
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
