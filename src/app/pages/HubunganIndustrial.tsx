import React, { useState, useEffect, useCallback } from 'react';
import { Scale, Search, Plus, Eye, Edit2, X, CheckCircle, Clock, AlertCircle, FileText, Download } from 'lucide-react';
import { hubunganIndustrialApi } from '../data/api';
import { toast } from 'sonner';

type TabType = 'grievance' | 'phk';

const grievanceStatusConfig: Record<string, { bg: string; color: string }> = {
  'Diterima':       { bg: 'bg-blue-50',   color: 'text-blue-700'  },
  'Sedang Diproses':{ bg: 'bg-sky-50',    color: 'text-sky-700'   },
  'Mediasi':        { bg: 'bg-yellow-50', color: 'text-yellow-700'},
  'Selesai':        { bg: 'bg-green-50',  color: 'text-green-700' },
  'Ditutup':        { bg: 'bg-gray-100',  color: 'text-gray-500'  },
};

const kategoriBg: Record<string, string> = {
  'Remunerasi':     'bg-green-100 text-green-700',
  'Kondisi Kerja':  'bg-blue-100 text-blue-700',
  'Hubungan Rekan': 'bg-purple-100 text-purple-700',
  'Diskriminasi':   'bg-red-100 text-red-700',
  'Pelecehan':      'bg-rose-100 text-rose-700',
  'Lainnya':        'bg-gray-100 text-gray-600',
};

const phkStatusBg: Record<string, string> = {
  'Proses':  'bg-yellow-100 text-yellow-700',
  'Selesai': 'bg-green-100 text-green-700',
  'Banding': 'bg-red-100 text-red-700',
};

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const GRIEVANCE_KATEGORI = ['Remunerasi', 'Kondisi Kerja', 'Hubungan Rekan', 'Diskriminasi', 'Pelecehan', 'Lainnya'];
const GRIEVANCE_STATUS   = ['Diterima', 'Sedang Diproses', 'Mediasi', 'Selesai', 'Ditutup'];
const PHK_JENIS          = ['Pengunduran Diri', 'Diberhentikan', 'Kontrak Berakhir', 'Pensiun Dini', 'Meninggal Dunia'];
const PHK_STATUS         = ['Proses', 'Selesai', 'Banding'];

const emptyGrievance = {
  kategori: 'Lainnya', deskripsi: '', tanggal_laporan: '', is_anonim: false,
};
const emptyPHK = {
  pegawai_id: '', jenis_phk: 'Pengunduran Diri', alasan: '', tanggal_phk: '',
  pesangon: '', uang_penghargaan: '', uang_pisah: '', nomor_sk: '', catatan: '',
};
const emptyUpdateGrievance = { status: '', resolusi: '', tanggal_selesai: '' };

export default function HubunganIndustrial() {
  const [activeTab, setActiveTab] = useState<TabType>('grievance');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  const [grievances, setGrievances] = useState<any[]>([]);
  const [phkList, setPhkList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);

  const [showGrievanceForm, setShowGrievanceForm]   = useState(false);
  const [showPHKForm, setShowPHKForm]               = useState(false);
  const [showUpdateForm, setShowUpdateForm]         = useState<any | null>(null);
  const [detailData, setDetailData]                 = useState<any | null>(null);

  const [formGrievance, setFormGrievance] = useState({ ...emptyGrievance });
  const [formPHK, setFormPHK]             = useState({ ...emptyPHK });
  const [formUpdate, setFormUpdate]       = useState({ ...emptyUpdateGrievance });

  const loadGrievance = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus)   params.status   = filterStatus;
      if (filterKategori) params.kategori = filterKategori;
      const res = await hubunganIndustrialApi.getGrievance(params);
      setGrievances(res.data?.data ?? res.data ?? []);
    } catch { toast.error('Gagal memuat data grievance'); }
    finally { setLoading(false); }
  }, [filterStatus, filterKategori]);

  const loadPHK = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hubunganIndustrialApi.getPHK(filterStatus ? { status: filterStatus } : undefined);
      setPhkList(res.data?.data ?? res.data ?? []);
    } catch { toast.error('Gagal memuat data PHK'); }
    finally { setLoading(false); }
  }, [filterStatus]);

  const loadStats = useCallback(async () => {
    try {
      const res = await hubunganIndustrialApi.statsGrievance();
      setStats(res.data);
    } catch { /* stats non-critical */ }
  }, []);

  useEffect(() => {
    if (activeTab === 'grievance') { loadGrievance(); loadStats(); }
    else loadPHK();
    setFilterStatus('');
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'grievance') loadGrievance();
    else loadPHK();
  }, [filterStatus, filterKategori]);

  const handleAddGrievance = async () => {
    if (!formGrievance.deskripsi || !formGrievance.tanggal_laporan) {
      toast.error('Harap isi deskripsi dan tanggal laporan'); return;
    }
    try {
      await hubunganIndustrialApi.addGrievance(formGrievance);
      toast.success('Pengaduan berhasil dicatat');
      setShowGrievanceForm(false);
      setFormGrievance({ ...emptyGrievance });
      loadGrievance();
    } catch { toast.error('Gagal menyimpan pengaduan'); }
  };

  const handleAddPHK = async () => {
    if (!formPHK.pegawai_id || !formPHK.tanggal_phk || !formPHK.alasan) {
      toast.error('Harap isi field wajib'); return;
    }
    try {
      await hubunganIndustrialApi.addPHK(formPHK);
      toast.success('Data PHK berhasil dicatat');
      setShowPHKForm(false);
      setFormPHK({ ...emptyPHK });
      loadPHK();
    } catch { toast.error('Gagal menyimpan data PHK'); }
  };

  const handleUpdateGrievance = async () => {
    if (!showUpdateForm) return;
    try {
      await hubunganIndustrialApi.updateGrievance(showUpdateForm.id, formUpdate);
      toast.success('Pengaduan diperbarui');
      setShowUpdateForm(null);
      loadGrievance();
    } catch { toast.error('Gagal memperbarui pengaduan'); }
  };

  const handleSuratPHK = async (phk: any) => {
    setPdfLoading(phk.id);
    try {
      const res = await hubunganIndustrialApi.suratPHK(phk.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `surat_phk_${phk.pegawai?.nip ?? phk.id}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Surat PHK diunduh');
    } catch { toast.error('Gagal generate surat PHK'); }
    finally { setPdfLoading(null); }
  };

  const filteredGrievances = grievances.filter(g =>
    !search ||
    (g.pegawai?.nama ?? '').toLowerCase().includes(search.toLowerCase()) ||
    g.deskripsi.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPHK = phkList.filter(p =>
    !search || (p.pegawai?.nama ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const pendingGrievance = grievances.filter(g => !['Selesai', 'Ditutup'].includes(g.status)).length;
  const totalKompensasi  = phkList.reduce((a, p) => a + parseFloat(p.total_kompensasi ?? 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Hubungan Industrial & PKB</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 13/2003 Pasal 102–135 · UU Cipta Kerja No. 6/2023 · Peraturan Perusahaan RS</p>
        </div>
        <button
          onClick={() => activeTab === 'grievance' ? setShowGrievanceForm(true) : setShowPHKForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengaduan', value: grievances.length, sub: `${pendingGrievance} belum selesai`, color: 'text-blue-600' },
          { label: 'Pengaduan Aktif', value: pendingGrievance, sub: 'Perlu tindak lanjut', color: pendingGrievance > 0 ? 'text-yellow-600' : 'text-gray-500' },
          { label: 'Total PHK', value: phkList.length, sub: 'Semua jenis', color: 'text-orange-600' },
          { label: 'Est. Total Kompensasi', value: `Rp ${(totalKompensasi / 1e6).toFixed(0)}jt`, sub: 'Semua proses', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Stats breakdown */}
      {stats && activeTab === 'grievance' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Per Kategori</p>
            <div className="space-y-1">
              {Object.entries(stats.by_kategori ?? {}).map(([k, v]: any) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-700">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Per Status · Rata-rata {stats.avg_days_to_resolve} hari</p>
            <div className="space-y-1">
              {Object.entries(stats.by_status ?? {}).map(([k, v]: any) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-700">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Peraturan Perusahaan (PP) & PKB Rumah Sakit</p>
            <p className="text-xs text-blue-600 mt-1">PP RS Rev. III/2024 · Berlaku: 1 Jan 2024 – 31 Des 2025 · Status: <span className="font-semibold">Dalam Proses Pembaruan</span></p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[{ key: 'grievance' as TabType, label: 'Pengaduan & Mediasi', count: grievances.length },
            { key: 'phk' as TabType, label: 'PHK', count: phkList.length }].map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); }}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label} <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau deskripsi..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {activeTab === 'grievance' && (
            <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              <option value="">Semua Kategori</option>
              {GRIEVANCE_KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          )}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Status</option>
            {(activeTab === 'grievance' ? GRIEVANCE_STATUS : PHK_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Grievance table */}
        {activeTab === 'grievance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tgl Laporan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Deskripsi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Mediator</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="py-10 text-center text-gray-400">Memuat...</td></tr>
                ) : filteredGrievances.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada pengaduan</td></tr>
                ) : filteredGrievances.map(g => {
                  const sc = grievanceStatusConfig[g.status] ?? { bg: 'bg-gray-50', color: 'text-gray-600' };
                  return (
                    <tr key={g.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailData({ ...g, _type: 'grievance' })}>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-sm text-gray-800">{g.is_anonim ? 'Anonim' : (g.pegawai?.nama ?? '—')}</p>
                        <p className="text-xs text-gray-400">{g.pegawai?.unit_kerja ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">{fmtDate(g.tanggal_laporan)}</td>
                      <td className="px-4 py-3.5"><span className={`text-xs px-2 py-0.5 rounded font-medium ${kategoriBg[g.kategori] ?? 'bg-gray-100 text-gray-600'}`}>{g.kategori}</span></td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500 max-w-xs truncate">{g.deskripsi}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{g.mediator?.nama ?? '—'}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>{g.status}</span></td>
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailData({ ...g, _type: 'grievance' })} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setShowUpdateForm(g); setFormUpdate({ status: g.status, resolusi: g.resolusi ?? '', tanggal_selesai: g.tanggal_selesai ?? '' }); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PHK table */}
        {activeTab === 'phk' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis PHK</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tanggal PHK</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Total Kompensasi</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400">Memuat...</td></tr>
                ) : filteredPHK.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada data PHK</td></tr>
                ) : filteredPHK.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailData({ ...p, _type: 'phk' })}>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-sm text-gray-800">{p.pegawai?.nama ?? '—'}</p>
                      <p className="text-xs text-gray-400">{p.pegawai?.jabatan ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{p.jenis_phk}</span></td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-700">{fmtDate(p.tanggal_phk)}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-right text-xs font-medium text-gray-800">
                      {p.total_kompensasi > 0 ? `Rp ${fmt(p.total_kompensasi)}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${phkStatusBg[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                    <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setDetailData({ ...p, _type: 'phk' })} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={() => handleSuratPHK(p)}
                          disabled={pdfLoading === p.id}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 disabled:opacity-50"
                          title="Download Surat PHK"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
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
              <h2 className="font-semibold text-gray-800">{detailData._type === 'grievance' ? 'Detail Pengaduan' : 'Detail PHK'}</h2>
              <button onClick={() => setDetailData(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800">{detailData.is_anonim ? 'Anonim' : (detailData.pegawai?.nama ?? '—')}</p>
                <p className="text-xs text-gray-400">{detailData.pegawai?.jabatan ?? detailData.pegawai?.unit_kerja ?? '—'}</p>
              </div>

              {detailData._type === 'grievance' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-400">Tgl Laporan</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggal_laporan)}</p></div>
                    <div><p className="text-xs text-gray-400">Kategori</p><span className={`text-xs px-2 py-0.5 rounded font-medium ${kategoriBg[detailData.kategori] ?? 'bg-gray-100 text-gray-600'}`}>{detailData.kategori}</span></div>
                  </div>
                  <div><p className="text-xs text-gray-400 mb-1">Deskripsi</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detailData.deskripsi}</p></div>
                  {detailData.resolusi && <div><p className="text-xs text-gray-400 mb-1">Resolusi</p><p className="text-sm text-green-800 bg-green-50 p-3 rounded-lg border border-green-100">{detailData.resolusi}</p></div>}
                  {detailData.mediator?.nama && <div><p className="text-xs text-gray-400">Mediator</p><p className="text-sm text-gray-800">{detailData.mediator.nama}</p></div>}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {[['Jenis PHK', detailData.jenis_phk], ['Tanggal PHK', fmtDate(detailData.tanggal_phk)], ['Status', detailData.status], ['Nomor SK', detailData.nomor_sk ?? '—']].map(([l, v]) => (
                      <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="text-sm text-gray-800 mt-0.5">{v}</p></div>
                    ))}
                  </div>
                  <div><p className="text-xs text-gray-400 mb-1">Alasan</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detailData.alasan}</p></div>
                  <div className="p-4 bg-blue-50 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-blue-700">KOMPENSASI</p>
                    {[['Pesangon', detailData.pesangon], ['Uang Penghargaan', detailData.uang_penghargaan], ['Uang Pisah', detailData.uang_pisah]].filter(([, v]) => parseFloat(v as string) > 0).map(([l, v]) => (
                      <div key={l as string} className="flex justify-between text-sm"><span className="text-blue-700">{l as string}</span><span className="font-medium text-blue-900">Rp {fmt(parseFloat(v as string))}</span></div>
                    ))}
                    <div className="flex justify-between font-bold border-t border-blue-200 pt-2"><span className="text-blue-800">Total</span><span className="text-blue-900">Rp {fmt(parseFloat(detailData.total_kompensasi ?? 0))}</span></div>
                  </div>
                  <button onClick={() => handleSuratPHK(detailData)} disabled={pdfLoading === detailData.id}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg">
                    <Download className="w-4 h-4" /> {pdfLoading === detailData.id ? 'Memproses...' : 'Download Surat PHK'}
                  </button>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end"><button onClick={() => setDetailData(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg">Tutup</button></div>
          </div>
        </div>
      )}

      {/* Update Grievance Modal */}
      {showUpdateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpdateForm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Update Pengaduan #{showUpdateForm.id}</h2>
              <button onClick={() => setShowUpdateForm(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                <select value={formUpdate.status} onChange={e => setFormUpdate(f => ({ ...f, status: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {GRIEVANCE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Selesai</label>
                <input type="date" value={formUpdate.tanggal_selesai} onChange={e => setFormUpdate(f => ({ ...f, tanggal_selesai: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Resolusi</label>
                <textarea rows={3} value={formUpdate.resolusi} onChange={e => setFormUpdate(f => ({ ...f, resolusi: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowUpdateForm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleUpdateGrievance} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Perbarui</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Grievance Modal */}
      {showGrievanceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowGrievanceForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Tambah Pengaduan</h2>
              <button onClick={() => setShowGrievanceForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tgl Laporan *</label>
                  <input type="date" value={formGrievance.tanggal_laporan} onChange={e => setFormGrievance(f => ({ ...f, tanggal_laporan: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Kategori</label>
                  <select value={formGrievance.kategori} onChange={e => setFormGrievance(f => ({ ...f, kategori: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {GRIEVANCE_KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Deskripsi Pengaduan *</label>
                <textarea rows={4} value={formGrievance.deskripsi} onChange={e => setFormGrievance(f => ({ ...f, deskripsi: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="anonim" checked={formGrievance.is_anonim}
                  onChange={e => setFormGrievance(f => ({ ...f, is_anonim: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <label htmlFor="anonim" className="text-sm text-gray-700">Laporkan secara anonim</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowGrievanceForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleAddGrievance} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Add PHK Modal */}
      {showPHKForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPHKForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Tambah Data PHK</h2>
              <button onClick={() => setShowPHKForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">ID Pegawai *</label>
                <input value={formPHK.pegawai_id} onChange={e => setFormPHK(f => ({ ...f, pegawai_id: e.target.value }))}
                  placeholder="ID pegawai (integer)"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis PHK</label>
                  <select value={formPHK.jenis_phk} onChange={e => setFormPHK(f => ({ ...f, jenis_phk: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PHK_JENIS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal PHK *</label>
                  <input type="date" value={formPHK.tanggal_phk} onChange={e => setFormPHK(f => ({ ...f, tanggal_phk: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Alasan *</label>
                <textarea rows={2} value={formPHK.alasan} onChange={e => setFormPHK(f => ({ ...f, alasan: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['Pesangon', 'pesangon'], ['Uang Penghargaan', 'uang_penghargaan'], ['Uang Pisah', 'uang_pisah']].map(([l, k]) => (
                  <div key={k}><label className="text-xs font-medium text-gray-700 block mb-1.5">{l} (Rp)</label>
                    <input type="number" value={(formPHK as any)[k]} onChange={e => setFormPHK(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK</label>
                <input value={formPHK.nomor_sk} onChange={e => setFormPHK(f => ({ ...f, nomor_sk: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan</label>
                <textarea rows={2} value={formPHK.catatan} onChange={e => setFormPHK(f => ({ ...f, catatan: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowPHKForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleAddPHK} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
