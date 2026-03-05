export interface ApprovalLevel {
  level: number;
  jabatan: string;
  nama: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak';
  tanggal?: string;
  catatan?: string;
}

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

export interface AbsensiRecord {
  id: string;
  pegawaiId: string;
  tanggal: string;
  jamMasuk?: string;
  jamKeluar?: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Cuti' | 'Alpha' | 'Libur' | 'Dinas Luar';
  keterangan?: string;
}

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
}

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
