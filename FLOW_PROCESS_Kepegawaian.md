# HR APP — Dokumen Flow Process
**RSUD Abdul Moeloek, Provinsi Lampung**
Versi: 2.0 | Tanggal: Maret 2026
Dasar Hukum: PP No. 11/2017 · PermenPAN-RB No. 6/2022

---

## Daftar Isi

1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Arsitektur Teknis](#2-arsitektur-teknis)
3. [Struktur Direktori & File](#3-struktur-direktori--file)
4. [Alur Autentikasi](#4-alur-autentikasi)
5. [Global State Management](#5-global-state-management)
6. [Routing & Navigasi](#6-routing--navigasi)
7. [Modul 01 — Data Pegawai](#7-modul-01--data-pegawai)
8. [Modul 02 — Presensi / Absensi](#8-modul-02--presensi--absensi)
9. [Modul 03 — Manajemen Cuti](#9-modul-03--manajemen-cuti)
10. [Modul 04 — Riwayat Jabatan](#10-modul-04--riwayat-jabatan)
11. [Modul 05 — Kenaikan Pangkat](#11-modul-05--kenaikan-pangkat)
12. [Modul 06 — SKP & Penilaian Kinerja](#12-modul-06--skp--penilaian-kinerja)
13. [Modul 07 — Diklat & Kompetensi](#13-modul-07--diklat--kompetensi)
14. [Modul 08 — Disiplin Pegawai](#14-modul-08--disiplin-pegawai)
15. [Modul 09 — Surat Kepegawaian](#15-modul-09--surat-kepegawaian)
16. [Modul 10 — Credentialing & Lisensi](#16-modul-10--credentialing--lisensi)
17. [Modul 11 — K3RS & Kesehatan Kerja](#17-modul-11--k3rs--kesehatan-kerja)
18. [Modul 12 — Penggajian & Tunjangan](#18-modul-12--penggajian--tunjangan)
19. [Modul 13 — Penjadwalan Shift](#19-modul-13--penjadwalan-shift)
20. [Modul 14 — BPJS Ketenagakerjaan](#20-modul-14--bpjs-ketenagakerjaan)
21. [Modul 15 — Kontrak Kerja](#21-modul-15--kontrak-kerja)
22. [Modul 16 — Penghargaan](#22-modul-16--penghargaan)
23. [Modul 17 — Mutasi & Rotasi](#23-modul-17--mutasi--rotasi)
24. [Modul 18 — Komite Rumah Sakit](#24-modul-18--komite-rumah-sakit)
25. [Modul 19 — Hubungan Industrial](#25-modul-19--hubungan-industrial)
26. [Modul 20 — Struktur Organisasi](#26-modul-20--struktur-organisasi)
27. [Modul 21 — Laporan & Statistik](#27-modul-21--laporan--statistik)
28. [Tipe Data & Relasi Antar Modul](#28-tipe-data--relasi-antar-modul)
29. [Kontrol Akses (RBAC)](#29-kontrol-akses-rbac)
30. [Data Master & Referensi](#30-data-master--referensi)

---

## 1. Gambaran Umum Sistem

HR APP adalah aplikasi manajemen sumber daya manusia berbasis web untuk RSUD Abdul Moeloek Provinsi Lampung. Sistem ini mencakup **21 modul** yang terintegrasi penuh, mengelola siklus hidup kepegawaian dari penerimaan hingga pensiun sesuai regulasi ASN Indonesia.

### Cakupan Fungsional

| Kelompok | Modul |
|---|---|
| **Data Induk** | Data Pegawai, Struktur Organisasi |
| **Kehadiran & Jadwal** | Absensi, Cuti, Penjadwalan Shift |
| **Karir & Pangkat** | Riwayat Jabatan, Kenaikan Pangkat, Mutasi & Rotasi |
| **Kinerja & Pengembangan** | SKP, Diklat & Kompetensi, Penghargaan |
| **Klinis & Lisensi** | Credentialing, K3RS, Komite RS |
| **Kepegawaian** | Penggajian, BPJS, Kontrak Kerja |
| **Disiplin & Hukum** | Disiplin, Hubungan Industrial |
| **Administrasi** | Surat Kepegawaian, Laporan & Statistik |

### Statistik Data Awal (Mock Data)
- **246 pegawai** aktif (ID: P001–P246)
- **90+ unit kerja** dari tingkat Direktur hingga Ruangan
- Data absensi: Maret 2026 (20 pegawai sampel)
- Data keuangan: Tabel gaji pokok sesuai PP No. 15/2019

---

## 2. Arsitektur Teknis

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React 18 + TypeScript                    │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │ React Router│  │  AppContext  │  │   Recharts  │ │   │
│  │  │   v7 (SPA)  │  │ (useReducer) │  │  (Charts)   │ │   │
│  │  └──────┬──────┘  └──────┬───────┘  └─────────────┘ │   │
│  │         │                │                           │   │
│  │  ┌──────▼──────────────────────────────────────────┐ │   │
│  │  │              Layout + Pages (21 modul)           │ │   │
│  │  └──────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ▲                                    │
│                         │ localStorage (session & data)      │
└─────────────────────────────────────────────────────────────┘
```

### Stack Teknologi

| Teknologi | Versi | Peran |
|---|---|---|
| React | 18.3.1 | UI Library |
| TypeScript | — | Type Safety |
| Vite | 6.3.5 | Build Tool + Dev Server |
| React Router | 7.13.0 | Client-side Routing (SPA) |
| Tailwind CSS | 4.1.12 | Styling |
| Recharts | 2.15.2 | Visualisasi Data / Charts |
| Lucide React | 0.487.0 | Icon Library |
| Sonner | 2.0.3 | Toast Notifications |
| Motion | 12.23.24 | Animasi |
| Radix UI | — | Komponen Aksesibel |

### Pola Arsitektur

- **SPA (Single Page Application)**: Semua halaman di-render oleh JavaScript di browser; tidak ada page reload saat navigasi
- **Lazy Loading**: Setiap modul (halaman) di-bundle terpisah dan dimuat hanya saat dibutuhkan (`React.lazy + import()`)
- **Context API + useReducer**: Global state management tanpa library eksternal (Redux/Zustand)
- **localStorage Persistence**: Sesi user disimpan di `localStorage` dengan key `hr_app_user`
- **Singleton Pattern**: Router dan AppContext menggunakan `globalThis` singleton untuk mencegah HMR context mismatch

---

## 3. Struktur Direktori & File

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Entry point, RouterProvider + ErrorBoundary
│   │   ├── routes.ts                  # Konfigurasi router (singleton __hrAppRouter_v6)
│   │   ├── context/
│   │   │   └── AppContext.tsx         # Global state: AppProvider, useAppContext, appUsers
│   │   ├── types/
│   │   │   └── index.ts               # Semua interface TypeScript (25+ interface)
│   │   ├── data/
│   │   │   ├── constants.ts           # PANGKAT_GOLONGAN, JENIS_CUTI, UNIT_KERJA (90+)
│   │   │   ├── mockData.ts            # 246 pegawai + absensi/cuti/SKP/KP/riwayat jabatan
│   │   │   ├── mockDataRS.ts          # STR, SIP, Credentialing, K3RS, Gaji, Jadwal, dll.
│   │   │   └── index.ts               # Re-export barrel
│   │   ├── components/
│   │   │   ├── Root.tsx               # Pathless layout: AppProvider + Suspense + Toaster
│   │   │   ├── Layout.tsx             # Sidebar + Header + Outlet (auth guard via Navigate)
│   │   │   ├── NotFound.tsx           # Halaman 404
│   │   │   ├── RechartsWrapper.tsx    # Komponen chart universal (Bar/Pie/Line)
│   │   │   ├── ChartSkeleton.tsx      # Loading placeholder untuk chart
│   │   │   └── ui/                    # Komponen UI (shadcn/radix: Button, Dialog, dll.)
│   │   └── pages/
│   │       ├── Login.tsx              # Autentikasi
│   │       ├── Dashboard.tsx          # KPI & ringkasan semua modul
│   │       ├── DataPegawai.tsx        # Master data pegawai (CRUD)
│   │       ├── DetailPegawai.tsx      # Profil lengkap satu pegawai
│   │       ├── Absensi.tsx            # Rekap & input absensi harian
│   │       ├── Cuti.tsx               # Pengajuan & approval cuti multi-level
│   │       ├── RiwayatJabatan.tsx     # Rekam jejak jabatan
│   │       ├── KenaikanPangkat.tsx    # Usulan & proses kenaikan pangkat
│   │       ├── SKP.tsx                # Sasaran Kinerja Pegawai
│   │       ├── Diklat.tsx             # Pendidikan & pelatihan
│   │       ├── Disiplin.tsx           # Pelanggaran & hukuman disiplin
│   │       ├── SuratKepegawaian.tsx   # Generate surat kepegawaian
│   │       ├── Credentialing.tsx      # STR, SIP, Kredensial klinis
│   │       ├── K3RS.tsx               # Insiden K3, Vaksinasi, MCU
│   │       ├── Penggajian.tsx         # Slip gaji & tunjangan
│   │       ├── Penjadwalan.tsx        # Jadwal shift kerja
│   │       ├── BPJS.tsx               # Kepesertaan BPJS
│   │       ├── Kontrak.tsx            # Kontrak kerja (non-PNS)
│   │       ├── Penghargaan.tsx        # Satyalancana & penghargaan
│   │       ├── Mutasi.tsx             # Mutasi, rotasi, promosi
│   │       ├── KomiteRS.tsx           # Komite medik, keperawatan, dll.
│   │       ├── HubunganIndustrial.tsx # Grievance & PHK
│   │       ├── OrganisasiTree.tsx     # Bagan struktur organisasi
│   │       └── Laporan.tsx            # Dashboard laporan 8 tab
│   └── styles/
│       ├── index.css                  # Base styles
│       ├── theme.css                  # CSS variables (warna, tipografi)
│       ├── tailwind.css               # Tailwind directives
│       └── fonts.css                  # Google Fonts import
├── vite.config.ts                     # Konfigurasi Vite (lazy chunks, optimizeDeps)
└── package.json                       # Dependencies
```

---

## 4. Alur Autentikasi

### 4.1 Flow Login

```
User membuka aplikasi
        │
        ▼
  Router mencocokkan URL
        │
   ┌────┴────┐
   │  /login │ ──────► Tampil halaman Login.tsx
   │  lainnya│ ──────► Layout.tsx (auth guard)
   └─────────┘              │
                    isLoggedIn = false?
                            │
                    ┌───────┴───────┐
                    │ YES           │ NO
                    ▼               ▼
           <Navigate to="/login"> Tampil halaman
           (client-side, tidak    yang diminta
            reload server)
                    │
                    ▼
        User mengisi username + password
                    │
                    ▼
        AppContext.login() dipanggil
                    │
        Cocokkan dengan appUsers[]
                    │
           ┌────────┴────────┐
           │ Cocok           │ Tidak Cocok
           ▼                 ▼
  localStorage.setItem   Tampil pesan
  ('hr_app_user', user)  error merah
           │
  dispatch({type:'LOGIN'})
           │
  navigate('/') → Dashboard
```

### 4.2 Akun Tersedia

| Username | Password | Role | Nama |
|---|---|---|---|
| `admin` | `admin123` | Administrator | dr. Imam Ghozali, Sp.An., M.Kes |
| `direktur` | `dir123` | Direktur | dr. Imam Ghozali, Sp.An., M.Kes |
| `kepala` | `kepala123` | Kepala Unit | dr. Asih Hendrastuti, M.Kes |

### 4.3 Flow Logout

```
User klik tombol "Keluar"
        │
        ▼
  handleLogout() di Layout.tsx
        │
  AppContext.logout()
        │
  localStorage.removeItem('hr_app_user')
        │
  dispatch({type:'LOGOUT'})
        │
  navigate('/login', { replace: true })
```

### 4.4 Persistensi Sesi

```
Aplikasi dimuat ulang (page refresh)
        │
        ▼
AppProvider membaca localStorage
        │
  ┌─────┴─────┐
  │ Ada data  │ Tidak ada
  ▼           ▼
JSON.parse()  savedUser = null
isLoggedIn=true isLoggedIn=false
        │
  Langsung masuk ke
  halaman terakhir
```

---

## 5. Global State Management

### 5.1 Struktur AppState

```typescript
AppState {
  // Data Induk
  pegawai: Pegawai[]                   // 246 pegawai
  
  // Kehadiran
  absensi: AbsensiRecord[]             // Rekap harian
  cuti: CutiRecord[]                   // + approvalLevels[]
  
  // Karir
  riwayatJabatan: RiwayatJabatan[]
  kenaikanPangkat: KenaikanPangkat[]
  mutasi: MutasiRecord[]
  
  // Kinerja
  skp: SKPRecord[]
  diklat: DiklatRecord[]
  penghargaan: PenghargaanRecord[]
  
  // Klinis
  str: STRRecord[]
  sip: SIPRecord[]
  credentialing: CredentialingRecord[]
  cpd: CPDRecord[]
  
  // K3RS
  insidenK3RS: InsidenK3RS[]
  vaksinasi: VaksinasiRecord[]
  mcu: MCURecord[]
  
  // Kepegawaian
  slipGaji: SlipGaji[]
  jadwalShift: JadwalShift[]
  bpjs: BPJSRecord[]
  kontrak: KontrakRecord[]
  
  // Organisasi
  anggotaKomite: AnggotaKomite[]
  kegiatanKomite: KegiatanKomite[]
  
  // Disiplin
  disiplin: DisiplinRecord[]
  grievance: GrievanceRecord[]
  phk: PHKRecord[]
  
  // Auth
  currentUser: AppUser | null
  isLoggedIn: boolean
}
```

### 5.2 Pola Reducer (Action → State)

```
Komponen                AppContext              AppState
    │                       │                      │
    │── dispatch(action) ──►│                      │
    │                       │── reducer(state,     │
    │                       │     action) ─────────►│
    │                       │                      │ (immutable update)
    │                       │◄── newState ─────────│
    │◄── re-render ─────────│                      │
```

Setiap modul memiliki 3 action CRUD:

| Pattern | Action Type | Contoh |
|---|---|---|
| Tambah | `ADD_[ENTITAS]` | `ADD_PEGAWAI`, `ADD_CUTI` |
| Ubah | `UPDATE_[ENTITAS]` | `UPDATE_SKP`, `UPDATE_DISIPLIN` |
| Hapus | `DELETE_[ENTITAS]` | `DELETE_DIKLAT`, `DELETE_STR` |

Khusus Cuti: `APPROVE_CUTI`, `REJECT_CUTI`
Khusus Absensi: `BULK_INPUT_ABSENSI`
Khusus Auth: `LOGIN`, `LOGOUT`

### 5.3 Singleton HMR Pattern

```
globalThis.__hrAppCtx  →  React Context (stabil saat HMR)
globalThis.__hrAppRouter_v6  →  Router (singleton, tidak di-recreate saat HMR)
```

---

## 6. Routing & Navigasi

### 6.1 Hierarki Route

```
Root (pathless)                    ← AppProvider + Toaster
├── /login                         ← Login.tsx (publik)
├── / (Layout)                     ← Auth guard: if !isLoggedIn → <Navigate to="/login">
│   ├── index (/)                  ← Dashboard.tsx
│   ├── pegawai                    ← DataPegawai.tsx
│   ├── pegawai/:id                ← DetailPegawai.tsx
│   ├── absensi                    ← Absensi.tsx
│   ├── cuti                       ← Cuti.tsx
│   ├── riwayat-jabatan            ← RiwayatJabatan.tsx
│   ├── kenaikan-pangkat           ← KenaikanPangkat.tsx
│   ├── skp                        ← SKP.tsx
│   ├── diklat                     ← Diklat.tsx
│   ├── disiplin                   ← Disiplin.tsx
│   ├── surat-kepegawaian          ← SuratKepegawaian.tsx
│   ├── credentialing              ← Credentialing.tsx
│   ├── k3rs                       ← K3RS.tsx
│   ├── penggajian                 ← Penggajian.tsx
│   ├── penjadwalan                ← Penjadwalan.tsx
│   ├── bpjs                       ← BPJS.tsx
│   ├── kontrak                    ← Kontrak.tsx
│   ├── penghargaan                ← Penghargaan.tsx
│   ├── mutasi                     ← Mutasi.tsx
│   ├── komite-rs                  ← KomiteRS.tsx
│   ├── hubungan-industrial        ← HubunganIndustrial.tsx
│   ├── organisasi                 ← OrganisasiTree.tsx
│   ├── laporan                    ← Laporan.tsx
│   └── * (wildcard)               ← NotFound.tsx
└── * (wildcard)                   ← NotFound.tsx
```

### 6.2 Navigasi Sidebar

Sidebar dibagi **9 seksi** dengan **23 item menu**:

| Seksi | Menu Item |
|---|---|
| UTAMA | Dashboard |
| DATA PEGAWAI | Data Pegawai, Struktur Organisasi, Mutasi & Rotasi, Penghargaan |
| KEHADIRAN & JADWAL | Presensi/Absensi, Manajemen Cuti, Penjadwalan Shift |
| KARIR & PANGKAT | Riwayat Jabatan, Kenaikan Pangkat |
| KINERJA & PENGEMBANGAN | SKP & Penilaian Kinerja, Diklat & Kompetensi |
| KLINIS & LISENSI | Credentialing & Lisensi, K3RS & Kesehatan Kerja, Komite RS |
| KEPEGAWAIAN | Penggajian & Tunjangan, BPJS Ketenagakerjaan, Kontrak Kerja |
| DISIPLIN & HUKUM | Disiplin Pegawai, Hubungan Industrial |
| SURAT & LAPORAN | Surat Kepegawaian, Laporan & Statistik |

---

## 7. Modul 01 — Data Pegawai

**File:** `pages/DataPegawai.tsx` · `pages/DetailPegawai.tsx`
**Route:** `/pegawai` · `/pegawai/:id`

### 7.1 Flow Utama

```
Halaman DataPegawai
        │
  Tampil tabel semua pegawai
  (246 data, sortable/filterable)
        │
  ┌─────┼──────────┬──────────────┐
  ▼     ▼          ▼              ▼
Tambah Filter   Klik Baris     Export
Pegawai Unit/   → Detail       Data
        Status  Pegawai
  │
  ▼
Form Input Pegawai Baru:
  - Data Pribadi (NIP, Nama, TTL, Agama, dll.)
  - Data Kepegawaian (Jabatan, Unit, Golongan, Pangkat)
  - Data Pendidikan (Pendidikan, Jurusan, Institusi)
  - Status (PNS/PPPK/Honorer, Aktif/Pensiun, dll.)
        │
  Validasi form
        │
  dispatch(ADD_PEGAWAI)
        │
  State update → tabel refresh
```

### 7.2 Halaman Detail Pegawai (`/pegawai/:id`)

```
DetailPegawai
        │
  Baca params.id → cari di pegawai[]
        │
  Tampil 7 tab:
  ┌──────────────────────────────┐
  │ 1. Profil Umum               │ → Data biodata lengkap
  │ 2. Riwayat Jabatan           │ → Rekam jejak jabatan
  │ 3. Kenaikan Pangkat          │ → Histori KP
  │ 4. Diklat & Kompetensi       │ → Pelatihan yang diikuti
  │ 5. SKP                       │ → Penilaian kinerja
  │ 6. Disiplin                  │ → Pelanggaran (jika ada)
  │ 7. Cuti & Absensi            │ → Rekap kehadiran
  └──────────────────────────────┘
```

### 7.3 Interface Pegawai

```typescript
Pegawai {
  id, nip, nama, gelarDepan?, gelarBelakang?
  jenisKelamin: 'L' | 'P'
  tempatLahir, tanggalLahir, agama, statusPerkawinan
  alamat, noTelp, email
  jabatan, jabatanFungsional, unitKerja
  golongan, pangkat, tmtGolongan, tmtJabatan
  statusPegawai: 'PNS' | 'PPPK' | 'Honorer'
  statusAktif: 'Aktif' | 'Pensiun' | 'Meninggal' | 'Diberhentikan'
  pendidikanTerakhir, jurusan, institusi, tahunLulus
  tanggalMasuk, batasPensiun, masaKerja
  eselon?
}
```

---

## 8. Modul 02 — Presensi / Absensi

**File:** `pages/Absensi.tsx`
**Route:** `/absensi`

### 8.1 Flow Rekap Absensi

```
Halaman Absensi
        │
  Pilih bulan/tahun filter
        │
  Tampil rekapitulasi:
  - Total hadir, sakit, izin, cuti, alpha
  - Tabel per pegawai per hari
  - Chart tren kehadiran (bar chart)
        │
  ┌─────┼──────────┬────────────┐
  ▼     ▼          ▼            ▼
Input   Bulk     Edit          Export
Manual  Input    Record        Rekap
1 data  CSV/     Existing
        Form
```

### 8.2 Flow Input Absensi

```
Pilih tanggal + pegawai
        │
  Form status:
  - Hadir (jam masuk + jam keluar wajib)
  - Izin (keterangan wajib)
  - Sakit (nomor surat dokter)
  - Cuti (otomatis dari data cuti)
  - Alpha (keterangan opsional)
  - Dinas Luar (surat tugas)
  - Libur (hari libur nasional)
        │
  dispatch(ADD_ABSENSI / UPDATE_ABSENSI)
```

### 8.3 Data Awal (Generate Otomatis)

Data absensi Maret 2026 di-generate satu kali di **module level** `AppContext.tsx`:
- 20 pegawai sampel (P001–P020)
- Hari kerja Senin–Jumat (skip Sabtu/Minggu)
- Default: semua pegawai `Hadir` kecuali ada entri khusus di `specials` map

### 8.4 Interface AbsensiRecord

```typescript
AbsensiRecord {
  id, pegawaiId, tanggal
  jamMasuk?, jamKeluar?
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Cuti' | 'Alpha' | 'Libur' | 'Dinas Luar'
  keterangan?
}
```

---

## 9. Modul 03 — Manajemen Cuti

**File:** `pages/Cuti.tsx`
**Route:** `/cuti`
**Dasar Hukum:** PP No. 11 Tahun 2017

### 9.1 Jenis Cuti & Kuota

| Jenis Cuti | Kuota | Dasar |
|---|---|---|
| Cuti Tahunan | 12 hari | PP No. 11/2017 |
| Cuti Sakit | 14 hari | PP No. 11/2017 |
| Cuti Melahirkan | 90 hari | PP No. 11/2017 |
| Cuti Besar | 90 hari | PP No. 11/2017 |
| Cuti Alasan Penting | 30 hari | PP No. 11/2017 |
| CLTN | 365 hari | PP No. 11/2017 |

### 9.2 Flow Pengajuan Cuti (Multi-Level Approval)

```
Pegawai mengajukan cuti
        │
  Isi form: jenis, tanggal, alasan
        │
  dispatch(ADD_CUTI)
  → status: 'Pending'
  → currentLevel: 1
  → approvalLevels:
    [Level 1: Kepala Unit Kerja - Pending]
    [Level 2: Direktur RSUD   - Pending]
        │
  ┌─────────────────────────────────┐
  │          LEVEL 1 APPROVAL       │
  │    Kepala Unit Kerja review      │
  └──────────────┬──────────────────┘
                 │
    ┌────────────┴────────────┐
    │ Disetujui               │ Ditolak
    ▼                         ▼
  currentLevel → 2         status: 'Ditolak'
  Level 1: 'Disetujui'     Level 1: 'Ditolak'
                │
  ┌─────────────────────────────────┐
  │          LEVEL 2 APPROVAL       │
  │         Direktur RSUD review    │
  └──────────────┬──────────────────┘
                 │
    ┌────────────┴────────────┐
    │ Disetujui               │ Ditolak
    ▼                         ▼
  status: 'Disetujui'      status: 'Ditolak'
  (cuti berlaku)           Level 2: 'Ditolak'
```

### 9.3 Interface CutiRecord

```typescript
CutiRecord {
  id, pegawaiId
  jenisCuti: string          // dari JENIS_CUTI constant
  tanggalMulai, tanggalSelesai, jumlahHari
  alasan
  status: 'Pending' | 'Disetujui' | 'Ditolak'
  tanggalPengajuan
  approvalLevels?: ApprovalLevel[]   // multi-level approval
  currentLevel?: number
}

ApprovalLevel {
  level: number
  jabatan: string            // 'Kepala Unit Kerja' | 'Direktur RSUD'
  nama: string
  status: 'Pending' | 'Disetujui' | 'Ditolak'
  tanggal?, catatan?
}
```

---

## 10. Modul 04 — Riwayat Jabatan

**File:** `pages/RiwayatJabatan.tsx`
**Route:** `/riwayat-jabatan`
**Dasar Hukum:** PP No. 11 Tahun 2017, PermenPAN-RB No. 6/2022

### 10.1 Flow

```
Halaman Riwayat Jabatan
        │
  Filter: pegawai / unit kerja / jenis jabatan
        │
  Tampil timeline jabatan per pegawai:
  [Jabatan A] → [Jabatan B] → [Jabatan C (aktif)]
        │
  Tambah Riwayat Jabatan Baru:
  - Jabatan, Unit Kerja, Golongan
  - TMT Mulai, TMT Selesai (opsional jika masih aktif)
  - Nomor SK, Tanggal SK
  - Jenis Jabatan: Struktural / Fungsional / Pelaksana
        │
  dispatch(ADD_RIWAYAT_JABATAN)
```

### 10.2 Interface RiwayatJabatan

```typescript
RiwayatJabatan {
  id, pegawaiId
  jabatan, unitKerja, golongan
  tmtMulai, tmtSelesai?
  nomorSK, tanggalSK
  jenisJabatan: 'Struktural' | 'Fungsional' | 'Pelaksana'
}
```

---

## 11. Modul 05 — Kenaikan Pangkat

**File:** `pages/KenaikanPangkat.tsx`
**Route:** `/kenaikan-pangkat`
**Dasar Hukum:** PP No. 11 Tahun 2017 (Periode April & Oktober)

### 11.1 Flow Proses Kenaikan Pangkat

```
Identifikasi pegawai yang memenuhi syarat
(masa kerja golongan ≥ 4 tahun, nilai SKP baik)
        │
  Buat usulan kenaikan pangkat:
  - Golongan lama → golongan baru
  - Pangkat lama → pangkat baru
  - Jenis kenaikan (Reguler/Fungsional/Pilihan/Penyesuaian)
  - Periode usulan (Apr/Okt YYYY)
  - Status: 'Proses'
        │
  dispatch(ADD_KP)
        │
  Proses BKN / BKPSDM
        │
    ┌───┴───┐
    │Selesai│ Ditolak
    ▼       ▼
  Nomor SK  Catatan
  diisi     penolakan
  status:   status:
  'Selesai' 'Ditolak'
        │
  Update data pegawai:
  golongan, pangkat, tmtGolongan
```

### 11.2 Golongan Ruang (Referensi)

| Golongan | Pangkat |
|---|---|
| I/a | Juru Muda |
| I/b–I/d | Juru Muda Tk.I – Juru Tk.I |
| II/a–II/d | Pengatur Muda – Pengatur Tk.I |
| III/a–III/d | Penata Muda – Penata Tk.I |
| IV/a–IV/e | Pembina – Pembina Utama |

---

## 12. Modul 06 — SKP & Penilaian Kinerja

**File:** `pages/SKP.tsx`
**Route:** `/skp`
**Dasar Hukum:** PermenPAN-RB No. 6 Tahun 2022

### 12.1 Flow SKP

```
Awal Semester (Jan atau Jul)
        │
  Pegawai menetapkan SKP:
  - Uraian kegiatan / rencana kinerja
  - Target (angka + satuan)
  - Bobot masing-masing kegiatan
  - Status: 'Draft' → 'Aktif'
        │
  dispatch(ADD_SKP)
        │
  Sepanjang Semester:
  Input realisasi bulanan per kegiatan
        │
  Akhir Semester (Jun atau Des)
        │
  Hitung nilai akhir:
  Σ (realisasi/target × 100 × bobot) / Σ bobot
        │
  Tentukan predikat:
  ≥90: Sangat Baik  70-89: Baik
  50-69: Cukup      <50: Kurang
        │
  Status: 'Selesai'
  dispatch(UPDATE_SKP)
```

### 12.2 Interface SKPRecord

```typescript
SKPRecord {
  id, pegawaiId
  tahun: number, semester: 1 | 2
  targetKinerja: SKPItem[]
  nilaiAkhir?, predikat?
  status: 'Draft' | 'Aktif' | 'Selesai'
  catatan?
}

SKPItem {
  id, uraianKegiatan
  target: number, satuan: string
  realisasi?, nilaiCapaian?
  bobot: number
}
```

---

## 13. Modul 07 — Diklat & Kompetensi

**File:** `pages/Diklat.tsx`
**Route:** `/diklat`
**Dasar Hukum:** PermenPAN-RB No. 6/2022 (ASN wajib 20 JP/tahun)

### 13.1 Jenis Diklat

| Jenis | Keterangan |
|---|---|
| Teknis | Diklat keahlian teknis jabatan |
| Fungsional | Khusus jabatan fungsional |
| Manajerial | Diklat kepemimpinan (PKN/PKA/PKP/PKHA) |
| Sosiokultural | Pengembangan soft skill & nilai ASN |
| Orientasi | Diklat Prajabatan / PPPK orientasi |

### 13.2 Flow Diklat

```
Rencanakan diklat
        │
  Input data diklat:
  - Nama diklat, jenis, penyelenggara
  - Tempat, tanggal mulai & selesai
  - Jumlah Jam Pelajaran (JP)
  - Status: 'Direncanakan'
        │
  dispatch(ADD_DIKLAT)
        │
  Saat berlangsung:
  Status → 'Berlangsung'
        │
  Selesai:
  Status → 'Selesai'
  Input nomor sertifikat
        │
  dispatch(UPDATE_DIKLAT)
```

---

## 14. Modul 08 — Disiplin Pegawai

**File:** `pages/Disiplin.tsx`
**Route:** `/disiplin`
**Dasar Hukum:** PP No. 94 Tahun 2021

### 14.1 Tingkatan Hukuman Disiplin

```
RINGAN:   Teguran lisan, Teguran tertulis, Pernyataan tidak puas
SEDANG:   Penundaan KGB, Penundaan KP, Penurunan pangkat 1 th
BERAT:    Penurunan pangkat 3 th, Pemindahan, Pembebasan jabatan,
          PTDH (Pemberhentian Tidak Dengan Hormat)
```

### 14.2 Flow Proses Disiplin

```
Laporan pelanggaran diterima
        │
  Buat record disiplin:
  - Jenis hukuman, tingkat
  - Tanggal kejadian, kronologi
  - Status: 'Investigasi'
        │
  dispatch(ADD_DISIPLIN)
        │
  Proses pemeriksaan (Tim Pemeriksa)
  Status → 'Proses'
        │
  Sidang (jika diperlukan)
        │
  ┌─────────────────────┐
  │ Keputusan Pejabat   │
  │ yang Berwenang      │
  └──────┬──────────────┘
         │
  ┌──────┴──────────────────┐
  │ Diputuskan              │ Banding
  ▼                         ▼
Nomor SK, tanggal SK     Status: 'Banding'
Status: 'Selesai'        (proses ulang)
dispatch(UPDATE_DISIPLIN)
```

---

## 15. Modul 09 — Surat Kepegawaian

**File:** `pages/SuratKepegawaian.tsx`
**Route:** `/surat-kepegawaian`

### 15.1 Jenis Surat yang Dapat Digenerate

| Kode | Nama Surat |
|---|---|
| SK-01 | Surat Keterangan Aktif Bekerja |
| SK-02 | Surat Keterangan Penghasilan |
| SK-03 | Surat Rekomendasi |
| SK-04 | Surat Pengantar BPJS |
| SK-05 | Surat Tugas Diklat |
| SK-06 | Surat Keterangan Masa Kerja |

### 15.2 Flow Generate Surat

```
Pilih jenis surat
        │
  Pilih pegawai dari dropdown
        │
  Data otomatis terisi dari AppState:
  - Nama, NIP, jabatan, unit kerja
  - Golongan, pangkat, masa kerja
  - Gaji pokok (dari tabel GAJI_POKOK)
        │
  Preview surat (HTML render)
        │
  ┌────┴────┐
  │ Print   │ Download
  ▼         ▼
window.    Blob → 
print()    .pdf / .docx
```

---

## 16. Modul 10 — Credentialing & Lisensi

**File:** `pages/Credentialing.tsx`
**Route:** `/credentialing`
**Dasar Hukum:** UU No. 17/2023 (Kesehatan), UU No. 29/2004 (Praktik Kedokteran)

### 16.1 Komponen Credentialing

```
Credentialing & Lisensi
├── STR (Surat Tanda Registrasi)
│   ├── Konsil Kedokteran Indonesia (KKI) → Dokter, Dokter Spesialis
│   ├── Konsil Keperawatan Indonesia → Perawat, Bidan
│   ├── Konsil Tenaga Kefarmasian → Apoteker
│   └── Masa berlaku: 5 tahun
│
├── SIP / SIK (Surat Izin Praktik/Kerja)
│   ├── Dikeluarkan oleh Dinas Kesehatan Kab/Kota
│   ├── Berlaku per fasyankes
│   └── Masa berlaku: 5 tahun
│
├── Kredensial Klinis
│   ├── Jenis: Kredensial Awal | Re-kredensial
│   ├── Alur: Pengajuan → Verifikasi Dokumen → Peer Review
│   │         → Sidang Komite Medik → Selesai
│   └── Output: Kewenangan Klinis (Rincian Kewenangan Klinis / RKK)
│
└── CPD (Continuing Professional Development)
    ├── Seminar, Workshop, Webinar, Pelatihan
    ├── Publikasi, Mengajar, Keanggotaan Organisasi
    └── SKP (Satuan Kredit Profesi) per kegiatan
```

### 16.2 Flow Monitoring Lisensi

```
Sistem memeriksa tanggal expired STR/SIP
        │
  Tanggal expired ≤ 6 bulan dari sekarang?
        │
  ┌─────┴─────┐
  │ Ya        │ Tidak
  ▼           ▼
Status:     Status:
'Akan       'Aktif'
 Expired'
  │
  Notifikasi ke Dashboard
  (badge merah di menu Credentialing)
        │
  Proses perpanjangan STR:
  - Kumpulkan SKP (minimal 25 SKP / 5 tahun)
  - Submit ke konsil terkait
  - Terima nomor STR baru
  - Update record: tanggalExpired baru
```

---

## 17. Modul 11 — K3RS & Kesehatan Kerja

**File:** `pages/K3RS.tsx`
**Route:** `/k3rs`
**Dasar Hukum:** PP No. 50/2012 (SMK3), Permenkes No. 66/2016 (K3RS)

### 17.1 Sub-Modul K3RS

#### A. Insiden K3RS

```
Terjadi insiden / kejadian berbahaya
        │
  Laporkan insiden:
  - Jenis: Kecelakaan Kerja / Pajanan Jarum Suntik /
           Pajanan Cairan Tubuh / Pajanan Radiasi /
           Bahan Kimia / Near Miss / KTD Pegawai
  - Lokasi, deskripsi, keparahan (Ringan/Sedang/Berat)
  - Tindakan segera
  - Status: 'Dilaporkan'
        │
  dispatch(ADD_INSIDEN)
        │
  Tim K3RS investigasi → Status: 'Investigasi'
        │
  Tindak lanjut selesai → Status: 'Selesai'
  dispatch(UPDATE_INSIDEN)
```

#### B. Vaksinasi

```typescript
VaksinasiRecord {
  jenisVaksin: string          // COVID-19, Hepatitis B, dll.
  dosis: number
  tanggalVaksin, fasilitasVaksin
  tanggalBooster?
  status: 'Lengkap' | 'Sebagian' | 'Belum'
}
```

#### C. Medical Check Up (MCU)

```typescript
MCURecord {
  jenisMCU: 'Awal' | 'Awal Kerja' | 'Berkala' | 'Khusus' | 'Khusus Pajanan' | 'Pra-Pensiun'
  hasilMCU: 'Layak Kerja' | 'Layak dengan Syarat' | 'Tidak Layak'
  fasilitasMCU?
  rekomendasiDokter?
  tanggalBerikutnya?
}
```

---

## 18. Modul 12 — Penggajian & Tunjangan

**File:** `pages/Penggajian.tsx`
**Route:** `/penggajian`
**Dasar Hukum:** PP No. 15/2019 (Gaji PNS)

### 18.1 Komponen Gaji

```
PENGHASILAN BRUTO                    POTONGAN
─────────────────────────────────    ─────────────────────────────────
Gaji Pokok           (tabel PP)      Potongan Taspen    (4.75%)
Tunjangan Jabatan    (Struktural)    Potongan BPJS Kes  (1%)
Tunjangan Fungsional (per jabatan)   Potongan BPJS TK   (2%)
Tunjangan Kinerja    (variabel)      Potongan PPh 21    (progresif)
Tunjangan Beras      (10 kg/jiwa)    Potongan Lain      (opsional)
Tunjangan Anak       (maks 2 anak)
Tunjangan Istri/Suami
Tambahan Lain        (opsional)
─────────────────────────────────    ─────────────────────────────────
TOTAL BRUTO                          TOTAL POTONGAN
                                     ─────────────────────────────────
                                     GAJI NETTO (Take Home Pay)
```

### 18.2 Tabel Gaji Pokok (PP No. 15/2019)

| Golongan | Gaji Pokok |
|---|---|
| I/a | Rp 1.560.800 |
| II/a | Rp 2.022.200 |
| III/a | Rp 2.579.400 |
| III/d | Rp 2.920.800 |
| IV/a | Rp 3.044.300 |
| IV/e | Rp 3.593.100 |

### 18.3 Flow Penggajian

```
Awal bulan baru
        │
  Generate slip gaji per pegawai:
  - Hitung gaji pokok dari golongan
  - Tambah tunjangan sesuai jabatan
  - Hitung potongan wajib
  - Status: 'Draft'
        │
  Review oleh Kabag Keuangan
        │
  Setujui → Status: 'Disetujui'
        │
  Proses pembayaran (transfer/tunai)
  Status: 'Dibayar'
  Input tanggalDibayar
```

---

## 19. Modul 13 — Penjadwalan Shift

**File:** `pages/Penjadwalan.tsx`
**Route:** `/penjadwalan`

### 19.1 Jenis Shift

| Shift | Jam |
|---|---|
| Pagi | 07:00 – 14:00 |
| Sore | 14:00 – 21:00 |
| Malam | 21:00 – 07:00 |
| On-Call | Siaga (dipanggil saat dibutuhkan) |
| Libur | Hari libur / off |
| Lepas | Selesai dinas / pasca jaga malam |

### 19.2 Flow Penjadwalan

```
Kepala Unit buka modul penjadwalan
        │
  Pilih unit kerja + periode (bulan/minggu)
        │
  Tampil kalender shift:
  ┌────┬────┬────┬────┬────┬────┬────┐
  │ Sen│ Sel│ Rab│ Kam│ Jum│ Sab│ Min│
  ├────┼────┼────┼────┼────┼────┼────┤
  │P001│P003│P001│P003│P001│    │    │
  │Pagi│Pagi│Sore│Mlm │Off │    │    │
  └────┴────┴────┴────┴────┴────┴────┘
        │
  Input jadwal baru / edit jadwal:
  - Pilih pegawai + tanggal
  - Pilih jenis shift
  - Input jam mulai & selesai (opsional override)
  - Status: 'Aktif'
        │
  dispatch(ADD_JADWAL / UPDATE_JADWAL)
        │
  Fitur tambahan:
  - Swap shift antar pegawai
  - Tandai jadwal yang dibatalkan
```

---

## 20. Modul 14 — BPJS Ketenagakerjaan

**File:** `pages/BPJS.tsx`
**Route:** `/bpjs`

### 20.1 Program BPJS

| Program | Iuran Pemberi Kerja | Iuran Pekerja |
|---|---|---|
| BPJS Kesehatan Kelas I | 4% gaji | 1% gaji |
| BPJS Ketenagakerjaan JHT | 3.7% | 2% |
| BPJS Ketenagakerjaan JP | 2% | 1% |
| BPJS Ketenagakerjaan JKK | 0.24% | — |
| BPJS Ketenagakerjaan JKM | 0.3% | — |

### 20.2 Flow Pengelolaan BPJS

```
Pegawai baru bergabung
        │
  Daftarkan ke BPJS:
  - Nomor kartu BPJS Kesehatan
  - Kelas (I/II/III)
  - Nomor BPJS Ketenagakerjaan
  - Data tanggungan (istri/suami + anak maks. 3)
  - Status: 'Aktif'
        │
  dispatch(ADD_BPJS)
        │
  Perubahan data (pindah kelas, tambah tanggungan):
  dispatch(UPDATE_BPJS)
        │
  Penonaktifan (pensiun/keluar):
  Status → 'Tidak Aktif'
```

---

## 21. Modul 15 — Kontrak Kerja

**File:** `pages/Kontrak.tsx`
**Route:** `/kontrak`

### 21.1 Jenis Kontrak

| Jenis | Keterangan |
|---|---|
| PKWT | Perjanjian Kerja Waktu Tertentu |
| PKWTT | Perjanjian Kerja Waktu Tidak Tertentu |
| Dokter Mitra | Dokter dengan perjanjian mitra |
| Dokter Paruh Waktu | Part-time |
| Tenaga Alih Daya | Outsourcing |

### 21.2 Flow Kontrak

```
Kontrak baru / perpanjangan
        │
  Input data kontrak:
  - Jenis kontrak, nomor kontrak
  - Tanggal mulai & selesai
  - Jabatan & unit kerja
  - Nilai kontrak (jika Dokter Mitra)
  - Jadwal praktik
  - Status: 'Aktif'
        │
  dispatch(ADD_KONTRAK)
        │
  Sistem monitoring tanggal berakhir:
        │
  ≤ 30 hari sebelum berakhir → alert "Akan Berakhir"
        │
  ┌──────────────┬────────────┐
  │ Diperpanjang │ Tidak      │
  ▼              ▼            │
Buat kontrak  Status:        │
baru          'Berakhir'     │
              (atau          │
              'Dibatalkan')  │
```

---

## 22. Modul 16 — Penghargaan

**File:** `pages/Penghargaan.tsx`
**Route:** `/penghargaan`

### 22.1 Jenis Penghargaan

- **Satyalancana Karya Satya**: 10, 20, 30 Tahun pengabdian
- **ASN Teladan**: Tingkat Nasional, Provinsi
- **Nakes Teladan RS**: Pilihan internal
- **Penghargaan Khusus**: Direktur, Gubernur, Presiden

### 22.2 Flow Penghargaan

```
Identifikasi pegawai yang memenuhi syarat
(masa kerja 10/20/30 tahun, penilaian baik)
        │
  Input penghargaan:
  - Jenis, tanggal pemberian
  - Nomor SK, instansi pemberi
  - Tingkat (Nasional/Provinsi/Kota/Instansi)
        │
  dispatch(ADD_PENGHARGAAN)
        │
  Tampil di profil pegawai (tab riwayat)
  dan di laporan Laporan & Statistik
```

---

## 23. Modul 17 — Mutasi & Rotasi

**File:** `pages/Mutasi.tsx`
**Route:** `/mutasi`
**Dasar Hukum:** PP No. 11/2017, Peraturan Direktur RS

### 23.1 Jenis Mutasi

| Jenis | Keterangan |
|---|---|
| Mutasi Internal | Perpindahan antar unit dalam RS |
| Mutasi Eksternal | Perpindahan ke instansi lain |
| Rotasi | Pergiliran tugas (tanpa perubahan eselon) |
| Promosi Jabatan | Kenaikan jabatan struktural |
| Promosi Fungsional | Naik jenjang jabatan fungsional |
| Demosi | Penurunan jabatan |

### 23.2 Flow Mutasi

```
Usulan mutasi (dari unit atau inisiatif pegawai)
        │
  Input data mutasi:
  - Jenis mutasi
  - Unit/jabatan asal → Unit/jabatan tujuan
  - Tanggal usulan
  - Alasan mutasi
  - Status: 'Usulan'
        │
  dispatch(ADD_MUTASI)
        │
  Review Bidang Pengembangan SDM
        │
  ┌─────────────┬──────────────┐
  │ Disetujui   │ Ditolak      │
  ▼             ▼              │
Status:       Status:         │
'Disetujui'   'Ditolak'       │
  │            catatanPejabat │
  ▼                           │
Input nomor SK, tanggalBerlaku
Status: 'Berlaku'
        │
  Update data pegawai:
  jabatan, unitKerja di Pegawai record
```

---

## 24. Modul 18 — Komite Rumah Sakit

**File:** `pages/KomiteRS.tsx`
**Route:** `/komite-rs`
**Dasar Hukum:** Permenkes No. 755/2011 (Komite Medik)

### 24.1 Komite yang Dikelola

- Komite Medik (Sub: Kredensial, Mutu, Etika & Disiplin)
- Komite Keperawatan (Sub: Kredensial, Mutu, Etika)
- Komite Tenaga Kesehatan Lain
- Komite PPI (Pencegahan & Pengendalian Infeksi)
- Komite PMKP (Peningkatan Mutu & Keselamatan Pasien)
- Komite Etik & Hukum
- Komite K3RS

### 24.2 Flow Komite

```
┌─── KEANGGOTAAN KOMITE ───────────────────────────────────┐
│ Tambah anggota komite:                                   │
│ - Nama komite, sub komite                                │
│ - Jabatan dalam komite (Ketua/Sekretaris/Anggota)        │
│ - TMT mulai & selesai, nomor SK                          │
│ - Status: 'Aktif'                                        │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─── KEGIATAN KOMITE ──────────────────────────────────────┐
│ Jadwalkan / catat kegiatan:                              │
│ - Jenis: Rapat Rutin / Sidang / Sidang Kredensial /      │
│          Sidang Disiplin / Workshop / Audit / Evaluasi   │
│ - Agenda, peserta, status                                │
│ - Status: 'Dijadwalkan' → 'Berlangsung' → 'Selesai'     │
│ - Input hasil keputusan                                  │
└──────────────────────────────────────────────────────────┘
```

---

## 25. Modul 19 — Hubungan Industrial

**File:** `pages/HubunganIndustrial.tsx`
**Route:** `/hubungan-industrial`
**Dasar Hukum:** UU No. 13/2003 (Ketenagakerjaan), UU No. 2/2004 (PPHI)

### 25.1 Sub-Modul: Grievance (Pengaduan)

```
Pegawai mengajukan pengaduan
        │
  Input data grievance:
  - Kategori: Gaji / Kondisi Kerja / Keselamatan / 
              Diskriminasi / Lingkungan Kerja / Lainnya
  - Deskripsi keluhan
  - Status: 'Diterima'
        │
  dispatch(ADD_GRIEVANCE)
        │
  Proses mediasi oleh HR:
  Status → 'Mediasi'
  (nama mediator diisi)
        │
  ┌──────────────────┬──────────────────────┐
  │ Selesai          │ Tidak selesai        │
  ▼                  ▼                      │
Status: 'Selesai'  Status: 'Diteruskan      │
resolusi diisi     ke Disnaker'             │
tanggalResolusi
```

### 25.2 Sub-Modul: PHK

```typescript
PHKRecord {
  alasanPHK: string                // BUP, Meninggal, Pengunduran Diri, dll.
  jenisPHK: string                 // Pensiun Dini, Pensiun Normal, PTDH, dll.
  tanggalPHK, masaKerja?
  pesangon?, uangPisah?
  uangPenggantianHak?, totalPesangon?
  nomorSK?
  status: 'Proses' | 'Selesai'
}
```

---

## 26. Modul 20 — Struktur Organisasi

**File:** `pages/OrganisasiTree.tsx`
**Route:** `/organisasi`

### 26.1 Hierarki Organisasi RSUD Abdul Moeloek

```
Direktur
├── SPI (Satuan Pengawas Internal)
├── Komite Medik
├── Komite Keperawatan
├── Wakil Direktur Pend, Peng. SDM & Hukum
│   ├── Bidang Pengembangan SDM
│   ├── Bidang Hukum
│   └── Instalasi Diklat
├── Wakil Direktur Umum & Keuangan
│   ├── Bagian Keuangan
│   │   ├── Sub Bag Perbendaharaan & Mobilisasi Dana
│   │   └── Sub Bag Akuntansi & Verifikasi
│   ├── Bagian Perencanaan & Anggaran
│   └── Bagian Umum
│       ├── Sub Bag RT/Perlengkapan
│       └── Sub Bag Kepegawaian
└── Wakil Direktur Keperawatan, Pelayanan & Penunjang Medik
    ├── Bidang Pelayanan Medik
    ├── Bidang Penunjang Medik
    ├── Bidang Keperawatan
    ├── Instalasi Klinis (IGD, IRJ, IBS, ICU, dll.)
    └── Instalasi Non-Klinis (Farmasi, Lab, Gizi, dll.)
```

---

## 27. Modul 21 — Laporan & Statistik

**File:** `pages/Laporan.tsx`
**Route:** `/laporan`

### 27.1 Delapan Tab Dashboard

```
Laporan & Statistik
├── Tab 1: Overview         → KPI ringkasan semua modul + alert penting
├── Tab 2: Kepegawaian      → Distribusi pegawai (status, golongan, unit, usia)
├── Tab 3: Kehadiran        ��� Tren absensi 6 bulan + breakdown per unit
├── Tab 4: Kinerja (SKP)    → Distribusi predikat + tren nilai kinerja
├── Tab 5: Diklat           → Realisasi JP per jenis + tren peserta
├── Tab 6: Klinis & Lisensi → Status STR/SIP + jadwal re-kredensial
├── Tab 7: Penggajian       → Tren pengeluaran gaji + komposisi tunjangan
└── Tab 8: Disiplin & HI    → Rekap pelanggaran + pengaduan aktif
```

### 27.2 Jenis Visualisasi

| Chart | Digunakan untuk |
|---|---|
| Bar Chart | Distribusi, perbandingan antar kategori |
| Line Chart | Tren bulanan (gaji, absensi, diklat) |
| Area Chart | Tren kumulatif |
| Pie/Donut Chart | Proporsi (status pegawai, predikat) |
| Radar Chart | Kompetensi multi-dimensi |
| Progress Bar | Capaian target (diklat JP, SKP realisasi) |

---

## 28. Tipe Data & Relasi Antar Modul

```
Pegawai (pegawaiId sebagai foreign key)
    │
    ├──► AbsensiRecord      (kehadiran harian)
    ├──► CutiRecord          (pengajuan cuti)
    ├──► SKPRecord           (penilaian kinerja)
    ├──► RiwayatJabatan      (histori jabatan)
    ├──► KenaikanPangkat     (histori KP)
    ├──► DisiplinRecord      (pelanggaran)
    ├──► DiklatRecord        (pelatihan)
    ├──► STRRecord           (lisensi tenaga kesehatan)
    ├──► SIPRecord           (izin praktik)
    ├──► CredentialingRecord (kredensial klinis)
    ├──► CPDRecord           (poin pengembangan profesi)
    ├──► InsidenK3RS         (kecelakaan kerja)
    ├──► VaksinasiRecord     (vaksinasi pegawai)
    ├──► MCURecord           (medical check up)
    ├──► SlipGaji            (slip gaji bulanan)
    ├──► JadwalShift         (jadwal kerja)
    ├──► BPJSRecord          (kepesertaan BPJS)
    ├──► KontrakRecord       (kontrak kerja)
    ├──► PenghargaanRecord   (penghargaan)
    ├──► MutasiRecord        (perpindahan)
    ├──► AnggotaKomite       (keanggotaan komite)
    ├──► GrievanceRecord     (pengaduan)
    └──► PHKRecord           (pemutusan hubungan kerja)

KegiatanKomite (standalone, bukan per-pegawai)
```

---

## 29. Kontrol Akses (RBAC)

### 29.1 Matriks Hak Akses

| Modul | Admin | Direktur | Kepala Unit | Pegawai |
|---|:---:|:---:|:---:|:---:|
| Data Pegawai (semua) | ✅ | 👁 | 👁 unit | 👁 diri |
| Absensi (input) | ✅ | ✅ | ✅ unit | — |
| Cuti (approve) | ✅ | ✅ Lvl 2 | ✅ Lvl 1 | Ajukan |
| SKP (nilai) | ✅ | ✅ | ✅ unit | Lihat |
| Kenaikan Pangkat | ✅ | ✅ | — | Lihat |
| Disiplin | ✅ | ✅ | — | — |
| Penggajian | ✅ | 👁 | — | 👁 diri |
| Credentialing | ✅ | ✅ | — | Lihat |
| Laporan | ✅ | ✅ | ✅ unit | — |
| Surat Kepegawaian | ✅ | ✅ | — | Ajukan |

> ✅ = CRUD penuh · 👁 = Read only · — = Tidak bisa akses

### 29.2 Catatan Implementasi

Pada versi ini, semua role dapat mengakses semua modul (validasi RBAC di UI-level direncanakan di fase berikutnya). Role sudah tersimpan di `AppUser.role` dan dapat digunakan untuk conditional rendering.

---

## 30. Data Master & Referensi

### 30.1 Unit Kerja (90+ unit — `constants.ts`)

Dikelompokkan menjadi:
- **Pimpinan**: Direktur, 3 Wakil Direktur
- **Struktural**: 4 Bagian, 5 Bidang, Sub Bagian/Sub Bidang
- **Fungsional Non-Eselon**: SPI, Komite-komite RS
- **Instalasi Klinis**: IGD, IRJ, IBS, ICU/ICCU/PICU, 20+ ruang rawat
- **Instalasi Penunjang**: Farmasi, Lab, Gizi, Radiologi, CSSD, dll.
- **SMF & Unit Khusus**: SMF Penyakit Dalam, UTD-RS, K3, PMKP, dll.

### 30.2 Pangkat & Golongan Ruang (17 level — `constants.ts`)

```
I/a (Juru Muda) → I/b → I/c → I/d
II/a (Pengatur Muda) → II/b → II/c → II/d
III/a (Penata Muda) → III/b → III/c → III/d
IV/a (Pembina) → IV/b → IV/c → IV/d → IV/e (Pembina Utama)
```

### 30.3 Referensi Peraturan Perundangan

| Peraturan | Topik |
|---|---|
| PP No. 11 Tahun 2017 | Manajemen PNS (cuti, kenaikan pangkat, disiplin) |
| PP No. 49 Tahun 2018 | Manajemen PPPK |
| PP No. 15 Tahun 2019 | Gaji PNS |
| PP No. 94 Tahun 2021 | Disiplin PNS |
| PP No. 50 Tahun 2012 | SMK3 (Sistem Manajemen K3) |
| PermenPAN-RB No. 6/2022 | Pengelolaan Kinerja ASN (SKP) |
| Permenkes No. 66/2016 | K3 Rumah Sakit |
| Permenkes No. 755/2011 | Komite Medik di RS |
| UU No. 13 Tahun 2003 | Ketenagakerjaan (Honorer/Kontrak) |
| UU No. 29 Tahun 2004 | Praktik Kedokteran (STR/SIP) |
| UU No. 17 Tahun 2023 | Kesehatan (Tenaga Kesehatan) |

---

*Dokumen ini dibuat otomatis berdasarkan analisis source code HR APP v2.0*
*RSUD Abdul Moeloek, Provinsi Lampung — Maret 2026*
