import React, { useState, useMemo } from 'react';
import { Heart, Search, Plus, Eye, Edit2, X, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { BPJSRecord, TanggunganBPJS } from '../types';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const statusColor = { 'Aktif': 'bg-green-100 text-green-700', 'Tidak Aktif': 'bg-red-100 text-red-700', 'Belum Terdaftar': 'bg-gray-100 text-gray-500' };

export default function BPJS() {
  const { bpjs, pegawai, addBPJS, updateBPJS, deleteBPJS } = useAppContext();
  const [search, setSearch] = useState('');
  const [detailData, setDetailData] = useState<BPJSRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const emptyForm: Omit<BPJSRecord, 'id'> = { pegawaiId: '', nomorKartuKesehatan: '', kelasBPJSKes: 'II', statusBPJSKes: 'Aktif', nomorBPJSTK: '', statusBPJSTK: 'Aktif', tanggungan: [], iuranKesehatan: 0, iuranKetenagakerjaan: 0, tanggalDaftar: '' };
  const [form, setForm] = useState<Omit<BPJSRecord, 'id'>>(emptyForm);

  const getFullName = (id: string) => { const p = pegawai.find(x => x.id === id); if (!p) return '—'; return `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}`; };
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const filtered = useMemo(() => bpjs.filter(b => !search || getFullName(b.pegawaiId).toLowerCase().includes(search.toLowerCase()) || (b.nomorKartuKesehatan || '').includes(search)), [bpjs, search, pegawai]);

  const aktifKes = bpjs.filter(b => b.statusBPJSKes === 'Aktif').length;
  const aktifTK = bpjs.filter(b => b.statusBPJSTK === 'Aktif').length;
  const totalTanggungan = bpjs.reduce((a, b) => a + b.tanggungan.filter(t => t.statusTanggungan === 'Aktif').length, 0);
  const belumDaftar = pegawai.filter(p => p.statusAktif === 'Aktif' && !bpjs.find(b => b.pegawaiId === p.id)).length;

  const handleSave = () => {
    if (!form.pegawaiId) { toast.error('Harap pilih pegawai'); return; }
    if (editId) { updateBPJS({ ...form, id: editId }); toast.success('Data BPJS diperbarui'); }
    else { addBPJS(form); toast.success('Data BPJS ditambahkan'); }
    setShowModal(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">BPJS Kesehatan & BPJS Ketenagakerjaan</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 24/2011 (BPJS) · PP No. 44/2015 (JKK/JKM) · PP No. 46/2015 (JHT)</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'BPJS Kesehatan Aktif', value: aktifKes, sub: `dari ${bpjs.length} terdaftar`, color: 'text-green-600' },
          { label: 'BPJS Ketenagakerjaan Aktif', value: aktifTK, sub: 'JKK + JKM + JHT + JP', color: 'text-blue-600' },
          { label: 'Total Tanggungan', value: totalTanggungan, sub: 'Istri/suami & anak', color: 'text-purple-600' },
          { label: 'Belum Terdaftar', value: belumDaftar, sub: 'Perlu didaftarkan', color: belumDaftar > 0 ? 'text-red-600' : 'text-gray-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau nomor kartu..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">No. Kartu Kesehatan</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Kelas</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">BPJS Kes.</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">BPJS TK</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tanggungan</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden xl:table-cell">Iuran/Bulan</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? <tr><td colSpan={8} className="py-10 text-center text-gray-400">Tidak ada data</td></tr>
                : filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailData(b)}>
                    <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{getFullName(b.pegawaiId)}</p><p className="text-xs text-gray-400">{pegawai.find(p => p.id === b.pegawaiId)?.unitKerja}</p></td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-700">{b.nomorKartuKesehatan || '—'}</td>
                    <td className="px-4 py-3.5 text-center"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Kelas {b.kelasBPJSKes}</span></td>
                    <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[b.statusBPJSKes]}`}>{b.statusBPJSKes}</span></td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[b.statusBPJSTK]}`}>{b.statusBPJSTK}</span></td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-center"><span className="text-xs text-gray-700">{b.tanggungan.filter(t => t.statusTanggungan === 'Aktif').length} orang</span></td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-right text-xs text-gray-700">Rp {fmt(b.iuranKesehatan + b.iuranKetenagakerjaan)}</td>
                    <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setDetailData(b)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setEditId(b.id); setForm({ pegawaiId: b.pegawaiId, nomorKartuKesehatan: b.nomorKartuKesehatan || '', kelasBPJSKes: b.kelasBPJSKes, statusBPJSKes: b.statusBPJSKes, nomorBPJSTK: b.nomorBPJSTK || '', statusBPJSTK: b.statusBPJSTK, tanggungan: b.tanggungan, iuranKesehatan: b.iuranKesehatan, iuranKetenagakerjaan: b.iuranKetenagakerjaan, tanggalDaftar: b.tanggalDaftar || '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <h2 className="font-semibold text-gray-800">Detail BPJS</h2>
              <button onClick={() => setDetailData(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800">{getFullName(detailData.pegawaiId)}</p>
                <p className="text-xs text-gray-500">{pegawai.find(p => p.id === detailData.pegawaiId)?.jabatan}</p>
                <p className="text-xs text-gray-400 mt-1">Terdaftar sejak: {fmtDate(detailData.tanggalDaftar)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 mb-2">BPJS KESEHATAN</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[detailData.statusBPJSKes]}`}>{detailData.statusBPJSKes}</span>
                  <p className="text-xs text-gray-500 mt-2">Kelas {detailData.kelasBPJSKes}</p>
                  <p className="text-xs font-mono text-gray-700 mt-1">{detailData.nomorKartuKesehatan || '—'}</p>
                  <p className="text-xs text-gray-500 mt-1">Iuran: Rp {fmt(detailData.iuranKesehatan)}/bln</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 mb-2">BPJS KETENAGAKERJAAN</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[detailData.statusBPJSTK]}`}>{detailData.statusBPJSTK}</span>
                  <p className="text-xs font-mono text-gray-700 mt-2">{detailData.nomorBPJSTK || '—'}</p>
                  <p className="text-xs text-gray-500 mt-1">JKK + JKM + JHT + JP</p>
                  <p className="text-xs text-gray-500 mt-1">Iuran: Rp {fmt(detailData.iuranKetenagakerjaan)}/bln</p>
                </div>
              </div>
              {detailData.tanggungan.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3">TANGGUNGAN ({detailData.tanggungan.length})</p>
                  <div className="space-y-2">
                    {detailData.tanggungan.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{t.nama}</p>
                          <p className="text-xs text-gray-400">{t.hubungan} · {fmtDate(t.tanggalLahir)}</p>
                          <p className="text-xs font-mono text-gray-500">{t.nomorKartu || '—'}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.statusTanggungan]}`}>{t.statusTanggungan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-semibold text-blue-700">Total Iuran per Bulan</p>
                <p className="text-xl font-bold text-blue-700 mt-1">Rp {fmt(detailData.iuranKesehatan + detailData.iuranKetenagakerjaan)}</p>
                <p className="text-xs text-blue-500 mt-0.5">Pegawai + Pemberi Kerja</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end"><button onClick={() => setDetailData(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg">Tutup</button></div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit Data BPJS' : 'Tambah Data BPJS'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={form.pegawaiId} onChange={e => setForm(f => ({ ...f, pegawaiId: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <p className="text-xs font-semibold text-gray-500">BPJS KESEHATAN</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor Kartu</label><input value={form.nomorKartuKesehatan || ''} onChange={e => setForm(f => ({ ...f, nomorKartuKesehatan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Kelas</label>
                  <select value={form.kelasBPJSKes} onChange={e => setForm(f => ({ ...f, kelasBPJSKes: e.target.value as BPJSRecord['kelasBPJSKes'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['I', 'II', 'III'].map(k => <option key={k} value={k}>Kelas {k}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.statusBPJSKes} onChange={e => setForm(f => ({ ...f, statusBPJSKes: e.target.value as BPJSRecord['statusBPJSKes'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Aktif', 'Tidak Aktif', 'Belum Terdaftar'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Iuran Kes. (Rp/bln)</label><input type="number" value={form.iuranKesehatan} onChange={e => setForm(f => ({ ...f, iuranKesehatan: parseInt(e.target.value) || 0 }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <p className="text-xs font-semibold text-gray-500">BPJS KETENAGAKERJAAN</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor BPJS TK</label><input value={form.nomorBPJSTK || ''} onChange={e => setForm(f => ({ ...f, nomorBPJSTK: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.statusBPJSTK} onChange={e => setForm(f => ({ ...f, statusBPJSTK: e.target.value as BPJSRecord['statusBPJSTK'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Aktif', 'Tidak Aktif', 'Belum Terdaftar'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tgl Pendaftaran</label><input type="date" value={form.tanggalDaftar || ''} onChange={e => setForm(f => ({ ...f, tanggalDaftar: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editId ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}