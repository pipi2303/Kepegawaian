import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../components/Layout';
import SearchBar, { filterRecords } from '../components/SearchBar';
import {
  TrendingUp, Target, Award, Users, CheckCircle2, AlertTriangle,
  RefreshCw, Download, FileText, Plus, Edit, Eye, Filter,
  Building, ChevronRight, X, ArrowUpRight, BarChart3, PieChart as PieChartIcon,
  ShieldCheck, Activity, Clock, Stethoscope, Sliders, Save, Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface StaffKpi {
  id: number;
  nip: string;
  nama: string;
  gelar_depan?: string;
  gelar_belakang?: string;
  jabatan: string;
  unit_kerja: string;
  periode: string;
  skor_total: number;
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  metrics: {
    respon_time: number; // weight 25%
    keselamatan_pasien: number; // weight 25%
    disiplin_presensi: number; // weight 20%
    kelengkapan_rme: number; // weight 15%
    kepuasan_pasien: number; // weight 15%
  };
  catatan_atasan?: string;
  remunerasi_faktor: number; // multiplier e.g. 1.1x, 1.0x, 0.9x
}

const INITIAL_STAFF_KPIS: StaffKpi[] = [
  {
    id: 1,
    nip: '198204122008011005',
    nama: 'Marzuqi Sayuti',
    gelar_depan: 'dr.',
    gelar_belakang: 'Sp.An-TI',
    jabatan: 'Dokter Spesialis Anestesiologi & Terapi Intensif',
    unit_kerja: 'Instalasi Gawat Darurat (IGD)',
    periode: 'September 2026',
    skor_total: 94.5,
    predikat: 'Sangat Baik',
    metrics: {
      respon_time: 98,
      keselamatan_pasien: 96,
      disiplin_presensi: 92,
      kelengkapan_rme: 90,
      kepuasan_pasien: 96,
    },
    catatan_atasan: 'Sangat sigap dalam resusitasi kritis IGD dan kepatuhan clinical pathway operasi darurat.',
    remunerasi_faktor: 1.15,
  },
  {
    id: 2,
    nip: '198906232014022003',
    nama: 'Jumiah',
    gelar_depan: 'Ns.',
    gelar_belakang: 'S.Kep., M.Kep',
    jabatan: 'Perawat Primer ICU',
    unit_kerja: 'Intensive Care Unit (ICU)',
    periode: 'September 2026',
    skor_total: 92.0,
    predikat: 'Sangat Baik',
    metrics: {
      respon_time: 94,
      keselamatan_pasien: 98,
      disiplin_presensi: 90,
      kelengkapan_rme: 88,
      kepuasan_pasien: 90,
    },
    catatan_atasan: 'Pengawasan ventilator dan bundle VAP zero-infection di ICU sangat konsisten.',
    remunerasi_faktor: 1.1,
  },
  {
    id: 3,
    nip: '199211042019032011',
    nama: 'Siti Nurhaliza',
    gelar_depan: 'Bd.',
    gelar_belakang: 'S.Tr.Keb',
    jabatan: 'Bidan Mahir / Pelaksana Lanjutan',
    unit_kerja: 'Kamar Bersalin (VK Sentral)',
    periode: 'September 2026',
    skor_total: 88.5,
    predikat: 'Baik',
    metrics: {
      respon_time: 90,
      keselamatan_pasien: 92,
      disiplin_presensi: 88,
      kelengkapan_rme: 84,
      kepuasan_pasien: 88,
    },
    catatan_atasan: 'Pelayanan persalinan aman, waktu pengisian partograf digital tepat waktu.',
    remunerasi_faktor: 1.0,
  },
  {
    id: 4,
    nip: '198703152010011002',
    nama: 'Rahmat Hidayat',
    gelar_depan: 'apt.',
    gelar_belakang: 'S.Farm',
    jabatan: 'Apoteker Penanggung Jawab Farmasi',
    unit_kerja: 'Instalasi Farmasi Sentral',
    periode: 'September 2026',
    skor_total: 86.8,
    predikat: 'Baik',
    metrics: {
      respon_time: 85,
      keselamatan_pasien: 94,
      disiplin_presensi: 86,
      kelengkapan_rme: 82,
      kepuasan_pasien: 87,
    },
    catatan_atasan: 'Screening resep LASA dan kepatuhan stok obat emergency IGD terpelihara baik.',
    remunerasi_faktor: 1.0,
  },
  {
    id: 5,
    nip: '199408192020121004',
    nama: 'Dedi Kurniawan',
    gelar_depan: '',
    gelar_belakang: 'A.Md.Rad',
    jabatan: 'Radiografer Pelaksana',
    unit_kerja: 'Instalasi Radiologi',
    periode: 'September 2026',
    skor_total: 85.2,
    predikat: 'Baik',
    metrics: {
      respon_time: 86,
      keselamatan_pasien: 90,
      disiplin_presensi: 84,
      kelengkapan_rme: 80,
      kepuasan_pasien: 86,
    },
    catatan_atasan: 'Hasil expertise foto cito IGD selesai rata-rata di bawah 30 menit.',
    remunerasi_faktor: 1.0,
  },
  {
    id: 6,
    nip: '197505101998031001',
    nama: 'Lukman Pura',
    gelar_depan: 'Dr. dr.',
    gelar_belakang: 'Sp.PD-KGEH',
    jabatan: 'Direktur Utama / Spesialis Penyakit Dalam',
    unit_kerja: 'Direksi & Poliklinik',
    periode: 'September 2026',
    skor_total: 96.0,
    predikat: 'Sangat Baik',
    metrics: {
      respon_time: 96,
      keselamatan_pasien: 98,
      disiplin_presensi: 95,
      kelengkapan_rme: 94,
      kepuasan_pasien: 97,
    },
    catatan_atasan: 'Keteladanan tata kelola klinis dan akselerasi transformasi SIMRS RSUDAM.',
    remunerasi_faktor: 1.2,
  },
  {
    id: 7,
    nip: '202301150012',
    nama: 'Agus Santoso',
    gelar_depan: '',
    gelar_belakang: 'S.Kom',
    jabatan: 'Staff IT SIMRS',
    unit_kerja: 'Instalasi SIMRS & Teknologi Informasi',
    periode: 'September 2026',
    skor_total: 78.4,
    predikat: 'Cukup',
    metrics: {
      respon_time: 75,
      keselamatan_pasien: 85,
      disiplin_presensi: 80,
      kelengkapan_rme: 74,
      kepuasan_pasien: 78,
    },
    catatan_atasan: 'Tingkatkan kecepatan resolusi tiket troubleshooting printer resep di rawat inap.',
    remunerasi_faktor: 0.9,
  },
  {
    id: 8,
    nip: '198009122005012008',
    nama: 'Ratna Dewi',
    gelar_depan: 'Ns.',
    gelar_belakang: 'S.Kep',
    jabatan: 'Kepala Ruangan Rawat Inap Bedah',
    unit_kerja: 'Ruang Alamanda (Bedah)',
    periode: 'September 2026',
    skor_total: 91.8,
    predikat: 'Sangat Baik',
    metrics: {
      respon_time: 92,
      keselamatan_pasien: 95,
      disiplin_presensi: 90,
      kelengkapan_rme: 89,
      kepuasan_pasien: 93,
    },
    catatan_atasan: 'Manajemen asuhan keperawatan pre dan post operasi terlaksana sangat rapi.',
    remunerasi_faktor: 1.1,
  },
];

const MONTHLY_TREND_DATA = [
  { bulan: 'Jan', target: 85, aktual: 82.4, igd: 84.1, icu: 83.2 },
  { bulan: 'Feb', target: 85, aktual: 83.8, igd: 85.5, icu: 84.7 },
  { bulan: 'Mar', target: 85, aktual: 85.1, igd: 87.0, icu: 86.1 },
  { bulan: 'Apr', target: 85, aktual: 84.7, igd: 86.8, icu: 85.0 },
  { bulan: 'Mei', target: 85, aktual: 86.3, igd: 89.2, icu: 87.4 },
  { bulan: 'Jun', target: 85, aktual: 87.5, igd: 90.4, icu: 88.9 },
  { bulan: 'Jul', target: 85, aktual: 86.9, igd: 91.2, icu: 88.0 },
  { bulan: 'Agt', target: 85, aktual: 88.0, igd: 92.5, icu: 89.6 },
  { bulan: 'Sep', target: 85, aktual: 89.4, igd: 93.6, icu: 91.2 },
];

const RADAR_DIMENSIONS = [
  { dimensi: 'Respon Time Pelayanan', skor: 91.5, target: 85 },
  { dimensi: 'Keselamatan Pasien (KPRS)', skor: 94.0, target: 90 },
  { dimensi: 'Kedisiplinan & Presensi', skor: 87.2, target: 85 },
  { dimensi: 'Kelengkapan RME 24 Jam', skor: 85.6, target: 85 },
  { dimensi: 'Kepuasan Pasien (IKM)', skor: 89.8, target: 85 },
  { dimensi: 'Diklat & Kompetensi SKP', skor: 82.5, target: 80 },
];

const UNIT_PERFORMANCE = [
  { unit: 'IGD Cito', skor: 93.6, target: 85 },
  { unit: 'ICU / PICU', skor: 91.2, target: 85 },
  { unit: 'Bedah Sentral', skor: 89.5, target: 85 },
  { unit: 'VK Bersalin', skor: 88.4, target: 85 },
  { unit: 'Rawat Jalan', skor: 87.0, target: 85 },
  { unit: 'Farmasi Sentral', skor: 86.5, target: 85 },
  { unit: 'Radiologi', skor: 85.8, target: 85 },
  { unit: 'Laboratorium', skor: 84.9, target: 85 },
];

const PIE_DISTRIBUTION = [
  { name: 'Sangat Baik (≥ 90%)', value: 46.2, color: '#013E37' },
  { name: 'Baik (80 - 89%)', value: 44.8, color: '#0D9488' },
  { name: 'Cukup (70 - 79%)', value: 7.5, color: '#F59E0B' },
  { name: 'Kurang (< 70%)', value: 1.5, color: '#EF4444' },
];

export default function KpiTracking() {
  const [staffKpis, setStaffKpis] = useState<StaffKpi[]>(INITIAL_STAFF_KPIS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('Semua Unit');
  const [predicateFilter, setPredicateFilter] = useState('Semua Predikat');
  const [activeChartTab, setActiveChartTab] = useState<'trend' | 'radar' | 'units'>('trend');

  // Modal State for Setting/Editing Staff KPI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffKpi | null>(null);
  const [formMetrics, setFormMetrics] = useState({
    respon_time: 85,
    keselamatan_pasien: 90,
    disiplin_presensi: 85,
    kelengkapan_rme: 85,
    kepuasan_pasien: 85,
    catatan_atasan: '',
  });

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Calculate overall score from form metrics (weighted)
  const calculatedScore = useMemo(() => {
    const { respon_time, keselamatan_pasien, disiplin_presensi, kelengkapan_rme, kepuasan_pasien } = formMetrics;
    const total =
      respon_time * 0.25 +
      keselamatan_pasien * 0.25 +
      disiplin_presensi * 0.20 +
      kelengkapan_rme * 0.15 +
      kepuasan_pasien * 0.15;
    return Math.round(total * 10) / 10;
  }, [formMetrics]);

  const calculatedPredicate = useMemo(() => {
    if (calculatedScore >= 90) return 'Sangat Baik';
    if (calculatedScore >= 80) return 'Baik';
    if (calculatedScore >= 70) return 'Cukup';
    return 'Kurang';
  }, [calculatedScore]);

  // Open Edit Modal
  const handleOpenSetKpi = (staff: StaffKpi) => {
    setEditingStaff(staff);
    setFormMetrics({
      respon_time: staff.metrics.respon_time,
      keselamatan_pasien: staff.metrics.keselamatan_pasien,
      disiplin_presensi: staff.metrics.disiplin_presensi,
      kelengkapan_rme: staff.metrics.kelengkapan_rme,
      kepuasan_pasien: staff.metrics.kepuasan_pasien,
      catatan_atasan: staff.catatan_atasan || '',
    });
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveKpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    let multiplier = 1.0;
    if (calculatedScore >= 90) multiplier = 1.15;
    else if (calculatedScore >= 80) multiplier = 1.0;
    else if (calculatedScore >= 70) multiplier = 0.9;
    else multiplier = 0.75;

    const updated = staffKpis.map((item) => {
      if (item.id === editingStaff.id) {
        return {
          ...item,
          skor_total: calculatedScore,
          predikat: calculatedPredicate as any,
          metrics: {
            respon_time: formMetrics.respon_time,
            keselamatan_pasien: formMetrics.keselamatan_pasien,
            disiplin_presensi: formMetrics.disiplin_presensi,
            kelengkapan_rme: formMetrics.kelengkapan_rme,
            kepuasan_pasien: formMetrics.kepuasan_pasien,
          },
          catatan_atasan: formMetrics.catatan_atasan,
          remunerasi_faktor: multiplier,
        };
      }
      return item;
    });

    setStaffKpis(updated);
    setIsModalOpen(false);
    showToast(`Metrik KPI untuk ${editingStaff.nama} berhasil diperbarui (Skor: ${calculatedScore}% - ${calculatedPredicate}).`);
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    let list = staffKpis;

    if (unitFilter !== 'Semua Unit') {
      list = list.filter((s) => s.unit_kerja.includes(unitFilter) || s.unit_kerja === unitFilter);
    }

    if (predicateFilter !== 'Semua Predikat') {
      list = list.filter((s) => s.predikat === predicateFilter);
    }

    if (searchQuery.trim()) {
      list = filterRecords(list, searchQuery, ['nama', 'nip', 'jabatan', 'unit_kerja']);
    }

    return list;
  }, [staffKpis, unitFilter, predicateFilter, searchQuery]);

  // Export to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const printDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    // Header banner
    doc.setFillColor(1, 62, 55);
    doc.rect(14, 10, 269, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(1, 62, 55);
    doc.text('RSUD Dr. H. ABDUL MOELOEK PROVINSI LAMPUNG', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Laporan Evaluasi & Rekapitulasi Key Performance Indicators (KPI) Staf Rumah Sakit', 14, 25);
    doc.text(`Periode: September 2026 | Total Dievaluasi: ${filteredStaff.length} Orang | Tanggal Cetak: ${printDate}`, 14, 30);

    const rows = filteredStaff.map((s, idx) => [
      (idx + 1).toString(),
      s.nip,
      `${s.gelar_depan ? s.gelar_depan + ' ' : ''}${s.nama}${s.gelar_belakang ? ', ' + s.gelar_belakang : ''}`,
      s.jabatan,
      s.unit_kerja,
      `${s.skor_total}%`,
      s.predikat,
      `${s.remunerasi_faktor}x`,
      s.catatan_atasan || '-',
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['No', 'NIP', 'Nama Pegawai', 'Jabatan', 'Unit Kerja', 'Skor KPI', 'Predikat', 'Indeks Remun', 'Catatan Evaluasi']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [1, 62, 55], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 32 },
        2: { cellWidth: 46, fontStyle: 'bold' },
        3: { cellWidth: 44 },
        4: { cellWidth: 36 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'center', cellWidth: 22 },
        7: { halign: 'center', cellWidth: 18 },
        8: { cellWidth: 47 },
      },
    });

    doc.save(`Laporan_KPI_Pegawai_RSUDAM_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Laporan KPI format PDF berhasil diunduh.');
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['No', 'NIP', 'Nama Pegawai', 'Jabatan', 'Unit Kerja', 'Skor KPI (%)', 'Predikat', 'Respon Time', 'Keselamatan Pasien', 'Presensi', 'RME 24 Jam', 'Kepuasan Pasien', 'Faktor Remunerasi'];
    const rows = filteredStaff.map((s, idx) => [
      idx + 1,
      `'${s.nip}`,
      `"${s.nama}"`,
      `"${s.jabatan}"`,
      `"${s.unit_kerja}"`,
      s.skor_total,
      `"${s.predikat}"`,
      s.metrics.respon_time,
      s.metrics.keselamatan_pasien,
      s.metrics.disiplin_presensi,
      s.metrics.kelengkapan_rme,
      s.metrics.kepuasan_pasien,
      s.remunerasi_faktor,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_KPI_Pegawai_RSUDAM_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Laporan KPI format CSV/Excel berhasil diunduh.');
  };

  return (
    <Layout>
      <Head title="Pelacakan KPI & Kinerja Staf - HCMS RSUDAM" />

      <div className="space-y-6">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-emerald-900 text-white border-emerald-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-white/70 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Performance Management & Remunerasi</span>
              </span>
              <span className="text-xs text-gray-400">Periode: September 2026</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              Modul Pelacakan KPI & Kinerja Pegawai Rumah Sakit
            </h1>
            <p className="text-sm text-gray-500">
              Penetapan target metrik bulanan, visualisasi grafik capaian klinis/operasional, dan penentuan indeks remunerasi pegawai RSUD Dr. H. Abdul Moeloek
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ekspor PDF</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={() => handleOpenSetKpi(staffKpis[0])}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#013E37] hover:bg-[#025046] rounded-xl transition shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-300" />
              <span>Atur Target & Evaluasi KPI</span>
            </button>
          </div>
        </div>

        {/* Top KPI Summary Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rata-Rata KPI RS</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-[#013E37]">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#013E37] mt-2">89.4%</div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+4.4% di atas target RS (85%)</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Predikat Sangat Baik</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-purple-900 mt-2">46.2%</div>
            <div className="text-[11px] text-gray-500 mt-1">740 dari 1.603 Pegawai</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Kerja Tertinggi</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-blue-900 mt-2">93.6%</div>
            <div className="text-[11px] text-gray-500 mt-1">Instalasi Gawat Darurat (IGD)</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kepatuhan RME 24J</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-800 mt-2">85.6%</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Standar Akreditasi KARS Terpenuhi</div>
          </div>
        </div>

        {/* VISUALIZATION SECTION: CHARTS WITH TAB TOGGLE */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#013E37]" />
                <span>Visualisasi Kinerja Bulanan & Analisis Dimensi Mutu</span>
              </h3>
              <p className="text-xs text-gray-500">
                Grafik visual interaktif untuk evaluasi komprehensif performa nakes dan instalasi rumah sakit
              </p>
            </div>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveChartTab('trend')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeChartTab === 'trend'
                    ? 'bg-white text-[#013E37] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Tren Capaian Bulanan
              </button>
              <button
                onClick={() => setActiveChartTab('radar')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeChartTab === 'radar'
                    ? 'bg-white text-[#013E37] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Radar 6 Dimensi Mutu
              </button>
              <button
                onClick={() => setActiveChartTab('units')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeChartTab === 'units'
                    ? 'bg-white text-[#013E37] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Komparasi Unit Kerja
              </button>
            </div>
          </div>

          {/* TAB 1: MONTHLY TREND AREA CHART */}
          {activeChartTab === 'trend' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Grafik Perkembangan Rata-Rata Capaian KPI Bulanan (Januari - September 2026)</span>
                <span className="font-bold text-[#013E37]">Target RS: 85.0%</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MONTHLY_TREND_DATA} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAktual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#013E37" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#013E37" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorIgd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="bulan" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis domain={[75, 100]} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                      formatter={(val: any) => [`${val}%`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="aktual" name="Rata-Rata Rumah Sakit" stroke="#013E37" strokeWidth={3} fillOpacity={1} fill="url(#colorAktual)" />
                    <Area type="monotone" dataKey="target" name="Target Standar (85%)" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                    <Area type="monotone" dataKey="igd" name="Instalasi Gawat Darurat (IGD)" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#colorIgd)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 2: RADAR CHART (6 MUTU DIMENSIONS) */}
          {activeChartTab === 'radar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} data={RADAR_DIMENSIONS}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="dimensi" tick={{ fontSize: 10, fill: '#334155' }} />
                    <PolarRadiusAxis angle={30} domain={[60, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Capaian Aktual (%)" dataKey="skor" stroke="#013E37" fill="#013E37" fillOpacity={0.5} />
                    <Radar name="Batas Target (%)" dataKey="target" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Tooltip formatter={(val: any) => [`${val}%`, '']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 text-xs">
                <div className="font-bold text-gray-900 text-sm">6 Dimensi Standar Akreditasi Kemenkes</div>
                <p className="text-gray-500 leading-relaxed text-[11px]">
                  Penilaian KPI rumah sakit mengintegrasikan indikator klinis dan keselamatan pasien (KPRS) sesuai regulasi Permenkes RI:
                </p>
                <div className="space-y-2">
                  {RADAR_DIMENSIONS.map((dim, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="font-medium text-gray-700">{dim.dimensi}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">Target: {dim.target}%</span>
                        <strong className={`font-bold ${dim.skor >= dim.target ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {dim.skor}%
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UNIT PERFORMANCE COMPARISON */}
          {activeChartTab === 'units' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Peringkat Capaian Indeks KPI Berdasarkan Unit Kerja / Instalasi</span>
                <span className="text-emerald-700 font-semibold">Seluruh unit melampaui target minimum (85%)</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={UNIT_PERFORMANCE} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" domain={[70, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="unit" tick={{ fontSize: 11, fill: '#334155' }} />
                    <Tooltip formatter={(val: any) => [`${val}%`, 'Skor Rata-Rata']} />
                    <Bar dataKey="skor" name="Skor Capaian (%)" fill="#013E37" radius={[0, 8, 8, 0]}>
                      {UNIT_PERFORMANCE.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.skor >= 90 ? '#013E37' : '#0D9488'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* STAFF KPI EVALUATION TABLE & HR MANAGEMENT SECTION */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#013E37]" />
                <span>Daftar Evaluasi Kinerja Pegawai (Individu Nakes)</span>
              </h3>
              <p className="text-xs text-gray-500">
                Pilih pegawai untuk mengubah skor target metrik, menambahkan catatan kinerja, dan mengevaluasi indeks remunerasi
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              Evaluasi Bulan Berjalan: September 2026
            </span>
          </div>

          {/* SearchBar & Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari nama pegawai, NIP, atau jabatan..."
                resultsCount={filteredStaff.length}
                totalCount={staffKpis.length}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
              >
                <option value="Semua Unit">Semua Unit Kerja</option>
                <option value="IGD">Instalasi Gawat Darurat (IGD)</option>
                <option value="ICU">Intensive Care Unit (ICU)</option>
                <option value="Bedah">Ruang Alamanda Bedah</option>
                <option value="VK">Kamar Bersalin (VK)</option>
                <option value="Farmasi">Farmasi Sentral</option>
                <option value="Radiologi">Radiologi</option>
                <option value="SIMRS">SIMRS & IT</option>
              </select>

              <select
                value={predicateFilter}
                onChange={(e) => setPredicateFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
              >
                <option value="Semua Predikat">Semua Predikat</option>
                <option value="Sangat Baik">Sangat Baik (≥ 90%)</option>
                <option value="Baik">Baik (80 - 89%)</option>
                <option value="Cukup">Cukup (70 - 79%)</option>
                <option value="Kurang">Kurang (&lt; 70%)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Pegawai & NIP</th>
                  <th className="p-3.5">Jabatan / Profesi</th>
                  <th className="p-3.5">Unit Kerja</th>
                  <th className="p-3.5">Skor & Progress KPI</th>
                  <th className="p-3.5 text-center">Predikat</th>
                  <th className="p-3.5 text-center">Indeks Remunerasi</th>
                  <th className="p-3.5 text-right">Aksi HR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => {
                    const isSangatBaik = staff.predikat === 'Sangat Baik';
                    const isBaik = staff.predikat === 'Baik';
                    const isCukup = staff.predikat === 'Cukup';

                    return (
                      <tr key={staff.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900">
                            {staff.gelar_depan ? `${staff.gelar_depan} ` : ''}
                            {staff.nama}
                            {staff.gelar_belakang ? `, ${staff.gelar_belakang}` : ''}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">NIP. {staff.nip}</div>
                        </td>

                        <td className="p-3.5 text-gray-700">{staff.jabatan}</td>

                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700 font-medium text-[11px] border border-gray-200">
                            <Building className="w-3 h-3 text-gray-400" />
                            <span>{staff.unit_kerja}</span>
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="w-36 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-extrabold text-gray-900">{staff.skor_total}%</span>
                              <span className="text-[10px] text-gray-400">Target: 85%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isSangatBaik
                                    ? 'bg-[#013E37]'
                                    : isBaik
                                    ? 'bg-teal-600'
                                    : isCukup
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(staff.skor_total, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isSangatBaik
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : isBaik
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isCukup
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {staff.predikat}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                            {staff.remunerasi_faktor}x
                          </span>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenSetKpi(staff)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#013E37] text-white hover:bg-[#025046] font-semibold text-[11px] rounded-lg transition shadow-2xs"
                            title="Atur Target & Evaluasi KPI"
                          >
                            <Sliders className="w-3 h-3 text-emerald-300" />
                            <span>Set KPI</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      Tidak ada data staf yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* HR KPI GOAL-SETTING & EVALUATION MODAL */}
      {isModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  HR Goal-Setting & Evaluasi
                </span>
                <h3 className="font-bold text-base text-gray-900 mt-1">
                  Atur Target & Nilai Metrik KPI Pegawai
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveKpi} className="p-6 space-y-5 text-xs">
              {/* Staff Profile Overview */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">
                    {editingStaff.gelar_depan ? `${editingStaff.gelar_depan} ` : ''}
                    {editingStaff.nama}
                    {editingStaff.gelar_belakang ? `, ${editingStaff.gelar_belakang}` : ''}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">NIP. {editingStaff.nip}</div>
                  <div className="text-[11px] text-[#013E37] font-semibold mt-0.5">{editingStaff.jabatan}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Skor Terhitung</div>
                  <div className="text-2xl font-extrabold text-[#013E37]">{calculatedScore}%</div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      calculatedPredicate === 'Sangat Baik'
                        ? 'bg-purple-100 text-purple-800'
                        : calculatedPredicate === 'Baik'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {calculatedPredicate}
                  </span>
                </div>
              </div>

              {/* Sliders for the 5 Key Hospital KPI Metrics */}
              <div className="space-y-4">
                <span className="font-bold text-gray-900 text-xs block">
                  Penilaian 5 Pilar Dimensi Pelayanan (Bobot Standar RS)
                </span>

                {/* 1. Respon Time Pelayanan */}
                <div className="space-y-1.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-700">1. Respon Time Pelayanan (Bobot 25%)</label>
                    <span className="font-bold text-[#013E37] text-xs">{formMetrics.respon_time}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={formMetrics.respon_time}
                    onChange={(e) => setFormMetrics({ ...formMetrics, respon_time: Number(e.target.value) })}
                    className="w-full accent-[#013E37] cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-400">Kecepatan triage, respon visite, atau penyiapan obat cito</div>
                </div>

                {/* 2. Keselamatan Pasien */}
                <div className="space-y-1.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-700">2. Kepatuhan SOP & Keselamatan Pasien (Bobot 25%)</label>
                    <span className="font-bold text-[#013E37] text-xs">{formMetrics.keselamatan_pasien}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={formMetrics.keselamatan_pasien}
                    onChange={(e) => setFormMetrics({ ...formMetrics, keselamatan_pasien: Number(e.target.value) })}
                    className="w-full accent-[#013E37] cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-400">Cuci tangan 6 langkah, identifikasi gelang pasien, zero IKP</div>
                </div>

                {/* 3. Disiplin Presensi */}
                <div className="space-y-1.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-700">3. Kedisiplinan & Presensi Jam Kerja (Bobot 20%)</label>
                    <span className="font-bold text-[#013E37] text-xs">{formMetrics.disiplin_presensi}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={formMetrics.disiplin_presensi}
                    onChange={(e) => setFormMetrics({ ...formMetrics, disiplin_presensi: Number(e.target.value) })}
                    className="w-full accent-[#013E37] cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-400">Ketepatan check-in shift nakes dan kelengkapan jam kerja</div>
                </div>

                {/* 4. Kelengkapan RME */}
                <div className="space-y-1.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-700">4. Kelengkapan Rekam Medis (RME) 24J (Bobot 15%)</label>
                    <span className="font-bold text-[#013E37] text-xs">{formMetrics.kelengkapan_rme}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={formMetrics.kelengkapan_rme}
                    onChange={(e) => setFormMetrics({ ...formMetrics, kelengkapan_rme: Number(e.target.value) })}
                    className="w-full accent-[#013E37] cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-400">Resume medis, SOAP, dan verifikasi tindakan klinis digital</div>
                </div>

                {/* 5. Kepuasan Pasien */}
                <div className="space-y-1.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-700">5. Kepuasan Pasien & Mutu Asuhan (Bobot 15%)</label>
                    <span className="font-bold text-[#013E37] text-xs">{formMetrics.kepuasan_pasien}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={formMetrics.kepuasan_pasien}
                    onChange={(e) => setFormMetrics({ ...formMetrics, kepuasan_pasien: Number(e.target.value) })}
                    className="w-full accent-[#013E37] cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-400">Hasil kuesioner IKM unit dan zero komplain pelayanan</div>
                </div>
              </div>

              {/* Catatan Evaluasi Atasan */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Catatan & Arahan Kepala Ruangan / HR</label>
                <textarea
                  rows={2}
                  value={formMetrics.catatan_atasan}
                  onChange={(e) => setFormMetrics({ ...formMetrics, catatan_atasan: e.target.value })}
                  placeholder="Tuliskan apresiasi atau poin rekomendasi perbaikan untuk pegawai..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#013E37]/20 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-[#013E37] hover:bg-[#025046] rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Evaluasi KPI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
