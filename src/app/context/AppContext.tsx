import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  Pegawai, CutiRecord, AbsensiRecord, SKPRecord, RiwayatJabatan,
  KenaikanPangkat, DisiplinRecord, DiklatRecord, AppUser,
  STRRecord, SIPRecord, CredentialingRecord, CPDRecord,
  InsidenK3RS, VaksinasiRecord, MCURecord,
  SlipGaji, JadwalShift, BPJSRecord, KontrakRecord,
  PenghargaanRecord, MutasiRecord, AnggotaKomite, KegiatanKomite,
  GrievanceRecord, PHKRecord,
} from '../types';
import {
  dataPegawai as initialPegawai,
  dataCuti as initialCuti,
  dataSKP as initialSKP,
  dataRiwayatJabatan as initialRiwayatJabatan,
  dataKenaikanPangkat as initialKenaikanPangkat,
} from '../data/mockData';
import {
  dataSTR as initialSTR,
  dataSIP as initialSIP,
  dataCredentialing as initialCredentialing,
  dataInsidenK3RS as initialInsidenK3RS,
  dataVaksinasi as initialVaksinasi,
  dataMCU as initialMCU,
  dataSlipGaji as initialSlipGaji,
  dataJadwalShift as initialJadwalShift,
  dataBPJS as initialBPJS,
  dataKontrak as initialKontrak,
  dataPenghargaan as initialPenghargaan,
  dataMutasi as initialMutasi,
  dataAnggotaKomite as initialAnggotaKomite,
  dataKegiatanKomite as initialKegiatanKomite,
  dataGrievance as initialGrievance,
  dataPHK as initialPHK,
  dataCPD as initialCPD,
} from '../data/mockDataRS';

// ─── Generator: Absensi Maret 2026 ────────────────────────────────────────────
function generateInitialAbsensi(): AbsensiRecord[] {
  const records: AbsensiRecord[] = [];
  const pids = Array.from({ length: 20 }, (_, i) => `P${String(i + 1).padStart(3, '0')}`);

  // Special overrides per date per pegawai
  type SpecialEntry = { status: AbsensiRecord['status']; jamMasuk?: string; jamKeluar?: string; keterangan?: string };
  const specials: Record<string, Record<string, SpecialEntry>> = {
    '2026-03-02': {
      P001: { status: 'Hadir', jamMasuk: '07:45', jamKeluar: '16:00' },
      P002: { status: 'Hadir', jamMasuk: '07:50', jamKeluar: '16:10' },
      P003: { status: 'Hadir', jamMasuk: '07:30', jamKeluar: '15:45' },
      P004: { status: 'Hadir', jamMasuk: '08:00', jamKeluar: '16:00' },
      P005: { status: 'Cuti', keterangan: 'Cuti Tahunan' },
      P006: { status: 'Hadir', jamMasuk: '07:55', jamKeluar: '16:05' },
      P007: { status: 'Hadir', jamMasuk: '08:10', jamKeluar: '16:15' },
      P008: { status: 'Sakit', keterangan: 'Surat Dokter No. SK-001/2026' },
      P009: { status: 'Hadir', jamMasuk: '07:40', jamKeluar: '15:50' },
      P010: { status: 'Hadir', jamMasuk: '07:58', jamKeluar: '16:00' },
      P011: { status: 'Hadir', jamMasuk: '08:05', jamKeluar: '16:00' },
      P012: { status: 'Hadir', jamMasuk: '07:35', jamKeluar: '15:40' },
      P013: { status: 'Dinas Luar', keterangan: 'Pelatihan K3RS Jakarta' },
      P014: { status: 'Hadir', jamMasuk: '08:02', jamKeluar: '16:00' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P016: { status: 'Hadir', jamMasuk: '07:30', jamKeluar: '16:30' },
      P017: { status: 'Hadir', jamMasuk: '07:55', jamKeluar: '16:10' },
      P018: { status: 'Hadir', jamMasuk: '07:50', jamKeluar: '16:00' },
      P019: { status: 'Hadir', jamMasuk: '08:00', jamKeluar: '16:00' },
      P020: { status: 'Alpha', keterangan: 'Tidak ada keterangan' },
    },
    '2026-03-03': {
      P005: { status: 'Cuti', keterangan: 'Cuti Tahunan' },
      P008: { status: 'Sakit', keterangan: 'Surat Dokter No. SK-001/2026' },
      P013: { status: 'Dinas Luar', keterangan: 'Pelatihan K3RS Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P017: { status: 'Izin', keterangan: 'Keperluan keluarga mendesak' },
    },
    '2026-03-04': {
      P005: { status: 'Cuti', keterangan: 'Cuti Tahunan' },
      P008: { status: 'Sakit', keterangan: 'Surat Dokter No. SK-001/2026' },
      P010: { status: 'Sakit', keterangan: 'Surat Dokter RS Harapan Ibu' },
      P013: { status: 'Dinas Luar', keterangan: 'Pelatihan K3RS Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-05': {
      P005: { status: 'Cuti', keterangan: 'Cuti Tahunan' },
      P010: { status: 'Sakit', keterangan: 'Surat Dokter RS Harapan Ibu' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P019: { status: 'Alpha', keterangan: 'Tidak ada keterangan' },
    },
    '2026-03-06': {
      P005: { status: 'Cuti', keterangan: 'Cuti Tahunan' },
      P012: { status: 'Izin', keterangan: 'Urusan Pribadi' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-09': {
      P007: { status: 'Sakit', keterangan: 'Surat Dokter RSUD' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P020: { status: 'Alpha', keterangan: 'Tidak ada keterangan' },
    },
    '2026-03-10': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P007: { status: 'Sakit', keterangan: 'Surat Dokter RSUD' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-11': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P018: { status: 'Izin', keterangan: 'Izin Pernikahan Saudara' },
    },
    '2026-03-12': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P018: { status: 'Izin', keterangan: 'Izin Pernikahan Saudara' },
    },
    '2026-03-13': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P014: { status: 'Sakit', keterangan: 'Surat Dokter' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-16': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P020: { status: 'Izin', keterangan: 'Keperluan administrasi' },
    },
    '2026-03-17': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-18': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P003: { status: 'Cuti', keterangan: 'Cuti Tahunan' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-19': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P003: { status: 'Cuti', keterangan: 'Cuti Tahunan' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-20': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P003: { status: 'Cuti', keterangan: 'Cuti Tahunan' },
      P011: { status: 'Sakit', keterangan: 'Surat Dokter' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-23': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-24': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P009: { status: 'Izin', keterangan: 'Keperluan Pribadi' },
    },
    '2026-03-25': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
    },
    '2026-03-26': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P016: { status: 'Sakit', keterangan: 'Surat Dokter' },
    },
    '2026-03-27': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P016: { status: 'Sakit', keterangan: 'Surat Dokter' },
    },
    '2026-03-30': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P013: { status: 'Dinas Luar', keterangan: 'Supervisi Mutu Pelayanan' },
    },
    '2026-03-31': {
      P006: { status: 'Dinas Luar', keterangan: 'PKT III – LAN RI Jakarta' },
      P015: { status: 'Cuti', keterangan: 'Cuti Melahirkan' },
      P013: { status: 'Dinas Luar', keterangan: 'Supervisi Mutu Pelayanan' },
      P020: { status: 'Alpha', keterangan: 'Tidak ada keterangan' },
    },
  };

  let ctr = 1;
  for (let day = 1; day <= 31; day++) {
    const dow = new Date(2026, 2, day).getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const ds = `2026-03-${String(day).padStart(2, '0')}`;
    const daySpecials = specials[ds] || {};

    pids.forEach(pid => {
      const sp = daySpecials[pid];
      if (sp) {
        const needsTime = sp.status === 'Hadir' || sp.status === 'Dinas Luar';
        records.push({
          id: `A${ctr++}`,
          pegawaiId: pid,
          tanggal: ds,
          status: sp.status,
          ...(needsTime && sp.jamMasuk ? { jamMasuk: sp.jamMasuk } : {}),
          ...(needsTime && sp.jamKeluar ? { jamKeluar: sp.jamKeluar } : {}),
          ...(sp.keterangan ? { keterangan: sp.keterangan } : {}),
        });
      } else {
        // Deterministic variation for "Hadir"
        const n = parseInt(pid.slice(1));
        const seed = (n * 13 + day * 7) % 100;
        const isLate = seed < 12;
        const lateMin = (seed % 45) + 1;
        const earlyMin = (seed % 28) + 30;
        const jamMasuk = isLate
          ? `08:${String(lateMin).padStart(2, '0')}`
          : `07:${String(earlyMin).padStart(2, '0')}`;
        records.push({
          id: `A${ctr++}`,
          pegawaiId: pid,
          tanggal: ds,
          status: 'Hadir',
          jamMasuk,
          jamKeluar: '16:00',
        });
      }
    });
  }
  return records;
}

// Pre-compute initial absensi ONCE at module level (not inside the component)
const INITIAL_ABSENSI_DATA = generateInitialAbsensi();

// ─── Mock Data: Disiplin ───────────────────────────────────────────────────────
const initialDisiplin: DisiplinRecord[] = [
  {
    id: 'D001', pegawaiId: 'P008',
    jenisHukuman: 'Teguran Tertulis',
    tingkatHukuman: 'Ringan',
    tanggalKejadian: '2025-07-10',
    tanggalSK: '2025-07-25',
    nomorSK: 'SK/DISIPLIN/VII/2025/001',
    kronologi: 'Pegawai tidak hadir selama 3 hari berturut-turut tanpa keterangan resmi.',
    status: 'Selesai',
    pejabatPenetap: 'dr. Imam Ghozali, Sp.An., M.Kes',
  },
  {
    id: 'D002', pegawaiId: 'P012',
    jenisHukuman: 'Penundaan Kenaikan Gaji Berkala',
    tingkatHukuman: 'Sedang',
    tanggalKejadian: '2025-09-05',
    nomorSK: 'SK/DISIPLIN/IX/2025/002',
    kronologi: 'Pegawai terbukti tidak melaksanakan tugas yang menjadi tanggung jawabnya selama periode tertentu.',
    status: 'Proses',
    pejabatPenetap: 'Direktur Rumah Sakit',
  },
  {
    id: 'D003', pegawaiId: 'P015',
    jenisHukuman: 'Penurunan Pangkat',
    tingkatHukuman: 'Berat',
    tanggalKejadian: '2025-10-20',
    kronologi: 'Dugaan penyalahgunaan wewenang dalam pengadaan barang medis.',
    status: 'Investigasi',
  },
  {
    id: 'D004', pegawaiId: 'P005',
    jenisHukuman: 'Teguran Lisan',
    tingkatHukuman: 'Ringan',
    tanggalKejadian: '2025-11-15',
    tanggalSK: '2025-11-20',
    nomorSK: 'SK/DISIPLIN/XI/2025/003',
    kronologi: 'Pegawai terlambat lebih dari 10 kali dalam sebulan.',
    status: 'Selesai',
    pejabatPenetap: 'Kepala Instalasi Bedah Sentral',
  },
];

// ─── Mock Data: Diklat ────────────────────────────────────────────────────────
const initialDiklat: DiklatRecord[] = [
  {
    id: 'DK001', pegawaiId: 'P001',
    namaDiklat: 'Pelatihan Pengelolaan Kinerja ASN berbasis PermenPAN-RB 6/2022',
    jenisDiklat: 'Manajerial',
    penyelenggara: 'BPSDM Provinsi Lampung',
    tempatPelaksanaan: 'Bandung, Jawa Barat',
    tanggalMulai: '2025-08-04',
    tanggalSelesai: '2025-08-08',
    jumlahJP: 40,
    nomorSertifikat: 'SERT/BPSDM/VIII/2025/001',
    status: 'Selesai',
  },
  {
    id: 'DK002', pegawaiId: 'P002',
    namaDiklat: 'Pelatihan Teknis Kegawatdaruratan & BHD',
    jenisDiklat: 'Teknis',
    penyelenggara: 'Kemenkes RI – RSPAD Gatot Soebroto',
    tempatPelaksanaan: 'Jakarta',
    tanggalMulai: '2025-09-15',
    tanggalSelesai: '2025-09-19',
    jumlahJP: 45,
    nomorSertifikat: 'SERT/KEMENKES/IX/2025/112',
    status: 'Selesai',
  },
  {
    id: 'DK003', pegawaiId: 'P003',
    namaDiklat: 'Diklat Fungsional Perawat Ahli Muda',
    jenisDiklat: 'Fungsional',
    penyelenggara: 'Pusdiknakes Kemenkes',
    tempatPelaksanaan: 'Lampung',
    tanggalMulai: '2026-04-07',
    tanggalSelesai: '2026-04-25',
    jumlahJP: 120,
    status: 'Direncanakan',
  },
  {
    id: 'DK004', pegawaiId: 'P004',
    namaDiklat: 'Workshop Farmasi Klinik Rumah Sakit',
    jenisDiklat: 'Teknis',
    penyelenggara: 'Ikatan Apoteker Indonesia (IAI)',
    tempatPelaksanaan: 'Yogyakarta',
    tanggalMulai: '2025-10-20',
    tanggalSelesai: '2025-10-22',
    jumlahJP: 24,
    nomorSertifikat: 'SERT/IAI/X/2025/456',
    status: 'Selesai',
  },
  {
    id: 'DK005', pegawaiId: 'P006',
    namaDiklat: 'Pelatihan Kepemimpinan Tingkat III (PKT III)',
    jenisDiklat: 'Manajerial',
    penyelenggara: 'LAN RI',
    tempatPelaksanaan: 'Jakarta',
    tanggalMulai: '2026-03-10',
    tanggalSelesai: '2026-05-10',
    jumlahJP: 600,
    status: 'Berlangsung',
  },
  {
    id: 'DK006', pegawaiId: 'P007',
    namaDiklat: 'Pelatihan Analisis Laboratorium Klinik Lanjutan',
    jenisDiklat: 'Teknis',
    penyelenggara: 'RSUP Dr. Sardjito',
    tempatPelaksanaan: 'Yogyakarta',
    tanggalMulai: '2025-07-14',
    tanggalSelesai: '2025-07-18',
    jumlahJP: 40,
    nomorSertifikat: 'SERT/SARDJITO/VII/2025/034',
    status: 'Selesai',
  },
  {
    id: 'DK007', pegawaiId: 'P009',
    namaDiklat: 'Pelatihan Manajemen Rekam Medis Elektronik',
    jenisDiklat: 'Teknis',
    penyelenggara: 'PORMIKI',
    tempatPelaksanaan: 'Bandung',
    tanggalMulai: '2025-11-03',
    tanggalSelesai: '2025-11-07',
    jumlahJP: 40,
    nomorSertifikat: 'SERT/PORMIKI/XI/2025/089',
    status: 'Selesai',
  },
  {
    id: 'DK008', pegawaiId: 'P011',
    namaDiklat: 'Diklat Pra-Jabatan / Orientasi CPNS',
    jenisDiklat: 'Orientasi',
    penyelenggara: 'BKPSDM Kota Bandar Lampung',
    tempatPelaksanaan: 'Lampung',
    tanggalMulai: '2024-02-05',
    tanggalSelesai: '2024-02-23',
    jumlahJP: 100,
    nomorSertifikat: 'SERT/BKPSDM/II/2024/023',
    status: 'Selesai',
  },
];

// ─── Mock Users ───────────────────────────────────────────────────────────────
export const appUsers: AppUser[] = [
  { id: 'U001', username: 'admin', password: 'admin123', nama: 'dr. Imam Ghozali, Sp.An., M.Kes', role: 'admin', jabatan: 'Direktur Rumah Sakit', golongan: 'IV/b' },
  { id: 'U002', username: 'direktur', password: 'dir123', nama: 'dr. Imam Ghozali, Sp.An., M.Kes', role: 'direktur', jabatan: 'Direktur Rumah Sakit', pegawaiId: 'P001', golongan: 'IV/b' },
  { id: 'U003', username: 'kepala', password: 'kepala123', nama: 'dr. Asih Hendrastuti, M.Kes', role: 'kepala_unit', jabatan: 'Kepala Bidang Keperawatan', unitKerja: 'Bidang Keperawatan', pegawaiId: 'P012', golongan: 'IV/a' },
  { id: 'U004', username: 'pegawai', password: 'peg123', nama: 'Ns. Septi Kurniasari, M.Kep, Sp.KMB', role: 'pegawai', jabatan: 'Subkoordinator Substansi Bidang Keperawatan', unitKerja: 'Bidang Keperawatan', pegawaiId: 'P013', golongan: 'IV/a' },
  { id: 'U005', username: 'Rivelino.hasugian@gmail.com', password: 'Rivelin0', nama: 'Rivelino Hasugian', role: 'admin', jabatan: 'Administrator Sistem', golongan: 'III/d' },
  { id: 'U006', username: 'pipi@gmail.com', password: 'estehmanis', nama: 'Pipi Suryani', role: 'pegawai', jabatan: 'Staf Administrasi', unitKerja: 'Bagian Umum', pegawaiId: 'P050', golongan: 'III/a' },
  { id: 'U007', username: 'andiko@gmail.com', password: 'Andik0', nama: 'Andiko Pratama', role: 'admin', jabatan: 'Administrator Sistem', golongan: 'III/d' },
  { id: 'U008', username: 'nikky@gmail.com', password: 'N1kky', nama: 'Nikky Permata', role: 'admin', jabatan: 'Administrator Sistem', golongan: 'III/d' },
  { id: 'U009', username: 'bari@gmail.com', password: 'Bar1', nama: 'Bari Saputra', role: 'admin', jabatan: 'Administrator Sistem', golongan: 'III/d' },
  { id: 'U010', username: 'dev@gmail.com', password: 'dev', nama: 'Developer', role: 'admin', jabatan: 'Administrator Sistem', golongan: 'III/d' },
  { id: 'U011', username: 'gawai@gmail.com', password: 'Gaw4i2026', nama: 'Gawai User', role: 'admin', jabatan: 'Staff Operasional', golongan: 'III/c', excludedModules: ['pengaturan'] },
  { id: 'U011', username: 'manj.rsudam@gmail.com', password: 'rsudam123', nama: 'Executive', role: 'Executive', jabatan: 'Direktur', golongan: '-', excludedModules: ['pengaturan'] },
];

// ─── State Types ──────────────────────────────────────────────────────────────
interface AppState {
  pegawai: Pegawai[];
  cuti: CutiRecord[];
  absensi: AbsensiRecord[];
  skp: SKPRecord[];
  riwayatJabatan: RiwayatJabatan[];
  kenaikanPangkat: KenaikanPangkat[];
  disiplin: DisiplinRecord[];
  diklat: DiklatRecord[];
  str: STRRecord[];
  sip: SIPRecord[];
  credentialing: CredentialingRecord[];
  cpd: CPDRecord[];
  insidenK3RS: InsidenK3RS[];
  vaksinasi: VaksinasiRecord[];
  mcu: MCURecord[];
  slipGaji: SlipGaji[];
  jadwalShift: JadwalShift[];
  bpjs: BPJSRecord[];
  kontrak: KontrakRecord[];
  penghargaan: PenghargaanRecord[];
  mutasi: MutasiRecord[];
  anggotaKomite: AnggotaKomite[];
  kegiatanKomite: KegiatanKomite[];
  grievance: GrievanceRecord[];
  phk: PHKRecord[];
  currentUser: AppUser | null;
  isLoggedIn: boolean;
}

// ─── Actions ───────────────────────────��──────────────────────────────────────
type Action =
  | { type: 'LOGIN'; user: AppUser }
  | { type: 'LOGOUT' }
  // Pegawai CRUD
  | { type: 'ADD_PEGAWAI'; pegawai: Pegawai }
  | { type: 'UPDATE_PEGAWAI'; pegawai: Pegawai }
  | { type: 'DELETE_PEGAWAI'; id: string }
  // Cuti CRUD + approval
  | { type: 'ADD_CUTI'; cuti: CutiRecord }
  | { type: 'UPDATE_CUTI'; cuti: CutiRecord }
  | { type: 'DELETE_CUTI'; id: string }
  | { type: 'APPROVE_CUTI'; id: string; level: number; nama: string; catatan?: string }
  | { type: 'REJECT_CUTI'; id: string; level: number; nama: string; catatan?: string }
  // Absensi CRUD
  | { type: 'ADD_ABSENSI'; absensi: AbsensiRecord }
  | { type: 'UPDATE_ABSENSI'; absensi: AbsensiRecord }
  | { type: 'DELETE_ABSENSI'; id: string }
  | { type: 'BULK_INPUT_ABSENSI'; records: AbsensiRecord[] }
  // SKP CRUD
  | { type: 'ADD_SKP'; skp: SKPRecord }
  | { type: 'UPDATE_SKP'; skp: SKPRecord }
  | { type: 'DELETE_SKP'; id: string }
  // KP CRUD
  | { type: 'ADD_KP'; kp: KenaikanPangkat }
  | { type: 'UPDATE_KP'; kp: KenaikanPangkat }
  | { type: 'DELETE_KP'; id: string }
  // Disiplin CRUD
  | { type: 'ADD_DISIPLIN'; disiplin: DisiplinRecord }
  | { type: 'UPDATE_DISIPLIN'; disiplin: DisiplinRecord }
  | { type: 'DELETE_DISIPLIN'; id: string }
  // Diklat CRUD
  | { type: 'ADD_DIKLAT'; diklat: DiklatRecord }
  | { type: 'UPDATE_DIKLAT'; diklat: DiklatRecord }
  | { type: 'DELETE_DIKLAT'; id: string }
  // Riwayat Jabatan CRUD
  | { type: 'ADD_RIWAYAT_JABATAN'; rj: RiwayatJabatan }
  | { type: 'UPDATE_RIWAYAT_JABATAN'; rj: RiwayatJabatan }
  | { type: 'DELETE_RIWAYAT_JABATAN'; id: string }
  | { type: 'ADD_STR'; str: STRRecord }
  | { type: 'UPDATE_STR'; str: STRRecord }
  | { type: 'DELETE_STR'; id: string }
  | { type: 'ADD_SIP'; sip: SIPRecord }
  | { type: 'UPDATE_SIP'; sip: SIPRecord }
  | { type: 'DELETE_SIP'; id: string }
  | { type: 'ADD_CREDENTIALING'; cr: CredentialingRecord }
  | { type: 'UPDATE_CREDENTIALING'; cr: CredentialingRecord }
  | { type: 'DELETE_CREDENTIALING'; id: string }
  | { type: 'ADD_CPD'; cpd: CPDRecord }
  | { type: 'UPDATE_CPD'; cpd: CPDRecord }
  | { type: 'DELETE_CPD'; id: string }
  | { type: 'ADD_INSIDEN'; insiden: InsidenK3RS }
  | { type: 'UPDATE_INSIDEN'; insiden: InsidenK3RS }
  | { type: 'DELETE_INSIDEN'; id: string }
  | { type: 'ADD_VAKSINASI'; vak: VaksinasiRecord }
  | { type: 'UPDATE_VAKSINASI'; vak: VaksinasiRecord }
  | { type: 'DELETE_VAKSINASI'; id: string }
  | { type: 'ADD_MCU'; mcu: MCURecord }
  | { type: 'UPDATE_MCU'; mcu: MCURecord }
  | { type: 'DELETE_MCU'; id: string }
  | { type: 'ADD_SLIP_GAJI'; slip: SlipGaji }
  | { type: 'UPDATE_SLIP_GAJI'; slip: SlipGaji }
  | { type: 'DELETE_SLIP_GAJI'; id: string }
  | { type: 'ADD_JADWAL'; jadwal: JadwalShift }
  | { type: 'UPDATE_JADWAL'; jadwal: JadwalShift }
  | { type: 'DELETE_JADWAL'; id: string }
  | { type: 'ADD_BPJS'; bpjs: BPJSRecord }
  | { type: 'UPDATE_BPJS'; bpjs: BPJSRecord }
  | { type: 'DELETE_BPJS'; id: string }
  | { type: 'ADD_KONTRAK'; kontrak: KontrakRecord }
  | { type: 'UPDATE_KONTRAK'; kontrak: KontrakRecord }
  | { type: 'DELETE_KONTRAK'; id: string }
  | { type: 'ADD_PENGHARGAAN'; ph: PenghargaanRecord }
  | { type: 'UPDATE_PENGHARGAAN'; ph: PenghargaanRecord }
  | { type: 'DELETE_PENGHARGAAN'; id: string }
  | { type: 'ADD_MUTASI'; mutasi: MutasiRecord }
  | { type: 'UPDATE_MUTASI'; mutasi: MutasiRecord }
  | { type: 'DELETE_MUTASI'; id: string }
  | { type: 'ADD_ANGGOTA_KOMITE'; ak: AnggotaKomite }
  | { type: 'UPDATE_ANGGOTA_KOMITE'; ak: AnggotaKomite }
  | { type: 'DELETE_ANGGOTA_KOMITE'; id: string }
  | { type: 'ADD_KEGIATAN_KOMITE'; kk: KegiatanKomite }
  | { type: 'UPDATE_KEGIATAN_KOMITE'; kk: KegiatanKomite }
  | { type: 'DELETE_KEGIATAN_KOMITE'; id: string }
  | { type: 'ADD_GRIEVANCE'; gr: GrievanceRecord }
  | { type: 'UPDATE_GRIEVANCE'; gr: GrievanceRecord }
  | { type: 'DELETE_GRIEVANCE'; id: string }
  | { type: 'ADD_PHK'; phk: PHKRecord }
  | { type: 'UPDATE_PHK'; phk: PHKRecord }
  | { type: 'DELETE_PHK'; id: string };

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.user, isLoggedIn: true };
    case 'LOGOUT':
      return { ...state, currentUser: null, isLoggedIn: false };

    // Pegawai
    case 'ADD_PEGAWAI':
      return { ...state, pegawai: [...state.pegawai, action.pegawai] };
    case 'UPDATE_PEGAWAI':
      return { ...state, pegawai: state.pegawai.map(p => p.id === action.pegawai.id ? action.pegawai : p) };
    case 'DELETE_PEGAWAI':
      return { ...state, pegawai: state.pegawai.filter(p => p.id !== action.id) };

    // Cuti
    case 'ADD_CUTI':
      return { ...state, cuti: [...state.cuti, action.cuti] };
    case 'UPDATE_CUTI':
      return { ...state, cuti: state.cuti.map(c => c.id === action.cuti.id ? action.cuti : c) };
    case 'DELETE_CUTI':
      return { ...state, cuti: state.cuti.filter(c => c.id !== action.id) };
    case 'APPROVE_CUTI': {
      return {
        ...state,
        cuti: state.cuti.map(c => {
          if (c.id !== action.id) return c;
          const levels = (c.approvalLevels || []).map(l =>
            l.level === action.level
              ? { ...l, status: 'Disetujui' as const, nama: action.nama, tanggal: new Date().toISOString().split('T')[0], catatan: action.catatan }
              : l
          );
          const allApproved = levels.every(l => l.status === 'Disetujui');
          const nextLevel = action.level + 1;
          return {
            ...c,
            approvalLevels: levels,
            currentLevel: allApproved ? action.level : nextLevel,
            status: allApproved ? 'Disetujui' as const : 'Pending' as const,
            disetujuiOleh: allApproved ? action.nama : c.disetujuiOleh,
          };
        }),
      };
    }
    case 'REJECT_CUTI': {
      return {
        ...state,
        cuti: state.cuti.map(c => {
          if (c.id !== action.id) return c;
          const levels = (c.approvalLevels || []).map(l =>
            l.level === action.level
              ? { ...l, status: 'Ditolak' as const, nama: action.nama, tanggal: new Date().toISOString().split('T')[0], catatan: action.catatan }
              : l
          );
          return { ...c, approvalLevels: levels, status: 'Ditolak' as const };
        }),
      };
    }

    // Absensi
    case 'ADD_ABSENSI':
      return { ...state, absensi: [...state.absensi, action.absensi] };
    case 'UPDATE_ABSENSI':
      return { ...state, absensi: state.absensi.map(a => a.id === action.absensi.id ? action.absensi : a) };
    case 'DELETE_ABSENSI':
      return { ...state, absensi: state.absensi.filter(a => a.id !== action.id) };
    case 'BULK_INPUT_ABSENSI': {
      const newDates = new Set(action.records.map(r => r.tanggal));
      const kept = state.absensi.filter(a => !newDates.has(a.tanggal));
      return { ...state, absensi: [...kept, ...action.records] };
    }

    // SKP
    case 'ADD_SKP':
      return { ...state, skp: [...state.skp, action.skp] };
    case 'UPDATE_SKP':
      return { ...state, skp: state.skp.map(s => s.id === action.skp.id ? action.skp : s) };
    case 'DELETE_SKP':
      return { ...state, skp: state.skp.filter(s => s.id !== action.id) };

    // KP
    case 'ADD_KP':
      return { ...state, kenaikanPangkat: [...state.kenaikanPangkat, action.kp] };
    case 'UPDATE_KP':
      return { ...state, kenaikanPangkat: state.kenaikanPangkat.map(k => k.id === action.kp.id ? action.kp : k) };
    case 'DELETE_KP':
      return { ...state, kenaikanPangkat: state.kenaikanPangkat.filter(k => k.id !== action.id) };

    // Disiplin
    case 'ADD_DISIPLIN':
      return { ...state, disiplin: [...state.disiplin, action.disiplin] };
    case 'UPDATE_DISIPLIN':
      return { ...state, disiplin: state.disiplin.map(d => d.id === action.disiplin.id ? action.disiplin : d) };
    case 'DELETE_DISIPLIN':
      return { ...state, disiplin: state.disiplin.filter(d => d.id !== action.id) };

    // Diklat
    case 'ADD_DIKLAT':
      return { ...state, diklat: [...state.diklat, action.diklat] };
    case 'UPDATE_DIKLAT':
      return { ...state, diklat: state.diklat.map(d => d.id === action.diklat.id ? action.diklat : d) };
    case 'DELETE_DIKLAT':
      return { ...state, diklat: state.diklat.filter(d => d.id !== action.id) };

    // Riwayat Jabatan
    case 'ADD_RIWAYAT_JABATAN':
      return { ...state, riwayatJabatan: [...state.riwayatJabatan, action.rj] };
    case 'UPDATE_RIWAYAT_JABATAN':
      return { ...state, riwayatJabatan: state.riwayatJabatan.map(r => r.id === action.rj.id ? action.rj : r) };
    case 'DELETE_RIWAYAT_JABATAN':
      return { ...state, riwayatJabatan: state.riwayatJabatan.filter(r => r.id !== action.id) };

    // STR
    case 'ADD_STR':
      return { ...state, str: [...state.str, action.str] };
    case 'UPDATE_STR':
      return { ...state, str: state.str.map(s => s.id === action.str.id ? action.str : s) };
    case 'DELETE_STR':
      return { ...state, str: state.str.filter(s => s.id !== action.id) };

    // SIP
    case 'ADD_SIP':
      return { ...state, sip: [...state.sip, action.sip] };
    case 'UPDATE_SIP':
      return { ...state, sip: state.sip.map(s => s.id === action.sip.id ? action.sip : s) };
    case 'DELETE_SIP':
      return { ...state, sip: state.sip.filter(s => s.id !== action.id) };

    // Credentialing
    case 'ADD_CREDENTIALING':
      return { ...state, credentialing: [...state.credentialing, action.cr] };
    case 'UPDATE_CREDENTIALING':
      return { ...state, credentialing: state.credentialing.map(c => c.id === action.cr.id ? action.cr : c) };
    case 'DELETE_CREDENTIALING':
      return { ...state, credentialing: state.credentialing.filter(c => c.id !== action.id) };

    // CPD
    case 'ADD_CPD': return { ...state, cpd: [...state.cpd, action.cpd] };
    case 'UPDATE_CPD': return { ...state, cpd: state.cpd.map(c => c.id === action.cpd.id ? action.cpd : c) };
    case 'DELETE_CPD': return { ...state, cpd: state.cpd.filter(c => c.id !== action.id) };
    // K3RS
    case 'ADD_INSIDEN': return { ...state, insidenK3RS: [...state.insidenK3RS, action.insiden] };
    case 'UPDATE_INSIDEN': return { ...state, insidenK3RS: state.insidenK3RS.map(i => i.id === action.insiden.id ? action.insiden : i) };
    case 'DELETE_INSIDEN': return { ...state, insidenK3RS: state.insidenK3RS.filter(i => i.id !== action.id) };
    case 'ADD_VAKSINASI': return { ...state, vaksinasi: [...state.vaksinasi, action.vak] };
    case 'UPDATE_VAKSINASI': return { ...state, vaksinasi: state.vaksinasi.map(v => v.id === action.vak.id ? action.vak : v) };
    case 'DELETE_VAKSINASI': return { ...state, vaksinasi: state.vaksinasi.filter(v => v.id !== action.id) };
    case 'ADD_MCU': return { ...state, mcu: [...state.mcu, action.mcu] };
    case 'UPDATE_MCU': return { ...state, mcu: state.mcu.map(m => m.id === action.mcu.id ? action.mcu : m) };
    case 'DELETE_MCU': return { ...state, mcu: state.mcu.filter(m => m.id !== action.id) };
    // Penggajian
    case 'ADD_SLIP_GAJI': return { ...state, slipGaji: [...state.slipGaji, action.slip] };
    case 'UPDATE_SLIP_GAJI': return { ...state, slipGaji: state.slipGaji.map(s => s.id === action.slip.id ? action.slip : s) };
    case 'DELETE_SLIP_GAJI': return { ...state, slipGaji: state.slipGaji.filter(s => s.id !== action.id) };
    // Jadwal
    case 'ADD_JADWAL': return { ...state, jadwalShift: [...state.jadwalShift, action.jadwal] };
    case 'UPDATE_JADWAL': return { ...state, jadwalShift: state.jadwalShift.map(j => j.id === action.jadwal.id ? action.jadwal : j) };
    case 'DELETE_JADWAL': return { ...state, jadwalShift: state.jadwalShift.filter(j => j.id !== action.id) };
    // BPJS
    case 'ADD_BPJS': return { ...state, bpjs: [...state.bpjs, action.bpjs] };
    case 'UPDATE_BPJS': return { ...state, bpjs: state.bpjs.map(b => b.id === action.bpjs.id ? action.bpjs : b) };
    case 'DELETE_BPJS': return { ...state, bpjs: state.bpjs.filter(b => b.id !== action.id) };
    // Kontrak
    case 'ADD_KONTRAK': return { ...state, kontrak: [...state.kontrak, action.kontrak] };
    case 'UPDATE_KONTRAK': return { ...state, kontrak: state.kontrak.map(k => k.id === action.kontrak.id ? action.kontrak : k) };
    case 'DELETE_KONTRAK': return { ...state, kontrak: state.kontrak.filter(k => k.id !== action.id) };
    // Penghargaan
    case 'ADD_PENGHARGAAN': return { ...state, penghargaan: [...state.penghargaan, action.ph] };
    case 'UPDATE_PENGHARGAAN': return { ...state, penghargaan: state.penghargaan.map(p => p.id === action.ph.id ? action.ph : p) };
    case 'DELETE_PENGHARGAAN': return { ...state, penghargaan: state.penghargaan.filter(p => p.id !== action.id) };
    // Mutasi
    case 'ADD_MUTASI': return { ...state, mutasi: [...state.mutasi, action.mutasi] };
    case 'UPDATE_MUTASI': return { ...state, mutasi: state.mutasi.map(m => m.id === action.mutasi.id ? action.mutasi : m) };
    case 'DELETE_MUTASI': return { ...state, mutasi: state.mutasi.filter(m => m.id !== action.id) };
    // Komite
    case 'ADD_ANGGOTA_KOMITE': return { ...state, anggotaKomite: [...state.anggotaKomite, action.ak] };
    case 'UPDATE_ANGGOTA_KOMITE': return { ...state, anggotaKomite: state.anggotaKomite.map(a => a.id === action.ak.id ? action.ak : a) };
    case 'DELETE_ANGGOTA_KOMITE': return { ...state, anggotaKomite: state.anggotaKomite.filter(a => a.id !== action.id) };
    case 'ADD_KEGIATAN_KOMITE': return { ...state, kegiatanKomite: [...state.kegiatanKomite, action.kk] };
    case 'UPDATE_KEGIATAN_KOMITE': return { ...state, kegiatanKomite: state.kegiatanKomite.map(k => k.id === action.kk.id ? action.kk : k) };
    case 'DELETE_KEGIATAN_KOMITE': return { ...state, kegiatanKomite: state.kegiatanKomite.filter(k => k.id !== action.id) };
    // Hubungan Industrial
    case 'ADD_GRIEVANCE': return { ...state, grievance: [...state.grievance, action.gr] };
    case 'UPDATE_GRIEVANCE': return { ...state, grievance: state.grievance.map(g => g.id === action.gr.id ? action.gr : g) };
    case 'DELETE_GRIEVANCE': return { ...state, grievance: state.grievance.filter(g => g.id !== action.id) };
    case 'ADD_PHK': return { ...state, phk: [...state.phk, action.phk] };
    case 'UPDATE_PHK': return { ...state, phk: state.phk.map(p => p.id === action.phk.id ? action.phk : p) };
    case 'DELETE_PHK': return { ...state, phk: state.phk.filter(p => p.id !== action.id) };

    default:
      return state;
  }
}

// ─── Context Value Interface ──────────────────────────────────────────────────
interface AppContextValue extends AppState {
  dispatch: React.Dispatch<Action>;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addPegawai: (p: Omit<Pegawai, 'id'>) => void;
  updatePegawai: (p: Pegawai) => void;
  deletePegawai: (id: string) => void;
  addCuti: (c: Omit<CutiRecord, 'id'>) => void;
  updateCuti: (c: CutiRecord) => void;
  deleteCuti: (id: string) => void;
  approveCuti: (id: string, level: number, nama: string, catatan?: string) => void;
  rejectCuti: (id: string, level: number, nama: string, catatan?: string) => void;
  addAbsensi: (a: Omit<AbsensiRecord, 'id'>) => void;
  updateAbsensi: (a: AbsensiRecord) => void;
  deleteAbsensi: (id: string) => void;
  bulkInputAbsensi: (records: Omit<AbsensiRecord, 'id'>[]) => void;
  addSKP: (s: Omit<SKPRecord, 'id'>) => void;
  updateSKP: (s: SKPRecord) => void;
  deleteSKP: (id: string) => void;
  addKP: (k: Omit<KenaikanPangkat, 'id'>) => void;
  updateKP: (k: KenaikanPangkat) => void;
  deleteKP: (id: string) => void;
  addDisiplin: (d: Omit<DisiplinRecord, 'id'>) => void;
  updateDisiplin: (d: DisiplinRecord) => void;
  deleteDisiplin: (id: string) => void;
  addDiklat: (d: Omit<DiklatRecord, 'id'>) => void;
  updateDiklat: (d: DiklatRecord) => void;
  deleteDiklat: (id: string) => void;
  addRiwayatJabatan: (r: Omit<RiwayatJabatan, 'id'>) => void;
  updateRiwayatJabatan: (r: RiwayatJabatan) => void;
  deleteRiwayatJabatan: (id: string) => void;
  addSTR: (s: Omit<STRRecord, 'id'>) => void;
  updateSTR: (s: STRRecord) => void;
  deleteSTR: (id: string) => void;
  addSIP: (s: Omit<SIPRecord, 'id'>) => void;
  updateSIP: (s: SIPRecord) => void;
  deleteSIP: (id: string) => void;
  addCredentialing: (c: Omit<CredentialingRecord, 'id'>) => void;
  updateCredentialing: (c: CredentialingRecord) => void;
  deleteCredentialing: (id: string) => void;
  addCPD: (c: Omit<CPDRecord, 'id'>) => void;
  updateCPD: (c: CPDRecord) => void;
  deleteCPD: (id: string) => void;
  addInsiden: (i: Omit<InsidenK3RS, 'id'>) => void;
  updateInsiden: (i: InsidenK3RS) => void;
  deleteInsiden: (id: string) => void;
  addVaksinasi: (v: Omit<VaksinasiRecord, 'id'>) => void;
  updateVaksinasi: (v: VaksinasiRecord) => void;
  deleteVaksinasi: (id: string) => void;
  addMCU: (m: Omit<MCURecord, 'id'>) => void;
  updateMCU: (m: MCURecord) => void;
  deleteMCU: (id: string) => void;
  addSlipGaji: (s: Omit<SlipGaji, 'id'>) => void;
  updateSlipGaji: (s: SlipGaji) => void;
  deleteSlipGaji: (id: string) => void;
  addJadwal: (j: Omit<JadwalShift, 'id'>) => void;
  updateJadwal: (j: JadwalShift) => void;
  deleteJadwal: (id: string) => void;
  addBPJS: (b: Omit<BPJSRecord, 'id'>) => void;
  updateBPJS: (b: BPJSRecord) => void;
  deleteBPJS: (id: string) => void;
  addKontrak: (k: Omit<KontrakRecord, 'id'>) => void;
  updateKontrak: (k: KontrakRecord) => void;
  deleteKontrak: (id: string) => void;
  addPenghargaan: (p: Omit<PenghargaanRecord, 'id'>) => void;
  updatePenghargaan: (p: PenghargaanRecord) => void;
  deletePenghargaan: (id: string) => void;
  addMutasi: (m: Omit<MutasiRecord, 'id'>) => void;
  updateMutasi: (m: MutasiRecord) => void;
  deleteMutasi: (id: string) => void;
  addAnggotaKomite: (a: Omit<AnggotaKomite, 'id'>) => void;
  updateAnggotaKomite: (a: AnggotaKomite) => void;
  deleteAnggotaKomite: (id: string) => void;
  addKegiatanKomite: (k: Omit<KegiatanKomite, 'id'>) => void;
  updateKegiatanKomite: (k: KegiatanKomite) => void;
  deleteKegiatanKomite: (id: string) => void;
  addGrievance: (g: Omit<GrievanceRecord, 'id'>) => void;
  updateGrievance: (g: GrievanceRecord) => void;
  deleteGrievance: (id: string) => void;
  addPHK: (p: Omit<PHKRecord, 'id'>) => void;
  updatePHK: (p: PHKRecord) => void;
  deletePHK: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
// Use a stable globalThis singleton so HMR hot-reloads don't create a new
// context object (which would cause Provider / Consumer reference mismatch).
type AppCtxType = React.Context<AppContextValue | null>;
const AppContext: AppCtxType =
  (globalThis as Record<string, unknown>).__hrAppCtx as AppCtxType ??
  (() => {
    const ctx = createContext<AppContextValue | null>(null);
    (globalThis as Record<string, unknown>).__hrAppCtx = ctx;
    return ctx;
  })();

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Enrich cuti data with multi-level approval structure
  const enrichedCuti: CutiRecord[] = initialCuti.map(c => ({
    ...c,
    currentLevel: c.status === 'Pending' ? 1 : c.status === 'Disetujui' ? 2 : 0,
    approvalLevels: [
      {
        level: 1,
        jabatan: 'Kepala Unit Kerja',
        nama: c.status !== 'Pending' ? 'dr. Surya Puspa Dewi, MARS' : '',
        status: c.status === 'Pending' ? 'Pending' as const : 'Disetujui' as const,
        tanggal: c.status !== 'Pending' ? c.tanggalPengajuan : undefined,
      },
      {
        level: 2,
        jabatan: 'Direktur RSUD',
        nama: c.status === 'Disetujui' ? 'dr. Imam Ghozali, Sp.An., M.Kes' : '',
        status: c.status === 'Disetujui' ? 'Disetujui' as const : c.status === 'Ditolak' ? 'Ditolak' as const : 'Pending' as const,
        tanggal: c.status === 'Disetujui' ? c.tanggalPengajuan : undefined,
      },
    ],
  }));

  const savedUser = (() => {
    try {
      const saved = localStorage.getItem('hr_app_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Validasi: pastikan user masih ada di daftar appUsers
      const matched = appUsers.find(u => u.id === parsed.id && u.username === parsed.username);
      if (matched) {
        // Perbarui data dari daftar terbaru (misal: excludedModules baru ditambahkan)
        localStorage.setItem('hr_app_user', JSON.stringify(matched));
        return matched;
      }
      // User tidak cocok lagi, hapus data lama
      localStorage.removeItem('hr_app_user');
      return null;
    } catch {
      localStorage.removeItem('hr_app_user');
      return null;
    }
  })();

  const [state, dispatch] = useReducer(reducer, {
    pegawai: initialPegawai,
    cuti: enrichedCuti,
    absensi: INITIAL_ABSENSI_DATA,
    skp: initialSKP,
    riwayatJabatan: initialRiwayatJabatan,
    kenaikanPangkat: initialKenaikanPangkat,
    disiplin: initialDisiplin,
    diklat: initialDiklat,
    str: initialSTR,
    sip: initialSIP,
    credentialing: initialCredentialing,
    cpd: initialCPD as CPDRecord[],
    insidenK3RS: initialInsidenK3RS as InsidenK3RS[],
    vaksinasi: initialVaksinasi as VaksinasiRecord[],
    mcu: initialMCU as MCURecord[],
    slipGaji: initialSlipGaji as SlipGaji[],
    jadwalShift: initialJadwalShift as JadwalShift[],
    bpjs: initialBPJS as BPJSRecord[],
    kontrak: initialKontrak as KontrakRecord[],
    penghargaan: initialPenghargaan as PenghargaanRecord[],
    mutasi: initialMutasi as MutasiRecord[],
    anggotaKomite: initialAnggotaKomite as AnggotaKomite[],
    kegiatanKomite: initialKegiatanKomite as KegiatanKomite[],
    grievance: initialGrievance as GrievanceRecord[],
    phk: initialPHK as PHKRecord[],
    currentUser: savedUser,
    isLoggedIn: !!savedUser,
  });

  const login = useCallback((username: string, password: string) => {
    const user = appUsers.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem('hr_app_user', JSON.stringify(user));
      dispatch({ type: 'LOGIN', user });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hr_app_user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const genId = (prefix: string) => `${prefix}${Date.now()}`;

  const addPegawai = useCallback((p: Omit<Pegawai, 'id'>) => dispatch({ type: 'ADD_PEGAWAI', pegawai: { ...p, id: genId('P') } }), []);
  const updatePegawai = useCallback((p: Pegawai) => dispatch({ type: 'UPDATE_PEGAWAI', pegawai: p }), []);
  const deletePegawai = useCallback((id: string) => dispatch({ type: 'DELETE_PEGAWAI', id }), []);

  const addCuti = useCallback((c: Omit<CutiRecord, 'id'>) => {
    const id = genId('C');
    dispatch({
      type: 'ADD_CUTI', cuti: {
        ...c, id,
        currentLevel: 1,
        approvalLevels: [
          { level: 1, jabatan: 'Kepala Unit Kerja', nama: '', status: 'Pending' },
          { level: 2, jabatan: 'Direktur RSUD', nama: '', status: 'Pending' },
        ],
      }
    });
  }, []);
  const updateCuti = useCallback((c: CutiRecord) => dispatch({ type: 'UPDATE_CUTI', cuti: c }), []);
  const deleteCuti = useCallback((id: string) => dispatch({ type: 'DELETE_CUTI', id }), []);
  const approveCuti = useCallback((id: string, level: number, nama: string, catatan?: string) => dispatch({ type: 'APPROVE_CUTI', id, level, nama, catatan }), []);
  const rejectCuti = useCallback((id: string, level: number, nama: string, catatan?: string) => dispatch({ type: 'REJECT_CUTI', id, level, nama, catatan }), []);

  // Absensi CRUD
  const addAbsensi = useCallback((a: Omit<AbsensiRecord, 'id'>) => dispatch({ type: 'ADD_ABSENSI', absensi: { ...a, id: genId('AB') } }), []);
  const updateAbsensi = useCallback((a: AbsensiRecord) => dispatch({ type: 'UPDATE_ABSENSI', absensi: a }), []);
  const deleteAbsensi = useCallback((id: string) => dispatch({ type: 'DELETE_ABSENSI', id }), []);
  const bulkInputAbsensi = useCallback((records: Omit<AbsensiRecord, 'id'>[]) => {
    const withIds: AbsensiRecord[] = records.map((r, i) => ({ ...r, id: `AB${Date.now()}${i}` }));
    dispatch({ type: 'BULK_INPUT_ABSENSI', records: withIds });
  }, []);

  const addSKP = useCallback((s: Omit<SKPRecord, 'id'>) => dispatch({ type: 'ADD_SKP', skp: { ...s, id: genId('S') } }), []);
  const updateSKP = useCallback((s: SKPRecord) => dispatch({ type: 'UPDATE_SKP', skp: s }), []);
  const deleteSKP = useCallback((id: string) => dispatch({ type: 'DELETE_SKP', id }), []);

  const addKP = useCallback((k: Omit<KenaikanPangkat, 'id'>) => dispatch({ type: 'ADD_KP', kp: { ...k, id: genId('K') } }), []);
  const updateKP = useCallback((k: KenaikanPangkat) => dispatch({ type: 'UPDATE_KP', kp: k }), []);
  const deleteKP = useCallback((id: string) => dispatch({ type: 'DELETE_KP', id }), []);

  const addDisiplin = useCallback((d: Omit<DisiplinRecord, 'id'>) => dispatch({ type: 'ADD_DISIPLIN', disiplin: { ...d, id: genId('DS') } }), []);
  const updateDisiplin = useCallback((d: DisiplinRecord) => dispatch({ type: 'UPDATE_DISIPLIN', disiplin: d }), []);
  const deleteDisiplin = useCallback((id: string) => dispatch({ type: 'DELETE_DISIPLIN', id }), []);

  const addDiklat = useCallback((d: Omit<DiklatRecord, 'id'>) => dispatch({ type: 'ADD_DIKLAT', diklat: { ...d, id: genId('DK') } }), []);
  const updateDiklat = useCallback((d: DiklatRecord) => dispatch({ type: 'UPDATE_DIKLAT', diklat: d }), []);
  const deleteDiklat = useCallback((id: string) => dispatch({ type: 'DELETE_DIKLAT', id }), []);

  const addRiwayatJabatan = useCallback((r: Omit<RiwayatJabatan, 'id'>) => dispatch({ type: 'ADD_RIWAYAT_JABATAN', rj: { ...r, id: genId('RJ') } }), []);
  const updateRiwayatJabatan = useCallback((r: RiwayatJabatan) => dispatch({ type: 'UPDATE_RIWAYAT_JABATAN', rj: r }), []);
  const deleteRiwayatJabatan = useCallback((id: string) => dispatch({ type: 'DELETE_RIWAYAT_JABATAN', id }), []);
  const addSTR = useCallback((s: Omit<STRRecord, 'id'>) => dispatch({ type: 'ADD_STR', str: { ...s, id: genId('STR') } }), []);
  const updateSTR = useCallback((s: STRRecord) => dispatch({ type: 'UPDATE_STR', str: s }), []);
  const deleteSTR = useCallback((id: string) => dispatch({ type: 'DELETE_STR', id }), []);
  const addSIP = useCallback((s: Omit<SIPRecord, 'id'>) => dispatch({ type: 'ADD_SIP', sip: { ...s, id: genId('SIP') } }), []);
  const updateSIP = useCallback((s: SIPRecord) => dispatch({ type: 'UPDATE_SIP', sip: s }), []);
  const deleteSIP = useCallback((id: string) => dispatch({ type: 'DELETE_SIP', id }), []);
  const addCredentialing = useCallback((c: Omit<CredentialingRecord, 'id'>) => dispatch({ type: 'ADD_CREDENTIALING', cr: { ...c, id: genId('CR') } }), []);
  const updateCredentialing = useCallback((c: CredentialingRecord) => dispatch({ type: 'UPDATE_CREDENTIALING', cr: c }), []);
  const deleteCredentialing = useCallback((id: string) => dispatch({ type: 'DELETE_CREDENTIALING', id }), []);
  const addCPD = useCallback((c: Omit<CPDRecord, 'id'>) => dispatch({ type: 'ADD_CPD', cpd: { ...c, id: genId('CPD') } }), []);
  const updateCPD = useCallback((c: CPDRecord) => dispatch({ type: 'UPDATE_CPD', cpd: c }), []);
  const deleteCPD = useCallback((id: string) => dispatch({ type: 'DELETE_CPD', id }), []);
  const addInsiden = useCallback((i: Omit<InsidenK3RS, 'id'>) => dispatch({ type: 'ADD_INSIDEN', insiden: { ...i, id: genId('IK') } }), []);
  const updateInsiden = useCallback((i: InsidenK3RS) => dispatch({ type: 'UPDATE_INSIDEN', insiden: i }), []);
  const deleteInsiden = useCallback((id: string) => dispatch({ type: 'DELETE_INSIDEN', id }), []);
  const addVaksinasi = useCallback((v: Omit<VaksinasiRecord, 'id'>) => dispatch({ type: 'ADD_VAKSINASI', vak: { ...v, id: genId('VAK') } }), []);
  const updateVaksinasi = useCallback((v: VaksinasiRecord) => dispatch({ type: 'UPDATE_VAKSINASI', vak: v }), []);
  const deleteVaksinasi = useCallback((id: string) => dispatch({ type: 'DELETE_VAKSINASI', id }), []);
  const addMCU = useCallback((m: Omit<MCURecord, 'id'>) => dispatch({ type: 'ADD_MCU', mcu: { ...m, id: genId('MCU') } }), []);
  const updateMCU = useCallback((m: MCURecord) => dispatch({ type: 'UPDATE_MCU', mcu: m }), []);
  const deleteMCU = useCallback((id: string) => dispatch({ type: 'DELETE_MCU', id }), []);
  const addSlipGaji = useCallback((s: Omit<SlipGaji, 'id'>) => dispatch({ type: 'ADD_SLIP_GAJI', slip: { ...s, id: genId('SG') } }), []);
  const updateSlipGaji = useCallback((s: SlipGaji) => dispatch({ type: 'UPDATE_SLIP_GAJI', slip: s }), []);
  const deleteSlipGaji = useCallback((id: string) => dispatch({ type: 'DELETE_SLIP_GAJI', id }), []);
  const addJadwal = useCallback((j: Omit<JadwalShift, 'id'>) => dispatch({ type: 'ADD_JADWAL', jadwal: { ...j, id: genId('JS') } }), []);
  const updateJadwal = useCallback((j: JadwalShift) => dispatch({ type: 'UPDATE_JADWAL', jadwal: j }), []);
  const deleteJadwal = useCallback((id: string) => dispatch({ type: 'DELETE_JADWAL', id }), []);
  const addBPJS = useCallback((b: Omit<BPJSRecord, 'id'>) => dispatch({ type: 'ADD_BPJS', bpjs: { ...b, id: genId('BPJS') } }), []);
  const updateBPJS = useCallback((b: BPJSRecord) => dispatch({ type: 'UPDATE_BPJS', bpjs: b }), []);
  const deleteBPJS = useCallback((id: string) => dispatch({ type: 'DELETE_BPJS', id }), []);
  const addKontrak = useCallback((k: Omit<KontrakRecord, 'id'>) => dispatch({ type: 'ADD_KONTRAK', kontrak: { ...k, id: genId('KK') } }), []);
  const updateKontrak = useCallback((k: KontrakRecord) => dispatch({ type: 'UPDATE_KONTRAK', kontrak: k }), []);
  const deleteKontrak = useCallback((id: string) => dispatch({ type: 'DELETE_KONTRAK', id }), []);
  const addPenghargaan = useCallback((p: Omit<PenghargaanRecord, 'id'>) => dispatch({ type: 'ADD_PENGHARGAAN', ph: { ...p, id: genId('PH') } }), []);
  const updatePenghargaan = useCallback((p: PenghargaanRecord) => dispatch({ type: 'UPDATE_PENGHARGAAN', ph: p }), []);
  const deletePenghargaan = useCallback((id: string) => dispatch({ type: 'DELETE_PENGHARGAAN', id }), []);
  const addMutasi = useCallback((m: Omit<MutasiRecord, 'id'>) => dispatch({ type: 'ADD_MUTASI', mutasi: { ...m, id: genId('MT') } }), []);
  const updateMutasi = useCallback((m: MutasiRecord) => dispatch({ type: 'UPDATE_MUTASI', mutasi: m }), []);
  const deleteMutasi = useCallback((id: string) => dispatch({ type: 'DELETE_MUTASI', id }), []);
  const addAnggotaKomite = useCallback((a: Omit<AnggotaKomite, 'id'>) => dispatch({ type: 'ADD_ANGGOTA_KOMITE', ak: { ...a, id: genId('AK') } }), []);
  const updateAnggotaKomite = useCallback((a: AnggotaKomite) => dispatch({ type: 'UPDATE_ANGGOTA_KOMITE', ak: a }), []);
  const deleteAnggotaKomite = useCallback((id: string) => dispatch({ type: 'DELETE_ANGGOTA_KOMITE', id }), []);
  const addKegiatanKomite = useCallback((k: Omit<KegiatanKomite, 'id'>) => dispatch({ type: 'ADD_KEGIATAN_KOMITE', kk: { ...k, id: genId('KKG') } }), []);
  const updateKegiatanKomite = useCallback((k: KegiatanKomite) => dispatch({ type: 'UPDATE_KEGIATAN_KOMITE', kk: k }), []);
  const deleteKegiatanKomite = useCallback((id: string) => dispatch({ type: 'DELETE_KEGIATAN_KOMITE', id }), []);
  const addGrievance = useCallback((g: Omit<GrievanceRecord, 'id'>) => dispatch({ type: 'ADD_GRIEVANCE', gr: { ...g, id: genId('GR') } }), []);
  const updateGrievance = useCallback((g: GrievanceRecord) => dispatch({ type: 'UPDATE_GRIEVANCE', gr: g }), []);
  const deleteGrievance = useCallback((id: string) => dispatch({ type: 'DELETE_GRIEVANCE', id }), []);
  const addPHK = useCallback((p: Omit<PHKRecord, 'id'>) => dispatch({ type: 'ADD_PHK', phk: { ...p, id: genId('PHK') } }), []);
  const updatePHK = useCallback((p: PHKRecord) => dispatch({ type: 'UPDATE_PHK', phk: p }), []);
  const deletePHK = useCallback((id: string) => dispatch({ type: 'DELETE_PHK', id }), []);

  const value: AppContextValue = {
    ...state,
    dispatch,
    login, logout,
    addPegawai, updatePegawai, deletePegawai,
    addCuti, updateCuti, deleteCuti, approveCuti, rejectCuti,
    addAbsensi, updateAbsensi, deleteAbsensi, bulkInputAbsensi,
    addSKP, updateSKP, deleteSKP,
    addKP, updateKP, deleteKP,
    addDisiplin, updateDisiplin, deleteDisiplin,
    addDiklat, updateDiklat, deleteDiklat,
    addRiwayatJabatan, updateRiwayatJabatan, deleteRiwayatJabatan,
    addSTR, updateSTR, deleteSTR,
    addSIP, updateSIP, deleteSIP,
    addCredentialing, updateCredentialing, deleteCredentialing,
    addCPD, updateCPD, deleteCPD,
    addInsiden, updateInsiden, deleteInsiden,
    addVaksinasi, updateVaksinasi, deleteVaksinasi,
    addMCU, updateMCU, deleteMCU,
    addSlipGaji, updateSlipGaji, deleteSlipGaji,
    addJadwal, updateJadwal, deleteJadwal,
    addBPJS, updateBPJS, deleteBPJS,
    addKontrak, updateKontrak, deleteKontrak,
    addPenghargaan, updatePenghargaan, deletePenghargaan,
    addMutasi, updateMutasi, deleteMutasi,
    addAnggotaKomite, updateAnggotaKomite, deleteAnggotaKomite,
    addKegiatanKomite, updateKegiatanKomite, deleteKegiatanKomite,
    addGrievance, updateGrievance, deleteGrievance,
    addPHK, updatePHK, deletePHK,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}