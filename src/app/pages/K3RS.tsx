import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Search, Plus, X, Edit2, Trash2, AlertTriangle, CheckCircle, Clock, Syringe, Activity, Eye, RefreshCw } from 'lucide-react';
import { k3rsApi } from '../data/api';
import { toast } from 'sonner';

type TabType = 'insiden' | 'vaksinasi' | 'mcu';

const KEPARAHAN_BADGE: Record<string, string> = {
  Fatal:  'bg-red-100 text-red-800 border border-red-200',
  Berat:  'bg-orange-100 text-orange-700 border border-orange-200',
  Sedang: 'bg-amber-100 text-amber-700 border border-amber-200',
  Ringan: 'bg-green-100 text-green-700 border border-green-200',
};

const STATUS_INV_BADGE: Record<string, string> = {
  'Dilaporkan':          'bg-blue-50 text-blue-700',
  'Sedang Diinvestigasi':'bg-orange-50 text-orange-700',
  'Selesai':             'bg-green-50 text-green-700',
  'Ditutup':             'bg-gray-100 text-gray-500',
};

const HASIL_MCU_BADGE: Record<string, string> = {
  'Sehat':              'bg-green-100 text-green-700',
  'Perlu Tindak Lanjut':'bg-amber-100 text-amber-700',
  'Tidak Sehat':        'bg-red-100 text-red-700',
};

const VAK_STATUS_BADGE: Record<string, string> = {
  Selesai:     'bg-green-100 text-green-700',
  Dijadwalkan: 'bg-blue-100 text-blue-700',
  Ditunda:     'bg-amber-100 text-amber-700',
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const Badge = ({ label, cls }: { label: string; cls: string }) => (
  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cls}`}>{label}</span>
);

// ─── INSIDEN FORM ─────────────────────────────────────────────────────────────
const EMPTY_INSIDEN = {
  pegawai_id: '', tanggal_insiden: '', jam_insiden: '', lokasi: '',
  jenis_insiden: 'Kecelakaan Kerja', kronologi: '', tingkat_keparahan: 'Ringan',
  korban_jiwa: false, penanganan_awal: '',
};
const JENIS_INSIDEN = ['Kecelakaan Kerja', 'Pajanan Jarum Suntik', 'Pajanan Cairan Tubuh',
  'Pajanan Radiasi', 'Kecelakaan Bahan Kimia', 'Near Miss', 'KTD Pegawai', 'Lainnya'];

// ─── VAKSINASI FORM ───────────────────────────────────────────────────────────
const EMPTY_VAK = {
  pegawai_id: '', nama_vaksin: '', tanggal_vaksinasi: '',
  dosis: 1, nomor_batch: '', pemberi_vaksin: '', lokasi_vaksinasi: '', status: 'Dijadwalkan',
};

// ─── MCU FORM ─────────────────────────────────────────────────────────────────
const EMPTY_MCU = {
  pegawai_id: '', tanggal_mcu: '', fasilitas_kesehatan: '',
  hasil_umum: 'Sehat', catatan_dokter: '', file_hasil: '',
};

export default function K3RS() {
  const [activeTab, setActiveTab] = useState<TabType>('insiden');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Data
  const [insiden, setInsiden]     = useState<any[]>([]);
  const [vaksinasi, setVaksinasi] = useState<any[]>([]);
  const [mcu, setMcu]             = useState<any[]>([]);
  const [stats, setStats]         = useState<any>(null);
  const [coverage, setCoverage]   = useState<any>(null);
  const [mcuSummary, setMcuSummary] = useState<any>(null);

  // Modal state
  const [showModal, setShowModal]           = useState(false);
  const [editItem, setEditItem]             = useState<any>(null);
  const [detailInsiden, setDetailInsiden]   = useState<any>(null);
  const [deleteTarget, setDeleteTarget]     = useState<{ id: number; tab: TabType } | null>(null);

  // Forms
  const [formInsiden, setFormInsiden] = useState({ ...EMPTY_INSIDEN });
  const [formVak, setFormVak]         = useState({ ...EMPTY_VAK });
  const [formMCU, setFormMCU]         = useState({ ...EMPTY_MCU });

  // Pagination
  const [insidenPage, setInsidenPage]     = useState(1);
  const [vakPage, setVakPage]             = useState(1);
  const [mcuPage, setMcuPage]             = useState(1);

  const loadInsiden = useCallback(async () => {
    setLoading(true);
    try {
      const r = await k3rsApi.getInsiden({ page: insidenPage });
      setInsiden(r.data?.data ?? r.data ?? []);
    } catch { toast.error('Gagal memuat data insiden'); }
    finally { setLoading(false); }
  }, [insidenPage]);

  const loadVaksinasi = useCallback(async () => {
    setLoading(true);
    try {
      const r = await k3rsApi.getVaksinasi({ page: vakPage });
      setVaksinasi(r.data?.data ?? r.data ?? []);
    } catch { toast.error('Gagal memuat data vaksinasi'); }
    finally { setLoading(false); }
  }, [vakPage]);

  const loadMCU = useCallback(async () => {
    setLoading(true);
    try {
      const r = await k3rsApi.getMCU({ page: mcuPage });
      setMcu(r.data?.data ?? r.data ?? []);
    } catch { toast.error('Gagal memuat data MCU'); }
    finally { setLoading(false); }
  }, [mcuPage]);

  const loadStats = useCallback(async () => {
    try { const r = await k3rsApi.statsInsiden(); setStats(r.data); } catch {}
  }, []);

  const loadCoverage = useCallback(async () => {
    try { const r = await k3rsApi.coverage(); setCoverage(r); } catch {}
  }, []);

  const loadMcuSummary = useCallback(async () => {
    try { const r = await k3rsApi.mcuSummary(); setMcuSummary(r.data); } catch {}
  }, []);

  useEffect(() => { loadInsiden(); loadStats(); }, [loadInsiden, loadStats]);
  useEffect(() => { if (activeTab === 'vaksinasi') { loadVaksinasi(); loadCoverage(); } }, [activeTab, loadVaksinasi, loadCoverage]);
  useEffect(() => { if (activeTab === 'mcu') { loadMCU(); loadMcuSummary(); } }, [activeTab, loadMCU, loadMcuSummary]);

  const openAdd = () => {
    setEditItem(null);
    if (activeTab === 'insiden') setFormInsiden({ ...EMPTY_INSIDEN });
    else if (activeTab === 'vaksinasi') setFormVak({ ...EMPTY_VAK });
    else setFormMCU({ ...EMPTY_MCU });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    if (activeTab === 'insiden') {
      setFormInsiden({
        pegawai_id: item.pegawai_id ?? '', tanggal_insiden: item.tanggal_insiden ?? '',
        jam_insiden: item.jam_insiden ?? '', lokasi: item.lokasi ?? '',
        jenis_insiden: item.jenis_insiden ?? 'Kecelakaan Kerja', kronologi: item.kronologi ?? '',
        tingkat_keparahan: item.tingkat_keparahan ?? 'Ringan',
        korban_jiwa: item.korban_jiwa ?? false, penanganan_awal: item.penanganan_awal ?? '',
      });
    } else if (activeTab === 'vaksinasi') {
      setFormVak({
        pegawai_id: item.pegawai_id ?? '', nama_vaksin: item.nama_vaksin ?? '',
        tanggal_vaksinasi: item.tanggal_vaksinasi ?? '', dosis: item.dosis ?? 1,
        nomor_batch: item.nomor_batch ?? '', pemberi_vaksin: item.pemberi_vaksin ?? '',
        lokasi_vaksinasi: item.lokasi_vaksinasi ?? '', status: item.status ?? 'Dijadwalkan',
      });
    } else {
      setFormMCU({
        pegawai_id: item.pegawai_id ?? '', tanggal_mcu: item.tanggal_mcu ?? '',
        fasilitas_kesehatan: item.fasilitas_kesehatan ?? '', hasil_umum: item.hasil_umum ?? 'Sehat',
        catatan_dokter: item.catatan_dokter ?? '', file_hasil: item.file_hasil ?? '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'insiden') {
        if (!formInsiden.tanggal_insiden || !formInsiden.lokasi || !formInsiden.kronologi) {
          toast.error('Isi semua field wajib'); return;
        }
        if (editItem) {
          await k3rsApi.updateInsiden(editItem.id, {
            status_investigasi: editItem.status_investigasi ?? 'Dilaporkan',
            penanganan_awal: formInsiden.penanganan_awal,
          });
          toast.success('Insiden diperbarui');
        } else {
          await k3rsApi.createInsiden(formInsiden);
          toast.success('Laporan insiden K3RS disimpan');
        }
        loadInsiden(); loadStats();
      } else if (activeTab === 'vaksinasi') {
        if (!formVak.pegawai_id || !formVak.nama_vaksin) { toast.error('Isi field wajib'); return; }
        if (editItem) { await k3rsApi.updateVaksinasi(editItem.id, formVak); toast.success('Vaksinasi diperbarui'); }
        else          { await k3rsApi.createVaksinasi(formVak); toast.success('Vaksinasi disimpan'); }
        loadVaksinasi(); loadCoverage();
      } else {
        if (!formMCU.pegawai_id || !formMCU.tanggal_mcu) { toast.error('Isi field wajib'); return; }
        if (editItem) { await k3rsApi.updateMCU(editItem.id, formMCU); toast.success('MCU diperbarui'); }
        else          { await k3rsApi.createMCU(formMCU); toast.success('MCU disimpan'); }
        loadMCU(); loadMcuSummary();
      }
      setShowModal(false);
    } catch { toast.error('Gagal menyimpan data'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.tab === 'vaksinasi') await k3rsApi.deleteVaksinasi(deleteTarget.id);
      else if (deleteTarget.tab === 'mcu')  await k3rsApi.deleteMCU(deleteTarget.id);
      toast.success('Data dihapus');
      if (deleteTarget.tab === 'vaksinasi') { loadVaksinasi(); loadCoverage(); }
      else { loadMCU(); loadMcuSummary(); }
    } catch { toast.error('Gagal menghapus'); }
    setDeleteTarget(null);
  };

  // Filter local search
  const insidenFiltered = insiden.filter(i =>
    !search ||
    i.jenis_insiden?.toLowerCase().includes(search.toLowerCase()) ||
    i.lokasi?.toLowerCase().includes(search.toLowerCase()) ||
    i.pelapor?.nama?.toLowerCase().includes(search.toLowerCase())
  );
  const vakFiltered = vaksinasi.filter(v =>
    !search ||
    v.nama_vaksin?.toLowerCase().includes(search.toLowerCase()) ||
    v.pegawai?.nama?.toLowerCase().includes(search.toLowerCase())
  );
  const mcuFiltered = mcu.filter(m =>
    !search ||
    m.pegawai?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    m.hasil_umum?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const totalInsiden = stats?.total_tahun_ini ?? insiden.length;
  const beratInsiden = (stats?.per_keparahan?.Berat ?? 0) + (stats?.per_keparahan?.Fatal ?? 0);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">K3RS — Keselamatan & Kesehatan Kerja</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 1/1970 · Permenkes No. 66/2016 (K3RS) · UU No. 44/2009 Pasal 40</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: `Total Insiden K3 (${stats?.tahun ?? new Date().getFullYear()})`, value: totalInsiden, sub: `${beratInsiden} kasus berat/fatal`, color: 'text-red-600' },
          { label: 'Proses Investigasi', value: insiden.filter(i => !['Selesai','Ditutup'].includes(i.status_investigasi)).length, sub: 'Belum selesai', color: 'text-orange-600' },
          { label: 'Coverage Vaksinasi', value: coverage ? `${coverage.data?.[0]?.persen ?? 0}%` : '—', sub: coverage?.total_aktif ? `dari ${coverage.total_aktif} pegawai aktif` : 'Lihat tab Vaksinasi', color: 'text-green-600' },
          { label: 'MCU Coverage (12 bln)', value: mcuSummary ? `${mcuSummary.coverage_persen}%` : '—', sub: mcuSummary ? `${mcuSummary.belum_mcu} belum MCU` : 'Lihat tab MCU', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {([
            { key: 'insiden' as TabType, label: 'Laporan Insiden', count: insiden.length },
            { key: 'vaksinasi' as TabType, label: 'Vaksinasi', count: vaksinasi.length },
            { key: 'mcu' as TabType, label: 'Medical Check-Up', count: mcu.length },
          ]).map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); }}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => { if (activeTab === 'insiden') { loadInsiden(); loadStats(); } else if (activeTab === 'vaksinasi') { loadVaksinasi(); loadCoverage(); } else { loadMCU(); loadMcuSummary(); } }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ─── INSIDEN TABLE ─── */}
        {activeTab === 'insiden' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal & Lokasi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis Insiden</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Pelapor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Keparahan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {loading && insidenFiltered.length === 0
                  ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Memuat data...</td></tr>
                  : insidenFiltered.length === 0
                  ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada data insiden</td></tr>
                  : insidenFiltered.map(i => (
                    <tr key={i.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailInsiden(i)}>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800">{fmtDate(i.tanggal_insiden)}</p>
                        <p className="text-xs text-gray-400">{i.lokasi}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">{i.jenis_insiden}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{i.pelapor?.nama ?? '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge label={i.tingkat_keparahan} cls={KEPARAHAN_BADGE[i.tingkat_keparahan] ?? 'bg-gray-100 text-gray-600'} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge label={i.status_investigasi} cls={STATUS_INV_BADGE[i.status_investigasi] ?? 'bg-gray-100 text-gray-600'} />
                      </td>
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailInsiden(i)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(i)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── VAKSINASI ─── */}
        {activeTab === 'vaksinasi' && (
          <>
            {/* Coverage summary */}
            {coverage?.data?.length > 0 && (
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Coverage per Vaksin (dari {coverage.total_aktif} pegawai aktif)</p>
                <div className="flex flex-wrap gap-3">
                  {coverage.data.map((c: any) => (
                    <div key={c.nama_vaksin} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                      <p className="font-medium text-gray-700">{c.nama_vaksin}</p>
                      <p className="text-gray-500">{c.selesai} selesai · <span className="font-semibold text-green-600">{c.persen}%</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Vaksin</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Dosis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tanggal</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {vakFiltered.length === 0
                    ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada data</td></tr>
                    : vakFiltered.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800">{v.pegawai?.nama ?? '—'}</p>
                          <p className="text-xs text-gray-400">{v.pegawai?.unit_kerja}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-700">{v.nama_vaksin}</td>
                        <td className="px-4 py-3.5 text-center text-xs font-medium">{v.dosis}x</td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{fmtDate(v.tanggal_vaksinasi)}</td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge label={v.status} cls={VAK_STATUS_BADGE[v.status] ?? 'bg-gray-100 text-gray-600'} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(v)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteTarget({ id: v.id, tab: 'vaksinasi' })} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ─── MCU ─── */}
        {activeTab === 'mcu' && (
          <>
            {/* MCU Summary */}
            {mcuSummary && (
              <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-xs">
                    <span className="text-gray-500">Coverage 12 bulan: </span>
                    <span className={`font-bold ${mcuSummary.coverage_persen >= 80 ? 'text-green-600' : 'text-red-600'}`}>{mcuSummary.coverage_persen}%</span>
                    <span className="text-gray-400 ml-1">({mcuSummary.sudah_mcu}/{mcuSummary.total_aktif} pegawai)</span>
                  </div>
                  {Object.entries(mcuSummary.breakdown_hasil ?? {}).map(([k, v]: any) => (
                    <Badge key={k} label={`${k}: ${v}`} cls={HASIL_MCU_BADGE[k] ?? 'bg-gray-100 text-gray-600'} />
                  ))}
                </div>
                {mcuSummary.tanpa_mcu?.length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Pegawai belum MCU dalam 12 bulan terakhir ({mcuSummary.belum_mcu} total, menampilkan {mcuSummary.tanpa_mcu.length}):</p>
                    <p className="text-xs text-amber-600">{mcuSummary.tanpa_mcu.map((p: any) => p.nama).join(', ')}</p>
                  </div>
                )}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal MCU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Fasilitas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Catatan Dokter</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Hasil</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {mcuFiltered.length === 0
                    ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada data</td></tr>
                    : mcuFiltered.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800">{m.pegawai?.nama ?? '—'}</p>
                          <p className="text-xs text-gray-400">{m.pegawai?.jabatan}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-700">{fmtDate(m.tanggal_mcu)}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{m.fasilitas_kesehatan || '—'}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500 max-w-xs truncate">{m.catatan_dokter || '—'}</td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge label={m.hasil_umum} cls={HASIL_MCU_BADGE[m.hasil_umum] ?? 'bg-gray-100 text-gray-600'} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteTarget({ id: m.id, tab: 'mcu' })} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ─── ADD/EDIT MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                {editItem ? 'Edit' : 'Tambah'} {activeTab === 'insiden' ? 'Laporan Insiden' : activeTab === 'vaksinasi' ? 'Vaksinasi' : 'Data MCU'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">

              {/* INSIDEN FORM */}
              {activeTab === 'insiden' && (
                <>
                  {/* When editing an insiden, only allow status update */}
                  {editItem ? (
                    <>
                      <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status Investigasi</label>
                        <select value={editItem.status_investigasi} onChange={e => setEditItem({ ...editItem, status_investigasi: e.target.value })}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {['Dilaporkan', 'Sedang Diinvestigasi', 'Selesai', 'Ditutup'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Penanganan Awal</label>
                        <textarea rows={3} value={formInsiden.penanganan_awal} onChange={e => setFormInsiden(f => ({ ...f, penanganan_awal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal *</label>
                          <input type="date" value={formInsiden.tanggal_insiden} onChange={e => setFormInsiden(f => ({ ...f, tanggal_insiden: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jam *</label>
                          <input type="time" value={formInsiden.jam_insiden} onChange={e => setFormInsiden(f => ({ ...f, jam_insiden: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Insiden *</label>
                        <select value={formInsiden.jenis_insiden} onChange={e => setFormInsiden(f => ({ ...f, jenis_insiden: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {JENIS_INSIDEN.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                      </div>
                      <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Lokasi *</label>
                        <input value={formInsiden.lokasi} onChange={e => setFormInsiden(f => ({ ...f, lokasi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tingkat Keparahan</label>
                        <select value={formInsiden.tingkat_keparahan} onChange={e => setFormInsiden(f => ({ ...f, tingkat_keparahan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {['Ringan', 'Sedang', 'Berat', 'Fatal'].map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Kronologi *</label>
                        <textarea rows={3} value={formInsiden.kronologi} onChange={e => setFormInsiden(f => ({ ...f, kronologi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                      </div>
                      <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Penanganan Awal *</label>
                        <textarea rows={2} value={formInsiden.penanganan_awal} onChange={e => setFormInsiden(f => ({ ...f, penanganan_awal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="korban_jiwa" checked={formInsiden.korban_jiwa} onChange={e => setFormInsiden(f => ({ ...f, korban_jiwa: e.target.checked }))} className="w-4 h-4 rounded border-gray-300" />
                        <label htmlFor="korban_jiwa" className="text-sm text-gray-700">Ada korban jiwa</label>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* VAKSINASI FORM */}
              {activeTab === 'vaksinasi' && (
                <>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">ID Pegawai *</label>
                    <input value={formVak.pegawai_id} onChange={e => setFormVak(f => ({ ...f, pegawai_id: e.target.value }))} placeholder="ID pegawai" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nama Vaksin *</label>
                    <select value={formVak.nama_vaksin} onChange={e => setFormVak(f => ({ ...f, nama_vaksin: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Pilih --</option>
                      {['Hepatitis B', 'COVID-19', 'Influenza', 'Tetanus', 'MMR', 'Tifoid'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal *</label>
                      <input type="date" value={formVak.tanggal_vaksinasi} onChange={e => setFormVak(f => ({ ...f, tanggal_vaksinasi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Dosis</label>
                      <input type="number" min={1} value={formVak.dosis} onChange={e => setFormVak(f => ({ ...f, dosis: parseInt(e.target.value) }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                    <select value={formVak.status} onChange={e => setFormVak(f => ({ ...f, status: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Dijadwalkan', 'Selesai', 'Ditunda'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Lokasi Vaksinasi</label>
                    <input value={formVak.lokasi_vaksinasi} onChange={e => setFormVak(f => ({ ...f, lokasi_vaksinasi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </>
              )}

              {/* MCU FORM */}
              {activeTab === 'mcu' && (
                <>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">ID Pegawai *</label>
                    <input value={formMCU.pegawai_id} onChange={e => setFormMCU(f => ({ ...f, pegawai_id: e.target.value }))} placeholder="ID pegawai" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal MCU *</label>
                      <input type="date" value={formMCU.tanggal_mcu} onChange={e => setFormMCU(f => ({ ...f, tanggal_mcu: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Hasil Umum</label>
                      <select value={formMCU.hasil_umum} onChange={e => setFormMCU(f => ({ ...f, hasil_umum: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {['Sehat', 'Perlu Tindak Lanjut', 'Tidak Sehat'].map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Fasilitas Kesehatan</label>
                    <input value={formMCU.fasilitas_kesehatan} onChange={e => setFormMCU(f => ({ ...f, fasilitas_kesehatan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan Dokter</label>
                    <textarea rows={2} value={formMCU.catatan_dokter} onChange={e => setFormMCU(f => ({ ...f, catatan_dokter: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editItem ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAIL INSIDEN MODAL ─── */}
      {detailInsiden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailInsiden(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Insiden K3RS</h2>
              <button onClick={() => setDetailInsiden(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-xl border ${detailInsiden.tingkat_keparahan === 'Fatal' ? 'bg-red-50 border-red-200' : detailInsiden.tingkat_keparahan === 'Berat' ? 'bg-orange-50 border-orange-100' : detailInsiden.tingkat_keparahan === 'Sedang' ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{detailInsiden.jenis_insiden}</span>
                  <Badge label={detailInsiden.tingkat_keparahan} cls={KEPARAHAN_BADGE[detailInsiden.tingkat_keparahan] ?? 'bg-gray-100 text-gray-600'} />
                </div>
                <p className="text-xs text-gray-500">{fmtDate(detailInsiden.tanggal_insiden)} {detailInsiden.jam_insiden} · {detailInsiden.lokasi}</p>
                {detailInsiden.pelapor && <p className="text-xs text-gray-400 mt-1">Pelapor: {detailInsiden.pelapor.nama}</p>}
              </div>
              <div><p className="text-xs text-gray-400 mb-1">Kronologi</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detailInsiden.kronologi}</p></div>
              {detailInsiden.penanganan_awal && <div><p className="text-xs text-gray-400 mb-1">Penanganan Awal</p><p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-100">{detailInsiden.penanganan_awal}</p></div>}
              {detailInsiden.korban_jiwa && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertTriangle className="w-4 h-4" /><span className="font-medium">Ada korban jiwa</span></div>}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Status Investigasi</p>
                  <Badge label={detailInsiden.status_investigasi} cls={`mt-1 inline-block ${STATUS_INV_BADGE[detailInsiden.status_investigasi] ?? 'bg-gray-100 text-gray-600'}`} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setDetailInsiden(null); openEdit(detailInsiden); }} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Edit Status</button>
              <button onClick={() => setDetailInsiden(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Hapus Data?</h3>
            <p className="text-sm text-gray-500 mb-4">Data ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
