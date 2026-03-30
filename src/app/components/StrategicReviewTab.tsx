import React, { useState } from 'react';
import {
  Users, DollarSign, Activity, BookOpen, ChevronDown, ChevronUp,
  Shield, TrendingUp, AlertTriangle, CheckCircle2, Database,
  Target, Zap, BarChart2, FileText, Stethoscope,
  ArrowRight, Info, Star, Flag, Lightbulb,
} from 'lucide-react';
import { C, CHART_COLORS, BSC_COLORS } from './colors';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface KPIRow {
  category: string;
  kpi: string;
  definition: string;
  target: string;
  urgency: 'Kritis' | 'Tinggi' | 'Sedang';
  simrsSource: string;
  currentValue?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'Achieved' | 'On Track' | 'At Risk' | 'Behind';
}

interface Director {
  id: string;
  name: string;
  title: string;
  specialization: string;
  focus: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  tagline: string;
  kpis: KPIRow[];
}

interface ResponsibilityRow {
  kpi: string;
  accountable: string;
  responsible: string;
  simrsSource: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const DIRECTORS: Director[] = [
  {
    id: 'dirut',
    name: 'dr. Imam Ghozali, Sp.An., KMN., M.Kes.',
    title: 'Direktur Utama',
    specialization: 'Sp. Anestesiologi & Konsultan Manajemen Nyeri',
    focus: 'Safety & Efficiency Architect',
    icon: <Shield className="w-5 h-5" />,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    tagline: 'Fokus pada keselamatan pasien (safety culture), efisiensi kamar bedah, dan indikator mutu nasional (INM).',
    kpis: [
      {
        category: 'Keuangan',
        kpi: 'Rasio Cost Recovery (CR)',
        definition: 'Rasio total pendapatan fungsional BLUD terhadap total biaya operasional (tanpa gaji PNS). Indikator kemandirian subsidi.',
        target: '> 80–100% (Menuju Kemandirian)',
        urgency: 'Kritis',
        simrsSource: 'Modul Billing (20) & GL Keuangan',
        currentValue: '83%',
        trend: 'up',
        status: 'On Track',
      },
      {
        category: 'Pelanggan',
        kpi: 'Net Promoter Score (NPS) / IKM',
        definition: 'Tingkat kesediaan pasien merekomendasikan RS. Diukur via survei digital terintegrasi pasca-layanan.',
        target: 'Skor > 50 (Excellent) / Nilai A',
        urgency: 'Tinggi',
        simrsSource: 'Anjungan Mandiri (47) / Mobile App',
        currentValue: '54',
        trend: 'up',
        status: 'Achieved',
      },
      {
        category: 'Proses Internal',
        kpi: 'Bed Occupancy Rate (BOR)',
        definition: 'Persentase penggunaan tempat tidur. Indikator efisiensi aset utama RS. Zona efisien Barber-Johnson.',
        target: '60%–85% (Zona Efisien)',
        urgency: 'Kritis',
        simrsSource: 'E-Bed Management (44)',
        currentValue: '74%',
        trend: 'stable',
        status: 'Achieved',
      },
      {
        category: 'Mutu & Safety',
        kpi: 'Capaian Indikator Mutu Nasional (INM)',
        definition: 'Kepatuhan agregat terhadap 13 indikator mutu wajib Kemenkes (Kepatuhan cuci tangan, APD, dll).',
        target: '100% Tercapai',
        urgency: 'Kritis',
        simrsSource: 'Modul PPI (42) & Mutu',
        currentValue: '91%',
        trend: 'up',
        status: 'At Risk',
      },
      {
        category: 'Pertumbuhan',
        kpi: 'Indeks Kematangan Digital',
        definition: 'Tingkat adopsi modul SIMRS dan keberhasilan bridging SatuSehat ke Kemenkes.',
        target: 'Level 4–5 (HIMSS Stage equivalent)',
        urgency: 'Sedang',
        simrsSource: 'Log System Admin (28–40)',
        currentValue: 'Level 3',
        trend: 'up',
        status: 'At Risk',
      },
      {
        category: 'Safety',
        kpi: 'Surgical Safety Checklist Compliance',
        definition: 'Persentase prosedur bedah yang memenuhi checklist WHO Surgical Safety. Diprioritaskan oleh Dirut berlatar anestesiolog.',
        target: '100%',
        urgency: 'Kritis',
        simrsSource: 'Modul Bedah Sentral (9)',
        currentValue: '96%',
        trend: 'up',
        status: 'On Track',
      },
    ],
  },
  {
    id: 'wadir-yanmed',
    name: 'dr. Yusmaidi, Sp.B (K) BD.',
    title: 'Plt. Wadir Keperawatan, Pelayanan & Penunjang Medik',
    specialization: 'Sp. Bedah Digestif Konsultan',
    focus: 'Operational Commander',
    icon: <Activity className="w-5 h-5" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    tagline: 'Mengelola super-directorate: integrasi total rantai pelayanan Medis + Keperawatan + Penunjang untuk eliminasi bottleneck.',
    kpis: [
      {
        category: 'Efisiensi Klinis',
        kpi: 'Average Length of Stay (ALOS)',
        definition: 'Rata-rata hari rawat per pasien. Dihitung otomatis: Timestamp Pulang − Timestamp Masuk. Dipecah per SMF.',
        target: '≤ 7 hari (Tipe A Nasional)',
        urgency: 'Kritis',
        simrsSource: 'Modul Rawat Inap (7)',
        currentValue: '6,2 hari',
        trend: 'down',
        status: 'Achieved',
      },
      {
        category: 'Mutu Medis',
        kpi: 'Net Death Rate (NDR)',
        definition: 'Kematian pasien >48 jam perawatan. Data dari Resume Medis status "Meninggal". Memicu audit medis jika tinggi.',
        target: '< 25 per 1.000 pasien keluar',
        urgency: 'Kritis',
        simrsSource: 'Resume Medis (21)',
        currentValue: '18/1000',
        trend: 'down',
        status: 'Achieved',
      },
      {
        category: 'Keperawatan',
        kpi: 'Kelengkapan Asesmen Awal Keperawatan',
        definition: '% pasien baru dengan asesmen keperawatan lengkap dalam < 24 jam (risiko jatuh, alergi, dll).',
        target: '100% dalam 24 jam pertama',
        urgency: 'Tinggi',
        simrsSource: 'Modul ASKEP (7.b)',
        currentValue: '88%',
        trend: 'up',
        status: 'At Risk',
      },
      {
        category: 'Penunjang',
        kpi: 'Lab & Rad Turnaround Time (TAT)',
        definition: 'Waktu tunggu hasil (Order to Verified Result). Integrasi LIS/PACS mencatat waktu secara presisi. Determinan kecepatan IGD & Rajal.',
        target: 'Lab < 60 menit · Rad < 120 menit',
        urgency: 'Kritis',
        simrsSource: 'Bridging LIS (12) & PACS (13)',
        currentValue: 'Lab 45m · Rad 105m',
        trend: 'up',
        status: 'On Track',
      },
      {
        category: 'Gawat Darurat',
        kpi: 'Emergency Response Time',
        definition: 'Waktu lapor Triage di IGD s.d. diperiksa dokter pertama kali. Kritis untuk life-saving dan kepuasan pasien.',
        target: '< 5 Menit',
        urgency: 'Kritis',
        simrsSource: 'Modul IGD (4.a)',
        currentValue: '4,2 menit',
        trend: 'stable',
        status: 'Achieved',
      },
      {
        category: 'Kamar Operasi',
        kpi: 'On-Time Start Surgery',
        definition: 'Persentase operasi pertama yang dimulai tepat waktu (jam 07.30). Keterlambatan kasus pertama menyebabkan efek domino.',
        target: '≥ 90%',
        urgency: 'Tinggi',
        simrsSource: 'Modul Bedah Sentral (9)',
        currentValue: '82%',
        trend: 'up',
        status: 'At Risk',
      },
      {
        category: 'Kamar Operasi',
        kpi: 'Cancellation Rate Operasi',
        definition: 'Angka pembatalan operasi pada hari H. Mencerminkan kualitas persiapan pre-op dan ketersediaan alat/SDM.',
        target: '< 5%',
        urgency: 'Tinggi',
        simrsSource: 'Modul Bedah Sentral (9)',
        currentValue: '3,8%',
        trend: 'stable',
        status: 'Achieved',
      },
    ],
  },
  {
    id: 'wadir-keu',
    name: 'dr. Marzuqi Sayuti, Sp.OG.',
    title: 'Wakil Direktur Umum dan Keuangan',
    specialization: 'Sp. Obstetri & Ginekologi',
    focus: 'Financial Guardian',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    tagline: 'Memastikan likuiditas RS dalam ekosistem JKN: kecepatan klaim, efisiensi logistik, dan pengendalian biaya obat (Fornas).',
    kpis: [
      {
        category: 'Revenue Cycle',
        kpi: 'Days to Bill (Kecepatan Klaim)',
        definition: 'Rata-rata hari dari pasien pulang s.d. klaim submit ke BPJS. Sistem melacak status berkas digital secara otomatis.',
        target: '< 10 Hari (Bulan N+1)',
        urgency: 'Kritis',
        simrsSource: 'Bridging V-Claim (40)',
        currentValue: '8,5 hari',
        trend: 'down',
        status: 'Achieved',
      },
      {
        category: 'Logistik',
        kpi: 'Inventory Turnover Ratio (ITOR)',
        definition: 'Kecepatan perputaran stok obat/BHP. Mengukur efisiensi modal kerja yang tertanam di gudang. Minimalkan dead stock.',
        target: 'Rasio Tinggi (Minimalkan Dead Stock)',
        urgency: 'Tinggi',
        simrsSource: 'Modul Gudang (17) & Farmasi (16)',
        currentValue: '12x/tahun',
        trend: 'up',
        status: 'On Track',
      },
      {
        category: 'Efisiensi',
        kpi: 'Cost Saving Ratio',
        definition: 'Persentase penghematan belanja aktual vs HPS/E-Katalog LKPP. Indikator efisiensi pengadaan barang/jasa.',
        target: 'Positif (Saving > 0)',
        urgency: 'Tinggi',
        simrsSource: 'Modul Pengadaan (18)',
        currentValue: '7,2%',
        trend: 'up',
        status: 'Achieved',
      },
      {
        category: 'Piutang',
        kpi: 'Aging Schedule of AR',
        definition: 'Profil umur piutang (terutama non-BPJS/Asuransi Swasta/Umum). Minimalkan piutang > 90 hari.',
        target: 'Piutang > 90 hari < 10%',
        urgency: 'Tinggi',
        simrsSource: 'Modul Keuangan (20)',
        currentValue: '13%',
        trend: 'down',
        status: 'At Risk',
      },
      {
        category: 'Kepatuhan Formularium',
        kpi: 'Kepatuhan Formularium Nasional (Fornas)',
        definition: 'Persentase resep obat JKN yang sesuai Fornas. Obat non-Fornas menggerus margin RS. SIMRS dapat memblokir resep non-Fornas.',
        target: '≥ 95%',
        urgency: 'Kritis',
        simrsSource: 'Modul Farmasi (16) & E-Resep',
        currentValue: '91%',
        trend: 'up',
        status: 'At Risk',
      },
    ],
  },
  {
    id: 'wadir-sdm',
    name: 'dr. Elitha Martharina Utari, MARS.',
    title: 'Wadir Pendidikan, Pengembangan SDM, & Hukum',
    specialization: 'Magister Administrasi Rumah Sakit (MARS)',
    focus: 'Human Capital Strategist',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    tagline: 'Transformasi dari "personalia" ke "human capital": kompetensi SDM, perlindungan medico-legal, dan pendidikan terintegrasi.',
    kpis: [
      {
        category: 'Produktivitas',
        kpi: 'Rasio Staf Klinis (Staffing Ratio)',
        definition: 'Beban kerja riil: jam perawat vs sensus pasien. Analisis beban kerja berbasis data riil untuk mencegah burnout.',
        target: '1 perawat : ≤ 10 pasien (Ranap)',
        urgency: 'Kritis',
        simrsSource: 'Modul HR (43) vs Sensus',
        currentValue: '1:8,5',
        trend: 'stable',
        status: 'Achieved',
      },
      {
        category: 'Kompetensi',
        kpi: 'Training Hours per Employee',
        definition: 'Rata-rata jam pelatihan per pegawai per tahun. Syarat RS Pendidikan & Akreditasi STARKES.',
        target: '≥ 20 jam / pegawai / tahun',
        urgency: 'Tinggi',
        simrsSource: 'Modul Diklat (HR)',
        currentValue: '14 jam',
        trend: 'up',
        status: 'Behind',
      },
      {
        category: 'Legalitas',
        kpi: 'Kepatuhan Kredensial (STR/SIP)',
        definition: 'Persentase staf medis dengan STR/SIP aktif. Sistem memberi alert otomatis sebelum masa berlaku habis. Mitigasi risiko malpraktik.',
        target: '100% Aktif (0 expired)',
        urgency: 'Kritis',
        simrsSource: 'Modul Kepegawaian (43)',
        currentValue: '97,4%',
        trend: 'up',
        status: 'On Track',
      },
      {
        category: 'Kinerja',
        kpi: 'Indeks Kinerja Individu (IKI)',
        definition: 'Skor kinerja berbasis data: Kehadiran, Kelengkapan RME, Kepatuhan SOP. Dasar perhitungan remunerasi/jasa pelayanan yang adil.',
        target: '≥ 76 (Predikat B/Baik)',
        urgency: 'Tinggi',
        simrsSource: 'Log User SIMRS & HR',
        currentValue: '79,2',
        trend: 'up',
        status: 'On Track',
      },
      {
        category: 'Pendidikan',
        kpi: 'Tingkat Kelulusan Uji Kompetensi Peserta Didik',
        definition: 'Persentase residen/koas yang lulus ujian stase/nasional. Indikator mutu RS sebagai Teaching Hospital.',
        target: '≥ 90%',
        urgency: 'Sedang',
        simrsSource: 'Modul Diklat',
        currentValue: '88%',
        trend: 'up',
        status: 'At Risk',
      },
      {
        category: 'OPPE',
        kpi: 'Ongoing Professional Practice Evaluation (OPPE)',
        definition: 'Penilaian kinerja dokter berbasis data ALOS, kepatuhan Clinical Pathway, dan kelengkapan KLPCM. Tidak lagi subyektif.',
        target: 'OPPE Lengkap 100% dokter / 6 bulan',
        urgency: 'Tinggi',
        simrsSource: 'SIMRS Yanmed + Log RME',
        currentValue: '71%',
        trend: 'up',
        status: 'At Risk',
      },
    ],
  },
];

const RESPONSIBILITY_TABLE: ResponsibilityRow[] = [
  { kpi: 'Cost Recovery Rate', accountable: 'Dirut (dr. Imam)', responsible: 'Wadir Keuangan (dr. Marzuqi)', simrsSource: 'Billing System & GL' },
  { kpi: 'BOR & ALOS', accountable: 'Wadir Yanmed (dr. Yusmaidi)', responsible: 'Dirut (dr. Imam)', simrsSource: 'Adm Ranap' },
  { kpi: 'Days to Bill (Kecepatan Klaim)', accountable: 'Wadir Keuangan (dr. Marzuqi)', responsible: 'Wadir Yanmed (Kelengkapan Berkas)', simrsSource: 'Bridging V-Claim' },
  { kpi: 'Kepatuhan SPM & Mutu (INM)', accountable: 'Dirut (dr. Imam)', responsible: 'Seluruh Wadir', simrsSource: 'EIS Dashboard (41)' },
  { kpi: 'Staffing Ratio & Produktivitas', accountable: 'Wadir SDM (dr. Elitha)', responsible: 'Wadir Yanmed (Kebutuhan SDM)', simrsSource: 'Kepegawaian & Log' },
  { kpi: 'Safety (NDR / HAIs)', accountable: 'Wadir Yanmed (dr. Yusmaidi)', responsible: 'Dirut (dr. Imam)', simrsSource: 'RME & PPI (42)' },
  { kpi: 'Legalitas Medis (STR/SIP)', accountable: 'Wadir SDM (dr. Elitha)', responsible: 'Komite Medik', simrsSource: 'Kepegawaian (43)' },
  { kpi: 'Surgical Safety Checklist', accountable: 'Dirut (dr. Imam)', responsible: 'Wadir Yanmed (dr. Yusmaidi)', simrsSource: 'Modul Bedah Sentral (9)' },
  { kpi: 'Fornas Compliance', accountable: 'Wadir Keuangan (dr. Marzuqi)', responsible: 'Wadir Yanmed (Farmasi)', simrsSource: 'Farmasi (16) & E-Resep' },
  { kpi: 'OPPE Dokter', accountable: 'Wadir SDM (dr. Elitha)', responsible: 'Komite Medik', simrsSource: 'Log SIMRS Yanmed + RME' },
];

const IMPLEMENTATION_RECS = [
  {
    id: 'rec-1',
    category: 'Change Management',
    title: 'Resistensi Budaya & Transparansi Data',
    detail: 'Data berbasis SIMRS menciptakan "Big Brother effect". Gunakan data untuk perbaikan sistem (bukan blaming). Kaitkan KPI secara bertahap dengan insentif remunerasi. Prinsip "No Data, No Pay": Jasa Medis tidak cair jika Resume Medis belum di-TTE.',
    icon: <Users className="w-4 h-4" />,
    priority: 'Tinggi',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    id: 'rec-2',
    category: 'Data Quality',
    title: 'Disiplin Input Data (Garbage In, Garbage Out)',
    detail: 'Aktifkan fitur Time-Lock pada SIMRS. Contoh: Laporan operasi harus diinput maksimal 2 jam pasca-operasi. Jika lewat, sistem terkunci dan memerlukan approval Wadir untuk membuka—menciptakan barier administratif yang memaksa disiplin.',
    icon: <Database className="w-4 h-4" />,
    priority: 'Kritis',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  {
    id: 'rec-3',
    category: 'Infrastruktur',
    title: 'Kesiapan Infrastruktur Jaringan & Server',
    detail: 'Volume data RS Tipe A (terutama radiologi PACS) sangat besar. Pastikan bandwidth LAN/FO dan kapasitas server memadai. Downtime sistem saat jam sibuk poliklinik akan menghancurkan kepercayaan staf pada sistem digital.',
    icon: <Zap className="w-4 h-4" />,
    priority: 'Tinggi',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'rec-4',
    category: 'Ratifikasi',
    title: 'Ratifikasi Matriks KPI oleh Direksi & Dewas',
    detail: 'Direksi dan Dewan Pengawas menyepakati matriks KPI yang diusulkan sebagai "Kitab Suci" penilaian kinerja 2026. Tanpa ratifikasi formal, KPI hanya jadi dokumen tanpa kekuatan eksekusi.',
    icon: <FileText className="w-4 h-4" />,
    priority: 'Kritis',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    id: 'rec-5',
    category: 'EIS Dashboard',
    title: 'Kustomisasi Dashboard EIS per Tupoksi',
    detail: 'Tim IT segera mengkonfigurasi Dashboard EIS (Modul 41) agar setiap pimpinan memiliki "kokpit" personal sesuai Tupoksi. Dirut: BOR & INM. Wadir Yanmed: TAT & NDR. Wadir Keuangan: AR Aging & Days to Bill. Wadir SDM: STR/SIP & IKI.',
    icon: <BarChart2 className="w-4 h-4" />,
    priority: 'Tinggi',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    id: 'rec-6',
    category: 'Remunerasi',
    title: 'Integrasi Remunerasi Berbasis KPI',
    detail: 'Susun skema remunerasi 2026 yang mengaitkan poin insentif dengan capaian KPI individu yang terekam di SIMRS—khususnya kelengkapan RME dan kepatuhan SOP. Ini menjadikan SIMRS bukan hanya sistem pencatatan, tetapi driver perilaku.',
    icon: <DollarSign className="w-4 h-4" />,
    priority: 'Sedang',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const URGENCY_CONFIG = {
  Kritis: { color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
  Tinggi: { color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' },
  Sedang: { color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' },
};

const STATUS_CONFIG = {
  Achieved: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Achieved' },
  'On Track': { color: 'text-blue-700', bg: 'bg-blue-100', label: 'On Track' },
  'At Risk': { color: 'text-amber-700', bg: 'bg-amber-100', label: 'At Risk' },
  Behind: { color: 'text-red-700', bg: 'bg-red-100', label: 'Behind' },
};

const PRIORITY_CONFIG = {
  Kritis: { color: 'text-red-700', bg: 'bg-red-100' },
  Tinggi: { color: 'text-amber-700', bg: 'bg-amber-100' },
  Sedang: { color: 'text-blue-700', bg: 'bg-blue-100' },
};

const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
  if (!trend) return null;
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'down') return <TrendingUp className="w-3.5 h-3.5 text-red-500 rotate-180" />;
  return <ArrowRight className="w-3.5 h-3.5 text-gray-400" />;
};

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────
const DirectorCard = ({ director, isOpen, onToggle }: {
  director: Director;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const achievedCount = director.kpis.filter(k => k.status === 'Achieved').length;
  const onTrackCount  = director.kpis.filter(k => k.status === 'On Track').length;
  const atRiskCount   = director.kpis.filter(k => k.status === 'At Risk').length;
  const behindCount   = director.kpis.filter(k => k.status === 'Behind').length;

  return (
    <div className={`rounded-2xl border-2 ${director.border} overflow-hidden transition-all`}>
      {/* Header */}
      <button
        className={`w-full p-5 text-left ${director.bg} hover:opacity-90 transition-opacity`}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${director.color} bg-white/70 border ${director.border} flex-shrink-0`}>
              {director.icon}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold bg-white/70 ${director.color}`}>
                  {director.focus}
                </span>
              </div>
              <p className={`font-bold text-sm ${director.color}`}>{director.name}</p>
              <p className="text-xs text-gray-600 mt-0.5">{director.title}</p>
              <p className="text-xs text-gray-500 italic">{director.specialization}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex gap-1.5">
              {achievedCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-700">{achievedCount}✓</span>}
              {onTrackCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-200 text-blue-700">{onTrackCount}●</span>}
              {atRiskCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-700">{atRiskCount}△</span>}
              {behindCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-red-200 text-red-700">{behindCount}✗</span>}
            </div>
            {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3 leading-relaxed border-t border-white/50 pt-3">
          <Lightbulb className="w-3 h-3 inline mr-1 text-yellow-500" />
          {director.tagline}
        </p>
      </button>

      {/* KPI Table */}
      {isOpen && (
        <div className="bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-28">Kategori</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">KPI</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden lg:table-cell">Target</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 w-20">Urgensi</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 w-24">Nilai Kini</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 w-24">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden xl:table-cell">Sumber SIMRS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {director.kpis.map((kpi, idx) => {
                  const urg = URGENCY_CONFIG[kpi.urgency];
                  const sta = kpi.status ? STATUS_CONFIG[kpi.status] : null;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/80 group">
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 font-medium">{kpi.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800">{kpi.kpi}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed hidden sm:block">{kpi.definition}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-gray-600">{kpi.target}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${urg.bg} ${urg.color}`}>
                          {kpi.urgency}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-semibold text-gray-700">{kpi.currentValue ?? '—'}</span>
                          <TrendIcon trend={kpi.trend} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {sta ? (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${sta.bg} ${sta.color}`}>
                            {sta.label}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="flex items-center gap-1">
                          <Database className="w-3 h-3 text-gray-300 flex-shrink-0" />
                          <span className="text-xs text-gray-400">{kpi.simrsSource}</span>
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
  );
};

// ─── MAIN TAB ─────────────────────────────────────────────────────────────────
export function StrategicReviewTab() {
  const [openDirector, setOpenDirector] = useState<string | null>('dirut');
  const [activeSection, setActiveSection] = useState<'overview' | 'kpi' | 'responsibility' | 'recommendations'>('overview');

  const allKPIs = DIRECTORS.flatMap(d => d.kpis);
  const totalAchieved = allKPIs.filter(k => k.status === 'Achieved').length;
  const totalOnTrack  = allKPIs.filter(k => k.status === 'On Track').length;
  const totalAtRisk   = allKPIs.filter(k => k.status === 'At Risk').length;
  const totalBehind   = allKPIs.filter(k => k.status === 'Behind').length;
  const totalKritis   = allKPIs.filter(k => k.urgency === 'Kritis').length;

  const SECTIONS = [
    { id: 'overview' as const, label: 'Ringkasan Eksekutif', icon: <Star className="w-4 h-4" /> },
    { id: 'kpi' as const, label: 'Matriks KPI Direksi', icon: <Target className="w-4 h-4" /> },
    { id: 'responsibility' as const, label: 'Distribusi Tanggung Jawab', icon: <Users className="w-4 h-4" /> },
    { id: 'recommendations' as const, label: 'Rekomendasi Implementasi', icon: <Flag className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-blue-900 rounded-2xl p-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-300" />
              <span className="text-xs text-blue-300 font-medium">Kajian Strategis Komprehensif · Tahun Anggaran 2026</span>
            </div>
            <h2 className="text-xl font-bold">Transformasi Tata Kelola & Kinerja Berbasis Data SIMRS</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Matriks KPI terintegrasi berdasarkan struktur organisasi baru 2025—diselaraskan dengan kapabilitas SIMRS Intermedik Tipe A
              dan standar Balanced Scorecard yang dimodifikasi untuk konteks RS Publik di Indonesia.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center flex-shrink-0">
            {[
              { label: 'Total KPI', value: allKPIs.length, color: 'text-white' },
              { label: 'Kritis', value: totalKritis, color: 'text-red-300' },
              { label: 'Achieved', value: totalAchieved, color: 'text-emerald-300' },
              { label: 'At Risk', value: totalAtRisk + totalBehind, color: 'text-amber-300' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-2">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section Nav */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeSection === sec.id
                ? 'bg-slate-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {sec.icon}
            {sec.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────────────── */}
      {activeSection === 'overview' && (
        <div className="space-y-5">
          {/* Metodologi */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Pendekatan Balanced Scorecard yang Dimodifikasi</p>
                <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                  Mengintegrasikan 4 perspektif klasik BSC (Keuangan, Pelanggan, Proses Bisnis Internal, Pembelajaran & Pertumbuhan)
                  dengan dimensi tambahan <strong>Kepatuhan Regulasi</strong> dan <strong>Dampak Sosial</strong>.
                  Setiap indikator divalidasi ketersediaan datanya di SIMRS Intermedik Tipe A dan diselaraskan dengan SPM Permenkes 129/2008 serta INM Kemenkes.
                </p>
              </div>
            </div>
          </div>

          {/* KPI Status Overview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Status KPI Seluruh Direktorat</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Achieved', count: totalAchieved, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
                { label: 'On Track', count: totalOnTrack,  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: <TrendingUp className="w-5 h-5 text-blue-500" />    },
                { label: 'At Risk',  count: totalAtRisk,   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
                { label: 'Behind',   count: totalBehind,   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     icon: <AlertTriangle className="w-5 h-5 text-red-500" />   },
              ].map(s => (
                <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-1">{s.icon}<span className={`text-xs font-semibold ${s.color}`}>{s.label}</span></div>
                  <p className={`text-3xl font-black ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">dari {allKPIs.length} KPI</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Director Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DIRECTORS.map(d => {
              const achieved = d.kpis.filter(k => k.status === 'Achieved').length;
              const atRisk   = d.kpis.filter(k => k.status === 'At Risk' || k.status === 'Behind').length;
              const pct      = Math.round((achieved / d.kpis.length) * 100);
              return (
                <div key={d.id} className={`rounded-2xl border-2 ${d.border} ${d.bg} p-4`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center ${d.color} border ${d.border} flex-shrink-0`}>
                      {d.icon}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${d.color}`}>{d.focus}</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{pct}%</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs">
                    <span className="text-emerald-600">{achieved} Achieved</span>
                    <span className="text-amber-600">{atRisk} At Risk/Behind</span>
                    <span className="text-gray-400">{d.kpis.length} total KPI</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed border-t border-white/50 pt-2">{d.tagline}</p>
                </div>
              );
            })}
          </div>

          {/* SIMRS Architecture Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4" /> Arsitektur Data SIMRS Intermedik — Single Source of Truth
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="font-medium text-slate-700 mb-1">Automasi Data</p>
                <p>KPI seperti ALOS dihitung otomatis dari timestamp admisi & pemulangan di Modul Rawat Inap—tidak ada input manual.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="font-medium text-slate-700 mb-1">Validasi Silang</p>
                <p>Data Billing divalidasi silang dengan RME. Jika tindakan tidak diinput dokter, tagihan tidak muncul—memaksa kepatuhan input.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="font-medium text-slate-700 mb-1">Audit Trail</p>
                <p>Setiap perubahan data (diagnosa, penghapusan tagihan) terekam di Log System Admin—jaminan integritas data bagi Dewas.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI MATRIX ────────────────────────────────────────────────────────── */}
      {activeSection === 'kpi' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <Target className="w-4 h-4 text-blue-500" />
            <span>Klik judul direktur untuk membuka/menutup matriks KPI. Data nilai kini diperbarui sesuai periode Q1 2026.</span>
          </div>
          {DIRECTORS.map(director => (
            <DirectorCard
              key={director.id}
              director={director}
              isOpen={openDirector === director.id}
              onToggle={() => setOpenDirector(openDirector === director.id ? null : director.id)}
            />
          ))}
        </div>
      )}

      {/* ── RESPONSIBILITY TABLE ──────────────────────────────────────────────── */}
      {activeSection === 'responsibility' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Matriks Distribusi Tanggung Jawab KPI</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Berdasarkan lampiran Kajian Strategis 2026 — untuk monitoring Dewan Pengawas
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-5 py-3 text-xs font-semibold">KPI Utama</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        Penanggung Jawab Utama (Accountable)
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        Penanggung Jawab Pendukung (Responsible)
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold hidden md:table-cell">Sumber Data SIMRS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {RESPONSIBILITY_TABLE.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-gray-50 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-800 text-sm">{row.kpi}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-lg border border-red-100 font-medium">
                          {row.accountable}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-medium">
                          {row.responsible}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-gray-300" />
                          <span className="text-xs text-gray-500">{row.simrsSource}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-800 mb-1">🔴 Accountable (Penanggung Jawab Utama)</p>
              <p className="text-xs text-red-600 leading-relaxed">
                Satu pejabat yang bertanggung jawab penuh atas ketercapaian KPI. Hasilnya dilaporkan langsung kepada Dewan Pengawas.
                Tidak dapat didelegasikan.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">🔵 Responsible (Penanggung Jawab Pendukung)</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                Pejabat/unit yang mengerjakan tugas pendukung untuk mencapai KPI. Dapat lebih dari satu.
                Berkoordinasi dengan Accountable untuk pelaporan berkala.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── RECOMMENDATIONS ───────────────────────────────────────────────────── */}
      {activeSection === 'recommendations' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <strong>Tantangan Implementasi & Rekomendasi Mitigasi</strong> — Berdasarkan Bab 8 Kajian Strategis 2026.
            Keberhasilan transformasi sangat bergantung pada change management, disiplin data, dan kesiapan infrastruktur.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {IMPLEMENTATION_RECS.map(rec => {
              const pri = PRIORITY_CONFIG[rec.priority as keyof typeof PRIORITY_CONFIG];
              return (
                <div key={rec.id} className={`rounded-2xl border ${rec.border} ${rec.bg} p-4`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center ${rec.color}`}>
                        {rec.icon}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{rec.category}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pri.bg} ${pri.color}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className={`text-sm font-semibold ${rec.color} mb-2`}>{rec.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{rec.detail}</p>
                </div>
              );
            })}
          </div>

          {/* Roadmap */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Flag className="w-4 h-4 text-blue-500" />
              Langkah Konkret Selanjutnya (Tahun Anggaran 2026)
            </h3>
            <div className="space-y-3">
              {[
                { step: '01', title: 'Ratifikasi Matriks KPI', detail: 'Direksi & Dewan Pengawas menyepakati matriks KPI Bab 4–7 sebagai dasar penilaian kinerja 2026.', color: 'bg-blue-600', q: 'Q1 2026' },
                { step: '02', title: 'Kustomisasi Dashboard EIS', detail: 'Tim IT mengkonfigurasi Modul EIS (41) dengan KPI spesifik per Tupoksi Wadir—setiap pimpinan memiliki "kokpit" personal.', color: 'bg-violet-600', q: 'Q1–Q2 2026' },
                { step: '03', title: 'Integrasi Skema Remunerasi', detail: 'Menyusun skema remunerasi 2026 yang mengaitkan poin insentif dengan capaian KPI individu yang terekam di SIMRS.', color: 'bg-emerald-600', q: 'Q2 2026' },
                { step: '04', title: 'Aktivasi Time-Lock SIMRS', detail: 'Input laporan operasi maksimal 2 jam pasca-operasi. Lewat batas: sistem terkunci, butuh approval Wadir.', color: 'bg-amber-600', q: 'Q2 2026' },
                { step: '05', title: 'Audit & Review KPI Kuartalan', detail: 'Evaluasi KPI setiap kuartal oleh Dewan Pengawas menggunakan dashboard EIS. Penyesuaian target berbasis capaian aktual.', color: 'bg-slate-600', q: 'Q3–Q4 2026' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                    {item.step}
                  </div>
                  <div className="flex-1 border-l-2 border-gray-100 pl-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{item.q}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 bg-gradient-to-r from-slate-800 to-blue-900 rounded-xl text-white">
              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-300" />
                Visi 2026: Smart Hospital Percontohan Nasional
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Transformasi ini menjadikan rumah sakit bukan hanya sebagai fasilitas rujukan tersier terbesar di provinsi,
                tetapi sebagai <strong className="text-white">Smart Hospital</strong> percontohan nasional yang dikelola dengan presisi data dan akuntabilitas tinggi—
                dibuktikan dengan skor KPI yang dapat diaudit dan diverifikasi melalui SIMRS Intermedik.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}