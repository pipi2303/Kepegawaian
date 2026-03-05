import React, { useState, useMemo } from 'react';
import { CalendarDays, Plus, Check, X, Clock, Info, Search, Download, Eye, Edit2, Trash2, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CutiRecord } from '../types';
import { JENIS_CUTI } from '../data/constants';
import { toast } from 'sonner';

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  'Pending': { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Menunggu Persetujuan' },
  'Disetujui': { color: 'text-green-700', bg: 'bg-green-100', label: 'Disetujui' },
  'Ditolak': { color: 'text-red-700', bg: 'bg-red-100', label: 'Ditolak' },
};

const EMPTY_FORM = {
  pegawaiId: '', jenisCuti: '', tanggalMulai: '', tanggalSelesai: '', alasan: '',
};

const hitungHariKerja = (mulai: string, selesai: string) => {
  if (!mulai || !selesai) return 0;
  const start = new Date(mulai), end = new Date(selesai);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

export default function Cuti() {
  const { cuti, pegawai, currentUser, addCuti, updateCuti, deleteCuti, approveCuti, rejectCuti } = useAppContext();
  const [activeTab, setActiveTab] = useState<'pengajuan' | 'riwayat' | 'saldo'>('pengajuan');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<{ id: string; level: number } | null>(null);
  const [rejectCatatan, setRejectCatatan] = useState('');
  const [selectedCuti, setSelectedCuti] = useState<CutiRecord | null>(null);
  const [editData, setEditData] = useState<CutiRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const getPegawai = (id: string) => pegawai.find(p => p.id === id);
  const getFullName = (id: string) => {
    const p = getPegawai(id);
    if (!p) return '-';
    return `${p.gelarDepan || ''} ${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`.trim();
  };

  const pendingCuti = cuti.filter(c => c.status === 'Pending');
  const allCuti = useMemo(() => cuti.filter(c => {
    const matchStatus = !filterStatus || c.status === filterStatus;
    const matchJenis = !filterJenis || c.jenisCuti === filterJenis;
    const matchSearch = !search || getFullName(c.pegawaiId).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchJenis && matchSearch;
  }), [cuti, filterStatus, filterJenis, search, pegawai]);

  const canApproveLevel1 = currentUser?.role === 'kepala_unit' || currentUser?.role === 'admin';
  const canApproveLevel2 = currentUser?.role === 'direktur' || currentUser?.role === 'admin';

  const handleApprove = (id: string, level: number) => {
    approveCuti(id, level, currentUser?.nama || 'Pejabat');
    toast.success(`Cuti berhasil disetujui (Level ${level})`);
  };

  const handleReject = () => {
    if (!showRejectModal) return;
    rejectCuti(showRejectModal.id, showRejectModal.level, currentUser?.nama || 'Pejabat', rejectCatatan);
    toast.error('Cuti ditolak');
    setShowRejectModal(null);
    setRejectCatatan('');
  };

  const openDetail = (c: CutiRecord) => { setSelectedCuti(c); setShowDetailModal(true); };

  const openEdit = (c: CutiRecord) => {
    setEditData(c);
    setForm({ pegawaiId: c.pegawaiId, jenisCuti: c.jenisCuti, tanggalMulai: c.tanggalMulai, tanggalSelesai: c.tanggalSelesai, alasan: c.alasan });
    setShowModal(true);
  };

  const openAdd = () => { setEditData(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };

  const handleSave = () => {
    if (!form.pegawaiId || !form.jenisCuti || !form.tanggalMulai || !form.tanggalSelesai || !form.alasan) {
      toast.error('Harap isi semua field yang wajib diisi');
      return;
    }
    const jumlahHari = hitungHariKerja(form.tanggalMulai, form.tanggalSelesai);
    if (editData) {
      updateCuti({ ...editData, ...form, jumlahHari });
      toast.success('Data cuti berhasil diperbarui');
    } else {
      addCuti({ ...form, jumlahHari, status: 'Pending', tanggalPengajuan: new Date().toISOString().split('T')[0] });
      toast.success('Pengajuan cuti berhasil dikirim');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteCuti(id);
    setShowDeleteConfirm(null);
    toast.success('Data cuti berhasil dihapus');
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">Manajemen Cuti</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pengelolaan cuti ASN berdasarkan PP No. 11 Tahun 2017</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Ajukan Cuti
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Pending', value: cuti.filter(c => c.status === 'Pending').length, c: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
          { label: 'Disetujui', value: cuti.filter(c => c.status === 'Disetujui').length, c: 'text-green-600 bg-green-50 border-green-100' },
          { label: 'Ditolak', value: cuti.filter(c => c.status === 'Ditolak').length, c: 'text-red-600 bg-red-50 border-red-100' },
          { label: 'Total Pengajuan', value: cuti.length, c: 'text-blue-600 bg-blue-50 border-blue-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.c.split(' ').slice(1).join(' ')}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.c.split(' ')[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'pengajuan', label: `Persetujuan Pending (${pendingCuti.length})` },
            { id: 'riwayat', label: 'Semua Riwayat' },
            { id: 'saldo', label: 'Saldo Cuti' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3.5 text-sm transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab: Pengajuan Pending ─── */}
        {activeTab === 'pengajuan' && (
          <div className="p-5">
            {pendingCuti.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Tidak ada pengajuan cuti yang menunggu persetujuan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCuti.map(c => {
                  const p = getPegawai(c.pegawaiId);
                  const levels = c.approvalLevels || [];
                  return (
                    <div key={c.id} className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer" onClick={() => openDetail(c)}>
                      <div className="flex items-start gap-4 p-5">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
                          {p?.nama.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-800">{getFullName(c.pegawaiId)}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{p?.jabatan} · {p?.unitKerja}</p>
                            </div>
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium whitespace-nowrap self-start">
                              Menunggu Persetujuan
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><p className="text-xs text-gray-400">Jenis Cuti</p><p className="text-sm font-medium text-gray-700 mt-0.5">{c.jenisCuti}</p></div>
                            <div><p className="text-xs text-gray-400">Tanggal</p><p className="text-sm font-medium text-gray-700 mt-0.5">{fmtDate(c.tanggalMulai)} — {fmtDate(c.tanggalSelesai)}</p></div>
                            <div><p className="text-xs text-gray-400">Jumlah Hari</p><p className="text-sm font-semibold text-blue-600 mt-0.5">{c.jumlahHari} hari kerja</p></div>
                            <div><p className="text-xs text-gray-400">Diajukan</p><p className="text-sm text-gray-700 mt-0.5">{fmtDate(c.tanggalPengajuan)}</p></div>
                          </div>

                          {/* Approval Timeline */}
                          <div className="mt-4 flex items-center gap-2">
                            {levels.map((lvl, idx) => {
                              const isActive = lvl.level === c.currentLevel;
                              return (
                                <div key={lvl.level} className="contents">
                                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
                                    lvl.status === 'Disetujui' ? 'bg-green-100 text-green-700' :
                                    lvl.status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                                    isActive ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {lvl.status === 'Disetujui' ? <CheckCircle className="w-3 h-3" /> :
                                     lvl.status === 'Ditolak' ? <XCircle className="w-3 h-3" /> :
                                     <Clock className="w-3 h-3" />}
                                    {lvl.jabatan}
                                  </div>
                                  {idx < levels.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-400">Alasan</p>
                            <p className="text-sm text-gray-700 mt-0.5">{c.alasan}</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 mt-4" onClick={e => e.stopPropagation()}>
                            {/* Level 1 */}
                            {canApproveLevel1 && levels.find(l => l.level === 1)?.status === 'Pending' && c.currentLevel === 1 && (
                              <div className="contents">
                                <button onClick={() => handleApprove(c.id, 1)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                                  <Check className="w-4 h-4" /> Setujui (Kepala Unit)
                                </button>
                                <button onClick={() => setShowRejectModal({ id: c.id, level: 1 })} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors">
                                  <X className="w-4 h-4" /> Tolak
                                </button>
                              </div>
                            )}
                            {/* Level 2 */}
                            {canApproveLevel2 && levels.find(l => l.level === 1)?.status === 'Disetujui' && levels.find(l => l.level === 2)?.status === 'Pending' && (
                              <div className="contents">
                                <button onClick={() => handleApprove(c.id, 2)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                                  <Check className="w-4 h-4" /> Setujui (Direktur)
                                </button>
                                <button onClick={() => setShowRejectModal({ id: c.id, level: 2 })} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors">
                                  <X className="w-4 h-4" /> Tolak
                                </button>
                              </div>
                            )}
                            <button onClick={() => openDetail(c)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                              <Info className="w-4 h-4" /> Detail
                            </button>
                            <button onClick={() => openEdit(c)} className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Tab: Semua Riwayat ─── */}
        {activeTab === 'riwayat' && (
          <div>
            <div className="px-5 py-3 border-b border-gray-100 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Cari nama pegawai..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Jenis</option>
                {JENIS_CUTI.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Status</option>
                <option value="Pending">Pending</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis Cuti</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Periode</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Hari</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allCuti.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">Tidak ada data cuti</td></tr>
                  ) : allCuti.map(c => {
                    const sc = statusConfig[c.status];
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => openDetail(c)}>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium text-gray-800">{getFullName(c.pegawaiId)}</p>
                          <p className="text-xs text-gray-400">{getPegawai(c.pegawaiId)?.unitKerja}</p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 text-sm">{c.jenisCuti}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <p className="text-xs text-gray-600">{fmtDate(c.tanggalMulai)}</p>
                          <p className="text-xs text-gray-400">s.d. {fmtDate(c.tanggalSelesai)}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center font-medium text-gray-700">{c.jumlahHari}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>{c.status}</span>
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openDetail(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Detail"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => openEdit(c)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setShowDeleteConfirm(c.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Tab: Saldo Cuti ─── */}
        {activeTab === 'saldo' && (
          <div className="p-5">
            <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Jenis & Kuota Cuti ASN</p>
                  <p className="text-xs text-blue-600 mt-1">Berdasarkan PP No. 11 Tahun 2017 tentang Manajemen PNS:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                    {JENIS_CUTI.map(j => (
                      <div key={j.value} className="bg-white rounded-lg p-2.5 border border-blue-100">
                        <p className="text-xs font-medium text-gray-700">{j.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Maks. {j.kuota} hari</p>
                        <p className="text-[10px] text-blue-500 mt-0.5">{j.dasar}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Saldo Cuti Tahunan 2026</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Kuota</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Terpakai</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Sisa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pegawai.filter(p => p.statusAktif === 'Aktif').slice(0, 12).map(p => {
                    const kuota = 12;
                    const cutiPegawai = cuti.filter(c => c.pegawaiId === p.id && c.status === 'Disetujui');
                    const terpakai = cutiPegawai.reduce((s, c) => s + c.jumlahHari, 0);
                    const sisa = Math.max(0, kuota - terpakai);
                    const persen = Math.min(100, Math.round((terpakai / kuota) * 100));
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium text-gray-800">{p.nama}</p>
                          <p className="text-xs text-gray-400">{p.unitKerja}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center text-gray-700 font-medium">{kuota} hari</td>
                        <td className="px-4 py-3.5 text-center text-orange-600 font-medium">{terpakai} hari</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`font-semibold ${sisa <= 3 ? 'text-red-600' : sisa <= 6 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {sisa} hari
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${persen >= 80 ? 'bg-red-500' : persen >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${persen}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{persen}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal Tambah/Edit Cuti ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">{editData ? 'Edit Pengajuan Cuti' : 'Pengajuan Cuti Baru'}</h2>
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
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Cuti *</label>
                <select value={form.jenisCuti} onChange={e => setForm(f => ({ ...f, jenisCuti: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih Jenis Cuti</option>
                  {JENIS_CUTI.map(j => <option key={j.value} value={j.value}>{j.label} (Maks. {j.kuota} hari)</option>)}
                </select>
                {form.jenisCuti && (
                  <p className="text-xs text-blue-600 mt-1">Dasar: {JENIS_CUTI.find(j => j.value === form.jenisCuti)?.dasar}</p>
                )}
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
              {form.tanggalMulai && form.tanggalSelesai && (
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-800">Jumlah hari kerja: <strong>{hitungHariKerja(form.tanggalMulai, form.tanggalSelesai)} hari</strong></p>
                  <p className="text-xs text-blue-500 mt-0.5">*Tidak termasuk hari Sabtu, Minggu</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Alasan Cuti *</label>
                <textarea rows={3} value={form.alasan} onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))}
                  placeholder="Tuliskan alasan pengajuan cuti..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editData ? 'Perbarui' : 'Ajukan Cuti'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      {showDetailModal && selectedCuti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Pengajuan Cuti</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  {getPegawai(selectedCuti.pegawaiId)?.nama.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{getFullName(selectedCuti.pegawaiId)}</p>
                  <p className="text-xs text-gray-500">{getPegawai(selectedCuti.pegawaiId)?.jabatan} · {getPegawai(selectedCuti.pegawaiId)?.unitKerja}</p>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${statusConfig[selectedCuti.status].bg}`}>
                <p className={`text-sm font-semibold ${statusConfig[selectedCuti.status].color}`}>{statusConfig[selectedCuti.status].label}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 mb-1">Jenis Cuti</p><p className="text-sm font-medium text-gray-800">{selectedCuti.jenisCuti}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Jumlah Hari</p><p className="text-sm font-semibold text-blue-600">{selectedCuti.jumlahHari} hari kerja</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Tanggal Mulai</p><p className="text-sm text-gray-800">{fmtDate(selectedCuti.tanggalMulai)}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Tanggal Selesai</p><p className="text-sm text-gray-800">{fmtDate(selectedCuti.tanggalSelesai)}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Tanggal Pengajuan</p><p className="text-sm text-gray-800">{fmtDate(selectedCuti.tanggalPengajuan)}</p></div>
              </div>
              <div><p className="text-xs text-gray-400 mb-1">Alasan</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedCuti.alasan}</p></div>

              {/* Approval Timeline */}
              {selectedCuti.approvalLevels && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Alur Persetujuan</p>
                  <div className="space-y-3">
                    {selectedCuti.approvalLevels.map(lvl => (
                      <div key={lvl.level} className={`flex items-start gap-3 p-3 rounded-xl border ${
                        lvl.status === 'Disetujui' ? 'bg-green-50 border-green-100' :
                        lvl.status === 'Ditolak' ? 'bg-red-50 border-red-100' :
                        'bg-gray-50 border-gray-100'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          lvl.status === 'Disetujui' ? 'bg-green-500' :
                          lvl.status === 'Ditolak' ? 'bg-red-500' : 'bg-gray-300'
                        }`}>
                          {lvl.status === 'Disetujui' ? <Check className="w-3.5 h-3.5 text-white" /> :
                           lvl.status === 'Ditolak' ? <X className="w-3.5 h-3.5 text-white" /> :
                           <Clock className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">Level {lvl.level}: {lvl.jabatan}</p>
                          {lvl.nama && <p className="text-xs text-gray-500 mt-0.5">oleh {lvl.nama}</p>}
                          {lvl.tanggal && <p className="text-xs text-gray-400">{fmtDate(lvl.tanggal)}</p>}
                          {lvl.catatan && <p className="text-xs text-red-600 mt-1">Catatan: {lvl.catatan}</p>}
                          {lvl.status === 'Pending' && <p className="text-xs text-yellow-600 mt-0.5">Menunggu persetujuan</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowDetailModal(false); openEdit(selectedCuti); }}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Modal ─── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRejectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Tolak Pengajuan Cuti</h3>
            <p className="text-center text-sm text-gray-500 mb-4">Berikan alasan penolakan (opsional)</p>
            <textarea rows={3} value={rejectCatatan} onChange={e => setRejectCatatan(e.target.value)}
              placeholder="Alasan penolakan..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleReject} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Tolak Cuti</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Hapus Data Cuti?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Data pengajuan cuti ini akan dihapus permanen.</p>
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