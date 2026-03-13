/**
 * hospitalDashboardData.ts
 * Mock data for Hospital role-based dashboards — adapted to HCMS context.
 * All revenue figures in IDR (Rupiah).
 */

// ─── Financial Data ──────────────────────────────────────────────────────────
export const revenueVsCost = [
  { bulan: 'Okt 25', revenue: 28_500_000_000, cost: 24_200_000_000 },
  { bulan: 'Nov 25', revenue: 29_100_000_000, cost: 24_800_000_000 },
  { bulan: 'Des 25', revenue: 31_200_000_000, cost: 26_500_000_000 },
  { bulan: 'Jan 26', revenue: 27_800_000_000, cost: 23_900_000_000 },
  { bulan: 'Feb 26', revenue: 30_400_000_000, cost: 25_600_000_000 },
  { bulan: 'Mar 26', revenue: 31_800_000_000, cost: 26_100_000_000 },
];

export const revenueByService = [
  { service: 'Rawat Inap', value: 12_400_000_000 },
  { service: 'Rawat Jalan', value: 9_800_000_000 },
  { service: 'IGD', value: 4_200_000_000 },
  { service: 'MCU', value: 2_100_000_000 },
  { service: 'Penunjang', value: 3_300_000_000 },
];

export const costBreakdown = [
  { kategori: 'SDM / Personalia', value: 12_600_000_000 },
  { kategori: 'Obat & BMHP', value: 5_800_000_000 },
  { kategori: 'Alat Kesehatan', value: 3_200_000_000 },
  { kategori: 'Operasional', value: 2_900_000_000 },
  { kategori: 'Utilitas', value: 1_600_000_000 },
];

export const profitByDept = [
  { dept: 'Bedah', margin: 18.2 },
  { dept: 'Penyakit Dalam', margin: 14.5 },
  { dept: 'Anak', margin: 12.8 },
  { dept: 'Obgyn', margin: 11.3 },
  { dept: 'Mata', margin: 16.7 },
  { dept: 'THT', margin: 13.1 },
  { dept: 'Saraf', margin: 10.4 },
  { dept: 'Jantung', margin: 15.9 },
];

export const bpjsVsNonBPJS = [
  { bulan: 'Okt 25', BPJS: 18_200_000_000, 'Non-BPJS': 10_300_000_000 },
  { bulan: 'Nov 25', BPJS: 18_900_000_000, 'Non-BPJS': 10_200_000_000 },
  { bulan: 'Des 25', BPJS: 20_100_000_000, 'Non-BPJS': 11_100_000_000 },
  { bulan: 'Jan 26', BPJS: 17_800_000_000, 'Non-BPJS': 10_000_000_000 },
  { bulan: 'Feb 26', BPJS: 19_600_000_000, 'Non-BPJS': 10_800_000_000 },
  { bulan: 'Mar 26', BPJS: 20_500_000_000, 'Non-BPJS': 11_300_000_000 },
];

export const bpjsTariffGap = [
  { kategori: 'Bedah Mayor', tarif: 15_000_000, actual: 18_200_000 },
  { kategori: 'Bedah Minor', tarif: 6_500_000, actual: 7_100_000 },
  { kategori: 'Rawat Inap ICU', tarif: 8_000_000, actual: 9_500_000 },
  { kategori: 'Rawat Inap Biasa', tarif: 3_200_000, actual: 3_800_000 },
  { kategori: 'Rawat Jalan Sp.', tarif: 450_000, actual: 520_000 },
];

// ─── Claim Data ──────────────────────────────────────────────────────────────
export const claimOverview = {
  totalSubmitted: 4_280,
  totalApproved: 3_842,
  totalRejected: 438,
  pendingAmount: 8_450_000_000,
  avgDaysToPayment: 42,
  acceptanceRate: 89.8,
};

export const claimTrend = [
  { bulan: 'Okt 25', submitted: 680, approved: 612, rejected: 68 },
  { bulan: 'Nov 25', submitted: 710, approved: 638, rejected: 72 },
  { bulan: 'Des 25', submitted: 750, approved: 668, rejected: 82 },
  { bulan: 'Jan 26', submitted: 690, approved: 619, rejected: 71 },
  { bulan: 'Feb 26', submitted: 720, approved: 645, rejected: 75 },
  { bulan: 'Mar 26', submitted: 730, approved: 660, rejected: 70 },
];

export const rejectionReasons = [
  { reason: 'Kode Diagnosis Tidak Sesuai', count: 128 },
  { reason: 'Dokumen Tidak Lengkap', count: 96 },
  { reason: 'Duplikasi Klaim', count: 72 },
  { reason: 'Melebihi Tarif INA-CBG', count: 64 },
  { reason: 'Prosedur Tidak Dijamin', count: 48 },
  { reason: 'Lainnya', count: 30 },
];

export const claimAgingBuckets = [
  { bucket: '0–30 hari', count: 1_240, amount: 2_100_000_000 },
  { bucket: '31–60 hari', count: 860, amount: 2_800_000_000 },
  { bucket: '61–90 hari', count: 420, amount: 1_950_000_000 },
  { bucket: '> 90 hari', count: 180, amount: 1_600_000_000 },
];

// ─── Clinical Data ───────────────────────────────────────────────────────────
export const clinicalKPI = {
  bor: 78.5,
  alos: 4.2,
  bto: 62,
  toi: 1.8,
  ndr: 2.1,
  gdr: 3.8,
  readmissionRate: 4.2,
  caseMixIndex: 1.14,
  mortalityRate: 1.8,
  surgerySuccessRate: 97.2,
  icuUtilization: 82.4,
  erWaitingTime: 18,
};

export const patientVolumeTrend = [
  { bulan: 'Okt 25', rawatInap: 1_820, rawatJalan: 12_400, igd: 3_200 },
  { bulan: 'Nov 25', rawatInap: 1_780, rawatJalan: 12_100, igd: 3_050 },
  { bulan: 'Des 25', rawatInap: 1_950, rawatJalan: 11_800, igd: 3_400 },
  { bulan: 'Jan 26', rawatInap: 1_700, rawatJalan: 12_600, igd: 3_100 },
  { bulan: 'Feb 26', rawatInap: 1_850, rawatJalan: 13_200, igd: 3_250 },
  { bulan: 'Mar 26', rawatInap: 1_900, rawatJalan: 13_500, igd: 3_350 },
];

export const topDiagnoses = [
  { diagnosis: 'Diabetes Mellitus', count: 420 },
  { diagnosis: 'Hipertensi', count: 380 },
  { diagnosis: 'ISPA', count: 340 },
  { diagnosis: 'GEA', count: 290 },
  { diagnosis: 'Typhoid', count: 260 },
  { diagnosis: 'Stroke', count: 210 },
  { diagnosis: 'CHF', count: 185 },
  { diagnosis: 'Fraktur', count: 160 },
];

export const borByWard = [
  { ward: 'ICU', bor: 82.4 },
  { ward: 'NICU', bor: 75.0 },
  { ward: 'Bedah', bor: 85.2 },
  { ward: 'Penyakit Dalam', bor: 88.1 },
  { ward: 'Anak', bor: 72.3 },
  { ward: 'Obgyn', bor: 79.6 },
  { ward: 'VIP', bor: 65.4 },
  { ward: 'Kelas III', bor: 91.2 },
];

export const doctorProductivity = [
  { nama: 'dr. Imam Ghozali, Sp.An.', pasien: 148, prosedur: 62 },
  { nama: 'dr. Surya P. Dewi, MARS', pasien: 132, prosedur: 45 },
  { nama: 'dr. Chandra, Sp.PD', pasien: 186, prosedur: 38 },
  { nama: 'dr. Rina S., Sp.OG', pasien: 164, prosedur: 72 },
  { nama: 'dr. Budi, Sp.B', pasien: 142, prosedur: 85 },
  { nama: 'dr. Ahmad, Sp.A', pasien: 178, prosedur: 28 },
];

// ─── Operations Data ─────────────────────────────────────────────────────────
export const patientJourneyFunnel = [
  { stage: 'Registrasi IGD', count: 3_350 },
  { stage: 'Triase', count: 3_280 },
  { stage: 'Pemeriksaan', count: 3_100 },
  { stage: 'Rawat Inap', count: 1_900 },
  { stage: 'Discharge', count: 1_820 },
];

export const waitingTimeByUnit = [
  { unit: 'IGD', menit: 18 },
  { unit: 'Poli Umum', menit: 25 },
  { unit: 'Poli Spesialis', menit: 35 },
  { unit: 'Laboratorium', menit: 42 },
  { unit: 'Radiologi', menit: 28 },
  { unit: 'Farmasi', menit: 22 },
];

export const orUtilization = [
  { bulan: 'Okt 25', persen: 72.5 },
  { bulan: 'Nov 25', persen: 68.3 },
  { bulan: 'Des 25', persen: 78.1 },
  { bulan: 'Jan 26', persen: 70.2 },
  { bulan: 'Feb 26', persen: 74.8 },
  { bulan: 'Mar 26', persen: 76.4 },
];

export const labTurnaroundTime = [
  { jenis: 'Hematologi', target: 60, actual: 52 },
  { jenis: 'Kimia Klinis', target: 120, actual: 105 },
  { jenis: 'Urinalisis', target: 45, actual: 38 },
  { jenis: 'Kultur', target: 4320, actual: 4560 },
  { jenis: 'Serologi', target: 180, actual: 165 },
];

export const dischargeDelayCauses = [
  { cause: 'Menunggu Obat Pulang', count: 142 },
  { cause: 'Resume Medis Belum Selesai', count: 98 },
  { cause: 'Verifikasi BPJS', count: 86 },
  { cause: 'Menunggu Hasil Lab', count: 64 },
  { cause: 'Administrasi Keuangan', count: 52 },
];

export const equipmentUsage = [
  { alat: 'CT-Scan', persen: 78.2 },
  { alat: 'MRI', persen: 65.4 },
  { alat: 'USG', persen: 82.1 },
  { alat: 'Rontgen', persen: 88.5 },
  { alat: 'Endoskopi', persen: 56.3 },
];

// ─── Quality / GRC Data ──────────────────────────────────────────────────────
export const accreditationScore = {
  overall: 87.4,
  pokja: [
    { nama: 'TKRS', skor: 92.1 },
    { nama: 'PMKP', skor: 88.5 },
    { nama: 'PPI', skor: 85.2 },
    { nama: 'MIRM', skor: 84.7 },
    { nama: 'SKP', skor: 90.3 },
    { nama: 'HPK', skor: 86.8 },
    { nama: 'PAP', skor: 83.9 },
    { nama: 'PAB', skor: 89.1 },
  ],
};

export const incidentTrend = [
  { bulan: 'Okt 25', sentinel: 0, ktd: 3, knc: 8, kpc: 12 },
  { bulan: 'Nov 25', sentinel: 0, ktd: 2, knc: 6, kpc: 10 },
  { bulan: 'Des 25', sentinel: 1, ktd: 4, knc: 7, kpc: 14 },
  { bulan: 'Jan 26', sentinel: 0, ktd: 2, knc: 5, kpc: 9 },
  { bulan: 'Feb 26', sentinel: 0, ktd: 3, knc: 6, kpc: 11 },
  { bulan: 'Mar 26', sentinel: 0, ktd: 1, knc: 4, kpc: 8 },
];

export const auditFindings = [
  { kategori: 'Terbuka', count: 12, severity: 'high' },
  { kategori: 'Dalam Proses', count: 8, severity: 'medium' },
  { kategori: 'Ditutup', count: 34, severity: 'low' },
];

export const riskHeatmap = [
  { risk: 'Keterlambatan Klaim BPJS', likelihood: 4, impact: 4, level: 'Tinggi' },
  { risk: 'Kekosongan Obat Esensial', likelihood: 3, impact: 5, level: 'Tinggi' },
  { risk: 'Infeksi Nosokomial', likelihood: 2, impact: 5, level: 'Tinggi' },
  { risk: 'Kekurangan Tenaga Spesialis', likelihood: 3, impact: 4, level: 'Sedang' },
  { risk: 'Downtime SIMRS', likelihood: 3, impact: 3, level: 'Sedang' },
  { risk: 'Keluhan Pasien Meningkat', likelihood: 2, impact: 3, level: 'Rendah' },
];

export const correctiveActionStatus = [
  { status: 'Belum Dimulai', count: 5 },
  { status: 'Berjalan', count: 8 },
  { status: 'Selesai', count: 21 },
  { status: 'Overdue', count: 3 },
];

// ─── Risk Indicators (Traffic Light) ─────────────────────────────────────────
export const riskIndicators = [
  { label: 'BOR', value: '78.5%', target: '75–85%', status: 'green' as const },
  { label: 'BPJS Claim Aging > 90 hari', value: '180 klaim', target: '< 100', status: 'red' as const },
  { label: 'Tingkat Kepatuhan SPO', value: '87.4%', target: '> 85%', status: 'green' as const },
  { label: 'Insiden Sentinel YTD', value: '1', target: '0', status: 'yellow' as const },
  { label: 'Vacancy Rate Spesialis', value: '12%', target: '< 10%', status: 'yellow' as const },
];

// ─── Patient Satisfaction ────────────────────────────────────────────────────
export const patientSatisfaction = [
  { bulan: 'Okt 25', skor: 82.3 },
  { bulan: 'Nov 25', skor: 83.1 },
  { bulan: 'Des 25', skor: 81.8 },
  { bulan: 'Jan 26', skor: 84.2 },
  { bulan: 'Feb 26', skor: 85.0 },
  { bulan: 'Mar 26', skor: 85.6 },
];

// ─── Cash Flow ───────────────────────────────────────────────────────────────
export const cashFlowData = [
  { bulan: 'Okt 25', cashIn: 26_200_000_000, cashOut: 23_800_000_000 },
  { bulan: 'Nov 25', cashIn: 27_500_000_000, cashOut: 24_500_000_000 },
  { bulan: 'Des 25', cashIn: 29_800_000_000, cashOut: 26_200_000_000 },
  { bulan: 'Jan 26', cashIn: 25_600_000_000, cashOut: 23_400_000_000 },
  { bulan: 'Feb 26', cashIn: 28_100_000_000, cashOut: 25_100_000_000 },
  { bulan: 'Mar 26', cashIn: 29_400_000_000, cashOut: 25_800_000_000 },
];

export const costPerPatient = [
  { bulan: 'Okt 25', biaya: 4_250_000 },
  { bulan: 'Nov 25', biaya: 4_380_000 },
  { bulan: 'Des 25', biaya: 4_520_000 },
  { bulan: 'Jan 26', biaya: 4_180_000 },
  { bulan: 'Feb 26', biaya: 4_310_000 },
  { bulan: 'Mar 26', biaya: 4_420_000 },
];

// ─── BPJS Coding & Documentation ─────────────────────────────────────────────
export const codingAccuracy = {
  overall: 91.2,
  byMonth: [
    { bulan: 'Okt 25', akurasi: 89.5 },
    { bulan: 'Nov 25', akurasi: 90.1 },
    { bulan: 'Des 25', akurasi: 88.8 },
    { bulan: 'Jan 26', akurasi: 91.5 },
    { bulan: 'Feb 26', akurasi: 92.0 },
    { bulan: 'Mar 26', akurasi: 91.2 },
  ],
};

export const missingDocRate = [
  { jenis: 'Resume Medis', persen: 8.2 },
  { jenis: 'Informed Consent', persen: 4.5 },
  { jenis: 'Laporan Operasi', persen: 6.1 },
  { jenis: 'Catatan Keperawatan', persen: 3.8 },
  { jenis: 'Hasil Lab', persen: 2.1 },
];

// ─── Utility formatters ─────────────────────────────────────────────────────
export function fmtRpShort(n: number): string {
  if (n >= 1_000_000_000_000) return `Rp ${(n / 1_000_000_000_000).toFixed(1)} T`;
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)} Jt`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}
