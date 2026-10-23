import React, { useState, useMemo, useCallback } from 'react';
import {
  Clock, Download, ChevronLeft, ChevronRight, AlertCircle, Plus,
  Edit2, Trash2, Save, X, Calendar, Search, TrendingUp, Upload,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { absensiApi, laporanBKDApi, exportApi } from '../data/api';
import { usePegawai } from '../hooks';
import { downloadBlob } from '../lib/downloadBlob';
import type { AbsensiRecord } from '../types';
import { toast } from 'sonner';

// Map snake_case API response → camelCase AbsensiRecord
function mapRecord(r: any): AbsensiRecord & { pegawaiNama?: string; pegawaiJabatan?: string; pegawaiUnitKerja?: string } {
  return {
    id:         String(r.id),
    pegawaiId:  String(r.pegawai_id),
    tanggal:    typeof r.tanggal === 'string' ? r.tanggal.slice(0, 10) : r.tanggal,
    jamMasuk:   r.jam_masuk  ?? undefined,
    jamKeluar:  r.jam_keluar ?? undefined,
    status:     r.status,
    keterangan: r.keterangan ?? undefined,
    pegawaiNama:      r.pegawai?.nama,
    pegawaiJabatan:   r.pegawai?.jabatan,
    pegawaiUnitKerja: r.pegawai?.unit_kerja,
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; dot: string;
  border: string; rowBg: string; selectBg: string;
}> = {
  'Hadir':      { label: 'Hadir',      color: 'text-green-700',  bg: 'bg-green-100',  dot: 'bg-green-500',  border: 'border-green-300',  rowBg: '',               selectBg: 'bg-green-50' },
  'Izin':       { label: 'Izin',       color: 'text-blue-700',   bg: 'bg-blue-100',   dot: 'bg-blue-500',   border: 'border-blue-300',   rowBg: 'bg-blue-50/50',   selectBg: 'bg-blue-50' },
  'Sakit':      { label: 'Sakit',      color: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500', border: 'border-yellow-300', rowBg: 'bg-yellow-50/50', selectBg: 'bg-yellow-50' },
  'Cuti':       { label: 'Cuti',       color: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-500', border: 'border-purple-300', rowBg: 'bg-purple-50/50', selectBg: 'bg-purple-50' },
  'Alpha':      { label: 'Alpha',      color: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500',    border: 'border-red-300',    rowBg: 'bg-red-50/50',    selectBg: 'bg-red-50' },
  'Libur':      { label: 'Libur',      color: 'text-gray-500',   bg: 'bg-gray-100',   dot: 'bg-gray-400',   border: 'border-gray-300',   rowBg: 'bg-gray-50/80',   selectBg: 'bg-gray-50' },
  'Dinas Luar': { label: 'Dinas Luar', color: 'text-indigo-700', bg: 'bg-indigo-100', dot: 'bg-indigo-500', border: 'border-indigo-300', rowBg: 'bg-indigo-50/50', selectBg: 'bg-indigo-50' },
};

const STATUS_LIST: AbsensiRecord['status'][] = ['Hadir', 'Izin', 'Sakit', 'Cuti', 'Alpha', 'Libur', 'Dinas Luar'];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-600', 'bg-orange-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-600', 'bg-red-500',
  'bg-cyan-600', 'bg-emerald-600', 'bg-violet-500', 'bg-amber-600',
];

// ─── Helper Functions ─────────────────────────────────────────────────────────
function formatDateLong(ds: string): string {
  const d = new Date(ds + 'T00:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
function isWeekend(ds: string): boolean {
  const d = new Date(ds + 'T00:00:00');
  return d.getDay() === 0 || d.getDay() === 6;
}
function isLate(jm?: string): boolean { return !!jm && jm > '08:00'; }
function isEarlyLeave(jk?: string): boolean { return !!jk && jk < '15:30'; }
function getInitials(nama: string): string {
  return nama.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}
function getAvatarColor(id: string): string {
  const n = parseInt(id.replace(/\D/g, '') || '0');
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function adjustDate(ds: string, days: number): string {
  const d = new Date(ds + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function shortUnit(unit: string): string {
  return unit.replace('Instalasi ', 'Inst. ').replace('Sub Bagian ', 'Sub. ').replace('Bidang ', 'Bid. ');
}

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'harian' | 'rekap';

interface ModalForm {
  pegawaiId: string;
  tanggal: string;
  status: AbsensiRecord['status'];
  jamMasuk: string;
  jamKeluar: string;
  keterangan: string;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Alpha'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Absensi() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Real pegawai list for dropdown in modal
  const { data: pegawaiRaw = [] } = usePegawai();
  const pegawai = Array.isArray(pegawaiRaw) ? pegawaiRaw : (pegawaiRaw as any)?.data ?? [];

  // Real daily absensi
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: harianRaw = [], isLoading: harianLoading } = useQuery({
    queryKey: ['absensi-harian', selectedDate],
    queryFn: () => absensiApi.getHarian({ tanggal: selectedDate }),
    staleTime: 30_000,
  });
  const absensi: AbsensiRecord[] = useMemo(
    () => (Array.isArray(harianRaw) ? harianRaw : []).map(mapRecord),
    [harianRaw],
  );

  // Real monthly rekap
  const [rekapMonth, setRekapMonth] = useState(new Date().getMonth());
  const [rekapYear, setRekapYear] = useState(new Date().getFullYear());
  const { data: rekapRaw = [], isLoading: rekapLoading } = useQuery({
    queryKey: ['absensi-rekap', rekapMonth + 1, rekapYear],
    queryFn: () => absensiApi.getAll({ bulan: rekapMonth + 1, tahun: rekapYear }),
    staleTime: 60_000,
  });

  // CRUD mutations
  const createMut = useMutation({
    mutationFn: (d: any) => absensiApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['absensi-harian'] }); toast.success('Data kehadiran berhasil ditambahkan'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal menyimpan'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => absensiApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['absensi-harian'] }); toast.success('Data kehadiran berhasil diperbarui'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal memperbarui'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => absensiApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['absensi-harian'] }); toast.success('Data kehadiran berhasil dihapus'); },
    onError: () => toast.error('Gagal menghapus'),
  });

  const addAbsensi    = (d: Omit<AbsensiRecord, 'id'>) => createMut.mutate({ pegawai_id: d.pegawaiId, tanggal: d.tanggal, status: d.status, jam_masuk: d.jamMasuk, jam_keluar: d.jamKeluar, keterangan: d.keterangan });
  const updateAbsensi = (d: AbsensiRecord) => updateMut.mutate({ id: d.id, data: { status: d.status, jam_masuk: d.jamMasuk, jam_keluar: d.jamKeluar, keterangan: d.keterangan } });
  const deleteAbsensi = (id: string) => { deleteMut.mutate(id); setDeleteConfirmId(null); };

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<TabType>('harian');

  // ── Filters (harian) ──
  const [filterUnit, setFilterUnit] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Modal ──
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AbsensiRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<AbsensiRecord | null>(null);
  const [modalForm, setModalForm] = useState<ModalForm>({
    pegawaiId: '', tanggal: new Date().toISOString().slice(0, 10), status: 'Hadir',
    jamMasuk: '07:30', jamKeluar: '16:00', keterangan: '',
  });

  // ── Rekap filters ──
  const [rekapUnit, setRekapUnit] = useState('');
  const [rekapSearch, setRekapSearch] = useState('');

  // ── Computed: Data Harian ── (absensi is already filtered for selectedDate from API)
  const dateRecords = useMemo(() => absensi, [absensi]);

  // filteredRecords uses nested pegawai info from harian API response (fallback to pegawai list)
  const filteredRecords = useMemo(() => {
    return dateRecords
      .filter(a => {
        const rec = a as any;
        const unitKerja = rec.pegawaiUnitKerja ?? pegawai.find((px: any) => String(px.id) === a.pegawaiId)?.unitKerja;
        return (!filterUnit || unitKerja === filterUnit) && (!filterStatus || a.status === filterStatus);
      })
      .sort((a, b) => {
        const na = (a as any).pegawaiNama ?? pegawai.find((p: any) => String(p.id) === a.pegawaiId)?.nama ?? '';
        const nb = (b as any).pegawaiNama ?? pegawai.find((p: any) => String(p.id) === b.pegawaiId)?.nama ?? '';
        return na.localeCompare(nb);
      });
  }, [dateRecords, pegawai, filterUnit, filterStatus]);

  const dateStats = useMemo(() => ({
    hadir:     dateRecords.filter(a => a.status === 'Hadir').length,
    sakit:     dateRecords.filter(a => a.status === 'Sakit').length,
    izin:      dateRecords.filter(a => a.status === 'Izin').length,
    cuti:      dateRecords.filter(a => a.status === 'Cuti').length,
    alpha:     dateRecords.filter(a => a.status === 'Alpha').length,
    dinasLuar: dateRecords.filter(a => a.status === 'Dinas Luar').length,
    terlambat: dateRecords.filter(a => a.status === 'Hadir' && isLate(a.jamMasuk)).length,
  }), [dateRecords]);

  // ── Computed: Rekap ──
  const workDaysCount = useMemo(() => {
    let c = 0;
    const dim = new Date(rekapYear, rekapMonth + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const dow = new Date(rekapYear, rekapMonth, d).getDay();
      if (dow !== 0 && dow !== 6) c++;
    }
    return c;
  }, [rekapMonth, rekapYear]);

  // Rekap data comes from API already aggregated per pegawai
  const rekapData = useMemo(() => {
    const raw: any[] = Array.isArray(rekapRaw) ? rekapRaw : (rekapRaw as any)?.data ?? [];
    let list = raw;
    if (rekapUnit) list = list.filter((r: any) => r.unit_kerja === rekapUnit);
    if (rekapSearch) {
      const q = rekapSearch.toLowerCase();
      list = list.filter((r: any) => r.nama?.toLowerCase().includes(q) || r.nip?.includes(q));
    }
    return list.map((r: any) => ({
      id: String(r.pegawai_id ?? r.id),
      nama: r.nama ?? '',
      unitKerja: r.unit_kerja ?? '',
      nip: r.nip ?? '',
      hadir:       r.hadir      ?? 0,
      sakit:       r.sakit      ?? 0,
      izin:        r.izin       ?? 0,
      cuti:        r.cuti       ?? 0,
      alpha:       r.alpha      ?? 0,
      dinasLuar:   r.dinas_luar ?? 0,
      terlambat:   r.terlambat  ?? 0,
      hadirEfektif:(r.hadir ?? 0) + (r.dinas_luar ?? 0),
      persen:      r.persen_kehadiran ?? (workDaysCount > 0 ? Math.round(((r.hadir ?? 0) + (r.dinas_luar ?? 0)) / workDaysCount * 100) : 0),
    })).sort((a: any, b: any) => b.hadirEfektif - a.hadirEfektif);
  }, [rekapRaw, rekapUnit, rekapSearch, workDaysCount]);

  const uniqueUnits = useMemo(() =>
    [...new Set(pegawai.map((p: any) => p.unit_kerja ?? p.unitKerja).filter(Boolean))].sort() as string[],
    [pegawai]
  );

  // ── Handlers ──
  const prevDay = () => setSelectedDate(d => adjustDate(d, -1));
  const nextDay = () => setSelectedDate(d => adjustDate(d, 1));

  const prevMonth = () => {
    if (rekapMonth === 0) { setRekapMonth(11); setRekapYear(y => y - 1); }
    else setRekapMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (rekapMonth === 11) { setRekapMonth(0); setRekapYear(y => y + 1); }
    else setRekapMonth(m => m + 1);
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setModalForm({
      pegawaiId: '', tanggal: selectedDate, status: 'Hadir',
      jamMasuk: '07:30', jamKeluar: '16:00', keterangan: '',
    });
    setShowModal(true);
  };

  const openEditModal = useCallback((rec: AbsensiRecord) => {
    setEditingRecord(rec);
    setModalForm({
      pegawaiId: rec.pegawaiId,
      tanggal: rec.tanggal,
      status: rec.status,
      jamMasuk: rec.jamMasuk || '',
      jamKeluar: rec.jamKeluar || '',
      keterangan: rec.keterangan || '',
    });
    setShowModal(true);
  }, []);

  const handleSaveModal = () => {
    if (!modalForm.pegawaiId) { toast.error('Pilih pegawai terlebih dahulu'); return; }
    const needsTime = modalForm.status === 'Hadir' || modalForm.status === 'Dinas Luar';
    const payload: Omit<AbsensiRecord, 'id'> = {
      pegawaiId: modalForm.pegawaiId,
      tanggal: modalForm.tanggal,
      status: modalForm.status,
      jamMasuk:  needsTime && modalForm.jamMasuk  ? modalForm.jamMasuk  : undefined,
      jamKeluar: needsTime && modalForm.jamKeluar ? modalForm.jamKeluar : undefined,
      keterangan: modalForm.keterangan || undefined,
    };
    if (editingRecord) {
      updateAbsensi({ ...payload, id: editingRecord.id });
    } else {
      // server does upsert, so just create
      addAbsensi(payload);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => deleteAbsensi(id);

  const setModalStatus = (s: AbsensiRecord['status']) => {
    setModalForm(f => ({
      ...f,
      status: s,
      jamMasuk: (s === 'Hadir' || s === 'Dinas Luar') ? (f.jamMasuk || '07:30') : '',
      jamKeluar: (s === 'Hadir' || s === 'Dinas Luar') ? (f.jamKeluar || '16:00') : '',
    }));
  };

  // ── Summary cards ──
  const statsCards = [
    { label: 'Hadir',      value: dateStats.hadir,     color: 'text-green-600',  bg: 'bg-green-50 border-green-100' },
    { label: 'Sakit',      value: dateStats.sakit,     color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
    { label: 'Izin',       value: dateStats.izin,      color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100' },
    { label: 'Cuti',       value: dateStats.cuti,      color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
    { label: 'Alpha',      value: dateStats.alpha,     color: 'text-red-600',    bg: 'bg-red-50 border-red-100' },
    { label: 'Dinas Luar', value: dateStats.dinasLuar, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { label: 'Terlambat',  value: dateStats.terlambat, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-gray-800">Presensi & Absensi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDateLong(selectedDate)} · Human Capital Management System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/import-absensi')}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" /> Import Mesin
          </button>
          <button
            onClick={async () => {
              try {
                const res = await laporanBKDApi.rekapAbsensi(rekapMonth + 1, rekapYear);
                downloadBlob(res.data, `rekap-absensi-${MONTH_NAMES[rekapMonth]}-${rekapYear}.xlsx`);
              } catch { toast.error('Gagal export rekap'); }
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Rekap
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
        {statsCards.map(s => (
          <div key={s.label} className={`rounded-xl p-3 border ${s.bg}`}>
            <p className="text-xs text-gray-500 truncate leading-tight">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} leading-tight`}>{s.value}</p>
            <p className="text-xs text-gray-400 truncate">{formatDateLong(selectedDate).split(',')[0]}</p>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'harian', label: 'Data Harian', icon: Calendar },
          { key: 'rekap',  label: 'Rekap Bulanan', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════ TAB: DATA HARIAN ═══════════════════════════ */}
      {activeTab === 'harian' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Date Nav */}
              <div className="flex items-center gap-2">
                <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {formatDateLong(selectedDate)}
                </span>
                {isWeekend(selectedDate) && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Hari Libur</span>
                )}
              </div>
              {/* Filters + Add */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterUnit}
                  onChange={e => setFilterUnit(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-40"
                >
                  <option value="">Semua Unit</option>
                  {uniqueUnits.map(u => <option key={u} value={u}>{shortUnit(u)}</option>)}
                </select>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Status</option>
                  {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Table / Card View */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {harianLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <span className="ml-3 text-sm text-gray-500">Memuat data kehadiran...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Belum ada data kehadiran</p>
                <p className="text-gray-400 text-sm mt-1 max-w-xs">
                  {isWeekend(selectedDate)
                    ? 'Tanggal ini adalah hari Sabtu/Minggu (hari libur)'
                    : 'Belum ada data kehadiran untuk tanggal ini. Gunakan tombol Tambah untuk menambahkan data.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 w-10">No</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nama Pegawai</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Unit Kerja</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Jam Masuk</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Jam Keluar</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Keterangan</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRecords.map((rec, i) => {
                        const r = rec as any;
                        const pFull: any = pegawai.find((px: any) => String(px.id) === rec.pegawaiId);
                        const nama = r.pegawaiNama ?? pFull?.nama ?? '';
                        const jabatan = r.pegawaiJabatan ?? pFull?.jabatan ?? pFull?.jabatan_fungsional ?? '';
                        const unitKerja = r.pegawaiUnitKerja ?? pFull?.unit_kerja ?? pFull?.unitKerja ?? '';
                        return (
                          <tr
                            key={rec.id}
                            className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                            onClick={() => setDetailRecord(rec)}
                          >
                            <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full ${getAvatarColor(rec.pegawaiId)} flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-white text-xs font-semibold">{getInitials(nama || '?')}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 leading-tight truncate max-w-44">{nama}</p>
                                  <p className="text-xs text-gray-400 truncate max-w-44">{jabatan}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <p className="text-xs text-gray-500 max-w-36 truncate">{unitKerja}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`text-sm font-medium ${rec.jamMasuk ? 'text-gray-800' : 'text-gray-300'}`}>
                                  {rec.jamMasuk || '—'}
                                </span>
                                {isLate(rec.jamMasuk) && (
                                  <span className="text-xs text-orange-500 font-medium bg-orange-50 px-1.5 rounded-full">Terlambat</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`text-sm font-medium ${rec.jamKeluar ? 'text-gray-800' : 'text-gray-300'}`}>
                                  {rec.jamKeluar || '—'}
                                </span>
                                {rec.status === 'Hadir' && isEarlyLeave(rec.jamKeluar) && (
                                  <span className="text-xs text-red-400 font-medium bg-red-50 px-1.5 rounded-full">Pulang Cepat</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={rec.status} />
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <p className="text-xs text-gray-500 max-w-40 truncate">{rec.keterangan || '—'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                {deleteConfirmId === rec.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={e => { e.stopPropagation(); handleDelete(rec.id); }}
                                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                    >
                                      Hapus
                                    </button>
                                    <button
                                      onClick={e => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={e => { e.stopPropagation(); openEditModal(rec); }}
                                      className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={e => { e.stopPropagation(); setDeleteConfirmId(rec.id); }}
                                      className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredRecords.map((rec, i) => {
                    const r = rec as any;
                    const pFull: any = pegawai.find((px: any) => String(px.id) === rec.pegawaiId);
                    const nama = r.pegawaiNama ?? pFull?.nama ?? '';
                    const unitKerja = r.pegawaiUnitKerja ?? pFull?.unit_kerja ?? pFull?.unitKerja ?? '';
                    return (
                      <div
                        key={rec.id}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer space-y-3"
                        onClick={() => setDetailRecord(rec)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(rec.pegawaiId)} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white text-sm font-semibold">{getInitials(nama || '?')}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800 leading-tight">{nama}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{unitKerja}</p>
                            </div>
                          </div>
                          <StatusBadge status={rec.status} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Jam Masuk</p>
                            <p className="text-sm font-semibold text-gray-700">{rec.jamMasuk || '—'}</p>
                            {isLate(rec.jamMasuk) && <span className="text-[9px] text-orange-500 font-medium">Terlambat</span>}
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Jam Keluar</p>
                            <p className="text-sm font-semibold text-gray-700">{rec.jamKeluar || '—'}</p>
                            {rec.status === 'Hadir' && isEarlyLeave(rec.jamKeluar) && <span className="text-[9px] text-red-400 font-medium">Pulang Cepat</span>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{rec.keterangan || 'Tidak ada keterangan'}</p>
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            {deleteConfirmId === rec.id ? (
                               <div className="flex items-center gap-1">
                                  <button onClick={() => handleDelete(rec.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg font-medium">Hapus</button>
                                  <button onClick={() => setDeleteConfirmId(null)} className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-lg">Batal</button>
                               </div>
                            ) : (
                               <div className="flex items-center gap-1">
                                  <button onClick={() => openEditModal(rec)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setDeleteConfirmId(rec.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                               </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {filteredRecords.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/40 text-xs text-gray-400 flex items-center justify-between">
                <span>Menampilkan {filteredRecords.length} dari {dateRecords.length} pegawai</span>
                <span>{dateStats.hadir} hadir · {dateStats.terlambat} terlambat · {dateStats.alpha} alpha</span>
              </div>
            )}
          </div>

          {/* Alpha warning */}
          {dateStats.alpha > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Perhatian: Ada {dateStats.alpha} Pegawai Alpha</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Berdasarkan PP No. 94/2021 tentang Disiplin PNS: tidak hadir tanpa keterangan selama 5 hari kerja
                    berturut-turut dikenakan hukuman disiplin tingkat ringan. Segera tindak lanjuti dan dokumentasikan di menu Disiplin.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════ TAB: REKAP BULANAN ═════════════════════════ */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="text-sm font-semibold text-gray-700 min-w-36 text-center">
                    {MONTH_NAMES[rekapMonth]} {rekapYear}
                  </span>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  {workDaysCount} hari kerja
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari pegawai..."
                    value={rekapSearch}
                    onChange={e => setRekapSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
                  />
                </div>
                <select
                  value={rekapUnit}
                  onChange={e => setRekapUnit(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-40"
                >
                  <option value="">Semua Unit</option>
                  {uniqueUnits.map(u => <option key={u} value={u}>{shortUnit(u)}</option>)}
                </select>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>
          </div>

          {/* Summary stat cards for month */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {[
              { label: 'Total Hadir',      value: rekapData.reduce((a, r) => a + r.hadir, 0),     color: 'text-green-600',  bg: 'bg-green-50 border-green-100' },
              { label: 'Total Dinas Luar', value: rekapData.reduce((a, r) => a + r.dinasLuar, 0), color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
              { label: 'Total Sakit',      value: rekapData.reduce((a, r) => a + r.sakit, 0),     color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
              { label: 'Total Izin',       value: rekapData.reduce((a, r) => a + r.izin, 0),      color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100' },
              { label: 'Total Cuti',       value: rekapData.reduce((a, r) => a + r.cuti, 0),      color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
              { label: 'Total Alpha',      value: rekapData.reduce((a, r) => a + r.alpha, 0),     color: 'text-red-600',    bg: 'bg-red-50 border-red-100' },
              { label: 'Total Terlambat',  value: rekapData.reduce((a, r) => a + r.terlambat, 0), color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 border ${s.bg}`}>
                <p className="text-xs text-gray-500 truncate leading-tight">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">kejadian</p>
              </div>
            ))}
          </div>

          {/* Rekap Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50 min-w-52">Nama Pegawai</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-green-600">Hadir</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-indigo-600">Dinas Luar</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-yellow-600">Sakit</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-blue-600">Izin</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-purple-600">Cuti</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-red-600">Alpha</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-orange-600">Terlambat</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600 min-w-36">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rekapData.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-white">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${getAvatarColor(r.id)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-semibold">{getInitials(r.nama)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 leading-tight truncate max-w-40">{r.nama}</p>
                            <p className="text-xs text-gray-400 truncate">{shortUnit(r.unitKerja)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-green-600">{r.hadir}</td>
                      <td className="px-3 py-3 text-center text-indigo-600">{r.dinasLuar}</td>
                      <td className="px-3 py-3 text-center text-yellow-600">{r.sakit}</td>
                      <td className="px-3 py-3 text-center text-blue-600">{r.izin}</td>
                      <td className="px-3 py-3 text-center text-purple-600">{r.cuti}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={r.alpha > 0 ? 'text-red-600 font-semibold' : 'text-gray-300'}>
                          {r.alpha}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={r.terlambat > 0 ? 'text-orange-600 font-medium' : 'text-gray-300'}>
                          {r.terlambat}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                r.persen >= 95 ? 'bg-green-500' : r.persen >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(r.persen, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold w-10 text-right ${
                            r.persen >= 95 ? 'text-green-600' : r.persen >= 85 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {r.persen}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/40 text-xs text-gray-400 flex items-center justify-between">
              <span>{rekapData.length} pegawai ditampilkan · {workDaysCount} hari kerja</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  ≥95% Baik Sekali
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                  85–94% Baik
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  &lt;85% Perlu Perhatian
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ MODAL: ADD / EDIT RECORD ════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800">
                  {editingRecord ? 'Edit Data Kehadiran' : 'Tambah Data Kehadiran'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Pegawai */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Pegawai <span className="text-red-400">*</span>
                </label>
                <select
                  value={modalForm.pegawaiId}
                  onChange={e => setModalForm(f => ({ ...f, pegawaiId: e.target.value }))}
                  disabled={!!editingRecord}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">— Pilih Pegawai —</option>
                  {pegawai.map((p: any) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.gelar_depan || p.gelarDepan || ''} {p.nama}{(p.gelar_belakang || p.gelarBelakang) ? `, ${p.gelar_belakang ?? p.gelarBelakang}` : ''} · {shortUnit(p.unit_kerja ?? p.unitKerja ?? '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tanggal</label>
                <input
                  type="date"
                  value={modalForm.tanggal}
                  onChange={e => setModalForm(f => ({ ...f, tanggal: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Status Kehadiran</label>
                <div className="grid grid-cols-4 gap-2">
                  {STATUS_LIST.map(s => {
                    const cfg = STATUS_CONFIG[s];
                    const active = modalForm.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setModalStatus(s)}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                          active
                            ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-blue-400 ring-offset-1`
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Jam masuk & keluar */}
              {(modalForm.status === 'Hadir' || modalForm.status === 'Dinas Luar') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Jam Masuk</label>
                    <input
                      type="time"
                      value={modalForm.jamMasuk}
                      onChange={e => setModalForm(f => ({ ...f, jamMasuk: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isLate(modalForm.jamMasuk) ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                      }`}
                    />
                    {isLate(modalForm.jamMasuk) && <p className="text-xs text-orange-500 mt-1">⚠ Terlambat (setelah 08:00)</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Jam Keluar</label>
                    <input
                      type="time"
                      value={modalForm.jamKeluar}
                      onChange={e => setModalForm(f => ({ ...f, jamKeluar: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isEarlyLeave(modalForm.jamKeluar) ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {isEarlyLeave(modalForm.jamKeluar) && <p className="text-xs text-red-400 mt-1">Pulang sebelum 15:30</p>}
                  </div>
                </div>
              )}

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Keterangan</label>
                <input
                  type="text"
                  value={modalForm.keterangan}
                  onChange={e => setModalForm(f => ({ ...f, keterangan: e.target.value }))}
                  placeholder={
                    modalForm.status === 'Sakit'      ? 'Nomor surat dokter (mis. SK-001/2026)...' :
                    modalForm.status === 'Izin'       ? 'Alasan izin...' :
                    modalForm.status === 'Dinas Luar' ? 'Tujuan / keperluan dinas...' :
                    modalForm.status === 'Cuti'       ? 'Jenis cuti...' :
                                                        'Keterangan tambahan...'
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveModal}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                {editingRecord ? 'Perbarui Data' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Record Modal ── */}
      {detailRecord && (() => {
        const dr = detailRecord as any;
        const pFull: any = pegawai.find((px: any) => String(px.id) === detailRecord.pegawaiId);
        const detailNama = dr.pegawaiNama ?? pFull?.nama ?? '';
        const detailJabatan = dr.pegawaiJabatan ?? pFull?.jabatan ?? '';
        const detailUnit = dr.pegawaiUnitKerja ?? pFull?.unit_kerja ?? pFull?.unitKerja ?? '';
        const cfg = STATUS_CONFIG[detailRecord.status] || STATUS_CONFIG['Alpha'];
        const late = isLate(detailRecord.jamMasuk);
        const earlyLeave = detailRecord.status === 'Hadir' && isEarlyLeave(detailRecord.jamKeluar);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailRecord(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                    <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                  </div>
                  <h2 className="font-semibold text-gray-800">Detail Kehadiran</h2>
                </div>
                <button onClick={() => setDetailRecord(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(detailRecord.pegawaiId)} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                    {getInitials(detailNama || '?')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{detailNama}</p>
                    <p className="text-xs text-gray-500">{detailJabatan}</p>
                    <p className="text-xs text-gray-400">{detailUnit}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Tanggal',    value: formatDateLong(detailRecord.tanggal) },
                    { label: 'Status',     value: <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}><span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}</span> },
                    { label: 'Jam Masuk',  value: detailRecord.jamMasuk  ? <span>{detailRecord.jamMasuk}  {late       && <span className="text-xs text-orange-500 ml-1 font-medium">Terlambat</span>}</span>   : '—' },
                    { label: 'Jam Keluar', value: detailRecord.jamKeluar ? <span>{detailRecord.jamKeluar} {earlyLeave && <span className="text-xs text-red-400 ml-1 font-medium">Pulang Cepat</span>}</span> : '—' },
                    { label: 'Keterangan', value: detailRecord.keterangan || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-500 w-32 flex-shrink-0">{row.label}</span>
                      <span className="text-xs font-medium text-gray-800 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => { setDetailRecord(null); openEditModal(detailRecord); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => setDetailRecord(null)}
                  className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}