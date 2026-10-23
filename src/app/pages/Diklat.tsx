import React, { useState } from 'react';
import { GraduationCap, Plus, Search, Eye, Edit2, Trash2, X, BookOpen, Award, Clock, Calendar, Upload, BarChart2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { diklatApi } from '../data/api';
import { toast } from 'sonner';

const jenisConfig: Record<string, { color: string; bg: string }> = {
  Teknis:          { color: 'text-blue-700',   bg: 'bg-blue-100' },
  Fungsional:      { color: 'text-purple-700', bg: 'bg-purple-100' },
  Kepemimpinan:    { color: 'text-indigo-700', bg: 'bg-indigo-100' },
  Orientasi:       { color: 'text-green-700',  bg: 'bg-green-100' },
  Seminar:         { color: 'text-teal-700',   bg: 'bg-teal-100' },
  Workshop:        { color: 'text-orange-700', bg: 'bg-orange-100' },
  Webinar:         { color: 'text-cyan-700',   bg: 'bg-cyan-100' },
  Magang:          { color: 'text-rose-700',   bg: 'bg-rose-100' },
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  Direncanakan:      { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Calendar },
  'Sedang Berjalan': { color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Clock },
  Selesai:           { color: 'text-green-700',  bg: 'bg-green-100',  icon: Award },
  Batal:             { color: 'text-red-700',     bg: 'bg-red-100',    icon: X },
};

const JENIS_LIST = ['Teknis', 'Fungsional', 'Kepemimpinan', 'Orientasi', 'Seminar', 'Workshop', 'Webinar', 'Magang'];
const STATUS_LIST = ['Direncanakan', 'Sedang Berjalan', 'Selesai', 'Batal'];
const tahunNow = new Date().getFullYear();

const EMPTY_FORM = {
  pegawai_id: '', nama_diklat: '', penyelenggara: '', jenis: 'Teknis',
  metode: 'Klasikal', tanggal_mulai: '', tanggal_selesai: '',
  jumlah_jam: '', tempat: '', nomor_sertifikat: '', status: 'Direncanakan',
  biaya: '', keterangan: '',
};

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Diklat() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'list' | 'rekap'>('list');
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTahun, setFilterTahun] = useState(String(tahunNow));
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const filters = {
    tahun: filterTahun,
    ...(filterJenis ? { jenis: filterJenis } : {}),
    ...(filterStatus ? { status: filterStatus } : {}),
  };

  const { data: listData, isLoading } = useQuery({
    queryKey: ['diklat', filters],
    queryFn: () => diklatApi.getAll(filters),
  });

  const { data: rekapData, isLoading: rekapLoading } = useQuery({
    queryKey: ['diklat-rekap', filterTahun],
    queryFn: () => diklatApi.rekap(Number(filterTahun) || tahunNow),
    enabled: activeTab === 'rekap',
  });

  const createMut = useMutation({
    mutationFn: diklatApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diklat'] }); toast.success('Diklat ditambahkan'); setShowModal(false); },
    onError: () => toast.error('Gagal menyimpan'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => diklatApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diklat'] }); toast.success('Diklat diperbarui'); setShowModal(false); },
    onError: () => toast.error('Gagal memperbarui'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => diklatApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diklat'] }); toast.success('Diklat dihapus'); setDeleteId(null); },
    onError: () => toast.error('Gagal menghapus'),
  });

  const uploadMut = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => diklatApi.uploadSertifikat(id, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diklat'] }); toast.success('Sertifikat diunggah'); setUploadingId(null); },
    onError: () => { toast.error('Gagal unggah sertifikat'); setUploadingId(null); },
  });

  const rows: any[] = listData?.data?.data ?? listData?.data ?? [];
  const filtered = rows.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.nama_diklat?.toLowerCase().includes(s)
      || d.penyelenggara?.toLowerCase().includes(s)
      || d.pegawai?.nama?.toLowerCase().includes(s);
  });

  const stats = {
    total: rows.length,
    selesai: rows.filter(d => d.status === 'Selesai').length,
    berlangsung: rows.filter(d => d.status === 'Sedang Berjalan').length,
    totalJP: rows.filter(d => d.status === 'Selesai').reduce((s: number, d: any) => s + (d.jumlah_jam || 0), 0),
  };

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowModal(true); };
  const openEdit = (d: any) => {
    setEditId(d.id);
    setForm({
      pegawai_id: String(d.pegawai_id ?? ''), nama_diklat: d.nama_diklat ?? '', penyelenggara: d.penyelenggara ?? '',
      jenis: d.jenis ?? 'Teknis', metode: d.metode ?? 'Klasikal',
      tanggal_mulai: d.tanggal_mulai ?? '', tanggal_selesai: d.tanggal_selesai ?? '',
      jumlah_jam: String(d.jumlah_jam ?? ''), tempat: d.tempat ?? '',
      nomor_sertifikat: d.nomor_sertifikat ?? '', status: d.status ?? 'Direncanakan',
      biaya: d.biaya ? String(d.biaya) : '', keterangan: d.keterangan ?? '',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nama_diklat || !form.penyelenggara || !form.tanggal_mulai) {
      toast.error('Harap isi semua field wajib'); return;
    }
    const payload = { ...form, pegawai_id: Number(form.pegawai_id) || undefined, jumlah_jam: Number(form.jumlah_jam) };
    if (editId) updateMut.mutate({ id: editId, data: payload });
    else createMut.mutate(payload);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, diklatId: number) => {
    const file = e.target.files?.[0];
    if (file) { setUploadingId(diklatId); uploadMut.mutate({ id: diklatId, file }); }
    e.target.value = '';
  };

  const rekapRows: any[] = rekapData?.data ?? [];

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
          { label: 'Total Diklat',        value: stats.total,                      color: 'text-gray-700',   bg: 'bg-white border-gray-100',         icon: BookOpen },
          { label: 'Diklat Selesai',      value: stats.selesai,                    color: 'text-green-600',  bg: 'bg-green-50 border-green-100',     icon: Award },
          { label: 'Sedang Berlangsung',  value: stats.berlangsung,                color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100',       icon: Clock },
          { label: 'Total JP (Selesai)',  value: `${stats.totalJP} JP`,           color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100',   icon: GraduationCap },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border shadow-sm ${s.bg}`}>
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('list')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
          <BookOpen className="w-4 h-4" /> Riwayat Diklat
        </button>
        <button onClick={() => setActiveTab('rekap')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'rekap' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
          <BarChart2 className="w-4 h-4" /> Rekap Jam Diklat
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Filter */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Cari nama diklat, pegawai, penyelenggara..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[tahunNow, tahunNow - 1, tahunNow - 2].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Jenis</option>
                {JENIS_LIST.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Status</option>
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-500">Menampilkan <span className="font-semibold text-gray-800">{filtered.length}</span> riwayat diklat</p>
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
                  {isLoading ? (
                    <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">Memuat data...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                      <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Tidak ada riwayat diklat yang ditemukan</p>
                    </td></tr>
                  ) : filtered.map((d: any) => {
                    const jc = jenisConfig[d.jenis] ?? { color: 'text-gray-700', bg: 'bg-gray-100' };
                    const sc = statusConfig[d.status] ?? { color: 'text-gray-700', bg: 'bg-gray-100', icon: Calendar };
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={d.id} className="hover:bg-blue-50/20 transition-colors cursor-pointer" onClick={() => { setDetailData(d); setShowDetail(true); }}>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium text-gray-800">{d.pegawai?.nama ?? '—'}</p>
                          <p className="text-xs text-gray-400">{d.pegawai?.unit_kerja}</p>
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <p className="text-sm text-gray-800 truncate">{d.nama_diklat}</p>
                          <p className="text-xs text-gray-400">{d.tempat}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center hidden md:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${jc.bg} ${jc.color}`}>{d.jenis}</span>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-600">{d.penyelenggara}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-center">
                          <p className="text-xs text-gray-600">{d.tanggal_mulai ? fmt(d.tanggal_mulai) : '—'}</p>
                          <p className="text-xs text-gray-400">s.d. {d.tanggal_selesai ? fmt(d.tanggal_selesai) : '—'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-sm font-semibold text-gray-700">{d.jumlah_jam}</span>
                          <p className="text-xs text-gray-400">JP</p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" />{d.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setDetailData(d); setShowDetail(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Detail"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => openEdit(d)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                            <label className={`p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer ${uploadingId === d.id ? 'opacity-40' : ''}`} title="Upload Sertifikat">
                              <Upload className="w-4 h-4" />
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                onChange={e => handleFileChange(e, d.id)} disabled={uploadingId === d.id} />
                            </label>
                            <button onClick={() => setDeleteId(d.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'rekap' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Rekap Jam Diklat per Pegawai — Target 40 JP/tahun</p>
            <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[tahunNow, tahunNow - 1, tahunNow - 2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {rekapLoading ? (
            <p className="py-12 text-center text-gray-400 text-sm">Memuat rekap...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Unit Kerja</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Realisasi JP</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Target</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-48">Progress</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Diklat</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rekapRows.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data pegawai aktif</td></tr>
                  ) : rekapRows.map((r: any) => {
                    const pct = Math.min(100, Math.round((r.realisasi_jam / r.target_jam) * 100));
                    const done = pct >= 100;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">{r.nama}</p>
                          <p className="text-xs text-gray-400">{r.jabatan}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">{r.unit_kerja}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-semibold ${done ? 'text-green-600' : 'text-gray-700'}`}>{r.realisasi_jam}</span>
                          <span className="text-xs text-gray-400"> JP</span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{r.target_jam} JP</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${done ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-600">{r.jumlah_diklat}</td>
                        <td className="px-4 py-3 text-center">
                          {r.gap <= 0
                            ? <span className="text-xs text-green-600 font-medium">Tercapai</span>
                            : <span className="text-xs text-red-500">-{r.gap} JP</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit Riwayat Diklat' : 'Tambah Riwayat Diklat'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Nama Diklat / Pelatihan *</label>
                <input type="text" value={form.nama_diklat} onChange={e => setForm(f => ({ ...f, nama_diklat: e.target.value }))}
                  placeholder="Contoh: Pelatihan Manajemen ASN" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Diklat *</label>
                  <select value={form.jenis} onChange={e => setForm(f => ({ ...f, jenis: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {JENIS_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Metode</label>
                  <select value={form.metode} onChange={e => setForm(f => ({ ...f, metode: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Klasikal', 'Online', 'Blended'].map(m => <option key={m} value={m}>{m}</option>)}
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
                <input type="text" value={form.tempat} onChange={e => setForm(f => ({ ...f, tempat: e.target.value }))}
                  placeholder="Contoh: Bandung, Jawa Barat" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Mulai *</label>
                  <input type="date" value={form.tanggal_mulai} onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Selesai *</label>
                  <input type="date" value={form.tanggal_selesai} onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jumlah JP *</label>
                  <input type="number" value={form.jumlah_jam} onChange={e => setForm(f => ({ ...f, jumlah_jam: e.target.value }))}
                    placeholder="Jam Pelajaran" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor Sertifikat</label>
                  <input type="text" value={form.nomor_sertifikat} onChange={e => setForm(f => ({ ...f, nomor_sertifikat: e.target.value }))}
                    placeholder="No. sertifikat" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Biaya (Rp)</label>
                  <input type="number" value={form.biaya} onChange={e => setForm(f => ({ ...f, biaya: e.target.value }))}
                    placeholder="0" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Keterangan</label>
                <textarea value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {editId ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Riwayat Diklat</h2>
              <button onClick={() => setShowDetail(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-3 rounded-xl ${(jenisConfig[detailData.jenis] ?? { bg: 'bg-gray-100' }).bg}`}>
                <p className={`text-xs font-semibold ${(jenisConfig[detailData.jenis] ?? { color: 'text-gray-700' }).color}`}>Diklat {detailData.jenis}</p>
                <p className="text-gray-800 font-medium text-sm mt-1">{detailData.nama_diklat}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Peserta</p>
                <p className="text-sm font-medium text-gray-800">{detailData.pegawai?.nama ?? '—'}</p>
                <p className="text-xs text-gray-500">{detailData.pegawai?.unit_kerja}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 mb-1">Penyelenggara</p><p className="text-sm text-gray-800">{detailData.penyelenggara}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Tempat</p><p className="text-sm text-gray-800">{detailData.tempat || '—'}</p></div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Tanggal Pelaksanaan</p>
                  <p className="text-sm text-gray-800">{detailData.tanggal_mulai ? fmt(detailData.tanggal_mulai) : '—'}</p>
                  <p className="text-xs text-gray-500">s.d. {detailData.tanggal_selesai ? fmt(detailData.tanggal_selesai) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Durasi & JP</p>
                  <p className="text-sm text-gray-800">{detailData.jumlah_jam} Jam Pelajaran</p>
                  <p className="text-xs text-gray-500">{detailData.metode}</p>
                </div>
              </div>
              {detailData.nomor_sertifikat && (
                <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                  <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-700 font-medium">Sertifikat Diterbitkan</p>
                    <p className="text-xs text-green-600 font-mono">{detailData.nomor_sertifikat}</p>
                  </div>
                </div>
              )}
              {detailData.file_sertifikat && (
                <a href={`/storage/${detailData.file_sertifikat}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Upload className="w-4 h-4" /> Lihat file sertifikat
                </a>
              )}
              <div><p className="text-xs text-gray-400 mb-1">Status</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${(statusConfig[detailData.status] ?? { bg: 'bg-gray-100', color: 'text-gray-700' }).bg} ${(statusConfig[detailData.status] ?? { color: 'text-gray-700' }).color}`}>
                  {detailData.status}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowDetail(false); openEdit(detailData); }}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => setShowDetail(false)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Hapus Riwayat Diklat?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Data riwayat diklat ini akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={() => deleteMut.mutate(deleteId)} disabled={deleteMut.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
