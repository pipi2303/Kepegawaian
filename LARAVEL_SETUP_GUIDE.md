# Panduan Implementasi Tahap 1: Backend Laravel 11 HCMS Rumah Sakit

Dokumen ini berisi panduan teknis hasil pengerjaan **Tahap 1: Setup Proyek & Database Migration** untuk sistem HCMS Kepegawaian Rumah Sakit.

---

## 1. Berkas & Struktur yang Telah Disiapkan

Seluruh arsitektur Laravel telah disiapkan di dalam folder `/laravel`:

```
laravel/
├── composer.json                                       # Laravel 11, Inertia, Spatie Permission, Maatwebsite Excel
├── .env.example                                        # Konfigurasi Environment (DB, Queue, Mail, Timezone WIB)
├── app/
│   └── Models/
│       ├── Pegawai.php                                 # Model Inti Pegawai RS & Hitung Sisa Cuti Tahunan
│       ├── Cuti.php & CutiApproval.php                 # Manajemen Cuti & Approval Berjenjang
│       ├── StrRecord.php & SipRecord.php               # Lisensi Medis + Scope Expiring Within (Early Warning)
│       ├── Credentialing.php                           # Kewenangan Klinis (SPK & RKK Komite Medik)
│       ├── JadwalShift.php                             # Penjadwalan Shift 24/7 RS
│       └── Absensi.php                                 # Presensi & Toleransi Keterlambatan
└── database/
    ├── migrations/
    │   ├── 2026_01_01_000001_create_pegawai_and_keluarga_tables.php
    │   ├── 2026_01_01_000002_create_absensi_and_cuti_tables.php
    │   ├── 2026_01_01_000003_create_str_sip_and_credentialing_tables.php
    │   ├── 2026_01_01_000004_create_jadwal_shift_and_k3rs_tables.php
    │   ├── 2026_01_01_000005_create_penggajian_and_bpjs_tables.php
    │   ├── 2026_01_01_000006_create_skp_and_disiplin_tables.php
    │   └── 2026_01_01_000007_create_komite_and_organisasi_tables.php
    └── seeders/
        ├── RoleAndPermissionSeeder.php                 # Spatie RBAC (admin, direktur, kepala_unit, nakes)
        ├── PegawaiCsvSeeder.php                        # Parser data pegawai dari CSV
        └── DatabaseSeeder.php                          # Master Seeder
```

---

## 2. Cara Menjalankan di Lingkungan Lokal / Server (PHP 8.2+)

### Langkah 1: Masuk ke Folder Laravel & Pasang Dependensi
```bash
cd laravel
composer install
```

### Langkah 2: Konfigurasi File Environment
```bash
cp .env.example .env
php artisan key:generate
```

Sesuaikan koneksi database di file `.env`:
```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hcms_hospital
DB_USERNAME=root
DB_PASSWORD=rahasia
```

### Langkah 3: Eksekusi Migrasi & Seeder Database
```bash
# Buat database jika belum ada, lalu jalankan seluruh 7 file migrasi:
php artisan migrate

# Jalankan seeder roles & izin (Spatie) serta data pegawai CSV:
php artisan db:seed
```

---

## 3. Matriks Relasi Antar Tabel (Entity Relationship)

| Tabel Sumber | Relasi | Tabel Tujuan | Keterangan |
| :--- | :--- | :--- | :--- |
| `m_pegawai` | HasMany | `t_pegawai_keluarga` | Pasangan, anak, orang tua untuk tunjangan |
| `m_pegawai` | HasMany | `t_cuti` | Riwayat dan pengajuan cuti pegawai |
| `t_cuti` | HasMany | `t_cuti_approval` | Alur persetujuan berjenjang (Level 1 s/d 3) |
| `m_pegawai` | HasMany | `t_pegawai_str` | Lisensi STR Nakes (Dokter, Perawat, dll.) |
| `m_pegawai` | HasMany | `t_pegawai_sip` | Izin Praktik di faskes RS |
| `m_pegawai` | HasMany | `t_credentialing` | Dokumen SPK (Surat Penugasan Klinis) & RKK |
| `m_pegawai` | HasMany | `t_jadwal_shift` | Shift 24/7 (Pagi, Sore, Malam, On-Call) |
| `m_pegawai` | HasMany | `t_gaji_header` | Payroll bulanan, slip gaji & remunerasi |
| `t_gaji_header` | HasMany | `t_gaji_detail` | Rincian komponen tunjangan dan potongan |

---

## 4. Hasil Pengerjaan Tahap 2: Service Layer, Seeder Lengkap & API Controllers

Komponen backend fungsional berikut telah selesai dibuat:

### A. Seeder Data Terpadu (`laravel/database/seeders/`)
* **`PegawaiDetailSeeder.php`**: Mengimpor data pejabat struktural dan tenaga medis dari file `pegawai-jabatan-unit.csv`, mengaitkan data keluarga dan lisensi STR/SIP.
* **`JadwalShiftDanAbsensiSeeder.php`**: Men-generate jadwal shift 24/7 (Pagi, Sore, Malam) dan riwayat presensi harian Maret 2026.

### B. Service Layer (`laravel/app/Services/`)
* **`CutiService.php`**: 
  - Validasi kuota sisa cuti tahunan (Maksimal 12 hari kerja per tahun sesuai PP No. 11/2017).
  - Inisiasi alur persetujuan berjenjang (Level 1: Kepala Ruangan/Unit $\rightarrow$ Level 2: Subbag Kepegawaian/Direksi).
  - Aksi `approve()` dan `reject()`.
* **`AbsensiService.php`**:
  - Validasi toleransi keterlambatan standar RS 7.5 menit (450 detik).
  - Kalkulasi menit keterlambatan otomatis.
  - Rekapitulasi presensi bulanan (persentase kehadiran, rekapitulasi sakit, izin, alpha).
* **`CredentialingService.php`**:
  - Validasi keaktifan lisensi STR dan SIP faskes sebelum izin kredensial diproses.
  - Asesmen Mitra Bestari / Subkomite Kredensial.
  - Penerbitan Surat Penugasan Klinis (SPK) dan Rincian Kewenangan Klinis (RKK).
* **`LisensiMonitoringService.php`**:
  - Deteksi dini masa kedaluwarsa STR dan SIP (Early warning H-90 hari).
  - Ringkasan kepatuhan lisensi rumah sakit (*compliance rate*).

### C. Controllers & REST Endpoints (`laravel/routes/api.php`)
* **Pegawai**: `GET /api/v1/pegawai`, `POST /api/v1/pegawai`, `GET /api/v1/pegawai/{id}`, `PUT /api/v1/pegawai/{id}`
* **Cuti**: `GET /api/v1/cuti`, `POST /api/v1/cuti`, `POST /api/v1/cuti/{id}/approve`, `POST /api/v1/cuti/{id}/reject`, `GET /api/v1/pegawai/{id}/sisa-cuti`
* **Presensi**: `POST /api/v1/absensi/check-in`, `POST /api/v1/absensi/check-out`, `GET /api/v1/absensi/rekap-bulanan`
* **Credentialing**: `GET /api/v1/credentialing`, `POST /api/v1/credentialing`, `POST /api/v1/credentialing/{id}/rekomendasi`, `POST /api/v1/credentialing/{id}/issue-spk`, `GET /api/v1/credentialing/license-alerts`

---

## 5. Hasil Pengerjaan Tahap 3: Integrasi Inertia.js React & Autentikasi Pengguna

Arsitektur antarmuka dan kontroler web berbasis **Inertia.js + React** telah siap:

### A. Middleware & Root Template
* **`laravel/resources/views/app.blade.php`**: Entry point HTML dengan direktif `@inertia`, `@viteReactRefresh`, dan pemuatan stylesheet Plus Jakarta Sans.
* **`laravel/app/Http/Middleware/HandleInertiaRequests.php`**:
  * Mengalirkan context `auth.user` dan `auth.pegawai` (NIP, Nama, Jabatan, Unit, Sisa Cuti Tahunan).
  * Mengalirkan notifikasi global `alerts` (jumlah cuti pending, STR kedaluwarsa).
  * Mengalirkan flash session message (`success`, `error`, `warning`).

### B. Web Controllers (`laravel/app/Http/Controllers/Web/`)
* **`DashboardController.php`**: Menyajikan metrik eksekutif RS (PNS vs PPPK, kehadiran hari ini, alert lisensi).
* **`CutiWebController.php`**: Menyajikan halaman `Cuti` dengan data paginasi, filter status, pengajuan baru, dan persetujuan bertingkat.
* **`PegawaiWebController.php`**: Menyajikan halaman pencarian dan profil detail pegawai (`Pegawai/Detail`).
* **`AbsensiWebController.php`**: Menyajikan tabel presensi hari ini dan rekapitulasi kehadiran bulanan.
* **`CredentialingWebController.php`**: Menyajikan alur verifikasi kewenangan klinis nakes dan penerbitan SPK.
* **`LoginController.php`**: Autentikasi login, validasi NIP/kredensial, dan manajemen sesi.

### C. Web Routes (`laravel/routes/web.php`)
```
GET   /login               -> Halaman Login RSUDAM
POST  /login               -> Autentikasi Kredensial Pegawai
POST  /logout              -> Logout Sesi

GET   /                    -> Dashboard Eksekutif RS
GET   /pegawai             -> Direktori Pegawai
GET   /pegawai/{id}        -> Profil & Rekam Medis Pegawai
GET   /cuti                -> Modul Cuti Pegawai (PP 11/2017)
POST  /cuti                -> Kirim Pengajuan Cuti
POST  /cuti/{id}/approve   -> Persetujuan Cuti Berjenjang
POST  /cuti/{id}/reject    -> Penolakan Cuti
GET   /absensi             -> Portal Presensi & Shift
POST  /absensi/check-in    -> Check-In Cepat
POST  /absensi/check-out   -> Check-Out Cepat
GET   /credentialing       -> Modul Credentialing & SPK
POST  /credentialing       -> Pengajuan Kredensial
```

### D. Inertia Client Setup (`laravel/resources/js/`)
* **`app.tsx`**: Inisialisasi `createInertiaApp` dengan React 18, dynamic import halaman `Pages/**/*.tsx`, dan indikator progress bar warna tema RS `#013E37`.
* **`Pages/` (25 Modul RS Lengkap)**: Seluruh 25 modul telah disinkronisasikan ke dalam `laravel/resources/js/Pages/`:
  1. `Dashboard.tsx`
  2. `DataPegawai.tsx`
  3. `DetailPegawai.tsx`
  4. `Cuti.tsx`
  5. `Absensi.tsx`
  6. `Penjadwalan.tsx`
  7. `Credentialing.tsx`
  8. `Penggajian.tsx`
  9. `SKP.tsx`
  10. `PerformanceManagement.tsx`
  11. `K3RS.tsx`
  12. `BPJS.tsx`
  13. `Kontrak.tsx`
  14. `Diklat.tsx`
  15. `Disiplin.tsx`
  16. `Penghargaan.tsx`
  17. `Mutasi.tsx`
  18. `RiwayatJabatan.tsx`
  19. `KenaikanPangkat.tsx`
  20. `KomiteRS.tsx`
  21. `OrganisasiTree.tsx`
  22. `HubunganIndustrial.tsx`
  23. `SuratKepegawaian.tsx`
  24. `Laporan.tsx`
  25. `Login.tsx`
* **`components/`, `types/`, `data/`**: Komponen pendukung (Layout, Navigation, KPI Charts, Avatar, Global Search) serta data master telah disalin lengkap ke `laravel/resources/js/`.
* **`database/seeders/data/`**: Data riil master pegawai CSV RSUDAM telah tersimpan mandiri di dalam direktori seeder Laravel.

---

## 6. Cara Menjalankan Aplikasi Secara Penuh

Jalankan backend Laravel dan frontend Vite secara berdampingan:

```bash
# Terminal 1: Backend PHP Laravel
cd laravel
php artisan serve --port=8000

# Terminal 2: Frontend Vite + Inertia
cd laravel
npm install
npm run dev
```

Buka peramban di `http://localhost:8000` untuk mengakses HCMS Rumah Sakit berbasis Laravel 11 + Inertia.js React.
