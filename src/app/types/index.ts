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
}

// ─── ABSENSI ─────────────────────────────────────────────────────────────────
export interface AbsensiRecord {
  id: string;
  pegawaiId: string;
  tanggal: string;
  jamMasuk?: string;
  jamKeluar?: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Cuti' | 'Alpha' | 'Libur' | 'Dinas Luar';
  keterangan?: string;
}

// ─── CUTI ─────────────────────────────────────────────────────────────────────
export interface CutiRecord {
  id: string;
  pegawaiId: string;
  jenisCuti: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  alasan: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak';
  disetujuiOleh?: string;
  tanggalPengajuan: string;
  approvalLevels?: ApprovalLevel[];
  currentLevel?: number;
}

export interface SisaCuti {
  pegawaiId: string;
  tahun: number;
  jenis: string;
  kuota: number;
  terpakai: number;
  sisa: number;
}

// ─── SKP ──────────────────────────────────────────────────────────────────────
export interface SKPRecord {
  id: string;
  pegawaiId: string;
  tahun: number;
  semester: 1 | 2;
  targetKinerja: SKPItem[];
  nilaiAkhir?: number;
  predikat?: string;
  status: 'Draft' | 'Aktif' | 'Selesai';
  catatan?: string;
}

export interface SKPItem {
  id: string;
  uraianKegiatan: string;
  target: number;
  satuan: string;
  realisasi?: number;
  nilaiCapaian?: number;
  bobot: number;
}

// ─── RIWAYAT JABATAN ─────────────────────────────────────────────────────────
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
  jenisJabatan: 'Struktural' | 'Fungsional' | 'Pelaksana';
}

// ─── KENAIKAN PANGKAT ─────────────────────────────────────────────────────────
export interface KenaikanPangkat {
  id: string;
  pegawaiId: string;
  golonganLama: string;
  golonganBaru: string;
  pangkatLama: string;
  pangkatBaru: string;
  jenisKenaikan: string;
  periodeUsulan: string;
  tanggalBerlaku?: string;
  status: 'Proses' | 'Selesai' | 'Ditolak';
  nomorSK?: string;
  catatan?: string;
  eselon?: string;
  jabatan?: string;
}

// ─── DISIPLIN ────────────────────────────────────────────────────────────────
export interface DisiplinRecord {
  id: string;
  pegawaiId: string;
  jenisHukuman: string;
  tingkatHukuman: 'Ringan' | 'Sedang' | 'Berat';
  tanggalKejadian: string;
  tanggalSK?: string;
  nomorSK?: string;
  kronologi: string;
  status: 'Investigasi' | 'Proses' | 'Selesai' | 'Banding';
  pejabatPenetap?: string;
}

// ─── DIKLAT ──────────────────────────────────────────────────────────────────
export interface DiklatRecord {
  id: string;
  pegawaiId: string;
  namaDiklat: string;
  jenisDiklat: 'Teknis' | 'Fungsional' | 'Manajerial' | 'Sosiokultural' | 'Orientasi';
  penyelenggara: string;
  tempatPelaksanaan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahJP: number;
  nomorSertifikat?: string;
  status: 'Direncanakan' | 'Berlangsung' | 'Selesai';
}

// ─── APP USER ─────────────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: 'admin' | 'direktur' | 'kepala_unit' | 'pegawai';
  jabatan: string;
  golongan?: string;
  unitKerja?: string;
  pegawaiId?: string;
}

// ─── CREDENTIALING & LISENSI ──────────────────────────────────────────────────
export interface STRRecord {
  id: string;
  pegawaiId: string;
  nomorSTR: string;
  jenisTenaga: string;
  konsil: string;
  tanggalTerbit: string;
  tanggalExpired: string;
  status: 'Aktif' | 'Akan Expired' | 'Expired';
  catatan?: string;
}

export interface SIPRecord {
  id: string;
  pegawaiId: string;
  nomorSIP: string;
  jenisDokumen: 'SIP' | 'SIK';
  jenisPraktik?: string;
  fasyankes: string;
  instansiPenerbit: string;
  tanggalTerbit: string;
  tanggalExpired: string;
  status: 'Aktif' | 'Akan Expired' | 'Expired';
  catatan?: string;
}

export interface KewenangaKlinis {
  id: string;
  kode: string;
  namaKewenangan: string;
  kategori: string;
  level: 'Mandiri' | 'Dengan Supervisi' | 'Tidak Berwenang';
  catatan?: string;
}

export interface CredentialingRecord {
  id: string;
  pegawaiId: string;
  jenis: 'Kredensial Awal' | 'Re-kredensial';
  tanggalPengajuan: string;
  tanggalKredensial?: string;
  tanggalExpired?: string;
  statusKredensial: 'Pengajuan' | 'Verifikasi Dokumen' | 'Peer Review' | 'Komite Medik' | 'Selesai' | 'Ditolak';
  kewenangan: KewenangaKlinis[];
  rekomendasiKomite?: string;
  disetujuiOleh?: string;
  catatanKomite?: string;
}

export interface CPDRecord {
  id: string;
  pegawaiId: string;
  tahun: number;
  namaKegiatan: string;
  jenisKegiatan: 'Seminar' | 'Workshop' | 'Webinar' | 'Pelatihan' | 'Publikasi' | 'Mengajar' | 'Keanggotaan Organisasi' | 'Lainnya';
  penyelenggara: string;
  tanggal: string;
  skp: number;
  nomorSertifikat?: string;
  diakuiOleh: string;
  status: 'Diverifikasi' | 'Pending' | 'Ditolak';
}

// ─── K3RS ────────────────────────────────────────────────────────────────────
export type JenisInsidenK3RS =
  'Kecelakaan Kerja' | 'Pajanan Jarum Suntik' | 'Pajanan Cairan Tubuh' |
  'Pajanan Radiasi' | 'Kecelakaan Bahan Kimia' | 'Near Miss' | 'KTD Pegawai' | 'Lainnya';

export interface InsidenK3RS {
  id: string;
  pegawaiId: string;
  tanggal: string;
  jenisInsiden: JenisInsidenK3RS;
  lokasi: string;
  deskripsi: string;
  tindakanSegera?: string;
  tindakLanjut?: string;
  keparahan: 'Ringan' | 'Sedang' | 'Berat';
  statusLaporan: 'Dilaporkan' | 'Investigasi' | 'Selesai';
  tanggalTindakLanjut?: string;
}

export interface VaksinasiRecord {
  id: string;
  pegawaiId: string;
  jenisVaksin: string;
  dosis: number;
  tanggalVaksin: string;
  fasilitasVaksin: string;
  tanggalBooster?: string;
  status: 'Lengkap' | 'Sebagian' | 'Belum';
}

export interface MCURecord {
  id: string;
  pegawaiId: string;
  tanggal: string;
  jenisMCU: 'Awal' | 'Awal Kerja' | 'Berkala' | 'Khusus' | 'Khusus Pajanan' | 'Pra-Pensiun';
  hasilMCU: 'Layak Kerja' | 'Layak dengan Syarat' | 'Tidak Layak';
  catatan?: string;
  rekomendasiDokter?: string;
  tanggalBerikutnya?: string;
  fasilitasMCU?: string;
}

// ─── PENGGAJIAN ───────────────────────────────────────────────────────────────
export interface SlipGaji {
  id: string;
  pegawaiId: string;
  bulan: number;
  tahun: number;
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganFungsional: number;
  tunjanganKinerja: number;
  tunjanganBeras: number;
  tunjanganAnak: number;
  tunjanganIstri: number;
  tambahanLain?: any[];
  totalBruto: number;
  potonganTaspen: number;
  potonganBPJSKes: number;
  potonganBPJSTK: number;
  potonganPPh21: number;
  potonganLain?: any[];
  totalPotongan: number;
  totalNetto: number;
  status: 'Draft' | 'Disetujui' | 'Dibayar';
  tanggalDibayar?: string;
}

// ─── PENJADWALAN ─────────────────────────────────────────────────────────────
export interface JadwalShift {
  id: string;
  pegawaiId: string;
  tanggal: string;
  jenisShift: 'Pagi' | 'Sore' | 'Malam' | 'On-Call' | 'Libur' | 'Lepas';
  jamMulai?: string;
  jamSelesai?: string;
  unitKerja: string;
  keterangan?: string;
  status?: 'Aktif' | 'Batal' | 'Swap';
}

// ─── BPJS ────────────────────────────────────────────────────────────────────
export interface TanggunganBPJS {
  id?: string;
  nama: string;
  hubungan: string;
  tanggalLahir?: string;
  nomorKartu?: string;
  statusTanggungan: 'Aktif' | 'Nonaktif';
}

export interface BPJSRecord {
  id: string;
  pegawaiId: string;
  nomorKartuKesehatan?: string;
  kelasBPJSKes?: 'I' | 'II' | 'III';
  statusBPJSKes: 'Aktif' | 'Tidak Aktif' | 'Belum Terdaftar';
  nomorBPJSTK?: string;
  statusBPJSTK: 'Aktif' | 'Tidak Aktif' | 'Belum Terdaftar';
  tanggungan: TanggunganBPJS[];
  iuranKesehatan?: number;
  iuranKetenagakerjaan?: number;
  tanggalDaftar?: string;
}

// ─── KONTRAK ─────────────────────────────────────────────────────────────────
export interface KontrakRecord {
  id: string;
  pegawaiId: string;
  jenisKontrak: 'PKWT' | 'PKWTT' | 'Dokter Mitra' | 'Dokter Paruh Waktu' | 'Tenaga Alih Daya';
  nomorKontrak: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  jabatanKontrak?: string;
  unitKerja?: string;
  nilaiKontrak?: number;
  jadwalPraktik?: string;
  statusKontrak: 'Aktif' | 'Berakhir' | 'Diperpanjang' | 'Dibatalkan';
  catatanKontrak?: string;
}

// ─── PENGHARGAAN ─────────────────────────────────────────────────────────────
export type JenisPenghargaan =
  'Satyalancana Karya Satya 10 Tahun' | 'Satyalancana Karya Satya 20 Tahun' | 'Satyalancana Karya Satya 30 Tahun' |
  'ASN Teladan Tingkat Nasional' | 'ASN Teladan Tingkat Provinsi' | 'Nakes Teladan RS' |
  'Pegawai Inovatif' | 'Penghargaan Direktur' | 'Penghargaan Gubernur' | 'Penghargaan Presiden' | 'Penghargaan Lainnya';

export interface PenghargaanRecord {
  id: string;
  pegawaiId: string;
  jenisPenghargaan: JenisPenghargaan;
  tanggalPemberian: string;
  nomorSK?: string;
  instansiPemberi?: string;
  tingkat?: 'Nasional' | 'Provinsi' | 'Kota/Kabupaten' | 'Instansi';
  keterangan?: string;
}

// ─── MUTASI ──────────────────────────────────────────────────────────────────
export interface MutasiRecord {
  id: string;
  pegawaiId: string;
  jenisMutasi: 'Mutasi Internal' | 'Mutasi Eksternal' | 'Rotasi' | 'Promosi Jabatan' | 'Promosi Fungsional' | 'Demosi';
  unitKerjaAsal?: string;
  jabatanAsal?: string;
  unitKerjaTujuan?: string;
  jabatanTujuan?: string;
  golonganAsal?: string;
  golonganTujuan?: string;
  tanggalUsulan: string;
  tanggalBerlaku?: string;
  nomorSK?: string;
  status: 'Usulan' | 'Disetujui' | 'Berlaku' | 'Ditolak';
  alasan?: string;
  catatanPejabat?: string;
}

// ─── KOMITE RS ───────────────────────────────────────────────────────────────
export interface AnggotaKomite {
  id: string;
  pegawaiId: string;
  namaKomite: string;
  subKomite?: string;
  jabatanKomite: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  statusKomite: 'Aktif' | 'Nonaktif' | 'Tidak Aktif';
  nomorSK?: string;
}

export interface KegiatanKomite {
  id: string;
  namaKomite: string;
  tanggal: string;
  jenisKegiatan: 'Rapat Rutin' | 'Sidang' | 'Sidang Kredensial' | 'Sidang Disiplin' | 'Workshop' | 'Audit' | 'Evaluasi Kinerja' | 'Rapat Luar Biasa';
  agenda?: string;
  peserta?: string[];
  status: 'Dijadwalkan' | 'Berlangsung' | 'Selesai';
  hasilKeputusan?: string;
}

// ─── HUBUNGAN INDUSTRIAL ─────────────────────────────────────────────────────
export interface GrievanceRecord {
  id: string;
  pegawaiId: string;
  tanggalPengaduan: string;
  kategori: string;
  deskripsi: string;
  status: 'Diterima' | 'Mediasi' | 'Selesai' | 'Diteruskan ke Disnaker';
  resolusi?: string;
  tanggalResolusi?: string;
  mediator?: string;
}

export interface PHKRecord {
  id: string;
  pegawaiId: string;
  alasanPHK: string;
  jenisPHK: string;
  tanggalPHK: string;
  masaKerja?: string;
  pesangon?: number;
  uangPisah?: number;
  uangPenggantianHak?: number;
  totalPesangon?: number;
  nomorSK?: string;
  status: 'Proses' | 'Selesai';
  catatan?: string;
}