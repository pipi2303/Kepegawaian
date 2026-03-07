import React, { useState, useMemo } from 'react';
import { Award, Search, Plus, Edit2, Trash2, X, Star, Eye } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { PenghargaanRecord, JenisPenghargaan } from '../types';
import { toast } from 'sonner';

const tingkatConfig: Record<string, string> = {
  'Nasional': 'bg-red-100 text-red-700',
  'Provinsi': 'bg-orange-100 text-orange-700',
  'Kota/Kabupaten': 'bg-yellow-100 text-yellow-700',
  'Instansi': 'bg-blue-100 text-blue-700',
};

const jenisList: JenisPenghargaan[] = [
  'Satyalancana Karya Satya 10 Tahun', 'Satyalancana Karya Satya 20 Tahun', 'Satyalancana Karya Satya 30 Tahun',
  'ASN Teladan Tingkat Nasional', 'ASN Teladan Tingkat Provinsi', 'Nakes Teladan RS',
  'Pegawai Inovatif', 'Penghargaan Direktur', 'Penghargaan Gubernur', 'Penghargaan Presiden', 'Penghargaan Lainnya',
];

export default function Penghargaan() {
  const { penghargaan, pegawai, addPenghargaan, updatePenghargaan, deletePenghargaan } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<PenghargaanRecord | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const empty: Omit<PenghargaanRecord, 'id'> = { pegawaiId: '', jenisPenghargaan: 'Satyalancana Karya Satya 10 Tahun', tanggalPemberian: '', nomorSK: '', instansiPemberi: '', tingkat: 'Nasional', keterangan: '' };
  const [form, setForm] = useState<Omit<PenghargaanRecord, 'id'>>(empty);

  const getFullName = (id: string) => { const p = pegawai.find(x => x.id === id); if (!p) return '—'; return `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`; };
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  // Auto-detect masa kerja for Satyalancana eligibility
  const getEligibleSatyalancana = () => {
    return pegawai.filter(p => {
      const tgl = new Date(p.tanggalMasuk);
      const masaKerja = Math.floor((Date.now() - tgl.getTime()) / (365.25 * 24 * 3600 * 1000));
      const sudahDapat = penghargaan.filter(ph => ph.pegawaiId === p.id && ph.jenisPenghargaan.startsWith('Satyalancana'));
      const tertinggi = sudahDapat.reduce((max, ph) => {
        const thn = parseInt(ph.jenisPenghargaan.match(/\d+/)?.[0] || '0');
        return Math.max(max, thn);
      }, 0);
      return (masaKerja >= 10 && tertinggi < 10) || (masaKerja >= 20 && tertinggi < 20) || (masaKerja >= 30 && tertinggi < 30);
    });
  };

  const eligible = useMemo(getEligibleSatyalancana, [pegawai, penghargaan]);

  const filtered = useMemo(() => penghargaan.filter(p => {
    const nm = getFullName(p.pegawaiId).toLowerCase();
    const ok = !search || nm.includes(search.toLowerCase()) || p.jenisPenghargaan.toLowerCase().includes(search.toLowerCase());
    const okT = !filterTingkat || p.tingkat === filterTingkat;
    return ok && okT;
  }), [penghargaan, search, filterTingkat, pegawai]);

  const handleSave = () => {
    if (!form.pegawaiId || !form.tanggalPemberian) { toast.error('Harap isi field wajib'); return; }
    if (editId) { updatePenghargaan({ ...form, id: editId }); toast.success('Data penghargaan diperbarui'); }
    else { addPenghargaan(form); toast.success('Penghargaan berhasil ditambahkan'); }
    setShowModal(false);
  };

  const openDetail = (p: PenghargaanRecord) => { setDetailData(p); setShowDetailModal(true); };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Penghargaan & Tanda Kehormatan</h1>
          <p className="text-sm text-gray-500 mt-0.5">PP No. 35/2010 · UU No. 20/2009 (Gelar, Tanda Jasa & Kehormatan)</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(empty); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Penghargaan', value: penghargaan.length, sub: 'Semua jenis', color: 'text-yellow-600' },
          { label: 'Satyalancana', value: penghargaan.filter(p => p.jenisPenghargaan.startsWith('Satyal')).length, sub: 'Karya Satya', color: 'text-red-600' },
          { label: 'Teladan & Inovatif', value: penghargaan.filter(p => p.jenisPenghargaan.includes('Teladan') || p.jenisPenghargaan.includes('Inovatif')).length, sub: 'Prestasi terbaik', color: 'text-blue-600' },
          { label: 'Eligible Satyalancana', value: eligible.length, sub: 'Segera diusulkan', color: eligible.length > 0 ? 'text-orange-600' : 'text-gray-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Eligible Alert */}
      {eligible.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-800 mb-2">⭐ Pegawai Eligible Satyalancana Karya Satya</p>
          <div className="flex flex-wrap gap-2">
            {eligible.map(p => {
              const masaKerja = Math.floor((Date.now() - new Date(p.tanggalMasuk).getTime()) / (365.25 * 24 * 3600 * 1000));
              const thn = masaKerja >= 30 ? 30 : masaKerja >= 20 ? 20 : 10;
              return <span key={p.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{p.nama} ({thn} Thn)</span>;
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau jenis penghargaan..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterTingkat} onChange={e => setFilterTingkat(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Tingkat</option>
            {['Nasional', 'Provinsi', 'Kota/Kabupaten', 'Instansi'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis Penghargaan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Instansi Pemberi</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tanggal</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Tingkat</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada data penghargaan</td></tr>
                : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/60 cursor-pointer transition-colors" onClick={() => openDetail(p)}>
                    <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{getFullName(p.pegawaiId)}</p><p className="text-xs text-gray-400">{pegawai.find(x => x.id === p.pegawaiId)?.jabatan}</p></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        <span className="text-sm text-gray-800">{p.jenisPenghargaan}</span>
                      </div>
                      {p.nomorSK && <p className="text-xs font-mono text-gray-400 mt-0.5">{p.nomorSK}</p>}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{p.instansiPemberi}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{fmtDate(p.tanggalPemberian)}</td>
                    <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tingkatConfig[p.tingkat]}`}>{p.tingkat}</span></td>
                    <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDetail(p)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Detail"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setEditId(p.id); setForm({ pegawaiId: p.pegawaiId, jenisPenghargaan: p.jenisPenghargaan, tanggalPemberian: p.tanggalPemberian, nomorSK: p.nomorSK || '', instansiPemberi: p.instansiPemberi, tingkat: p.tingkat, keterangan: p.keterangan || '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowDeleteConfirm(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && detailData && (() => {
        const pg = pegawai.find(x => x.id === detailData.pegawaiId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-600" />
                  </div>
                  <h2 className="font-semibold text-gray-800">Detail Penghargaan</h2>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Pegawai */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {pg?.nama.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{getFullName(detailData.pegawaiId)}</p>
                    <p className="text-xs text-gray-500">{pg?.jabatan} · {pg?.unitKerja}</p>
                    <p className="text-xs text-gray-400">NIP {pg?.nip}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Jenis Penghargaan', value: detailData.jenisPenghargaan },
                    { label: 'Tingkat', value: <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tingkatConfig[detailData.tingkat]}`}>{detailData.tingkat}</span> },
                    { label: 'Instansi Pemberi', value: detailData.instansiPemberi || '—' },
                    { label: 'Tanggal Pemberian', value: fmtDate(detailData.tanggalPemberian) },
                    { label: 'Nomor SK', value: detailData.nomorSK || '—' },
                    { label: 'Keterangan', value: detailData.keterangan || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-500 flex-shrink-0 w-40">{row.label}</span>
                      <span className="text-xs font-medium text-gray-800 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setShowDetailModal(false); setEditId(detailData.id); setForm({ pegawaiId: detailData.pegawaiId, jenisPenghargaan: detailData.jenisPenghargaan, tanggalPemberian: detailData.tanggalPemberian, nomorSK: detailData.nomorSK || '', instansiPemberi: detailData.instansiPemberi, tingkat: detailData.tingkat, keterangan: detailData.keterangan || '' }); setShowModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit Penghargaan' : 'Tambah Penghargaan'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={form.pegawaiId} onChange={e => setForm(f => ({ ...f, pegawaiId: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Penghargaan *</label>
                <select value={form.jenisPenghargaan} onChange={e => setForm(f => ({ ...f, jenisPenghargaan: e.target.value as JenisPenghargaan }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {jenisList.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Pemberian *</label><input type="date" value={form.tanggalPemberian} onChange={e => setForm(f => ({ ...f, tanggalPemberian: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tingkat</label>
                  <select value={form.tingkat} onChange={e => setForm(f => ({ ...f, tingkat: e.target.value as PenghargaanRecord['tingkat'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Nasional', 'Provinsi', 'Kota/Kabupaten', 'Instansi'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Instansi Pemberi</label><input value={form.instansiPemberi} onChange={e => setForm(f => ({ ...f, instansiPemberi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK</label><input value={form.nomorSK || ''} onChange={e => setForm(f => ({ ...f, nomorSK: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Keterangan</label><textarea rows={2} value={form.keterangan || ''} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
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
            <h3 className="font-semibold mb-2">Hapus Penghargaan?</h3>
            <p className="text-sm text-gray-500 mb-4">Data ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={() => { deletePenghargaan(showDeleteConfirm); toast.success('Data dihapus'); setShowDeleteConfirm(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}