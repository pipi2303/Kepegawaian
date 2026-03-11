import type {
  BSCObjective, DepartmentScorecard, OKRObjective,
  PerformanceReview, IntegrationWeights, KPIDefinition,
} from '../types';

// ─── BSC OBJECTIVES ──────────────────────────────────────────────────────────
export const bscObjectives: BSCObjective[] = [
  // Financial
  { id: 'bsc-f01', perspektif: 'Financial', departmentId: 'org', title: 'Pertumbuhan Pendapatan RS', kpi: 'Realisasi Pendapatan vs Target', target: 100, actual: 87, unit: '%', weight: 30, period: '2026', status: 'At Risk' },
  { id: 'bsc-f02', perspektif: 'Financial', departmentId: 'org', title: 'Efisiensi Biaya Operasional', kpi: 'Rasio Biaya vs Pendapatan', target: 75, actual: 72, unit: '%', weight: 25, period: '2026', status: 'On Track' },
  { id: 'bsc-f03', perspektif: 'Financial', departmentId: 'org', title: 'Bed Occupancy Rate (BOR)', kpi: 'BOR Rawat Inap', target: 80, actual: 76, unit: '%', weight: 25, period: '2026', status: 'At Risk' },
  { id: 'bsc-f04', perspektif: 'Financial', departmentId: 'org', title: 'Cost Recovery Rate (CRR)', kpi: 'CRR RSUD', target: 95, actual: 91, unit: '%', weight: 20, period: '2026', status: 'On Track' },

  // Customer
  { id: 'bsc-c01', perspektif: 'Customer', departmentId: 'org', title: 'Indeks Kepuasan Pasien', kpi: 'SKM Nasional', target: 85, actual: 88, unit: 'skor', weight: 35, period: '2026', status: 'Achieved' },
  { id: 'bsc-c02', perspektif: 'Customer', departmentId: 'org', title: 'Waktu Tunggu IGD', kpi: 'Rata-rata Waktu Triage s.d. Penanganan', target: 10, actual: 12, unit: 'menit', weight: 25, period: '2026', status: 'Behind' },
  { id: 'bsc-c03', perspektif: 'Customer', departmentId: 'org', title: 'Tingkat Re-admisi', kpi: 'Pasien Dirawat Ulang < 30 hari', target: 5, actual: 4.2, unit: '%', weight: 20, period: '2026', status: 'Achieved' },
  { id: 'bsc-c04', perspektif: 'Customer', departmentId: 'org', title: 'Komplain Pasien Terselesaikan', kpi: '% Komplain Terselesaikan ≤ 3 hari', target: 95, actual: 92, unit: '%', weight: 20, period: '2026', status: 'On Track' },

  // Internal Process
  { id: 'bsc-i01', perspektif: 'Internal Process', departmentId: 'org', title: 'Waktu Proses Rekrutmen', kpi: 'Hari dari Loker s.d. SK', target: 30, actual: 38, unit: 'hari', weight: 20, period: '2026', status: 'Behind' },
  { id: 'bsc-i02', perspektif: 'Internal Process', departmentId: 'org', title: 'Ketersediaan Obat Esensial', kpi: 'Ketersediaan Obat Formularium', target: 95, actual: 96.5, unit: '%', weight: 25, period: '2026', status: 'Achieved' },
  { id: 'bsc-i03', perspektif: 'Internal Process', departmentId: 'org', title: 'Akurasi Laporan Keuangan', kpi: '% Laporan Tepat Waktu & Akurat', target: 100, actual: 98, unit: '%', weight: 20, period: '2026', status: 'On Track' },
  { id: 'bsc-i04', perspektif: 'Internal Process', departmentId: 'org', title: 'Average Length of Stay (ALOS)', kpi: 'ALOS Rawat Inap', target: 5, actual: 5.8, unit: 'hari', weight: 20, period: '2026', status: 'At Risk' },
  { id: 'bsc-i05', perspektif: 'Internal Process', departmentId: 'org', title: 'Insiden K3RS Zero Accident', kpi: 'Jumlah KTD (Kejadian Tidak Diharapkan)', target: 0, actual: 2, unit: 'kasus', weight: 15, period: '2026', status: 'Behind' },

  // Learning & Growth
  { id: 'bsc-l01', perspektif: 'Learning & Growth', departmentId: 'org', title: 'Partisipasi Diklat Pegawai', kpi: '% Pegawai Mengikuti ≥1 Diklat/Tahun', target: 80, actual: 74, unit: '%', weight: 30, period: '2026', status: 'At Risk' },
  { id: 'bsc-l02', perspektif: 'Learning & Growth', departmentId: 'org', title: 'Skor Kompetensi Rata-rata', kpi: 'Nilai SKP Rata-rata Seluruh Pegawai', target: 80, actual: 78.5, unit: 'poin', weight: 25, period: '2026', status: 'On Track' },
  { id: 'bsc-l03', perspektif: 'Learning & Growth', departmentId: 'org', title: 'Tingkat Retensi Pegawai', kpi: '% Pegawai Tidak Mengundurkan Diri', target: 92, actual: 94.2, unit: '%', weight: 25, period: '2026', status: 'Achieved' },
  { id: 'bsc-l04', perspektif: 'Learning & Growth', departmentId: 'org', title: 'Indeks Keterlibatan Pegawai', kpi: 'Employee Engagement Survey Score', target: 75, actual: 71, unit: 'skor', weight: 20, period: '2026', status: 'At Risk' },
];

// ─── DEPARTMENT SCORECARDS ────────────────────────────────────────────────────
export const departmentScorecards: DepartmentScorecard[] = [
  { id: 'dept-01', name: 'Direktorat SDM & Umum', headName: 'dr. Imam Ghozali, Sp.An.', score: 79, financialScore: 78, customerScore: 82, internalScore: 75, learningScore: 81, trend: [71, 73, 75, 76, 78, 79] },
  { id: 'dept-02', name: 'Direktorat Keuangan', headName: 'Wahyu Setiabudi, SE., MM.', score: 85, financialScore: 91, customerScore: 80, internalScore: 87, learningScore: 82, trend: [79, 80, 82, 83, 84, 85] },
  { id: 'dept-03', name: 'Bidang Pelayanan Medis', headName: 'dr. Sulistyo Wibowo, Sp.PD.', score: 82, financialScore: 80, customerScore: 88, internalScore: 79, learningScore: 81, trend: [74, 76, 78, 80, 81, 82] },
  { id: 'dept-04', name: 'Instalasi Rawat Inap', headName: 'Ns. Sri Wahyuni, S.Kep.', score: 77, financialScore: 75, customerScore: 82, internalScore: 74, learningScore: 77, trend: [68, 70, 72, 74, 76, 77] },
  { id: 'dept-05', name: 'Instalasi Gawat Darurat', headName: 'dr. Reza Pratama, Sp.EM.', score: 74, financialScore: 72, customerScore: 71, internalScore: 76, learningScore: 77, trend: [65, 67, 69, 71, 72, 74] },
  { id: 'dept-06', name: 'Instalasi Rawat Jalan', headName: 'dr. Nina Kartika, Sp.A.', score: 83, financialScore: 82, customerScore: 87, internalScore: 80, learningScore: 83, trend: [75, 77, 79, 81, 82, 83] },
  { id: 'dept-07', name: 'Instalasi Farmasi', headName: 'Apt. Dian Permata, S.Farm.', score: 91, financialScore: 88, customerScore: 93, internalScore: 94, learningScore: 89, trend: [85, 87, 88, 89, 90, 91] },
  { id: 'dept-08', name: 'Instalasi Laboratorium', headName: 'dr. Hendra Kusuma, Sp.PK.', score: 88, financialScore: 86, customerScore: 90, internalScore: 89, learningScore: 87, trend: [81, 83, 84, 85, 87, 88] },
  { id: 'dept-09', name: 'Instalasi Radiologi', headName: 'dr. Rina Agustina, Sp.Rad.', score: 86, financialScore: 85, customerScore: 88, internalScore: 85, learningScore: 86, trend: [79, 81, 82, 83, 85, 86] },
  { id: 'dept-10', name: 'Instalasi Gizi', headName: 'Siti Nurjanah, S.Gz.', score: 80, financialScore: 78, customerScore: 83, internalScore: 79, learningScore: 80, trend: [72, 74, 76, 77, 79, 80] },
];

// ─── OKR DATA ─────────────────────────────────────────────────────────────────
export const okrObjectives: OKRObjective[] = [
  // ── LEVEL ORGANISASI ─────────────────────────────────────────────────────────
  {
    id: 'okr-org-01', level: 'Organisasi', ownerId: 'org', ownerName: 'Rumah Sakit',
    title: 'Menjadi RS Rujukan Unggulan Provinsi Lampung Tahun 2026',
    description: 'Mencapai standar pelayanan RS tipe A dengan kepuasan pasien & keuangan sehat.',
    period: 'Q1–Q4 2026', status: 'Aktif', bscLink: 'Customer',
    keyResults: [
      { id: 'kr-01', objectiveId: 'okr-org-01', title: 'Indeks Kepuasan Pasien ≥ 88', startValue: 84, targetValue: 88, currentValue: 88, unit: 'skor', confidence: 'Tinggi', checkIns: [{ id: 'ci-01', date: '2026-01-31', value: 85, note: 'Naik dari baseline', createdBy: 'Admin' }, { id: 'ci-02', date: '2026-02-28', value: 87, note: 'Masih dalam jalur', createdBy: 'Admin' }, { id: 'ci-03', date: '2026-03-09', value: 88, note: 'Target tercapai!', createdBy: 'Admin' }] },
      { id: 'kr-02', objectiveId: 'okr-org-01', title: 'BOR Rawat Inap ≥ 80%', startValue: 72, targetValue: 80, currentValue: 76, unit: '%', confidence: 'Sedang', checkIns: [{ id: 'ci-04', date: '2026-01-31', value: 73, note: 'Mulai meningkat', createdBy: 'Admin' }, { id: 'ci-05', date: '2026-02-28', value: 75, note: 'Progress stabil', createdBy: 'Admin' }] },
      { id: 'kr-03', objectiveId: 'okr-org-01', title: 'Cost Recovery Rate ≥ 95%', startValue: 89, targetValue: 95, currentValue: 91, unit: '%', confidence: 'Sedang', checkIns: [{ id: 'ci-06', date: '2026-02-28', value: 90, note: 'Perlu akselerasi', createdBy: 'Admin' }] },
    ],
  },
  {
    id: 'okr-org-02', level: 'Organisasi', ownerId: 'org', ownerName: 'Rumah Sakit',
    title: 'Membangun Budaya Kinerja Berbasis Data di Seluruh Unit',
    description: 'Seluruh unit memiliki dashboard kinerja dan melakukan check-in OKR mingguan.',
    period: 'Q1–Q4 2026', status: 'Aktif', bscLink: 'Learning & Growth',
    keyResults: [
      { id: 'kr-04', objectiveId: 'okr-org-02', title: '≥ 80% Pegawai Ikut Diklat Tahunan', startValue: 65, targetValue: 80, currentValue: 74, unit: '%', confidence: 'Sedang', checkIns: [{ id: 'ci-07', date: '2026-03-01', value: 74, note: 'Masih 6% gap', createdBy: 'Admin' }] },
      { id: 'kr-05', objectiveId: 'okr-org-02', title: 'Employee Engagement Score ≥ 75', startValue: 68, targetValue: 75, currentValue: 71, unit: 'skor', confidence: 'Rendah', checkIns: [{ id: 'ci-08', date: '2026-02-28', value: 71, note: 'Perlu intervensi HR', createdBy: 'Admin' }] },
      { id: 'kr-06', objectiveId: 'okr-org-02', title: '10 Divisi Aktif Check-in OKR', startValue: 0, targetValue: 10, currentValue: 7, unit: 'divisi', confidence: 'Tinggi', checkIns: [{ id: 'ci-09', date: '2026-03-01', value: 7, note: '3 divisi masih onboarding', createdBy: 'Admin' }] },
    ],
  },
  {
    id: 'okr-org-03', level: 'Organisasi', ownerId: 'org', ownerName: 'Rumah Sakit',
    title: 'Zero Accident & Keselamatan Pasien Terdepan',
    description: 'Tidak ada KTD kategori berat dan insiden K3RS dengan injury.',
    period: 'Q1–Q4 2026', status: 'Aktif', bscLink: 'Internal Process',
    keyResults: [
      { id: 'kr-07', objectiveId: 'okr-org-03', title: 'KTD Berat = 0 Kasus', startValue: 3, targetValue: 0, currentValue: 2, unit: 'kasus', confidence: 'Sedang', checkIns: [{ id: 'ci-10', date: '2026-03-01', value: 2, note: '1 kasus di IGD sedang diinvestigasi', createdBy: 'Admin' }] },
      { id: 'kr-08', objectiveId: 'okr-org-03', title: 'Ketersediaan Obat Esensial ≥ 95%', startValue: 90, targetValue: 95, currentValue: 96.5, unit: '%', confidence: 'Tinggi', checkIns: [{ id: 'ci-11', date: '2026-03-01', value: 96.5, note: 'Melebihi target!', createdBy: 'Admin' }] },
    ],
  },

  // ── LEVEL DIVISI ─────────────────────────────────────────────────────────────
  {
    id: 'okr-div-01', level: 'Divisi', ownerId: 'dept-01', ownerName: 'Direktorat SDM & Umum',
    departmentId: 'dept-01', title: 'Mempersingkat Waktu Proses Rekrutmen Pegawai',
    description: 'Mengurangi waktu dari publikasi lowongan hingga SK pengangkatan.',
    period: 'Q1 2026', status: 'Aktif', parentId: 'okr-org-02', bscLink: 'Internal Process',
    keyResults: [
      { id: 'kr-09', objectiveId: 'okr-div-01', title: 'Waktu Rekrutmen Rata-rata ≤ 30 Hari', startValue: 45, targetValue: 30, currentValue: 38, unit: 'hari', confidence: 'Sedang', checkIns: [{ id: 'ci-12', date: '2026-03-01', value: 38, note: 'Perbaikan proses administrasi sedang berjalan', createdBy: 'Kabag SDM' }] },
      { id: 'kr-10', objectiveId: 'okr-div-01', title: '100% Formasi Terisi di Q1', startValue: 70, targetValue: 100, currentValue: 85, unit: '%', confidence: 'Sedang', checkIns: [] },
      { id: 'kr-11', objectiveId: 'okr-div-01', title: '3 SOP Rekrutmen Diperbarui', startValue: 0, targetValue: 3, currentValue: 2, unit: 'SOP', confidence: 'Tinggi', checkIns: [{ id: 'ci-13', date: '2026-02-15', value: 2, note: 'SOP 1 & 2 sudah berlaku', createdBy: 'Kabag SDM' }] },
    ],
  },
  {
    id: 'okr-div-02', level: 'Divisi', ownerId: 'dept-05', ownerName: 'Instalasi Gawat Darurat',
    departmentId: 'dept-05', title: 'Mempercepat Respons Penanganan Pasien IGD',
    description: 'Menurunkan waktu tunggu triage dan penanganan awal di IGD.',
    period: 'Q1 2026', status: 'Aktif', parentId: 'okr-org-01', bscLink: 'Customer',
    keyResults: [
      { id: 'kr-12', objectiveId: 'okr-div-02', title: 'Waktu Triage → Penanganan ≤ 10 Menit', startValue: 18, targetValue: 10, currentValue: 12, unit: 'menit', confidence: 'Sedang', checkIns: [{ id: 'ci-14', date: '2026-03-01', value: 12, note: 'Turun dari 15 mnt setelah pelatihan', createdBy: 'Ka. IGD' }] },
      { id: 'kr-13', objectiveId: 'okr-div-02', title: 'Door-to-EKG ≤ 10 Menit (Kasus Jantung)', startValue: 15, targetValue: 10, currentValue: 11, unit: 'menit', confidence: 'Tinggi', checkIns: [] },
    ],
  },
  {
    id: 'okr-div-03', level: 'Divisi', ownerId: 'dept-07', ownerName: 'Instalasi Farmasi',
    departmentId: 'dept-07', title: 'Menjamin Ketersediaan & Efisiensi Obat',
    description: 'Memastikan seluruh obat formularium tersedia & meminimalkan pemborosan.',
    period: 'Q1 2026', status: 'Aktif', parentId: 'okr-org-03', bscLink: 'Internal Process',
    keyResults: [
      { id: 'kr-14', objectiveId: 'okr-div-03', title: 'Ketersediaan Obat Formularium ≥ 97%', startValue: 93, targetValue: 97, currentValue: 96.5, unit: '%', confidence: 'Tinggi', checkIns: [{ id: 'ci-15', date: '2026-03-01', value: 96.5, note: 'Hampir mencapai target', createdBy: 'Ka. Farmasi' }] },
      { id: 'kr-15', objectiveId: 'okr-div-03', title: 'Waste/Expired Drug < 1% dari Total', startValue: 2.1, targetValue: 1, currentValue: 1.3, unit: '%', confidence: 'Sedang', checkIns: [] },
    ],
  },

  // ── LEVEL TIM ────────────────────────────────────────────────────────────────
  {
    id: 'okr-tim-01', level: 'Tim', ownerId: 'tim-rekrutmen', ownerName: 'Tim Rekrutmen SDM',
    departmentId: 'dept-01', title: 'Digitalisasi Proses Seleksi Pegawai',
    description: 'Mengimplementasikan e-selection untuk mempercepat dan transparansi proses.',
    period: 'Q1 2026', status: 'Aktif', parentId: 'okr-div-01', bscLink: 'Internal Process',
    keyResults: [
      { id: 'kr-16', objectiveId: 'okr-tim-01', title: '100% Soal Ujian Dikerjakan Online', startValue: 0, targetValue: 100, currentValue: 60, unit: '%', confidence: 'Sedang', checkIns: [] },
      { id: 'kr-17', objectiveId: 'okr-tim-01', title: '1 Platform e-Rekrutmen Aktif', startValue: 0, targetValue: 1, currentValue: 1, unit: 'platform', confidence: 'Tinggi', checkIns: [{ id: 'ci-16', date: '2026-02-01', value: 1, note: 'Platform SIAP-SDM diluncurkan', createdBy: 'Tim IT' }] },
    ],
  },

  // ── LEVEL INDIVIDU ───────────────────────────────────────────────────────────
  {
    id: 'okr-ind-01', level: 'Individu', ownerId: 'P001', ownerName: 'dr. Imam Ghozali, Sp.An., M.Kes.',
    departmentId: 'dept-01', title: 'Meningkatkan Kapasitas Kepemimpinan Strategis',
    description: 'Memimpin transformasi kinerja RS melalui implementasi BSC & OKR.',
    period: 'Q1 2026', status: 'Aktif', parentId: 'okr-org-02', bscLink: 'Learning & Growth',
    keyResults: [
      { id: 'kr-18', objectiveId: 'okr-ind-01', title: '4 Rapat Koordinasi Kinerja/Kuartal', startValue: 0, targetValue: 4, currentValue: 3, unit: 'rapat', confidence: 'Tinggi', checkIns: [] },
      { id: 'kr-19', objectiveId: 'okr-ind-01', title: '1 Laporan BSC Kuartalan Terbit', startValue: 0, targetValue: 1, currentValue: 1, unit: 'laporan', confidence: 'Tinggi', checkIns: [{ id: 'ci-17', date: '2026-03-09', value: 1, note: 'Laporan Q1 telah disiapkan', createdBy: 'Direktur' }] },
    ],
  },
  {
    id: 'okr-ind-02', level: 'Individu', ownerId: 'P003', ownerName: 'Ns. Sri Wahyuni, S.Kep., M.Kep.',
    departmentId: 'dept-04', title: 'Meningkatkan Mutu Asuhan Keperawatan Rawat Inap',
    description: 'Memastikan dokumentasi asuhan keperawatan lengkap & standar akreditasi.',
    period: 'Q1 2026', status: 'Aktif', parentId: 'okr-div-01', bscLink: 'Customer',
    keyResults: [
      { id: 'kr-20', objectiveId: 'okr-ind-02', title: '100% Berkas Askep Lengkap', startValue: 78, targetValue: 100, currentValue: 92, unit: '%', confidence: 'Sedang', checkIns: [{ id: 'ci-18', date: '2026-03-01', value: 92, note: 'Audit internal menunjukkan peningkatan', createdBy: 'Karu' }] },
      { id: 'kr-21', objectiveId: 'okr-ind-02', title: 'Skor Pelatihan Asuhan ≥ 80', startValue: 70, targetValue: 80, currentValue: 82, unit: 'poin', confidence: 'Tinggi', checkIns: [] },
    ],
  },
  {
    id: 'okr-ind-03', level: 'Individu', ownerId: 'P005', ownerName: 'Apt. Dian Permata, S.Farm., M.Farm.',
    departmentId: 'dept-07', title: 'Optimalisasi Sistem Manajemen Obat',
    description: 'Mengimplementasikan sistem FEFO dan mengurangi slow-moving drugs.',
    period: 'Q1 2026', status: 'Aktif', parentId: 'okr-div-03', bscLink: 'Internal Process',
    keyResults: [
      { id: 'kr-22', objectiveId: 'okr-ind-03', title: 'FEFO Diterapkan di 100% Gudang', startValue: 50, targetValue: 100, currentValue: 100, unit: '%', confidence: 'Tinggi', checkIns: [{ id: 'ci-19', date: '2026-03-01', value: 100, note: 'Selesai!', createdBy: 'Ka. Farmasi' }] },
      { id: 'kr-23', objectiveId: 'okr-ind-03', title: 'Slow-moving Drug < 5% dari Stok', startValue: 9, targetValue: 5, currentValue: 6.2, unit: '%', confidence: 'Sedang', checkIns: [] },
    ],
  },
];

// ─── PERFORMANCE REVIEWS ──────────────────────────────────────────────────────
export const performanceReviews: PerformanceReview[] = [
  { id: 'rev-01', revieweeId: 'P001', revieweeName: 'dr. Imam Ghozali, Sp.An., M.Kes.', reviewerName: 'Komite Penilaian Kinerja', period: 'Q4 2025', bscScore: 88, okrScore: 85, finalScore: 87, rating: 'A', strengths: 'Kepemimpinan transformatif, visi strategis RS, kemampuan pengambilan keputusan cepat', improvements: 'Perlu memperkuat komunikasi lintas divisi dan pendelegasian operasional', feedback: 'Kinerja excellent. Kontribusi besar dalam transformasi digital RS dan akreditasi KARS.', status: 'Diakui', createdAt: '2026-01-15' },
  { id: 'rev-02', revieweeId: 'P003', revieweeName: 'Ns. Sri Wahyuni, S.Kep., M.Kep.', reviewerName: 'dr. Sulistyo Wibowo, Sp.PD.', period: 'Q4 2025', bscScore: 82, okrScore: 79, finalScore: 81, rating: 'B', strengths: 'Disiplin tinggi, dokumentasi rapi, loyalitas kepada RS', improvements: 'Perlu meningkatkan kompetensi penggunaan SIM RS dan leadership skill', feedback: 'Kinerja baik dan konsisten. Direkomendasikan untuk mengikuti pelatihan manajemen bangsal.', status: 'Diakui', createdAt: '2026-01-15' },
  { id: 'rev-03', revieweeId: 'P005', revieweeName: 'Apt. Dian Permata, S.Farm., M.Farm.', reviewerName: 'dr. Imam Ghozali, Sp.An., M.Kes.', period: 'Q4 2025', bscScore: 91, okrScore: 90, finalScore: 91, rating: 'A', strengths: 'Inovatif, sistem manajemen farmasi sangat efisien, zero complaint distribusi obat', improvements: 'Perlu pengembangan soft skill dalam komunikasi dengan dokter spesialis', feedback: 'Top performer 2025. Calon potensial untuk Kepala Instalasi Farmasi.', status: 'Diakui', createdAt: '2026-01-15' },
  { id: 'rev-04', revieweeId: 'P007', revieweeName: 'dr. Reza Pratama, Sp.EM.', reviewerName: 'dr. Sulistyo Wibowo, Sp.PD.', period: 'Q4 2025', bscScore: 74, okrScore: 71, finalScore: 73, rating: 'C', strengths: 'Kompeten secara klinis, responsif dalam kondisi kritis', improvements: 'Waktu tunggu IGD masih di atas target. Perlu perbaikan alur triage dan koordinasi tim.', feedback: 'Perlu coaching lebih intensif terkait manajemen operasional IGD.', status: 'Submitted', createdAt: '2026-01-20' },
  { id: 'rev-05', revieweeId: 'P010', revieweeName: 'Wahyu Setiabudi, SE., MM.', reviewerName: 'dr. Imam Ghozali, Sp.An., M.Kes.', period: 'Q4 2025', bscScore: 86, okrScore: 83, finalScore: 85, rating: 'A', strengths: 'Laporan keuangan akurat dan tepat waktu, pengelolaan anggaran sangat baik', improvements: 'Perlu memperkuat koordinasi dengan divisi pengadaan untuk efisiensi belanja', feedback: 'Kinerja sangat baik. Kontribusi dalam menjaga kesehatan keuangan RS sangat nyata.', status: 'Diakui', createdAt: '2026-01-15' },
  { id: 'rev-06', revieweeId: 'P012', revieweeName: 'dr. Nina Kartika, Sp.A.', reviewerName: 'dr. Sulistyo Wibowo, Sp.PD.', period: 'Q4 2025', bscScore: 84, okrScore: 82, finalScore: 83, rating: 'B', strengths: 'Pelayanan pasien rawat jalan sangat baik, indeks kepuasan tinggi', improvements: 'Perlu meningkatkan utilisasi telemedicine dan memperpendek waktu antrian', feedback: 'Kinerja sangat memuaskan. Direkomendasikan maju sebagai kandidat kepala bidang.', status: 'Diakui', createdAt: '2026-01-15' },
];

// ─── ANALYTICS DATA (TREND BULANAN) ──────────────────────────────────────────
export const monthlyTrendData = [
  { bulan: 'Sep 25', bsc: 72, okr: 68, overall: 70 },
  { bulan: 'Okt 25', bsc: 74, okr: 70, overall: 72 },
  { bulan: 'Nov 25', bsc: 76, okr: 72, overall: 74 },
  { bulan: 'Des 25', bsc: 78, okr: 74, overall: 76 },
  { bulan: 'Jan 26', bsc: 80, okr: 76, overall: 78 },
  { bulan: 'Feb 26', bsc: 81, okr: 77, overall: 79 },
  { bulan: 'Mar 26', bsc: 82, okr: 79, overall: 81 },
];

export const perspectiveRadarData = [
  { subject: 'Financial',          value: 82, fullMark: 100 },
  { subject: 'Customer',           value: 86, fullMark: 100 },
  { subject: 'Internal Process',   value: 78, fullMark: 100 },
  { subject: 'Learning & Growth',  value: 76, fullMark: 100 },
];

export const departmentBarData = departmentScorecards.map(d => ({
  name: d.name.replace('Instalasi ', 'Ins. ').replace('Direktorat ', 'Dir. '),
  score: d.score,
  target: 80,
}));

// ─── DEFAULT INTEGRATION WEIGHTS ─────────────────────────────────────────────
export const defaultWeights: IntegrationWeights = {
  bscWeight: 60,
  okrWeight: 40,
  financialWeight: 25,
  customerWeight: 30,
  internalWeight: 25,
  learningWeight: 20,
};

// ─── KPI DEFINITIONS — KOMBINASI BSC + OKR ────────────────────────────────────
// Setiap KPI memiliki: definisi, formula, sumber data, PIC, OKR KR yang terhubung,
// dan bobot kontribusi BSC vs OKR pada pengukuran akhir.
export const kpiDefinitions: KPIDefinition[] = [

  // ── FINANCIAL ────────────────────────────────────────────────────────────────
  {
    kpiId: 'bsc-f01',
    definisi: 'Mengukur pertumbuhan pendapatan RS dibandingkan target tahunan APBD dan BLUD. Mencerminkan kemampuan RS dalam mengelola pendapatan dari layanan kesehatan, BPJS, dan swasta.',
    formula: '(Realisasi Pendapatan / Target Pendapatan) × 100%',
    frekuensi: 'Bulanan',
    dataSource: 'SIM Keuangan BLUD / Laporan Realisasi Anggaran',
    pic: 'Direktur Keuangan',
    linkedKRIds: ['kr-02', 'kr-03'],
    bscContrib: 60,
    okrContrib: 40,
  },
  {
    kpiId: 'bsc-f02',
    definisi: 'Mengukur efisiensi pengeluaran operasional RS terhadap total pendapatan. Rasio yang lebih rendah menunjukkan pengelolaan biaya yang lebih efisien.',
    formula: '(Total Biaya Operasional / Total Pendapatan) × 100%',
    frekuensi: 'Bulanan',
    dataSource: 'Laporan Keuangan Bulanan / SIM Keuangan',
    pic: 'Kabag Keuangan',
    linkedKRIds: [],
    bscContrib: 80,
    okrContrib: 20,
  },
  {
    kpiId: 'bsc-f03',
    definisi: 'Persentase rata-rata tempat tidur yang terisi dari total tempat tidur yang tersedia. Indikator utama utilisasi kapasitas rawat inap dan efisiensi operasional.',
    formula: '(Jumlah Hari Rawat Terisi / (Jumlah TT × Jumlah Hari Periode)) × 100%',
    frekuensi: 'Bulanan',
    dataSource: 'SIRS / Rekam Medis',
    pic: 'Ka. Bid. Pelayanan Medis',
    linkedKRIds: ['kr-02'],
    bscContrib: 65,
    okrContrib: 35,
  },
  {
    kpiId: 'bsc-f04',
    definisi: 'Kemampuan RS dalam menutup biaya operasional dari pendapatan fungsional (BLUD) tanpa bergantung pada subsidi APBD. Target nasional untuk RS tipe B: ≥ 95%.',
    formula: '(Pendapatan Fungsional / Biaya Operasional) × 100%',
    frekuensi: 'Kuartalan',
    dataSource: 'Laporan Keuangan BLUD',
    pic: 'Direktur Keuangan',
    linkedKRIds: ['kr-03'],
    bscContrib: 70,
    okrContrib: 30,
  },

  // ── CUSTOMER ─────────────────────────────────────────────────────────────────
  {
    kpiId: 'bsc-c01',
    definisi: 'Tingkat kepuasan pasien diukur melalui Survei Kepuasan Masyarakat (SKM) sesuai PermenPAN-RB No. 14/2017. Mencakup 9 unsur pelayanan dari akses hingga kompetensi petugas.',
    formula: 'IKM = (Total Nilai / Jumlah Responden) × 25 → dikonversi ke skala 100',
    frekuensi: 'Kuartalan',
    dataSource: 'Survei SKM / e-Survey RS',
    pic: 'Kabag Hukum & Humas',
    linkedKRIds: ['kr-01', 'kr-20'],
    bscContrib: 55,
    okrContrib: 45,
  },
  {
    kpiId: 'bsc-c02',
    definisi: 'Rata-rata waktu dari pasien datang ke IGD (triage) hingga mendapatkan penanganan medis pertama. Standar nasional: kasus gawat darurat ≤ 5 menit, non-gawat darurat ≤ 30 menit. Target agregat RS ≤ 10 menit.',
    formula: 'Rata-rata (waktu penanganan – waktu kedatangan) seluruh pasien IGD',
    frekuensi: 'Bulanan',
    dataSource: 'SIRS / Catatan Triage IGD',
    pic: 'Ka. IGD',
    linkedKRIds: ['kr-12', 'kr-13'],
    bscContrib: 50,
    okrContrib: 50,
  },
  {
    kpiId: 'bsc-c03',
    definisi: 'Persentase pasien yang kembali dirawat inap dalam 30 hari setelah dipulangkan dari penyakit yang sama atau komplikasi terkait. Indikator mutu perawatan dan ketepatan discharge planning.',
    formula: '(Pasien Re-admisi < 30 hari / Total Pasien Keluar) × 100%',
    frekuensi: 'Bulanan',
    dataSource: 'Rekam Medis / SIRS',
    pic: 'Komite Medis',
    linkedKRIds: [],
    bscContrib: 80,
    okrContrib: 20,
  },
  {
    kpiId: 'bsc-c04',
    definisi: 'Persentase pengaduan / komplain pasien dan keluarga yang berhasil ditindaklanjuti dan diselesaikan dalam 3 hari kerja sesuai SOP Penanganan Komplain.',
    formula: '(Komplain Selesai ≤ 3 hari / Total Komplain Masuk) × 100%',
    frekuensi: 'Bulanan',
    dataSource: 'Buku Komplain / Sistem Pengaduan RS',
    pic: 'Kabag Humas & Pemasaran',
    linkedKRIds: [],
    bscContrib: 75,
    okrContrib: 25,
  },

  // ── INTERNAL PROCESS ──────────────────────────────────────────────────────────
  {
    kpiId: 'bsc-i01',
    definisi: 'Rata-rata waktu yang dibutuhkan dari pengumuman formasi (lowongan) hingga SK pengangkatan diterbitkan. Efisiensi proses rekrutmen mencerminkan kualitas tata kelola SDM.',
    formula: 'Rata-rata hari (tanggal SK – tanggal buka loker) seluruh rekrutmen dalam periode',
    frekuensi: 'Kuartalan',
    dataSource: 'Sistem Informasi SDM / HCMS',
    pic: 'Kabag SDM & Umum',
    linkedKRIds: ['kr-09', 'kr-10', 'kr-11', 'kr-16', 'kr-17'],
    bscContrib: 45,
    okrContrib: 55,
  },
  {
    kpiId: 'bsc-i02',
    definisi: 'Persentase ketersediaan obat-obatan dalam formularium RS yang sesuai standar Kemenkes RI. Mencakup ketersediaan fisik di instalasi farmasi dan sub-depo setiap saat.',
    formula: '(Jumlah Item Obat Tersedia / Total Item Formularium) × 100%',
    frekuensi: 'Bulanan',
    dataSource: 'SIM Farmasi / Laporan Stok Harian',
    pic: 'Ka. Instalasi Farmasi',
    linkedKRIds: ['kr-08', 'kr-14', 'kr-15', 'kr-22', 'kr-23'],
    bscContrib: 50,
    okrContrib: 50,
  },
  {
    kpiId: 'bsc-i03',
    definisi: 'Persentase laporan keuangan BLUD yang disampaikan tepat waktu sesuai ketentuan dan bebas temuan material dari audit internal/eksternal.',
    formula: '(Laporan Tepat Waktu & Akurat / Total Laporan Wajib) × 100%',
    frekuensi: 'Bulanan',
    dataSource: 'Laporan Keuangan / SIM Keuangan',
    pic: 'Kabag Keuangan',
    linkedKRIds: [],
    bscContrib: 85,
    okrContrib: 15,
  },
  {
    kpiId: 'bsc-i04',
    definisi: 'Rata-rata lama pasien dirawat inap dari tanggal masuk hingga keluar. Standar nasional: 3–12 hari. ALOS optimal RS Tipe B: 5 hari. Indikator efisiensi dan ketepatan tatalaksana klinik.',
    formula: 'Total Hari Rawat Pasien Keluar / Total Pasien Keluar',
    frekuensi: 'Bulanan',
    dataSource: 'Rekam Medis / SIRS',
    pic: 'Ka. Bid. Pelayanan Medis',
    linkedKRIds: [],
    bscContrib: 80,
    okrContrib: 20,
  },
  {
    kpiId: 'bsc-i05',
    definisi: 'Jumlah Kejadian Tidak Diharapkan (KTD) kategori berat (sentinel event) dan insiden K3RS dengan cedera fisik. Target: Zero accident sepanjang tahun 2026.',
    formula: 'Jumlah kumulatif KTD berat + insiden K3 dengan cedera dalam periode',
    frekuensi: 'Bulanan',
    dataSource: 'Laporan Insiden Keselamatan Pasien / K3RS',
    pic: 'Komite Keselamatan Pasien & K3RS',
    linkedKRIds: ['kr-07'],
    bscContrib: 55,
    okrContrib: 45,
  },

  // ── LEARNING & GROWTH ─────────────────────────────────────────────────────────
  {
    kpiId: 'bsc-l01',
    definisi: 'Persentase pegawai yang telah mengikuti minimal 1 kegiatan pendidikan dan pelatihan (diklat) dalam satu tahun anggaran. Sesuai amanat PP No. 11/2017 dan kebijakan BKN.',
    formula: '(Pegawai yang Ikut ≥1 Diklat / Total Pegawai Aktif) × 100%',
    frekuensi: 'Kuartalan',
    dataSource: 'SIMPEG / Modul Diklat HCMS',
    pic: 'Kabag Diklat & Pengembangan SDM',
    linkedKRIds: ['kr-04'],
    bscContrib: 55,
    okrContrib: 45,
  },
  {
    kpiId: 'bsc-l02',
    definisi: 'Nilai rata-rata SKP (Sasaran Kinerja Pegawai) seluruh pegawai aktif dalam periode penilaian. Mencerminkan kompetensi kolektif organisasi. Acuan: PermenPAN-RB No. 6/2022.',
    formula: 'Rata-rata Nilai SKP Akhir seluruh pegawai aktif',
    frekuensi: 'Semesteran',
    dataSource: 'Modul SKP HCMS / e-Kinerja BKN',
    pic: 'Kabag SDM & Umum',
    linkedKRIds: ['kr-21'],
    bscContrib: 60,
    okrContrib: 40,
  },
  {
    kpiId: 'bsc-l03',
    definisi: 'Persentase pegawai yang tetap bertahan (tidak mengundurkan diri, pindah, atau diberhentikan atas kemauan sendiri) dari total pegawai awal periode. Indikator loyalitas dan iklim kerja.',
    formula: '(1 – (Pegawai Keluar Sukarela / Total Pegawai Awal Periode)) × 100%',
    frekuensi: 'Tahunan',
    dataSource: 'Data Kepegawaian / HCMS',
    pic: 'Kabag SDM & Umum',
    linkedKRIds: [],
    bscContrib: 85,
    okrContrib: 15,
  },
  {
    kpiId: 'bsc-l04',
    definisi: 'Skor keterlibatan (engagement) pegawai yang diukur melalui survei internal. Mencakup dimensi: kepuasan kerja, motivasi, komitmen organisasi, dan keselarasan dengan visi RS.',
    formula: 'Rata-rata skor survei employee engagement (skala 0–100)',
    frekuensi: 'Semesteran',
    dataSource: 'Survei Internal HR / Google Form',
    pic: 'Kabag SDM & Umum',
    linkedKRIds: ['kr-05', 'kr-06'],
    bscContrib: 50,
    okrContrib: 50,
  },
];