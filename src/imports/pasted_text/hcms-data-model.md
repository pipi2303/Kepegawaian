# HCMS Data Model Documentation

> **Aplikasi:** Human Capital Management System (HCMS)
> **Versi:** 1.0 | **Terakhir Diperbarui:** 16 Maret 2026
> **Regulasi Acuan:** PP No. 11/2017, PermenPAN-RB No. 6/2022, UU No. 13/2003, UU No. 6/2023
> **File Definisi Tipe:** `/src/app/types/index.ts`
> **State Management:** React Context + useReducer (`/src/app/context/AppContext.tsx`)
> **Persistensi:** localStorage (key: `hr_app_user`)

---

## Daftar Isi

1. [Arsitektur Data](#1-arsitektur-data)
2. [Entity: Pegawai (Master Data)](#2-entity-pegawai-master-data)
3. [Entity: Data Keluarga](#3-entity-data-keluarga)
4. [Entity: Dokumen Pegawai](#4-entity-dokumen-pegawai)
5. [Entity: Absensi](#5-entity-absensi)
6. [Entity: Cuti](#6-entity-cuti)
7. [Entity: SKP (Sasaran Kinerja Pegawai)](#7-entity-skp)
8. [Entity: Riwayat Jabatan](#8-entity-riwayat-jabatan)
9. [Entity: Kenaikan Pangkat](#9-entity-kenaikan-pangkat)
10. [Entity: Disiplin](#10-entity-disiplin)
11. [Entity: Diklat](#11-entity-diklat)
12. [Entity: Penggajian (Slip Gaji)](#12-entity-penggajian-slip-gaji)
13. [Entity: Jadwal Shift (Penjadwalan)](#13-entity-jadwal-shift)
14. [Entity: BPJS](#14-entity-bpjs)
15. [Entity: Kontrak Kerja](#15-entity-kontrak-kerja)
16. [Entity: Penghargaan](#16-entity-penghargaan)
17. [Entity: Mutasi & Promosi](#17-entity-mutasi--promosi)
18. [Entity: Komite RS](#18-entity-komite-rs)
19. [Entity: Hubungan Industrial (Grievance)](#19-entity-hubungan-industrial)
20. [Entity: PHK / Pensiun](#20-entity-phk--pensiun)
21. [Entity: Credentialing](#21-entity-credentialing)
22. [Entity: STR (Surat Tanda Registrasi)](#22-entity-str)
23. [Entity: SIP / SIK](#23-entity-sip--sik)
24. [Entity: CPD (Continuing Professional Development)](#24-entity-cpd)
25. [Entity: K3RS](#25-entity-k3rs)
26. [Entity: Performance Management (BSC + OKR)](#26-entity-performance-management)
27. [Entity: App User (Autentikasi)](#27-entity-app-user)
28. [Entity: Approval Level](#28-entity-approval-level)
29. [Lookup / Constants](#29-lookup--constants)
30. [State Tree (AppState)](#30-state-tree-appstate)
31. [CRUD Actions](#31-crud-actions)
32. [Entity Relationship Diagram (Tekstual)](#32-entity-relationship-diagram)

---

## 1. Arsitektur Data

```
AppContext (useReducer)
  |
  +-- AppState
  |     +-- pegawai[]           -- Master data 246 pegawai (P001-P246)
  |     +-- cuti[]              -- Pengajuan & riwayat cuti
  |     +-- absensi[]           -- Rekaman kehadiran harian
  |     +-- skp[]               -- Sasaran Kinerja Pegawai
  |     +-- riwayatJabatan[]    -- Riwayat mutasi jabatan
  |     +-- kenaikanPangkat[]   -- Proses kenaikan pangkat/golongan
  |     +-- disiplin[]          -- Catatan hukuman disiplin
  |     +-- diklat[]            -- Pendidikan & pelatihan
  |     +-- str[]               -- Surat Tanda Registrasi tenaga kesehatan
  |     +-- sip[]               -- Surat Izin Praktik / SIK / SIPP / SIKB
  |     +-- credentialing[]     -- Kredensial & kewenangan klinis
  |     +-- cpd[]               -- Continuing Professional Development
  |     +-- insidenK3RS[]       -- Insiden keselamatan kerja
  |     +-- vaksinasi[]         -- Riwayat vaksinasi pegawai
  |     +-- mcu[]               -- Medical Check Up
  |     +-- slipGaji[]          -- Slip gaji bulanan
  |     +-- jadwalShift[]       -- Jadwal shift/piket
  |     +-- bpjs[]              -- Data kepesertaan BPJS
  |     +-- kontrak[]           -- Kontrak kerja (PKWT, mitra, dll)
  |     +-- penghargaan[]       -- Riwayat penghargaan
  |     +-- mutasi[]            -- Mutasi, rotasi, promosi, demosi
  |     +-- anggotaKomite[]     -- Keanggotaan komite RS
  |     +-- kegiatanKomite[]    -- Kegiatan/rapat komite
  |     +-- grievance[]         -- Pengaduan hubungan industrial
  |     +-- phk[]               -- PHK / Pensiun
  |     +-- currentUser         -- User yang sedang login
  |     +-- isLoggedIn          -- Status autentikasi
  |
  +-- Mock Data Sources
        +-- /src/app/data/mockData.ts       -- Pegawai, Cuti, SKP, Riwayat Jabatan, KP
        +-- /src/app/data/mockDataRS.ts     -- STR, SIP, Credentialing, K3RS, Gaji, dll
        +-- /src/app/data/constants.ts      -- Pangkat/Golongan, Jenis Cuti, Unit Kerja
        +-- /src/app/data/performanceData.ts -- BSC, OKR, Performance Review
        +-- /src/app/data/hospitalDashboardData.ts -- Data dashboard rumah sakit
```

---

## 2. Entity: Pegawai (Master Data)

**Tabel Utama** | Relasi: 1-to-Many ke hampir seluruh entity lainnya via `pegawaiId`

| Field              | Tipe                                        | Wajib | Keterangan                                   |
| ------------------ | ------------------------------------------- | ----- | -------------------------------------------- |
| `id`               | `string`                                    | Ya    | Primary key, format `P001`-`P246`            |
| `nip`              | `string`                                    | Ya    | Nomor Induk Pegawai (18 digit untuk ASN)     |
| `nama`             | `string`                                    | Ya    | Nama lengkap tanpa gelar                     |
| `gelarDepan`       | `string`                                    | Tidak | Gelar depan (dr., Prof., dll.)               |
| `gelarBelakang`    | `string`                                    | Tidak | Gelar belakang (Sp.An., M.Kes., dll.)        |
| `jenisKelamin`     | `'L' \| 'P'`                               | Ya    | Laki-laki / Perempuan                        |
| `tempatLahir`      | `string`                                    | Ya    | Kota/kabupaten tempat lahir                  |
| `tanggalLahir`     | `string`                                    | Ya    | Format ISO: `YYYY-MM-DD`                     |
| `agama`            | `string`                                    | Ya    | Islam, Kristen, Katolik, Hindu, Buddha, Kong |
| `statusPerkawinan` | `string`                                    | Ya    | Kawin / Belum Kawin / Cerai                  |
| `alamat`           | `string`                                    | Ya    | Alamat domisili                              |
| `noTelp`           | `string`                                    | Ya    | Nomor telepon / HP                           |
| `email`            | `string`                                    | Ya    | Alamat email                                 |
| `jabatan`          | `string`                                    | Ya    | Jabatan saat ini                             |
| `jabatanFungsional`| `string`                                    | Ya    | Jabatan fungsional                           |
| `unitKerja`        | `string`                                    | Ya    | Unit kerja (referensi: `UNIT_KERJA[]`)       |
| `golongan`         | `string`                                    | Ya    | Golongan/ruang (I/a s.d. IV/e)               |
| `pangkat`          | `string`                                    | Ya    | Pangkat (referensi: `PANGKAT_GOLONGAN`)      |
| `tmtGolongan`      | `string`                                    | Ya    | TMT golongan terakhir                        |
| `tmtJabatan`       | `string`                                    | Ya    | TMT jabatan terakhir                         |
| `statusPegawai`    | `'PNS' \| 'PPPK' \| 'Honorer'`             | Ya    | Status kepegawaian                           |
| `statusAktif`      | `'Aktif' \| 'Pensiun' \| 'Meninggal' \| 'Diberhentikan'` | Ya | Status keaktifan              |
| `pendidikanTerakhir` | `string`                                  | Ya    | SD/SMP/SMA/D3/S1/S2/S3/Sp                   |
| `jurusan`          | `string`                                    | Ya    | Jurusan/program studi                        |
| `institusi`        | `string`                                    | Ya    | Nama institusi pendidikan                    |
| `tahunLulus`       | `number`                                    | Ya    | Tahun kelulusan                              |
| `tanggalMasuk`     | `string`                                    | Ya    | Tanggal pertama masuk kerja                  |
| `batasPensiun`     | `string`                                    | Ya    | Tanggal batas usia pensiun                   |
| `masaKerja`        | `string`                                    | Ya    | Masa kerja (misal: "15 Tahun 3 Bulan")       |
| `eselon`           | `string`                                    | Tidak | Eselon jabatan struktural                    |
| `badge`            | `string`                                    | Tidak | Nomor/kode badge ID pegawai                  |
| `foto`             | `string`                                    | Tidak | Base64 data URL atau URL eksternal           |
| `sertifikat`       | `string[]`                                  | Tidak | Daftar nama sertifikat/kompetensi            |

---

## 3. Entity: Data Keluarga

**Relasi:** `pegawaiId` -> `Pegawai.id` (Many-to-One)

| Field            | Tipe                  | Wajib | Keterangan                                |
| ---------------- | --------------------- | ----- | ----------------------------------------- |
| `id`             | `string`              | Ya    | Primary key                               |
| `pegawaiId`      | `string`              | Ya    | FK ke Pegawai                             |
| `hubungan`       | `HubunganKeluarga`    | Ya    | Suami/Istri/Anak/Orang Tua/Mertua/Saudara Kandung/Lainnya |
| `nama`           | `string`              | Ya    | Nama anggota keluarga                     |
| `jenisKelamin`   | `'L' \| 'P'`         | Ya    | Laki-laki / Perempuan                     |
| `tempatLahir`    | `string`              | Ya    | Tempat lahir                              |
| `tanggalLahir`   | `string`              | Ya    | Format `YYYY-MM-DD`                       |
| `nomorKTP`       | `string`              | Tidak | NIK KTP                                  |
| `agama`          | `string`              | Tidak | Agama                                    |
| `pendidikan`     | `string`              | Tidak | Pendidikan terakhir                       |
| `pekerjaan`      | `string`              | Tidak | Pekerjaan                                |
| `statusHidup`    | `'Hidup' \| 'Meninggal'` | Ya | Status hidup                              |
| `tunjangan`      | `boolean`             | Ya    | Terdaftar sebagai penerima tunjangan      |
| `keterangan`     | `string`              | Tidak | Catatan tambahan                          |

---

## 4. Entity: Dokumen Pegawai

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field               | Tipe              | Wajib | Keterangan                              |
| ------------------- | ----------------- | ----- | --------------------------------------- |
| `id`                | `string`          | Ya    | Primary key                             |
| `pegawaiId`         | `string`          | Ya    | FK ke Pegawai                           |
| `kategori`          | `KategoriDokumen` | Ya    | Identitas Diri / Kepegawaian / Pendidikan & Sertifikasi / Dokumen Rumah Sakit |
| `namaDokumen`       | `string`          | Ya    | Nama dokumen                            |
| `nomorDokumen`      | `string`          | Tidak | Nomor dokumen                           |
| `tanggalTerbit`     | `string`          | Tidak | Tanggal terbit                          |
| `tanggalKadaluarsa` | `string`          | Tidak | Tanggal kadaluarsa                      |
| `instansiPenerbit`  | `string`          | Tidak | Instansi penerbit                       |
| `keterangan`        | `string`          | Tidak | Keterangan                              |
| `fileUrl`           | `string`          | Tidak | Base64 atau URL file                    |
| `fileName`          | `string`          | Tidak | Nama file yang diunggah                 |
| `status`            | `StatusDokumen`   | Ya    | Valid / Kadaluarsa / Segera Kadaluarsa / Belum Upload |

---

## 5. Entity: Absensi

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field          | Tipe             | Wajib | Keterangan                                   |
| -------------- | ---------------- | ----- | -------------------------------------------- |
| `id`           | `string`         | Ya    | Primary key, format `A{n}`                   |
| `pegawaiId`    | `string`         | Ya    | FK ke Pegawai                                |
| `tanggal`      | `string`         | Ya    | Format `YYYY-MM-DD`                          |
| `jamMasuk`     | `string`         | Tidak | Format `HH:mm`                               |
| `jamKeluar`    | `string`         | Tidak | Format `HH:mm`                               |
| `status`       | `AbsensiStatus`  | Ya    | Hadir / Alpha / Sakit / Cuti / Izin / Dinas Luar / Libur |
| `keterangan`   | `string`         | Tidak | Keterangan tambahan (misal: nomor surat dokter) |
| `diinputOleh`  | `string`         | Tidak | User yang menginput                          |

**Catatan:** Data absensi Maret 2026 di-generate secara deterministik di `AppContext.tsx` untuk 20 pegawai (P001-P020) pada semua hari kerja. Mendukung `BULK_INPUT_ABSENSI` action.

---

## 6. Entity: Cuti

**Relasi:** `pegawaiId` -> `Pegawai.id` | Berisi `approvalLevels[]` (embedded)

| Field              | Tipe               | Wajib | Keterangan                              |
| ------------------ | ------------------ | ----- | --------------------------------------- |
| `id`               | `string`           | Ya    | Primary key                             |
| `pegawaiId`        | `string`           | Ya    | FK ke Pegawai                           |
| `jenisCuti`        | `JenisCuti`        | Ya    | Cuti Tahunan / Sakit / Melahirkan / Alasan Penting / Besar / CLTN |
| `tanggalMulai`     | `string`           | Ya    | Tanggal mulai cuti                      |
| `tanggalSelesai`   | `string`           | Ya    | Tanggal selesai cuti                    |
| `jumlahHari`       | `number`           | Ya    | Jumlah hari cuti                        |
| `alasan`           | `string`           | Ya    | Alasan pengajuan                        |
| `status`           | `'Pending' \| 'Disetujui' \| 'Ditolak'` | Ya | Status persetujuan         |
| `disetujuiOleh`    | `string`           | Tidak | Nama pejabat yang menyetujui            |
| `tanggalPengajuan` | `string`           | Ya    | Tanggal pengajuan                       |
| `tanggalDisetujui` | `string`           | Tidak | Tanggal disetujui                       |
| `keterangan`       | `string`           | Tidak | Catatan tambahan                        |
| `approvalLevels`   | `ApprovalLevel[]`  | Tidak | Multi-level approval chain (embedded)   |

### Sub-entity: SisaCuti

| Field       | Tipe        | Wajib | Keterangan                     |
| ----------- | ----------- | ----- | ------------------------------ |
| `pegawaiId` | `string`    | Ya    | FK ke Pegawai                  |
| `tahun`     | `number`    | Ya    | Tahun kuota                    |
| `jenis`     | `JenisCuti` | Ya    | Jenis cuti                     |
| `kuota`     | `number`    | Ya    | Total kuota                    |
| `terpakai`  | `number`    | Ya    | Jumlah yang telah terpakai     |
| `sisa`      | `number`    | Ya    | Sisa kuota                     |

---

## 7. Entity: SKP (Sasaran Kinerja Pegawai)

**Relasi:** `pegawaiId` -> `Pegawai.id` | Berisi `targetKinerja[]` (embedded)
**Regulasi:** PermenPAN-RB No. 6/2022

| Field             | Tipe               | Wajib | Keterangan                          |
| ----------------- | ------------------ | ----- | ----------------------------------- |
| `id`              | `string`           | Ya    | Primary key                         |
| `pegawaiId`       | `string`           | Ya    | FK ke Pegawai                       |
| `tahun`           | `number`           | Ya    | Tahun penilaian                     |
| `semester`        | `1 \| 2`           | Ya    | Semester penilaian                  |
| `targetKinerja`   | `TargetKinerja[]`  | Ya    | Daftar target kinerja (embedded)    |
| `nilaiAkhir`      | `number`           | Tidak | Nilai akhir (0-100)                 |
| `predikat`        | `PredikatSKP`      | Tidak | Sangat Baik / Baik / Cukup / Kurang |
| `status`          | `string`           | Ya    | Draft / Aktif / Selesai / Disetujui |
| `catatanAtasan`   | `string`           | Tidak | Catatan pejabat penilai             |
| `disetujuiOleh`   | `string`           | Tidak | Nama atasan penilai                 |
| `tanggalDisetujui`| `string`           | Tidak | Tanggal disetujui                   |

### Sub-entity: TargetKinerja

| Field            | Tipe     | Wajib | Keterangan                    |
| ---------------- | -------- | ----- | ----------------------------- |
| `id`             | `string` | Ya    | Primary key                   |
| `uraianKegiatan` | `string` | Ya    | Deskripsi kegiatan            |
| `target`         | `number` | Ya    | Target kuantitatif            |
| `satuan`         | `string` | Tidak | Satuan ukur                   |
| `realisasi`      | `number` | Tidak | Realisasi capaian             |
| `nilaiCapaian`   | `number` | Tidak | Nilai capaian (%)             |
| `bobot`          | `number` | Ya    | Bobot dalam penilaian (%)     |

---

## 8. Entity: Riwayat Jabatan

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field          | Tipe             | Wajib | Keterangan                            |
| -------------- | ---------------- | ----- | ------------------------------------- |
| `id`           | `string`         | Ya    | Primary key                           |
| `pegawaiId`    | `string`         | Ya    | FK ke Pegawai                         |
| `jabatan`      | `string`         | Ya    | Nama jabatan                          |
| `unitKerja`    | `string`         | Ya    | Unit kerja                            |
| `golongan`     | `string`         | Ya    | Golongan saat menjabat                |
| `tmtMulai`     | `string`         | Ya    | TMT mulai jabatan                     |
| `tmtSelesai`   | `string`         | Tidak | TMT selesai jabatan (null = masih)    |
| `nomorSK`      | `string`         | Ya    | Nomor SK pengangkatan                 |
| `tanggalSK`    | `string`         | Ya    | Tanggal SK                            |
| `jenisJabatan` | `JenisJabatan`   | Ya    | Struktural / Fungsional / Pelaksana   |
| `keterangan`   | `string`         | Tidak | Catatan tambahan                      |

---

## 9. Entity: Kenaikan Pangkat

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field            | Tipe                     | Wajib | Keterangan                          |
| ---------------- | ------------------------ | ----- | ----------------------------------- |
| `id`             | `string`                 | Ya    | Primary key                         |
| `pegawaiId`      | `string`                 | Ya    | FK ke Pegawai                       |
| `golonganLama`   | `string`                 | Ya    | Golongan sebelum naik               |
| `golonganBaru`   | `string`                 | Ya    | Golongan tujuan                     |
| `pangkatLama`    | `string`                 | Ya    | Pangkat sebelum naik                |
| `pangkatBaru`    | `string`                 | Ya    | Pangkat tujuan                      |
| `jenisKenaikan`  | `JenisKenaikanPangkat`   | Ya    | Reguler / Fungsional / Pilihan / Anumerta |
| `periodeUsulan`  | `string`                 | Ya    | Periode usulan (misal: "April 2026")|
| `tanggalBerlaku` | `string`                 | Tidak | TMT berlaku pangkat baru            |
| `status`         | `string`                 | Ya    | Proses / Selesai / Ditolak / Pending |
| `nomorSK`        | `string`                 | Tidak | Nomor SK kenaikan pangkat           |
| `tanggalSK`      | `string`                 | Tidak | Tanggal SK                          |
| `jabatan`        | `string`                 | Ya    | Jabatan saat usul                   |
| `eselon`         | `string`                 | Ya    | Eselon jabatan                      |
| `keterangan`     | `string`                 | Tidak | Catatan tambahan                    |

---

## 10. Entity: Disiplin

**Relasi:** `pegawaiId` -> `Pegawai.id`
**Regulasi:** PP No. 94/2021 tentang Disiplin PNS

| Field              | Tipe                        | Wajib | Keterangan                        |
| ------------------ | --------------------------- | ----- | --------------------------------- |
| `id`               | `string`                    | Ya    | Primary key, format `D{nnn}`      |
| `pegawaiId`        | `string`                    | Ya    | FK ke Pegawai                     |
| `jenisHukuman`     | `string`                    | Ya    | Deskripsi jenis hukuman           |
| `tingkatHukuman`   | `TingkatHukumanDisiplin`    | Ya    | Ringan / Sedang / Berat           |
| `tanggalKejadian`  | `string`                    | Ya    | Tanggal kejadian pelanggaran      |
| `tanggalSK`        | `string`                    | Tidak | Tanggal SK hukuman disiplin       |
| `nomorSK`          | `string`                    | Tidak | Nomor SK                          |
| `kronologi`        | `string`                    | Ya    | Uraian kronologis pelanggaran     |
| `status`           | `string`                    | Ya    | Proses / Selesai / Investigasi / Banding |
| `pejabatPenetap`   | `string`                    | Tidak | Pejabat yang menetapkan hukuman   |
| `keterangan`       | `string`                    | Tidak | Catatan tambahan                  |

---

## 11. Entity: Diklat

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field               | Tipe           | Wajib | Keterangan                          |
| ------------------- | -------------- | ----- | ----------------------------------- |
| `id`                | `string`       | Ya    | Primary key, format `DK{nnn}`       |
| `pegawaiId`         | `string`       | Ya    | FK ke Pegawai                       |
| `namaDiklat`        | `string`       | Ya    | Nama diklat/pelatihan               |
| `jenisDiklat`       | `JenisDiklat`  | Ya    | Manajerial / Teknis / Fungsional / Orientasi / Lainnya |
| `penyelenggara`     | `string`       | Ya    | Instansi penyelenggara              |
| `tempatPelaksanaan` | `string`       | Ya    | Lokasi pelaksanaan                  |
| `tanggalMulai`      | `string`       | Ya    | Tanggal mulai                       |
| `tanggalSelesai`    | `string`       | Tidak | Tanggal selesai                     |
| `jumlahJP`          | `number`       | Ya    | Jumlah Jam Pelajaran                |
| `nomorSertifikat`   | `string`       | Tidak | Nomor sertifikat kelulusan          |
| `status`            | `StatusDiklat` | Ya    | Selesai / Berlangsung / Direncanakan / Dibatalkan |
| `keterangan`        | `string`       | Tidak | Catatan tambahan                    |

---

## 12. Entity: Penggajian (Slip Gaji)

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field                  | Tipe              | Wajib | Keterangan                      |
| ---------------------- | ----------------- | ----- | ------------------------------- |
| `id`                   | `string`          | Ya    | Primary key                     |
| `pegawaiId`            | `string`          | Ya    | FK ke Pegawai                   |
| `bulan`                | `number`          | Ya    | Bulan gaji (1-12)               |
| `tahun`                | `number`          | Ya    | Tahun gaji                      |
| `gajiPokok`            | `number`          | Ya    | Gaji pokok (IDR)                |
| `tunjanganJabatan`     | `number`          | Ya    | Tunjangan jabatan               |
| `tunjanganFungsional`  | `number`          | Ya    | Tunjangan fungsional            |
| `tunjanganBeras`       | `number`          | Ya    | Tunjangan beras                 |
| `tunjanganAnak`        | `number`          | Ya    | Tunjangan anak                  |
| `tunjanganIstri`       | `number`          | Ya    | Tunjangan istri/suami           |
| `tunjanganKinerja`     | `number`          | Ya    | Tunjangan kinerja (TKD)         |
| `tambahanLain`         | `SlipGajiItem[]`  | Ya    | Komponen tambahan lainnya       |
| `potonganBPJSKes`      | `number`          | Ya    | Potongan BPJS Kesehatan         |
| `potonganBPJSTK`       | `number`          | Ya    | Potongan BPJS Ketenagakerjaan   |
| `potonganPPh21`        | `number`          | Ya    | Potongan PPh Pasal 21           |
| `potonganTaspen`       | `number`          | Ya    | Potongan Taspen                 |
| `potonganLain`         | `SlipGajiItem[]`  | Ya    | Potongan lainnya                |
| `totalBruto`           | `number`          | Ya    | Total penghasilan kotor         |
| `totalPotongan`        | `number`          | Ya    | Total potongan                  |
| `totalNetto`           | `number`          | Ya    | Take Home Pay                   |
| `status`               | `StatusSlipGaji`  | Ya    | Draft / Disetujui / Dibayar / Dibatalkan |
| `tanggalDibayar`       | `string`          | Tidak | Tanggal pembayaran              |

### Sub-entity: SlipGajiItem

| Field    | Tipe     | Wajib | Keterangan           |
| -------- | -------- | ----- | -------------------- |
| `uraian` | `string` | Ya    | Nama komponen        |
| `jumlah` | `number` | Ya    | Jumlah dalam IDR     |

---

## 13. Entity: Jadwal Shift

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field         | Tipe            | Wajib | Keterangan                              |
| ------------- | --------------- | ----- | --------------------------------------- |
| `id`          | `string`        | Ya    | Primary key                             |
| `pegawaiId`   | `string`        | Ya    | FK ke Pegawai                           |
| `tanggal`     | `string`        | Ya    | Tanggal shift (`YYYY-MM-DD`)            |
| `jenisShift`  | `JenisShift`    | Ya    | Pagi / Sore / Malam / Lepas / On-Call / Libur |
| `jamMulai`    | `string`        | Tidak | Jam mulai shift                         |
| `jamSelesai`  | `string`        | Tidak | Jam selesai shift                       |
| `unitKerja`   | `string`        | Ya    | Unit kerja penugasan                    |
| `status`      | `StatusJadwal`  | Ya    | Aktif / Swap / Dibatalkan               |
| `keterangan`  | `string`        | Tidak | Catatan tambahan                        |

---

## 14. Entity: BPJS

**Relasi:** `pegawaiId` -> `Pegawai.id` | Berisi `tanggungan[]` (embedded)

| Field                    | Tipe                | Wajib | Keterangan                       |
| ------------------------ | ------------------- | ----- | -------------------------------- |
| `id`                     | `string`            | Ya    | Primary key                      |
| `pegawaiId`              | `string`            | Ya    | FK ke Pegawai                    |
| `nomorKartuKesehatan`    | `string`            | Ya    | Nomor kartu BPJS Kesehatan       |
| `kelasBPJSKes`           | `'I' \| 'II' \| 'III'` | Ya | Kelas rawat                      |
| `statusBPJSKes`          | `string`            | Ya    | Aktif / Tidak Aktif / Ditangguhkan |
| `nomorBPJSTK`            | `string`            | Ya    | Nomor BPJS Ketenagakerjaan       |
| `statusBPJSTK`           | `string`            | Ya    | Aktif / Tidak Aktif              |
| `tanggungan`             | `BPJSTanggungan[]`  | Ya    | Daftar tanggungan (embedded)     |
| `iuranKesehatan`         | `number`            | Ya    | Iuran bulanan BPJS Kesehatan     |
| `iuranKetenagakerjaan`   | `number`            | Ya    | Iuran bulanan BPJS TK            |
| `tanggalDaftar`          | `string`            | Ya    | Tanggal pendaftaran              |

### Sub-entity: BPJSTanggungan

| Field               | Tipe     | Wajib | Keterangan                     |
| -------------------- | -------- | ----- | ------------------------------ |
| `id`                 | `string` | Ya    | Primary key tanggungan         |
| `nama`               | `string` | Ya    | Nama tanggungan                |
| `hubungan`           | `string` | Ya    | Hubungan keluarga              |
| `tanggalLahir`       | `string` | Ya    | Tanggal lahir                  |
| `nomorKartu`         | `string` | Ya    | Nomor kartu BPJS tanggungan    |
| `statusTanggungan`   | `string` | Ya    | Aktif / Tidak Aktif            |

---

## 15. Entity: Kontrak Kerja

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field             | Tipe             | Wajib | Keterangan                           |
| ----------------- | ---------------- | ----- | ------------------------------------ |
| `id`              | `string`         | Ya    | Primary key                          |
| `pegawaiId`       | `string`         | Ya    | FK ke Pegawai                        |
| `jenisKontrak`    | `JenisKontrak`   | Ya    | PKWT / Dokter Mitra / Dokter Paruh Waktu / PKS / Lainnya |
| `nomorKontrak`    | `string`         | Ya    | Nomor kontrak                        |
| `tanggalMulai`    | `string`         | Ya    | Tanggal mulai kontrak                |
| `tanggalSelesai`  | `string`         | Tidak | Tanggal selesai kontrak              |
| `jabatanKontrak`  | `string`         | Ya    | Jabatan sesuai kontrak               |
| `unitKerja`       | `string`         | Ya    | Unit kerja penempatan                |
| `nilaiKontrak`    | `number`         | Tidak | Nilai kontrak (IDR)                  |
| `jadwalPraktik`   | `string`         | Tidak | Jadwal praktik (untuk dokter mitra)  |
| `statusKontrak`   | `StatusKontrak`  | Ya    | Aktif / Berakhir / Dibatalkan / Diperpanjang |
| `catatanKontrak`  | `string`         | Tidak | Catatan tambahan                     |

---

## 16. Entity: Penghargaan

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field               | Tipe                 | Wajib | Keterangan                     |
| ------------------- | -------------------- | ----- | ------------------------------ |
| `id`                | `string`             | Ya    | Primary key                    |
| `pegawaiId`         | `string`             | Ya    | FK ke Pegawai                  |
| `jenisPenghargaan`  | `string`             | Ya    | Jenis penghargaan              |
| `tanggalPemberian`  | `string`             | Ya    | Tanggal pemberian              |
| `nomorSK`           | `string`             | Ya    | Nomor SK penghargaan           |
| `instansiPemberi`   | `string`             | Ya    | Instansi pemberi penghargaan   |
| `tingkat`           | `TingkatPenghargaan` | Ya    | Nasional / Provinsi / Kab-Kota / Instansi / Lainnya |
| `keterangan`        | `string`             | Tidak | Catatan tambahan               |

---

## 17. Entity: Mutasi & Promosi

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field              | Tipe            | Wajib | Keterangan                            |
| ------------------ | --------------- | ----- | ------------------------------------- |
| `id`               | `string`        | Ya    | Primary key                           |
| `pegawaiId`        | `string`        | Ya    | FK ke Pegawai                         |
| `jenisMutasi`      | `JenisMutasi`   | Ya    | Rotasi / Mutasi Internal / Mutasi Eksternal / Promosi / Demosi |
| `unitKerjaAsal`    | `string`        | Ya    | Unit kerja asal                       |
| `jabatanAsal`      | `string`        | Ya    | Jabatan asal                          |
| `unitKerjaTujuan`  | `string`        | Ya    | Unit kerja tujuan                     |
| `jabatanTujuan`    | `string`        | Ya    | Jabatan tujuan                        |
| `golonganAsal`     | `string`        | Ya    | Golongan asal                         |
| `golonganTujuan`   | `string`        | Ya    | Golongan tujuan                       |
| `tanggalUsulan`    | `string`        | Ya    | Tanggal usulan                        |
| `tanggalBerlaku`   | `string`        | Tidak | Tanggal berlaku                       |
| `nomorSK`          | `string`        | Tidak | Nomor SK mutasi                       |
| `status`           | `StatusMutasi`  | Ya    | Berlaku / Disetujui / Usulan / Ditolak / Dibatalkan |
| `alasan`           | `string`        | Ya    | Alasan mutasi/promosi                 |
| `catatanPejabat`   | `string`        | Tidak | Catatan pejabat berwenang             |

---

## 18. Entity: Komite RS

### 18a. Anggota Komite

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field           | Tipe     | Wajib | Keterangan                     |
| --------------- | -------- | ----- | ------------------------------ |
| `id`            | `string` | Ya    | Primary key                    |
| `pegawaiId`     | `string` | Ya    | FK ke Pegawai                  |
| `namaKomite`    | `string` | Ya    | Nama komite (Medik, Keperawatan, Etik, dll) |
| `subKomite`     | `string` | Tidak | Sub komite                     |
| `jabatanKomite` | `string` | Ya    | Jabatan dalam komite           |
| `tanggalMulai`  | `string` | Ya    | Tanggal mulai keanggotaan      |
| `tanggalSelesai`| `string` | Tidak | Tanggal selesai keanggotaan    |
| `statusKomite`  | `string` | Ya    | Aktif / Tidak Aktif            |
| `nomorSK`       | `string` | Ya    | Nomor SK pengangkatan          |

### 18b. Kegiatan Komite

| Field             | Tipe                    | Wajib | Keterangan                    |
| ----------------- | ----------------------- | ----- | ----------------------------- |
| `id`              | `string`                | Ya    | Primary key                   |
| `namaKomite`      | `string`                | Ya    | Komite penyelenggara          |
| `tanggal`         | `string`                | Ya    | Tanggal kegiatan              |
| `jenisKegiatan`   | `JenisKegiatanKomite`   | Ya    | Rapat Rutin / Sidang Kredensial / Sidang Disiplin / Rapat Luar Biasa / Lainnya |
| `agenda`          | `string`                | Ya    | Agenda kegiatan               |
| `peserta`         | `string[]`              | Ya    | Array of `pegawaiId`          |
| `status`          | `StatusKegiatanKomite`  | Ya    | Dijadwalkan / Berlangsung / Selesai / Dibatalkan |
| `hasilKeputusan`  | `string`                | Ya    | Hasil keputusan               |
| `keterangan`      | `string`                | Tidak | Catatan tambahan              |

---

## 19. Entity: Hubungan Industrial

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field              | Tipe                | Wajib | Keterangan                       |
| ------------------ | ------------------- | ----- | -------------------------------- |
| `id`               | `string`            | Ya    | Primary key                      |
| `pegawaiId`        | `string`            | Ya    | FK ke Pegawai                    |
| `tanggalPengaduan` | `string`            | Ya    | Tanggal pengaduan                |
| `kategori`         | `KategoriGrievance` | Ya    | Kontrak / K3 / Gaji / Lingkungan / Perlakuan Tidak Adil / Diskriminasi / Lainnya |
| `deskripsi`        | `string`            | Ya    | Deskripsi pengaduan              |
| `status`           | `StatusGrievance`   | Ya    | Diterima / Mediasi / Selesai / Ditolak / Banding |
| `resolusi`         | `string`            | Tidak | Resolusi yang diambil            |
| `tanggalResolusi`  | `string`            | Tidak | Tanggal resolusi                 |
| `mediator`         | `string`            | Tidak | Nama mediator                    |
| `keterangan`       | `string`            | Tidak | Catatan tambahan                 |

---

## 20. Entity: PHK / Pensiun

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field                   | Tipe         | Wajib | Keterangan                          |
| ----------------------- | ------------ | ----- | ----------------------------------- |
| `id`                    | `string`     | Ya    | Primary key                         |
| `pegawaiId`             | `string`     | Ya    | FK ke Pegawai                       |
| `alasanPHK`             | `string`     | Ya    | Alasan PHK/pemberhentian            |
| `jenisPHK`              | `JenisPHK`   | Ya    | Pensiun Dini / Pensiun Normal / PHK Disiplin / Resign / Meninggal / Kontrak Berakhir |
| `tanggalPHK`            | `string`     | Ya    | Tanggal efektif PHK                 |
| `masaKerja`             | `string`     | Ya    | Total masa kerja                    |
| `pesangon`              | `number`     | Ya    | Uang pesangon (IDR)                 |
| `uangPisah`             | `number`     | Ya    | Uang pisah (IDR)                    |
| `uangPenggantianHak`    | `number`     | Ya    | Uang penggantian hak (IDR)          |
| `totalPesangon`         | `number`     | Ya    | Total kompensasi (IDR)              |
| `nomorSK`               | `string`     | Ya    | Nomor SK pemberhentian              |
| `status`                | `StatusPHK`  | Ya    | Proses / Selesai / Banding / Dibatalkan |
| `catatan`               | `string`     | Tidak | Catatan tambahan                    |

---

## 21. Entity: Credentialing

**Relasi:** `pegawaiId` -> `Pegawai.id` | Berisi `kewenangan[]` (embedded)

| Field               | Tipe                  | Wajib | Keterangan                         |
| ------------------- | --------------------- | ----- | ---------------------------------- |
| `id`                | `string`              | Ya    | Primary key                        |
| `pegawaiId`         | `string`              | Ya    | FK ke Pegawai                      |
| `jenis`             | `JenisKredensial`     | Ya    | Kredensial Awal / Re-kredensial / Peningkatan Kewenangan |
| `tanggalPengajuan`  | `string`              | Ya    | Tanggal pengajuan                  |
| `tanggalKredensial` | `string`              | Tidak | Tanggal proses kredensial          |
| `tanggalExpired`    | `string`              | Tidak | Tanggal expired kewenangan klinis  |
| `statusKredensial`  | `StatusKredensial`    | Ya    | Verifikasi Dokumen / Peer Review / Sidang Komite / Selesai / Ditolak |
| `kewenangan`        | `KewenangaKlinis[]`   | Ya    | Daftar kewenangan klinis (embedded)|
| `rekomendasiKomite` | `string`              | Tidak | Rekomendasi komite medik           |
| `disetujuiOleh`     | `string`              | Tidak | Disetujui oleh                     |
| `catatanKomite`     | `string`              | Tidak | Catatan komite                     |

### Sub-entity: KewenangaKlinis

| Field             | Tipe              | Wajib | Keterangan                   |
| ----------------- | ----------------- | ----- | ---------------------------- |
| `id`              | `string`          | Ya    | Primary key                  |
| `kode`            | `string`          | Ya    | Kode kewenangan              |
| `namaKewenangan`  | `string`          | Ya    | Nama kewenangan klinis       |
| `kategori`        | `string`          | Ya    | Kategori kewenangan          |
| `level`           | `LevelKewenangan` | Ya    | Mandiri / Dengan Supervisi / Tidak Berwenang |

---

## 22. Entity: STR (Surat Tanda Registrasi)

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field            | Tipe         | Wajib | Keterangan                          |
| ---------------- | ------------ | ----- | ----------------------------------- |
| `id`             | `string`     | Ya    | Primary key                         |
| `pegawaiId`      | `string`     | Ya    | FK ke Pegawai                       |
| `nomorSTR`       | `string`     | Ya    | Nomor STR                           |
| `jenisTenaga`    | `string`     | Ya    | Jenis tenaga kesehatan              |
| `konsil`         | `string`     | Ya    | Konsil penerbit (KKI, KTKI, dll)    |
| `tanggalTerbit`  | `string`     | Ya    | Tanggal terbit STR                  |
| `tanggalExpired` | `string`     | Ya    | Tanggal expired STR                 |
| `status`         | `StatusSTR`  | Ya    | Aktif / Akan Expired / Expired      |
| `keterangan`     | `string`     | Tidak | Catatan tambahan                    |

---

## 23. Entity: SIP / SIK

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field              | Tipe              | Wajib | Keterangan                        |
| ------------------ | ----------------- | ----- | --------------------------------- |
| `id`               | `string`          | Ya    | Primary key                       |
| `pegawaiId`        | `string`          | Ya    | FK ke Pegawai                     |
| `nomorSIP`         | `string`          | Ya    | Nomor SIP/SIK                     |
| `jenisDokumen`     | `JenisSIPDokumen` | Ya    | SIP / SIK / SIPP / SIKB          |
| `jenisPraktik`     | `string`          | Tidak | Jenis praktik                     |
| `fasyankes`        | `string`          | Ya    | Fasilitas pelayanan kesehatan     |
| `instansiPenerbit` | `string`          | Ya    | Instansi penerbit                 |
| `tanggalTerbit`    | `string`          | Ya    | Tanggal terbit                    |
| `tanggalExpired`   | `string`          | Ya    | Tanggal expired                   |
| `status`           | `StatusSIP`       | Ya    | Aktif / Akan Expired / Expired    |
| `keterangan`       | `string`          | Tidak | Catatan tambahan                  |

---

## 24. Entity: CPD (Continuing Professional Development)

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field             | Tipe              | Wajib | Keterangan                       |
| ----------------- | ----------------- | ----- | -------------------------------- |
| `id`              | `string`          | Ya    | Primary key                      |
| `pegawaiId`       | `string`          | Ya    | FK ke Pegawai                    |
| `tahun`           | `number`          | Ya    | Tahun kegiatan                   |
| `namaKegiatan`    | `string`          | Ya    | Nama kegiatan CPD                |
| `jenisKegiatan`   | `JenisKegiatanCPD`| Ya    | Seminar / Workshop / Webinar / Pelatihan / Konferensi / Simposium / Lainnya |
| `penyelenggara`   | `string`          | Ya    | Instansi penyelenggara           |
| `tanggal`         | `string`          | Ya    | Tanggal pelaksanaan              |
| `skp`             | `number`          | Ya    | Jumlah SKP (Satuan Kredit Profesi) |
| `nomorSertifikat` | `string`          | Tidak | Nomor sertifikat                 |
| `diakuiOleh`      | `string`          | Ya    | Organisasi profesi yang mengakui |
| `status`          | `StatusCPD`       | Ya    | Diverifikasi / Pending / Ditolak |

---

## 25. Entity: K3RS (Keselamatan & Kesehatan Kerja RS)

### 25a. Insiden K3RS

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field                | Tipe                   | Wajib | Keterangan                     |
| -------------------- | ---------------------- | ----- | ------------------------------ |
| `id`                 | `string`               | Ya    | Primary key                    |
| `pegawaiId`          | `string`               | Ya    | FK ke Pegawai (korban/pelapor) |
| `tanggal`            | `string`               | Ya    | Tanggal insiden                |
| `jenisInsiden`       | `string`               | Ya    | Jenis insiden                  |
| `lokasi`             | `string`               | Ya    | Lokasi kejadian                |
| `deskripsi`          | `string`               | Ya    | Deskripsi insiden              |
| `tindakanSegera`     | `string`               | Ya    | Tindakan segera yang diambil   |
| `tindakLanjut`       | `string`               | Tidak | Tindak lanjut                  |
| `keparahan`          | `KeparahanInsiden`     | Ya    | Ringan / Sedang / Berat / Fatal |
| `statusLaporan`      | `StatusLaporanInsiden` | Ya    | Dilaporkan / Investigasi / Selesai / Ditutup |
| `tanggalTindakLanjut`| `string`               | Tidak | Tanggal tindak lanjut          |
| `pelapor`            | `string`               | Tidak | Nama pelapor                   |

### 25b. Vaksinasi

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field             | Tipe              | Wajib | Keterangan                    |
| ----------------- | ----------------- | ----- | ----------------------------- |
| `id`              | `string`          | Ya    | Primary key                   |
| `pegawaiId`       | `string`          | Ya    | FK ke Pegawai                 |
| `jenisVaksin`     | `string`          | Ya    | Nama vaksin                   |
| `dosis`           | `number`          | Ya    | Dosis ke-berapa               |
| `tanggalVaksin`   | `string`          | Ya    | Tanggal vaksinasi             |
| `fasilitasVaksin` | `string`          | Ya    | Fasilitas tempat vaksinasi    |
| `tanggalBooster`  | `string`          | Tidak | Tanggal booster               |
| `status`          | `StatusVaksinasi` | Ya    | Lengkap / Sebagian / Belum    |
| `keterangan`      | `string`          | Tidak | Catatan tambahan              |

### 25c. MCU (Medical Check Up)

**Relasi:** `pegawaiId` -> `Pegawai.id`

| Field                | Tipe       | Wajib | Keterangan                         |
| -------------------- | ---------- | ----- | ---------------------------------- |
| `id`                 | `string`   | Ya    | Primary key                        |
| `pegawaiId`          | `string`   | Ya    | FK ke Pegawai                      |
| `tanggal`            | `string`   | Ya    | Tanggal MCU                        |
| `jenisMCU`           | `JenisMCU` | Ya    | Berkala / Khusus Pajanan / Awal Kerja / Purna Jabatan |
| `hasilMCU`           | `HasilMCU` | Ya    | Layak Kerja / Layak dengan Syarat / Tidak Layak |
| `catatan`            | `string`   | Tidak | Catatan hasil pemeriksaan          |
| `rekomendasiDokter`  | `string`   | Tidak | Rekomendasi dokter pemeriksa       |
| `tanggalBerikutnya`  | `string`   | Tidak | Jadwal MCU berikutnya              |
| `fasilitasMCU`       | `string`   | Ya    | Fasilitas tempat MCU               |

---

## 26. Entity: Performance Management (BSC + OKR)

### 26a. BSC Objective (Balanced Scorecard)

| Field         | Tipe                  | Wajib | Keterangan                       |
| ------------- | --------------------- | ----- | -------------------------------- |
| `id`          | `string`              | Ya    | Primary key (misal: `bsc-f01`)   |
| `perspektif`  | `BSCPerspektiveName`  | Ya    | Financial / Customer / Internal Process / Learning & Growth |
| `departmentId`| `string`              | Ya    | ID departemen (`org` = organisasi) |
| `title`       | `string`              | Ya    | Judul objective                  |
| `kpi`         | `string`              | Ya    | Nama KPI                        |
| `target`      | `number`              | Ya    | Nilai target                     |
| `actual`      | `number`              | Ya    | Nilai aktual/realisasi           |
| `unit`        | `string`              | Ya    | Satuan ukur                      |
| `weight`      | `number`              | Ya    | Bobot (%)                        |
| `period`      | `string`              | Ya    | Periode (misal: "2026")          |
| `status`      | `string`              | Ya    | On Track / At Risk / Behind / Achieved |

### 26b. Department Scorecard

| Field            | Tipe       | Wajib | Keterangan                 |
| ---------------- | ---------- | ----- | -------------------------- |
| `id`             | `string`   | Ya    | Primary key                |
| `name`           | `string`   | Ya    | Nama departemen            |
| `headName`       | `string`   | Ya    | Nama kepala departemen     |
| `score`          | `number`   | Ya    | Skor keseluruhan           |
| `financialScore` | `number`   | Ya    | Skor perspektif financial  |
| `customerScore`  | `number`   | Ya    | Skor perspektif customer   |
| `internalScore`  | `number`   | Ya    | Skor perspektif internal   |
| `learningScore`  | `number`   | Ya    | Skor perspektif L&G        |
| `trend`          | `number[]` | Ya    | Array tren skor historis   |

### 26c. OKR (Objectives & Key Results)

**OKRObjective:**

| Field          | Tipe               | Wajib | Keterangan                       |
| -------------- | ------------------ | ----- | -------------------------------- |
| `id`           | `string`           | Ya    | Primary key                      |
| `level`        | `OKRLevel`         | Ya    | Organisasi / Divisi / Tim / Individu |
| `ownerId`      | `string`           | Ya    | ID pemilik objective             |
| `ownerName`    | `string`           | Ya    | Nama pemilik                     |
| `departmentId` | `string`           | Tidak | ID departemen                    |
| `title`        | `string`           | Ya    | Judul objective                  |
| `description`  | `string`           | Ya    | Deskripsi objective              |
| `period`       | `string`           | Ya    | Periode (misal: "Q1 2026")       |
| `parentId`     | `string`           | Tidak | ID parent objective (hierarki)   |
| `keyResults`   | `OKRKeyResult[]`   | Ya    | Daftar Key Results (embedded)    |
| `status`       | `OKRStatus`        | Ya    | Draft / Aktif / Selesai / Dibatalkan |
| `bscLink`      | `BSCPerspektiveName` | Tidak | Link ke perspektif BSC         |

**OKRKeyResult:**

| Field          | Tipe              | Wajib | Keterangan                   |
| -------------- | ----------------- | ----- | ---------------------------- |
| `id`           | `string`          | Ya    | Primary key                  |
| `objectiveId`  | `string`          | Ya    | FK ke OKRObjective           |
| `title`        | `string`          | Ya    | Judul Key Result             |
| `startValue`   | `number`          | Ya    | Nilai awal (baseline)        |
| `targetValue`  | `number`          | Ya    | Nilai target                 |
| `currentValue` | `number`          | Ya    | Nilai saat ini               |
| `unit`         | `string`          | Ya    | Satuan ukur                  |
| `confidence`   | `ConfidenceLevel` | Ya    | Tinggi / Sedang / Rendah     |
| `checkIns`     | `OKRCheckIn[]`    | Ya    | Riwayat check-in (embedded)  |

**OKRCheckIn:**

| Field       | Tipe     | Wajib | Keterangan              |
| ----------- | -------- | ----- | ----------------------- |
| `id`        | `string` | Ya    | Primary key             |
| `date`      | `string` | Ya    | Tanggal check-in        |
| `value`     | `number` | Ya    | Nilai saat check-in     |
| `note`      | `string` | Ya    | Catatan check-in        |
| `createdBy` | `string` | Ya    | Dibuat oleh             |

### 26d. Performance Review

| Field          | Tipe     | Wajib | Keterangan                    |
| -------------- | -------- | ----- | ----------------------------- |
| `id`           | `string` | Ya    | Primary key                   |
| `revieweeId`   | `string` | Ya    | FK ke Pegawai (yang dinilai)  |
| `revieweeName` | `string` | Ya    | Nama yang dinilai             |
| `reviewerName` | `string` | Ya    | Nama penilai                  |
| `period`       | `string` | Ya    | Periode penilaian             |
| `bscScore`     | `number` | Ya    | Skor BSC                     |
| `okrScore`     | `number` | Ya    | Skor OKR                     |
| `finalScore`   | `number` | Ya    | Skor final (weighted)        |
| `rating`       | `string` | Ya    | A / B / C / D / E            |
| `strengths`    | `string` | Ya    | Kekuatan pegawai              |
| `improvements` | `string` | Ya    | Area perbaikan                |
| `feedback`     | `string` | Ya    | Feedback atasan               |
| `status`       | `string` | Ya    | Draft / Submitted / Diakui    |
| `createdAt`    | `string` | Ya    | Tanggal pembuatan             |

### 26e. KPI Definition (BSC-OKR Integration)

| Field          | Tipe     | Wajib | Keterangan                           |
| -------------- | -------- | ----- | ------------------------------------ |
| `kpiId`        | `string` | Ya    | Same as BSCObjective.id              |
| `definisi`     | `string` | Ya    | Penjelasan lengkap KPI               |
| `formula`      | `string` | Ya    | Cara menghitung                      |
| `frekuensi`    | `string` | Ya    | Harian / Mingguan / Bulanan / Kuartalan / Tahunan |
| `dataSource`   | `string` | Ya    | Sumber data                          |
| `pic`          | `string` | Ya    | Penanggung jawab pengukuran          |
| `linkedKRIds`  | `string[]`| Ya   | OKR Key Result IDs yang terkait      |
| `bscContrib`   | `number` | Ya    | Bobot kontribusi BSC (0-100)         |
| `okrContrib`   | `number` | Ya    | Bobot kontribusi OKR (0-100)         |

### 26f. KPI Combined Score

| Field           | Tipe     | Wajib | Keterangan                          |
| --------------- | -------- | ----- | ----------------------------------- |
| `kpiId`         | `string` | Ya    | FK ke KPIDefinition                 |
| `bscScore`      | `number` | Ya    | Skor BSC (0-100)                    |
| `okrScore`      | `number` | Ya    | Skor OKR (0-100)                    |
| `combinedScore` | `number` | Ya    | Final weighted score                |
| `delta`         | `number` | Ya    | Selisih dari target (+/-)           |
| `trend`         | `string` | Ya    | naik / turun / stabil               |

### 26g. Integration Weights

| Field              | Tipe     | Wajib | Keterangan                     |
| ------------------ | -------- | ----- | ------------------------------ |
| `bscWeight`        | `number` | Ya    | Bobot BSC dalam final score    |
| `okrWeight`        | `number` | Ya    | Bobot OKR dalam final score    |
| `financialWeight`  | `number` | Ya    | Bobot perspektif Financial     |
| `customerWeight`   | `number` | Ya    | Bobot perspektif Customer      |
| `internalWeight`   | `number` | Ya    | Bobot perspektif Internal      |
| `learningWeight`   | `number` | Ya    | Bobot perspektif L&G           |

---

## 27. Entity: App User (Autentikasi)

**Relasi:** `pegawaiId` -> `Pegawai.id` (opsional)

| Field       | Tipe       | Wajib | Keterangan                            |
| ----------- | ---------- | ----- | ------------------------------------- |
| `id`        | `string`   | Ya    | Primary key (U001, U002, dst.)        |
| `username`  | `string`   | Ya    | Username login                        |
| `password`  | `string`   | Ya    | Password (plain text - mock only)     |
| `nama`      | `string`   | Ya    | Nama lengkap user                     |
| `role`      | `UserRole` | Ya    | admin / direktur / kepala_unit / pegawai |
| `jabatan`   | `string`   | Ya    | Jabatan                               |
| `golongan`  | `string`   | Tidak | Golongan/ruang                        |
| `unitKerja` | `string`   | Tidak | Unit kerja                            |
| `pegawaiId` | `string`   | Tidak | FK ke Pegawai (untuk role non-admin)  |

**Default Users:**

| Username  | Role          | Nama                              | Jabatan                |
| --------- | ------------- | --------------------------------- | ---------------------- |
| admin     | admin         | dr. Imam Ghozali, Sp.An., M.Kes  | Direktur Rumah Sakit   |
| direktur  | direktur      | dr. Imam Ghozali, Sp.An., M.Kes  | Direktur Rumah Sakit   |
| kepala    | kepala_unit   | dr. Asih Hendrastuti, M.Kes       | Kepala Bidang Keperawatan |
| pegawai   | pegawai       | Ns. Septi Kurniasari, M.Kep, Sp.KMB | Subkoordinator     |

---

## 28. Entity: Approval Level

**Embedded di:** `CutiRecord.approvalLevels[]`

| Field     | Tipe     | Wajib | Keterangan                              |
| --------- | -------- | ----- | --------------------------------------- |
| `level`   | `number` | Ya    | Urutan level approval (1, 2, 3, ...)    |
| `jabatan` | `string` | Ya    | Jabatan yang harus approve              |
| `nama`    | `string` | Ya    | Nama pejabat yang approve               |
| `status`  | `string` | Ya    | Pending / Disetujui / Ditolak           |
| `tanggal` | `string` | Tidak | Tanggal approval                        |
| `catatan` | `string` | Tidak | Catatan dari pejabat                    |

---

## 29. Lookup / Constants

**File:** `/src/app/data/constants.ts`

### 29a. PANGKAT_GOLONGAN

Mapping golongan ke nama pangkat ASN (19 entri: I/a s.d. IV/e).

```
I/a  -> Juru Muda              III/a -> Penata Muda
I/b  -> Juru Muda Tingkat I    III/b -> Penata Muda Tingkat I
I/c  -> Juru                   III/c -> Penata
I/d  -> Juru Tingkat I         III/d -> Penata Tingkat I
II/a -> Pengatur Muda          IV/a  -> Pembina
II/b -> Pengatur Muda Tingkat I IV/b -> Pembina Tingkat I
II/c -> Pengatur               IV/c  -> Pembina Utama Muda
II/d -> Pengatur Tingkat I     IV/d  -> Pembina Utama Madya
                               IV/e  -> Pembina Utama
```

### 29b. JENIS_CUTI

Array of 18 jenis cuti lengkap dengan:
- Kuota (hari kerja / hari kalender)
- Dasar hukum (PP, UU, SE, Peraturan Internal)
- Kategori (PNS/PPPK, Honorer, Semua)
- Keterangan & warna badge

### 29c. UNIT_KERJA

Array of 82 unit kerja rumah sakit mencakup:
- Direktorat & Wakil Direktur (4 entri)
- Bagian & Bidang (10 entri)
- Sub Bagian & Sub Bidang (18 entri)
- Instalasi Klinis (20+ entri)
- Ruang Rawat Inap (15+ entri)
- Instalasi Penunjang (15+ entri)
- Unit Khusus (SMF, UTD, K3, Komite, dll)

---

## 30. State Tree (AppState)

```typescript
interface AppState {
  pegawai:          Pegawai[];            // 246 records
  cuti:             CutiRecord[];
  absensi:          AbsensiRecord[];      // Auto-generated for Mar 2026
  skp:              SKPRecord[];
  riwayatJabatan:   RiwayatJabatan[];
  kenaikanPangkat:  KenaikanPangkat[];
  disiplin:         DisiplinRecord[];     // 4 initial records
  diklat:           DiklatRecord[];       // 8 initial records
  str:              STRRecord[];
  sip:              SIPRecord[];
  credentialing:    CredentialingRecord[];
  cpd:              CPDRecord[];
  insidenK3RS:      InsidenK3RS[];
  vaksinasi:        VaksinasiRecord[];
  mcu:              MCURecord[];
  slipGaji:         SlipGaji[];
  jadwalShift:      JadwalShift[];
  bpjs:             BPJSRecord[];
  kontrak:          KontrakRecord[];
  penghargaan:      PenghargaanRecord[];
  mutasi:           MutasiRecord[];
  anggotaKomite:    AnggotaKomite[];
  kegiatanKomite:   KegiatanKomite[];
  grievance:        GrievanceRecord[];
  phk:              PHKRecord[];
  currentUser:      AppUser | null;
  isLoggedIn:       boolean;
}
```

---

## 31. CRUD Actions

Setiap entity utama memiliki 3 action standar: `ADD_*`, `UPDATE_*`, `DELETE_*`.

| Entity           | ADD Action             | UPDATE Action             | DELETE Action             |
| ---------------- | ---------------------- | ------------------------- | ------------------------- |
| Pegawai          | `ADD_PEGAWAI`          | `UPDATE_PEGAWAI`          | `DELETE_PEGAWAI`          |
| Cuti             | `ADD_CUTI`             | `UPDATE_CUTI`             | `DELETE_CUTI`             |
| Cuti (Approval)  | `APPROVE_CUTI`         | `REJECT_CUTI`             | -                         |
| Absensi          | `ADD_ABSENSI`          | `UPDATE_ABSENSI`          | `DELETE_ABSENSI`          |
| Absensi (Bulk)   | `BULK_INPUT_ABSENSI`   | -                         | -                         |
| SKP              | `ADD_SKP`              | `UPDATE_SKP`              | `DELETE_SKP`              |
| Riwayat Jabatan  | `ADD_RIWAYAT_JABATAN`  | `UPDATE_RIWAYAT_JABATAN`  | `DELETE_RIWAYAT_JABATAN`  |
| Kenaikan Pangkat  | `ADD_KP`              | `UPDATE_KP`               | `DELETE_KP`               |
| Disiplin         | `ADD_DISIPLIN`         | `UPDATE_DISIPLIN`         | `DELETE_DISIPLIN`         |
| Diklat           | `ADD_DIKLAT`           | `UPDATE_DIKLAT`           | `DELETE_DIKLAT`           |
| STR              | `ADD_STR`              | `UPDATE_STR`              | `DELETE_STR`              |
| SIP              | `ADD_SIP`              | `UPDATE_SIP`              | `DELETE_SIP`              |
| Credentialing    | `ADD_CREDENTIALING`    | `UPDATE_CREDENTIALING`    | `DELETE_CREDENTIALING`    |
| CPD              | `ADD_CPD`              | `UPDATE_CPD`              | `DELETE_CPD`              |
| Insiden K3RS     | `ADD_INSIDEN`          | `UPDATE_INSIDEN`          | `DELETE_INSIDEN`          |
| Vaksinasi        | `ADD_VAKSINASI`        | `UPDATE_VAKSINASI`        | `DELETE_VAKSINASI`        |
| MCU              | `ADD_MCU`              | `UPDATE_MCU`              | `DELETE_MCU`              |
| Slip Gaji        | `ADD_SLIP_GAJI`        | `UPDATE_SLIP_GAJI`        | `DELETE_SLIP_GAJI`        |
| Jadwal Shift     | `ADD_JADWAL`           | `UPDATE_JADWAL`           | `DELETE_JADWAL`           |
| BPJS             | `ADD_BPJS`             | `UPDATE_BPJS`             | `DELETE_BPJS`             |
| Kontrak          | `ADD_KONTRAK`          | `UPDATE_KONTRAK`          | `DELETE_KONTRAK`          |
| Penghargaan      | `ADD_PENGHARGAAN`      | `UPDATE_PENGHARGAAN`      | `DELETE_PENGHARGAAN`      |
| Mutasi           | `ADD_MUTASI`           | `UPDATE_MUTASI`           | `DELETE_MUTASI`           |
| Anggota Komite   | `ADD_ANGGOTA_KOMITE`   | `UPDATE_ANGGOTA_KOMITE`   | `DELETE_ANGGOTA_KOMITE`   |
| Kegiatan Komite  | `ADD_KEGIATAN_KOMITE`  | `UPDATE_KEGIATAN_KOMITE`  | `DELETE_KEGIATAN_KOMITE`  |
| Grievance        | `ADD_GRIEVANCE`        | `UPDATE_GRIEVANCE`        | `DELETE_GRIEVANCE`        |
| PHK              | `ADD_PHK`              | `UPDATE_PHK`              | `DELETE_PHK`              |
| Auth             | `LOGIN`                | -                         | `LOGOUT`                  |

**Total: 26 entity x 3 CRUD + 4 special actions = 82 action types**

---

## 32. Entity Relationship Diagram (Tekstual)

```
                              +-------------------+
                              |    AppUser (U)     |
                              |-------------------|
                              | pegawaiId? ----+  |
                              +----------------+--+
                                               |
                              +----------------v--+
                              |   Pegawai (P)     |  <-- MASTER ENTITY
                              |   P001 - P246     |
                              +--+--+--+--+--+---+
                                 |  |  |  |  |  |
          +----------------------+  |  |  |  |  +----------------------+
          |           +-----------+ |  |  |  +----------+             |
          v           v             v  |  v              v             v
    +-----------+ +---------+ +--------++ +---------+ +----------+ +--------+
    | Absensi   | | Cuti    | | SKP     | | Disiplin| | Diklat   | | SlipGaji|
    | (1:N)     | | (1:N)   | | (1:N)   | | (1:N)   | | (1:N)    | | (1:N)  |
    +-----------+ +---------+ +---------+ +---------+ +----------+ +--------+
                  |approvals|  |targets |
                  |embedded |  |embedded|
                  +---------+  +--------+

    +-----------+ +---------+ +---------+ +---------+ +----------+ +--------+
    | Riwayat   | |Kenaikan | | STR     | | SIP     | |Credential| | CPD    |
    | Jabatan   | |Pangkat  | | (1:N)   | | (1:N)   | |ing (1:N) | | (1:N)  |
    | (1:N)     | | (1:N)   | |         | |         | |+kewenangn| |        |
    +-----------+ +---------+ +---------+ +---------+ +----------+ +--------+

    +-----------+ +---------+ +---------+ +---------+ +----------+ +--------+
    | Insiden   | |Vaksinasi| | MCU     | | Jadwal  | | BPJS     | | Kontrak|
    | K3RS(1:N) | | (1:N)   | | (1:N)   | | Shift   | | (1:N)    | | (1:N)  |
    |           | |         | |         | | (1:N)   | |+tanggungan|        |
    +-----------+ +---------+ +---------+ +---------+ +----------+ +--------+

    +-----------+ +---------+ +---------+ +---------+ +----------+
    |Penghargaan| | Mutasi  | | Anggota | | Kegiatan| | Grievance|
    | (1:N)     | | (1:N)   | | Komite  | | Komite  | | (1:N)    |
    |           | |         | | (1:N)   | |+peserta | |          |
    +-----------+ +---------+ +---------+ +---------+ +----------+

    +-----------+
    | PHK       |
    | (1:N)     |
    +-----------+

    === PERFORMANCE MANAGEMENT (Standalone / Linked to Department) ===

    +-------------+     +------------------+     +----------------+
    | BSCObjective|<--->| KPIDefinition    |<--->| OKRKeyResult   |
    | (per dept)  |     | (linkedKRIds)    |     | (per Objective)|
    +-------------+     +------------------+     +------+---------+
                                                        |
    +------------------+     +------------------+      |
    | DeptScorecard    |     | OKRObjective     |<-----+
    | (aggregate)      |     | (hierarki parent)|
    +------------------+     +------------------+

    +-------------------+     +-------------------+
    | PerformanceReview |     | IntegrationWeights|
    | (per pegawai)     |     | (konfigurasi)     |
    +-------------------+     +-------------------+
```

---

## Catatan Teknis

1. **Persistensi:** Semua data disimpan di React state (in-memory). Hanya `currentUser` yang disimpan di `localStorage` dengan key `hr_app_user`.
2. **ID Generation:** ID baru di-generate secara manual menggunakan format prefix + counter (misal: `P247`, `A{n+1}`, `D005`).
3. **Tanggal:** Semua field tanggal menggunakan format string ISO `YYYY-MM-DD`. Tidak ada tipe `Date` native.
4. **Mata Uang:** Semua field moneter dalam IDR (Rupiah) bertipe `number`, tanpa desimal.
5. **Embedded vs Normalized:** Sub-entity seperti `ApprovalLevel`, `TargetKinerja`, `BPJSTanggungan`, `KewenangaKlinis`, `OKRKeyResult`, `OKRCheckIn`, dan `SlipGajiItem` disimpan sebagai array embedded di parent entity.
6. **Mock Data:** Data awal di-generate di file `/src/app/data/mockData.ts` (Pegawai, Cuti, SKP, Riwayat Jabatan, KP) dan `/src/app/data/mockDataRS.ts` (STR, SIP, Credentialing, K3RS, Gaji, dll). Absensi Maret 2026 di-generate secara deterministik di `AppContext.tsx`.
7. **Performance Data:** BSC Objectives, Department Scorecards, OKR Objectives, dan Performance Reviews disimpan terpisah di `/src/app/data/performanceData.ts` dan tidak masuk dalam AppState reducer.
8. **Dashboard Data:** Data untuk dashboard role-based (Financial, Clinical, Operations, GRC, dll) disimpan di `/src/app/data/hospitalDashboardData.ts` sebagai data statis untuk visualisasi.

---

*Dokumen ini di-generate dari source code `/src/app/types/index.ts`, `/src/app/context/AppContext.tsx`, dan `/src/app/data/constants.ts`.*
