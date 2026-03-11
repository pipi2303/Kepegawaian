import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, Clock, CalendarDays, TrendingUp, Target, AlertCircle,
  ShieldAlert, GraduationCap, ChevronRight,
  DollarSign, HeartPulse, FileSignature,
  BarChart2, Mail, Building2,
  Shield, Activity,
  Briefcase, FileBarChart2, Bell, Star, Zap,
  Award, UserCheck, UserX, BookOpen,
  ClipboardList, ArrowUpRight, UserPlus, Hash,
  TrendingDown, LayoutDashboard, RefreshCw,
  Filter, Minus, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { chartKehadiran, chartUnitKerja } from '../data/mockData';
import RechartsWrapper from '../components/RechartsWrapper';
import {
  StatCard, AlertItem, TabButton, MiniBar, HealthGauge,
} from '../components/DashboardWidgets';

// ─── Constants ────────────────────────────────────────────────────────────────
const TODAY = '2026-03-08';
const LAST_WORKDAY = '2026-03-06';
const THIS_MONTH = '2026-03';
const THIS_YEAR = 2026;
const THIS_MONTH_NUM = 3;

const WEEK_PERIODS = [
  { label: 'Pekan 2–6 Mar 2026',  short: '2–6 Mar',   days: ['2026-03-02','2026-03-03','2026-03-04','2026-03-05','2026-03-06'], labels: ['Sen','Sel','Rab','Kam','Jum'] },
  { label: 'Pekan 23–27 Feb 2026', short: '23–27 Feb', days: ['2026-02-23','2026-02-24','2026-02-25','2026-02-26','2026-02-27'], labels: ['Sen','Sel','Rab','Kam','Jum'] },
  { label: 'Pekan 16–20 Feb 2026', short: '16–20 Feb', days: ['2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20'], labels: ['Sen','Sel','Rab','Kam','Jum'] },
  { label: 'Pekan 9–13 Feb 2026',  short: '9–13 Feb',  days: ['2026-02-09','2026-02-10','2026-02-11','2026-02-12','2026-02-13'], labels: ['Sen','Sel','Rab','Kam','Jum'] },
] as const;

const BULAN_META = [
  { idx: 0, label: 'Sep 2025' }, { idx: 1, label: 'Okt 2025' }, { idx: 2, label: 'Nov 2025' },
  { idx: 3, label: 'Des 2025' }, { idx: 4, label: 'Jan 2026' }, { idx: 5, label: 'Feb 2026' },
  { idx: 6, label: 'Mar 2026*' },
];

function fmtRp(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// Sub-components (StatCard, AlertItem, TabButton, MiniBar, HealthGauge)
// dipindahkan ke ../components/DashboardWidgets untuk mengurangi ukuran file.

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const {
    pegawai, cuti, absensi, skp, kenaikanPangkat,
    disiplin, diklat, str, sip, insidenK3RS, kontrak,
    slipGaji, jadwalShift, bpjs, mcu, vaksinasi,
    mutasi, penghargaan, cpd, grievance,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'ringkasan' | 'kehadiran' | 'sdm' | 'kinerja'>('ringkasan');
  const [activityFeed, setActivityFeed] = useState<'aktivitas' | 'pengingat'>('aktivitas');

  // ─── Kehadiran filter states ─────────────────────────────────────────────────
  const [kehadiranView, setKehadiranView] = useState<'tren' | 'perbandingan'>('tren');
  const [compareIdxA, setCompareIdxA] = useState(4); // Jan 2026
  const [compareIdxB, setCompareIdxB] = useState(5); // Feb 2026
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0); // current week
  const [trendRange, setTrendRange] = useState(7); // show all months

  // ─── Core Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalPegawai = pegawai.length;
    const pegawaiAktif = pegawai.filter(p => p.statusAktif === 'Aktif').length;
    const pegawaiPNS = pegawai.filter(p => p.statusPegawai === 'PNS').length;
    const pegawaiPPPK = pegawai.filter(p => p.statusPegawai === 'PPPK').length;
    const pegawaiHonorer = pegawai.filter(p => p.statusPegawai === 'Honorer').length;
    const genderL = pegawai.filter(p => p.jenisKelamin === 'L').length;
    const genderP = pegawai.filter(p => p.jenisKelamin === 'P').length;

    // Attendance
    const hadirHariIni = absensi.filter(a => a.tanggal === LAST_WORKDAY && a.status === 'Hadir').length;
    const alphaHariIni = absensi.filter(a => a.tanggal === LAST_WORKDAY && a.status === 'Alpha').length;
    const sakitHariIni = absensi.filter(a => a.tanggal === LAST_WORKDAY && a.status === 'Sakit').length;
    const izinHariIni = absensi.filter(a => a.tanggal === LAST_WORKDAY && a.status === 'Izin').length;
    const cutiHariIni = absensi.filter(a => a.tanggal === LAST_WORKDAY && a.status === 'Cuti').length;
    const dinasLuarHariIni = absensi.filter(a => a.tanggal === LAST_WORKDAY && a.status === 'Dinas Luar').length;
    const kehadiranPct = pegawaiAktif > 0 ? Math.round((hadirHariIni / pegawaiAktif) * 100) : 0;

    // Terlambat (jam masuk > 08:00)
    const terlambat = absensi.filter(a => {
      if (a.tanggal !== LAST_WORKDAY || a.status !== 'Hadir') return false;
      if (!a.jamMasuk) return false;
      const [h, m] = a.jamMasuk.split(':').map(Number);
      return h > 8 || (h === 8 && m > 0);
    }).length;

    // Attendance this week (Mon 2 Mar - Fri 6 Mar)
    const weekDays = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
    const weekLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
    const weekAttendance = weekDays.map((d, i) => {
      const hadir = absensi.filter(a => a.tanggal === d && a.status === 'Hadir').length;
      const alpha = absensi.filter(a => a.tanggal === d && a.status === 'Alpha').length;
      const sakit = absensi.filter(a => a.tanggal === d && a.status === 'Sakit').length;
      const izin = absensi.filter(a => a.tanggal === d && a.status === 'Izin').length;
      return { hari: weekLabels[i], hadir, alpha, sakit, izin };
    });

    // Cuti
    const cutiPending = cuti.filter(c => c.status === 'Pending').length;
    const cutiDisetujuiBulanIni = cuti.filter(c => c.status === 'Disetujui' && c.tanggalMulai.startsWith(THIS_MONTH)).length;
    const cutiByJenis: Record<string, number> = {};
    cuti.forEach(c => { cutiByJenis[c.jenisCuti] = (cutiByJenis[c.jenisCuti] || 0) + 1; });

    // KP
    const kpProses = kenaikanPangkat.filter(k => k.status === 'Proses').length;
    const kpUsul = kenaikanPangkat.filter(k => (k.status as string) === 'Usul').length;
    const kpSelesaiTahunIni = kenaikanPangkat.filter(k => k.status === 'Selesai' && k.tanggalBerlaku?.startsWith(String(THIS_YEAR))).length;

    // SKP
    const skpCount2026 = skp.filter(s => s.tahun === THIS_YEAR).length;
    const skpBelumDitetapkan = Math.max(0, pegawaiAktif - skpCount2026);
    const skpNilaiRataRata = skp.length > 0
      ? (skp.reduce((sum, s) => sum + (s.nilaiAkhir || 0), 0) / skp.length).toFixed(1) : '0';
    const skpSangatBaik = skp.filter(s => (s.nilaiAkhir || 0) >= 110).length;
    const skpBaik = skp.filter(s => (s.nilaiAkhir || 0) >= 90 && (s.nilaiAkhir || 0) < 110).length;
    const skpCukup = skp.filter(s => (s.nilaiAkhir || 0) >= 70 && (s.nilaiAkhir || 0) < 90).length;
    const skpKurang = skp.filter(s => (s.nilaiAkhir || 0) > 0 && (s.nilaiAkhir || 0) < 70).length;

    // Disiplin
    const disiplinAktif = disiplin.filter(d => d.status !== 'Selesai').length;
    const disiplinBerat = disiplin.filter(d => d.tingkatHukuman === 'Berat' && d.status !== 'Selesai').length;
    const disiplinSedang = disiplin.filter(d => d.tingkatHukuman === 'Sedang' && d.status !== 'Selesai').length;
    const disiplinRingan = disiplin.filter(d => d.tingkatHukuman === 'Ringan' && d.status !== 'Selesai').length;

    // Diklat
    const diklatBerlangsung = diklat.filter(d => d.status === 'Berlangsung').length;
    const diklatDirencanakan = diklat.filter(d => d.status === 'Direncanakan').length;
    const diklatSelesai = diklat.filter(d => d.status === 'Selesai').length;
    const diklatTotalJP = diklat.filter(d => d.status === 'Selesai').reduce((sum, d) => sum + (d.jumlahJP || 0), 0);
    const diklatByJenis: Record<string, number> = {};
    diklat.forEach(d => { diklatByJenis[d.jenisDiklat] = (diklatByJenis[d.jenisDiklat] || 0) + 1; });

    // STR/SIP
    const strExpired = str.filter(s => s.status === 'Expired').length;
    const strAkanExpired = str.filter(s => s.status === 'Akan Expired').length;
    const strAktif = str.filter(s => s.status === 'Aktif').length;
    const sipExpired = sip.filter(s => s.status === 'Expired').length;
    const sipAkanExpired = sip.filter(s => s.status === 'Akan Expired').length;
    const sipAktif = sip.filter(s => s.status === 'Aktif').length;
    const lisensiKritis = strExpired + strAkanExpired + sipExpired + sipAkanExpired;
    const totalLisensi = str.length + sip.length;
    const credCompliancePct = totalLisensi > 0
      ? Math.round(((strAktif + sipAktif) / totalLisensi) * 100) : 100;

    // Pensiun
    const nowDate = new Date(TODAY);
    const akanPensiun1Thn = pegawai.filter(p => {
      if (!p.batasPensiun) return false;
      const diff = (new Date(p.batasPensiun).getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return diff <= 1 && diff > 0;
    }).length;
    const akanPensiun2Thn = pegawai.filter(p => {
      if (!p.batasPensiun) return false;
      const diff = (new Date(p.batasPensiun).getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return diff <= 2 && diff > 0;
    }).length;

    // Kontrak
    const kontrakHabis = kontrak.filter(k => {
      const exp = new Date(k.tanggalSelesai || '9999-01-01');
      const diff = (exp.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return diff <= 3 && diff > 0;
    }).length;
    const kontrakAktif = kontrak.filter(k => k.statusKontrak === 'Aktif').length;

    // K3RS
    const insidenBulanIni = insidenK3RS.filter(i => i.tanggal.startsWith(THIS_MONTH)).length;
    const insidenByJenis: Record<string, number> = {};
    insidenK3RS.forEach(i => { insidenByJenis[i.jenisInsiden] = (insidenByJenis[i.jenisInsiden] || 0) + 1; });

    // Payroll
    const slipBulanIni = slipGaji.filter(s => s.bulan === THIS_MONTH_NUM && s.tahun === THIS_YEAR);
    const totalGajiBruto = slipBulanIni.reduce((sum, s) => sum + s.totalBruto, 0);
    const totalGajiNetto = slipBulanIni.reduce((sum, s) => sum + s.totalNetto, 0);
    const avgGajiNetto = slipBulanIni.length > 0 ? Math.round(totalGajiNetto / slipBulanIni.length) : 0;

    // Shift
    const jadwalHariIni = jadwalShift.filter(j => j.tanggal === TODAY);
    const shiftPagi = jadwalHariIni.filter(j => j.jenisShift === 'Pagi').length;
    const shiftSore = jadwalHariIni.filter(j => j.jenisShift === 'Sore').length;
    const shiftMalam = jadwalHariIni.filter(j => j.jenisShift === 'Malam').length;
    const shiftOnCall = jadwalHariIni.filter(j => j.jenisShift === 'On-Call').length;

    // BPJS
    const bpjsAktifKes = bpjs.filter(b => b.statusBPJSKes === 'Aktif').length;
    const bpjsAktifTK = bpjs.filter(b => b.statusBPJSTK === 'Aktif').length;

    // MCU
    const mcuLayak = mcu.filter(m => m.hasilMCU === 'Layak Kerja').length;
    const mcuLayakSyarat = mcu.filter(m => m.hasilMCU === 'Layak dengan Syarat').length;
    const mcuTidakLayak = mcu.filter(m => m.hasilMCU === 'Tidak Layak').length;

    // Vaksinasi
    const vakLengkap = vaksinasi.filter(v => v.status === 'Lengkap').length;
    const vakSebagian = vaksinasi.filter(v => v.status === 'Sebagian').length;
    const vakBelum = vaksinasi.filter(v => v.status === 'Belum').length;

    // Mutasi
    const mutasiBulanIni = mutasi.filter(m => m.tanggalUsulan.startsWith(THIS_MONTH)).length;
    const mutasiDisetujui = mutasi.filter(m => m.status === 'Disetujui' || m.status === 'Berlaku').length;

    // Penghargaan
    const penghargaanTahunIni = penghargaan.filter(p => p.tanggalPemberian.startsWith(String(THIS_YEAR))).length;

    // CPD
    const cpdTahunIni = cpd.filter(c => c.tahun === THIS_YEAR);
    const cpdSkpTotal = cpdTahunIni.reduce((sum, c) => sum + (c.skp || 0), 0);
    const cpdVerified = cpdTahunIni.filter(c => c.status === 'Diverifikasi').length;

    // Age distribution
    const ageGroups: Record<string, number> = { '< 30': 0, '30–39': 0, '40–49': 0, '50–55': 0, '> 55': 0 };
    pegawai.forEach(p => {
      const age = THIS_YEAR - new Date(p.tanggalLahir).getFullYear();
      if (age < 30) ageGroups['< 30']++;
      else if (age < 40) ageGroups['30–39']++;
      else if (age < 50) ageGroups['40–49']++;
      else if (age <= 55) ageGroups['50–55']++;
      else ageGroups['> 55']++;
    });

    // Tenure distribution
    const tenureGroups: Record<string, number> = { '< 5 th': 0, '5–9 th': 0, '10–14 th': 0, '15–19 th': 0, '≥ 20 th': 0 };
    pegawai.forEach(p => {
      const th = parseInt(p.masaKerja);
      if (!isNaN(th)) {
        if (th < 5) tenureGroups['< 5 th']++;
        else if (th < 10) tenureGroups['5–9 th']++;
        else if (th < 15) tenureGroups['10–14 th']++;
        else if (th < 20) tenureGroups['15–19 th']++;
        else tenureGroups['≥ 20 th']++;
      }
    });

    // Education distribution
    const eduGroups: Record<string, number> = {};
    pegawai.forEach(p => { eduGroups[p.pendidikanTerakhir] = (eduGroups[p.pendidikanTerakhir] || 0) + 1; });

    // Golongan distribution
    const golDistrib: Record<string, number> = {};
    pegawai.forEach(p => {
      const grp = p.golongan.split('/')[0];
      golDistrib[grp] = (golDistrib[grp] || 0) + 1;
    });

    // Grievance
    const grievanceAktif = grievance.filter(g => g.status !== 'Selesai').length;

    // Health Score Computation
    const attendanceScore = kehadiranPct;
    const credScore = credCompliancePct;
    const skpScore = pegawaiAktif > 0 ? Math.min(100, Math.round((skpCount2026 / pegawaiAktif) * 100)) : 0;
    const disiplinScore = Math.max(0, 100 - disiplinBerat * 20 - disiplinSedang * 8 - disiplinRingan * 3);
    const trainingScore = Math.min(100, 40 + diklatBerlangsung * 8 + Math.min(30, diklatSelesai * 2));
    const healthScore = Math.round(
      attendanceScore * 0.25 + credScore * 0.25 + skpScore * 0.20 + disiplinScore * 0.15 + trainingScore * 0.15
    );

    return {
      totalPegawai, pegawaiAktif, pegawaiPNS, pegawaiPPPK, pegawaiHonorer,
      genderL, genderP,
      hadirHariIni, alphaHariIni, sakitHariIni, izinHariIni, cutiHariIni, dinasLuarHariIni,
      kehadiranPct, terlambat,
      weekAttendance,
      cutiPending, cutiDisetujuiBulanIni, cutiByJenis,
      kpProses, kpUsul, kpSelesaiTahunIni,
      skpCount2026, skpBelumDitetapkan, skpNilaiRataRata,
      skpSangatBaik, skpBaik, skpCukup, skpKurang,
      disiplinAktif, disiplinBerat, disiplinSedang, disiplinRingan,
      diklatBerlangsung, diklatDirencanakan, diklatSelesai, diklatTotalJP, diklatByJenis,
      strExpired, strAkanExpired, strAktif, sipExpired, sipAkanExpired, sipAktif,
      lisensiKritis, credCompliancePct,
      akanPensiun1Thn, akanPensiun2Thn,
      kontrakHabis, kontrakAktif,
      insidenBulanIni, insidenByJenis,
      totalGajiBruto, totalGajiNetto, avgGajiNetto, slipBulanIniCount: slipBulanIni.length,
      shiftPagi, shiftSore, shiftMalam, shiftOnCall,
      bpjsAktifKes, bpjsAktifTK,
      mcuLayak, mcuLayakSyarat, mcuTidakLayak,
      vakLengkap, vakSebagian, vakBelum,
      mutasiBulanIni, mutasiDisetujui,
      penghargaanTahunIni,
      cpdSkpTotal, cpdVerified,
      ageGroups, tenureGroups, eduGroups, golDistrib,
      grievanceAktif,
      healthScore,
      attendanceScore, credScore, skpScore, disiplinScore, trainingScore,
    };
  }, [pegawai, cuti, absensi, skp, kenaikanPangkat, disiplin, diklat, str, sip, insidenK3RS, kontrak,
      slipGaji, jadwalShift, bpjs, mcu, vaksinasi, mutasi, penghargaan, cpd, grievance]);

  // ─── Chart Data ─────────────────────────────────────────────────────────────
  const chartStatusPegawai = useMemo(() => [
    { name: 'PNS', value: stats.pegawaiPNS },
    { name: 'PPPK', value: stats.pegawaiPPPK },
    { name: 'Honorer', value: stats.pegawaiHonorer },
  ], [stats]);

  const chartGender = useMemo(() => [
    { name: 'Laki-laki', value: stats.genderL },
    { name: 'Perempuan', value: stats.genderP },
  ], [stats]);

  const chartGolongan = useMemo(() => {
    return ['I', 'II', 'III', 'IV'].map(g => ({ golongan: `Gol. ${g}`, jumlah: stats.golDistrib[g] || 0 }));
  }, [stats]);

  const chartKehadiranHariIni = useMemo(() => [
    { name: 'Hadir', value: stats.hadirHariIni },
    { name: 'Cuti', value: stats.cutiHariIni },
    { name: 'Sakit', value: stats.sakitHariIni },
    { name: 'Izin', value: stats.izinHariIni },
    { name: 'Alpha', value: stats.alphaHariIni },
    { name: 'Dinas Luar', value: stats.dinasLuarHariIni },
  ].filter(d => d.value > 0), [stats]);

  const chartAgeDistrib = useMemo(() =>
    Object.entries(stats.ageGroups).map(([kel, jml]) => ({ kel, jml })),
    [stats]);

  const chartTenureDistrib = useMemo(() =>
    Object.entries(stats.tenureGroups).map(([masa, jml]) => ({ masa, jml })),
    [stats]);

  const chartEduDistrib = useMemo(() => {
    const order = ['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3', 'Spesialis', 'Profesi'];
    return order.filter(e => stats.eduGroups[e] > 0).map(e => ({ pendidikan: e, jumlah: stats.eduGroups[e] }));
  }, [stats]);

  const chartDiklatJenis = useMemo(() =>
    Object.entries(stats.diklatByJenis).map(([jenis, count]) => ({ jenis, count })),
    [stats]);

  const chartShiftToday = useMemo(() => [
    { name: 'Pagi', value: stats.shiftPagi },
    { name: 'Sore', value: stats.shiftSore },
    { name: 'Malam', value: stats.shiftMalam },
    { name: 'On-Call', value: stats.shiftOnCall },
  ].filter(d => d.value > 0), [stats]);

  const chartCutiByJenis = useMemo(() =>
    Object.entries(stats.cutiByJenis).slice(0, 6).map(([jenis, count]) => ({ jenis: jenis.replace('Cuti ', ''), count })),
    [stats]);

  const chartWeekAttendance = stats.weekAttendance;

  // ─── Period-filtered attendance data ─────────────────────────────────────────
  const selectedWeekData = useMemo(() => {
    const period = WEEK_PERIODS[selectedWeekIdx];
    return period.days.map((d, i) => ({
      hari: period.labels[i],
      hadir: absensi.filter(a => a.tanggal === d && a.status === 'Hadir').length,
      alpha: absensi.filter(a => a.tanggal === d && a.status === 'Alpha').length,
      sakit: absensi.filter(a => a.tanggal === d && a.status === 'Sakit').length,
      izin: absensi.filter(a => a.tanggal === d && a.status === 'Izin').length,
    }));
  }, [selectedWeekIdx, absensi]);

  const weekSummaryData = useMemo(() => {
    return WEEK_PERIODS.map(period => ({
      label: period.short,
      hadir: period.days.reduce((s, d) => s + absensi.filter(a => a.tanggal === d && a.status === 'Hadir').length, 0),
      alpha: period.days.reduce((s, d) => s + absensi.filter(a => a.tanggal === d && a.status === 'Alpha').length, 0),
      sakit: period.days.reduce((s, d) => s + absensi.filter(a => a.tanggal === d && a.status === 'Sakit').length, 0),
      izin:  period.days.reduce((s, d) => s + absensi.filter(a => a.tanggal === d && a.status === 'Izin').length, 0),
    }));
  }, [absensi]);

  const comparisonChartData = useMemo(() => {
    const a = chartKehadiran[compareIdxA];
    const b = chartKehadiran[compareIdxB];
    const la = a.bulan;
    const lb = b.bulan;
    return [
      { kategori: 'Hadir',     [la]: a.hadir,            [lb]: b.hadir },
      { kategori: 'Sakit',     [la]: a.sakit,            [lb]: b.sakit },
      { kategori: 'Izin',      [la]: a.izin ?? 0,        [lb]: b.izin ?? 0 },
      { kategori: 'Cuti',      [la]: a.cuti,             [lb]: b.cuti },
      { kategori: 'Alpha',     [la]: a.alpha,            [lb]: b.alpha },
      { kategori: 'Dinas Luar',[la]: a.dinasLuar ?? 0,   [lb]: b.dinasLuar ?? 0 },
    ];
  }, [compareIdxA, compareIdxB]);

  const comparisonDelta = useMemo(() => {
    const a = chartKehadiran[compareIdxA];
    const b = chartKehadiran[compareIdxB];
    const pct = (vA: number, vB: number) => vA > 0 ? (((vB - vA) / vA) * 100).toFixed(1) : '0';
    return [
      { label: 'Hadir',      vA: a.hadir,           vB: b.hadir,           higherIsBetter: true  },
      { label: 'Sakit',      vA: a.sakit,           vB: b.sakit,           higherIsBetter: false },
      { label: 'Izin',       vA: a.izin ?? 0,       vB: b.izin ?? 0,       higherIsBetter: false },
      { label: 'Cuti',       vA: a.cuti,            vB: b.cuti,            higherIsBetter: null  },
      { label: 'Alpha',      vA: a.alpha,           vB: b.alpha,           higherIsBetter: false },
      { label: 'Dinas Luar', vA: a.dinasLuar ?? 0,  vB: b.dinasLuar ?? 0,  higherIsBetter: null  },
    ].map(r => ({ ...r, delta: r.vB - r.vA, pct: pct(r.vA, r.vB) }));
  }, [compareIdxA, compareIdxB]);

  const chartSKPDistrib = useMemo(() => [
    { label: 'Sangat Baik (≥110)', value: stats.skpSangatBaik, color: '#10b981' },
    { label: 'Baik (90–109)', value: stats.skpBaik, color: '#3b82f6' },
    { label: 'Cukup (70–89)', value: stats.skpCukup, color: '#f59e0b' },
    { label: 'Kurang (<70)', value: stats.skpKurang, color: '#ef4444' },
  ], [stats]);

  const chartInsidenK3RS = useMemo(() =>
    Object.entries(stats.insidenByJenis).map(([jenis, count]) => ({
      jenis: jenis.length > 18 ? jenis.slice(0, 16) + '…' : jenis,
      count,
    })),
    [stats]);

  // ─── Top SKP Performers ──────────────────────────────────────────────────────
  const topSKPPegawai = useMemo(() => {
    const withScore = skp
      .filter(s => s.nilaiAkhir && s.tahun === THIS_YEAR)
      .map(s => {
        const p = pegawai.find(p => p.id === s.pegawaiId);
        return { nama: p?.nama || '-', nilai: s.nilaiAkhir || 0, unit: p?.unitKerja || '-', predikat: s.predikat || '' };
      })
      .sort((a, b) => b.nilai - a.nilai)
      .slice(0, 5);
    return withScore;
  }, [skp, pegawai]);

  // ─── Upcoming Retirement ────────────────────────────────────────────────────
  const upcomingRetirement = useMemo(() => {
    const nowDate = new Date(TODAY);
    return pegawai
      .filter(p => {
        if (!p.batasPensiun) return false;
        const diff = (new Date(p.batasPensiun).getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return diff > 0 && diff <= 2;
      })
      .sort((a, b) => new Date(a.batasPensiun).getTime() - new Date(b.batasPensiun).getTime())
      .slice(0, 4)
      .map(p => {
        const diff = (new Date(p.batasPensiun).getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        const bulan = Math.round(diff);
        return { nama: p.nama, unit: p.unitKerja, batasPensiun: p.batasPensiun, bulanLagi: bulan };
      });
  }, [pegawai]);

  // ─── Alerts ─────────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const result: { type: 'danger' | 'warning' | 'info'; title: string; desc: string; count?: number; path: string }[] = [];
    if (stats.lisensiKritis > 0) {
      result.push({ type: 'danger', title: 'STR/SIP Expired / Akan Expired', desc: `${stats.strExpired + stats.sipExpired} expired, ${stats.strAkanExpired + stats.sipAkanExpired} akan expired dalam 6 bulan`, count: stats.lisensiKritis, path: '/credentialing' });
    }
    if (stats.akanPensiun1Thn > 0) {
      result.push({ type: 'danger', title: 'Pegawai Mendekati Pensiun (≤1 tahun)', desc: 'Segera lakukan perencanaan suksesi dan administrasi pensiun', count: stats.akanPensiun1Thn, path: '/pegawai' });
    }
    if (stats.disiplinBerat > 0) {
      result.push({ type: 'warning', title: 'Kasus Disiplin Berat Aktif', desc: 'Terdapat kasus hukuman disiplin berat yang masih dalam proses', count: stats.disiplinBerat, path: '/disiplin' });
    }
    if (stats.cutiPending > 0) {
      result.push({ type: 'warning', title: 'Pengajuan Cuti Menunggu Persetujuan', desc: 'Pengajuan cuti pegawai memerlukan persetujuan pejabat berwenang', count: stats.cutiPending, path: '/cuti' });
    }
    if (stats.kpProses > 0) {
      result.push({ type: 'info', title: 'Kenaikan Pangkat Periode April 2026', desc: 'Berkas kenaikan pangkat sedang diproses untuk periode April 2026', count: stats.kpProses, path: '/kenaikan-pangkat' });
    }
    if (stats.kontrakHabis > 0) {
      result.push({ type: 'warning', title: 'Kontrak Honorer Segera Berakhir', desc: 'Kontrak pegawai akan berakhir dalam 3 bulan ke depan, perlu keputusan perpanjangan', count: stats.kontrakHabis, path: '/kontrak' });
    }
    if (stats.diklatDirencanakan > 0) {
      result.push({ type: 'info', title: 'Diklat Dijadwalkan', desc: 'Program diklat telah terjadwal, pastikan peserta siap mengikuti', count: stats.diklatDirencanakan, path: '/diklat' });
    }
    return result;
  }, [stats]);

  // ─── Activity Feed ───────────────────────────────────────────────────────────
  const recentActivities = [
    { id: 1, text: 'Pengajuan cuti Ns. Septi Kurniasari, M.Kep disetujui Kasi Keperawatan', time: '5 mnt lalu', type: 'cuti', status: 'success' },
    { id: 2, text: 'Kenaikan pangkat Susilawati, SKM., MM ke Gol. IV/b berkas diverifikasi', time: '1 jam lalu', type: 'pangkat', status: 'info' },
    { id: 3, text: 'Absensi Jumat 6 Mar 2026: 215 hadir, 2 cuti, 1 sakit, 1 dinas luar', time: '2 jam lalu', type: 'absensi', status: 'info' },
    { id: 4, text: 'SKP Semester 1/2026 ditetapkan untuk 12 pegawai Unit Keperawatan', time: '3 jam lalu', type: 'skp', status: 'success' },
    { id: 5, text: 'STR Apoteker Ahmad Fanani, S.Farm, Apt akan expired dalam 6 bulan', time: '1 hari lalu', type: 'str', status: 'warning' },
    { id: 6, text: 'Laporan insiden K3RS Februari 2026 telah diverifikasi', time: '1 hari lalu', type: 'k3rs', status: 'success' },
    { id: 7, text: 'Kontrak kerja 2 pegawai Honorer diperpanjang s/d Desember 2026', time: '2 hari lalu', type: 'kontrak', status: 'info' },
    { id: 8, text: 'Mutasi dr. Chandra ke Instalasi Medical Check Up diproses', time: '3 hari lalu', type: 'mutasi', status: 'info' },
    { id: 9, text: 'Input data penggajian Maret 2026 telah diverifikasi Kepala Keuangan', time: '3 hari lalu', type: 'gaji', status: 'success' },
    { id: 10, text: 'Diklat PKT III LAN RI: dr. Surya Puspa Dewi, MARS (berlangsung)', time: '5 hari lalu', type: 'diklat', status: 'info' },
  ];

  const agendaItems = [
    { id: 1, date: '10 Mar', label: 'PKT III LAN RI – dr. Surya Puspa Dewi (berlangsung)', color: 'bg-blue-500', type: 'diklat' },
    { id: 2, date: '15 Mar', label: 'Batas pengajuan SKP Semester 1 Tahun 2026', color: 'bg-purple-500', type: 'skp' },
    { id: 3, date: '20 Mar', label: 'Sidang Kredensial Komite Medik – 3 dokter spesialis baru', color: 'bg-teal-500', type: 'kredensial' },
    { id: 4, date: '31 Mar', label: 'Deadline rekap absensi Maret 2026', color: 'bg-orange-500', type: 'absensi' },
    { id: 5, date: '1 Apr', label: 'Kenaikan pangkat periode April 2026 berlaku', color: 'bg-green-500', type: 'pangkat' },
    { id: 6, date: '7 Apr', label: 'Diklat Fungsional Perawat Ahli Muda – Ns. Jumiah', color: 'bg-blue-500', type: 'diklat' },
    { id: 7, date: '30 Apr', label: 'Batas STR/SIP check & renewal triwulan II', color: 'bg-red-500', type: 'str' },
  ];

  const quickActions = [
    { label: 'Data Pegawai', icon: Users, path: '/pegawai', color: 'bg-blue-600', badge: String(stats.totalPegawai) },
    { label: 'Presensi', icon: Clock, path: '/absensi', color: 'bg-emerald-600', badge: `${stats.kehadiranPct}%` },
    { label: 'Cuti', icon: CalendarDays, path: '/cuti', color: 'bg-orange-500', badge: stats.cutiPending > 0 ? `${stats.cutiPending}` : undefined },
    { label: 'Kenaikan Pangkat', icon: TrendingUp, path: '/kenaikan-pangkat', color: 'bg-purple-600', badge: stats.kpProses > 0 ? `${stats.kpProses}` : undefined },
    { label: 'SKP', icon: Target, path: '/skp', color: 'bg-indigo-600' },
    { label: 'Penggajian', icon: DollarSign, path: '/penggajian', color: 'bg-teal-600' },
    { label: 'Credentialing', icon: Shield, path: '/credentialing', color: 'bg-cyan-600', badge: stats.lisensiKritis > 0 ? `${stats.lisensiKritis}` : undefined },
    { label: 'K3RS', icon: HeartPulse, path: '/k3rs', color: 'bg-red-600' },
    { label: 'Disiplin', icon: ShieldAlert, path: '/disiplin', color: 'bg-yellow-600', badge: stats.disiplinAktif > 0 ? `${stats.disiplinAktif}` : undefined },
    { label: 'Diklat', icon: GraduationCap, path: '/diklat', color: 'bg-pink-600', badge: stats.diklatBerlangsung > 0 ? `${stats.diklatBerlangsung}` : undefined },
    { label: 'Surat Kepeg.', icon: Mail, path: '/surat-kepegawaian', color: 'bg-sky-600' },
    { label: 'Laporan', icon: FileBarChart2, path: '/laporan', color: 'bg-gray-600' },
  ];

  const activityTypeStyle: Record<string, string> = {
    cuti: 'bg-orange-100 text-orange-600',
    pangkat: 'bg-purple-100 text-purple-600',
    absensi: 'bg-green-100 text-green-600',
    skp: 'bg-blue-100 text-blue-600',
    str: 'bg-red-100 text-red-600',
    k3rs: 'bg-pink-100 text-pink-600',
    kontrak: 'bg-teal-100 text-teal-600',
    mutasi: 'bg-indigo-100 text-indigo-600',
    gaji: 'bg-emerald-100 text-emerald-600',
    diklat: 'bg-violet-100 text-violet-600',
  };

  const dotStyle: Record<string, string> = {
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    info: 'bg-blue-400',
    danger: 'bg-red-400',
  };

  // ─── Health Score Breakdown ──────────────────────────────────────────────────
  const healthBreakdown = [
    { label: 'Kehadiran', score: stats.attendanceScore, weight: '25%', color: 'bg-emerald-500' },
    { label: 'Kredensial', score: stats.credScore, weight: '25%', color: 'bg-blue-500' },
    { label: 'Kinerja SKP', score: stats.skpScore, weight: '20%', color: 'bg-indigo-500' },
    { label: 'Disiplin', score: stats.disiplinScore, weight: '15%', color: 'bg-amber-500' },
    { label: 'Diklat', score: stats.trainingScore, weight: '15%', color: 'bg-pink-500' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* ── Hero Header ──────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#1e3a5f] via-[#1e4d7b] to-[#2563a8] rounded-2xl overflow-hidden p-5 lg:p-6 shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
        <div className="absolute top-4 left-4 w-32 h-32 bg-white/3 rounded-full pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/70 text-xs">Minggu, 8 Maret 2026 · Sistem Aktif</span>
            </div>
            <h1 className="text-white mb-1">Dashboard HR APP</h1>
            <p className="text-blue-200 text-sm">SIMRS - Human Capital Management System (HCMS)</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { label: '246 Total Pegawai', icon: Users },
                { label: `${stats.pegawaiPNS} PNS · ${stats.pegawaiPPPK} PPPK · ${stats.pegawaiHonorer} Honorer`, icon: Hash },
                { label: `${new Set(pegawai.map(p => p.unitKerja)).size} Unit Kerja Aktif`, icon: Building2 },
              ].map(chip => (
                <span key={chip.label} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white/90 text-xs">
                  <chip.icon className="w-3.5 h-3.5 text-blue-200" /> {chip.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right – Summary + Alerts chips */}
          <div className="flex flex-wrap lg:flex-nowrap gap-3">
            {[
              { label: 'Hadir Jumat', value: `${stats.hadirHariIni}`, sub: `${stats.kehadiranPct}%`, bg: 'bg-white/10' },
              { label: 'Alert Aktif', value: String(alerts.length), sub: `${alerts.filter(a => a.type === 'danger').length} bahaya`, bg: alerts.length > 0 ? 'bg-red-500/30' : 'bg-white/10' },
              { label: 'Health Score', value: String(stats.healthScore), sub: stats.healthScore >= 85 ? 'Sangat Baik' : stats.healthScore >= 70 ? 'Baik' : 'Perlu Perhatian', bg: stats.healthScore >= 70 ? 'bg-green-500/20' : 'bg-amber-500/30' },
              { label: 'Gaji Maret', value: fmtRp(stats.totalGajiNetto), sub: `${stats.slipBulanIniCount} slip`, bg: 'bg-white/10' },
            ].map(chip => (
              <div key={chip.label} className={`${chip.bg} backdrop-blur-sm rounded-xl px-4 py-2.5 text-center min-w-[80px]`}>
                <p className="text-white font-semibold text-lg leading-tight">{chip.value}</p>
                <p className="text-blue-200 text-[11px]">{chip.label}</p>
                <p className="text-white/60 text-[10px]">{chip.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex gap-1 overflow-x-auto">
        <TabButton active={activeTab === 'ringkasan'} onClick={() => setActiveTab('ringkasan')} icon={LayoutDashboard} label="Ringkasan" />
        <TabButton active={activeTab === 'kehadiran'} onClick={() => setActiveTab('kehadiran')} icon={Clock} label="Kehadiran & Jadwal" badge={stats.terlambat} />
        <TabButton active={activeTab === 'sdm'} onClick={() => setActiveTab('sdm')} icon={Users} label="SDM & Pengembangan" />
        <TabButton active={activeTab === 'kinerja'} onClick={() => setActiveTab('kinerja')} icon={Target} label="Kinerja & Kepatuhan" badge={alerts.filter(a => a.type === 'danger').length} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: RINGKASAN                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-5">

          {/* Alert Banner */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-gray-800">Peringatan & Notifikasi</span>
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">{alerts.length}</span>
                </div>
                <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Semua <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 p-3">
                {alerts.map((a, i) => (
                  <AlertItem key={i} type={a.type} title={a.title} desc={a.desc} count={a.count} onClick={() => navigate(a.path)} />
                ))}
              </div>
            </div>
          )}

          {/* Organizational Health Score + KPI Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Health Score Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Organizational Health</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Indeks Kesehatan SDM</p>
                </div>
                <RefreshCw className="w-3.5 h-3.5 text-gray-300" />
              </div>
              <div className="flex justify-center mb-3">
                <HealthGauge score={stats.healthScore} />
              </div>
              <div className="space-y-1.5">
                {healthBreakdown.map(h => (
                  <div key={h.label}>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                      <span>{h.label} <span className="text-gray-300">({h.weight})</span></span>
                      <span className="font-medium text-gray-700">{h.score}</span>
                    </div>
                    <MiniBar value={h.score} total={100} color={h.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* KPI 1–3 */}
            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Total Pegawai */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/pegawai')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">Aktif: {stats.pegawaiAktif}</span>
                </div>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalPegawai}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Pegawai</p>
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50 flex-wrap">
                  <span className="text-[10px] text-blue-600 font-medium">PNS: {stats.pegawaiPNS}</span>
                  <span className="text-[10px] text-purple-600 font-medium">PPPK: {stats.pegawaiPPPK}</span>
                  <span className="text-[10px] text-gray-400 font-medium">Hon: {stats.pegawaiHonorer}</span>
                </div>
              </div>

              {/* Kehadiran */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/absensi')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">{stats.kehadiranPct}%</span>
                </div>
                <p className="text-2xl font-semibold text-gray-800">{stats.hadirHariIni}</p>
                <p className="text-xs text-gray-500 mt-0.5">Hadir Jumat (6/3)</p>
                <div className="mt-2">
                  <MiniBar value={stats.hadirHariIni} total={stats.pegawaiAktif} color="bg-emerald-500" />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-red-500">Alpha: {stats.alphaHariIni}</span>
                    <span className="text-[10px] text-amber-500">Terlambat: {stats.terlambat}</span>
                  </div>
                </div>
              </div>

              {/* Cuti Pending */}
              <StatCard
                label="Cuti Pending Approval"
                value={stats.cutiPending}
                sub={`${stats.cutiDisetujuiBulanIni} disetujui bulan ini`}
                subColor="text-green-600"
                icon={CalendarDays}
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
                badge={stats.cutiPending > 0 ? { text: 'Perlu Approval', color: 'bg-orange-100 text-orange-700' } : undefined}
                onClick={() => navigate('/cuti')}
              />

              {/* KP */}
              <StatCard
                label="Kenaikan Pangkat"
                value={stats.kpProses + stats.kpUsul}
                sub={`${stats.kpProses} proses · ${stats.kpSelesaiTahunIni} selesai thn ini`}
                subColor="text-purple-600"
                icon={TrendingUp}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                badge={{ text: 'Apr 2026', color: 'bg-purple-50 text-purple-700' }}
                onClick={() => navigate('/kenaikan-pangkat')}
              />

              {/* SKP */}
              <StatCard
                label="SKP Aktif 2026"
                value={stats.skpCount2026}
                sub={`Rata-rata nilai: ${stats.skpNilaiRataRata} · ${stats.skpBelumDitetapkan} belum`}
                subColor="text-indigo-600"
                icon={Target}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-600"
                onClick={() => navigate('/skp')}
              />

              {/* STR/SIP */}
              <StatCard
                label="STR/SIP Kritis"
                value={stats.lisensiKritis}
                sub={`${stats.strExpired + stats.sipExpired} expired · ${stats.strAkanExpired + stats.sipAkanExpired} akan expire`}
                subColor={stats.strExpired + stats.sipExpired > 0 ? 'text-red-600' : 'text-amber-600'}
                icon={Shield}
                iconBg="bg-cyan-50"
                iconColor="text-cyan-600"
                badge={stats.strExpired + stats.sipExpired > 0 ? { text: 'Ada Expired!', color: 'bg-red-100 text-red-700' } : undefined}
                onClick={() => navigate('/credentialing')}
              />
            </div>
          </div>

          {/* Second KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Disiplin Aktif"
              value={stats.disiplinAktif}
              sub={stats.disiplinBerat > 0 ? `${stats.disiplinBerat} kasus berat` : 'Tidak ada kasus berat'}
              subColor={stats.disiplinBerat > 0 ? 'text-red-600' : 'text-gray-400'}
              icon={ShieldAlert}
              iconBg="bg-red-50"
              iconColor="text-red-600"
              badge={stats.disiplinBerat > 0 ? { text: 'Berat!', color: 'bg-red-100 text-red-700' } : undefined}
              onClick={() => navigate('/disiplin')}
            />
            <StatCard
              label="Diklat Berjalan"
              value={stats.diklatBerlangsung}
              sub={`${stats.diklatDirencanakan} direncanakan · ${stats.diklatSelesai} selesai`}
              subColor="text-blue-600"
              icon={GraduationCap}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              onClick={() => navigate('/diklat')}
            />
            <StatCard
              label="Pensiun ≤ 2 Thn"
              value={stats.akanPensiun2Thn}
              sub={`${stats.akanPensiun1Thn} dalam 1 tahun ke depan`}
              subColor={stats.akanPensiun1Thn > 0 ? 'text-red-600' : 'text-amber-600'}
              icon={AlertCircle}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              badge={{ text: '≤2 Thn', color: 'bg-amber-50 text-amber-700' }}
              onClick={() => navigate('/pegawai')}
            />
            <StatCard
              label="Kontrak Habis (≤3 bln)"
              value={stats.kontrakHabis}
              sub={`${stats.kontrakAktif} kontrak aktif`}
              subColor={stats.kontrakHabis > 0 ? 'text-orange-600' : 'text-gray-400'}
              icon={FileSignature}
              iconBg="bg-teal-50"
              iconColor="text-teal-600"
              onClick={() => navigate('/kontrak')}
            />
          </div>

          {/* Third KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Gaji Netto Maret"
              value={fmtRp(stats.totalGajiNetto)}
              sub={`Rata-rata: ${fmtRp(stats.avgGajiNetto)}/orang`}
              subColor="text-teal-600"
              icon={DollarSign}
              iconBg="bg-teal-50"
              iconColor="text-teal-600"
              onClick={() => navigate('/penggajian')}
            />
            <StatCard
              label="Insiden K3RS Maret"
              value={stats.insidenBulanIni}
              sub="Total insiden bulan ini"
              subColor="text-gray-500"
              icon={HeartPulse}
              iconBg="bg-pink-50"
              iconColor="text-pink-600"
              onClick={() => navigate('/k3rs')}
            />
            <StatCard
              label="Penghargaan Tahun Ini"
              value={stats.penghargaanTahunIni}
              sub="Penghargaan & Satyalancana"
              subColor="text-yellow-600"
              icon={Award}
              iconBg="bg-yellow-50"
              iconColor="text-yellow-500"
              onClick={() => navigate('/penghargaan')}
            />
            <div
              className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 cursor-pointer hover:opacity-90 transition-all shadow-sm"
              onClick={() => navigate('/laporan')}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileBarChart2 className="w-5 h-5 text-white" />
                </div>
                <Zap className="w-4 h-4 text-white/60" />
              </div>
              <p className="text-xl font-semibold text-white">Laporan SDM</p>
              <p className="text-blue-200 text-xs mt-0.5">Statistik & Analitik Lengkap</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-white/80 text-xs">Lihat laporan</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/80" />
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Tren Kehadiran 6 Bulan</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Sept 2025 – Mar 2026</p>
                </div>
                <button onClick={() => navigate('/absensi')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  Detail <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <RechartsWrapper
                type="line"
                data={chartKehadiran}
                xKey="bulan"
                lines={[
                  { dataKey: 'hadir', stroke: '#10b981', name: 'Hadir' },
                  { dataKey: 'sakit', stroke: '#3b82f6', name: 'Sakit' },
                  { dataKey: 'cuti', stroke: '#f59e0b', name: 'Cuti' },
                  { dataKey: 'alpha', stroke: '#ef4444', name: 'Alpha' },
                ]}
                height={240}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Status Kepegawaian</h3>
                <p className="text-xs text-gray-500 mt-0.5">PNS · PPPK · Honorer</p>
              </div>
              <RechartsWrapper
                type="pie"
                data={chartStatusPegawai}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                colors={['#3b82f6', '#8b5cf6', '#94a3b8']}
                height={200}
              />
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-50">
                {[
                  { label: 'PNS', value: stats.pegawaiPNS, pct: Math.round(stats.pegawaiPNS / stats.totalPegawai * 100), color: 'bg-blue-500' },
                  { label: 'PPPK', value: stats.pegawaiPPPK, pct: Math.round(stats.pegawaiPPPK / stats.totalPegawai * 100), color: 'bg-purple-500' },
                  { label: 'Honorer', value: stats.pegawaiHonorer, pct: Math.round(stats.pegawaiHonorer / stats.totalPegawai * 100), color: 'bg-slate-400' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-1`} />
                    <p className="text-sm font-semibold text-gray-700">{item.value}</p>
                    <p className="text-[10px] text-gray-400">{item.label}</p>
                    <p className="text-[10px] text-gray-500">{item.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Distribusi Golongan</h3>
                <p className="text-xs text-gray-500 mt-0.5">Jumlah pegawai per golongan</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={chartGolongan}
                xKey="golongan"
                yKey="jumlah"
                colors={['#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a5f']}
                height={200}
                radius={[6, 6, 0, 0]}
              />
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Unit Kerja Terbesar</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Top 8 unit kerja berdasarkan jumlah pegawai</p>
                </div>
                <button onClick={() => navigate('/organisasi')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  Org Chart <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <RechartsWrapper
                type="bar"
                data={chartUnitKerja.slice(0, 8)}
                xKey="name"
                yKey="value"
                colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#6366f1']}
                height={200}
                radius={[6, 6, 0, 0]}
              />
            </div>
          </div>

          {/* Charts Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Kehadiran Jumat (6/3)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Rekap hari kerja terakhir</p>
              </div>
              <RechartsWrapper
                type="pie"
                data={chartKehadiranHariIni}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                colors={['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4']}
                height={200}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Komposisi Gender</h3>
                <p className="text-xs text-gray-500 mt-0.5">Laki-laki vs Perempuan</p>
              </div>
              <RechartsWrapper
                type="pie"
                data={chartGender}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                colors={['#3b82f6', '#ec4899']}
                height={170}
              />
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-50">
                <div className="text-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-semibold text-gray-700">{stats.genderL}</p>
                  <p className="text-[11px] text-gray-400">Laki-laki</p>
                  <p className="text-[11px] text-blue-600">{Math.round(stats.genderL / stats.totalPegawai * 100)}%</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 rounded-full bg-pink-500 mx-auto mb-1" />
                  <p className="text-lg font-semibold text-gray-700">{stats.genderP}</p>
                  <p className="text-[11px] text-gray-400">Perempuan</p>
                  <p className="text-[11px] text-pink-600">{Math.round(stats.genderP / stats.totalPegawai * 100)}%</p>
                </div>
              </div>
            </div>
            {/* SKP Widget */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Kinerja & SKP</h3>
                <p className="text-xs text-gray-500 mt-0.5">Semester 1 Tahun 2026</p>
              </div>
              <div className="space-y-3">
                {chartSKPDistrib.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: skp.length > 0 ? `${Math.min(100, Math.round((item.value / skp.length) * 100))}%` : '0%', backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-800">Rata-rata Nilai SKP</p>
                  <p className="text-[10px] text-indigo-600">{skp.length} SKP ditetapkan</p>
                </div>
                <span className="text-2xl font-bold text-indigo-600">{stats.skpNilaiRataRata}</span>
              </div>
              <button onClick={() => navigate('/skp')} className="mt-3 w-full text-xs text-blue-600 hover:underline flex items-center justify-center gap-1">
                Lihat Detail SKP <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Activity Feed */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                {(['aktivitas', 'pengingat'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivityFeed(tab)}
                    className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors ${activityFeed === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab === 'aktivitas' ? '📋 Aktivitas' : '📅 Agenda'}
                  </button>
                ))}
              </div>
              {activityFeed === 'aktivitas' ? (
                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                  {recentActivities.map(a => (
                    <div key={a.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${dotStyle[a.status]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 leading-relaxed">{a.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${activityTypeStyle[a.type] || 'bg-gray-100 text-gray-600'}`}>{a.type.toUpperCase()}</span>
                            <span className="text-[10px] text-gray-400">{a.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                  {agendaItems.map(item => (
                    <div key={item.id} className="px-4 py-3 hover:bg-gray-50 flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-[9px] font-bold text-center leading-tight">{item.date}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-700">{item.label}</p>
                        <span className="text-[10px] text-gray-400 capitalize">{item.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-2 border-t border-gray-100">
                <button className="text-xs text-blue-600 hover:underline w-full text-center">
                  Lihat Semua {activityFeed === 'aktivitas' ? 'Aktivitas' : 'Agenda'}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-800">Akses Cepat</span>
              </div>
              <div className="p-3 grid grid-cols-3 gap-2">
                {quickActions.map(action => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] text-gray-600 text-center leading-tight group-hover:text-gray-800">{action.label}</span>
                    {action.badge && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">{action.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Ringkasan SDM */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">Ringkasan SDM</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'Masa Kerja ≥ 20 Tahun', value: pegawai.filter(p => { const th = parseInt(p.masaKerja); return !isNaN(th) && th >= 20; }).length, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                  { label: 'Pendidikan S2/S3/Spesialis', value: pegawai.filter(p => ['S2', 'S3', 'Spesialis'].includes(p.pendidikanTerakhir)).length, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Jabatan Fungsional Dokter', value: pegawai.filter(p => p.jabatanFungsional?.toLowerCase().includes('dokter')).length, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Perawat / Bidan', value: pegawai.filter(p => ['Perawat', 'Bidan'].includes(p.jabatanFungsional)).length, icon: HeartPulse, color: 'text-pink-600', bg: 'bg-pink-50' },
                  { label: 'Tenaga Admin / Non-Klinis', value: pegawai.filter(p => !['Perawat', 'Bidan', 'Dokter', 'Dokter Gigi'].some(k => p.jabatanFungsional?.includes(k))).length, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Unit Kerja Aktif', value: new Set(pegawai.map(p => p.unitKerja)).size, icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">{item.label}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 flex-shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3">
                <button onClick={() => navigate('/pegawai')} className="w-full py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                  Lihat Semua Pegawai <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: KEHADIRAN & JADWAL                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'kehadiran' && (
        <div className="space-y-5">
          {/* Kehadiran KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-600">{stats.kehadiranPct}%</span>
              </div>
              <p className="text-2xl font-semibold text-gray-800">{stats.hadirHariIni}</p>
              <p className="text-xs text-gray-500">Hadir Jum (6/3)</p>
              <MiniBar value={stats.hadirHariIni} total={stats.pegawaiAktif} color="bg-emerald-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <UserX className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-xs font-semibold text-red-500">Alpha</span>
              </div>
              <p className="text-2xl font-semibold text-gray-800">{stats.alphaHariIni}</p>
              <p className="text-xs text-gray-500">Tidak hadir tanpa ket.</p>
              <MiniBar value={stats.alphaHariIni} total={stats.pegawaiAktif} color="bg-red-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs font-semibold text-amber-500">Terlambat</span>
              </div>
              <p className="text-2xl font-semibold text-gray-800">{stats.terlambat}</p>
              <p className="text-xs text-gray-500">Masuk setelah 08:00</p>
              <MiniBar value={stats.terlambat} total={stats.hadirHariIni} color="bg-amber-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-blue-600">Dinas Luar</span>
              </div>
              <p className="text-2xl font-semibold text-gray-800">{stats.dinasLuarHariIni}</p>
              <p className="text-xs text-gray-500">Tugas di luar kantor</p>
              <MiniBar value={stats.dinasLuarHariIni} total={stats.pegawaiAktif} color="bg-blue-500" />
            </div>
          </div>

          {/* Weekly attendance + Cuti breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Weekly Attendance Bar – with period selector */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-gray-800">Kehadiran Per Pekan</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{WEEK_PERIODS[selectedWeekIdx].label}</p>
                </div>
                <button onClick={() => navigate('/absensi')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Detail <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Week period pill selectors */}
              <div className="flex gap-1.5 flex-wrap mb-3">
                {WEEK_PERIODS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedWeekIdx(i)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all font-medium ${
                      selectedWeekIdx === i
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {p.short}
                  </button>
                ))}
              </div>

              {/* Week-over-week delta vs previous period */}
              {selectedWeekIdx < WEEK_PERIODS.length - 1 && weekSummaryData[selectedWeekIdx] && weekSummaryData[selectedWeekIdx + 1] && (() => {
                const curr = weekSummaryData[selectedWeekIdx];
                const prev = weekSummaryData[selectedWeekIdx + 1];
                const dHadir = curr.hadir - prev.hadir;
                const dAlpha = curr.alpha - prev.alpha;
                const dSakit = curr.sakit - prev.sakit;
                return (
                  <div className="mb-3 p-2.5 bg-gray-50 rounded-lg flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] text-gray-400 font-medium">vs {prev.label}:</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${dHadir >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {dHadir >= 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />} Hadir {dHadir >= 0 ? '+' : ''}{dHadir}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${dAlpha <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {dAlpha <= 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />} Alpha {dAlpha >= 0 ? '+' : ''}{dAlpha}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${dSakit <= 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {dSakit <= 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />} Sakit {dSakit >= 0 ? '+' : ''}{dSakit}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">Total hadir pekan ini: <span className="font-semibold text-gray-600">{curr.hadir}</span></span>
                  </div>
                );
              })()}

              <RechartsWrapper
                type="bar"
                data={selectedWeekData}
                xKey="hari"
                yKey={['hadir', 'sakit', 'izin', 'alpha']}
                colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444']}
                height={200}
                radius={[4, 4, 0, 0]}
              />

              {/* 4-week mini comparison row */}
              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 mb-2">Rekap kehadiran per pekan (total 5 hari kerja)</p>
                <div className="grid grid-cols-4 gap-2">
                  {weekSummaryData.map((w, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedWeekIdx(i)}
                      className={`cursor-pointer p-2 rounded-lg text-center transition-all ${selectedWeekIdx === i ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <p className={`text-sm font-semibold ${selectedWeekIdx === i ? 'text-blue-700' : 'text-gray-700'}`}>{w.hadir}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{w.label}</p>
                      <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.round((w.hadir / (stats.pegawaiAktif * 5 || 1)) * 100))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cuti by Jenis */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Rekap Cuti Per Jenis</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Semua periode · {cuti.length} total pengajuan</p>
                </div>
                <button onClick={() => navigate('/cuti')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Kelola Cuti <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <RechartsWrapper
                type="bar"
                data={chartCutiByJenis}
                xKey="jenis"
                yKey="count"
                colors={['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed']}
                height={220}
                radius={[4, 4, 0, 0]}
              />
            </div>
          </div>

          {/* Kehadiran monthly trend / perbandingan */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">

            {/* ── Filter Bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-gray-800">
                  {kehadiranView === 'tren' ? 'Tren Kehadiran Bulanan' : 'Perbandingan Kehadiran Antar Bulan'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {kehadiranView === 'tren'
                    ? `Statistik ${trendRange === 7 ? 'semua periode' : `${trendRange} bulan terakhir`} · Sep 2025 – Mar 2026`
                    : `${BULAN_META[compareIdxA].label} dibanding ${BULAN_META[compareIdxB].label}`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* View toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
                  <button
                    onClick={() => setKehadiranView('tren')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[11px] rounded-md transition-all ${kehadiranView === 'tren' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <TrendingUp className="w-3 h-3" /> Tren
                  </button>
                  <button
                    onClick={() => setKehadiranView('perbandingan')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[11px] rounded-md transition-all ${kehadiranView === 'perbandingan' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Filter className="w-3 h-3" /> Bandingkan
                  </button>
                </div>

                {/* Tren: range selector */}
                {kehadiranView === 'tren' && (
                  <select
                    value={trendRange}
                    onChange={e => setTrendRange(Number(e.target.value))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value={3}>3 Bulan Terakhir</option>
                    <option value={6}>6 Bulan Terakhir</option>
                    <option value={7}>Semua Periode (7 bln)</option>
                  </select>
                )}

                {/* Perbandingan: month A vs B selectors */}
                {kehadiranView === 'perbandingan' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={compareIdxA}
                      onChange={e => setCompareIdxA(Number(e.target.value))}
                      className="text-xs border border-blue-300 rounded-lg px-2 py-1.5 bg-blue-50 text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {BULAN_META.map(b => (
                        <option key={b.idx} value={b.idx} disabled={b.idx === compareIdxB}>{b.label}</option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-400 font-medium">vs</span>
                    <select
                      value={compareIdxB}
                      onChange={e => setCompareIdxB(Number(e.target.value))}
                      className="text-xs border border-emerald-300 rounded-lg px-2 py-1.5 bg-emerald-50 text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    >
                      {BULAN_META.map(b => (
                        <option key={b.idx} value={b.idx} disabled={b.idx === compareIdxA}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* ── Tren Mode ── */}
            {kehadiranView === 'tren' && (
              <RechartsWrapper
                type="line"
                data={chartKehadiran.slice(Math.max(0, chartKehadiran.length - trendRange))}
                xKey="bulan"
                lines={[
                  { dataKey: 'hadir',    stroke: '#10b981', name: 'Hadir' },
                  { dataKey: 'sakit',    stroke: '#3b82f6', name: 'Sakit' },
                  { dataKey: 'cuti',     stroke: '#f59e0b', name: 'Cuti' },
                  { dataKey: 'alpha',    stroke: '#ef4444', name: 'Alpha' },
                  { dataKey: 'izin',     stroke: '#8b5cf6', name: 'Izin' },
                  { dataKey: 'dinasLuar',stroke: '#06b6d4', name: 'Dinas Luar' },
                ]}
                height={260}
              />
            )}

            {/* ── Perbandingan Mode ── */}
            {kehadiranView === 'perbandingan' && (
              <div>
                {/* Color legend pills */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-xs text-gray-600">{BULAN_META[compareIdxA].label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-xs text-gray-600">{BULAN_META[compareIdxB].label}</span>
                  </div>
                </div>

                <RechartsWrapper
                  type="bar"
                  data={comparisonChartData}
                  xKey="kategori"
                  yKey={[chartKehadiran[compareIdxA].bulan, chartKehadiran[compareIdxB].bulan]}
                  colors={['#3b82f6', '#10b981']}
                  height={240}
                  radius={[4, 4, 0, 0]}
                />

                {/* ── Delta Summary Table ── */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600">Analisis Perbandingan</span>
                    <span className="text-[10px] text-gray-400">· {BULAN_META[compareIdxA].label} → {BULAN_META[compareIdxB].label}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-1.5 pr-3 text-gray-500 font-medium w-24">Kategori</th>
                          <th className="text-right py-1.5 pr-3 text-blue-600 font-medium">{BULAN_META[compareIdxA].label}</th>
                          <th className="text-right py-1.5 pr-3 text-emerald-600 font-medium">{BULAN_META[compareIdxB].label}</th>
                          <th className="text-right py-1.5 pr-3 text-gray-500 font-medium">Δ Absolut</th>
                          <th className="text-right py-1.5 text-gray-500 font-medium">Δ %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {comparisonDelta.map(row => {
                          const isUp = row.delta > 0;
                          const isDown = row.delta < 0;
                          const isGood = row.higherIsBetter === null ? null
                            : row.higherIsBetter ? isUp : isDown;
                          const deltaColor = isGood === null ? 'text-gray-500'
                            : isGood ? 'text-green-600' : 'text-red-500';
                          return (
                            <tr key={row.label} className="hover:bg-gray-50">
                              <td className="py-2 pr-3 font-medium text-gray-700">{row.label}</td>
                              <td className="py-2 pr-3 text-right text-gray-600">{row.vA.toLocaleString('id-ID')}</td>
                              <td className="py-2 pr-3 text-right text-gray-600">{row.vB.toLocaleString('id-ID')}</td>
                              <td className={`py-2 pr-3 text-right font-semibold ${deltaColor}`}>
                                <span className="flex items-center justify-end gap-0.5">
                                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  {row.delta > 0 ? '+' : ''}{row.delta.toLocaleString('id-ID')}
                                </span>
                              </td>
                              <td className={`py-2 text-right font-semibold ${deltaColor}`}>
                                {row.vA === 0 ? '—' : `${row.delta >= 0 ? '+' : ''}${row.pct}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary insight chips */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(() => {
                      const hadirRow = comparisonDelta.find(r => r.label === 'Hadir');
                      const alphaRow = comparisonDelta.find(r => r.label === 'Alpha');
                      const insights: { text: string; color: string }[] = [];
                      if (hadirRow) {
                        if (hadirRow.delta > 0) insights.push({ text: `Kehadiran naik ${hadirRow.delta} hari-orang (+${hadirRow.pct}%)`, color: 'bg-green-50 text-green-700 border-green-200' });
                        else if (hadirRow.delta < 0) insights.push({ text: `Kehadiran turun ${Math.abs(hadirRow.delta)} hari-orang (${hadirRow.pct}%)`, color: 'bg-red-50 text-red-700 border-red-200' });
                        else insights.push({ text: 'Kehadiran stabil dibanding periode sebelumnya', color: 'bg-gray-50 text-gray-600 border-gray-200' });
                      }
                      if (alphaRow && alphaRow.delta < 0) insights.push({ text: `Alpha berkurang ${Math.abs(alphaRow.delta)} kasus`, color: 'bg-green-50 text-green-700 border-green-200' });
                      if (alphaRow && alphaRow.delta > 0) insights.push({ text: `Alpha bertambah ${alphaRow.delta} kasus – perlu evaluasi`, color: 'bg-amber-50 text-amber-700 border-amber-200' });
                      return insights.map((ins, i) => (
                        <span key={i} className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${ins.color}`}>{ins.text}</span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shift Coverage + Leave Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Shift Coverage Today */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Jadwal Shift Hari Ini</h3>
                <p className="text-xs text-gray-500 mt-0.5">Minggu, 8 Maret 2026</p>
              </div>
              {chartShiftToday.length > 0 ? (
                <div className="space-y-4">
                  <RechartsWrapper
                    type="pie"
                    data={chartShiftToday}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                    colors={['#3b82f6', '#f59e0b', '#1e40af', '#06b6d4']}
                    height={160}
                  />
                  <div className="space-y-2">
                    {[
                      { label: 'Shift Pagi (06:00–14:00)', value: stats.shiftPagi, color: 'bg-blue-500' },
                      { label: 'Shift Sore (14:00–22:00)', value: stats.shiftSore, color: 'bg-amber-500' },
                      { label: 'Shift Malam (22:00–06:00)', value: stats.shiftMalam, color: 'bg-indigo-600' },
                      { label: 'On-Call', value: stats.shiftOnCall, color: 'bg-cyan-500' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.color} flex-shrink-0`} />
                        <span className="text-[11px] text-gray-600 flex-1">{s.label}</span>
                        <span className="text-xs font-semibold text-gray-700">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center">
                  <CalendarDays className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Hari Minggu – Tidak ada jadwal shift</p>
                  <button onClick={() => navigate('/penjadwalan')} className="mt-2 text-xs text-blue-600 hover:underline">Lihat Jadwal</button>
                </div>
              )}
            </div>

            {/* Cuti Status */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Status Cuti</h3>
                <p className="text-xs text-gray-500 mt-0.5">{cuti.length} total pengajuan</p>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Pending Approval', value: cuti.filter(c => c.status === 'Pending').length, color: 'bg-amber-500', textColor: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Disetujui', value: cuti.filter(c => c.status === 'Disetujui').length, color: 'bg-green-500', textColor: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Ditolak', value: cuti.filter(c => c.status === 'Ditolak').length, color: 'bg-red-400', textColor: 'text-red-600', bg: 'bg-red-50' },
                ].map(s => (
                  <div key={s.label} className={`flex items-center justify-between p-3 rounded-lg ${s.bg}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${s.color}`} />
                      <span className="text-xs text-gray-700">{s.label}</span>
                    </div>
                    <span className={`text-lg font-bold ${s.textColor}`}>{s.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Disetujui bulan ini</p>
                  <div className="flex items-center justify-between mt-1">
                    <MiniBar value={stats.cutiDisetujuiBulanIni} total={cuti.filter(c => c.status === 'Disetujui').length} color="bg-green-500" />
                    <span className="text-xs font-semibold text-gray-700 ml-3">{stats.cutiDisetujuiBulanIni}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('/cuti')} className="mt-4 w-full py-2 rounded-lg bg-orange-50 text-orange-700 text-xs font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-1">
                Kelola Pengajuan Cuti <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Upcoming Retirement */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Mendekati Pensiun</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pegawai dengan batas pensiun ≤ 2 tahun</p>
              </div>
              {upcomingRetirement.length > 0 ? (
                <div className="space-y-3">
                  {upcomingRetirement.map((p, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${p.bulanLagi <= 12 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.nama}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{p.unit}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-500">{p.batasPensiun}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.bulanLagi <= 12 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.bulanLagi} bln lagi
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-200 mb-2" />
                  <p className="text-sm text-green-600">Tidak ada pegawai mendekati pensiun</p>
                </div>
              )}
              <button onClick={() => navigate('/pegawai')} className="mt-3 w-full py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-1">
                Lihat Semua Data Pensiun <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: SDM & PENGEMBANGAN                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sdm' && (
        <div className="space-y-5">
          {/* SDM Overview KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Diklat Selesai" value={stats.diklatSelesai} sub={`${stats.diklatTotalJP.toLocaleString('id-ID')} JP akumulatif`} subColor="text-blue-600" icon={BookOpen} iconBg="bg-blue-50" iconColor="text-blue-600" onClick={() => navigate('/diklat')} />
            <StatCard label="Mutasi Bulan Ini" value={stats.mutasiBulanIni} sub={`${stats.mutasiDisetujui} total disetujui`} subColor="text-indigo-600" icon={ClipboardList} iconBg="bg-indigo-50" iconColor="text-indigo-600" onClick={() => navigate('/mutasi')} />
            <StatCard label="CPD SKP Terverifikasi" value={stats.cpdVerified} sub={`Total SKP: ${stats.cpdSkpTotal} poin (${THIS_YEAR})`} subColor="text-purple-600" icon={Star} iconBg="bg-purple-50" iconColor="text-purple-600" />
            <StatCard label="BPJS Kes Aktif" value={stats.bpjsAktifKes} sub={`BPJS TK aktif: ${stats.bpjsAktifTK}`} subColor="text-teal-600" icon={Shield} iconBg="bg-teal-50" iconColor="text-teal-600" onClick={() => navigate('/bpjs')} />
          </div>

          {/* Age + Tenure charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Distribusi Usia Pegawai</h3>
                <p className="text-xs text-gray-500 mt-0.5">Profil usia sumber daya manusia</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={chartAgeDistrib}
                xKey="kel"
                yKey="jml"
                colors={['#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a5f']}
                height={220}
                radius={[6, 6, 0, 0]}
              />
              <div className="mt-3 flex justify-center">
                <div className="flex flex-wrap gap-3 justify-center">
                  {chartAgeDistrib.map((d) => (
                    <div key={d.kel} className="text-center">
                      <p className="text-sm font-semibold text-gray-700">{d.jml}</p>
                      <p className="text-[10px] text-gray-400">{d.kel}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Distribusi Masa Kerja</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pengalaman & senioritas pegawai</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={chartTenureDistrib}
                xKey="masa"
                yKey="jml"
                colors={['#d1fae5', '#6ee7b7', '#34d399', '#10b981', '#059669']}
                height={220}
                radius={[6, 6, 0, 0]}
              />
              <div className="mt-3 flex justify-center">
                <div className="flex flex-wrap gap-3 justify-center">
                  {chartTenureDistrib.map(d => (
                    <div key={d.masa} className="text-center">
                      <p className="text-sm font-semibold text-gray-700">{d.jml}</p>
                      <p className="text-[10px] text-gray-400">{d.masa}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Education + Diklat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Distribusi Pendidikan</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tingkat pendidikan terakhir pegawai</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={chartEduDistrib}
                xKey="pendidikan"
                yKey="jumlah"
                colors={['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81']}
                height={220}
                radius={[6, 6, 0, 0]}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Diklat Per Jenis</h3>
                <p className="text-xs text-gray-500 mt-0.5">{diklat.length} total program diklat</p>
              </div>
              <RechartsWrapper
                type="pie"
                data={chartDiklatJenis}
                dataKey="count"
                nameKey="jenis"
                innerRadius={50}
                outerRadius={85}
                colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']}
                height={220}
              />
            </div>
          </div>

          {/* MCU + Vaksinasi + BPJS compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* MCU */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-800">Hasil MCU Pegawai</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{mcu.length} data MCU tercatat</p>
                </div>
                <button onClick={() => navigate('/k3rs')} className="text-xs text-blue-600 hover:underline">Detail</button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Layak Kerja', value: stats.mcuLayak, total: mcu.length, color: 'bg-green-500', textColor: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Layak dengan Syarat', value: stats.mcuLayakSyarat, total: mcu.length, color: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50' },
                  { label: 'Tidak Layak', value: stats.mcuTidakLayak, total: mcu.length, color: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50' },
                ].map(item => (
                  <div key={item.label} className={`p-3 rounded-lg ${item.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700">{item.label}</span>
                      <span className={`text-sm font-bold ${item.textColor}`}>{item.value}</span>
                    </div>
                    <MiniBar value={item.value} total={item.total || 1} color={item.color} />
                    <p className="text-[10px] text-gray-400 mt-1">{item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}% dari total MCU</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vaksinasi */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-800">Status Vaksinasi</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{vaksinasi.length} data vaksinasi</p>
                </div>
              </div>
              <RechartsWrapper
                type="pie"
                data={[
                  { name: 'Lengkap', value: stats.vakLengkap },
                  { name: 'Sebagian', value: stats.vakSebagian },
                  { name: 'Belum', value: stats.vakBelum },
                ].filter(d => d.value > 0)}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={70}
                colors={['#10b981', '#f59e0b', '#ef4444']}
                height={180}
              />
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                {[
                  { label: 'Lengkap', value: stats.vakLengkap, color: 'text-green-600' },
                  { label: 'Sebagian', value: stats.vakSebagian, color: 'text-amber-600' },
                  { label: 'Belum', value: stats.vakBelum, color: 'text-red-600' },
                ].map(v => (
                  <div key={v.label} className="text-center">
                    <p className={`text-lg font-bold ${v.color}`}>{v.value}</p>
                    <p className="text-[10px] text-gray-400">{v.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Diklat Progress */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-800">Progress Diklat</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Status penyelenggaraan</p>
                </div>
                <button onClick={() => navigate('/diklat')} className="text-xs text-blue-600 hover:underline">Detail</button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Direncanakan', value: stats.diklatDirencanakan, color: 'bg-gray-300', textColor: 'text-gray-600', bg: 'bg-gray-50' },
                  { label: 'Berlangsung', value: stats.diklatBerlangsung, color: 'bg-blue-500', textColor: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Selesai', value: stats.diklatSelesai, color: 'bg-green-500', textColor: 'text-green-600', bg: 'bg-green-50' },
                ].map(d => (
                  <div key={d.label} className={`p-3 rounded-lg ${d.bg} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                      <span className="text-xs text-gray-700">{d.label}</span>
                    </div>
                    <span className={`text-xl font-bold ${d.textColor}`}>{d.value}</span>
                  </div>
                ))}
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs font-semibold text-indigo-800">Total JP Akumulatif</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.diklatTotalJP.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-indigo-500">Jam pelajaran dari diklat selesai</p>
                </div>
              </div>
            </div>
          </div>

          {/* Penghargaan + Mutasi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Penghargaan & Satyalancana</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{penghargaan.length} total penghargaan tercatat</p>
                </div>
                <button onClick={() => navigate('/penghargaan')} className="text-xs text-blue-600 hover:underline">Lihat Semua</button>
              </div>
              <div className="space-y-2">
                {penghargaan.slice(0, 5).map((p, i) => {
                  const pgwi = pegawai.find(pg => pg.id === p.pegawaiId);
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-yellow-50 border border-yellow-100">
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{pgwi?.nama || '-'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{p.jenisPenghargaan}</p>
                      </div>
                      <span className="text-[10px] text-yellow-600 font-medium flex-shrink-0">{p.tanggalPemberian?.slice(0, 7)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Riwayat Mutasi & Rotasi</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{mutasi.length} total data mutasi</p>
                </div>
                <button onClick={() => navigate('/mutasi')} className="text-xs text-blue-600 hover:underline">Lihat Semua</button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Mutasi Internal', value: mutasi.filter(m => m.jenisMutasi === 'Mutasi Internal').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Mutasi Eksternal', value: mutasi.filter(m => m.jenisMutasi === 'Mutasi Eksternal').length, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Rotasi', value: mutasi.filter(m => m.jenisMutasi === 'Rotasi').length, color: 'text-teal-600', bg: 'bg-teal-50' },
                  { label: 'Promosi', value: mutasi.filter(m => m.jenisMutasi?.includes('Promosi')).length, color: 'text-green-600', bg: 'bg-green-50' },
                ].map(item => (
                  <div key={item.label} className={`p-3 rounded-lg ${item.bg} text-center`}>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {mutasi.slice(0, 3).map((m, i) => {
                  const pgwi = pegawai.find(p => p.id === m.pegawaiId);
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded-lg">
                      <UserPlus className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="text-gray-700 flex-1 truncate">{pgwi?.nama || '-'}</span>
                      <span className="text-indigo-600 font-medium flex-shrink-0">{m.jenisMutasi}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: KINERJA & KEPATUHAN                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'kinerja' && (
        <div className="space-y-5">
          {/* Compliance KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <span className={`text-xs font-semibold ${stats.credCompliancePct >= 90 ? 'text-green-600' : stats.credCompliancePct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                  {stats.credCompliancePct}%
                </span>
              </div>
              <p className="text-2xl font-semibold text-gray-800">{stats.strAktif + stats.sipAktif}</p>
              <p className="text-xs text-gray-500 mt-0.5">STR/SIP Aktif</p>
              <p className="text-xs mt-1 text-red-600 font-medium">{stats.lisensiKritis} kritis</p>
            </div>
            <StatCard label="SKP Nilai Rata-rata" value={stats.skpNilaiRataRata} sub={`${skp.length} SKP aktif · ${stats.skpSangatBaik} sangat baik`} subColor="text-indigo-600" icon={Target} iconBg="bg-indigo-50" iconColor="text-indigo-600" onClick={() => navigate('/skp')} />
            <StatCard label="Disiplin Aktif" value={stats.disiplinAktif} sub={`${stats.disiplinBerat} berat · ${stats.disiplinSedang} sedang`} subColor={stats.disiplinBerat > 0 ? 'text-red-600' : 'text-amber-600'} icon={ShieldAlert} iconBg="bg-red-50" iconColor="text-red-600" badge={stats.disiplinBerat > 0 ? { text: 'Ada Kasus Berat', color: 'bg-red-100 text-red-700' } : undefined} onClick={() => navigate('/disiplin')} />
            <StatCard label="Grievance / HI" value={stats.grievanceAktif} sub={`${grievance.length} total pengaduan`} subColor="text-orange-600" icon={AlertTriangle} iconBg="bg-orange-50" iconColor="text-orange-600" onClick={() => navigate('/hubungan-industrial')} />
          </div>

          {/* SKP Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* SKP Distribution Bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Distribusi Predikat SKP</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Penilaian Kinerja Semester 1 / 2026</p>
                </div>
                <button onClick={() => navigate('/skp')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">Detail <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="space-y-4">
                {chartSKPDistrib.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <span className="font-semibold">{item.value} <span className="text-gray-400 font-normal">({skp.length > 0 ? Math.round((item.value / skp.length) * 100) : 0}%)</span></span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: skp.length > 0 ? `${Math.round((item.value / skp.length) * 100)}%` : '0%', backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-indigo-600">{stats.skpNilaiRataRata}</p>
                  <p className="text-[10px] text-indigo-500">Rata-rata Nilai</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-indigo-600">{skp.length}</p>
                  <p className="text-[10px] text-indigo-500">SKP Ditetapkan</p>
                </div>
              </div>
            </div>

            {/* Top SKP Performers */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Top Kinerja SKP 2026</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Pegawai dengan nilai SKP tertinggi</p>
                </div>
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              {topSKPPegawai.length > 0 ? (
                <div className="space-y-3">
                  {topSKPPegawai.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{p.nama}</p>
                        <p className="text-[10px] text-gray-400 truncate">{p.unit}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-indigo-600">{p.nilai}</p>
                        <p className="text-[10px] text-gray-400">{p.predikat}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-sm text-gray-400">Belum ada data SKP</p>
                </div>
              )}
            </div>
          </div>

          {/* STR/SIP Compliance + Discipline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* STR/SIP Matrix */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Status Kredensial STR / SIP</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Kepatuhan lisensi tenaga medis & kesehatan</p>
                </div>
                <button onClick={() => navigate('/credentialing')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">Detail <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'STR Aktif', value: stats.strAktif, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                  { label: 'SIP Aktif', value: stats.sipAktif, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                  { label: 'STR Akan Expired', value: stats.strAkanExpired, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'SIP Akan Expired', value: stats.sipAkanExpired, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'STR Expired', value: stats.strExpired, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                  { label: 'SIP Expired', value: stats.sipExpired, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                ].map(item => (
                  <div key={item.label} className={`p-3 rounded-lg border ${item.bg} ${item.border}`}>
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Compliance Rate</span>
                  <span className={`text-sm font-bold ${stats.credCompliancePct >= 90 ? 'text-green-600' : stats.credCompliancePct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                    {stats.credCompliancePct}%
                  </span>
                </div>
                <MiniBar value={stats.credCompliancePct} total={100} color={stats.credCompliancePct >= 90 ? 'bg-green-500' : stats.credCompliancePct >= 75 ? 'bg-amber-500' : 'bg-red-500'} />
              </div>
            </div>

            {/* Disiplin + K3RS */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Kasus Disiplin & Insiden K3RS</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Rekap kasus aktif dan pelanggaran</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Disiplin ASN ({disiplin.length} total)</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Berat Aktif', value: stats.disiplinBerat, color: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50' },
                      { label: 'Sedang Aktif', value: stats.disiplinSedang, color: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50' },
                      { label: 'Ringan Aktif', value: stats.disiplinRingan, color: 'bg-yellow-400', textColor: 'text-yellow-700', bg: 'bg-yellow-50' },
                    ].map(d => (
                      <div key={d.label} className={`flex items-center justify-between p-2 rounded-lg ${d.bg}`}>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${d.color}`} />
                          <span className="text-[11px] text-gray-600">{d.label}</span>
                        </div>
                        <span className={`text-sm font-bold ${d.textColor}`}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Insiden K3RS ({insidenK3RS.length} total)</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Bulan Ini', value: stats.insidenBulanIni, color: 'bg-pink-500', textColor: 'text-pink-700', bg: 'bg-pink-50' },
                      { label: 'Berat', value: insidenK3RS.filter(i => i.keparahan === 'Berat').length, color: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50' },
                      { label: 'Investigasi', value: insidenK3RS.filter(i => i.statusLaporan === 'Investigasi').length, color: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50' },
                    ].map(d => (
                      <div key={d.label} className={`flex items-center justify-between p-2 rounded-lg ${d.bg}`}>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${d.color}`} />
                          <span className="text-[11px] text-gray-600">{d.label}</span>
                        </div>
                        <span className={`text-sm font-bold ${d.textColor}`}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {chartInsidenK3RS.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Insiden K3RS per Jenis</p>
                  <RechartsWrapper
                    type="bar"
                    data={chartInsidenK3RS}
                    xKey="jenis"
                    yKey="count"
                    colors={['#f43f5e', '#fb7185', '#fda4af', '#ffe4e6']}
                    height={130}
                    radius={[4, 4, 0, 0]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Kenaikan Pangkat + Kontrak */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Kenaikan Pangkat */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Kenaikan Pangkat</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Status usulan periode April & Oktober 2026</p>
                </div>
                <button onClick={() => navigate('/kenaikan-pangkat')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">Detail <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Proses', value: stats.kpProses, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Usul', value: stats.kpUsul, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Selesai 2026', value: stats.kpSelesaiTahunIni, color: 'text-green-600', bg: 'bg-green-50' },
                ].map(k => (
                  <div key={k.label} className={`p-3 rounded-lg ${k.bg} text-center`}>
                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {kenaikanPangkat.filter(k => k.status === 'Proses').slice(0, 4).map((k, i) => {
                  const pgwi = pegawai.find(p => p.id === k.pegawaiId);
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-purple-50 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{pgwi?.nama || '-'}</p>
                        <p className="text-[10px] text-gray-500">{k.golonganLama} → {k.golonganBaru}</p>
                      </div>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{k.periodeUsulan}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kontrak Honorer */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800">Manajemen Kontrak Honorer</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{kontrak.length} total kontrak terdaftar</p>
                </div>
                <button onClick={() => navigate('/kontrak')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">Detail <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Kontrak Aktif', value: stats.kontrakAktif, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Habis ≤ 3 Bln', value: stats.kontrakHabis, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'Diperpanjang', value: kontrak.filter(k => k.statusKontrak === 'Diperpanjang').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Berakhir', value: kontrak.filter(k => k.statusKontrak === 'Berakhir').length, color: 'text-gray-500', bg: 'bg-gray-50' },
                ].map(k => (
                  <div key={k.label} className={`p-3 rounded-lg ${k.bg} text-center`}>
                    <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {kontrak.filter(k => {
                  const exp = new Date(k.tanggalSelesai || '9999-01-01');
                  const diff = (exp.getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24 * 30);
                  return diff <= 3 && diff > 0;
                }).slice(0, 3).map((k, i) => {
                  const pgwi = pegawai.find(p => p.id === k.pegawaiId);
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                      <FileSignature className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{pgwi?.nama || '-'}</p>
                        <p className="text-[10px] text-gray-500">{k.jenisKontrak} · {k.jabatanKontrak || '-'}</p>
                      </div>
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex-shrink-0">{k.tanggalSelesai}</span>
                    </div>
                  );
                })}
                {stats.kontrakHabis === 0 && (
                  <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-xs text-green-700">Tidak ada kontrak yang segera berakhir</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
