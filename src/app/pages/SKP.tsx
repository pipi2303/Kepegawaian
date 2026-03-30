import React, { useState, useMemo, useCallback } from 'react';
import {
  Target, Plus, Info, X, Edit2, Eye, Award, Trash2, ChevronDown,
  ChevronUp, Save, BookOpen, BarChart2, GitBranch, TrendingUp,
  Zap, AlertTriangle, CheckCircle2, Clock, Users, Layers, ArrowRight,
  Search, Filter, Star, Brain, Heart, Handshake, Lightbulb, Crown,
  RefreshCw, Download, AlertCircle, CheckSquare, ChevronRight,
  User, FileCheck, Printer, FileText,
} from 'lucide-react';

import { useAppContext } from '../context/AppContext';
import { C, CHART_COLORS } from '../components/colors';
import type { SKPRecord, SKPItem } from '../types';
import { toast } from 'sonner';
import { bscObjectives, okrObjectives } from '../data/performanceData';
import ProfilKinerjaTab from '../components/skp/ProfilKinerjaTab';
import ApprovalTab from '../components/skp/ApprovalTab';
import LaporanTab from '../components/skp/LaporanTab';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard',  label: 'Dashboard',         icon: BarChart2   },
  { id: 'kamus',      label: 'Kamus KPI',          icon: BookOpen    },
  { id: 'skp',        label: 'SKP Aktif',          icon: Target      },
  { id: 'perilaku',   label: 'Penilaian Perilaku', icon: Brain       },
  { id: 'cascading',  label: 'Cascading',          icon: GitBranch   },
  { id: 'output',     label: 'Output & Dampak',    icon: TrendingUp  },
  { id: 'profil',     label: 'Profil Kinerja',     icon: User        },
  { id: 'approval',   label: 'Alur Persetujuan',   icon: FileCheck   },
  { id: 'laporan',    label: 'Laporan & Cetak',    icon: Printer     },
] as const;
type TabId = typeof TABS[number]['id'];

const PREDIKAT_CFG: Record<string, { color: string; bg: string; border: string; min: number }> = {
  'Sangat Baik': { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', min: 110 },
  'Baik':        { color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-200',    min: 90  },
  'Cukup':       { color: 'text-yellow-700',  bg: 'bg-yellow-100',  border: 'border-yellow-200',  min: 70  },
  'Kurang':      { color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-200',  min: 50  },
  'Sangat Kurang':{ color: 'text-red-700',   bg: 'bg-red-100',     border: 'border-red-200',     min: 0   },
};
const STATUS_CFG: Record<string, string> = {
  'Draft':   'bg-gray-100 text-gray-600',
  'Aktif':   'bg-blue-100 text-blue-700',
  'Selesai': 'bg-green-100 text-green-700',
};
const KPI_KATEGORI_CFG: Record<string, { color: string; bg: string; icon: string }> = {
  'Medis':    { color: 'text-red-700',     bg: 'bg-red-50',    icon: '🏥' },
  'Keuangan': { color: 'text-emerald-700', bg: 'bg-emerald-50',icon: '💰' },
  'SDM':      { color: 'text-blue-700',    bg: 'bg-blue-50',   icon: '👥' },
  'IT':       { color: 'text-violet-700',  bg: 'bg-violet-50', icon: '💻' },
  'Umum':     { color: 'text-orange-700',  bg: 'bg-orange-50', icon: '📋' },
};

const getNilaiPredikat = (nilai: number): string => {
  if (nilai >= 110) return 'Sangat Baik';
  if (nilai >= 90)  return 'Baik';
  if (nilai >= 70)  return 'Cukup';
  if (nilai >= 50)  return 'Kurang';
  return 'Sangat Kurang';
};
const genItemId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ─── KAMUS KPI (Master Data Bank) ────────────────────────────────────────────
interface KPIEntry {
  id: string;
  nama: string;
  kategori: 'Medis' | 'Keuangan' | 'SDM' | 'IT' | 'Umum';
  satuan: string;
  formula: string;
  benchmark: string;
  isOtomatis: boolean;
  sumberData: string;
  linkedBSC?: string;
}
const KAMUS_KPI: KPIEntry[] = [
  // Medis
  { id: 'kpi-m01', nama: 'Kepatuhan Pengisian Asesmen Awal 24 Jam', kategori: 'Medis', satuan: '%', formula: '(Rekam medis lengkap / Total pasien MRS) × 100', benchmark: '≥ 80%', isOtomatis: true, sumberData: 'Modul EMR / Rekam Medis', linkedBSC: 'Internal Process' },
  { id: 'kpi-m02', nama: 'Kepatuhan Cuci Tangan (Hand Hygiene)', kategori: 'Medis', satuan: '%', formula: '(Observasi benar / Total observasi) × 100', benchmark: '≥ 85%', isOtomatis: false, sumberData: 'Observasi PPI / K3RS', linkedBSC: 'Internal Process' },
  { id: 'kpi-m03', nama: 'Waktu Tunggu Rawat Jalan', kategori: 'Medis', satuan: 'Menit', formula: 'Rata-rata waktu panggil – waktu daftar', benchmark: '≤ 60 menit', isOtomatis: false, sumberData: 'Sistem Antrian SIMRS', linkedBSC: 'Customer' },
  { id: 'kpi-m04', nama: 'Kelengkapan Resume Medis Pulang', kategori: 'Medis', satuan: '%', formula: '(Resume lengkap / Total pasien KLRS) × 100', benchmark: '≥ 90%', isOtomatis: true, sumberData: 'Modul Rekam Medis', linkedBSC: 'Internal Process' },
  { id: 'kpi-m05', nama: 'Angka Kematian Pasca Operasi (≤ 48 jam)', kategori: 'Medis', satuan: '%', formula: '(Kematian ≤48 jam / Total operasi) × 100', benchmark: '≤ 1%', isOtomatis: false, sumberData: 'Laporan Kamar Operasi / Rekam Medis', linkedBSC: 'Customer' },
  { id: 'kpi-m06', nama: 'Kepatuhan Identifikasi Pasien', kategori: 'Medis', satuan: '%', formula: '(Gelang identitas terpasang benar / Total pasien) × 100', benchmark: '100%', isOtomatis: false, sumberData: 'Observasi Keselamatan Pasien', linkedBSC: 'Internal Process' },
  { id: 'kpi-m07', nama: 'Angka Kejadian Infeksi Luka Operasi (ILO)', kategori: 'Medis', satuan: '%', formula: '(Kasus ILO / Total operasi bersih) × 100', benchmark: '≤ 2%', isOtomatis: false, sumberData: 'Laporan PPI / Komite Medis', linkedBSC: 'Internal Process' },
  { id: 'kpi-m08', nama: 'Waktu Tunggu Layanan Farmasi Rawat Jalan', kategori: 'Medis', satuan: 'Menit', formula: 'Rata-rata waktu selesai racik – terima resep', benchmark: '≤ 30 menit', isOtomatis: false, sumberData: 'Sistem Antrian Farmasi / SIMRS', linkedBSC: 'Customer' },
  { id: 'kpi-m09', nama: 'Bed Occupancy Rate (BOR)', kategori: 'Medis', satuan: '%', formula: '(Hari perawatan / (Kapasitas × Periode)) × 100', benchmark: '70%–85%', isOtomatis: true, sumberData: 'Modul Rawat Inap SIMRS', linkedBSC: 'Financial' },
  { id: 'kpi-m10', nama: 'Length of Stay (LOS) Rata-rata', kategori: 'Medis', satuan: 'Hari', formula: 'Total hari perawatan / Total pasien keluar', benchmark: '≤ 7 hari', isOtomatis: true, sumberData: 'Modul Rawat Inap SIMRS', linkedBSC: 'Internal Process' },
  // Keuangan
  { id: 'kpi-k01', nama: 'Akurasi Closing Harian Keuangan', kategori: 'Keuangan', satuan: '%', formula: '(Hari closing akurat / Total hari kerja) × 100', benchmark: '≥ 98%', isOtomatis: false, sumberData: 'Modul Keuangan / Billing', linkedBSC: 'Financial' },
  { id: 'kpi-k02', nama: 'Ketepatan Waktu Penagihan BPJS', kategori: 'Keuangan', satuan: 'Hari', formula: 'Rata-rata hari dari KLRS → submit klaim BPJS', benchmark: '≤ 7 hari', isOtomatis: false, sumberData: 'Modul BPJS / Billing', linkedBSC: 'Financial' },
  { id: 'kpi-k03', nama: 'Realisasi Anggaran Belanja', kategori: 'Keuangan', satuan: '%', formula: '(Realisasi / Anggaran) × 100', benchmark: '90%–100%', isOtomatis: false, sumberData: 'Laporan Keuangan APBD', linkedBSC: 'Financial' },
  { id: 'kpi-k04', nama: 'Kelengkapan Dokumen Pertanggungjawaban (SPJ)', kategori: 'Keuangan', satuan: '%', formula: '(SPJ lengkap / Total SPJ) × 100', benchmark: '100%', isOtomatis: false, sumberData: 'Modul Akuntansi', linkedBSC: 'Financial' },
  // SDM
  { id: 'kpi-s01', nama: 'Tingkat Kehadiran (Absensi)', kategori: 'SDM', satuan: '%', formula: '(Hari hadir / Total hari kerja) × 100', benchmark: '≥ 95%', isOtomatis: true, sumberData: 'Modul Presensi / Absensi HCMS', linkedBSC: 'Learning & Growth' },
  { id: 'kpi-s02', nama: 'Ketepatan Waktu Penggajian', kategori: 'SDM', satuan: '%', formula: '(Gajian tepat waktu / Total periode gaji) × 100', benchmark: '100%', isOtomatis: false, sumberData: 'Modul Penggajian HCMS', linkedBSC: 'Internal Process' },
  { id: 'kpi-s03', nama: 'Pemenuhan Kebutuhan Tenaga Kerja', kategori: 'SDM', satuan: '%', formula: '(Formasi terisi / Formasi dibutuhkan) × 100', benchmark: '≥ 85%', isOtomatis: false, sumberData: 'Modul Data Pegawai HCMS', linkedBSC: 'Learning & Growth' },
  { id: 'kpi-s04', nama: 'Penyelesaian SKP Tepat Waktu', kategori: 'SDM', satuan: '%', formula: '(SKP selesai / Total SKP periode) × 100', benchmark: '100%', isOtomatis: true, sumberData: 'Modul SKP HCMS', linkedBSC: 'Learning & Growth' },
  { id: 'kpi-s05', nama: 'Jam Pelatihan per Karyawan (per Tahun)', kategori: 'SDM', satuan: 'JP/Tahun', formula: 'Total JP diklat / Jumlah pegawai aktif', benchmark: '≥ 20 JP', isOtomatis: true, sumberData: 'Modul Diklat HCMS', linkedBSC: 'Learning & Growth' },
  { id: 'kpi-s06', nama: 'Angka Perputaran Karyawan (Turnover)', kategori: 'SDM', satuan: '%', formula: '(Karyawan keluar / Total karyawan) × 100', benchmark: '≤ 5%', isOtomatis: false, sumberData: 'Modul Data Pegawai HCMS', linkedBSC: 'Learning & Growth' },
  { id: 'kpi-s07', nama: 'Jumlah Pelanggaran Disiplin', kategori: 'SDM', satuan: 'Kasus', formula: 'Total kasus disiplin aktif dalam periode', benchmark: '0 kasus berat', isOtomatis: true, sumberData: 'Modul Disiplin HCMS', linkedBSC: 'Internal Process' },
  // IT
  { id: 'kpi-i01', nama: 'System Uptime SIMRS', kategori: 'IT', satuan: '%', formula: '((Total jam – downtime) / Total jam) × 100', benchmark: '≥ 99.5%', isOtomatis: false, sumberData: 'Monitoring Server / Log SIMRS', linkedBSC: 'Internal Process' },
  { id: 'kpi-i02', nama: 'Kecepatan Resolusi Helpdesk (Mean Time to Resolve)', kategori: 'IT', satuan: 'Jam', formula: 'Rata-rata jam dari tiket dibuka → selesai', benchmark: '≤ 4 jam', isOtomatis: false, sumberData: 'Sistem Ticketing IT', linkedBSC: 'Internal Process' },
  { id: 'kpi-i03', nama: 'Persentase Permintaan User Terselesaikan', kategori: 'IT', satuan: '%', formula: '(Tiket selesai / Total tiket masuk) × 100', benchmark: '≥ 95%', isOtomatis: false, sumberData: 'Sistem Ticketing IT', linkedBSC: 'Internal Process' },
  { id: 'kpi-i04', nama: 'Ketepatan Update Data SIMRS', kategori: 'IT', satuan: '%', formula: '(Update tepat waktu / Total jadwal update) × 100', benchmark: '100%', isOtomatis: false, sumberData: 'Log Sistem SIMRS', linkedBSC: 'Internal Process' },
  // Umum
  { id: 'kpi-u01', nama: 'Indeks Kepuasan Pelanggan (CSI)', kategori: 'Umum', satuan: 'Skor (1–5)', formula: 'Rata-rata skor kuesioner kepuasan layanan', benchmark: '≥ 4.0', isOtomatis: false, sumberData: 'Survei Kepuasan Pelanggan', linkedBSC: 'Customer' },
  { id: 'kpi-u02', nama: 'Kepatuhan Standar Prosedur Operasional (SPO)', kategori: 'Umum', satuan: '%', formula: '(SPO dipatuhi / Total observasi) × 100', benchmark: '≥ 90%', isOtomatis: false, sumberData: 'Observasi / Audit Internal', linkedBSC: 'Internal Process' },
  { id: 'kpi-u03', nama: 'Penyelesaian Surat Dinas Tepat Waktu', kategori: 'Umum', satuan: '%', formula: '(Surat tepat waktu / Total surat keluar) × 100', benchmark: '≥ 95%', isOtomatis: false, sumberData: 'Modul Surat Kepegawaian HCMS', linkedBSC: 'Internal Process' },
  { id: 'kpi-u04', nama: 'Kelengkapan Laporan Bulanan Tepat Waktu', kategori: 'Umum', satuan: '%', formula: '(Laporan tepat / Total laporan wajib) × 100', benchmark: '100%', isOtomatis: false, sumberData: 'Sistem Pelaporan Internal', linkedBSC: 'Internal Process' },
];

// ─── BEHAVIOR DIMENSIONS ─────────────────────────────────────────────────────
interface BehaviorDim {
  id: string;
  nama: string;
  deskripsi: string;
  icon: React.ElementType;
  forLevel: 'all' | 'supervisor';
}
const BEHAVIOR_DIMS: BehaviorDim[] = [
  { id: 'orientasi',     nama: 'Orientasi Pelayanan',  deskripsi: 'Komitmen memberikan pelayanan prima kepada pasien/pelanggan internal', icon: Heart,      forLevel: 'all' },
  { id: 'integritas',    nama: 'Integritas & Komitmen',deskripsi: 'Bertindak konsisten sesuai nilai, norma, dan aturan organisasi',       icon: CheckSquare,forLevel: 'all' },
  { id: 'kerjasama',     nama: 'Kerjasama (Teamwork)', deskripsi: 'Berpartisipasi aktif dan mendukung kerja tim lintas unit',              icon: Handshake,  forLevel: 'all' },
  { id: 'inisiatif',     nama: 'Inisiatif & Kreativitas',deskripsi: 'Proaktif mencari solusi dan ide perbaikan layanan',                   icon: Lightbulb,  forLevel: 'all' },
  { id: 'kepemimpinan',  nama: 'Kepemimpinan',         deskripsi: 'Kemampuan mengarahkan, memotivasi, dan mengembangkan anggota tim',      icon: Crown,      forLevel: 'supervisor' },
];
const BEHAVIOR_LABELS: Record<number, string> = { 1: 'Sangat Kurang', 2: 'Kurang', 3: 'Cukup', 4: 'Baik', 5: 'Sangat Baik' };
const BEHAVIOR_SCORE: Record<number, number> = { 1: 25, 2: 50, 3: 70, 4: 85, 5: 100 };

type BehaviorScores = Record<string, number>; // dimId → 1-5

function loadBehavior(skpId: string): BehaviorScores {
  try {
    const raw = localStorage.getItem(`skp_behavior_${skpId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveBehavior(skpId: string, scores: BehaviorScores) {
  try { localStorage.setItem(`skp_behavior_${skpId}`, JSON.stringify(scores)); } catch {}
}
function calcBehaviorScore(scores: BehaviorScores, isSupv: boolean): number {
  const dims = isSupv ? BEHAVIOR_DIMS : BEHAVIOR_DIMS.filter(d => d.forLevel === 'all');
  const total = dims.reduce((s, d) => s + BEHAVIOR_SCORE[scores[d.id] ?? 3], 0);
  return Math.round(total / dims.length);
}

// ─── HELPER ───────────────────────────────────────────────────────────────────
const EMPTY_ITEM: Omit<SKPItem, 'id'> = { uraianKegiatan: '', target: 0, satuan: '', bobot: 0 };

// ─── AUTOMATED KPI SYNC DATA (derived from AppContext) ────────────────────────
function useAutoKPI() {
  const { absensi, disiplin, diklat, pegawai, skp } = useAppContext();
  return useMemo(() => {
    const totalPegawai = pegawai.filter(p => p.statusAktif === 'Aktif').length;
    // Kehadiran Maret 2026
    const marAbsensi = absensi.filter(a => a.tanggal.startsWith('2026-03'));
    const hadirCount = marAbsensi.filter(a => a.status === 'Hadir' || a.status === 'Dinas Luar').length;
    const alphaCount = marAbsensi.filter(a => a.status === 'Alpha').length;
    const totalPossible = marAbsensi.length;
    const kehadiranPct = totalPossible > 0 ? ((hadirCount / totalPossible) * 100).toFixed(1) : '0';

    // Disiplin aktif
    const disiplinAktif = disiplin.filter(d => d.status !== 'Selesai').length;
    const disiplinBerat = disiplin.filter(d => d.tingkatHukuman === 'Berat').length;

    // Diklat JP total Tahun 2025-2026
    const diklatSelesai = diklat.filter(d => d.status === 'Selesai');
    const totalJP = diklatSelesai.reduce((s, d) => s + (d.jumlahJP || 0), 0);
    const avgJPPerPegawai = totalPegawai > 0 ? (totalJP / totalPegawai).toFixed(1) : '0';

    // SKP selesai
    const skpSelesai = skp.filter(s => s.status === 'Selesai');
    const avgNilai = skpSelesai.length > 0
      ? (skpSelesai.reduce((s, r) => s + (r.nilaiAkhir || 0), 0) / skpSelesai.length).toFixed(1)
      : '–';
    const skpTotal = skp.length;
    const skpSelesaiCount = skpSelesai.length;
    const skpPct = skpTotal > 0 ? ((skpSelesaiCount / skpTotal) * 100).toFixed(0) : '0';

    return { kehadiranPct, alphaCount, disiplinAktif, disiplinBerat, avgJPPerPegawai, totalJP, avgNilai, skpPct };
  }, [absensi, disiplin, diklat, pegawai, skp]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── UNIT BAR CHART COLORS ────────────────────────────────────────────────────
const BAR_COLORS = CHART_COLORS as unknown as string[];

// ─── TAB 1: Dashboard ─────────────────────────────────────────────────────────
function DashboardTab({ onTabChange }: { onTabChange: (t: TabId) => void }) {
  const { skp, pegawai, disiplin, kenaikanPangkat } = useAppContext();
  const auto = useAutoKPI();

  const totalSKP = skp.length;
  const selesai = skp.filter(s => s.status === 'Selesai');
  const aktif = skp.filter(s => s.status === 'Aktif');
  const avgNilai = selesai.length > 0
    ? (selesai.reduce((s, r) => s + (r.nilaiAkhir || 0), 0) / selesai.length).toFixed(1)
    : '–';

  // Distribution
  const dist: Record<string, number> = { 'Sangat Baik': 0, 'Baik': 0, 'Cukup': 0, 'Kurang': 0, 'Sangat Kurang': 0 };
  selesai.forEach(s => { if (s.predikat && dist[s.predikat] !== undefined) dist[s.predikat]++; });

  // HR Alerts
  const rewardList = selesai.filter(s => (s.nilaiAkhir ?? 0) >= 110);
  const pembinaanList = selesai.filter(s => (s.nilaiAkhir ?? 0) < 70);
  const kpEligible = selesai.filter(s => (s.nilaiAkhir ?? 0) >= 90);

  // Unit bar chart data
  const unitChartData = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    selesai.forEach(s => {
      const p = pegawai.find(px => px.id === s.pegawaiId);
      if (!p || !s.nilaiAkhir) return;
      const u = p.unitKerja.length > 22 ? p.unitKerja.slice(0, 22) + '…' : p.unitKerja;
      if (!map.has(u)) map.set(u, { sum: 0, count: 0 });
      const e = map.get(u)!; e.sum += s.nilaiAkhir; e.count++;
    });
    return Array.from(map.entries())
      .map(([unit, d]) => ({ unit, 'Avg KPI': parseFloat((d.sum / d.count).toFixed(1)), n: d.count }))
      .sort((a, b) => b['Avg KPI'] - a['Avg KPI']).slice(0, 8);
  }, [selesai, pegawai]);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total SKP', value: totalSKP,         sub: 'Semua periode',      cls: 'border-gray-100', val: 'text-gray-800', icon: Target },
          { label: 'SKP Aktif', value: aktif.length,     sub: 'Periode berjalan',   cls: 'border-blue-100 bg-blue-50', val: 'text-blue-600', icon: Clock },
          { label: 'Selesai Dinilai', value: selesai.length, sub: 'SKP final',      cls: 'border-green-100 bg-green-50', val: 'text-green-600', icon: CheckCircle2 },
          { label: 'Rata-rata Nilai', value: avgNilai,   sub: 'Dari SKP selesai',   cls: 'border-purple-100 bg-purple-50', val: 'text-purple-600', icon: Award },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border shadow-sm p-4 bg-white ${s.cls}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">{s.label}</p>
              <s.icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className={`text-2xl font-bold ${s.val}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Automated KPI Sync */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Automated KPI Sync</h3>
            <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Real-time</span>
          </div>
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Kehadiran Maret', value: `${auto.kehadiranPct}%`, sub: `${auto.alphaCount} Alpha`, icon: Users, color: Number(auto.kehadiranPct) >= 95 ? 'text-emerald-600' : 'text-yellow-600', src: 'Modul Absensi' },
            { label: 'Insiden Disiplin', value: auto.disiplinAktif, sub: `${auto.disiplinBerat} hukuman berat`, icon: AlertTriangle, color: auto.disiplinAktif === 0 ? 'text-emerald-600' : 'text-red-600', src: 'Modul Disiplin' },
            { label: 'Avg JP Diklat/Org', value: `${auto.avgJPPerPegawai} JP`, sub: `Total ${auto.totalJP} JP`, icon: BookOpen, color: Number(auto.avgJPPerPegawai) >= 20 ? 'text-emerald-600' : 'text-yellow-600', src: 'Modul Diklat' },
            { label: 'SKP Terselesaikan', value: `${auto.skpPct}%`, sub: `${auto.avgNilai} avg nilai`, icon: Target, color: Number(auto.skpPct) >= 80 ? 'text-emerald-600' : 'text-yellow-600', src: 'Modul SKP' },
          ].map(c => (
            <div key={c.label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <c.icon className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[11px] text-gray-500">{c.label}</p>
              </div>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
              <p className="text-[9px] text-gray-300 mt-1 truncate">📡 {c.src}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribusi Predikat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Distribusi Predikat SKP</h3>
          <div className="space-y-2.5">
            {Object.entries(dist).map(([pred, count]) => {
              const cfg = PREDIKAT_CFG[pred];
              const pct = selesai.length > 0 ? Math.round((count / selesai.length) * 100) : 0;
              return (
                <div key={pred} className="flex items-center gap-3">
                  <span className={`text-xs font-medium w-28 ${cfg.color}`}>{pred}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${cfg.bg.replace('bg-', 'bg-').replace('100', '400')}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* HR Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">⚡ Output & Dampak HR</h3>
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700">Reward / Remunerasi</p>
                <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{rewardList.length}</span>
              </div>
              <p className="text-[11px] text-emerald-600">Pegawai dengan nilai ≥ 110 eligible untuk bonus remunerasi & kenaikan pangkat pilihan.</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <p className="text-xs font-semibold text-red-700">Program Pembinaan</p>
                <span className="ml-auto text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">{pembinaanList.length}</span>
              </div>
              <p className="text-[11px] text-red-600">Pegawai nilai &lt; 70 wajib ikut program coaching & pembinaan kinerja.</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-xs font-semibold text-blue-700">Syarat Kenaikan Pangkat</p>
                <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{kpEligible.length}</span>
              </div>
              <p className="text-[11px] text-blue-600">Pegawai nilai ≥ 90 (Baik) memenuhi syarat SKP untuk kenaikan pangkat reguler.</p>
            </div>
          </div>
          <button onClick={() => onTabChange('output')} className="mt-3 w-full text-xs text-blue-600 hover:underline text-center">Lihat Detail Output & Dampak →</button>
        </div>
      </div>

      {/* Unit Bar Chart */}
      {unitChartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Rata-rata KPI per Unit Kerja</h3>
            <button onClick={() => onTabChange('laporan')} className="text-xs text-blue-600 hover:underline">Lihat Laporan Lengkap →</button>
          </div>
          <div className="space-y-2">
            {unitChartData.map((d, i) => {
              const pct = Math.round((d['Avg KPI'] / 130) * 100);
              const color = BAR_COLORS[i % BAR_COLORS.length];
              return (
                <div key={`kpi-bar-row-${i}`} className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 w-36 shrink-0 truncate" title={d.unit}>{d.unit}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-4 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 w-10 text-right shrink-0">{d['Avg KPI']}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 pl-36 text-[9px] text-gray-300">
            <span>0</span><span>32</span><span>65</span><span>97</span><span>130</span>
          </div>
        </div>
      )}

      {/* Quick Nav to new tabs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'profil' as TabId,   label: 'Profil Kinerja',   desc: 'Tren & radar per pegawai', icon: User,      cls: 'border-indigo-100 bg-indigo-50 hover:bg-indigo-100' },
          { id: 'approval' as TabId, label: 'Alur Persetujuan', desc: 'Lifecycle SKP & approval',  icon: FileCheck, cls: 'border-blue-100 bg-blue-50 hover:bg-blue-100'    },
          { id: 'laporan' as TabId,  label: 'Laporan & Cetak',  desc: 'Export PDF & rekap unit',  icon: Printer,   cls: 'border-gray-100 bg-gray-50 hover:bg-gray-100'    },
        ].map(nav => (
          <button key={nav.id} onClick={() => onTabChange(nav.id)}
            className={`rounded-xl border p-4 text-left transition-colors ${nav.cls}`}>
            <nav.icon className="w-5 h-5 text-gray-600 mb-2" />
            <p className="text-sm font-semibold text-gray-800">{nav.label}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{nav.desc}</p>
          </button>
        ))}
      </div>

      {/* Info bar */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-800">Ketentuan SKP — PermenPAN-RB No. 6 Tahun 2022</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(PREDIKAT_CFG).map(([pred, cfg]) => (
                <span key={pred} className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                  {pred} ≥ {cfg.min}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: Kamus KPI ─────────────────────────────────────────────────────────
function KamusKPITab({ onImportKPI }: { onImportKPI: (kpi: KPIEntry) => void }) {
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [onlyAuto, setOnlyAuto] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() =>
    KAMUS_KPI.filter(k => {
      if (search && !k.nama.toLowerCase().includes(search.toLowerCase())) return false;
      if (kategori && k.kategori !== kategori) return false;
      if (onlyAuto && !k.isOtomatis) return false;
      return true;
    }),
    [search, kategori, onlyAuto]
  );

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-xl p-4 flex items-start gap-3">
        <BookOpen className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-violet-800">Bank Indikator KPI Rumah Sakit</p>
          <p className="text-xs text-violet-600 mt-0.5">Template KPI standar yang dapat digunakan sebagai acuan penyusunan butir kegiatan SKP. Klik <strong>Gunakan di SKP</strong> untuk menyalin ke form SKP baru.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama KPI..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={kategori} onChange={e => setKategori(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Semua Kategori</option>
          {Object.keys(KPI_KATEGORI_CFG).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={onlyAuto} onChange={e => setOnlyAuto(e.target.checked)} className="rounded" />
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Otomatis saja
        </label>
      </div>

      <p className="text-xs text-gray-400">{filtered.length} indikator ditemukan</p>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(kpi => {
          const cfg = KPI_KATEGORI_CFG[kpi.kategori];
          const isOpen = expanded === kpi.id;
          return (
            <div key={kpi.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${isOpen ? 'border-blue-200' : 'border-gray-100'}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon} {kpi.kategori}
                      </span>
                      {kpi.isOtomatis && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" /> Otomatis
                        </span>
                      )}
                      {kpi.linkedBSC && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">BSC: {kpi.linkedBSC}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-tight">{kpi.nama}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">Satuan: <strong>{kpi.satuan}</strong></span>
                      <span className="text-xs text-gray-500">Benchmark: <strong className="text-blue-600">{kpi.benchmark}</strong></span>
                    </div>
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : kpi.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <div className="p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-[10px] text-gray-500 mb-0.5">Cara Hitung (Formula)</p>
                      <p className="text-xs text-gray-700">{kpi.formula}</p>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                      <p className="text-[10px] text-blue-500 mb-0.5">Sumber Data</p>
                      <p className="text-xs text-blue-700">{kpi.sumberData}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { onImportKPI(kpi); toast.success(`KPI "${kpi.nama}" ditambahkan ke form SKP`); }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Gunakan di SKP
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TAB 3: SKP Aktif ─────────────────────────────────────────────────────────
function SKPAktifTab({ importedKPI, clearImportedKPI }: { importedKPI: KPIEntry | null; clearImportedKPI: () => void }) {
  const { skp, pegawai, addSKP, updateSKP, deleteSKP } = useAppContext();
  const [filterPegawai, setFilterPegawai] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedSKP, setSelectedSKP] = useState<SKPRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showRealisasiModal, setShowRealisasiModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editData, setEditData] = useState<SKPRecord | null>(null);

  const [formPegawaiId, setFormPegawaiId] = useState('');
  const [formTahun, setFormTahun] = useState(2026);
  const [formSemester, setFormSemester] = useState<1 | 2>(1);
  const [formStatus, setFormStatus] = useState<'Draft' | 'Aktif' | 'Selesai'>('Aktif');
  const [formItems, setFormItems] = useState<Array<Omit<SKPItem, 'id'> & { id: string }>>([{ id: genItemId(), ...EMPTY_ITEM }]);
  const [realisasiValues, setRealisasiValues] = useState<Record<string, number>>({});
  const [showKamusModal, setShowKamusModal] = useState(false);

  // Apply imported KPI when switching tab
  React.useEffect(() => {
    if (importedKPI && showFormModal) {
      setFormItems(prev => [...prev, {
        id: genItemId(),
        uraianKegiatan: importedKPI.nama,
        target: 100,
        satuan: importedKPI.satuan,
        bobot: 0,
      }]);
      clearImportedKPI();
    }
  }, [importedKPI, showFormModal, clearImportedKPI]);

  const filteredSKP = useMemo(() =>
    skp.filter(s => {
      if (filterPegawai && s.pegawaiId !== filterPegawai) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      if (filterTahun && s.tahun !== Number(filterTahun)) return false;
      return true;
    }),
    [skp, filterPegawai, filterStatus, filterTahun]
  );

  const getPegawai = (id: string) => pegawai.find(p => p.id === id);
  const getFullName = (id: string) => {
    const p = getPegawai(id);
    return p ? `${p.gelarDepan || ''} ${p.nama}`.trim() : '-';
  };
  const totalBobot = formItems.reduce((s, i) => s + (Number(i.bobot) || 0), 0);

  const openAdd = () => {
    setEditData(null);
    setFormPegawaiId(''); setFormTahun(2026); setFormSemester(1); setFormStatus('Aktif');
    setFormItems([{ id: genItemId(), ...EMPTY_ITEM }]);
    setShowFormModal(true);
  };
  const openEdit = (s: SKPRecord) => {
    setEditData(s);
    setFormPegawaiId(s.pegawaiId); setFormTahun(s.tahun); setFormSemester(s.semester); setFormStatus(s.status);
    setFormItems(s.targetKinerja.map(t => ({ ...t })));
    setShowFormModal(true);
  };
  const openRealisasi = (s: SKPRecord) => {
    setSelectedSKP(s);
    const init: Record<string, number> = {};
    s.targetKinerja.forEach(t => { if (t.realisasi != null) init[t.id] = t.realisasi; });
    setRealisasiValues(init);
    setShowRealisasiModal(true);
  };
  const addItem = () => setFormItems(prev => [...prev, { id: genItemId(), ...EMPTY_ITEM }]);
  const removeItem = (id: string) => setFormItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: string, value: any) =>
    setFormItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleSave = () => {
    if (!formPegawaiId) { toast.error('Pilih pegawai terlebih dahulu'); return; }
    if (formItems.some(i => !i.uraianKegiatan)) { toast.error('Isi semua uraian kegiatan'); return; }
    if (totalBobot !== 100) { toast.error(`Total bobot harus 100% (saat ini ${totalBobot}%)`); return; }
    const items: SKPItem[] = formItems.map(i => ({ ...i, target: Number(i.target), bobot: Number(i.bobot) }));
    if (editData) {
      updateSKP({ ...editData, pegawaiId: formPegawaiId, tahun: formTahun, semester: formSemester, status: formStatus, targetKinerja: items });
      toast.success('SKP berhasil diperbarui');
    } else {
      addSKP({ pegawaiId: formPegawaiId, tahun: formTahun, semester: formSemester, status: formStatus, targetKinerja: items });
      toast.success('SKP baru berhasil dibuat');
    }
    setShowFormModal(false);
  };
  const handleSaveRealisasi = () => {
    if (!selectedSKP) return;
    const updatedItems = selectedSKP.targetKinerja.map(t => {
      const real = realisasiValues[t.id] ?? t.realisasi ?? 0;
      const capaian = t.target > 0 ? Math.min(130, Math.round((real / t.target) * 100)) : 0;
      return { ...t, realisasi: real, nilaiCapaian: capaian };
    });
    const nilaiAkhir = Math.round(updatedItems.reduce((sum, t) => sum + ((t.nilaiCapaian || 0) * t.bobot / 100), 0));
    const predikat = getNilaiPredikat(nilaiAkhir);
    updateSKP({ ...selectedSKP, targetKinerja: updatedItems, nilaiAkhir, predikat, status: 'Selesai' });
    toast.success(`Realisasi disimpan — Nilai Akhir: ${nilaiAkhir} (${predikat})`);
    setShowRealisasiModal(false);
  };
  const handleDelete = (id: string) => { deleteSKP(id); setShowDeleteConfirm(null); toast.success('Data SKP dihapus'); };
  const toggleCard = (id: string) => setExpandedCards(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Avatar color palette
  const avatarColors = [
    'bg-blue-100 text-blue-700','bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700','bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700','bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700','bg-pink-100 text-pink-700',
  ];
  const getAvatarCls = (name: string) => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];
  const STATUS_ROW_CFG: Record<string, { pill: string; dot: string }> = {
    'Draft':   { pill: 'bg-gray-100 text-gray-500 border border-gray-200',         dot: 'bg-gray-400'    },
    'Aktif':   { pill: 'bg-blue-50 text-blue-600 border border-blue-200',           dot: 'bg-blue-500'    },
    'Selesai': { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',  dot: 'bg-emerald-500' },
  };

  return (
    <div className="space-y-3">
      {/* ── Filter & Action Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="flex-1 relative">
          <select value={filterPegawai} onChange={e => setFilterPegawai(e.target.value)}
            className="w-full appearance-none text-sm bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
            <option value="">Semua Pegawai</option>
            {pegawai.map(p => <option key={p.id} value={p.id}>{p.gelarDepan || ''} {p.nama} — {p.jabatan}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative sm:w-40">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="w-full appearance-none text-sm bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
            <option value="">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Aktif">Aktif</option>
            <option value="Selesai">Selesai</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative sm:w-36">
          <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
            className="w-full appearance-none text-sm bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
            <option value="">Semua Tahun</option>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <button onClick={openAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm whitespace-nowrap flex-shrink-0">
          <Plus className="w-4 h-4" /> Buat SKP
        </button>
      </div>

      {/* Count hint */}
      <p className="text-xs text-gray-400 px-0.5">
        {filteredSKP.length} data SKP ditemukan
        {(filterPegawai || filterStatus || filterTahun) && (
          <button onClick={() => { setFilterPegawai(''); setFilterStatus(''); setFilterTahun(''); }}
            className="ml-2 text-blue-500 hover:underline">Reset filter</button>
        )}
      </p>

      {/* ── SKP List ── */}
      {filteredSKP.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">Belum ada data SKP</p>
          <p className="text-xs text-gray-400 mt-1">Klik <strong>+ Buat SKP</strong> untuk menambahkan SKP baru</p>
          <button onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Buat SKP Pertama
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filteredSKP.map((s, idx) => {
            const p = getPegawai(s.pegawaiId);
            const predikatCfg = s.predikat ? PREDIKAT_CFG[s.predikat] : null;
            const isExpanded = expandedCards.has(s.id);
            const kpiBehavior = loadBehavior(s.id);
            const isSupv = p?.eselon != null;
            const hasPerilaku = Object.keys(kpiBehavior).length > 0;
            const perilakuScore = hasPerilaku ? calcBehaviorScore(kpiBehavior, isSupv) : null;
            const finalScore = s.nilaiAkhir != null && perilakuScore != null
              ? Math.round(s.nilaiAkhir * 0.7 + perilakuScore * 0.3) : null;
            const avatarCls = getAvatarCls(p?.nama || 'A');
            const statusCfg = STATUS_ROW_CFG[s.status] || STATUS_ROW_CFG['Draft'];

            return (
              <div key={s.id} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                {/* ── Row ── */}
                <div
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer select-none group"
                  onClick={() => toggleCard(s.id)}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm ${avatarCls}`}>
                    {(p?.nama || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{getFullName(s.pegawaiId)}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {p?.jabatan || '–'}
                      {p?.unitKerja ? ` · ${p.unitKerja}` : ''}
                      {' · '}Sem. {s.semester} {s.tahun}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {s.nilaiAkhir != null && (
                      <span className="text-lg font-bold text-gray-800 tabular-nums min-w-10 text-right">{s.nilaiAkhir}</span>
                    )}
                    {finalScore != null && (
                      <span className="hidden md:inline-flex text-[11px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">
                        Final {finalScore}
                      </span>
                    )}
                    {s.predikat && predikatCfg && (
                      <span className={`hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-full font-semibold ${predikatCfg.bg} ${predikatCfg.color}`}>
                        {s.predikat}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold ${statusCfg.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                      {s.status}
                    </span>
                    {/* Icons */}
                    <div className="flex items-center gap-0.5">
                      <button onClick={e => { e.stopPropagation(); setSelectedSKP(s); setShowDetailModal(true); }}
                        className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); openEdit(s); }}
                        className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {s.status === 'Aktif' && (
                        <button onClick={e => { e.stopPropagation(); openRealisasi(s); }}
                          className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Input Realisasi">
                          <Save className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); setShowDeleteConfirm(s.id); }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="pl-0.5">
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        : <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      }
                    </div>
                  </div>
                </div>

                {/* ── Expanded Detail ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/40 px-5 pb-5 pt-4">
                    {/* Mobile badges */}
                    <div className="flex items-center gap-2 mb-3 sm:hidden flex-wrap">
                      {s.nilaiAkhir != null && <span className="text-base font-bold text-gray-800">{s.nilaiAkhir}</span>}
                      {finalScore != null && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">Final {finalScore}</span>}
                      {s.predikat && predikatCfg && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${predikatCfg.bg} ${predikatCfg.color}`}>{s.predikat}</span>
                      )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-600">{s.targetKinerja.length} Butir Kegiatan / KPI</p>
                        {s.status === 'Aktif' && (
                          <button onClick={() => openRealisasi(s)}
                            className="flex items-center gap-1 text-xs text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
                            <Save className="w-3 h-3" /> Input Realisasi
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400 bg-gray-50/80 border-b border-gray-100">
                              <th className="text-left px-4 py-2.5 font-medium">Uraian Kegiatan / KPI</th>
                              <th className="text-center px-3 py-2.5 font-medium whitespace-nowrap">Target</th>
                              <th className="text-center px-3 py-2.5 font-medium whitespace-nowrap">Realisasi</th>
                              <th className="text-center px-3 py-2.5 font-medium whitespace-nowrap">Bobot</th>
                              <th className="text-center px-3 py-2.5 font-medium whitespace-nowrap">Capaian</th>
                              <th className="text-left px-4 py-2.5 font-medium min-w-28">Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.targetKinerja.map(t => {
                              const capai = t.realisasi != null && t.target > 0
                                ? Math.min(Math.round((t.realisasi / t.target) * 100), 130) : 0;
                              const capaiBar = Math.min(capai, 100);
                              const barCls = capai >= 100 ? 'bg-emerald-500' : capai >= 75 ? 'bg-blue-500' : 'bg-amber-400';
                              const capaiCls = capai >= 100 ? 'text-emerald-600' : capai >= 75 ? 'text-blue-600' : 'text-amber-600';
                              return (
                                <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                                  <td className="px-4 py-3 text-gray-700">{t.uraianKegiatan}</td>
                                  <td className="px-3 py-3 text-center text-gray-500 whitespace-nowrap">{t.target.toLocaleString()} {t.satuan}</td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-700">
                                    {t.realisasi != null ? t.realisasi.toLocaleString() : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-3 py-3 text-center text-gray-500">{t.bobot}%</td>
                                  <td className="px-3 py-3 text-center">
                                    {t.nilaiCapaian != null
                                      ? <span className={`font-bold ${capaiCls}`}>{t.nilaiCapaian.toFixed(1)}</span>
                                      : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 min-w-24">
                                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-1.5 rounded-full ${barCls}`} style={{ width: `${capaiBar}%` }} />
                                      </div>
                                      <span className={`text-[10px] font-semibold w-7 text-right tabular-nums ${capaiCls}`}>{capai}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {s.nilaiAkhir != null && (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Award className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500">Nilai Akhir KPI</span>
                            <span className="text-sm font-bold text-gray-800">{s.nilaiAkhir}</span>
                            {perilakuScore != null && (
                              <span className="text-xs text-gray-400">
                                + Perilaku <strong className="text-purple-600">{perilakuScore}</strong>
                                {' → Final '}<strong className="text-purple-700">{finalScore}</strong>
                              </span>
                            )}
                          </div>
                          {s.predikat && predikatCfg && (
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${predikatCfg.bg} ${predikatCfg.color}`}>{s.predikat}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Form Modal ── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFormModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-800">{editData ? 'Edit SKP' : 'Buat SKP Baru'}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowKamusModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50">
                  <BookOpen className="w-3.5 h-3.5" /> Dari Kamus KPI
                </button>
                <button onClick={() => setShowFormModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                  <select value={formPegawaiId} onChange={e => setFormPegawaiId(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih Pegawai</option>
                    {pegawai.map(p => <option key={p.id} value={p.id}>{p.gelarDepan || ''} {p.nama} — {p.jabatan}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tahun *</label>
                  <select value={formTahun} onChange={e => setFormTahun(Number(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Semester *</label>
                  <select value={formSemester} onChange={e => setFormSemester(Number(e.target.value) as 1 | 2)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={1}>Semester 1 (Jan–Jun)</option>
                    <option value={2}>Semester 2 (Jul–Des)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Draft">Draft</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Butir Kegiatan / Target KPI
                    <span className={`ml-2 text-xs ${totalBobot === 100 ? 'text-green-600' : 'text-red-500'}`}>(Bobot: {totalBobot}% / 100%)</span>
                  </label>
                  <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Plus className="w-3 h-3" /> Tambah</button>
                </div>
                <div className="space-y-3">
                  {formItems.map((item, idx) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-600">Kegiatan #{idx + 1}</p>
                        {formItems.length > 1 && <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Uraian Kegiatan / KPI *</label>
                          <input type="text" value={item.uraianKegiatan} onChange={e => updateItem(item.id, 'uraianKegiatan', e.target.value)}
                            placeholder="Contoh: Kepatuhan pengisian asesmen awal 24 jam"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Target</label>
                            <input type="number" value={item.target || ''} onChange={e => updateItem(item.id, 'target', e.target.value)} placeholder="100"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Satuan</label>
                            <input type="text" value={item.satuan} onChange={e => updateItem(item.id, 'satuan', e.target.value)} placeholder="% / pasien / jam"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Bobot (%)</label>
                            <input type="number" value={item.bobot || ''} onChange={e => updateItem(item.id, 'bobot', e.target.value)} placeholder="25" min={0} max={100}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-800"><strong>Catatan:</strong> SKP ditetapkan di awal periode dan ditandatangani pegawai & pejabat penilai. Total bobot harus = 100%. Nilai Perilaku (30%) akan diinput terpisah di tab Penilaian Perilaku.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowFormModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editData ? 'Perbarui SKP' : 'Simpan SKP'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Kamus KPI mini-modal from form */}
      {showKamusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowKamusModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
              <p className="font-semibold text-gray-800 text-sm">Pilih dari Kamus KPI</p>
              <button onClick={() => setShowKamusModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-2">
              {KAMUS_KPI.map(kpi => (
                <button key={kpi.id} className="w-full text-left p-3 hover:bg-blue-50 rounded-xl border border-gray-100 transition-colors"
                  onClick={() => {
                    setFormItems(prev => [...prev, { id: genItemId(), uraianKegiatan: kpi.nama, target: 100, satuan: kpi.satuan, bobot: 0 }]);
                    setShowKamusModal(false);
                    toast.success(`"${kpi.nama}" ditambahkan`);
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${KPI_KATEGORI_CFG[kpi.kategori].bg} ${KPI_KATEGORI_CFG[kpi.kategori].color}`}>{kpi.kategori}</span>
                    {kpi.isOtomatis && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">⚡ Auto</span>}
                  </div>
                  <p className="text-sm text-gray-700">{kpi.nama}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Satuan: {kpi.satuan} · Benchmark: {kpi.benchmark}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Realisasi Modal */}
      {showRealisasiModal && selectedSKP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRealisasiModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">Input Realisasi Kinerja</h2>
              <button onClick={() => setShowRealisasiModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">{getFullName(selectedSKP.pegawaiId)}</p>
                <p className="text-xs text-blue-600">SKP Semester {selectedSKP.semester} Tahun {selectedSKP.tahun}</p>
              </div>
              <div className="space-y-4">
                {selectedSKP.targetKinerja.map(t => {
                  const real = realisasiValues[t.id] ?? t.realisasi ?? 0;
                  const capai = t.target > 0 ? Math.min(130, Math.round((real / t.target) * 100)) : 0;
                  return (
                    <div key={t.id} className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-3">{t.uraianKegiatan}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Target: {t.target.toLocaleString()} {t.satuan}</label>
                          <input type="number" value={real || ''} onChange={e => setRealisasiValues(prev => ({ ...prev, [t.id]: Number(e.target.value) }))}
                            placeholder="Input realisasi"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Bobot: {t.bobot}%</label>
                          <div className={`h-9 flex items-center px-3 rounded-lg ${capai >= 100 ? 'bg-green-50 text-green-700' : capai >= 75 ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            <span className="text-sm font-semibold">Capaian: {capai}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowRealisasiModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveRealisasi} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan & Hitung Nilai</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSKP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">Detail SKP</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-500">Pegawai</p><p className="font-medium text-gray-800">{getFullName(selectedSKP.pegawaiId)}</p></div>
                <div><p className="text-xs text-gray-500">Periode</p><p className="font-medium text-gray-800">Sem. {selectedSKP.semester} / {selectedSKP.tahun}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CFG[selectedSKP.status]}`}>{selectedSKP.status}</span></div>
                {selectedSKP.nilaiAkhir != null && (
                  <div>
                    <p className="text-xs text-gray-500">Nilai Akhir</p>
                    <p className="font-bold text-gray-800">{selectedSKP.nilaiAkhir} — {selectedSKP.predikat}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {selectedSKP.targetKinerja.map((t, i) => (
                  <div key={t.id} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-600 mb-1">#{i + 1} {t.uraianKegiatan}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Target: {t.target.toLocaleString()} {t.satuan}</span>
                      <span>Bobot: {t.bobot}%</span>
                      {t.realisasi != null && <span className="text-green-600 font-medium">Realisasi: {t.realisasi.toLocaleString()}</span>}
                      {t.nilaiCapaian != null && <span className="font-medium text-blue-600">Capaian: {t.nilaiCapaian.toFixed(1)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <p className="font-semibold text-gray-800 mb-2">Hapus SKP?</p>
            <p className="text-sm text-gray-500 mb-4">Data SKP ini akan dihapus permanen dan tidak dapat dikembalikan.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB 4: Penilaian Perilaku ────────────────────────────────────────────────
function PenilaianPerilakuTab() {
  const { skp, pegawai } = useAppContext();
  const [selectedSKPId, setSelectedSKPId] = useState('');
  const [scores, setScores] = useState<BehaviorScores>({});

  const selectedSKP = skp.find(s => s.id === selectedSKPId);
  const selectedPegawai = selectedSKP ? pegawai.find(p => p.id === selectedSKP.pegawaiId) : null;
  const isSupv = !!(selectedPegawai?.eselon);
  const activeDims = isSupv ? BEHAVIOR_DIMS : BEHAVIOR_DIMS.filter(d => d.forLevel === 'all');

  React.useEffect(() => {
    if (selectedSKPId) setScores(loadBehavior(selectedSKPId));
  }, [selectedSKPId]);

  const behaviorScore = Object.keys(scores).length > 0 ? calcBehaviorScore(scores, isSupv) : null;
  const kpiScore = selectedSKP?.nilaiAkhir ?? null;
  const finalScore = kpiScore != null && behaviorScore != null
    ? Math.round(kpiScore * 0.7 + behaviorScore * 0.3) : null;
  const finalPredikat = finalScore != null ? getNilaiPredikat(finalScore) : null;
  const finalCfg = finalPredikat ? PREDIKAT_CFG[finalPredikat] : null;

  const handleSave = () => {
    if (!selectedSKPId) { toast.error('Pilih SKP terlebih dahulu'); return; }
    if (activeDims.some(d => !scores[d.id])) { toast.error('Nilai semua dimensi perilaku terlebih dahulu'); return; }
    saveBehavior(selectedSKPId, scores);
    toast.success(`Penilaian perilaku tersimpan. Skor Perilaku: ${behaviorScore}`);
  };

  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Brain className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-purple-800">Penilaian Perilaku Kerja (PermenPAN-RB No. 6/2022)</p>
            <p className="text-xs text-purple-600 mt-1">Penilaian perilaku merupakan 30% dari Final Score. KPI/Hasil Kerja = 70%. Dinilai oleh Pejabat Penilai Kinerja (atasan langsung).</p>
          </div>
        </div>
      </div>

      {/* Select SKP */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <label className="text-xs font-medium text-gray-700 block mb-2">Pilih SKP yang akan dinilai perilakunya</label>
        <select value={selectedSKPId} onChange={e => setSelectedSKPId(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="">— Pilih SKP —</option>
          {skp.map(s => {
            const p = pegawai.find(px => px.id === s.pegawaiId);
            const nm = p ? `${p.gelarDepan || ''} ${p.nama}`.trim() : s.pegawaiId;
            return <option key={s.id} value={s.id}>{nm} – Sem. {s.semester}/{s.tahun} [{s.status}]</option>;
          })}
        </select>
      </div>

      {selectedSKP && (
        <div className="space-y-4">
          {/* Pegawai info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {selectedPegawai?.nama.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{selectedPegawai ? `${selectedPegawai.gelarDepan || ''} ${selectedPegawai.nama}`.trim() : '-'}</p>
              <p className="text-xs text-gray-500">{selectedPegawai?.jabatan} · {selectedPegawai?.unitKerja}</p>
              <p className="text-xs text-gray-400">SKP Sem. {selectedSKP.semester}/{selectedSKP.tahun} · KPI Score: <strong>{kpiScore ?? '—'}</strong></p>
            </div>
            {kpiScore != null && (
              <div className={`text-center px-3 py-2 rounded-xl border ${selectedSKP.predikat ? PREDIKAT_CFG[selectedSKP.predikat]?.bg : 'bg-gray-50'}`}>
                <p className="text-[10px] text-gray-500">KPI (70%)</p>
                <p className={`text-xl font-bold ${selectedSKP.predikat ? PREDIKAT_CFG[selectedSKP.predikat]?.color : 'text-gray-800'}`}>{kpiScore}</p>
              </div>
            )}
          </div>

          {/* Behavior Scoring */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">Penilaian Dimensi Perilaku</h3>
            <div className="space-y-5">
              {activeDims.map(dim => {
                const val = scores[dim.id] ?? 0;
                return (
                  <div key={dim.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <dim.icon className="w-4 h-4 text-purple-600" />
                      <p className="text-sm font-semibold text-gray-800">{dim.nama}</p>
                      {dim.forLevel === 'supervisor' && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">Supervisor</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{dim.deskripsi}</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setScores(prev => ({ ...prev, [dim.id]: n }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            val === n
                              ? 'bg-purple-600 text-white border-purple-600 scale-105'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1.5 px-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} className={`text-[9px] flex-1 text-center ${val === n ? 'text-purple-600 font-semibold' : 'text-gray-400'}`}>{BEHAVIOR_LABELS[n]}</span>
                      ))}
                    </div>
                    {val > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${(BEHAVIOR_SCORE[val] / 100) * 100}%` }} />
                        </div>
                        <span className="text-xs text-purple-600 font-semibold w-12 text-right">Skor: {BEHAVIOR_SCORE[val]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Score Card */}
          {behaviorScore != null && (
            <div className={`rounded-xl border-2 p-5 ${finalCfg ? finalCfg.border + ' ' + finalCfg.bg : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-sm font-semibold text-gray-700 mb-3">📊 Ringkasan Final Score</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <p className="text-[10px] text-gray-500 mb-1">KPI Score (70%)</p>
                  <p className="text-xl font-bold text-blue-600">{kpiScore ?? '—'}</p>
                  <p className="text-[10px] text-gray-400">{kpiScore != null ? Math.round(kpiScore * 0.7) : '—'} poin</p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <p className="text-[10px] text-gray-500 mb-1">Perilaku Score (30%)</p>
                  <p className="text-xl font-bold text-purple-600">{behaviorScore}</p>
                  <p className="text-[10px] text-gray-400">{Math.round(behaviorScore * 0.3)} poin</p>
                </div>
                <div className={`p-3 rounded-xl shadow-sm ${finalCfg ? finalCfg.bg : 'bg-white'}`}>
                  <p className="text-[10px] text-gray-500 mb-1">Final Score</p>
                  <p className={`text-xl font-bold ${finalCfg?.color ?? 'text-gray-800'}`}>{finalScore}</p>
                  <p className={`text-[10px] font-semibold ${finalCfg?.color ?? ''}`}>{finalPredikat}</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSave}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Simpan Penilaian Perilaku
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TAB 5: Cascading ─────────────────────────────────────────────────────────
function CascadingTab() {
  const { skp, pegawai } = useAppContext();
  const [selectedBSC, setSelectedBSC] = useState<string | null>(null);
  const [selectedOKR, setSelectedOKR] = useState<string | null>(null);

  const PERSPEKTIF_COLOR: Record<string, string> = {
    'Financial':         'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Customer':          'bg-blue-100 text-blue-700 border-blue-200',
    'Internal Process':  'bg-violet-100 text-violet-700 border-violet-200',
    'Learning & Growth': 'bg-orange-100 text-orange-700 border-orange-200',
  };
  const PERSPEKTIF_ICON: Record<string, string> = { 'Financial': '💰', 'Customer': '🏥', 'Internal Process': '⚙️', 'Learning & Growth': '📚' };
  const STATUS_DOT: Record<string, string> = { 'Achieved': 'bg-emerald-500', 'On Track': 'bg-blue-500', 'At Risk': 'bg-amber-500', 'Behind': 'bg-red-500' };

  const linkedOKRs = selectedBSC
    ? okrObjectives.filter(o => o.bscLink === bscObjectives.find(b => b.id === selectedBSC)?.perspektif)
    : [];
  const linkedSKPItems = selectedOKR
    ? skp.filter(s => s.targetKinerja.some(t =>
        linkedOKRs.find(o => o.id === selectedOKR)?.keyResults.some(kr =>
          t.uraianKegiatan.toLowerCase().includes(kr.title.toLowerCase().slice(0, 10))
        )
      ))
    : [];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-teal-50 to-green-50 border border-teal-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <GitBranch className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-teal-800">Alur Penurunan Kinerja (Performance Cascading)</p>
            <p className="text-xs text-teal-600 mt-0.5">BSC (Level 1 – Direksi) → OKR (Level 2 – Divisi/Bagian) → SKP/KPI (Level 3 – Individu). Klik pada card BSC untuk melihat OKR terkait.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Level 1: BSC */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">1</div>
            <p className="text-sm font-semibold text-gray-700">BSC – Target RS</p>
          </div>
          <div className="space-y-2">
            {bscObjectives.slice(0, 8).map(b => (
              <div key={b.id}
                onClick={() => { setSelectedBSC(selectedBSC === b.id ? null : b.id); setSelectedOKR(null); }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedBSC === b.id ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${PERSPEKTIF_COLOR[b.perspektif] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {PERSPEKTIF_ICON[b.perspektif]} {b.perspektif}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 leading-tight">{b.title}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{b.kpi}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full inline-block ${STATUS_DOT[b.status]}`} />
                    <p className="text-xs font-bold text-gray-700">{b.actual}/{b.target}%</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${b.actual >= b.target ? 'bg-emerald-500' : b.actual >= b.target * 0.9 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min((b.actual / b.target) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 2: OKR */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <p className="text-sm font-semibold text-gray-700">OKR – Target Divisi</p>
          </div>
          {!selectedBSC ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ArrowRight className="w-6 h-6 mb-2 opacity-40" />
              <p className="text-xs text-center">Pilih BSC Objective di sebelah kiri</p>
            </div>
          ) : linkedOKRs.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400">Tidak ada OKR terkait</div>
          ) : (
            <div className="space-y-2">
              {linkedOKRs.slice(0, 4).map(o => (
                <div key={o.id}
                  onClick={() => setSelectedOKR(selectedOKR === o.id ? null : o.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedOKR === o.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                  <p className="text-xs font-medium text-gray-800 mb-1 leading-tight">{o.title}</p>
                  <p className="text-[10px] text-gray-500">{o.ownerName} · {o.level}</p>
                  <div className="mt-2 space-y-1">
                    {o.keyResults.slice(0, 2).map(kr => (
                      <div key={kr.id} className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1">
                          <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${Math.min((kr.currentValue / kr.targetValue) * 100, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500 w-16 text-right truncate">{kr.title.slice(0, 15)}…</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Level 3: SKP */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">3</div>
            <p className="text-sm font-semibold text-gray-700">SKP – Target Individu</p>
          </div>
          {!selectedOKR ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ArrowRight className="w-6 h-6 mb-2 opacity-40" />
              <p className="text-xs text-center">Pilih OKR Objective di sebelah kiri</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Semua SKP aktif dengan OKR terpilih */}
              {skp.filter(s => s.status === 'Aktif').slice(0, 4).map(s => {
                const p = pegawai.find(px => px.id === s.pegawaiId);
                return (
                  <div key={s.id} className="p-3 rounded-xl border border-gray-100 bg-white">
                    <p className="text-xs font-medium text-gray-800 mb-1">{p ? `${p.gelarDepan || ''} ${p.nama}`.trim() : s.pegawaiId}</p>
                    <p className="text-[10px] text-gray-500 mb-2">{p?.unitKerja}</p>
                    {s.targetKinerja.slice(0, 2).map(t => (
                      <div key={t.id} className="flex items-center gap-2 mb-1">
                        <ChevronRight className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        <p className="text-[10px] text-gray-600 leading-tight truncate">{t.uraianKegiatan}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
              {skp.filter(s => s.status === 'Aktif').length === 0 && (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400">Tidak ada SKP aktif</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REMUNERASI HELPER ────────────────────────────────────────────────────────
const GOLONGAN_BASE: Record<string, number> = {
  'I/a':2000,'I/b':2100,'I/c':2200,'I/d':2350,
  'II/a':2600,'II/b':2750,'II/c':2900,'II/d':3100,
  'III/a':3300,'III/b':3500,'III/c':3700,'III/d':3900,
  'IV/a':4200,'IV/b':4400,'IV/c':4600,'IV/d':4800,'IV/e':5000,
};
const REMUNERASI_MULTIPLIER: Record<string, number> = {
  'Sangat Baik': 1.10, 'Baik': 1.00, 'Cukup': 0.85, 'Kurang': 0.70, 'Sangat Kurang': 0.50,
};
function getRemBase(golongan: string) {
  const key = Object.keys(GOLONGAN_BASE).find(k => golongan?.startsWith(k));
  return key ? GOLONGAN_BASE[key] : 3000;
}

function loadCoaching(skpId: string) {
  try { const r = localStorage.getItem(`skp_coaching_${skpId}`); return r || ''; } catch { return ''; }
}
function saveCoaching(skpId: string, val: string) {
  try { localStorage.setItem(`skp_coaching_${skpId}`, val); } catch {}
}

// ─── TAB 6: Output & Dampak ��──────────────────────────────────────────────────
function OutputDampakTab() {
  const { skp, pegawai, kenaikanPangkat, disiplin } = useAppContext();

  const [coachingNotes, setCoachingNotes] = useState<Record<string, string>>({});
  const [showRemunerasi, setShowRemunerasi] = useState(false);

  const employees = useMemo(() => {
    const latestSKPByPegawai = new Map<string, SKPRecord>();
    skp.filter(s => s.status === 'Selesai').forEach(s => {
      const existing = latestSKPByPegawai.get(s.pegawaiId);
      if (!existing || s.tahun > existing.tahun || (s.tahun === existing.tahun && s.semester > existing.semester)) {
        latestSKPByPegawai.set(s.pegawaiId, s);
      }
    });
    return Array.from(latestSKPByPegawai.entries()).map(([pid, s]) => {
      const p = pegawai.find(px => px.id === pid);
      const isSupv = !!(p?.eselon);
      const beh = loadBehavior(s.id);
      const perilakuScore = Object.keys(beh).length > 0 ? calcBehaviorScore(beh, isSupv) : null;
      const kpiScore = s.nilaiAkhir ?? 0;
      const finalScore = perilakuScore != null ? Math.round(kpiScore * 0.7 + perilakuScore * 0.3) : Math.round(kpiScore * 0.7);
      const predikat = getNilaiPredikat(finalScore);
      const hasKPRecent = kenaikanPangkat.some(kp => kp.pegawaiId === pid && kp.status === 'Selesai');
      const hasDisiplin = disiplin.some(d => d.pegawaiId === pid && d.status !== 'Selesai');
      // Remunerasi estimate
      const remBase = getRemBase(p?.golongan || '');
      const remMulti = REMUNERASI_MULTIPLIER[predikat] || 1.0;
      const remEstimate = Math.round(remBase * remMulti);
      return { pid, p, s, kpiScore, perilakuScore, finalScore, predikat, hasKPRecent, hasDisiplin, remEstimate };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }, [skp, pegawai, kenaikanPangkat, disiplin]);

  const rewardList  = employees.filter(e => e.finalScore >= 110);
  const trackList   = employees.filter(e => e.finalScore >= 90 && e.finalScore < 110);
  const monitorList = employees.filter(e => e.finalScore >= 70 && e.finalScore < 90);
  const pembinaanList = employees.filter(e => e.finalScore < 70);

  const IMPACT_ZONES = [
    { label: '🏆 Reward & Remunerasi',   list: rewardList,   color: 'border-emerald-200 bg-emerald-50', badge: 'bg-emerald-600',    note: 'Eligible bonus remunerasi & kenaikan pangkat pilihan' },
    { label: '✅ On Track',               list: trackList,    color: 'border-blue-200 bg-blue-50',       badge: 'bg-blue-600',       note: 'Memenuhi syarat kenaikan pangkat reguler' },
    { label: '⚠️ Monitoring',            list: monitorList,  color: 'border-amber-200 bg-amber-50',     badge: 'bg-amber-500',      note: 'Perlu peningkatan, koordinasi dengan atasan' },
    { label: '🚨 Program Pembinaan',      list: pembinaanList,color: 'border-red-200 bg-red-50',         badge: 'bg-red-600',        note: 'Wajib masuk program coaching & pembinaan' },
  ];

  return (
    <div className="space-y-5">
      {/* Formula card */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-semibold">Formula Final Score & Dampak HR</p>
          </div>
          <button onClick={() => setShowRemunerasi(v => !v)}
            className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            {showRemunerasi ? 'Sembunyikan' : 'Tampilkan'} Estimasi Remunerasi
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white/10 rounded-xl">
            <p className="text-[10px] text-gray-400 mb-1">KPI / Hasil Kerja</p>
            <p className="text-2xl font-bold text-blue-400">70%</p>
            <p className="text-[10px] text-gray-400">Dari nilaiAkhir SKP</p>
          </div>
          <div className="flex items-center justify-center text-2xl text-gray-400 font-bold">+</div>
          <div className="p-3 bg-white/10 rounded-xl">
            <p className="text-[10px] text-gray-400 mb-1">Perilaku Kerja</p>
            <p className="text-2xl font-bold text-purple-400">30%</p>
            <p className="text-[10px] text-gray-400">Dari Penilaian Perilaku</p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">Final Score = (KPI × 0.7) + (Perilaku × 0.3) · PermenPAN-RB No. 6/2022</p>
        {showRemunerasi && (
          <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs font-semibold text-yellow-300 mb-2">📊 Tabel Estimasi Remunerasi (Tunjangan Kinerja)</p>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              {Object.entries(REMUNERASI_MULTIPLIER).map(([pred, multi]) => (
                <div key={pred} className="flex items-center justify-between bg-white/10 rounded-lg px-2 py-1.5">
                  <span className="text-gray-300">{pred}</span>
                  <span className="text-yellow-300 font-bold">{(multi * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-gray-500 mt-2">* Estimasi berdasarkan golongan × multiplier predikat. Angka aktual mengacu pada Perpres Tunjangan Kinerja.</p>
          </div>
        )}
      </div>

      {/* Impact Zones */}
      {IMPACT_ZONES.map(zone => (
        <div key={zone.label} className={`rounded-xl border-2 p-4 ${zone.color}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800">{zone.label}</p>
            <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${zone.badge}`}>{zone.list.length} pegawai</span>
          </div>
          <p className="text-xs text-gray-600 mb-3">{zone.note}</p>
          {zone.list.length > 0 ? (
            <div className="space-y-2">
              {zone.list.map(e => {
                const predikatCfg = PREDIKAT_CFG[e.predikat];
                const isCoachingZone = zone.label.includes('Pembinaan') || zone.label.includes('Monitoring');
                const coaching = coachingNotes[e.pid] ?? loadCoaching(e.s.id);
                return (
                  <div key={e.pid} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {e.p?.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 leading-tight">{e.p ? `${e.p.gelarDepan || ''} ${e.p.nama}`.trim() : e.pid}</p>
                          <p className="text-[10px] text-gray-500">{e.p?.jabatan?.slice(0,30)} · Sem. {e.s.semester}/{e.s.tahun}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <div className="text-center px-2">
                          <p className="text-[10px] text-gray-400">KPI</p>
                          <p className="text-xs font-bold text-blue-600">{e.kpiScore}</p>
                        </div>
                        {e.perilakuScore != null && (
                          <div className="text-center px-2">
                            <p className="text-[10px] text-gray-400">Perilaku</p>
                            <p className="text-xs font-bold text-purple-600">{e.perilakuScore}</p>
                          </div>
                        )}
                        <div className="text-center px-2">
                          <p className="text-[10px] text-gray-400">Final</p>
                          <p className={`text-sm font-bold ${predikatCfg?.color ?? 'text-gray-800'}`}>{e.finalScore}</p>
                        </div>
                        {showRemunerasi && (
                          <div className="text-center px-2">
                            <p className="text-[10px] text-gray-400">Est. Remun.</p>
                            <p className="text-xs font-bold text-amber-600">{e.remEstimate.toLocaleString('id')}rb</p>
                          </div>
                        )}
                        <div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${predikatCfg?.bg ?? 'bg-gray-100'} ${predikatCfg?.color ?? 'text-gray-600'}`}>{e.predikat}</span>
                          {e.hasDisiplin && <p className="text-[9px] text-red-500 mt-0.5">⚠ Disiplin aktif</p>}
                          {e.hasKPRecent && <p className="text-[9px] text-emerald-600 mt-0.5">✓ KP selesai</p>}
                        </div>
                      </div>
                    </div>
                    {isCoachingZone && (
                      <div className="mt-2 pt-2 border-t border-gray-50">
                        <input
                          type="text"
                          defaultValue={coaching}
                          onBlur={ev => { saveCoaching(e.s.id, ev.target.value); setCoachingNotes(prev => ({ ...prev, [e.pid]: ev.target.value })); }}
                          placeholder="📝 Catatan pembinaan / coaching dari atasan..."
                          className="w-full text-[11px] border border-dashed border-orange-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-orange-50/40 placeholder-gray-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">Tidak ada pegawai di kategori ini</p>
          )}
        </div>
      ))}

      {employees.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Belum ada SKP yang selesai dinilai</p>
          <p className="text-xs text-gray-400 mt-1">Selesaikan input realisasi di tab SKP Aktif</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function SKP() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [importedKPI, setImportedKPI] = useState<KPIEntry | null>(null);

  const handleImportKPI = useCallback((kpi: KPIEntry) => {
    setImportedKPI(kpi);
    setActiveTab('skp');
    toast.info(`Beralih ke tab SKP Aktif. Buat SKP baru untuk menggunakan KPI ini.`);
  }, []);

  const clearImportedKPI = useCallback(() => setImportedKPI(null), []);

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">SKP & Penilaian Kinerja</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sasaran Kinerja Pegawai · Cascading BSC/OKR → SKP/KPI · PermenPAN-RB No. 6/2022
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-1">
            <Zap className="w-3 h-3" /> Automated KPI Sync: ON
          </span>
          <button onClick={() => setActiveTab('approval')}
            className="text-xs px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 hover:bg-blue-200 transition-colors">
            <FileCheck className="w-3 h-3" /> Approval Workflow
          </button>
          <button onClick={() => setActiveTab('laporan')}
            className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-1 hover:bg-gray-200 transition-colors">
            <Printer className="w-3 h-3" /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-1 mb-6 bg-gray-100 rounded-xl p-1 scrollbar-hide">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard'  && <DashboardTab onTabChange={setActiveTab} />}
      {activeTab === 'kamus'      && <KamusKPITab onImportKPI={handleImportKPI} />}
      {activeTab === 'skp'        && <SKPAktifTab importedKPI={importedKPI} clearImportedKPI={clearImportedKPI} />}
      {activeTab === 'perilaku'   && <PenilaianPerilakuTab />}
      {activeTab === 'cascading'  && <CascadingTab />}
      {activeTab === 'output'     && <OutputDampakTab />}
      {activeTab === 'profil'     && <ProfilKinerjaTab />}
      {activeTab === 'approval'   && <ApprovalTab />}
      {activeTab === 'laporan'    && <LaporanTab />}
    </div>
  );
}
