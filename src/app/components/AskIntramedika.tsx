import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X, Send, Sparkles, ChevronDown, Minimize2, Bot, User,
  BookOpen, Clock, TrendingUp, FileText,
  Shield, GraduationCap, Calendar, DollarSign,
  ThumbsUp, ThumbsDown, Copy, RotateCcw,
  AlertTriangle, Activity, BadgeCheck, Stethoscope,
  Info, ChevronRight, Trash2,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// ─── Storage key ──────────────────────────────────────────────────────────────
const CHAT_STORAGE_KEY = 'intramedika_chat_v2';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string for easy JSON serialization
  feedback?: 'up' | 'down' | null;
  suggestions?: string[];
  isContext?: boolean; // pinned context info card
}

interface QuickTopic {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  query: string;
}

// ─── Real-time user context snapshot ─────────────────────────────────────────
interface UserContext {
  nama: string;
  jabatan: string;
  unitKerja: string;
  golongan: string;
  statusPegawai: string;
  sisaCutiTahunan: number;
  cutiDiambil: number;
  cutiPending: number;
  skpTerakhir: { periode: string; nilai: number; kategori: string } | null;
  jadwalHariIni: string;
  jadwalMingguIni: Array<{ tanggal: string; shift: string; jamMulai: string; jamSelesai: string }>;
  strStatus: { nomor: string; expired: string; status: string } | null;
  sipStatus: { nomor: string; expired: string; jenis: string; status: string } | null;
  credentialingStatus: string | null;
  totalAbsensiMaret: { hadir: number; alpha: number; terlambat: number };
  vaksinasiTerbaru: string | null;
  mcuTerbaru: string | null;
  insidenK3RS: number;
}

// ─── Knowledge base ───────────────────────────────────────────────────────────
const STATIC_KB: Record<string, { answer: string; suggestions?: string[] }> = {
  cuti: {
    answer: `**Manajemen Cuti ASN** (PP No. 11/2017)\n\nJenis-jenis cuti:\n\n📅 **Cuti Tahunan** – 12 hari kerja/tahun (dapat digabung maks. 24 hari)\n🤒 **Cuti Sakit** – Maks. 1 tahun + perpanjangan 6 bulan\n🤰 **Cuti Melahirkan** – 3 bulan (persalinan ke-1 s.d. ke-3)\n✈️ **Cuti Besar** – 3 bulan setelah 6 tahun masa kerja\n⛪ **Cuti Alasan Penting** – Ibadah haji/keperluan keluarga\n📋 **Cuti di Luar Tanggungan Negara** – Maks. 3 tahun (persetujuan BKN)\n\nUntuk mengajukan → modul **Manajemen Cuti** → **+ Ajukan Cuti**.`,
    suggestions: ['Berapa sisa cuti saya?', 'Prosedur pengajuan cuti besar', 'Cuti melahirkan PPPK'],
  },
  pangkat: {
    answer: `**Kenaikan Pangkat ASN** (PP No. 11/2017 Pasal 66–83)\n\nJenis Kenaikan Pangkat:\n\n⬆️ **Reguler** – Setiap 4 tahun, nilai SKP minimal Baik\n🏆 **Pilihan** – Prestasi kerja luar biasa (maks. 3x)\n📚 **Anumerta** – PNS meninggal dalam/karena tugas\n🎓 **Penyesuaian Ijazah** – Menyelesaikan pendidikan lebih tinggi\n\n**Syarat umum:**\n- SKP 2 tahun terakhir ≥ Baik\n- Masa kerja di pangkat ≥ 4 tahun\n- Tidak sedang menjalani hukuman disiplin\n\nCek di modul **Kenaikan Pangkat** → Tab **Periode Berikutnya**.`,
    suggestions: ['Syarat kenaikan pangkat pilihan', 'Dokumen yang diperlukan', 'Pangkat fungsional dokter'],
  },
  skp: {
    answer: `**SKP – Sasaran Kinerja Pegawai** (PermenPAN-RB No. 6/2022)\n\n📊 **Rencana Kinerja** – Disusun awal tahun/periode\n📈 **Realisasi** – Dicatat setiap bulan/triwulan\n⭐ **Penilaian** – Oleh Pejabat Penilai setiap semester\n\n**Kategori Nilai 2022:**\n- Sangat Baik: ≥ 110%\n- Baik: 90%–109%\n- Cukup: 76%–89%\n- Kurang: 61%–75%\n- Sangat Kurang: < 60%\n\n**Komponen:** Hasil kerja (kuantitatif & kualitatif) + Perilaku kerja\n\nLihat SKP di modul **SKP & Penilaian Kinerja**.`,
    suggestions: ['Cara input realisasi SKP', 'SKP tenaga medis fungsional', 'Nilai SKP untuk kenaikan pangkat'],
  },
  absensi: {
    answer: `**Sistem Presensi RSUD Abdul Moeloek**\n\n🏥 **Shift Pagi** – 07.00–14.00 WIB\n🌙 **Shift Sore** – 14.00–21.00 WIB\n🌟 **Shift Malam** – 21.00–07.00 WIB\n💼 **Non-Shift (Adm)** – 07.30–15.30 WIB\n\n**Toleransi Keterlambatan:** 7,5 menit\n**Presensi:** Finger print + aplikasi SIAP\n\nKetidakhadiran tanpa keterangan mempengaruhi:\n- Tunjangan kinerja (potongan per hari)\n- Nilai perilaku SKP\n- Remunerasi bulan berjalan\n\nRekap ada di modul **Presensi / Absensi**.`,
    suggestions: ['Rekap absensi saya bulan ini', 'Prosedur ijin tidak hadir', 'Dampak absen terhadap tunjangan'],
  },
  gaji: {
    answer: `**Komponen Penggajian ASN** (PP No. 15/2019)\n\n💰 **Gaji Pokok** – Sesuai golongan/ruang\n📌 **Tunjangan Istri/Suami** – 10% gaji pokok\n👶 **Tunjangan Anak** – 2% × maks. 2 anak\n🏠 **Tunjangan Pangan** – Rp 10.000/hari (maks. 22 hari)\n⚕️ **Tunjangan Jabatan Fungsional** – Sesuai jenjang\n📊 **TPP/Remunerasi** – Berdasarkan kinerja & kehadiran\n🏆 **Tunjangan Profesi** – Dokter, perawat, dll.\n\n**Potongan:**\n- Iuran JKN: 1% gaji pokok\n- Iuran JHT: 3% gaji pokok\n- PPh 21: Sesuai PTKP\n\nSlip gaji di modul **Penggajian & Tunjangan**.`,
    suggestions: ['Cara hitung TPP/remunerasi', 'Gaji PPPK vs PNS', 'Potongan iuran pensiun'],
  },
  disiplin: {
    answer: `**Disiplin Pegawai ASN** (PP No. 94/2021)\n\n⚠️ **Hukuman Ringan:**\n- Teguran lisan\n- Teguran tertulis\n- Pernyataan tidak puas\n\n🔴 **Hukuman Sedang:**\n- Penundaan kenaikan gaji berkala\n- Penundaan kenaikan pangkat\n- Penurunan pangkat 1 tahun\n\n🚫 **Hukuman Berat:**\n- Penurunan pangkat 3 tahun\n- Pembebasan dari jabatan\n- Pemberhentian dengan/tidak hormat\n\nRiwayat disiplin di modul **Disiplin Pegawai**.`,
    suggestions: ['Prosedur pemeriksaan disiplin', 'Hak pegawai yang dikenai hukuman', 'Banding hukuman disiplin'],
  },
  diklat: {
    answer: `**Program Diklat & Pengembangan Kompetensi**\n\n🎓 **Diklat Prajabatan** – Wajib CPNS/CPPPK (Latsar BASNas/BPSDM)\n📚 **Diklat Teknis** – Sesuai bidang tugas (klinis & non-klinis)\n🏅 **Diklat Fungsional** – Pengangkatan & kenaikan jenjang\n💼 **Diklat Kepemimpinan** – PKP (Tk. III) & PKA (Tk. II)\n🌐 **Pendidikan Formal** – Tugas/izin belajar\n🏥 **In-House Training** – BCLS, BTCLS, K3RS, PPI\n\n**Kewajiban tahunan:** Minimal 20 JP pelatihan/tahun\nSemua sertifikat wajib diunggah ke SIMKA/SIASN.\n\nDaftar diklat di modul **Diklat & Kompetensi**.`,
    suggestions: ['Cara daftar diklat online', 'Syarat tugas belajar', 'Upload sertifikat diklat'],
  },
  pppk: {
    answer: `**PPPK – Pegawai Pemerintah dengan Perjanjian Kerja** (PP No. 49/2018)\n\n📜 **Kontrak:** 1–5 tahun, dapat diperpanjang\n💰 **Gaji:** Setara PNS golongan yang sama\n🏥 **JKN:** Ditanggung pemberi kerja\n📋 **SKP:** Wajib seperti PNS\n❌ **Tidak mendapat:** Pensiun, kenaikan pangkat reguler\n✅ **Mendapat:** Cuti tahunan, sakit, melahirkan, JKK, JKM\n\n**Berakhirnya PPPK:**\n- Habis masa perjanjian kerja\n- Meninggal dunia / atas permintaan sendiri\n- Pelanggaran berat\n\n**Konversi ke PNS:** Saat ini belum diatur, kecuali ikut seleksi umum.`,
    suggestions: ['Perpanjangan kontrak PPPK', 'Hak cuti PPPK', 'Perbedaan PPPK dan PNS'],
  },
  pensiun: {
    answer: `**Batas Usia Pensiun (BUP) ASN** (PP No. 11/2017)\n\n👴 **Jabatan Pelaksana / Adm / Pengawas** – 58 tahun\n🎯 **Jabatan Pimpinan Tinggi** – 60 tahun\n⚕️ **JF Ahli Utama** – 65 tahun\n🩺 **Dokter Spesialis / Konsultan** – 65 tahun\n👩‍⚕️ **Perawat / Bidan Ahli Muda-Pertama** – 58 tahun\n🔬 **Pranata Lab, Radiografer** – 58–60 tahun\n\n**Pensiun Dini:** Usia 50 tahun + 20 tahun masa kerja\n**Uang Pensiun:** Dibayar PT Taspen setiap bulan\n\nMonitor pegawai mendekati BUP di modul **Data Pegawai** → Filter Status.`,
    suggestions: ['Dokumen pengurusan pensiun', 'Besaran uang pensiun', 'Pensiun janda/duda ASN'],
  },
  surat: {
    answer: `**Layanan Surat Kepegawaian Digital**\n\n📄 **Surat Keterangan Aktif Bekerja** – 1 hari kerja\n📋 **Surat Keterangan Penghasilan** – Untuk KPR/kredit\n🎖️ **Surat Keterangan Masa Kerja** – Riwayat dinas lengkap\n📑 **SK Pengangkatan Jabatan** – Dari BKD/BKN\n🏥 **Surat Penugasan** – Diklat/seminar/konferensi\n✈️ **Surat Ijin Bepergian** – Ke luar kota/negeri\n\n**Pejabat Penandatangan:**\n*dr. IMAM GHOZALI, Sp.An., M.Kes.*\nNIP. 19680415 199703 1 001\n\nBuat surat di modul **Surat Kepegawaian** → Pilih jenis surat.`,
    suggestions: ['Cara cetak SK jabatan', 'Status permohonan surat', 'Surat keterangan untuk BPJS'],
  },
  str: {
    answer: `**STR – Surat Tanda Registrasi** (PMK No. 83/2019 & UU Kesehatan No. 17/2023)\n\n📋 **STR adalah** lisensi wajib bagi seluruh tenaga kesehatan untuk praktik di Indonesia.\n\n**Masa berlaku:** 5 tahun (perlu perpanjangan)\n**Penerbit:** Konsil masing-masing profesi\n- Dokter → **Konsil Kedokteran Indonesia (KKI)**\n- Perawat → **Konsil Keperawatan Indonesia**\n- Bidan → **Konsil Kebidanan Indonesia**\n- Apoteker → **Konsil Tenaga Kefarmasian**\n- ATLM → **Konsil ATLM Indonesia**\n\n**Syarat perpanjangan STR:**\n- Mengumpulkan 25 SKP (Satuan Kredit Profesi) selama 5 tahun\n- Bebas sanksi etik/disiplin profesi\n- Permohonan via **portal.ktki.or.id** atau **sisdmk.kemkes.go.id**\n\nCek status STR di modul **Credentialing & Lisensi**.`,
    suggestions: ['Cara perpanjang STR online', 'SKP untuk perpanjangan STR', 'STR saya akan expired kapan?'],
  },
  sip: {
    answer: `**SIP – Surat Izin Praktik** (PMK No. 2052/2011 & PMK No. 83/2019)\n\n📜 **SIP adalah** izin untuk menjalankan praktik klinis di satu fasilitas kesehatan.\n\n**Masa berlaku:** Sama dengan STR (5 tahun)\n**Penerbit:** Dinas Kesehatan Kab/Kota tempat faskes berada\n\n**Jenis SIP berdasarkan profesi:**\n- Dokter → SIP Dokter\n- Dokter Spesialis → SIP Dokter Spesialis\n- Perawat → SIPP (Surat Izin Praktik Perawat)\n- Bidan → SIPB (Surat Izin Praktik Bidan)\n- Apoteker → SIPA (Surat Izin Praktik Apoteker)\n\n**Syarat pengurusan SIP:**\n- STR aktif\n- Rekomendasi organisasi profesi\n- Surat pernyataan pimpinan faskes\n- Pas foto + kelengkapan administrasi\n\nPantau status di modul **Credentialing & Lisensi**.`,
    suggestions: ['Cara urus SIP baru', 'Perpanjangan SIP dokter', 'SIP saya aktif sampai kapan?'],
  },
  credentialing: {
    answer: `**Credentialing & Re-Credentialing Klinis** (PMK No. 755/2011 & SNARS Ed.2)\n\n🏥 **Credentialing** adalah proses verifikasi kompetensi tenaga medis sebelum diberikan **Kewenangan Klinis (Clinical Privilege)**.\n\n**Tahapan Credentialing:**\n1. Pengajuan permohonan ke **Komite Medik/Keperawatan**\n2. Verifikasi dokumen (STR, SIP, sertifikat kompetensi)\n3. Penilaian & rekomendasi Subkomite Kredensial\n4. Penerbitan **Surat Penugasan Klinis (SPK)**\n5. Penetapan Rincian Kewenangan Klinis (RKK)\n\n**Re-Credentialing** dilakukan:\n- Setiap 3 tahun sekali\n- Saat ada perluasan kewenangan klinis\n- Setelah sanksi/hukuman profesi\n\n**Implikasi:** Tanpa SPK aktif, tenaga medis **tidak boleh** melakukan tindakan klinis.\n\nLihat di modul **Credentialing & Lisensi**.`,
    suggestions: ['Proses pengajuan kewenangan klinis baru', 'Dokumen untuk re-credentialing', 'Status credentialing saya'],
  },
  k3rs: {
    answer: `**K3RS – Keselamatan dan Kesehatan Kerja Rumah Sakit** (PMK No. 66/2016)\n\n🛡️ **Program K3RS RSUD Abdul Moeloek mencakup:**\n\n**1. Kesehatan Pegawai:**\n- MCU (Medical Check Up) berkala setiap tahun\n- Vaksinasi wajib: Hepatitis B, COVID-19, Influenza\n- Pemantauan penyakit akibat kerja (PAK)\n\n**2. Keselamatan Kerja:**\n- Pelatihan APD sesuai area risiko\n- Penanganan bahan berbahaya (B3)\n- Pencegahan needlestick injury\n\n**3. Pelaporan Insiden:**\n- Insiden dilaporkan **maks. 2×24 jam** ke Tim K3RS\n- Formulir laporan tersedia di Instalasi K3RS (Lt. 1)\n- Grading risiko: Biru → Hijau → Kuning → Merah\n\n**4. Hak Pegawai K3:**\n- Jaminan Kecelakaan Kerja (JKK) dari BPJS\n- JKM (Jaminan Kematian)\n- Pemeriksaan kesehatan berkala\n\nLihat di modul **K3RS & Kesehatan Kerja**.`,
    suggestions: ['Cara lapor insiden K3RS', 'Vaksinasi wajib pegawai', 'MCU berkala kapan?'],
  },
  vaksinasi: {
    answer: `**Program Vaksinasi Tenaga Kesehatan RSUD Abdul Moeloek**\n\n💉 **Vaksinasi wajib berdasarkan PMK No. 66/2016:**\n\n| Vaksin | Dosis | Area Risiko |\n|--------|-------|-------------|\n| **Hepatitis B** | 3 dosis (0-1-6 bulan) | Semua tenaga kesehatan |\n| **COVID-19 (booster)** | Dosis ke-4 (bila tersedia) | Semua |\n| **Influenza** | 1 dosis/tahun | Klinis |\n| **Varisela** | 2 dosis | Non-imun |\n| **MMR** | 1-2 dosis | Kebidanan, Anak |\n| **Tifoid** | 1 dosis/3 tahun | Gizi, Sanitasi |\n\n**Cara mengakses vaksinasi:**\n→ Daftarkan ke **Tim K3RS** (Lt. 1 Gedung Utama)\n→ Jadwal vaksinasi diumumkan via WAG unit kerja\n\nRiwayat vaksinasi ada di modul **K3RS & Kesehatan Kerja**.`,
    suggestions: ['Status vaksinasi saya', 'Kapan MCU saya berikutnya', 'Lapor needlestick injury'],
  },
  mcu: {
    answer: `**MCU – Medical Check Up Berkala Tenaga Kesehatan**\n\n🩺 **MCU wajib** dilakukan 1 kali/tahun berdasarkan PMK No. 66/2016.\n\n**Paket MCU Standar RSUD Abdul Moeloek:**\n- Pemeriksaan fisik lengkap (BB, TB, TD, IMT)\n- Laboratorium: DL, UL, GDS, Kolesterol, Asam Urat, Fungsi Hati, Fungsi Ginjal\n- Rontgen thorax\n- EKG (usia > 40 tahun)\n- Pemeriksaan mata & THT\n- Pap smear (untuk pegawai wanita)\n\n**Area risiko khusus (tambahan):**\n- Radiologi: Dosimetri + Hitung Limfosit\n- Lab/Patologi: Hepatitis B, C, HbsAg\n- Farmasi: Tes fungsi paru\n\n**Jadwal MCU:**\nHubungi Tim K3RS atau lihat pengumuman di sistem HR APP.\n\nHasil MCU tersimpan di modul **K3RS & Kesehatan Kerja**.`,
    suggestions: ['Hasil MCU saya tahun ini', 'Paket MCU area risiko tinggi', 'Tindak lanjut hasil MCU abnormal'],
  },
  insiden: {
    answer: `**Pelaporan Insiden K3RS** (PMK No. 66/2016 & SNARS Ed.2)\n\n⚠️ **Jenis Insiden yang Wajib Dilaporkan:**\n- Kecelakaan kerja (tertusuk jarum, terpeleset, dll.)\n- Paparan B3 / bahan kimia berbahaya\n- Paparan darah / cairan tubuh pasien\n- Near miss (hampir celaka)\n- Kejadian Tidak Diinginkan (KTD)\n\n**Prosedur Pelaporan:**\n1. Tangani dulu kondisi darurat → IGD jika perlu\n2. Isi **Formulir Pelaporan Insiden** (manual/online)\n3. Laporkan ke **atasan langsung** + **Tim K3RS**\n4. **Batas waktu:** Maks. 2×24 jam setelah kejadian\n5. Investigasi grading risiko oleh Tim K3RS\n\n**Kontak Darurat K3RS:**\n📞 Ext. 333 (Tim K3RS) | IGD: Ext. 118\n\nData insiden tersimpan di modul **K3RS & Kesehatan Kerja**.`,
    suggestions: ['Cara isi formulir insiden', 'Tindaklanjut setelah paparan darah', 'Hak JKK setelah kecelakaan kerja'],
  },
};

// ─── Quick Topics ─────────────────────────────────────────────────────────────
const QUICK_TOPICS: QuickTopic[] = [
  { id: 'cuti', icon: Calendar, label: 'Cuti & Izin', color: 'bg-orange-50 text-orange-600 border-orange-200', query: 'Berapa sisa cuti saya tahun ini?' },
  { id: 'absensi', icon: Clock, label: 'Presensi', color: 'bg-blue-50 text-blue-600 border-blue-200', query: 'Rekap absensi saya bulan ini' },
  { id: 'skp', icon: FileText, label: 'SKP & Kinerja', color: 'bg-purple-50 text-purple-600 border-purple-200', query: 'Status SKP terbaru saya' },
  { id: 'shift', icon: Activity, label: 'Jadwal Shift', color: 'bg-cyan-50 text-cyan-600 border-cyan-200', query: 'Jadwal shift saya minggu ini' },
  { id: 'str', icon: BadgeCheck, label: 'STR / SIP', color: 'bg-green-50 text-green-600 border-green-200', query: 'Status STR dan SIP saya' },
  { id: 'credentialing', icon: Stethoscope, label: 'Credentialing', color: 'bg-teal-50 text-teal-600 border-teal-200', query: 'Proses credentialing kewenangan klinis' },
  { id: 'k3rs', icon: Shield, label: 'K3RS', color: 'bg-red-50 text-red-600 border-red-200', query: 'Program K3RS dan kesehatan kerja' },
  { id: 'vaksinasi', icon: Activity, label: 'Vaksinasi', color: 'bg-pink-50 text-pink-600 border-pink-200', query: 'Vaksinasi wajib tenaga kesehatan' },
  { id: 'pangkat', icon: TrendingUp, label: 'Kenaikan Pangkat', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', query: 'Syarat kenaikan pangkat reguler' },
  { id: 'gaji', icon: DollarSign, label: 'Penggajian', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', query: 'Komponen gaji dan tunjangan ASN' },
  { id: 'diklat', icon: GraduationCap, label: 'Diklat', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', query: 'Program diklat yang tersedia' },
  { id: 'surat', icon: BookOpen, label: 'Surat Dinas', color: 'bg-violet-50 text-violet-600 border-violet-200', query: 'Layanan surat kepegawaian' },
];

// ─── Keyword matcher ──────────────────────────────────────────────────────────
const KEYWORD_MAP: Record<string, string> = {
  cuti: 'cuti', izin: 'cuti', libur: 'cuti', 'sisa cuti': 'cuti',
  pangkat: 'pangkat', kenaikan: 'pangkat', golongan: 'pangkat',
  skp: 'skp', kinerja: 'skp', sasaran: 'skp', penilaian: 'skp',
  absensi: 'absensi', presensi: 'absensi', hadir: 'absensi', terlambat: 'absensi', kehadiran: 'absensi',
  gaji: 'gaji', penghasilan: 'gaji', tunjangan: 'gaji', remunerasi: 'gaji', slip: 'gaji',
  disiplin: 'disiplin', hukuman: 'disiplin', pelanggaran: 'disiplin',
  diklat: 'diklat', pelatihan: 'diklat', kompetensi: 'diklat', sertifikat: 'diklat',
  pppk: 'pppk', 'perjanjian kerja': 'pppk', kontrak: 'pppk',
  pensiun: 'pensiun', bup: 'pensiun', purnatugas: 'pensiun',
  surat: 'surat', 'surat keterangan': 'surat', 'sk jabatan': 'surat',
  str: 'str', registrasi: 'str', 'surat tanda': 'str',
  sip: 'sip', 'izin praktik': 'sip', 'surat izin': 'sip', sipp: 'sip', sipa: 'sip', sipb: 'sip',
  credentialing: 'credentialing', 'kewenangan klinis': 'credentialing', spk: 'credentialing', rkk: 'credentialing', 'clinical privilege': 'credentialing',
  k3rs: 'k3rs', 'keselamatan kerja': 'k3rs', 'kesehatan kerja': 'k3rs', k3: 'k3rs',
  vaksinasi: 'vaksinasi', vaksin: 'vaksinasi', imunisasi: 'vaksinasi', hepatitis: 'vaksinasi',
  mcu: 'mcu', 'medical check': 'mcu', 'check up': 'mcu', 'cek kesehatan': 'mcu',
  insiden: 'insiden', kecelakaan: 'insiden', 'tertusuk jarum': 'insiden', 'needlestick': 'insiden', paparan: 'insiden',
  shift: 'absensi', jadwal: 'absensi',
};

function findStaticAnswer(query: string): { key: string; answer: string; suggestions?: string[] } | null {
  const q = query.toLowerCase();
  for (const [kw, key] of Object.entries(KEYWORD_MAP)) {
    if (q.includes(kw) && STATIC_KB[key]) {
      return { key, ...STATIC_KB[key] };
    }
  }
  return null;
}

// ─── Real-time personalized answer builder ────────────────────────────────────
function buildPersonalizedAnswer(query: string, ctx: UserContext): string | null {
  const q = query.toLowerCase();

  // Cuti sisa
  if (q.includes('sisa cuti') || q.includes('berapa cuti') || (q.includes('cuti') && (q.includes('sisa') || q.includes('berapa') || q.includes('saya')))) {
    const warna = ctx.sisaCutiTahunan <= 3 ? '🔴' : ctx.sisaCutiTahunan <= 6 ? '🟡' : '🟢';
    return `**Status Cuti Tahunan Anda – ${new Date().getFullYear()}**\n\n${warna} **Sisa Cuti:** ${ctx.sisaCutiTahunan} hari kerja\n📤 **Sudah diambil:** ${ctx.cutiDiambil} hari\n⏳ **Menunggu persetujuan:** ${ctx.cutiPending} hari\n📊 **Kuota Tahunan:** 12 hari kerja\n\n${ctx.sisaCutiTahunan <= 3 ? '⚠️ Sisa cuti Anda hampir habis. Prioritaskan penggunaan sebelum akhir tahun.' : ctx.sisaCutiTahunan >= 10 ? '💡 Anda masih memiliki banyak sisa cuti. Jangan lupa manfaatkan hak cuti Anda.' : 'Cuti Anda dalam kondisi normal.'}\n\nUntuk mengajukan → modul **Manajemen Cuti** → **+ Ajukan Cuti**.`;
  }

  // SKP status
  if ((q.includes('skp') || q.includes('kinerja')) && (q.includes('saya') || q.includes('status') || q.includes('nilai') || q.includes('terbaru'))) {
    if (ctx.skpTerakhir) {
      const { periode, nilai, kategori } = ctx.skpTerakhir;
      const emoji = nilai >= 110 ? '🌟' : nilai >= 90 ? '✅' : nilai >= 76 ? '⚠️' : '🔴';
      return `**Status SKP Terkini Anda**\n\n${emoji} **Nilai SKP:** ${nilai.toFixed(1)}%\n📋 **Kategori:** ${kategori}\n📅 **Periode:** ${periode}\n\n**Interpretasi:**\n${nilai >= 110 ? '• Sangat Baik – Anda berpotensi mendapat kenaikan pangkat pilihan!' : nilai >= 90 ? '• Baik – Nilai Anda memenuhi syarat kenaikan pangkat reguler.' : nilai >= 76 ? '• Cukup – Perlu peningkatan agar memenuhi syarat kenaikan pangkat.' : '• Kurang – Segera konsultasi dengan atasan dan Subbag Kepegawaian.'}\n\nDetail SKP di modul **SKP & Penilaian Kinerja**.`;
    }
    return `**Status SKP Anda**\n\nBelum ditemukan data SKP untuk akun Anda di sistem.\nKemungkinan:\n- SKP belum diinput oleh pejabat penilai\n- Pegawai baru / dalam masa orientasi\n\nHubungi **Subbag Kepegawaian & SDM** ext. 101 untuk klarifikasi.`;
  }

  // Jadwal shift
  if (q.includes('jadwal') || q.includes('shift') || q.includes('dinas')) {
    if (ctx.jadwalMingguIni.length > 0) {
      const shiftList = ctx.jadwalMingguIni
        .slice(0, 5)
        .map(j => `📅 ${j.tanggal}: **${j.shift}** (${j.jamMulai}–${j.jamSelesai})`).join('\n');
      return `**Jadwal Shift Anda Minggu Ini**\n\n${shiftList}\n\n${ctx.jadwalHariIni ? `**Hari ini:** ${ctx.jadwalHariIni}` : '**Hari ini:** Tidak ada jadwal shift terdaftar'}\n\nJadwal lengkap di modul **Penjadwalan Shift**.`;
    }
    return `**Jadwal Shift Anda**\n\nTidak ditemukan jadwal shift untuk akun Anda minggu ini.\nKemungkinan: jabatan administrasi non-shift atau jadwal belum diinput.\n\nKonfirmasi ke **Kepala Unit Kerja** atau lihat di modul **Penjadwalan Shift**.`;
  }

  // STR/SIP status
  if ((q.includes('str') || q.includes('sip') || q.includes('lisensi') || q.includes('registrasi')) && (q.includes('saya') || q.includes('status') || q.includes('kapan'))) {
    let response = `**Status STR & SIP Anda**\n\n`;
    if (ctx.strStatus) {
      const { nomor, expired, status } = ctx.strStatus;
      const emoji = status === 'Aktif' ? '✅' : status === 'Akan Expired' ? '⚠️' : '🔴';
      response += `${emoji} **STR:** ${nomor}\n   Status: **${status}** | Exp: ${expired}\n\n`;
    } else {
      response += `📋 **STR:** Belum terdaftar di sistem\n\n`;
    }
    if (ctx.sipStatus) {
      const { nomor, expired, jenis, status } = ctx.sipStatus;
      const emoji = status === 'Aktif' ? '✅' : status === 'Akan Expired' ? '⚠️' : '🔴';
      response += `${emoji} **${jenis}:** ${nomor}\n   Status: **${status}** | Exp: ${expired}\n\n`;
    } else {
      response += `📋 **SIP:** Belum terdaftar di sistem\n\n`;
    }
    const hasWarning = ctx.strStatus?.status === 'Akan Expired' || ctx.sipStatus?.status === 'Akan Expired'
      || ctx.strStatus?.status === 'Expired' || ctx.sipStatus?.status === 'Expired';
    if (hasWarning) {
      response += `⚠️ **Tindakan diperlukan!** Segera urus perpanjangan STR/SIP Anda.\nKontak: Subbag Kepegawaian ext. 101 atau Bagian Credentialing.`;
    } else {
      response += `Semua dokumen lisensi Anda aktif. Pantau terus di modul **Credentialing & Lisensi**.`;
    }
    return response;
  }

  // Credentialing status
  if (q.includes('credentialing') && (q.includes('saya') || q.includes('status'))) {
    if (ctx.credentialingStatus) {
      return `**Status Credentialing Anda**\n\n📋 **Status Kewenangan Klinis:** ${ctx.credentialingStatus}\n\nUntuk detail Rincian Kewenangan Klinis (RKK) dan Surat Penugasan Klinis (SPK), silakan akses modul **Credentialing & Lisensi**.\n\nJika ingin mengajukan perluasan kewenangan, hubungi **Komite Medik/Keperawatan** di gedung administrasi lt. 2.`;
    }
    return `**Status Credentialing Anda**\n\nBelum ada data credentialing untuk akun Anda.\n\n${STATIC_KB.credentialing.answer}`;
  }

  // Absensi rekap
  if ((q.includes('absensi') || q.includes('presensi') || q.includes('kehadiran') || q.includes('rekap')) && q.includes('saya')) {
    const { hadir, alpha, terlambat } = ctx.totalAbsensiMaret;
    const total = hadir + alpha;
    const pct = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0';
    return `**Rekap Presensi Anda – Maret 2026**\n\n✅ **Hadir:** ${hadir} hari\n🚫 **Alpha/Tanpa Keterangan:** ${alpha} hari\n⏰ **Terlambat:** ${terlambat} hari\n📊 **Kehadiran:** ${pct}%\n\n${alpha > 0 ? `⚠️ Anda memiliki ${alpha} hari tanpa keterangan yang dapat mempengaruhi tunjangan kinerja.` : '✅ Rekam kehadiran Anda baik!'}\n\nDetail lengkap di modul **Presensi / Absensi**.`;
  }

  return null;
}

// ─── Default fallback ─────────────────────────────────────────────────────────
function buildFallback(query: string): { answer: string; suggestions: string[] } {
  return {
    answer: `Terima kasih atas pertanyaan Anda: **"${query}"**\n\nSaya sedang mencari informasi yang paling relevan. Untuk pertanyaan spesifik yang belum terjawab, silakan hubungi:\n\n📞 **Subbag Kepegawaian & SDM**\nRSUD Abdul Moeloek, Lt. 2 Gedung Administrasi\nTelp: (0721) 703312 ext. 101\n⏰ Jam layanan: 07.30–15.30 WIB`,
    suggestions: ['Sisa cuti saya', 'Status SKP terbaru', 'Jadwal shift minggu ini'],
  };
}

// ─── Markdown-like renderer ───────────────────────────────────────────────────
function RenderContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} className="font-semibold text-gray-900">{part}</strong>
            : <span key={j}>{part}</span>
        );
        return <div key={i} className="leading-relaxed text-[13px]">{rendered}</div>;
      })}
    </div>
  );
}

// ─── Context Summary Card ─────────────────────────────────────────────────────
function ContextCard({ ctx }: { ctx: UserContext }) {
  const strBadge = ctx.strStatus?.status === 'Aktif' ? 'bg-green-100 text-green-700' :
    ctx.strStatus?.status === 'Akan Expired' ? 'bg-yellow-100 text-yellow-700' :
    ctx.strStatus?.status === 'Expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500';

  const skpBadge = ctx.skpTerakhir
    ? (ctx.skpTerakhir.nilai >= 90 ? 'bg-green-100 text-green-700' : ctx.skpTerakhir.nilai >= 76 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
    : 'bg-gray-100 text-gray-500';

  return (
    <div className="mx-4 mb-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Info className="w-3 h-3 text-blue-600" />
        <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Info Kepegawaian Anda</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Cuti sisa:</span>
          <span className={`font-semibold ${ctx.sisaCutiTahunan <= 3 ? 'text-red-600' : ctx.sisaCutiTahunan <= 6 ? 'text-yellow-600' : 'text-green-600'}`}>
            {ctx.sisaCutiTahunan} hari
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">SKP:</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${skpBadge}`}>
            {ctx.skpTerakhir ? `${ctx.skpTerakhir.nilai.toFixed(0)}% – ${ctx.skpTerakhir.kategori}` : 'Belum ada'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">STR:</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${strBadge}`}>
            {ctx.strStatus?.status ?? 'Belum ada'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Shift hari ini:</span>
          <span className="font-medium text-gray-700 truncate">{ctx.jadwalHariIni || 'Non-shift'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AskIntramedika() {
  const {
    currentUser, cuti, absensi, skp, jadwalShift,
    str, sip, credentialing, insidenK3RS, vaksinasi, mcu,
  } = useAppContext();

  // ── Compute real-time user context ──────────────────────────────────────────
  const userCtx = useMemo<UserContext>(() => {
    const pegawaiId = currentUser?.pegawaiId ?? '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thisYear = now.getFullYear().toString();

    // Cuti tahunan
    const myCuti = cuti.filter(c => c.pegawaiId === pegawaiId);
    const cutiApproved = myCuti.filter(c =>
      c.status === 'Disetujui' && c.jenisCuti === 'Cuti Tahunan' && c.tanggalMulai.startsWith(thisYear)
    );
    const cutiPendingList = myCuti.filter(c => c.status === 'Pending' && c.jenisCuti === 'Cuti Tahunan');
    const cutiDiambil = cutiApproved.reduce((s, c) => s + (c.jumlahHari || 0), 0);
    const cutiPending = cutiPendingList.reduce((s, c) => s + (c.jumlahHari || 0), 0);
    const sisaCutiTahunan = Math.max(0, 12 - cutiDiambil);

    // SKP terbaru
    const mySKP = skp.filter(s => s.pegawaiId === pegawaiId)
      .sort((a, b) => b.tahun - a.tahun || b.semester - a.semester);
    const latestSKP = mySKP[0];
    const skpTerakhir = latestSKP ? {
      periode: `Semester ${latestSKP.semester} Tahun ${latestSKP.tahun}`,
      nilai: latestSKP.nilaiAkhir ?? 0,
      kategori: latestSKP.predikat ?? 'N/A',
    } : null;

    // Jadwal shift
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay() + 1);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    const myShifts = jadwalShift
      .filter(j => {
        if (j.pegawaiId !== pegawaiId) return false;
        const d = new Date(j.tanggal);
        return d >= thisWeekStart && d <= thisWeekEnd;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
      .map(j => ({
        tanggal: new Date(j.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        shift: j.jenisShift ?? 'Reguler',
        jamMulai: j.jamMulai ?? '07:30',
        jamSelesai: j.jamSelesai ?? '15:30',
      }));

    const todayShift = jadwalShift.find(j => j.pegawaiId === pegawaiId && j.tanggal === todayStr);
    const jadwalHariIni = todayShift ? (todayShift.jenisShift ?? 'Reguler') : '';

    // STR
    const mySTR = str.find(s => s.pegawaiId === pegawaiId);
    const strStatus = mySTR ? { nomor: mySTR.nomorSTR, expired: mySTR.tanggalExpired, status: mySTR.status } : null;

    // SIP
    const mySIP = sip.find(s => s.pegawaiId === pegawaiId);
    const sipStatus = mySIP ? {
      nomor: mySIP.nomorSIP,
      expired: mySIP.tanggalExpired,
      jenis: mySIP.jenisDokumen ?? 'SIP',
      status: mySIP.status,
    } : null;

    // Credentialing
    const myCred = credentialing.find(c => c.pegawaiId === pegawaiId);
    const credentialingStatus = myCred ? ((myCred as any).statusKredensial ?? myCred.status ?? null) : null;

    // Absensi Maret 2026
    const myAbsensi = absensi.filter(a => a.pegawaiId === pegawaiId && a.tanggal.startsWith('2026-03'));
    const hadirCount = myAbsensi.filter(a => a.status === 'Hadir').length;
    const alphaCount = myAbsensi.filter(a => a.status === 'Alpha').length;
    const terlambatCount = myAbsensi.filter(a => {
      if (a.status !== 'Hadir' || !a.jamMasuk) return false;
      const [h, m] = a.jamMasuk.split(':').map(Number);
      return h > 7 || (h === 7 && m > 38);
    }).length;

    // Vaksinasi terbaru
    const myVaksinasi = vaksinasi.filter(v => v.pegawaiId === pegawaiId)
      .sort((a, b) => ((b as any).tanggalVaksin ?? '').localeCompare((a as any).tanggalVaksin ?? ''));
    const vaksinasiTerbaru = myVaksinasi[0]
      ? `${(myVaksinasi[0] as any).jenisVaksin ?? 'Vaksinasi'} (${(myVaksinasi[0] as any).tanggalVaksin ?? '-'})`
      : null;

    // MCU terbaru
    const myMCU = mcu.filter(m => m.pegawaiId === pegawaiId)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const mcuTerbaru = myMCU[0] ? myMCU[0].tanggal : null;

    // Insiden K3RS (semua, bukan per pegawai karena datanya mungkin berbeda)
    const totalInsiden = insidenK3RS.length;

    return {
      nama: currentUser?.nama ?? 'Pegawai',
      jabatan: currentUser?.jabatan ?? '',
      unitKerja: currentUser?.unitKerja ?? '',
      golongan: currentUser?.golongan ?? '',
      statusPegawai: 'PNS',
      sisaCutiTahunan,
      cutiDiambil,
      cutiPending,
      skpTerakhir,
      jadwalHariIni,
      jadwalMingguIni: myShifts,
      strStatus,
      sipStatus,
      credentialingStatus,
      totalAbsensiMaret: { hadir: hadirCount, alpha: alphaCount, terlambat: terlambatCount },
      vaksinasiTerbaru,
      mcuTerbaru,
      insidenK3RS: totalInsiden,
    };
  }, [currentUser, cuti, absensi, skp, jadwalShift, str, sip, credentialing, insidenK3RS, vaksinasi, mcu]);

  // ── localStorage chat persistence ────────────────────────────────────────────
  const storageKey = `${CHAT_STORAGE_KEY}_${currentUser?.id ?? 'guest'}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [{
      id: 'welcome',
      role: 'assistant',
      content: `**Halo, ${currentUser?.nama?.split(' ')[0] ?? 'Pegawai'}!** 👋\n\nSaya **Ask INTRAMEDIKA**, asisten digital HR RSUD Abdul Moeloek.\n\nSaya terhubung langsung dengan data kepegawaian Anda dan dapat membantu:\n- Informasi **cuti, absensi, & jadwal shift** Anda\n- Status **SKP & kinerja** terkini\n- Status **STR, SIP & Credentialing**\n- Regulasi kepegawaian ASN & program **K3RS**\n\nAda yang ingin Anda tanyakan?`,
      timestamp: new Date().toISOString(),
    }];
  });

  // Persist to localStorage whenever messages change
  useEffect(() => {
    try {
      // Keep last 50 messages to avoid bloating localStorage
      const toSave = messages.slice(-50);
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch { /* ignore quota errors */ }
  }, [messages, storageKey]);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickTopics, setShowQuickTopics] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showContextCard, setShowContextCard] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, isMinimized, messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setShowQuickTopics(false);
    setIsTyping(true);

    setTimeout(() => {
      // Try personalized answer first
      const personalized = buildPersonalizedAnswer(text, userCtx);
      if (personalized) {
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: personalized,
          timestamp: new Date().toISOString(),
          feedback: null,
          suggestions: ['Informasi lain yang saya butuhkan', 'Jadwal shift minggu ini', 'Status STR dan SIP saya'],
        }]);
        setIsTyping(false);
        return;
      }

      // Try static KB
      const staticResult = findStaticAnswer(text);
      if (staticResult) {
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: staticResult.answer,
          timestamp: new Date().toISOString(),
          feedback: null,
          suggestions: staticResult.suggestions,
        }]);
        setIsTyping(false);
        return;
      }

      // Fallback
      const fallback = buildFallback(text);
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: fallback.answer,
        timestamp: new Date().toISOString(),
        feedback: null,
        suggestions: fallback.suggestions,
      }]);
      setIsTyping(false);
    }, 700 + Math.random() * 600);
  }, [userCtx]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, feedback: m.feedback === type ? null : type } : m)
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content.replace(/\*\*/g, ''));
  };

  const handleReset = () => {
    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: `**Percakapan direset.** Halo lagi, ${currentUser?.nama?.split(' ')[0] ?? 'Pegawai'}! 👋\nAda yang ingin Anda tanyakan?`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
    setShowQuickTopics(true);
    setIsTyping(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasNewMessage(false);
  };

  const formatTime = (isoStr: string) =>
    new Date(isoStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const unreadCount = messages.filter(m => m.role === 'assistant').length;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized ? 'h-14 w-80' : 'w-[390px] h-[620px] max-h-[88vh]'
          }`}
          style={{ boxShadow: '0 25px 60px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)' }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1e3a5f] via-[#1d4ed8] to-[#2563eb] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1e3a5f]" />
              </div>
              <div>
                <p className="text-white text-sm font-bold tracking-tight leading-tight">Ask INTRAMEDIKA</p>
                <p className="text-blue-200 text-[10px] leading-tight">
                  {isTyping ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" />
                      <span className="inline-block w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="inline-block w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      <span className="ml-1">Mengetik...</span>
                    </span>
                  ) : 'Asisten Digital Kepegawaian • Online'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleReset}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset percakapan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isMinimized ? <ChevronDown className="w-3.5 h-3.5 rotate-180" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="contents">
              {/* ── User identity banner ─────────────────────────────────── */}
              <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
                    {currentUser?.nama?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? 'U'}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-blue-900 leading-tight truncate max-w-[200px]">{currentUser?.nama ?? 'Pegawai'}</p>
                    <p className="text-[9px] text-blue-600 leading-tight">{currentUser?.jabatan ?? ''} · {currentUser?.golongan ?? ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContextCard(p => !p)}
                  className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 transition-colors"
                  title={showContextCard ? 'Sembunyikan ringkasan' : 'Tampilkan ringkasan'}
                >
                  <Info className="w-3 h-3" />
                  <span>Ringkasan</span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${showContextCard ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* ── Messages area ─────────────────────────────────────────── */}
              <div
                className="flex-1 overflow-y-auto py-4 bg-gray-50"
                style={{ scrollbarWidth: 'thin' }}
              >
                {/* Context card */}
                {showContextCard && <ContextCard ctx={userCtx} />}

                <div className="space-y-4 px-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gradient-to-br from-[#1e3a5f] to-[#2563eb] text-white'
                      }`}>
                        {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div className={`flex flex-col gap-1 max-w-[83%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Bubble */}
                        <div className={`rounded-2xl px-3.5 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white text-gray-700 rounded-tl-sm border border-gray-100 shadow-sm'
                        }`}>
                          {msg.role === 'user'
                            ? <p className="text-[13px] leading-relaxed">{msg.content}</p>
                            : <RenderContent text={msg.content} />
                          }
                        </div>

                        {/* Meta row */}
                        <div className={`flex items-center gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => handleCopy(msg.content)} className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors" title="Salin">
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, 'up')}
                                className={`p-0.5 rounded transition-colors ${msg.feedback === 'up' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, 'down')}
                                className={`p-0.5 rounded transition-colors ${msg.feedback === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Suggestion chips */}
                        {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {msg.suggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => sendMessage(s)}
                                className="px-2.5 py-1 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 active:scale-95 transition-all"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2563eb] flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* ── Quick Topics grid ─────────────────────────────────────── */}
              {showQuickTopics && (
                <div className="px-3 py-2.5 bg-white border-t border-gray-100 flex-shrink-0">
                  <p className="text-[9px] text-gray-400 mb-2 font-semibold uppercase tracking-widest">Topik Populer</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {QUICK_TOPICS.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => sendMessage(topic.query)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-medium transition-all hover:scale-105 active:scale-95 ${topic.color}`}
                      >
                        <topic.icon className="w-3.5 h-3.5" />
                        <span className="text-center leading-tight">{topic.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Input ────────────────────────────────────────────────── */}
              <form
                onSubmit={handleSubmit}
                className="px-3 py-2.5 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Tanya sesuatu tentang kepegawaian..."
                  className="flex-1 pl-3 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* ── Footer ───────────────────────────────────────────────── */}
              <div className="px-4 pb-2 pt-0.5 flex items-center justify-between bg-white">
                <p className="text-[9px] text-gray-400">
                  Ask INTRAMEDIKA • HR APP RSUD Abdul Moeloek
                </p>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-red-500 transition-colors"
                  title="Hapus riwayat percakapan"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Hapus riwayat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Floating Button ───────────────────────────────────────────────── */}
      <div className="relative group">
        {!isOpen && (
          <div className="contents">
            <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
          </div>
        )}

        {/* Tooltip label */}
        {!isOpen && (
          <div className="absolute right-16 bottom-2.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-[#1e3a5f] text-white text-[11px] font-medium px-3 py-2 rounded-xl shadow-xl whitespace-nowrap flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              Ask INTRAMEDIKA
              <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1e3a5f] rotate-45" />
            </div>
          </div>
        )}

        {/* Unread badge */}
        {!isOpen && hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-white text-[8px] flex items-center justify-center font-bold z-10">1</span>
        )}

        <button
          onClick={isOpen ? () => setIsOpen(false) : handleOpen}
          className="relative w-14 h-14 rounded-full text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #3b82f6 100%)',
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.5), 0 2px 8px rgba(0,0,0,0.15)',
          }}
          title="Ask INTRAMEDIKA – Asisten Digital Kepegawaian"
        >
          <div className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            {isOpen ? <ChevronDown className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
        </button>
      </div>
    </div>
  );
}
