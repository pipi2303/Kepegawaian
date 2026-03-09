// ─── APPROVAL ─────────────────────────────────────────────────────────────────
export interface ApprovalLevel {
  level: number;
  jabatan: string;
  nama: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak';
  tanggal?: string;
  catatan?: string;
}

// ─── PEGAWAI ──────────────────────────────────────────────────────────────────
export interface Pegawai {
  id: string;
  nip: string;
  nama: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  agama: string;
  statusPerkawinan: string;
  alamat: string;
  noTelp: string;
  email: string;
  jabatan: string;
  jabatanFungsional: string;
  unitKerja: string;
  golongan: string;
  pangkat: string;
  tmtGolongan: string;
  tmtJabatan: string;
  statusPegawai: 'PNS' | 'PPPK' | 'Honorer';
  statusAktif: 'Aktif' | 'Pensiun' | 'Meninggal' | 'Diberhentikan';
  pendidikanTerakhir: string;
  jurusan: string;
  institusi: string;
  tahunLulus: number;
  tanggalMasuk: string;
  batasPensiun: string;
  masaKerja: string;
  eselon?: string;
  badge?: string;          // Nomor / kode badge ID pegawai
  foto?: string;         // base64 data URL atau URL eksternal
  sertifikat?: string[]; // Daftar nama sertifikat / kompetensi keahlian
}

// ─── DATA KELUARGA ────────────────────────────────────────────────────────────
export type HubunganKeluarga = 'Suami' | 'Istri' | 'Anak' | 'Orang Tua' | 'Mertua' | 'Saudara Kandung' | 'Lainnya';

export interface DataKeluarga {
  id: string;
  pegawaiId: string;
  hubungan: HubunganKeluarga;
  nama: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  nomorKTP?: string;
  agama?: string;
  pendidikan?: string;
  pekerjaan?: string;
  statusHidup: 'Hidup' | 'Meninggal';
  tunjangan: boolean;   // apakah terdaftar sebagai tanggungan / penerima tunjangan
  keterangan?: string;
}

// ─── DOKUMEN PEGAWAI ──────────────────────────────────────────────────────────
export type KategoriDokumen = 'Identitas Diri' | 'Kepegawaian' | 'Pendidikan & Sertifikasi' | 'Dokumen Rumah Sakit';
export type StatusDokumen = 'Valid' | 'Kadaluarsa' | 'Segera Kadaluarsa' | 'Belum Upload';

export interface DokumenPegawai {
  id: string;
  pegawaiId: string;
  kategori: KategoriDokumen;
  namaDokumen: string;
  nomorDokumen?: string;
  tanggalTerbit?: string;
  tanggalKadaluarsa?: string;
  instansiPenerbit?: string;
  keterangan?: string;
  fileUrl?: string;        // base64 atau URL
  fileName?: string;
  status: StatusDokumen;
}

// ─── PERFORMANCE MANAGEMENT ──────────────────────────────────────────────────
export type BSCPerspektiveName = 'Financial' | 'Customer' | 'Internal Process' | 'Learning & Growth';

export interface BSCObjective {
  id: string;
  perspektif: BSCPerspektiveName;
  departmentId: string;
  title: string;
  kpi: string;
  target: number;
  actual: number;
  unit: string;
  weight: number;
  period: string;
  status: 'On Track' | 'At Risk' | 'Behind' | 'Achieved';
}

export interface DepartmentScorecard {
  id: string;
  name: string;
  headName: string;
  score: number;
  financialScore: number;
  customerScore: number;
  internalScore: number;
  learningScore: number;
  trend: number[];
}

export type OKRLevel = 'Organisasi' | 'Divisi' | 'Tim' | 'Individu';
export type OKRStatus = 'Draft' | 'Aktif' | 'Selesai' | 'Dibatalkan';
export type ConfidenceLevel = 'Tinggi' | 'Sedang' | 'Rendah';

export interface OKRCheckIn {
  id: string;
  date: string;
  value: number;
  note: string;
  createdBy: string;
}

export interface OKRKeyResult {
  id: string;
  objectiveId: string;
  title: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  confidence: ConfidenceLevel;
  checkIns: OKRCheckIn[];
}

export interface OKRObjective {
  id: string;
  level: OKRLevel;
  ownerId: string;
  ownerName: string;
  departmentId?: string;
  title: string;
  description: string;
  period: string;
  parentId?: string;
  keyResults: OKRKeyResult[];
  status: OKRStatus;
  bscLink?: BSCPerspektiveName;
}

export interface PerformanceReview {
  id: string;
  revieweeId: string;
  revieweeName: string;
  reviewerName: string;
  period: string;
  bscScore: number;
  okrScore: number;
  finalScore: number;
  rating: 'A' | 'B' | 'C' | 'D' | 'E';
  strengths: string;
  improvements: string;
  feedback: string;
  status: 'Draft' | 'Submitted' | 'Diakui';
  createdAt: string;
}

export interface IntegrationWeights {
  bscWeight: number;
  okrWeight: number;
  financialWeight: number;
  customerWeight: number;
  internalWeight: number;
  learningWeight: number;
}

// ─── KPI COMBINED (BSC ↔ OKR) ────────────────────────────────────────────────
/** Definisi satu KPI dalam framework kombinasi BSC+OKR */
export interface KPIDefinition {
  kpiId: string;              // same as BSCObjective.id
  definisi: string;           // penjelasan lengkap KPI
  formula: string;            // cara menghitung
  frekuensi: 'Harian' | 'Mingguan' | 'Bulanan' | 'Kuartalan' | 'Tahunan';
  dataSource: string;         // sumber data
  pic: string;                // penanggung jawab pengukuran
  linkedKRIds: string[];      // OKR Key Result IDs yang mendukung BSC ini
  bscContrib: number;         // bobot kontribusi BSC (0-100)
  okrContrib: number;         // bobot kontribusi OKR (0-100)
}

/** Hasil pengukuran kombinasi satu KPI */
export interface KPICombinedScore {
  kpiId: string;
  bscScore: number;           // skor 0-100 dari BSC
  okrScore: number;           // skor 0-100 dari OKR
  combinedScore: number;      // final weighted score
  delta: number;              // selisih dari target (positif = melebihi)
  trend: 'naik' | 'turun' | 'stabil';
}

// ─── ABSENSI ─────────────────────────────────────────────────────────────────