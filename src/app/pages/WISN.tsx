import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart2, Plus, Edit2, Trash2, X, AlertTriangle,
  CheckCircle, TrendingDown, TrendingUp, Search, Info,
  Sparkles, ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

// ─── Types ────────────────────────────────────────────────────────────────────
type JenisAktivitas = 'Langsung' | 'Tidak Langsung' | 'Kelonggaran';
type StatusWisn = 'Kekurangan' | 'Cukup' | 'Kelebihan';

interface Aktivitas {
  nama: string;
  jenis: JenisAktivitas;
  standar_waktu_menit: number;
  kuantitas_setahun: number;
}

interface WisnRecord {
  id: number;
  unit_kerja: string;
  jabatan_kategori: string;
  periode: string;
  hari_kerja: number;
  cuti_tahunan: number;
  hari_diklat: number;
  hari_libur_nasional: number;
  hari_tidak_hadir: number;
  jam_kerja_per_hari: number;
  wkt_menit: number;
  aktivitas: Aktivitas[];
  kebutuhan_sdmk: number;
  jumlah_aktual: number;
  wisn_ratio: number;
  status: StatusWisn;
  catatan?: string;
}

// ─── Preset aktivitas per jabatan ─────────────────────────────────────────────
const PRESET_AKTIVITAS: Record<string, Aktivitas[]> = {
  'Perawat': [
    { nama: 'Pengkajian keperawatan', jenis: 'Langsung', standar_waktu_menit: 20, kuantitas_setahun: 4800 },
    { nama: 'Tindakan keperawatan langsung', jenis: 'Langsung', standar_waktu_menit: 30, kuantitas_setahun: 7200 },
    { nama: 'Pemberian obat', jenis: 'Langsung', standar_waktu_menit: 10, kuantitas_setahun: 9600 },
    { nama: 'Pendokumentasian asuhan', jenis: 'Tidak Langsung', standar_waktu_menit: 15, kuantitas_setahun: 4800 },
    { nama: 'Operan / serah terima shift', jenis: 'Tidak Langsung', standar_waktu_menit: 30, kuantitas_setahun: 730 },
    { nama: 'Rapat dan koordinasi', jenis: 'Kelonggaran', standar_waktu_menit: 2880, kuantitas_setahun: 0 },
  ],
  'Dokter Umum': [
    { nama: 'Anamnesis & pemeriksaan fisik', jenis: 'Langsung', standar_waktu_menit: 20, kuantitas_setahun: 3600 },
    { nama: 'Tindakan medis rawat jalan', jenis: 'Langsung', standar_waktu_menit: 15, kuantitas_setahun: 2400 },
    { nama: 'Visite rawat inap', jenis: 'Langsung', standar_waktu_menit: 10, kuantitas_setahun: 3000 },
    { nama: 'Penulisan rekam medis', jenis: 'Tidak Langsung', standar_waktu_menit: 10, kuantitas_setahun: 6000 },
    { nama: 'Rapat dan continuing education', jenis: 'Kelonggaran', standar_waktu_menit: 3600, kuantitas_setahun: 0 },
  ],
  'Bidan': [
    { nama: 'Pemeriksaan ANC', jenis: 'Langsung', standar_waktu_menit: 30, kuantitas_setahun: 2400 },
    { nama: 'Pertolongan persalinan', jenis: 'Langsung', standar_waktu_menit: 180, kuantitas_setahun: 600 },
    { nama: 'Asuhan nifas & BBL', jenis: 'Langsung', standar_waktu_menit: 20, kuantitas_setahun: 1800 },
    { nama: 'Dokumentasi asuhan', jenis: 'Tidak Langsung', standar_waktu_menit: 15, kuantitas_setahun: 3000 },
    { nama: 'Rapat dan koordinasi', jenis: 'Kelonggaran', standar_waktu_menit: 2400, kuantitas_setahun: 0 },
  ],
  'Apoteker': [
    { nama: 'Skrining resep', jenis: 'Langsung', standar_waktu_menit: 5, kuantitas_setahun: 18000 },
    { nama: 'Dispensing & peracikan', jenis: 'Langsung', standar_waktu_menit: 10, kuantitas_setahun: 12000 },
    { nama: 'Konseling obat', jenis: 'Langsung', standar_waktu_menit: 10, kuantitas_setahun: 3600 },
    { nama: 'Dokumentasi & administrasi', jenis: 'Tidak Langsung', standar_waktu_menit: 15, kuantitas_setahun: 3000 },
    { nama: 'Rapat farmasi & terapi', jenis: 'Kelonggaran', standar_waktu_menit: 2880, kuantitas_setahun: 0 },
  ],
};

// ─── WISN Calculator (client-side, matches backend logic) ─────────────────────
function hitungWisn(form: Omit<WisnRecord, 'id' | 'wkt_menit' | 'kebutuhan_sdmk' | 'wisn_ratio' | 'status'>): {
  wkt_menit: number; kebutuhan_sdmk: number; wisn_ratio: number | null; status: StatusWisn | null;
} {
  const hariEfektif = Math.max(0,
    form.hari_kerja - form.cuti_tahunan - form.hari_diklat - form.hari_libur_nasional - form.hari_tidak_hadir
  );
  const wkt = hariEfektif * form.jam_kerja_per_hari * 60;

  if (wkt <= 0) return { wkt_menit: 0, kebutuhan_sdmk: 0, wisn_ratio: null, status: null };

  let totalPokok = 0;
  let totalKelonggaran = 0;

  for (const a of form.aktivitas) {
    if (a.standar_waktu_menit <= 0) continue;
    if (a.jenis === 'Kelonggaran') {
      totalKelonggaran += a.standar_waktu_menit / wkt;
    } else {
      const sbk = wkt / a.standar_waktu_menit;
      if (sbk > 0) totalPokok += a.kuantitas_setahun / sbk;
    }
  }

  const kebutuhan = Math.round((totalPokok + totalKelonggaran) * 100) / 100;
  const ratio = kebutuhan > 0 ? Math.round((form.jumlah_aktual / kebutuhan) * 100) / 100 : null;
  const status: StatusWisn | null = ratio == null ? null
    : ratio < 0.80 ? 'Kekurangan'
    : ratio > 1.20 ? 'Kelebihan'
    : 'Cukup';

  return { wkt_menit: Math.round(wkt), kebutuhan_sdmk: kebutuhan, wisn_ratio: ratio, status };
}

// ─── Config ───────────────────────────────────────────────────────────────────
const statusCfg: Record<StatusWisn, { bg: string; color: string; icon: React.ElementType; label: string }> = {
  'Kekurangan': { bg: 'bg-red-100',    color: 'text-red-700',    icon: TrendingDown, label: 'Kekurangan' },
  'Cukup':      { bg: 'bg-green-100',  color: 'text-green-700',  icon: CheckCircle,  label: 'Cukup' },
  'Kelebihan':  { bg: 'bg-blue-100',   color: 'text-blue-700',   icon: TrendingUp,   label: 'Kelebihan' },
};

const jenisCfg: Record<JenisAktivitas, string> = {
  'Langsung':       'bg-teal-50 text-teal-700',
  'Tidak Langsung': 'bg-indigo-50 text-indigo-700',
  'Kelonggaran':    'bg-orange-50 text-orange-700',
};

const TAHUN_LIST = ['2024', '2025', '2026', '2027'];

// ─── Default form ──────────────────────────────────────────────────────────────
const defaultForm = (): Omit<WisnRecord, 'id' | 'wkt_menit' | 'kebutuhan_sdmk' | 'wisn_ratio' | 'status'> => ({
  unit_kerja: '',
  jabatan_kategori: '',
  periode: String(new Date().getFullYear()),
  hari_kerja: 260,
  cuti_tahunan: 12,
  hari_diklat: 5,
  hari_libur_nasional: 16,
  hari_tidak_hadir: 10,
  jam_kerja_per_hari: 8,
  aktivitas: [],
  jumlah_aktual: 0,
  catatan: '',
});

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WISN() {
  const qc = useQueryClient();

  const [filterUnit, setFilterUnit]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]             = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editData, setEditData]         = useState<WisnRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [form, setForm]                 = useState(defaultForm);

  // Queries
  const { data: summaryData } = useQuery({
    queryKey: ['wisn-summary'],
    queryFn: () => http.get('/wisn/summary').then(r => r.data.data),
    staleTime: 60000,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['wisn', filterUnit, filterStatus],
    queryFn: () => http.get('/wisn', {
      params: {
        ...(filterUnit   ? { unit_kerja: filterUnit }  : {}),
        ...(filterStatus ? { status: filterStatus }    : {}),
      },
    }).then(r => r.data.data),
    staleTime: 30000,
  });

  // Saran WKT dari data eksisting
  const { data: saranData, refetch: fetchSaran, isFetching: loadingSaran } = useQuery({
    queryKey: ['wisn-saran', form.unit_kerja, form.periode],
    queryFn: () => http.get('/wisn/saran-wkt', {
      params: { unit_kerja: form.unit_kerja, tahun: form.periode },
    }).then(r => r.data.data),
    enabled: false,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (d: any) => editData
      ? http.put(`/wisn/${editData.id}`, d).then(r => r.data)
      : http.post('/wisn', d).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wisn'] });
      qc.invalidateQueries({ queryKey: ['wisn-summary'] });
      toast.success(editData ? 'Data WISN diperbarui' : 'Perhitungan WISN disimpan');
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menyimpan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => http.delete(`/wisn/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wisn'] });
      qc.invalidateQueries({ queryKey: ['wisn-summary'] });
      toast.success('Data dihapus');
      setShowDeleteConfirm(null);
    },
    onError: () => toast.error('Gagal menghapus'),
  });

  const records: WisnRecord[] = useMemo(() => {
    const raw = (listData ?? []) as WisnRecord[];
    if (!search) return raw;
    const q = search.toLowerCase();
    return raw.filter(r =>
      r.unit_kerja.toLowerCase().includes(q) ||
      r.jabatan_kategori.toLowerCase().includes(q) ||
      r.periode.includes(q)
    );
  }, [listData, search]);

  // Live calculation preview
  const liveResult = useMemo(() => hitungWisn(form), [form]);

  function openAdd() {
    setEditData(null);
    setForm(defaultForm());
    setShowModal(true);
  }

  function openEdit(r: WisnRecord) {
    setEditData(r);
    setForm({
      unit_kerja: r.unit_kerja,
      jabatan_kategori: r.jabatan_kategori,
      periode: r.periode,
      hari_kerja: r.hari_kerja,
      cuti_tahunan: r.cuti_tahunan,
      hari_diklat: r.hari_diklat,
      hari_libur_nasional: r.hari_libur_nasional,
      hari_tidak_hadir: r.hari_tidak_hadir,
      jam_kerja_per_hari: r.jam_kerja_per_hari,
      aktivitas: r.aktivitas ?? [],
      jumlah_aktual: r.jumlah_aktual,
      catatan: r.catatan ?? '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditData(null);
  }

  function applyPreset(jabatan: string) {
    const preset = PRESET_AKTIVITAS[jabatan];
    if (preset) setForm(f => ({ ...f, jabatan_kategori: jabatan, aktivitas: [...preset] }));
  }

  function applySaran() {
    if (!saranData) { fetchSaran(); return; }
    setForm(f => ({
      ...f,
      cuti_tahunan: saranData.cuti_tahunan,
      hari_diklat: saranData.hari_diklat,
      hari_tidak_hadir: saranData.hari_tidak_hadir,
    }));
    toast.success('WKT diisi dari data sistem');
  }

  const addAktivitas = useCallback(() => {
    setForm(f => ({
      ...f,
      aktivitas: [...f.aktivitas, { nama: '', jenis: 'Langsung', standar_waktu_menit: 0, kuantitas_setahun: 0 }],
    }));
  }, []);

  const updateAktivitas = useCallback((i: number, field: keyof Aktivitas, val: any) => {
    setForm(f => {
      const a = [...f.aktivitas];
      a[i] = { ...a[i], [field]: val };
      return { ...f, aktivitas: a };
    });
  }, []);

  const removeAktivitas = useCallback((i: number) => {
    setForm(f => ({ ...f, aktivitas: f.aktivitas.filter((_, idx) => idx !== i) }));
  }, []);

  function handleSave() {
    if (!form.unit_kerja) { toast.error('Unit kerja wajib diisi'); return; }
    if (!form.jabatan_kategori) { toast.error('Jabatan/kategori wajib diisi'); return; }
    saveMutation.mutate({
      ...form,
      catatan: form.catatan || undefined,
    });
  }

  const liveStatus = liveResult.status;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            WISN — Analisis Kebutuhan Tenaga
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Workload Indicators of Staffing Need · Permenkes RI · Metodologi WHO
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" /> Hitung WISN
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Unit Dihitung', value: summaryData?.total ?? '—',      color: 'text-gray-800' },
          { label: 'Kekurangan Tenaga',   value: summaryData?.kekurangan ?? '—', color: 'text-red-600' },
          { label: 'Kebutuhan Terpenuhi', value: summaryData?.cukup ?? '—',      color: 'text-green-700' },
          { label: 'Kelebihan Tenaga',    value: summaryData?.kelebihan ?? '—',  color: 'text-blue-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Unit kritis */}
      {summaryData?.kritis?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Unit dengan Rasio WISN Terendah
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {summaryData.kritis.map((k: any, i: number) => (
              <div key={i} className="bg-white border border-red-100 rounded-lg px-3 py-2 text-xs">
                <p className="font-medium text-gray-800">{k.unit_kerja}</p>
                <p className="text-gray-500">{k.jabatan_kategori}</p>
                <p className="mt-1 text-red-700 font-semibold">
                  Rasio {k.wisn_ratio} · Butuh {k.kebutuhan_sdmk}, Ada {k.jumlah_aktual}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari unit, jabatan, periode..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Semua Status</option>
            <option value="Kekurangan">Kekurangan</option>
            <option value="Cukup">Cukup</option>
            <option value="Kelebihan">Kelebihan</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Unit Kerja</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jabatan / Kategori</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Periode</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Kebutuhan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aktual</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Rasio WISN</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-sm">Memuat data...</td></tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <BarChart2 className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">Belum ada perhitungan WISN</p>
                    <p className="text-xs text-gray-300 mt-1">Klik "Hitung WISN" untuk mulai</p>
                  </td>
                </tr>
              ) : records.map(r => {
                const sc = r.status ? statusCfg[r.status] : null;
                const Icon = sc?.icon;
                const selisih = r.jumlah_aktual - r.kebutuhan_sdmk;
                return (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">{r.unit_kerja}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs">{r.jabatan_kategori}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{r.periode}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-gray-800">{r.kebutuhan_sdmk}</td>
                    <td className="px-4 py-3.5 text-center text-gray-700">{r.jumlah_aktual}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-bold ${r.wisn_ratio < 0.80 ? 'text-red-600' : r.wisn_ratio > 1.20 ? 'text-blue-600' : 'text-green-600'}`}>
                        {r.wisn_ratio}
                      </span>
                      {selisih !== 0 && (
                        <p className={`text-[10px] ${selisih < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {selisih > 0 ? '+' : ''}{Math.round(selisih * 10) / 10} orang
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {sc && Icon && (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                          <Icon className="w-3 h-3" />{sc.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowDeleteConfirm(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panduan */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 space-y-1">
            <p className="font-semibold">Formula WISN (Permenkes RI)</p>
            <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-emerald-700">
              <span><ChevronRight className="w-3 h-3 inline" /> WKT = (A−B−C−D−E) × F × 60 menit</span>
              <span><ChevronRight className="w-3 h-3 inline" /> SBK = WKT ÷ Standar Waktu Kegiatan</span>
              <span><ChevronRight className="w-3 h-3 inline" /> Kebutuhan = Σ(Kuantitas÷SBK) + Standar Kelonggaran</span>
              <span><ChevronRight className="w-3 h-3 inline" /> Rasio &lt; 0.8 = Kekurangan · &gt; 1.2 = Kelebihan</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-600" />
                {editData ? 'Edit Perhitungan WISN' : 'Hitung Kebutuhan Tenaga (WISN)'}
              </h2>
              {/* Live result preview */}
              {liveResult.status && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${statusCfg[liveResult.status].bg} ${statusCfg[liveResult.status].color}`}>
                  Kebutuhan: <strong>{liveResult.kebutuhan_sdmk}</strong>
                  &nbsp;· Rasio: <strong>{liveResult.wisn_ratio}</strong>
                  &nbsp;· {liveResult.status}
                </div>
              )}
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg ml-2"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Identitas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Unit Kerja <span className="text-red-500">*</span></label>
                  <input value={form.unit_kerja} onChange={e => setForm(f => ({ ...f, unit_kerja: e.target.value }))} placeholder="cth: Instalasi Rawat Inap, IGD, ICU..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Periode <span className="text-red-500">*</span></label>
                  <select value={form.periode} onChange={e => setForm(f => ({ ...f, periode: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {TAHUN_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan / Kategori SDMK <span className="text-red-500">*</span></label>
                  <input value={form.jabatan_kategori} onChange={e => setForm(f => ({ ...f, jabatan_kategori: e.target.value }))} placeholder="cth: Perawat Vokasional, Dokter Spesialis Bedah..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jumlah Aktual</label>
                  <input type="number" min="0" value={form.jumlah_aktual} onChange={e => setForm(f => ({ ...f, jumlah_aktual: parseInt(e.target.value) || 0 }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* WKT */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-700">
                    Komponen WKT (Waktu Kerja Tersedia)
                    {form.wkt_menit > 0 && <span className="ml-2 text-gray-400 font-normal">→ {Math.round((form.hari_kerja - form.cuti_tahunan - form.hari_diklat - form.hari_libur_nasional - form.hari_tidak_hadir) * form.jam_kerja_per_hari * 60).toLocaleString()} menit/tahun</span>}
                  </p>
                  <button onClick={applySaran} disabled={loadingSaran} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg">
                    <Sparkles className="w-3 h-3" />{loadingSaran ? 'Memuat...' : 'Isi dari data sistem'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { key: 'hari_kerja',          label: 'A. Hari Kerja/Tahun' },
                    { key: 'cuti_tahunan',         label: 'B. Cuti Tahunan' },
                    { key: 'hari_diklat',          label: 'C. Hari Diklat' },
                    { key: 'hari_libur_nasional',  label: 'D. Libur Nasional' },
                    { key: 'hari_tidak_hadir',     label: 'E. Absensi/Sakit' },
                    { key: 'jam_kerja_per_hari',   label: 'F. Jam Kerja/Hari' },
                  ] as { key: keyof typeof form; label: string }[]).map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-gray-600 block mb-1.5">{label}</label>
                      <input
                        type="number" min="0" step={key === 'jam_kerja_per_hari' ? '0.5' : '1'}
                        value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Aktivitas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-700">Daftar Aktivitas</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Preset:</span>
                    {Object.keys(PRESET_AKTIVITAS).map(k => (
                      <button key={k} onClick={() => applyPreset(k)} className="text-xs border border-gray-200 px-2 py-0.5 rounded hover:bg-gray-50">{k}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Header row */}
                  {form.aktivitas.length > 0 && (
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-400 px-1">
                      <span className="col-span-4">Nama Aktivitas</span>
                      <span className="col-span-2">Jenis</span>
                      <span className="col-span-2 text-center">Std. Waktu (mnt)</span>
                      <span className="col-span-3 text-center">Kuantitas/Tahun</span>
                      <span className="col-span-1"></span>
                    </div>
                  )}
                  {form.aktivitas.map((a, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        value={a.nama}
                        onChange={e => updateAktivitas(i, 'nama', e.target.value)}
                        placeholder="Nama kegiatan"
                        className="col-span-4 text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <select
                        value={a.jenis}
                        onChange={e => updateAktivitas(i, 'jenis', e.target.value)}
                        className="col-span-2 text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      >
                        <option value="Langsung">Langsung</option>
                        <option value="Tidak Langsung">Tidak Langsung</option>
                        <option value="Kelonggaran">Kelonggaran</option>
                      </select>
                      <input
                        type="number" min="0" step="1"
                        value={a.standar_waktu_menit}
                        onChange={e => updateAktivitas(i, 'standar_waktu_menit', parseFloat(e.target.value) || 0)}
                        className="col-span-2 text-xs border border-gray-200 rounded-lg px-2 py-2 text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <input
                        type="number" min="0"
                        value={a.kuantitas_setahun}
                        disabled={a.jenis === 'Kelonggaran'}
                        onChange={e => updateAktivitas(i, 'kuantitas_setahun', parseFloat(e.target.value) || 0)}
                        className="col-span-3 text-xs border border-gray-200 rounded-lg px-2 py-2 text-center focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <button onClick={() => removeAktivitas(i)} className="col-span-1 p-1.5 text-red-400 hover:bg-red-50 rounded-lg flex justify-center">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addAktivitas} className="w-full py-2 border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-emerald-300 hover:text-emerald-600 rounded-lg transition-colors flex items-center justify-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Tambah Aktivitas
                  </button>
                </div>

                {/* Jenis legend */}
                <div className="flex gap-3 mt-2">
                  {(Object.entries(jenisCfg) as [JenisAktivitas, string][]).map(([j, cls]) => (
                    <span key={j} className={`text-[10px] px-2 py-0.5 rounded font-medium ${cls}`}>{j}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Catatan</label>
                <textarea rows={2} value={form.catatan ?? ''} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Asumsi atau catatan perhitungan..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <div><p className="font-semibold text-gray-800">Hapus Perhitungan?</p><p className="text-xs text-gray-500 mt-0.5">Tindakan ini tidak dapat dibatalkan</p></div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={() => deleteMutation.mutate(showDeleteConfirm!)} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
