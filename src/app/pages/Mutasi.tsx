import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Search, Plus, Eye, Edit2, Trash2, X, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { MutasiRecord } from '../types';
import { toast } from 'sonner';

const statusConfig: Record<string, { bg: string; color: string }> = {
  'Usulan': { bg: 'bg-gray-100', color: 'text-gray-600' },
  'Disetujui': { bg: 'bg-blue-50', color: 'text-blue-700' },
  'Berlaku': { bg: 'bg-green-50', color: 'text-green-700' },
  'Ditolak': { bg: 'bg-red-50', color: 'text-red-700' },
};
const jenisColor: Record<string, string> = {
  'Mutasi Internal': 'bg-blue-100 text-blue-700',
  'Mutasi Eksternal': 'bg-purple-100 text-purple-700',
  'Rotasi': 'bg-teal-100 text-teal-700',
  'Promosi Jabatan': 'bg-green-100 text-green-700',
  'Promosi Fungsional': 'bg-emerald-100 text-emerald-700',
  'Demosi': 'bg-red-100 text-red-700',
};

export default function Mutasi() {
  const { mutasi, pegawai, addMutasi, updateMutasi, deleteMutasi } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<MutasiRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const empty: Omit<MutasiRecord, 'id'> = { pegawaiId: '', jenisMutasi: 'Mutasi Internal', unitKerjaAsal: '', jabatanAsal: '', unitKerjaTujuan: '', jabatanTujuan: '', golonganAsal: '', golonganTujuan: '', tanggalUsulan: '', tanggalBerlaku: '', nomorSK: '', status: 'Usulan', alasan: '', catatanPejabat: '' };
  const [form, setForm] = useState<Omit<MutasiRecord, 'id'>>(empty);

  const getFullName = (id: string) => { const p = pegawai.find(x => x.id === id); if (!p) return '—'; return `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`; };
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const filtered = useMemo(() => mutasi.filter(m => {
    const nm = getFullName(m.pegawaiId).toLowerCase();
    const ok = !search || nm.includes(search.toLowerCase());
    const okJ = !filterJenis || m.jenisMutasi === filterJenis;
    const okS = !filterStatus || m.status === filterStatus;
    return ok && okJ && okS;
  }), [mutasi, search, filterJenis, filterStatus, pegawai]);

  const handleSave = () => {
    if (!form.pegawaiId || !form.tanggalUsulan) { toast.error('Harap isi field wajib'); return; }
    if (editId) { updateMutasi({ ...form, id: editId }); toast.success('Data mutasi diperbarui'); }
    else { addMutasi(form); toast.success('Usulan mutasi berhasil disimpan'); }
    setShowModal(false);
  };

  const promosiCount = mutasi.filter(m => m.jenisMutasi.startsWith('Promosi')).length;
  const usulanCount = mutasi.filter(m => m.status === 'Usulan').length;
  const berlakuCount = mutasi.filter(m => m.status === 'Berlaku').length;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mutasi, Rotasi & Promosi</h1>
          <p className="text-sm text-gray-500 mt-0.5">PP No. 11/2017 Pasal 72–81 · PermenPAN-RB No. 13/2014 · Pola Karir ASN</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(empty); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Usulan Baru
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Mutasi/Promosi', value: mutasi.length, sub: 'Semua jenis', color: 'text-blue-600' },
          { label: 'Promosi Jabatan/Fungsional', value: promosiCount, sub: 'Kenaikan jenjang', color: 'text-green-600' },
          { label: 'Menunggu Persetujuan', value: usulanCount, sub: 'Perlu tindakan', color: usulanCount > 0 ? 'text-yellow-600' : 'text-gray-500' },
          { label: 'Telah Berlaku', value: berlakuCount, sub: 'SK diterbitkan', color: 'text-teal-600' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama pegawai..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Jenis</option>
            {['Mutasi Internal', 'Mutasi Eksternal', 'Rotasi', 'Promosi Jabatan', 'Promosi Fungsional', 'Demosi'].map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Status</option>
            {['Usulan', 'Disetujui', 'Berlaku', 'Ditolak'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Asal → Tujuan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tgl Usulan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden xl:table-cell">No. SK</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data mutasi</td></tr>
                : filtered.map(m => {
                  const sc = statusConfig[m.status];
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailData(m)}>
                      <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{getFullName(m.pegawaiId)}</p><p className="text-xs text-gray-400">{pegawai.find(p => p.id === m.pegawaiId)?.unitKerja}</p></td>
                      <td className="px-4 py-3.5"><span className={`text-xs px-2 py-0.5 rounded font-medium ${jenisColor[m.jenisMutasi]}`}>{m.jenisMutasi}</span></td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs">
                          <div className="max-w-[100px]"><p className="text-gray-600 truncate">{m.jabatanAsal}</p><p className="text-gray-400 truncate">{m.unitKerjaAsal}</p></div>
                          <ArrowRightLeft className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <div className="max-w-[100px]"><p className="text-gray-800 truncate font-medium">{m.jabatanTujuan}</p><p className="text-gray-400 truncate">{m.unitKerjaTujuan}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{fmtDate(m.tanggalUsulan)}</td>
                      <td className="px-4 py-3.5 hidden xl:table-cell text-xs font-mono text-gray-500">{m.nomorSK || '—'}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>{m.status}</span></td>
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailData(m)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setEditId(m.id); setForm({ pegawaiId: m.pegawaiId, jenisMutasi: m.jenisMutasi, unitKerjaAsal: m.unitKerjaAsal, jabatanAsal: m.jabatanAsal, unitKerjaTujuan: m.unitKerjaTujuan, jabatanTujuan: m.jabatanTujuan, golonganAsal: m.golonganAsal || '', golonganTujuan: m.golonganTujuan || '', tanggalUsulan: m.tanggalUsulan, tanggalBerlaku: m.tanggalBerlaku || '', nomorSK: m.nomorSK || '', status: m.status, alasan: m.alasan || '', catatanPejabat: m.catatanPejabat || '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setShowDeleteConfirm(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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
              <h2 className="font-semibold text-gray-800">Detail {detailData.jenisMutasi}</h2>
              <button onClick={() => setDetailData(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div><p className="font-semibold text-gray-800">{getFullName(detailData.pegawaiId)}</p><p className="text-xs text-gray-400">{pegawai.find(p => p.id === detailData.pegawaiId)?.nip}</p></div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[detailData.status].bg} ${statusConfig[detailData.status].color}`}>{detailData.status}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-400 mb-1">Jabatan Asal</p><p className="text-sm font-medium text-gray-700">{detailData.jabatanAsal}</p><p className="text-xs text-gray-400">{detailData.unitKerjaAsal}</p>{detailData.golonganAsal && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">{detailData.golonganAsal}</span>}</div>
                  <div><p className="text-xs text-gray-400 mb-1">Jabatan Tujuan</p><p className="text-sm font-medium text-gray-800">{detailData.jabatanTujuan}</p><p className="text-xs text-gray-400">{detailData.unitKerjaTujuan}</p>{detailData.golonganTujuan && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mt-1 inline-block">{detailData.golonganTujuan}</span>}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Tgl Usulan</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggalUsulan)}</p></div>
                {detailData.tanggalBerlaku && <div><p className="text-xs text-gray-400">Tgl Berlaku</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggalBerlaku)}</p></div>}
                {detailData.nomorSK && <div className="col-span-2"><p className="text-xs text-gray-400">Nomor SK</p><p className="text-sm font-mono text-gray-800">{detailData.nomorSK}</p></div>}
              </div>
              {detailData.alasan && <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-400 mb-1">Alasan/Dasar Mutasi</p><p className="text-sm text-blue-800">{detailData.alasan}</p></div>}
              {detailData.catatanPejabat && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400 mb-1">Catatan Pejabat</p><p className="text-sm text-gray-700">{detailData.catatanPejabat}</p></div>}
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
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit' : 'Tambah'} Usulan Mutasi/Promosi</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={form.pegawaiId} onChange={e => { const p = pegawai.find(x => x.id === e.target.value); setForm(f => ({ ...f, pegawaiId: e.target.value, jabatanAsal: p?.jabatan || '', unitKerjaAsal: p?.unitKerja || '', golonganAsal: p?.golongan || '' })); }} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Mutasi</label>
                  <select value={form.jenisMutasi} onChange={e => setForm(f => ({ ...f, jenisMutasi: e.target.value as MutasiRecord['jenisMutasi'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Mutasi Internal', 'Mutasi Eksternal', 'Rotasi', 'Promosi Jabatan', 'Promosi Fungsional', 'Demosi'].map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as MutasiRecord['status'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Usulan', 'Disetujui', 'Berlaku', 'Ditolak'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan Asal</label><input value={form.jabatanAsal} onChange={e => setForm(f => ({ ...f, jabatanAsal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan Tujuan</label><input value={form.jabatanTujuan} onChange={e => setForm(f => ({ ...f, jabatanTujuan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Unit Kerja Asal</label><input value={form.unitKerjaAsal} onChange={e => setForm(f => ({ ...f, unitKerjaAsal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Unit Kerja Tujuan</label><input value={form.unitKerjaTujuan} onChange={e => setForm(f => ({ ...f, unitKerjaTujuan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tgl Usulan *</label><input type="date" value={form.tanggalUsulan} onChange={e => setForm(f => ({ ...f, tanggalUsulan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tgl Berlaku</label><input type="date" value={form.tanggalBerlaku || ''} onChange={e => setForm(f => ({ ...f, tanggalBerlaku: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK</label><input value={form.nomorSK || ''} onChange={e => setForm(f => ({ ...f, nomorSK: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Alasan/Dasar</label><textarea rows={2} value={form.alasan || ''} onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan Pejabat</label><textarea rows={2} value={form.catatanPejabat || ''} onChange={e => setForm(f => ({ ...f, catatanPejabat: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
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
            <h3 className="font-semibold mb-2">Hapus Data Mutasi?</h3>
            <p className="text-sm text-gray-500 mb-4">Data ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={() => { deleteMutasi(showDeleteConfirm); toast.success('Data dihapus'); setShowDeleteConfirm(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
