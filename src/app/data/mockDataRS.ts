import type {
  STRRecord, SIPRecord, CredentialingRecord, KewenangaKlinis, CPDRecord,
  InsidenK3RS, VaksinasiRecord, MCURecord,
  SlipGaji, JadwalShift, BPJSRecord, KontrakRecord,
  PenghargaanRecord, MutasiRecord, AnggotaKomite, KegiatanKomite,
  GrievanceRecord, PHKRecord,
} from '../types';

// ─── GAJI POKOK per Golongan (PP No. 15/2019) ────────────────────────────────
export const GAJI_POKOK: Record<string, number> = {
  'I/a': 1560800, 'I/b': 1704500, 'I/c': 1776600, 'I/d': 1851800,
  'II/a': 2022200, 'II/b': 2208400, 'II/c': 2301800, 'II/d': 2399000,
  'III/a': 2579400, 'III/b': 2688500, 'III/c': 2802300, 'III/d': 2920800,
  'IV/a': 3044300, 'IV/b': 3173100, 'IV/c': 3307300, 'IV/d': 3447200, 'IV/e': 3593100,
};

// Tunjangan Jabatan Struktural
export const TUNJANGAN_STRUKTURAL: Record<string, number> = {
  'II': 3250000, 'III': 1260000, 'IV': 540000,
};

// Tunjangan Fungsional (approx)
export const TUNJANGAN_FUNGSIONAL: Record<string, number> = {
  'Dokter Spesialis Penyakit Dalam Madya': 1300000,
  'Dokter Spesialis Bedah Madya': 1300000,
  'Dokter Spesialis Radiologi Madya': 1300000,
  'Dokter Umum Pertama': 540000,
  'Perawat Ahli Muda': 540000,
  'Perawat Ahli Pertama': 400000,
  'Perawat Terampil': 280000,
  'Apoteker Ahli Pertama': 540000,
  'Nutrisionis Ahli Pertama': 400000,
  'Pranata Laboratorium Kesehatan Terampil': 260000,
  'Perekam Medis Ahli Pertama': 400000,
  'Perekam Medis Terampil': 240000,
  'Teknisi Elektromedik Ahli Pertama': 400000,
  'Bidan Terampil': 280000,
  'Analis SDM Aparatur': 540000,
  'Pranata Komputer Ahli Pertama': 400000,
};

// ─── STR RECORDS ─────────────────────────────────────────────────────────────
export const dataSTR: STRRecord[] = [
  { id: 'STR001', pegawaiId: 'P001', nomorSTR: 'STR-32120221234567', jenisTenaga: 'Dokter Spesialis Penyakit Dalam', konsil: 'Konsil Kedokteran Indonesia (KKI)', tanggalTerbit: '2022-01-15', tanggalExpired: '2027-01-14', status: 'Aktif' },
  { id: 'STR002', pegawaiId: 'P002', nomorSTR: 'STR-31020207654321', jenisTenaga: 'Dokter Umum', konsil: 'Konsil Kedokteran Indonesia (KKI)', tanggalTerbit: '2021-04-10', tanggalExpired: '2026-04-09', status: 'Akan Expired' },
  { id: 'STR003', pegawaiId: 'P003', nomorSTR: 'STR-KP-2021-003456', jenisTenaga: 'Perawat', konsil: 'Konsil Keperawatan Indonesia', tanggalTerbit: '2021-07-20', tanggalExpired: '2026-07-19', status: 'Aktif' },
  { id: 'STR004', pegawaiId: 'P004', nomorSTR: 'STR-FA-2020-001122', jenisTenaga: 'Apoteker', konsil: 'Konsil Tenaga Kefarmasian', tanggalTerbit: '2020-03-05', tanggalExpired: '2025-03-04', status: 'Expired' },
  { id: 'STR005', pegawaiId: 'P005', nomorSTR: 'STR-32520181234568', jenisTenaga: 'Dokter Spesialis Bedah', konsil: 'Konsil Kedokteran Indonesia (KKI)', tanggalTerbit: '2023-06-01', tanggalExpired: '2028-05-31', status: 'Aktif' },
  { id: 'STR006', pegawaiId: 'P006', nomorSTR: 'STR-KP-2022-007788', jenisTenaga: 'Perawat', konsil: 'Konsil Keperawatan Indonesia', tanggalTerbit: '2022-09-15', tanggalExpired: '2027-09-14', status: 'Aktif' },
  { id: 'STR007', pegawaiId: 'P008', nomorSTR: 'STR-GZ-2021-005566', jenisTenaga: 'Nutrisionis', konsil: 'Konsil Tenaga Gizi', tanggalTerbit: '2021-11-01', tanggalExpired: '2026-10-31', status: 'Akan Expired' },
  { id: 'STR008', pegawaiId: 'P009', nomorSTR: 'STR-AK-2020-003344', jenisTenaga: 'Ahli Teknologi Laboratorium Medik', konsil: 'Konsil ATLM', tanggalTerbit: '2020-08-20', tanggalExpired: '2025-08-19', status: 'Expired' },
  { id: 'STR009', pegawaiId: 'P010', nomorSTR: 'STR-RM-2022-008877', jenisTenaga: 'Perekam Medis', konsil: 'Konsil Kesehatan Indonesia', tanggalTerbit: '2022-02-14', tanggalExpired: '2027-02-13', status: 'Aktif' },
  { id: 'STR010', pegawaiId: 'P011', nomorSTR: 'STR-32620158765432', jenisTenaga: 'Dokter Spesialis Radiologi', konsil: 'Konsil Kedokteran Indonesia (KKI)', tanggalTerbit: '2023-03-20', tanggalExpired: '2028-03-19', status: 'Aktif' },
  { id: 'STR011', pegawaiId: 'P012', nomorSTR: 'STR-BD-2022-009988', jenisTenaga: 'Bidan', konsil: 'Konsil Kebidanan Indonesia', tanggalTerbit: '2022-04-18', tanggalExpired: '2027-04-17', status: 'Aktif' },
  { id: 'STR012', pegawaiId: 'P013', nomorSTR: 'STR-EM-2021-002233', jenisTenaga: 'Teknisi Elektromedik', konsil: 'Konsil Kesehatan Indonesia', tanggalTerbit: '2021-05-10', tanggalExpired: '2026-05-09', status: 'Akan Expired' },
  { id: 'STR013', pegawaiId: 'P014', nomorSTR: 'STR-RM-2021-006655', jenisTenaga: 'Perekam Medis', konsil: 'Konsil Kesehatan Indonesia', tanggalTerbit: '2021-02-14', tanggalExpired: '2026-02-13', status: 'Expired' },
  { id: 'STR014', pegawaiId: 'P015', nomorSTR: 'STR-KP-2023-011223', jenisTenaga: 'Perawat', konsil: 'Konsil Keperawatan Indonesia', tanggalTerbit: '2023-01-25', tanggalExpired: '2028-01-24', status: 'Aktif' },
  { id: 'STR015', pegawaiId: 'P017', nomorSTR: 'STR-KP-2022-010011', jenisTenaga: 'Perawat', konsil: 'Konsil Keperawatan Indonesia', tanggalTerbit: '2022-04-15', tanggalExpired: '2027-04-14', status: 'Aktif' },
  { id: 'STR016', pegawaiId: 'P018', nomorSTR: 'STR-KP-2023-012334', jenisTenaga: 'Perawat', konsil: 'Konsil Keperawatan Indonesia', tanggalTerbit: '2023-07-08', tanggalExpired: '2028-07-07', status: 'Aktif' },
];

// ─── SIP / SIK RECORDS ───────────────────────────────────────────────────────
export const dataSIP: SIPRecord[] = [
  { id: 'SIP001', pegawaiId: 'P001', nomorSIP: 'SIP.440/1234/DPM-PTSP/2022', jenisDokumen: 'SIP', jenisPraktik: 'Praktik Spesialis Penyakit Dalam', fasyankes: 'RSUD Abdul Moeloek', instansiPenerbit: 'Dinas Penanaman Modal & PTSP Prov. Lampung', tanggalTerbit: '2022-02-01', tanggalExpired: '2025-01-31', status: 'Expired' },
  { id: 'SIP002', pegawaiId: 'P002', nomorSIP: 'SIP.440/5678/DPM-PTSP/2023', jenisDokumen: 'SIP', jenisPraktik: 'Praktik Dokter Umum', fasyankes: 'RSUD Abdul Moeloek', instansiPenerbit: 'Dinas Penanaman Modal & PTSP Kota Bandar Lampung', tanggalTerbit: '2023-04-10', tanggalExpired: '2026-04-09', status: 'Akan Expired' },
  { id: 'SIP003', pegawaiId: 'P005', nomorSIP: 'SIP.440/9101/DPM-PTSP/2023', jenisDokumen: 'SIP', jenisPraktik: 'Praktik Spesialis Bedah', fasyankes: 'RSUD Abdul Moeloek', instansiPenerbit: 'Dinas Penanaman Modal & PTSP Prov. Lampung', tanggalTerbit: '2023-06-15', tanggalExpired: '2026-06-14', status: 'Aktif' },
  { id: 'SIP004', pegawaiId: 'P011', nomorSIP: 'SIP.440/1121/DPM-PTSP/2024', jenisDokumen: 'SIP', jenisPraktik: 'Praktik Spesialis Radiologi', fasyankes: 'RSUD Abdul Moeloek', instansiPenerbit: 'Dinas Penanaman Modal & PTSP Prov. Lampung', tanggalTerbit: '2024-03-20', tanggalExpired: '2027-03-19', status: 'Aktif' },
  { id: 'SIK001', pegawaiId: 'P003', nomorSIP: 'SIK.445/3141/Dinkes/2023', jenisDokumen: 'SIK', fasyankes: 'RSUD Abdul Moeloek', instansiPenerbit: 'Dinas Kesehatan Kota Bandar Lampung', tanggalTerbit: '2023-07-20', tanggalExpired: '2026-07-19', status: 'Aktif' },
  { id: 'SIK002', pegawaiId: 'P004', nomorSIP: 'SIK.445/5161/Dinkes/2022', jenisDokumen: 'SIK', fasyankes: 'RSUD Abdul Moeloek', instansiPenerbit: 'Dinas Kesehatan Kota Bandar Lampung', tanggalTerbit: '2022-03-05', tanggalExpired: '2025-03-04', status: 'Expired' },
  { id: 'SIK003', pegawaiId: 'P006', nomorSIP: 'SIK.445/7181/Dinkes/2024', jenisDokumen: 'SIK', fasyankes: 'RSUD Abdul Moeloek', instansiPenerbit: 'Dinas Kesehatan Kota Bandar Lampung', tanggalTerbit: '2024-09-15', tanggalExpired: '2027-09-14', status: 'Aktif' },
  { id: 'SIK004', pegawaiId: 'P012', nomorSIP: 'SIK.445/9202/Dinkes/2023', jenisDokumen: 'SIK', fasyankes: 'RSUD Abdul Moeloek', instansiPenerbit: 'Dinas Kesehatan Kota Bandar Lampung', tanggalTerbit: '2023-04-18', tanggalExpired: '2026-04-17', status: 'Akan Expired' },
  { id: 'SIK005', pegawaiId: 'P015', nomorSIP: 'SIK.445/1232/Dinkes/2024', jenisDokumen: 'SIK', fasyankes: 'RSUD Abdul Moeloek', instansiPenerbit: 'Dinas Kesehatan Kota Bandar Lampung', tanggalTerbit: '2024-01-25', tanggalExpired: '2027-01-24', status: 'Aktif' },
];

// ─── CREDENTIALING ───────────────────────────────────────────────────────────
const kewenanganDokterSpesialisPD: KewenangaKlinis[] = [
  { id: 'KW001', kode: 'PD-01', namaKewenangan: 'Pemeriksaan & Tatalaksana Diabetes Melitus', kategori: 'Endokrinologi', level: 'Mandiri' },
  { id: 'KW002', kode: 'PD-02', namaKewenangan: 'Pemasangan & Pengelolaan Nasogastric Tube', kategori: 'Tindakan Medis Umum', level: 'Mandiri' },
  { id: 'KW003', kode: 'PD-03', namaKewenangan: 'Pemeriksaan & Tatalaksana Gagal Jantung', kategori: 'Kardiologi', level: 'Mandiri' },
  { id: 'KW004', kode: 'PD-04', namaKewenangan: 'Tindakan Peritoneal Dialisis', kategori: 'Nefrologi', level: 'Dengan Supervisi' },
  { id: 'KW005', kode: 'PD-05', namaKewenangan: 'Bronkoskopi Terapeutik', kategori: 'Pulmonologi', level: 'Tidak Berwenang' },
];

const kewenanganPerawatAhliMuda: KewenangaKlinis[] = [
  { id: 'KW010', kode: 'KP-01', namaKewenangan: 'Pengkajian Keperawatan Kompleks', kategori: 'Asuhan Keperawatan', level: 'Mandiri' },
  { id: 'KW011', kode: 'KP-02', namaKewenangan: 'Pemasangan Infus dan Pengelolaan Jalur IV', kategori: 'Tindakan Keperawatan', level: 'Mandiri' },
  { id: 'KW012', kode: 'KP-03', namaKewenangan: 'Manajemen Nyeri Pasien Paliatif', kategori: 'Keperawatan Khusus', level: 'Dengan Supervisi' },
  { id: 'KW013', kode: 'KP-04', namaKewenangan: 'Penatalaksanaan Luka Kronis', kategori: 'Perawatan Luka', level: 'Mandiri' },
];

export const dataCredentialing: CredentialingRecord[] = [
  {
    id: 'CR001', pegawaiId: 'P001', jenis: 'Re-kredensial',
    tanggalPengajuan: '2022-01-05', tanggalKredensial: '2022-01-20', tanggalExpired: '2025-01-19',
    statusKredensial: 'Selesai',
    kewenangan: kewenanganDokterSpesialisPD,
    rekomendasiKomite: 'Diberikan seluruh kewenangan klinis sesuai kompetensi',
    disetujuiOleh: 'dr. Hendra Gunawan, Sp.Rad (Ketua Komite Medik)',
    catatanKomite: 'Telah menjalani kredensial ulang dengan hasil baik',
  },
  {
    id: 'CR002', pegawaiId: 'P003', jenis: 'Re-kredensial',
    tanggalPengajuan: '2023-07-10', tanggalKredensial: '2023-07-25', tanggalExpired: '2026-07-24',
    statusKredensial: 'Selesai',
    kewenangan: kewenanganPerawatAhliMuda,
    rekomendasiKomite: 'Disetujui penuh dengan catatan perlu peningkatan kompetensi keperawatan intensif',
    disetujuiOleh: 'Maya Anggraeni, S.Kep., Ners, M.Kep (Ketua Komite Keperawatan)',
  },
  {
    id: 'CR003', pegawaiId: 'P002', jenis: 'Kredensial Awal',
    tanggalPengajuan: '2026-03-01',
    statusKredensial: 'Verifikasi Dokumen',
    kewenangan: [],
    catatanKomite: 'Menunggu kelengkapan berkas STR dan SIP terbaru',
  },
  {
    id: 'CR004', pegawaiId: 'P005', jenis: 'Re-kredensial',
    tanggalPengajuan: '2023-06-01', tanggalKredensial: '2023-06-20', tanggalExpired: '2026-06-19',
    statusKredensial: 'Selesai',
    kewenangan: [
      { id: 'KW020', kode: 'BD-01', namaKewenangan: 'Tindakan Operasi Bedah Digestif', kategori: 'Bedah Umum', level: 'Mandiri' },
      { id: 'KW021', kode: 'BD-02', namaKewenangan: 'Laparotomi Eksplorasi', kategori: 'Bedah Umum', level: 'Mandiri' },
      { id: 'KW022', kode: 'BD-03', namaKewenangan: 'Bedah Onkologi', kategori: 'Bedah Onkologi', level: 'Dengan Supervisi' },
    ],
    disetujuiOleh: 'dr. Hendra Gunawan, Sp.Rad (Ketua Komite Medik)',
  },
  {
    id: 'CR005', pegawaiId: 'P011', jenis: 'Re-kredensial',
    tanggalPengajuan: '2026-02-15',
    statusKredensial: 'Peer Review',
    kewenangan: [
      { id: 'KW030', kode: 'RAD-01', namaKewenangan: 'Baca Foto Rontgen Konvensional', kategori: 'Radiologi Diagnostik', level: 'Mandiri' },
      { id: 'KW031', kode: 'RAD-02', namaKewenangan: 'Pembacaan CT Scan Non-Kontras', kategori: 'CT Scan', level: 'Mandiri' },
    ],
    catatanKomite: 'Sedang dalam proses peer review oleh sejawat spesialis radiologi',
  },
];

// ─── CPD / SKP PROFESI ────────────────────────────────────────────────────────
export const dataCPD = [
  { id: 'CPD001', pegawaiId: 'P001', tahun: 2024, namaKegiatan: 'Kongres Nasional PAPDI (KOPAPDI)', jenisKegiatan: 'Seminar' as const, penyelenggara: 'PAPDI Pusat', tanggal: '2024-08-20', skp: 12, nomorSertifikat: 'SKP/PAPDI/VIII/2024/0123', diakuiOleh: 'Konsil Kedokteran Indonesia (KKI)', status: 'Diverifikasi' as const },
  { id: 'CPD002', pegawaiId: 'P001', tahun: 2024, namaKegiatan: 'Workshop Pengelolaan DM Tipe 2 Terkini', jenisKegiatan: 'Workshop' as const, penyelenggara: 'PERKENI Lampung', tanggal: '2024-05-10', skp: 6, nomorSertifikat: 'SKP/PERKENI/V/2024/0045', diakuiOleh: 'Konsil Kedokteran Indonesia (KKI)', status: 'Diverifikasi' as const },
  { id: 'CPD003', pegawaiId: 'P001', tahun: 2025, namaKegiatan: 'Webinar Tatalaksana Gagal Ginjal Kronik', jenisKegiatan: 'Webinar' as const, penyelenggara: 'PERNEFRI', tanggal: '2025-03-15', skp: 3, nomorSertifikat: 'SKP/PERNEFRI/III/2025/0089', diakuiOleh: 'Konsil Kedokteran Indonesia (KKI)', status: 'Diverifikasi' as const },
  { id: 'CPD004', pegawaiId: 'P001', tahun: 2025, namaKegiatan: 'Pelatihan ACLS (Advanced Cardiovascular Life Support)', jenisKegiatan: 'Pelatihan' as const, penyelenggara: 'RSUP Dr. Sardjito & AHA', tanggal: '2025-07-22', skp: 15, nomorSertifikat: 'SKP/ACLS/VII/2025/2234', diakuiOleh: 'Konsil Kedokteran Indonesia (KKI)', status: 'Diverifikasi' as const },
  { id: 'CPD005', pegawaiId: 'P002', tahun: 2024, namaKegiatan: 'Seminar Kedokteran Keluarga dan Layanan Primer', jenisKegiatan: 'Seminar' as const, penyelenggara: 'IDI Wilayah Lampung', tanggal: '2024-09-05', skp: 5, nomorSertifikat: 'SKP/IDI/IX/2024/0345', diakuiOleh: 'Konsil Kedokteran Indonesia (KKI)', status: 'Diverifikasi' as const },
  { id: 'CPD006', pegawaiId: 'P002', tahun: 2025, namaKegiatan: 'Workshop Interpretasi EKG untuk Dokter Umum', jenisKegiatan: 'Workshop' as const, penyelenggara: 'IDI Kota Bandar Lampung', tanggal: '2025-02-18', skp: 8, nomorSertifikat: 'SKP/IDI-BL/II/2025/0112', diakuiOleh: 'Konsil Kedokteran Indonesia (KKI)', status: 'Diverifikasi' as const },
  { id: 'CPD007', pegawaiId: 'P003', tahun: 2024, namaKegiatan: 'Konferensi Keperawatan Nasional', jenisKegiatan: 'Seminar' as const, penyelenggara: 'PPNI Pusat', tanggal: '2024-10-12', skp: 8, nomorSertifikat: 'SKP/PPNI/X/2024/0567', diakuiOleh: 'Konsil Keperawatan Indonesia', status: 'Diverifikasi' as const },
  { id: 'CPD008', pegawaiId: 'P003', tahun: 2025, namaKegiatan: 'Pelatihan Modern Wound Care', jenisKegiatan: 'Pelatihan' as const, penyelenggara: 'IPWI', tanggal: '2025-04-20', skp: 12, nomorSertifikat: 'SKP/IPWI/IV/2025/0234', diakuiOleh: 'Konsil Keperawatan Indonesia', status: 'Diverifikasi' as const },
  { id: 'CPD009', pegawaiId: 'P004', tahun: 2024, namaKegiatan: 'Seminar Nasional Farmasi Klinik', jenisKegiatan: 'Seminar' as const, penyelenggara: 'IAI Pusat', tanggal: '2024-11-08', skp: 6, nomorSertifikat: 'SKP/IAI/XI/2024/0789', diakuiOleh: 'Konsil Tenaga Kefarmasian', status: 'Diverifikasi' as const },
  { id: 'CPD010', pegawaiId: 'P005', tahun: 2024, namaKegiatan: 'Annual Scientific Meeting IKABI', jenisKegiatan: 'Seminar' as const, penyelenggara: 'IKABI', tanggal: '2024-06-18', skp: 15, nomorSertifikat: 'SKP/IKABI/VI/2024/0123', diakuiOleh: 'Konsil Kedokteran Indonesia (KKI)', status: 'Diverifikasi' as const },
  { id: 'CPD011', pegawaiId: 'P011', tahun: 2025, namaKegiatan: 'Webinar Update Radiologi Intervensi Terkini', jenisKegiatan: 'Webinar' as const, penyelenggara: 'PDSRI', tanggal: '2025-01-25', skp: 4, diakuiOleh: 'Konsil Kedokteran Indonesia (KKI)', status: 'Pending' as const },
  { id: 'CPD012', pegawaiId: 'P012', tahun: 2025, namaKegiatan: 'Pelatihan Asuhan Kebidanan Berbasis Bukti', jenisKegiatan: 'Pelatihan' as const, penyelenggara: 'IBI Lampung', tanggal: '2025-05-10', skp: 10, nomorSertifikat: 'SKP/IBI/V/2025/0345', diakuiOleh: 'Konsil Kebidanan Indonesia', status: 'Diverifikasi' as const },
];

// ─── K3RS - INSIDEN ──────────────────────────────────────────────────────────
export const dataInsidenK3RS: InsidenK3RS[] = [
  {
    id: 'IK001', pegawaiId: 'P006', tanggal: '2026-01-15',
    jenisInsiden: 'Pajanan Jarum Suntik',
    lokasi: 'Instalasi Gawat Darurat (IGD)',
    deskripsi: 'Perawat tertusuk jarum suntik bekas pasien saat melepas tutup jarum. Pasien dengan status HIV tidak diketahui.',
    tindakanSegera: 'Cuci luka dengan air mengalir, lapor ke PPIRS, pemeriksaan darah',
    tindakLanjut: 'Profilaksis pasca pajanan (PEP), monitoring 3 bulan',
    keparahan: 'Sedang',
    statusLaporan: 'Selesai',
    tanggalTindakLanjut: '2026-01-16',
  },
  {
    id: 'IK002', pegawaiId: 'P009', tanggal: '2026-02-03',
    jenisInsiden: 'Kecelakaan Bahan Kimia',
    lokasi: 'Instalasi Laboratorium',
    deskripsi: 'Petugas laboratorium terkena percikan reagen asam klorida saat bekerja tanpa pelindung wajah.',
    tindakanSegera: 'Bilas dengan air 15 menit, rujuk ke IGD untuk evaluasi',
    tindakLanjut: 'Pengobatan luka kimia ringan, edukasi penggunaan APD',
    keparahan: 'Ringan',
    statusLaporan: 'Selesai',
    tanggalTindakLanjut: '2026-02-04',
  },
  {
    id: 'IK003', pegawaiId: 'P003', tanggal: '2026-02-20',
    jenisInsiden: 'Pajanan Cairan Tubuh',
    lokasi: 'Instalasi Rawat Inap',
    deskripsi: 'Perawat terkena percikan darah pasien saat melakukan penggantian balutan tanpa kacamata pelindung.',
    tindakanSegera: 'Cuci mata dengan larutan saline, lapor ke PPIRS',
    tindakLanjut: 'Pemeriksaan status serologi, monitoring 6 minggu',
    keparahan: 'Ringan',
    statusLaporan: 'Investigasi',
    tanggalTindakLanjut: '2026-02-21',
  },
  {
    id: 'IK004', pegawaiId: 'P013', tanggal: '2026-01-28',
    jenisInsiden: 'Kecelakaan Kerja',
    lokasi: 'IPSRS',
    deskripsi: 'Teknisi terpeleset saat melakukan perbaikan alat medis di lantai yang basah, mengakibatkan cedera lutut.',
    tindakanSegera: 'Pertolongan pertama di IGD, X-ray lutut',
    tindakLanjut: 'Istirahat 3 hari kerja, fisioterapi',
    keparahan: 'Sedang',
    statusLaporan: 'Selesai',
    tanggalTindakLanjut: '2026-01-29',
  },
  {
    id: 'IK005', pegawaiId: 'P011', tanggal: '2026-03-01',
    jenisInsiden: 'Pajanan Radiasi',
    lokasi: 'Instalasi Radiologi',
    deskripsi: 'Dokter radiologi lupa mengenakan dosimeter saat pemeriksaan fluoroskopi. Estimasi dosis melebihi batas harian.',
    tindakanSegera: 'Pemeriksaan dosimeter retroaktif, lapor ke BAPETEN',
    keparahan: 'Sedang',
    statusLaporan: 'Investigasi',
  },
  {
    id: 'IK006', pegawaiId: 'P018', tanggal: '2026-02-14',
    jenisInsiden: 'Near Miss',
    lokasi: 'Instalasi Rawat Inap',
    deskripsi: 'Hampir terjadi salah pemberian obat (wrong patient) karena label infus tidak terbaca jelas. Dicegah oleh perawat lain sebelum pemberian.',
    tindakanSegera: 'Tidak ada cedera, dilakukan double-check prosedur',
    tindakLanjut: 'Evaluasi SOP labeling obat, sosialisasi ulang',
    keparahan: 'Ringan',
    statusLaporan: 'Selesai',
  },
];

// ─── VAKSINASI ────────────────────────────────────────────────────────────────
export const dataVaksinasi: VaksinasiRecord[] = [
  { id: 'VAK001', pegawaiId: 'P001', jenisVaksin: 'Hepatitis B', dosis: 3, tanggalVaksin: '2020-03-15', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK002', pegawaiId: 'P001', jenisVaksin: 'COVID-19 (Booster ke-2)', dosis: 4, tanggalVaksin: '2023-02-20', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK003', pegawaiId: 'P002', jenisVaksin: 'Hepatitis B', dosis: 3, tanggalVaksin: '2020-05-10', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK004', pegawaiId: 'P002', jenisVaksin: 'COVID-19 (Booster ke-2)', dosis: 4, tanggalVaksin: '2023-03-15', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK005', pegawaiId: 'P003', jenisVaksin: 'Hepatitis B', dosis: 3, tanggalVaksin: '2019-08-20', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK006', pegawaiId: 'P003', jenisVaksin: 'COVID-19 (Booster ke-2)', dosis: 4, tanggalVaksin: '2023-04-10', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK007', pegawaiId: 'P004', jenisVaksin: 'Hepatitis B', dosis: 2, tanggalVaksin: '2021-01-15', fasilitasVaksin: 'Puskesmas Teluk Betung', tanggalBooster: '2026-06-01', status: 'Sebagian' },
  { id: 'VAK008', pegawaiId: 'P006', jenisVaksin: 'Hepatitis B', dosis: 3, tanggalVaksin: '2022-01-10', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK009', pegawaiId: 'P006', jenisVaksin: 'COVID-19 (Primer + Booster)', dosis: 3, tanggalVaksin: '2022-08-15', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK010', pegawaiId: 'P009', jenisVaksin: 'Hepatitis B', dosis: 3, tanggalVaksin: '2020-07-20', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK011', pegawaiId: 'P011', jenisVaksin: 'Hepatitis B', dosis: 3, tanggalVaksin: '2019-06-15', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK012', pegawaiId: 'P011', jenisVaksin: 'Influenza (Tahunan)', dosis: 1, tanggalVaksin: '2025-10-01', fasilitasVaksin: 'RSUD Abdul Moeloek', tanggalBooster: '2026-10-01', status: 'Lengkap' },
  { id: 'VAK013', pegawaiId: 'P012', jenisVaksin: 'Hepatitis B', dosis: 1, tanggalVaksin: '2024-03-01', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Sebagian' },
  { id: 'VAK014', pegawaiId: 'P015', jenisVaksin: 'Hepatitis B', dosis: 3, tanggalVaksin: '2022-03-20', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
  { id: 'VAK015', pegawaiId: 'P018', jenisVaksin: 'COVID-19 (Primer + Booster)', dosis: 3, tanggalVaksin: '2022-06-10', fasilitasVaksin: 'RSUD Abdul Moeloek', status: 'Lengkap' },
];

// ─── MCU ─────────────────────────────────────────────────────────────────────
export const dataMCU: MCURecord[] = [
  { id: 'MCU001', pegawaiId: 'P001', tanggal: '2025-09-15', jenisMCU: 'Berkala', hasilMCU: 'Layak Kerja', catatan: 'Semua parameter dalam batas normal', rekomendasiDokter: 'Kontrol tekanan darah rutin', tanggalBerikutnya: '2026-09-15', fasilitasMCU: 'RSUD Abdul Moeloek' },
  { id: 'MCU002', pegawaiId: 'P002', tanggal: '2025-10-10', jenisMCU: 'Berkala', hasilMCU: 'Layak Kerja', catatan: 'Normal', tanggalBerikutnya: '2026-10-10', fasilitasMCU: 'RSUD Abdul Moeloek' },
  { id: 'MCU003', pegawaiId: 'P003', tanggal: '2025-08-20', jenisMCU: 'Berkala', hasilMCU: 'Layak dengan Syarat', catatan: 'HbsAg reaktif, perlu tindak lanjut spesialis', rekomendasiDokter: 'Konsultasi SpPD, hindari prosedur berisiko pajanan', tanggalBerikutnya: '2026-02-20', fasilitasMCU: 'RSUD Abdul Moeloek' },
  { id: 'MCU004', pegawaiId: 'P005', tanggal: '2025-07-15', jenisMCU: 'Berkala', hasilMCU: 'Layak Kerja', catatan: 'Semua parameter normal', tanggalBerikutnya: '2026-07-15', fasilitasMCU: 'RSUD Abdul Moeloek' },
  { id: 'MCU005', pegawaiId: 'P006', tanggal: '2026-01-16', jenisMCU: 'Khusus Pajanan', hasilMCU: 'Layak Kerja', catatan: 'Pasca pajanan jarum suntik - anti-HIV negatif', rekomendasiDokter: 'Monitoring ulang 3 bulan (April 2026)', tanggalBerikutnya: '2026-04-16', fasilitasMCU: 'RSUD Abdul Moeloek' },
  { id: 'MCU006', pegawaiId: 'P011', tanggal: '2025-11-05', jenisMCU: 'Berkala', hasilMCU: 'Layak Kerja', catatan: 'Dosis radiasi kumulatif dalam batas aman', rekomendasiDokter: 'Pastikan penggunaan APD radiasi konsisten', tanggalBerikutnya: '2026-11-05', fasilitasMCU: 'RSUD Abdul Moeloek' },
  { id: 'MCU007', pegawaiId: 'P016', tanggal: '2025-06-10', jenisMCU: 'Berkala', hasilMCU: 'Layak dengan Syarat', catatan: 'Gula darah puasa 118 mg/dL (pre-diabetes), tekanan darah 145/90', rekomendasiDokter: 'Modifikasi gaya hidup, kontrol ulang 6 bulan', tanggalBerikutnya: '2025-12-10', fasilitasMCU: 'RS Siloam Bandar Lampung' },
  { id: 'MCU008', pegawaiId: 'P018', tanggal: '2026-02-01', jenisMCU: 'Awal Kerja', hasilMCU: 'Layak Kerja', catatan: 'Sehat, tidak ada kelainan', tanggalBerikutnya: '2027-02-01', fasilitasMCU: 'RSUD Abdul Moeloek' },
];

// ─── SLIP GAJI ────────────────────────────────────────────────────────────────
function buatSlipGaji(id: string, pegawaiId: string, golongan: string, jabatanFung: string, eselon: string | undefined, bulan: number, tahun: number, statusKawin: boolean, jumlahAnak: number): SlipGaji {
  const gp = GAJI_POKOK[golongan] || 2500000;
  const tj = eselon && eselon !== '-' && eselon !== 'Non-Eselon' ? (TUNJANGAN_STRUKTURAL[eselon] || 0) : 0;
  const tf = TUNJANGAN_FUNGSIONAL[jabatanFung] || 300000;
  const tberas = 80000 * (1 + (statusKawin ? 1 : 0) + jumlahAnak);
  const tanak = Math.min(jumlahAnak, 2) * gp * 0.02;
  const tistri = statusKawin ? gp * 0.10 : 0;
  const tukin = Math.round(gp * 0.45);
  const bruto = gp + tj + tf + tberas + tanak + tistri + tukin;
  const potBPJSKes = Math.round(gp * 0.01);
  const potBPJSTK = Math.round(gp * 0.02);
  const potTaspen = Math.round(gp * 0.0475);
  const potPph = Math.round(bruto * 0.05 * 0.5);
  const totalPot = potBPJSKes + potBPJSTK + potTaspen + potPph;
  return {
    id, pegawaiId, bulan, tahun,
    gajiPokok: gp,
    tunjanganJabatan: tj,
    tunjanganFungsional: tf,
    tunjanganBeras: tberas,
    tunjanganAnak: Math.round(tanak),
    tunjanganIstri: Math.round(tistri),
    tunjanganKinerja: tukin,
    tambahanLain: [],
    potonganBPJSKes: potBPJSKes,
    potonganBPJSTK: potBPJSTK,
    potonganPPh21: potPph,
    potonganTaspen: potTaspen,
    potonganLain: [],
    totalBruto: bruto,
    totalPotongan: totalPot,
    totalNetto: bruto - totalPot,
    status: 'Dibayar',
    tanggalDibayar: `${tahun}-${String(bulan).padStart(2, '0')}-28`,
  };
}

export const dataSlipGaji: SlipGaji[] = [
  buatSlipGaji('SG001', 'P001', 'IV/b', 'Dokter Spesialis Penyakit Dalam Madya', '-', 2, 2026, true, 2),
  buatSlipGaji('SG002', 'P002', 'III/d', 'Dokter Umum Pertama', undefined, 2, 2026, true, 1),
  buatSlipGaji('SG003', 'P003', 'III/c', 'Perawat Ahli Muda', undefined, 2, 2026, true, 1),
  buatSlipGaji('SG004', 'P004', 'III/b', 'Apoteker Ahli Pertama', undefined, 2, 2026, true, 0),
  buatSlipGaji('SG005', 'P005', 'IV/a', 'Dokter Spesialis Bedah Madya', '-', 2, 2026, true, 3),
  buatSlipGaji('SG006', 'P006', 'II/c', 'Perawat Terampil', undefined, 2, 2026, false, 0),
  buatSlipGaji('SG007', 'P007', 'III/d', 'Analis SDM Aparatur', 'IV', 2, 2026, true, 2),
  buatSlipGaji('SG008', 'P008', 'III/a', 'Nutrisionis Ahli Pertama', undefined, 2, 2026, true, 1),
  buatSlipGaji('SG009', 'P009', 'II/d', 'Pranata Laboratorium Kesehatan Terampil', undefined, 2, 2026, true, 2),
  buatSlipGaji('SG010', 'P010', 'III/b', 'Perekam Medis Ahli Pertama', undefined, 2, 2026, true, 1),
  buatSlipGaji('SG011', 'P011', 'IV/a', 'Dokter Spesialis Radiologi Madya', '-', 2, 2026, true, 2),
  buatSlipGaji('SG012', 'P016', 'IV/c', 'Analis SDM Aparatur', 'II', 2, 2026, true, 2),
  buatSlipGaji('SG013', 'P017', 'IV/a', 'Perawat Ahli Muda', 'III', 2, 2026, true, 1),
  buatSlipGaji('SG014', 'P019', 'III/d', 'Analis SDM Aparatur', 'III', 2, 2026, true, 2),
  buatSlipGaji('SG015', 'P020', 'III/b', 'Pranata Komputer Ahli Pertama', undefined, 2, 2026, true, 1),
  // Maret 2026 - status Draft
  { ...buatSlipGaji('SG016', 'P001', 'IV/b', 'Dokter Spesialis Penyakit Dalam Madya', '-', 3, 2026, true, 2), status: 'Draft', tanggalDibayar: undefined },
  { ...buatSlipGaji('SG017', 'P007', 'III/d', 'Analis SDM Aparatur', 'IV', 3, 2026, true, 2), status: 'Draft', tanggalDibayar: undefined },
  { ...buatSlipGaji('SG018', 'P016', 'IV/c', 'Analis SDM Aparatur', 'II', 3, 2026, true, 2), status: 'Disetujui', tanggalDibayar: undefined },
];

// ─── JADWAL SHIFT ─────────────────────────────────────────────────────────────
const shiftDates = ['2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-16', '2026-03-17'];

export const dataJadwalShift: JadwalShift[] = [
  // IGD - P006, P018
  { id: 'JS001', pegawaiId: 'P006', tanggal: '2026-03-09', jenisShift: 'Pagi', jamMulai: '07:00', jamSelesai: '14:00', unitKerja: 'Instalasi Gawat Darurat (IGD)', status: 'Aktif' },
  { id: 'JS002', pegawaiId: 'P006', tanggal: '2026-03-10', jenisShift: 'Malam', jamMulai: '21:00', jamSelesai: '07:00', unitKerja: 'Instalasi Gawat Darurat (IGD)', status: 'Aktif' },
  { id: 'JS003', pegawaiId: 'P006', tanggal: '2026-03-11', jenisShift: 'Lepas', unitKerja: 'Instalasi Gawat Darurat (IGD)', status: 'Aktif' },
  { id: 'JS004', pegawaiId: 'P006', tanggal: '2026-03-12', jenisShift: 'Sore', jamMulai: '14:00', jamSelesai: '21:00', unitKerja: 'Instalasi Gawat Darurat (IGD)', status: 'Aktif' },
  { id: 'JS005', pegawaiId: 'P018', tanggal: '2026-03-09', jenisShift: 'Sore', jamMulai: '14:00', jamSelesai: '21:00', unitKerja: 'Instalasi Rawat Inap', status: 'Aktif' },
  { id: 'JS006', pegawaiId: 'P018', tanggal: '2026-03-10', jenisShift: 'Pagi', jamMulai: '07:00', jamSelesai: '14:00', unitKerja: 'Instalasi Rawat Inap', status: 'Aktif' },
  { id: 'JS007', pegawaiId: 'P018', tanggal: '2026-03-11', jenisShift: 'Malam', jamMulai: '21:00', jamSelesai: '07:00', unitKerja: 'Instalasi Rawat Inap', status: 'Aktif' },
  { id: 'JS008', pegawaiId: 'P018', tanggal: '2026-03-13', jenisShift: 'Libur', unitKerja: 'Instalasi Rawat Inap', status: 'Aktif' },
  // Rawat Inap - P003, P015
  { id: 'JS009', pegawaiId: 'P003', tanggal: '2026-03-09', jenisShift: 'Pagi', jamMulai: '07:00', jamSelesai: '14:00', unitKerja: 'Instalasi Rawat Inap', status: 'Aktif' },
  { id: 'JS010', pegawaiId: 'P003', tanggal: '2026-03-10', jenisShift: 'Pagi', jamMulai: '07:00', jamSelesai: '14:00', unitKerja: 'Instalasi Rawat Inap', status: 'Aktif' },
  { id: 'JS011', pegawaiId: 'P003', tanggal: '2026-03-11', jenisShift: 'Sore', jamMulai: '14:00', jamSelesai: '21:00', unitKerja: 'Instalasi Rawat Inap', status: 'Swap', keterangan: 'Tukar shift dengan Dini Fitriani' },
  { id: 'JS012', pegawaiId: 'P012', tanggal: '2026-03-09', jenisShift: 'Pagi', jamMulai: '07:00', jamSelesai: '14:00', unitKerja: 'Instalasi Kebidanan & Kandungan', status: 'Aktif' },
  { id: 'JS013', pegawaiId: 'P012', tanggal: '2026-03-10', jenisShift: 'Malam', jamMulai: '21:00', jamSelesai: '07:00', unitKerja: 'Instalasi Kebidanan & Kandungan', status: 'Aktif' },
  // Dokter On-Call
  { id: 'JS014', pegawaiId: 'P001', tanggal: '2026-03-09', jenisShift: 'On-Call', unitKerja: 'Instalasi Rawat Jalan', keterangan: 'On-call spesialis PD', status: 'Aktif' },
  { id: 'JS015', pegawaiId: 'P005', tanggal: '2026-03-10', jenisShift: 'On-Call', unitKerja: 'Instalasi Bedah Sentral (IBS)', keterangan: 'On-call bedah', status: 'Aktif' },
  { id: 'JS016', pegawaiId: 'P011', tanggal: '2026-03-11', jenisShift: 'On-Call', unitKerja: 'Instalasi Radiologi', keterangan: 'On-call radiologi', status: 'Aktif' },
  { id: 'JS017', pegawaiId: 'P002', tanggal: '2026-03-12', jenisShift: 'On-Call', unitKerja: 'Instalasi Gawat Darurat (IGD)', keterangan: 'On-call dokter umum', status: 'Aktif' },
  // Lab
  { id: 'JS018', pegawaiId: 'P009', tanggal: '2026-03-09', jenisShift: 'Pagi', jamMulai: '07:00', jamSelesai: '14:00', unitKerja: 'Instalasi Laboratorium', status: 'Aktif' },
  { id: 'JS019', pegawaiId: 'P009', tanggal: '2026-03-10', jenisShift: 'Sore', jamMulai: '14:00', jamSelesai: '21:00', unitKerja: 'Instalasi Laboratorium', status: 'Aktif' },
  { id: 'JS020', pegawaiId: 'P009', tanggal: '2026-03-13', jenisShift: 'Malam', jamMulai: '21:00', jamSelesai: '07:00', unitKerja: 'Instalasi Laboratorium', status: 'Aktif' },
  ...shiftDates.map((tgl, i) => ({
    id: `JS${21 + i}`, pegawaiId: 'P004', tanggal: tgl,
    jenisShift: 'Pagi' as const, jamMulai: '08:00', jamSelesai: '16:00',
    unitKerja: 'Instalasi Farmasi', status: 'Aktif' as const,
  })),
];

// ─── BPJS ────────────────────────────────────────────────────────────────────
export const dataBPJS: BPJSRecord[] = [
  { id: 'BPJS001', pegawaiId: 'P001', nomorKartuKesehatan: '0001234567001', kelasBPJSKes: 'I', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345678', statusBPJSTK: 'Aktif', tanggungan: [{ id: 'T001', nama: 'Sari Suryanto', hubungan: 'Istri', tanggalLahir: '1977-05-20', nomorKartu: '0001234567002', statusTanggungan: 'Aktif' }, { id: 'T002', nama: 'Andi Suryanto', hubungan: 'Anak', tanggalLahir: '2003-08-15', nomorKartu: '0001234567003', statusTanggungan: 'Aktif' }, { id: 'T003', nama: 'Budi Suryanto', hubungan: 'Anak', tanggalLahir: '2007-03-22', nomorKartu: '0001234567004', statusTanggungan: 'Aktif' }], iuranKesehatan: 31731, iuranKetenagakerjaan: 63462, tanggalDaftar: '2006-04-01' },
  { id: 'BPJS002', pegawaiId: 'P002', nomorKartuKesehatan: '0001234568001', kelasBPJSKes: 'I', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345679', statusBPJSTK: 'Aktif', tanggungan: [{ id: 'T004', nama: 'Raka Rahayu', hubungan: 'Suami', tanggalLahir: '1980-11-10', nomorKartu: '0001234568002', statusTanggungan: 'Aktif' }, { id: 'T005', nama: 'Citra Rahayu', hubungan: 'Anak', tanggalLahir: '2012-07-08', nomorKartu: '0001234568003', statusTanggungan: 'Aktif' }], iuranKesehatan: 29208, iuranKetenagakerjaan: 58416, tanggalDaftar: '2010-01-01' },
  { id: 'BPJS003', pegawaiId: 'P003', nomorKartuKesehatan: '0001234569001', kelasBPJSKes: 'I', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345680', statusBPJSTK: 'Aktif', tanggungan: [{ id: 'T006', nama: 'Rizky Kusumawardani', hubungan: 'Suami', tanggalLahir: '1985-06-12', nomorKartu: '0001234569002', statusTanggungan: 'Aktif' }], iuranKesehatan: 28023, iuranKetenagakerjaan: 56046, tanggalDaftar: '2012-01-01' },
  { id: 'BPJS004', pegawaiId: 'P004', nomorKartuKesehatan: '0001234570001', kelasBPJSKes: 'II', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345681', statusBPJSTK: 'Aktif', tanggungan: [{ id: 'T007', nama: 'Dewi Fauzi', hubungan: 'Istri', tanggalLahir: '1992-04-20', nomorKartu: '0001234570002', statusTanggungan: 'Aktif' }], iuranKesehatan: 26885, iuranKetenagakerjaan: 53770, tanggalDaftar: '2014-03-01' },
  { id: 'BPJS005', pegawaiId: 'P005', nomorKartuKesehatan: '0001234571001', kelasBPJSKes: 'I', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345682', statusBPJSTK: 'Aktif', tanggungan: [{ id: 'T008', nama: 'Lina Hartanto', hubungan: 'Istri', tanggalLahir: '1975-09-15', nomorKartu: '0001234571002', statusTanggungan: 'Aktif' }, { id: 'T009', nama: 'Rika Hartanto', hubungan: 'Anak', tanggalLahir: '2000-03-10', nomorKartu: '0001234571003', statusTanggungan: 'Aktif' }, { id: 'T010', nama: 'Dian Hartanto', hubungan: 'Anak', tanggalLahir: '2005-11-25', nomorKartu: '0001234571004', statusTanggungan: 'Aktif' }], iuranKesehatan: 30443, iuranKetenagakerjaan: 60886, tanggalDaftar: '1998-03-01' },
  { id: 'BPJS006', pegawaiId: 'P006', nomorKartuKesehatan: '0001234572001', kelasBPJSKes: 'II', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345683', statusBPJSTK: 'Aktif', tanggungan: [], iuranKesehatan: 23018, iuranKetenagakerjaan: 46036, tanggalDaftar: '2019-03-01' },
  { id: 'BPJS007', pegawaiId: 'P007', nomorKartuKesehatan: '0001234573001', kelasBPJSKes: 'I', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345684', statusBPJSTK: 'Aktif', tanggungan: [{ id: 'T011', nama: 'Wati Santoso', hubungan: 'Istri', tanggalLahir: '1978-02-28', nomorKartu: '0001234573002', statusTanggungan: 'Aktif' }, { id: 'T012', nama: 'Eko Santoso', hubungan: 'Anak', tanggalLahir: '2004-07-14', nomorKartu: '0001234573003', statusTanggungan: 'Aktif' }], iuranKesehatan: 29208, iuranKetenagakerjaan: 58416, tanggalDaftar: '2001-03-01' },
  { id: 'BPJS008', pegawaiId: 'P012', nomorKartuKesehatan: '0001234578001', kelasBPJSKes: 'II', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345689', statusBPJSTK: 'Aktif', tanggungan: [{ id: 'T013', nama: 'Joko Aini', hubungan: 'Suami', tanggalLahir: '1992-01-30', nomorKartu: '0001234578002', statusTanggungan: 'Aktif' }], iuranKesehatan: 23018, iuranKetenagakerjaan: 46036, tanggalDaftar: '2019-03-01' },
  { id: 'BPJS009', pegawaiId: 'P015', nomorKartuKesehatan: '0001234581001', kelasBPJSKes: 'II', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345692', statusBPJSTK: 'Aktif', tanggungan: [{ id: 'T014', nama: 'Deni Permata', hubungan: 'Suami', tanggalLahir: '1991-05-17', nomorKartu: '0001234581002', statusTanggungan: 'Aktif' }], iuranKesehatan: 25794, iuranKetenagakerjaan: 51588, tanggalDaftar: '2018-01-01' },
  { id: 'BPJS010', pegawaiId: 'P016', nomorKartuKesehatan: '0001234582001', kelasBPJSKes: 'I', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345693', statusBPJSTK: 'Aktif', tanggungan: [{ id: 'T015', nama: 'Endah Priyanto', hubungan: 'Istri', tanggalLahir: '1971-08-20', nomorKartu: '0001234582002', statusTanggungan: 'Aktif' }], iuranKesehatan: 33073, iuranKetenagakerjaan: 66146, tanggalDaftar: '1993-03-01' },
  { id: 'BPJS011', pegawaiId: 'P018', nomorKartuKesehatan: '0001234584001', kelasBPJSKes: 'II', statusBPJSKes: 'Aktif', nomorBPJSTK: 'KU10112345695', statusBPJSTK: 'Tidak Aktif', tanggungan: [], iuranKesehatan: 22084, iuranKetenagakerjaan: 0, tanggalDaftar: '2020-01-01' },
];

// ─── KONTRAK KERJA ────────────────────────────────────────────────────────────
export const dataKontrak: KontrakRecord[] = [
  { id: 'KK001', pegawaiId: 'P012', jenisKontrak: 'PKWT', nomorKontrak: 'PKWT.800/001/RS-AM/2024', tanggalMulai: '2024-03-01', tanggalSelesai: '2027-02-28', jabatanKontrak: 'Bidan Terampil', unitKerja: 'Instalasi Kebidanan & Kandungan', nilaiKontrak: 4500000, statusKontrak: 'Aktif', catatanKontrak: 'Kontrak PPPK periode 3 tahun' },
  { id: 'KK002', pegawaiId: 'P015', jenisKontrak: 'PKWT', nomorKontrak: 'PKWT.800/002/RS-AM/2024', tanggalMulai: '2024-01-01', tanggalSelesai: '2027-12-31', jabatanKontrak: 'Perawat Ahli Pertama', unitKerja: 'Instalasi ICU/ICCU', nilaiKontrak: 4800000, statusKontrak: 'Aktif', catatanKontrak: 'Kontrak PPPK periode 3 tahun' },
  { id: 'KK003', pegawaiId: 'P018', jenisKontrak: 'PKWT', nomorKontrak: 'PKWT.800/003/RS-AM/2023', tanggalMulai: '2023-01-01', tanggalSelesai: '2026-12-31', jabatanKontrak: 'Perawat Terampil', unitKerja: 'Instalasi Rawat Inap', nilaiKontrak: 4200000, statusKontrak: 'Aktif', catatanKontrak: 'Kontrak PPPK 3 tahun, evaluasi perpanjangan Desember 2026' },
  { id: 'KK004', pegawaiId: 'P001', jenisKontrak: 'Dokter Mitra', nomorKontrak: 'PKS.800/MITRA-001/RS-AM/2024', tanggalMulai: '2024-01-01', tanggalSelesai: '2026-12-31', jabatanKontrak: 'Dokter Spesialis Penyakit Dalam', unitKerja: 'Instalasi Rawat Jalan', nilaiKontrak: undefined, jadwalPraktik: 'Senin, Rabu, Jumat 08:00-14:00', statusKontrak: 'Aktif', catatanKontrak: 'Tambahan praktik di luar jam dinas. Jasa medis sesuai tarif.' },
  { id: 'KK005', pegawaiId: 'P005', jenisKontrak: 'Dokter Mitra', nomorKontrak: 'PKS.800/MITRA-002/RS-AM/2024', tanggalMulai: '2024-06-01', tanggalSelesai: '2026-05-31', jabatanKontrak: 'Dokter Spesialis Bedah', unitKerja: 'Instalasi Bedah Sentral (IBS)', nilaiKontrak: undefined, jadwalPraktik: 'Selasa, Kamis 08:00-14:00', statusKontrak: 'Aktif', catatanKontrak: 'Termasuk tindakan operasi elektif sesuai jadwal' },
  { id: 'KK006', pegawaiId: 'P011', jenisKontrak: 'Dokter Paruh Waktu', nomorKontrak: 'PKS.800/PARUH-001/RS-AM/2023', tanggalMulai: '2023-04-01', tanggalSelesai: '2025-03-31', jabatanKontrak: 'Dokter Spesialis Radiologi', unitKerja: 'Instalasi Radiologi', nilaiKontrak: 8000000, jadwalPraktik: 'Senin s.d. Jumat (setengah hari)', statusKontrak: 'Berakhir', catatanKontrak: 'Kontrak berakhir, perpanjangan sedang diproses' },
];

// ─── PENGHARGAAN ──────────────────────────────────────────────────────────────
export const dataPenghargaan: PenghargaanRecord[] = [
  { id: 'PH001', pegawaiId: 'P016', jenisPenghargaan: 'Satyalancana Karya Satya 30 Tahun', tanggalPemberian: '2023-08-17', nomorSK: 'KEP.PRES/SKS-30/VIII/2023/16', instansiPemberi: 'Presiden Republik Indonesia', tingkat: 'Nasional', keterangan: 'Diberikan pada HUT RI ke-78' },
  { id: 'PH002', pegawaiId: 'P005', jenisPenghargaan: 'Satyalancana Karya Satya 20 Tahun', tanggalPemberian: '2022-08-17', nomorSK: 'KEP.PRES/SKS-20/VIII/2022/05', instansiPemberi: 'Presiden Republik Indonesia', tingkat: 'Nasional' },
  { id: 'PH003', pegawaiId: 'P007', jenisPenghargaan: 'Satyalancana Karya Satya 20 Tahun', tanggalPemberian: '2022-08-17', nomorSK: 'KEP.PRES/SKS-20/VIII/2022/07', instansiPemberi: 'Presiden Republik Indonesia', tingkat: 'Nasional' },
  { id: 'PH004', pegawaiId: 'P001', jenisPenghargaan: 'Satyalancana Karya Satya 10 Tahun', tanggalPemberian: '2020-08-17', nomorSK: 'KEP.PRES/SKS-10/VIII/2020/01', instansiPemberi: 'Presiden Republik Indonesia', tingkat: 'Nasional' },
  { id: 'PH005', pegawaiId: 'P003', jenisPenghargaan: 'Nakes Teladan RS', tanggalPemberian: '2025-12-01', nomorSK: 'SK.800/TELADAN/XII/2025/03', instansiPemberi: 'RSUD Abdul Moeloek', tingkat: 'Instansi', keterangan: 'Perawat Teladan RSUD Abdul Moeloek Tahun 2025' },
  { id: 'PH006', pegawaiId: 'P004', jenisPenghargaan: 'Pegawai Inovatif', tanggalPemberian: '2025-07-15', nomorSK: 'SK.800/INOVATIF/VII/2025/04', instansiPemberi: 'Gubernur Lampung', tingkat: 'Provinsi', keterangan: 'Inovasi Sistem Informasi Farmasi Rumah Sakit' },
  { id: 'PH007', pegawaiId: 'P017', jenisPenghargaan: 'ASN Teladan Tingkat Provinsi', tanggalPemberian: '2024-08-17', nomorSK: 'KEP.GUB.LAMPUNG/TELADAN/VIII/2024/17', instansiPemberi: 'Gubernur Lampung', tingkat: 'Provinsi', keterangan: 'ASN Teladan Bidang Kesehatan Provinsi Lampung 2024' },
  { id: 'PH008', pegawaiId: 'P011', jenisPenghargaan: 'Satyalancana Karya Satya 20 Tahun', tanggalPemberian: '2020-08-17', nomorSK: 'KEP.PRES/SKS-20/VIII/2020/11', instansiPemberi: 'Presiden Republik Indonesia', tingkat: 'Nasional' },
];

// ─── MUTASI & PROMOSI ─────────────────────────────────────────────────────────
export const dataMutasi: MutasiRecord[] = [
  { id: 'MT001', pegawaiId: 'P007', jenisMutasi: 'Promosi Jabatan', unitKerjaAsal: 'Sub Bagian Kepegawaian & Umum', jabatanAsal: 'Analis Kepegawaian Pertama', unitKerjaTujuan: 'Sub Bagian Kepegawaian & Umum', jabatanTujuan: 'Kepala Sub Bagian Kepegawaian & Umum', golonganAsal: 'III/b', golonganTujuan: 'III/c', tanggalUsulan: '2017-12-01', tanggalBerlaku: '2018-01-01', nomorSK: 'SK.800/PROM/2018/007', status: 'Berlaku', alasan: 'Promosi berdasarkan penilaian kinerja sangat baik dan kompetensi struktural' },
  { id: 'MT002', pegawaiId: 'P017', jenisMutasi: 'Promosi Jabatan', unitKerjaAsal: 'Instalasi ICU/ICCU', jabatanAsal: 'Perawat Ahli Muda', unitKerjaTujuan: 'Bidang Keperawatan', jabatanTujuan: 'Kepala Bidang Keperawatan', golonganAsal: 'III/c', golonganTujuan: 'IV/a', tanggalUsulan: '2020-12-01', tanggalBerlaku: '2021-01-01', nomorSK: 'SK.800/PROM/2021/017', status: 'Berlaku', alasan: 'Promosi jabatan struktural Eselon III berdasarkan assessment dan SKP sangat baik' },
  { id: 'MT003', pegawaiId: 'P010', jenisMutasi: 'Rotasi', unitKerjaAsal: 'Instalasi Rekam Medis', jabatanAsal: 'Perekam Medis Ahli Pertama', unitKerjaTujuan: 'Instalasi Rekam Medis', jabatanTujuan: 'Perekam Medis Ahli Pertama', golonganAsal: 'III/b', golonganTujuan: 'III/b', tanggalUsulan: '2025-12-15', tanggalBerlaku: '2026-01-01', nomorSK: 'SK.800/ROT/2026/010', status: 'Berlaku', alasan: 'Rotasi dalam instalasi untuk pengembangan kompetensi' },
  { id: 'MT004', pegawaiId: 'P008', jenisMutasi: 'Mutasi Internal', unitKerjaAsal: 'Instalasi Gizi', jabatanAsal: 'Nutrisionis Ahli Pertama', unitKerjaTujuan: 'Bidang Penunjang Medis', jabatanTujuan: 'Nutrisionis Ahli Pertama', golonganAsal: 'III/a', golonganTujuan: 'III/a', tanggalUsulan: '2026-02-15', status: 'Disetujui', alasan: 'Kebutuhan tenaga di Bidang Penunjang Medis', catatanPejabat: 'Disetujui, menunggu penyiapan SK' },
  { id: 'MT005', pegawaiId: 'P013', jenisMutasi: 'Mutasi Internal', unitKerjaAsal: 'IPSRS', jabatanAsal: 'Teknisi Elektromedik Ahli Pertama', unitKerjaTujuan: 'Instalasi Radiologi', jabatanTujuan: 'Teknisi Elektromedik Ahli Pertama', golonganAsal: 'III/a', golonganTujuan: 'III/a', tanggalUsulan: '2026-03-01', status: 'Usulan', alasan: 'Penempatan sesuai keahlian peralatan radiologi yang baru' },
  { id: 'MT006', pegawaiId: 'P020', jenisMutasi: 'Mutasi Eksternal', unitKerjaAsal: 'Bagian Tata Usaha', jabatanAsal: 'Pranata Komputer Ahli Pertama', unitKerjaTujuan: 'Dinas Kesehatan Provinsi Lampung', jabatanTujuan: 'Pranata Komputer Ahli Pertama', golonganAsal: 'III/b', golonganTujuan: 'III/b', tanggalUsulan: '2026-02-01', status: 'Ditolak', alasan: 'Permintaan mutasi atas kemauan sendiri', catatanPejabat: 'Ditolak karena formasi di instansi tujuan penuh' },
];

// ─── KOMITE RS ────────────────────────────────────────────────────────────────
export const dataAnggotaKomite: AnggotaKomite[] = [
  { id: 'AK001', pegawaiId: 'P011', namaKomite: 'Komite Medik', subKomite: undefined, jabatanKomite: 'Ketua Komite Medik', tanggalMulai: '2023-01-01', tanggalSelesai: '2026-12-31', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-MED/I/2023/001' },
  { id: 'AK002', pegawaiId: 'P001', namaKomite: 'Komite Medik', subKomite: 'Subkomite Kredensial', jabatanKomite: 'Ketua Subkomite Kredensial', tanggalMulai: '2023-01-01', tanggalSelesai: '2026-12-31', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-MED/I/2023/001' },
  { id: 'AK003', pegawaiId: 'P005', namaKomite: 'Komite Medik', subKomite: 'Subkomite Mutu Profesi', jabatanKomite: 'Ketua Subkomite Mutu', tanggalMulai: '2023-01-01', tanggalSelesai: '2026-12-31', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-MED/I/2023/001' },
  { id: 'AK004', pegawaiId: 'P002', namaKomite: 'Komite Medik', subKomite: 'Subkomite Etik & Disiplin Profesi', jabatanKomite: 'Anggota', tanggalMulai: '2023-01-01', tanggalSelesai: '2026-12-31', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-MED/I/2023/001' },
  { id: 'AK005', pegawaiId: 'P017', namaKomite: 'Komite Keperawatan', subKomite: undefined, jabatanKomite: 'Ketua Komite Keperawatan', tanggalMulai: '2021-01-01', tanggalSelesai: '2024-12-31', statusKomite: 'Tidak Aktif', nomorSK: 'SK.800/KOM-KEP/I/2021/001' },
  { id: 'AK006', pegawaiId: 'P017', namaKomite: 'Komite Keperawatan', subKomite: undefined, jabatanKomite: 'Ketua Komite Keperawatan', tanggalMulai: '2025-01-01', tanggalSelesai: '2028-12-31', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-KEP/I/2025/001' },
  { id: 'AK007', pegawaiId: 'P003', namaKomite: 'Komite Keperawatan', subKomite: 'Subkomite Kredensial', jabatanKomite: 'Ketua Subkomite Kredensial', tanggalMulai: '2025-01-01', tanggalSelesai: '2028-12-31', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-KEP/I/2025/001' },
  { id: 'AK008', pegawaiId: 'P015', namaKomite: 'Komite Keperawatan', subKomite: 'Subkomite Mutu', jabatanKomite: 'Anggota', tanggalMulai: '2025-01-01', tanggalSelesai: '2028-12-31', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-KEP/I/2025/001' },
  { id: 'AK009', pegawaiId: 'P013', namaKomite: 'Komite K3RS', subKomite: undefined, jabatanKomite: 'Sekretaris Komite K3RS', tanggalMulai: '2024-01-01', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-K3RS/I/2024/001' },
  { id: 'AK010', pegawaiId: 'P019', namaKomite: 'Komite Etik & Hukum', subKomite: undefined, jabatanKomite: 'Ketua Komite Etik & Hukum', tanggalMulai: '2023-07-01', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-ETIK/VII/2023/001' },
  { id: 'AK011', pegawaiId: 'P004', namaKomite: 'Komite Nakes Lain', subKomite: 'Subkomite Farmasi & Terapi', jabatanKomite: 'Ketua Subkomite Farmasi', tanggalMulai: '2024-03-01', statusKomite: 'Aktif', nomorSK: 'SK.800/KOM-NAKES/III/2024/001' },
];

export const dataKegiatanKomite: KegiatanKomite[] = [
  { id: 'KK001', namaKomite: 'Komite Medik', tanggal: '2026-03-05', jenisKegiatan: 'Rapat Rutin', agenda: 'Evaluasi pelaksanaan kredensial dokter, review insiden medis Februari 2026', peserta: ['P011', 'P001', 'P005', 'P002'], status: 'Selesai', hasilKeputusan: 'Kredensial dr. Siti Rahayu dan dr. Hendra Gunawan dilanjutkan ke tahap peer review' },
  { id: 'KK002', namaKomite: 'Komite Keperawatan', tanggal: '2026-03-10', jenisKegiatan: 'Sidang Kredensial', agenda: 'Kredensial ulang 5 perawat unit ICU/ICCU yang masa kredensialnya akan habis', peserta: ['P017', 'P003', 'P015'], status: 'Dijadwalkan', hasilKeputusan: '' },
  { id: 'KK003', namaKomite: 'Komite K3RS', tanggal: '2026-02-28', jenisKegiatan: 'Rapat Rutin', agenda: 'Review insiden K3 Januari-Februari 2026, evaluasi program vaksinasi nakes', peserta: ['P013', 'P016'], status: 'Selesai', hasilKeputusan: 'Percepatan vaksinasi Hepatitis B untuk 3 nakes yang belum lengkap, perbaikan SOP handling jarum suntik' },
  { id: 'KK004', namaKomite: 'Komite Medik', tanggal: '2026-03-20', jenisKegiatan: 'Sidang Disiplin', agenda: 'Evaluasi dugaan pelanggaran etik profesi medis - kasus DR-001/2026', peserta: ['P011', 'P001', 'P002', 'P019'], status: 'Dijadwalkan', hasilKeputusan: '' },
  { id: 'KK005', namaKomite: 'Komite Etik & Hukum', tanggal: '2026-03-15', jenisKegiatan: 'Rapat Rutin', agenda: 'Review kebijakan persetujuan tindakan medis, pembaruan Hospital Bylaws Bab IV', peserta: ['P019', 'P016'], status: 'Berlangsung', hasilKeputusan: '' },
];

// ─── HUBUNGAN INDUSTRIAL ──────────────────────────────────────────────────────
export const dataGrievance: GrievanceRecord[] = [
  { id: 'GR001', pegawaiId: 'P018', tanggalPengaduan: '2026-01-10', kategori: 'Kontrak', deskripsi: 'Pegawai mengajukan keberatan atas tidak diperpanjangnya kontrak sementara kinerja dinilai baik', status: 'Selesai', resolusi: 'Kontrak diperpanjang 1 tahun setelah evaluasi ulang oleh manajemen', tanggalResolusi: '2026-01-25', mediator: 'Budi Santoso, S.E (Kasubag Kepegawaian)' },
  { id: 'GR002', pegawaiId: 'P006', tanggalPengaduan: '2026-02-05', kategori: 'Keselamatan Kerja', deskripsi: 'Perawat IGD mengadukan kurangnya APD (sarung tangan nitril) yang tersedia di unit kerja sehingga berisiko pajanan', status: 'Selesai', resolusi: 'Pengadaan APD dipercepat, stok APD di IGD ditambah, SOP permintaan APD disederhanakan', tanggalResolusi: '2026-02-15', mediator: 'Teguh Prasetyo, S.T (K3RS)' },
  { id: 'GR003', pegawaiId: 'P009', tanggalPengaduan: '2026-02-20', kategori: 'Gaji', deskripsi: 'Tunjangan kinerja bulan Januari 2026 tidak diterima sesuai besaran yang seharusnya', status: 'Mediasi', mediator: 'Sri Wahyuni, S.E., M.M (Kabag TU)' },
  { id: 'GR004', pegawaiId: 'P014', tanggalPengaduan: '2026-03-01', kategori: 'Lingkungan Kerja', deskripsi: 'Pengaduan tentang kondisi ruang kerja rekam medis yang panas dan kurang ventilasi', status: 'Diterima' },
];

export const dataPHK: PHKRecord[] = [
  { id: 'PHK001', pegawaiId: 'P016', alasanPHK: 'Mencapai Batas Usia Pensiun (BUP)', jenisPHK: 'Pensiun Dini', tanggalPHK: '2029-05-31', masaKerja: '36 Tahun', pesangon: 0, uangPisah: 0, uangPenggantianHak: 0, totalPesangon: 0, nomorSK: '', status: 'Proses', catatan: 'Persiapan pensiun 3 tahun ke depan, pengajuan Taspen sudah dimulai' },
  { id: 'PHK002', pegawaiId: 'P011', alasanPHK: 'Mencapai Batas Usia Pensiun (BUP)', jenisPHK: 'Pensiun Dini', tanggalPHK: '2031-09-30', masaKerja: '34 Tahun', pesangon: 0, uangPisah: 0, uangPenggantianHak: 0, totalPesangon: 0, nomorSK: '', status: 'Proses', catatan: 'BUP Dokter Spesialis 65 tahun' },
];
