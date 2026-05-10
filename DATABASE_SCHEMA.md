# HCMS Database Schema Mapping

Dokumen ini memetakan interface TypeScript dari `src/app/types/index.ts` ke skema database relasional (PostgreSQL/Supabase).

## 1. Core HR & User Management

```sql
-- Tabel Pegawai (m_pegawai)
CREATE TABLE m_pegawai (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nip VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    gelar_depan VARCHAR(50),
    gelar_belakang VARCHAR(50),
    jenis_kelamin CHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    agama VARCHAR(50),
    status_perkawinan VARCHAR(50),
    alamat TEXT,
    no_telp VARCHAR(20),
    email VARCHAR(100),
    jabatan VARCHAR(100),
    jabatan_fungsional VARCHAR(100),
    unit_kerja VARCHAR(100),
    golongan VARCHAR(10),
    pangkat VARCHAR(100),
    tmt_golongan DATE,
    tmt_jabatan DATE,
    status_pegawai VARCHAR(20) CHECK (status_pegawai IN ('PNS', 'PPPK', 'Honorer')),
    status_aktif VARCHAR(20) CHECK (status_aktif IN ('Aktif', 'Pensiun', 'Meninggal', 'Diberhentikan')),
    pendidikan_terakhir VARCHAR(50),
    jurusan VARCHAR(100),
    institusi VARCHAR(100),
    tahun_lulus INT,
    tanggal_masuk DATE,
    batas_pensiun DATE,
    masa_kerja VARCHAR(50),
    eselon VARCHAR(10),
    badge VARCHAR(50),
    foto TEXT, -- URL storage
    sertifikat TEXT[], -- Array of strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Data Keluarga (t_pegawai_keluarga)
CREATE TABLE t_pegawai_keluarga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pegawai_id UUID REFERENCES m_pegawai(id) ON DELETE CASCADE,
    hubungan VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    jenis_kelamin CHAR(1),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    nomor_ktp VARCHAR(20),
    agama VARCHAR(50),
    pendidikan VARCHAR(50),
    pekerjaan VARCHAR(100),
    status_hidup VARCHAR(20),
    tunjangan BOOLEAN DEFAULT false,
    keterangan TEXT
);

-- Tabel User (sys_users)
CREATE TABLE sys_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pegawai_id UUID REFERENCES m_pegawai(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    excluded_modules TEXT[],
    last_login TIMESTAMP WITH TIME ZONE
);
```

## 2. Kehadiran & Cuti

```sql
-- Tabel Absensi (t_absensi)
CREATE TABLE t_absensi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pegawai_id UUID REFERENCES m_pegawai(id),
    tanggal DATE NOT NULL,
    jam_masuk TIME,
    jam_keluar TIME,
    status VARCHAR(20) NOT NULL, -- Hadir, Alpha, Sakit, etc.
    keterangan TEXT,
    diinput_oleh UUID REFERENCES sys_users(id),
    UNIQUE(pegawai_id, tanggal)
);

-- Tabel Cuti (t_cuti)
CREATE TABLE t_cuti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pegawai_id UUID REFERENCES m_pegawai(id),
    jenis_cuti VARCHAR(100) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    jumlah_hari INT NOT NULL,
    alasan TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    disetujui_oleh VARCHAR(255),
    tanggal_pengajuan DATE DEFAULT CURRENT_DATE,
    tanggal_disetujui DATE,
    keterangan TEXT
);

-- Tabel Approval Cuti (t_cuti_approval)
CREATE TABLE t_cuti_approval (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuti_id UUID REFERENCES t_cuti(id) ON DELETE CASCADE,
    level INT NOT NULL,
    jabatan VARCHAR(100),
    nama VARCHAR(255),
    status VARCHAR(20),
    tanggal TIMESTAMP WITH TIME ZONE,
    catatan TEXT
);
```

## 3. Kompetensi Medis (STR/SIP/Kredensial)

```sql
-- Tabel STR (t_pegawai_str)
CREATE TABLE t_pegawai_str (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pegawai_id UUID REFERENCES m_pegawai(id),
    nomor_str VARCHAR(100) UNIQUE NOT NULL,
    jenis_tenaga VARCHAR(100),
    konsil VARCHAR(100),
    tanggal_terbit DATE,
    tanggal_expired DATE,
    status VARCHAR(20),
    keterangan TEXT
);

-- Tabel SIP (t_pegawai_sip)
CREATE TABLE t_pegawai_sip (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pegawai_id UUID REFERENCES m_pegawai(id),
    nomor_sip VARCHAR(100) UNIQUE NOT NULL,
    jenis_dokumen VARCHAR(20),
    jenis_praktik VARCHAR(100),
    fasyankes VARCHAR(255),
    instansi_penerbit VARCHAR(255),
    tanggal_terbit DATE,
    tanggal_expired DATE,
    status VARCHAR(20)
);
```

## 4. Performance Management (BSC/OKR/SKP)

```sql
-- Tabel SKP Header (t_skp_header)
CREATE TABLE t_skp_header (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pegawai_id UUID REFERENCES m_pegawai(id),
    tahun INT NOT NULL,
    semester INT CHECK (semester IN (1, 2)),
    nilai_akhir DECIMAL(5,2),
    predikat VARCHAR(50),
    status VARCHAR(20),
    catatan_atasan TEXT,
    disetujui_oleh VARCHAR(255),
    tanggal_disetujui DATE
);

-- Tabel SKP Detail / Target Kinerja (t_skp_detail)
CREATE TABLE t_skp_detail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skp_id UUID REFERENCES t_skp_header(id) ON DELETE CASCADE,
    uraian_kegiatan TEXT NOT NULL,
    target DECIMAL(15,2),
    satuan VARCHAR(50),
    realisasi DECIMAL(15,2),
    nilai_capaian DECIMAL(5,2),
    bobot DECIMAL(5,2)
);
```

## 5. Penggajian (Payroll)

```sql
-- Tabel Slip Gaji (t_gaji_header)
CREATE TABLE t_gaji_header (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pegawai_id UUID REFERENCES m_pegawai(id),
    bulan INT,
    tahun INT,
    gaji_pokok DECIMAL(15,2),
    total_bruto DECIMAL(15,2),
    total_potongan DECIMAL(15,2),
    total_netto DECIMAL(15,2),
    status VARCHAR(20),
    tanggal_dibayar DATE
);

-- Tabel Item Gaji (t_gaji_detail)
CREATE TABLE t_gaji_detail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gaji_id UUID REFERENCES t_gaji_header(id) ON DELETE CASCADE,
    jenis VARCHAR(10) CHECK (jenis IN ('Penerimaan', 'Potongan')),
    uraian VARCHAR(255),
    jumlah DECIMAL(15,2)
);
```

---

### Catatan Integrasi Supabase:
1.  **Auth**: Menggunakan `auth.users` bawaan Supabase yang dihubungkan ke `sys_users` via trigger.
2.  **Storage**: Foto pegawai dan Dokumen (`fileUrl`) disimpan di Supabase Storage bucket `pegawai-docs`.
3.  **Realtime**: Tabel `t_absensi` dan `t_cuti` akan diaktifkan fitur Realtime untuk notifikasi instan.
4.  **Policy (RLS)**: 
    *   Pegawai hanya bisa melihat data milik sendiri (`pegawai_id = auth.uid()`).
    *   Admin dapat melihat semua data.
    *   Kepala Unit dapat melihat data pegawai dalam `unit_kerja` yang sama.
