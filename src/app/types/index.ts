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
export type AbsensiStatus = 'Hadir' | 'Alpha' | 'Sakit' | 'Cuti' | 'Izin' | 'Dinas Luar' | 'Libur';

export interface AbsensiRecord {
  id: string;
  pegawaiId: string;
  tanggal: string;           // YYYY-MM-DD
  jamMasuk?: string;         // HH:mm
  jamKeluar?: string;        // HH:mm
  status: AbsensiStatus;
  keterangan?: string;
  diinputOleh?: string;
}

// ─── CUTI ─────────────────────────────────────────────────────────────────────
export type JenisCuti =
  | 'Cuti Tahunan'
  | 'Cuti Sakit'
  | 'Cuti Melahirkan'
  | 'Cuti Alasan Penting'
  | 'Cuti Besar'
  | 'Cuti Di Luar Tanggungan Negara';

export interface CutiRecord {
  id: string;
  pegawaiId: string;
  jenisCuti: JenisCuti;
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  alasan: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak';
  disetujuiOleh?: string;
  tanggalPengajuan: string;
  tanggalDisetujui?: string;
  keterangan?: string;
  approvalLevels?: ApprovalLevel[];
}

export interface SisaCuti {
  pegawaiId: string;
  tahun: number;
  jenis: JenisCuti;
  kuota: number;
  terpakai: number;
  sisa: number;
}

// ─── SKP ──────────────────────────────────────────────────────────────────────
export interface TargetKinerja {
  id: string;
  uraianKegiatan: string;
  target: number;
  satuan?: string;
  realisasi?: number;
  nilaiCapaian?: number;
  bobot: number;
}

export type PredikatSKP = 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';

export interface SKPRecord {
  id: string;
  pegawaiId: string;
  tahun: number;
  semester: 1 | 2;
  targetKinerja: TargetKinerja[];
  nilaiAkhir?: number;
  predikat?: PredikatSKP;
  status: 'Draft' | 'Aktif' | 'Selesai' | 'Disetujui';
  catatanAtasan?: string;
  disetujuiOleh?: string;
  tanggalDisetujui?: string;
}

// ─── RIWAYAT JABATAN ──────────────────────────────────────────────────────────
export type JenisJabatan = 'Struktural' | 'Fungsional' | 'Pelaksana';

export interface RiwayatJabatan {
  id: string;
  pegawaiId: string;
  jabatan: string;
  unitKerja: string;
  golongan: string;
  tmtMulai: string;
  tmtSelesai?: string;
  nomorSK: string;
  tanggalSK: string;
  jenisJabatan: JenisJabatan;
  keterangan?: string;
}

// ─── KENAIKAN PANGKAT ─────────────────────────────────────────────────────────
export type JenisKenaikanPangkat =
  | 'Kenaikan Pangkat Reguler'
  | 'Kenaikan Pangkat Fungsional'
  | 'Kenaikan Pangkat Pilihan'
  | 'Kenaikan Pangkat Anumerta';

export interface KenaikanPangkat {
  id: string;
  pegawaiId: string;
  golonganLama: string;
  golonganBaru: string;
  pangkatLama: string;
  pangkatBaru: string;
  jenisKenaikan: JenisKenaikanPangkat;
  periodeUsulan: string;
  tanggalBerlaku?: string;
  status: 'Proses' | 'Selesai' | 'Ditolak' | 'Pending';
  nomorSK?: string;
  tanggalSK?: string;
  jabatan: string;
  eselon: string;
  keterangan?: string;
}

// ─── DISIPLIN ─────────────────────────────────────────────────────────────────
export type TingkatHukumanDisiplin = 'Ringan' | 'Sedang' | 'Berat';

export interface DisiplinRecord {
  id: string;
  pegawaiId: string;
  jenisHukuman: string;
  tingkatHukuman: TingkatHukumanDisiplin;
  tanggalKejadian: string;
  tanggalSK?: string;
  nomorSK?: string;
  kronologi: string;
  status: 'Proses' | 'Selesai' | 'Investigasi' | 'Banding';
  pejabatPenetap?: string;
  keterangan?: string;
}

// ─── DIKLAT ───────────────────────────────────────────────────────────────────
export type JenisDiklat = 'Manajerial' | 'Teknis' | 'Fungsional' | 'Orientasi' | 'Lainnya';
export type StatusDiklat = 'Selesai' | 'Berlangsung' | 'Direncanakan' | 'Dibatalkan';

export interface DiklatRecord {
  id: string;
  pegawaiId: string;
  namaDiklat: string;
  jenisDiklat: JenisDiklat;
  penyelenggara: string;
  tempatPelaksanaan: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  jumlahJP: number;
  nomorSertifikat?: string;
  status: StatusDiklat;
  keterangan?: string;
}

// ─── APP USER ─────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'direktur' | 'kepala_unit' | 'pegawai';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: UserRole;
  jabatan: string;
  golongan?: string;
  unitKerja?: string;
  pegawaiId?: string;
  excludedModules?: string[];
}

// ─── STR (Surat Tanda Registrasi) ────────────────────────────────────────────
export type StatusSTR = 'Aktif' | 'Akan Expired' | 'Expired';

export interface STRRecord {
  id: string;
  pegawaiId: string;
  nomorSTR: string;
  jenisTenaga: string;
  konsil: string;
  tanggalTerbit: string;
  tanggalExpired: string;
  status: StatusSTR;
  keterangan?: string;
}

// ─── SIP / SIK ────────────────────────────────────────────────────────────────
export type JenisSIPDokumen = 'SIP' | 'SIK' | 'SIPP' | 'SIKB';
export type StatusSIP = 'Aktif' | 'Akan Expired' | 'Expired';

export interface SIPRecord {
  id: string;
  pegawaiId: string;
  nomorSIP: string;
  jenisDokumen: JenisSIPDokumen;
  jenisPraktik?: string;
  fasyankes: string;
  instansiPenerbit: string;
  tanggalTerbit: string;
  tanggalExpired: string;
  status: StatusSIP;
  keterangan?: string;
}

// ─── CREDENTIALING ────────────────────────────────────────────────────────────
export type LevelKewenangan = 'Mandiri' | 'Dengan Supervisi' | 'Tidak Berwenang';

export interface KewenangaKlinis {
  id: string;
  kode: string;
  namaKewenangan: string;
  kategori: string;
  level: LevelKewenangan;
}

export type JenisKredensial = 'Kredensial Awal' | 'Re-kredensial' | 'Peningkatan Kewenangan';
export type StatusKredensial =
  | 'Verifikasi Dokumen'
  | 'Peer Review'
  | 'Sidang Komite'
  | 'Selesai'
  | 'Ditolak';

export interface CredentialingRecord {
  id: string;
  pegawaiId: string;
  jenis: JenisKredensial;
  tanggalPengajuan: string;
  tanggalKredensial?: string;
  tanggalExpired?: string;
  statusKredensial: StatusKredensial;
  kewenangan: KewenangaKlinis[];
  rekomendasiKomite?: string;
  disetujuiOleh?: string;
  catatanKomite?: string;
}

// ─── CPD (Continuing Professional Development) ───────────────────────────────
export type JenisKegiatanCPD =
  | 'Seminar'
  | 'Workshop'
  | 'Webinar'
  | 'Pelatihan'
  | 'Konferensi'
  | 'Simposium'
  | 'Lainnya';

export type StatusCPD = 'Diverifikasi' | 'Pending' | 'Ditolak';

export interface CPDRecord {
  id: string;
  pegawaiId: string;
  tahun: number;
  namaKegiatan: string;
  jenisKegiatan: JenisKegiatanCPD;
  penyelenggara: string;
  tanggal: string;
  skp: number;
  nomorSertifikat?: string;
  diakuiOleh: string;
  status: StatusCPD;
}

// ─── K3RS – INSIDEN ───────────────────────────────────────────────────────────
export type KeparahanInsiden = 'Ringan' | 'Sedang' | 'Berat' | 'Fatal';
export type StatusLaporanInsiden = 'Dilaporkan' | 'Investigasi' | 'Selesai' | 'Ditutup';

export interface InsidenK3RS {
  id: string;
  pegawaiId: string;
  tanggal: string;
  jenisInsiden: string;
  lokasi: string;
  deskripsi: string;
  tindakanSegera: string;
  tindakLanjut?: string;
  keparahan: KeparahanInsiden;
  statusLaporan: StatusLaporanInsiden;
  tanggalTindakLanjut?: string;
  pelapor?: string;
}

// ─── VAKSINASI ────────────────────────────────────────────────────────────────
export type StatusVaksinasi = 'Lengkap' | 'Sebagian' | 'Belum';

export interface VaksinasiRecord {
  id: string;
  pegawaiId: string;
  jenisVaksin: string;
  dosis: number;
  tanggalVaksin: string;
  fasilitasVaksin: string;
  tanggalBooster?: string;
  status: StatusVaksinasi;
  keterangan?: string;
}

// ─── MCU (Medical Check Up) ───────────────────────────────────────────────────
export type JenisMCU = 'Berkala' | 'Khusus Pajanan' | 'Awal Kerja' | 'Purna Jabatan';
export type HasilMCU = 'Layak Kerja' | 'Layak dengan Syarat' | 'Tidak Layak';

export interface MCURecord {
  id: string;
  pegawaiId: string;
  tanggal: string;
  jenisMCU: JenisMCU;
  hasilMCU: HasilMCU;
  catatan?: string;
  rekomendasiDokter?: string;
  tanggalBerikutnya?: string;
  fasilitasMCU: string;
}

// ─── SLIP GAJI ────────────────────────────────────────────────────────────────
export interface SlipGajiItem {
  uraian: string;
  jumlah: number;
}

export type StatusSlipGaji = 'Draft' | 'Disetujui' | 'Dibayar' | 'Dibatalkan';

export interface SlipGaji {
  id: string;
  pegawaiId: string;
  bulan: number;
  tahun: number;
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganFungsional: number;
  tunjanganBeras: number;
  tunjanganAnak: number;
  tunjanganIstri: number;
  tunjanganKinerja: number;
  tambahanLain: SlipGajiItem[];
  potonganBPJSKes: number;
  potonganBPJSTK: number;
  potonganPPh21: number;
  potonganTaspen: number;
  potonganLain: SlipGajiItem[];
  totalBruto: number;
  totalPotongan: number;
  totalNetto: number;
  status: StatusSlipGaji;
  tanggalDibayar?: string;
}

// ─── JADWAL SHIFT ─────────────────────────────────────────────────────────────
export type JenisShift = 'Pagi' | 'Sore' | 'Malam' | 'Lepas' | 'On-Call' | 'Libur';
export type StatusJadwal = 'Aktif' | 'Swap' | 'Dibatalkan';

export interface JadwalShift {
  id: string;
  pegawaiId: string;
  tanggal: string;
  jenisShift: JenisShift;
  jamMulai?: string;
  jamSelesai?: string;
  unitKerja: string;
  status: StatusJadwal;
  keterangan?: string;
}

// ─── BPJS ─────────────────────────────────────────────────────────────────────
export interface BPJSTanggungan {
  id: string;
  nama: string;
  hubungan: string;
  tanggalLahir: string;
  nomorKartu: string;
  statusTanggungan: 'Aktif' | 'Tidak Aktif';
}

export interface BPJSRecord {
  id: string;
  pegawaiId: string;
  nomorKartuKesehatan: string;
  kelasBPJSKes: 'I' | 'II' | 'III';
  statusBPJSKes: 'Aktif' | 'Tidak Aktif' | 'Ditangguhkan';
  nomorBPJSTK: string;
  statusBPJSTK: 'Aktif' | 'Tidak Aktif';
  tanggungan: BPJSTanggungan[];
  iuranKesehatan: number;
  iuranKetenagakerjaan: number;
  tanggalDaftar: string;
}

// ─── KONTRAK KERJA ────────────────────────────────────────────────────────────
export type JenisKontrak = 'PKWT' | 'Dokter Mitra' | 'Dokter Paruh Waktu' | 'PKS' | 'Lainnya';
export type StatusKontrak = 'Aktif' | 'Berakhir' | 'Dibatalkan' | 'Diperpanjang';

export interface KontrakRecord {
  id: string;
  pegawaiId: string;
  jenisKontrak: JenisKontrak;
  nomorKontrak: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  jabatanKontrak: string;
  unitKerja: string;
  nilaiKontrak?: number;
  jadwalPraktik?: string;
  statusKontrak: StatusKontrak;
  catatanKontrak?: string;
}

// ─── PENGHARGAAN ──────────────────────────────────────────────────────────────
export type TingkatPenghargaan = 'Nasional' | 'Provinsi' | 'Kabupaten/Kota' | 'Instansi' | 'Lainnya';

export interface PenghargaanRecord {
  id: string;
  pegawaiId: string;
  jenisPenghargaan: string;
  tanggalPemberian: string;
  nomorSK: string;
  instansiPemberi: string;
  tingkat: TingkatPenghargaan;
  keterangan?: string;
}

// ─── MUTASI & PROMOSI ─────────────────────────────────────────────────────────
export type JenisMutasi =
  | 'Rotasi'
  | 'Mutasi Internal'
  | 'Mutasi Eksternal'
  | 'Promosi Jabatan'
  | 'Demosi';

export type StatusMutasi = 'Berlaku' | 'Disetujui' | 'Usulan' | 'Ditolak' | 'Dibatalkan';

export interface MutasiRecord {
  id: string;
  pegawaiId: string;
  jenisMutasi: JenisMutasi;
  unitKerjaAsal: string;
  jabatanAsal: string;
  unitKerjaTujuan: string;
  jabatanTujuan: string;
  golonganAsal: string;
  golonganTujuan: string;
  tanggalUsulan: string;
  tanggalBerlaku?: string;
  nomorSK?: string;
  status: StatusMutasi;
  alasan: string;
  catatanPejabat?: string;
}

// ─── KOMITE RS ────────────────────────────────────────────────────────────────
export interface AnggotaKomite {
  id: string;
  pegawaiId: string;
  namaKomite: string;
  subKomite?: string;
  jabatanKomite: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  statusKomite: 'Aktif' | 'Tidak Aktif';
  nomorSK: string;
}

export type JenisKegiatanKomite =
  | 'Rapat Rutin'
  | 'Sidang Kredensial'
  | 'Sidang Disiplin'
  | 'Rapat Luar Biasa'
  | 'Lainnya';

export type StatusKegiatanKomite = 'Dijadwalkan' | 'Berlangsung' | 'Selesai' | 'Dibatalkan';

export interface KegiatanKomite {
  id: string;
  namaKomite: string;
  tanggal: string;
  jenisKegiatan: JenisKegiatanKomite;
  agenda: string;
  peserta: string[];       // array of pegawaiId
  status: StatusKegiatanKomite;
  hasilKeputusan: string;
  keterangan?: string;
}

// ─── HUBUNGAN INDUSTRIAL ──────────────────────────────────────────────────────
export type KategoriGrievance =
  | 'Kontrak'
  | 'Keselamatan Kerja'
  | 'Gaji'
  | 'Lingkungan Kerja'
  | 'Perlakuan Tidak Adil'
  | 'Diskriminasi'
  | 'Lainnya';

export type StatusGrievance = 'Diterima' | 'Mediasi' | 'Selesai' | 'Ditolak' | 'Banding';

export interface GrievanceRecord {
  id: string;
  pegawaiId: string;
  tanggalPengaduan: string;
  kategori: KategoriGrievance;
  deskripsi: string;
  status: StatusGrievance;
  resolusi?: string;
  tanggalResolusi?: string;
  mediator?: string;
  keterangan?: string;
}

// ─── PHK / PENSIUN ────────────────────────────────────────────────────────────
export type JenisPHK =
  | 'Pensiun Dini'
  | 'Pensiun Normal'
  | 'PHK Karena Disiplin'
  | 'Resign'
  | 'Meninggal'
  | 'Kontrak Berakhir';

export type StatusPHK = 'Proses' | 'Selesai' | 'Banding' | 'Dibatalkan';

export interface PHKRecord {
  id: string;
  pegawaiId: string;
  alasanPHK: string;
  jenisPHK: JenisPHK;
  tanggalPHK: string;
  masaKerja: string;
  pesangon: number;
  uangPisah: number;
  uangPenggantianHak: number;
  totalPesangon: number;
  nomorSK: string;
  status: StatusPHK;
  catatan?: string;
}