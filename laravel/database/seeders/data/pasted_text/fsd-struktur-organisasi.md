# Functional Specification Document (FSD)
# Modul: Struktur Organisasi

> **Aplikasi:** HCMS (Human Capital Management System)
> **Versi Dokumen:** 1.0
> **Tanggal:** 16 Maret 2026
> **Status:** Implemented
> **File Implementasi:** `/src/app/pages/OrganisasiTree.tsx`
> **Rute Akses:** `/organisasi`
> **Menu Navigasi:** DATA PEGAWAI > Struktur Organisasi
> **Icon:** `Network` (lucide-react)

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Tujuan & Ruang Lingkup](#2-tujuan--ruang-lingkup)
3. [Dasar Hukum & Regulasi](#3-dasar-hukum--regulasi)
4. [Aktor & Hak Akses](#4-aktor--hak-akses)
5. [Data Model](#5-data-model)
6. [Arsitektur Komponen](#6-arsitektur-komponen)
7. [Fitur Fungsional](#7-fitur-fungsional)
8. [User Interface Specification](#8-user-interface-specification)
9. [Business Rules & Validation](#9-business-rules--validation)
10. [Integrasi dengan Modul Lain](#10-integrasi-dengan-modul-lain)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Test Scenarios](#12-test-scenarios)
13. [Limitasi & Catatan Teknis](#13-limitasi--catatan-teknis)
14. [Rencana Pengembangan (Roadmap)](#14-rencana-pengembangan-roadmap)

---

## 1. Ringkasan Eksekutif

Modul **Struktur Organisasi** menyediakan visualisasi interaktif pohon organisasi (organizational chart) rumah sakit dalam format tree chart yang dapat di-zoom, di-pan, dan di-collapse. Modul ini menampilkan hierarki jabatan struktural dari level Rumah Sakit (root) hingga unit/instalasi terkecil, lengkap dengan informasi pejabat yang menjabat, jumlah pegawai per unit, dan indikasi jabatan lowong (vacant). Pengguna dapat menambah node baru secara dinamis dan melihat detail setiap node beserta daftar staf yang terdaftar di unit kerja tersebut.

### Fitur Utama (Ringkasan)
- Interactive org chart dengan zoom, pan, collapse/expand
- 5 level hierarki: Hospital → Eselon II → Eselon III → Eselon IV → Unit/Instalasi
- Penambahan node baru secara dinamis (CRUD: Create only, sesi berjalan)
- Detail panel dengan informasi pejabat & daftar staf unit
- Fullscreen mode
- Legenda warna otomatis
- Statistik pegawai (PNS/PPPK/Honorer)
- Linking otomatis ke data master Pegawai via `pegawaiId` dan `unitKerja`

---

## 2. Tujuan & Ruang Lingkup

### 2.1 Tujuan
| No | Tujuan | Keterangan |
|----|--------|------------|
| T1 | Visualisasi hierarki organisasi | Menampilkan struktur jabatan struktural RS secara visual |
| T2 | Identifikasi pejabat | Menunjukkan siapa yang menjabat di setiap posisi |
| T3 | Identifikasi jabatan lowong | Memudahkan HR mengidentifikasi posisi yang belum terisi |
| T4 | Analisis distribusi SDM | Menampilkan jumlah pegawai per unit kerja |
| T5 | Perencanaan organisasi | Mendukung penambahan unit/jabatan baru |

### 2.2 Ruang Lingkup (In-Scope)
- Visualisasi tree chart interaktif (zoom, pan, collapse)
- Penampilan data pejabat struktural dari master Pegawai
- Penghitungan jumlah pegawai per node berdasarkan `unitKerja`
- Penambahan node baru via modal form
- Detail panel dengan informasi lengkap pejabat dan staf
- Fullscreen mode untuk presentasi
- Legenda warna berdasarkan tipe/eselon node
- Statistik ringkasan PNS/PPPK/Honorer

### 2.3 Di Luar Ruang Lingkup (Out-of-Scope)
- Edit & Delete node yang sudah ada (hanya Create)
- Drag-and-drop reordering node
- Export org chart ke PDF/PNG
- Riwayat perubahan organisasi (audit trail)
- Integrasi dengan SK penetapan organisasi
- Sinkronisasi otomatis perubahan jabatan pegawai ke node tree

---

## 3. Dasar Hukum & Regulasi

| No | Regulasi | Keterangan |
|----|----------|------------|
| 1 | Perda Provinsi Lampung tentang Struktur Organisasi RSUD | Dasar pembentukan unit organisasi |
| 2 | PP No. 18 Tahun 2016 tentang Perangkat Daerah | Struktur dan tata kerja OPD |
| 3 | Permenkes No. 3 Tahun 2020 tentang Klasifikasi RS | Standar organisasi RS kelas A/B/C |
| 4 | PP No. 11 Tahun 2017 tentang Manajemen PNS | Jabatan struktural, fungsional, dan pelaksana |
| 5 | Permenpan-RB tentang Jabatan Fungsional | Penataan jabatan fungsional kesehatan |

---

## 4. Aktor & Hak Akses

| Role | Lihat Tree | Tambah Node | Lihat Detail | Fullscreen |
|------|:----------:|:-----------:|:------------:|:----------:|
| `admin` | Ya | Ya | Ya | Ya |
| `direktur` | Ya | Ya | Ya | Ya |
| `kepala_unit` | Ya | Ya | Ya | Ya |
| `pegawai` | Ya | Ya | Ya | Ya |

> **Catatan:** Saat ini semua role yang sudah login dapat mengakses semua fitur modul ini. Tidak ada pembatasan role-based pada level fungsional karena modul bersifat read-heavy (visualisasi), dan penambahan node bersifat sementara (tidak tersimpan secara persisten antar sesi).

---

## 5. Data Model

### 5.1 OrgNode (Internal / Non-Persisted)

Data model utama modul ini **tidak masuk** dalam global AppState. Struktur pohon organisasi didefinisikan secara hardcoded di `ORG_DATA` dan dimutasi secara lokal via `useState` di halaman `OrganisasiTree`.

```typescript
interface OrgNode {
  id: string;           // Unique identifier node
  title: string;        // Nama jabatan/unit (ditampilkan di kartu)
  subtitle?: string;    // Keterangan tambahan (umumnya level eselon)
  type: OrgNodeType;    // Tipe node yang menentukan warna & styling
  pegawaiId?: string;   // FK ke Pegawai.id (pejabat yang menjabat)
  unitKerja?: string;   // Nama unit kerja (untuk lookup staf)
  eselon?: string;      // Level eselon jabatan struktural
  isVacant?: boolean;   // Apakah jabatan sedang lowong/kosong
  children?: OrgNode[]; // Array node anak (rekursif)
}
```

### 5.2 Enum: OrgNodeType

| Value | Keterangan | Warna Card | Connector Color |
|-------|------------|------------|-----------------|
| `'hospital'` | Node root (Rumah Sakit) | Navy `#1e3a5f` | `#3b82f6` (blue) |
| `'eselon2'` | Jabatan Eselon II (Direktur) | Blue-700 | `#2563eb` |
| `'eselon3'` | Jabatan Eselon III (Wakil Direktur) | Sky-600 | `#0284c7` |
| `'eselon4'` | Jabatan Eselon IV (Kepala Bidang/Bagian) | Teal-600 | `#0d9488` |
| `'unit'` | Unit/Instalasi/Komite (Non-Eselon) | White | `#94a3b8` (slate) |

### 5.3 Relasi ke Entity Lain

```
OrgNode.pegawaiId ──FK──> Pegawai.id     (1:1, opsional)
OrgNode.unitKerja ──Lookup──> Pegawai[].unitKerja  (1:N, filter staf)
```

- **`pegawaiId`**: Menghubungkan node ke satu pegawai yang menjabat sebagai pejabat struktural. Digunakan untuk menampilkan nama, NIP, golongan, dan status pegawai di detail panel.
- **`unitKerja`**: Digunakan untuk mem-filter semua pegawai dari master data yang memiliki `unitKerja` yang sama. Menghasilkan daftar staf di detail panel dan jumlah pegawai di footer kartu.

### 5.4 Struktur Pohon Default (ORG_DATA)

```
Rumah Sakit (rsud) [hospital]
  |
  +-- Direktur (direktur) [eselon2] → P001
       |
       +-- Wakil Dir. Pend, Peng. SDM & Hukum (wadir-pend) [eselon3] → P002
       |    +-- Bidang Hukum (bid-hukum) [eselon4] → P008
       |    +-- Bidang Pengembangan SDM (bid-sdm) [eselon4] → P009
       |    +-- SPI (spi) [unit] → P029
       |
       +-- Wakil Dir. Umum dan Keuangan (wadir-umum) [eselon3] → P003
       |    +-- Bagian Keuangan (bag-keuangan) [eselon4] → P005
       |    +-- Bagian Perencanaan & Anggaran (bag-perenc) [eselon4] → P010
       |    +-- Bagian Umum (bag-umum) [eselon4] → P011
       |
       +-- Wakil Dir. Kep, Yanmed & Penunjang (wadir-kep) [eselon3] → P004
            +-- Bidang Keperawatan (bid-kep) [eselon4] → P012
            +-- Bidang Pelayanan Medik (bid-yanmed) [eselon4] → P006
            +-- Bidang Penunjang Medik (bid-penunjang) [eselon4] → P007
            +-- Komite Medik (komite-medik) [unit] → P030
            +-- Komite Keperawatan (komite-kep) [unit] → P031
```

**Total Node Default:** 16 node (1 hospital + 1 eselon2 + 3 eselon3 + 8 eselon4 + 3 unit)
**Mapping Pegawai:** 14 posisi terisi (P001-P012, P029-P031), 0 lowong

### 5.5 Eselon Options (Dropdown)

```
'Eselon II/a', 'Eselon II/b',
'Eselon III/a', 'Eselon III/b',
'Eselon IV/a', 'Eselon IV/b'
```

### 5.6 Unit Kerja (Referensi)

Modul ini menggunakan `UNIT_KERJA[]` dari `/src/app/data/constants.ts` (82 entri) sebagai referensi pencocokan data pegawai. Field `OrgNode.unitKerja` harus sesuai persis (exact match) dengan salah satu nilai di `Pegawai.unitKerja` agar staf list dan jumlah pegawai terhitung dengan benar.

---

## 6. Arsitektur Komponen

### 6.1 Component Tree

```
OrganisasiTree (Page Component)
  |
  +-- [Header Bar]
  |     +-- Judul & Deskripsi
  |     +-- Stat Pills (PNS / PPPK / Honorer)
  |     +-- Action Buttons (Buka Semua, Tutup Semua, Tambah Node, Fullscreen)
  |
  +-- [Legend Bar]
  |     +-- Color Legend (Eselon II/III/IV, Non-Eselon, Lowong)
  |
  +-- [Main Area]
       |
       +-- [Tree Canvas] (pannable, zoomable)
       |     +-- Zoom Controls (ZoomIn, ZoomOut, Reset, % display)
       |     +-- Hint Bar
       |     +-- DragCtx.Provider
       |          +-- AddCtx.Provider
       |               +-- TreeNode (rekursif)
       |                    +-- NodeCard
       |                    |     +-- Vacant Badge (kondisional)
       |                    |     +-- Type Badge
       |                    |     +-- Title
       |                    |     +-- Pejabat Name
       |                    |     +-- Footer (staff count + collapse toggle)
       |                    +-- Add Child Button (hover)
       |                    +-- Connector Lines (vertikal + horizontal)
       |                    +-- [children] (rekursif TreeNode)
       |
       +-- [Detail Panel] (kondisional, saat node dipilih)
       |     +-- Colored Header (sesuai tipe node)
       |     +-- Pejabat Struktural Card
       |     +-- Staff List (scrollable)
       |
       +-- [AddNodeModal] (kondisional, saat tambah node)
             +-- Parent Node Selector
             +-- Tipe Node Grid (4 pilihan)
             +-- Nama Jabatan/Unit Input
             +-- Subtitle & Eselon (kondisional)
             +-- Unit Kerja Input
             +-- Pejabat Dropdown
             +-- Jabatan Lowong Checkbox
```

### 6.2 Context Providers

| Context | Tipe | Tujuan |
|---------|------|--------|
| `DragCtx` | `React.MutableRefObject<boolean>` | Mencegah `onClick` pada NodeCard saat user sedang melakukan drag/pan pada canvas |
| `AddCtx` | `(parentId: string) => void` | Memungkinkan tombol "+" pada setiap node memanggil modal tambah tanpa prop drilling |

### 6.3 Internal Components

| Komponen | File | Tipe | Keterangan |
|----------|------|------|------------|
| `OrganisasiTree` | OrganisasiTree.tsx | Page | Komponen utama (default export) |
| `TreeNode` | OrganisasiTree.tsx | Internal | Komponen rekursif untuk render hierarki |
| `NodeCard` | OrganisasiTree.tsx | Internal | Kartu visual untuk satu node |
| `DetailPanel` | OrganisasiTree.tsx | Internal | Panel detail di sisi kanan |
| `AddNodeModal` | OrganisasiTree.tsx | Internal | Modal form tambah node baru |

### 6.4 Helper Functions

| Fungsi | Tujuan | Input | Output |
|--------|--------|-------|--------|
| `addNodeToTree(tree, parentId, newNode)` | Menambahkan node anak ke parent secara immutable | `OrgNode`, `string`, `OrgNode` | `OrgNode` (tree baru) |
| `getAllNodes(tree)` | Mengumpulkan semua node dalam flat array | `OrgNode` | `OrgNode[]` |
| `countNodePegawai(node, allPegawai)` | Menghitung jumlah pegawai di bawah suatu node (rekursif) | `OrgNode`, `Pegawai[]` | `number` |

---

## 7. Fitur Fungsional

### 7.1 F01 — Visualisasi Pohon Organisasi

**Deskripsi:** Menampilkan struktur organisasi dalam format tree chart hierarkis dengan garis penghubung (connector lines) antar level.

**Spesifikasi:**

| Aspek | Detail |
|-------|--------|
| Layout | Top-down tree, center-aligned |
| Connector Lines | Garis vertikal dari parent + garis horizontal antar siblings |
| Warna Connector | Sesuai tipe parent node (lihat tabel NODE_STYLES) |
| Jarak Vertikal | 24px antara level |
| Padding Horizontal | 12px antar sibling |
| Card Width | 190px (fixed) |
| Card Min Height | 80px |

**Komponen Visual per Node Card:**

```
+------------------------------------------+
| [Vacant Badge] (merah, -top-2 -right-2)  |  ← Hanya jika isVacant = true
+------------------------------------------+
| [Type Badge] (misal: "Eselon III/a")     |
| [Title] (nama jabatan/unit)              |
| [Pejabat Name] (jika ada pegawaiId)      |
| -- atau --                               |
| [— Jabatan Lowong —] (jika isVacant)     |
+------------------------------------------+
| [Users Icon] N pegawai    [▼ Collapse]   |
+------------------------------------------+
```

### 7.2 F02 — Zoom & Pan Canvas

**Deskripsi:** Pengguna dapat memperbesar/memperkecil dan menggeser pohon organisasi secara bebas menggunakan mouse atau kontrol tombol.

| Interaksi | Aksi |
|-----------|------|
| Mouse wheel scroll | Zoom in/out (increment: deltaY * 0.001) |
| Mouse drag (left button) | Pan canvas (geser posisi) |
| Tombol ZoomIn (+) | Zoom in sebesar 0.15 |
| Tombol ZoomOut (-) | Zoom out sebesar 0.15 |
| Tombol Reset | Kembalikan ke scale 0.85, translate (0,0) |

**Batasan:**
- Minimum zoom: 30% (`scale = 0.3`)
- Maximum zoom: 200% (`scale = 2.0`)
- Default zoom: 85% (`scale = 0.85`)
- Transform origin: `center top`

**Anti-Click saat Drag:**
- Threshold: pergerakan mouse > 5px baru dianggap drag
- Saat `hasDraggedRef.current = true`, `NodeCard.onClick` tidak akan memicu select

### 7.3 F03 — Collapse / Expand Node

**Deskripsi:** Setiap node yang memiliki children dapat di-collapse (tutup) atau expand (buka) secara individual atau massal.

| Aksi | Trigger | Efek |
|------|---------|------|
| Toggle individual | Klik tombol ▼/► di footer card | Toggle visibility children satu node |
| Buka Semua | Klik "Buka Semua" di header | Clear semua collapsed IDs |
| Tutup Semua | Klik "Tutup Semua" di header | Collect semua node ID yang punya children, masukkan ke collapsed set |

**State:** `collapsedIds: Set<string>` — set of node IDs yang sedang di-collapse.

### 7.4 F04 — Select Node & Detail Panel

**Deskripsi:** Klik pada node card akan membuka panel detail di sisi kanan layar. Klik node yang sama akan menutup panel (toggle).

**Detail Panel menampilkan:**

| Bagian | Konten |
|--------|--------|
| Header | Background warna sesuai tipe node, subtitle/eselon, judul, badge eselon |
| Pejabat Struktural | Avatar inisial, nama lengkap (dengan gelar), NIP, golongan, status pegawai |
| Jabatan Lowong | Alert box merah jika `isVacant = true` dan tidak ada pejabat |
| Daftar Staf | Semua pegawai yang `unitKerja` cocok, dikecualikan pejabat itu sendiri. Ditampilkan: avatar inisial, nama, jabatan, golongan, status |

**Panel Dimension:** Width 280px, full height, scrollable content area.

### 7.5 F05 — Tambah Node Baru

**Deskripsi:** Menambahkan node baru ke dalam pohon organisasi secara dinamis melalui modal form.

**Trigger:**
1. Tombol "Tambah Node" di header (parent default: `rsud`)
2. Tombol "+" yang muncul saat hover di bawah setiap node non-unit (parent: node yang di-hover)

**Form Fields:**

| Field | Tipe Input | Wajib | Validasi | Default |
|-------|------------|:-----:|----------|---------|
| Node Induk | Dropdown (dari semua node yang `type !== 'unit'`) | Ya | Harus dipilih | Node yang di-hover atau `rsud` |
| Tipe Node | Grid 4 tombol (eselon2/3/4/unit) | Ya | Salah satu harus dipilih | `unit` |
| Nama Jabatan/Unit | Text input | Ya | Tidak boleh kosong | - |
| Subtitle | Text input | Tidak | - | Auto-fill berdasarkan tipe |
| Eselon | Dropdown (6 opsi) | Tidak | - | Auto-fill berdasarkan tipe |
| Unit Kerja | Text input | Tidak | - | - |
| Pejabat/Penanggung Jawab | Dropdown (semua pegawai) | Tidak | - | Tidak ada / Lowong |
| Jabatan Lowong | Checkbox | Tidak | Hanya tampil jika `!pegawaiId && type !== 'unit'` | false |

**Auto-fill Subtitle & Eselon saat tipe berubah:**
- `eselon2` → Subtitle: "Eselon II/b", Eselon: "Eselon II/b"
- `eselon3` → Subtitle: "Eselon III/a", Eselon: "Eselon III/a"
- `eselon4` → Subtitle: "Eselon IV/a", Eselon: "Eselon IV/a"
- `unit` → Subtitle: "", Eselon: ""

**ID Generation:** `node-${Date.now()}`

**Post-submit:**
1. Node baru ditambahkan ke tree via `addNodeToTree()`
2. Parent node auto-expand (dihapus dari `collapsedIds`)
3. Modal ditutup

### 7.6 F06 — Statistik Pegawai

**Deskripsi:** Menampilkan ringkasan jumlah pegawai berdasarkan status kepegawaian di header halaman.

| Pill | Filter | Warna |
|------|--------|-------|
| PNS: N | `pegawai.filter(p => p.statusPegawai === 'PNS').length` | Green |
| PPPK: N | `pegawai.filter(p => p.statusPegawai === 'PPPK').length` | Amber |
| Honorer: N | `pegawai.filter(p => p.statusPegawai === 'Honorer').length` | Gray (hanya tampil jika > 0) |

### 7.7 F07 — Fullscreen Mode

**Deskripsi:** Toggle antara tampilan normal (embedded dalam layout) dan fullscreen (fixed overlay).

| State | CSS | Trigger |
|-------|-----|---------|
| Normal | Container mengikuti layout | Klik Maximize icon |
| Fullscreen | `fixed inset-0 z-50 bg-white` | Klik Minimize icon |

### 7.8 F08 — Legenda Warna

**Deskripsi:** Bar horizontal di bawah header yang menjelaskan arti warna setiap tipe node.

| Warna | Label |
|-------|-------|
| Blue-700 | Direktur (Eselon II/b) |
| Sky-600 | Wakil Direktur (Eselon II/b) |
| Teal-600 | Kepala Bidang / Bagian (Eselon III) |
| Gray-300 | Komite / Organ Non-Eselon |
| Red-500 (dot) | Jabatan Lowong |

### 7.9 F09 — Penghitungan Jumlah Pegawai per Node

**Deskripsi:** Setiap node card menampilkan jumlah pegawai di footer.

**Algoritma `countNodePegawai(node, allPegawai)`:**

```
IF node.type === 'unit':
    RETURN count of pegawai WHERE pegawai.unitKerja === node.unitKerja

ELSE (structural node):
    direct = node.unitKerja ?
        count of pegawai WHERE pegawai.unitKerja === node.unitKerja
        : (node.pegawaiId ? 1 : 0)
    fromChildren = SUM(countNodePegawai(child) for each child)
    RETURN (node.pegawaiId ? max(direct, 1) : 0) + fromChildren
```

**Catatan:** Untuk node struktural (eselon2/3/4), jumlah pegawai bersifat **rekursif** — menjumlahkan pegawai langsung plus semua children. Untuk node `unit`, hanya menghitung pegawai yang `unitKerja`-nya cocok.

---

## 8. User Interface Specification

### 8.1 Layout Keseluruhan

```
+------------------------------------------------------------------+
| [Header Bar]                                                      |
|  Struktur Organisasi        PNS: N | PPPK: N | Honorer: N       |
|  Berdasarkan Perda...       [Buka] [Tutup] [+Tambah] [FS]       |
+------------------------------------------------------------------+
| [Legend Bar]                                                      |
|  Legenda: ■ Direktur  ■ Wakil Dir  ■ Kep.Bid  ■ Non-Es  ● Low  |
+------------------------------------------------------------------+
|                                                    |              |
|            [Tree Canvas]                          | [Detail      |
|                                                    |  Panel]      |
|                 ┌─────────┐                       | (280px)      |
|                 │ RS ROOT │                       |              |
|                 └────┬────┘                       |  Pejabat:    |
|                      │                             |  dr. Xxx     |
|                 ┌────┴────┐                       |              |
|                 │Direktur │                       |  Staf:       |
|                 └────┬────┘                       |  - Pegawai1  |
|              ┌───────┼───────┐                    |  - Pegawai2  |
|         ┌────┴┐  ┌───┴───┐ ┌─┴────┐             |  ...         |
|         │WaDir│  │ WaDir │ │WaDir │              |              |
|         └──┬──┘  └───┬───┘ └──┬───┘              |              |
|            │         │        │                    |              |
|         ┌──┴──┐   ┌──┴──┐ ┌──┴──┐               |              |
|         │ Bid │   │ Bag │ │ Bid │               |              |
|         └─────┘   └─────┘ └─────┘               |              |
|                                                    |              |
|  [Zoom: +/-/Reset 85%]              [Hint bar]   |              |
+------------------------------------------------------------------+
```

### 8.2 Node Card Styles

| Tipe | Background | Border | Text | Badge | Footer |
|------|-----------|--------|------|-------|--------|
| hospital | `#1e3a5f` | `#0f2744` | White | Blue-500/30 | `bg-black/10` |
| eselon2 | Blue-700 | Blue-800 | White | Yellow-400/20 | `bg-black/10` |
| eselon3 | Sky-600 | Sky-700 | White | White/20 | `bg-black/10` |
| eselon4 | Teal-600 | Teal-700 | White | White/20 | `bg-black/10` |
| unit | White | Gray-200 | Gray-800 | Gray-100 | `bg-gray-50` |

### 8.3 Selected State

- Card: `ring-2 ring-white ring-offset-2 ring-offset-transparent scale-105`
- Transitions: `transition-all duration-200`

### 8.4 Canvas Background

- Color: `#f8fafc` (slate-50)
- Pattern: Radial gradient dots (`#cbd5e1`, 1px, 24px grid)
- Cursor: `grab` (normal) / `grabbing` (saat drag)

### 8.5 Responsive Behavior

| Breakpoint | Header | Tree | Detail Panel |
|------------|--------|------|--------------|
| Mobile (<768px) | Stacked (flex-col) | Horizontal scroll via pan | Overlay (karena canvas sudah sempit) |
| Desktop (>=768px) | Horizontal (flex-row) | Free pan/zoom | Side panel 280px |

### 8.6 Modal (AddNodeModal)

| Aspek | Spesifikasi |
|-------|-------------|
| Overlay | `rgba(15,27,68,0.45)` + `backdrop-blur(4px)` |
| Modal width | `max-w-lg` (32rem / 512px) |
| Max height | `90vh` |
| Border radius | `rounded-2xl` |
| Header icon | `GitBranch` (lucide-react) di kotak biru |

---

## 9. Business Rules & Validation

### 9.1 Validasi Tambah Node

| Rule | Field | Kondisi | Pesan Error |
|------|-------|---------|-------------|
| BR-01 | Nama Jabatan/Unit | `title.trim() === ''` | "Nama jabatan/unit wajib diisi" |
| BR-02 | Node Induk | `parentId === ''` | "Node induk wajib dipilih" |
| BR-03 | Node Induk dropdown | Hanya node dengan `type !== 'unit'` | Unit tidak bisa jadi parent |

### 9.2 Business Rules Umum

| Rule | Deskripsi |
|------|-----------|
| BR-04 | Node tipe `hospital` tidak tersedia sebagai pilihan tipe saat tambah node (hanya eselon2/3/4/unit) |
| BR-05 | Jika `pegawaiId` dipilih, checkbox `isVacant` otomatis `false` |
| BR-06 | Checkbox `isVacant` hanya tampil jika `!pegawaiId && type !== 'unit'` |
| BR-07 | Badge "Lowong" (merah) hanya tampil pada node dengan `isVacant = true` |
| BR-08 | Teks "— Jabatan Lowong —" hanya tampil jika `isVacant && type !== 'unit' && !pejabat` |
| BR-09 | Untuk node `unit`, staff count = direct count (tidak rekursif) |
| BR-10 | Untuk node struktural, staff count = rekursif ke semua children |
| BR-11 | Pill "Honorer" hanya tampil jika `totalHonorer > 0` |
| BR-12 | Klik pada node yang sudah selected akan menutup detail panel (toggle) |
| BR-13 | Penambahan node otomatis meng-expand parent (hapus dari collapsedIds) |
| BR-14 | Tombol "+" untuk tambah child hanya muncul saat hover dan hanya pada node non-unit |

### 9.3 Pencocokan Data Pegawai

| Rule | Deskripsi |
|------|-----------|
| BR-15 | `OrgNode.pegawaiId` harus cocok persis dengan `Pegawai.id` |
| BR-16 | `OrgNode.unitKerja` harus cocok persis (case-sensitive, string exact match) dengan `Pegawai.unitKerja` |
| BR-17 | Di detail panel, daftar staf dikecualikan `pegawaiId` node itu sendiri (`p.id !== node.pegawaiId`) |

---

## 10. Integrasi dengan Modul Lain

### 10.1 Dependensi Data

| Modul Sumber | Data yang Digunakan | Cara Akses |
|-------------|---------------------|------------|
| **Data Pegawai** (`/pegawai`) | `pegawai[]` dari AppContext | `useAppContext()` → `pegawai` |
| **Constants** (`constants.ts`) | `UNIT_KERJA[]` | Referensi untuk validasi kecocokan unitKerja |

### 10.2 Alur Data

```
AppContext.pegawai (246 records)
       |
       v
OrganisasiTree.tsx
       |
       +---> countNodePegawai() → Jumlah staf per node
       +---> pegawai.find(p => p.id === node.pegawaiId) → Info pejabat
       +---> pegawai.filter(p => p.unitKerja === node.unitKerja) → Daftar staf
       +---> pegawai.filter(p => p.statusPegawai === 'X').length → Stat pills
```

### 10.3 Modul yang Terkait (Tidak Langsung)

| Modul | Relasi | Keterangan |
|-------|--------|------------|
| Mutasi & Rotasi (`/mutasi`) | Saat pegawai dimutasi, `unitKerja` berubah → jumlah staf di node berubah |
| Kenaikan Pangkat (`/kenaikan-pangkat`) | Saat pegawai naik pangkat/jabatan, mungkin pindah unit |
| Riwayat Jabatan (`/riwayat-jabatan`) | Histori penempatan jabatan struktural |
| PHK / Pensiun | Saat pegawai pensiun, node bisa menjadi lowong |

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Aspek | Target | Implementasi Saat Ini |
|-------|--------|----------------------|
| Initial render | < 500ms | Direct import (bukan lazy) karena file besar |
| Zoom/Pan smoothness | 60 FPS | CSS transform dengan `transition: none` saat panning |
| Tree expansion | < 100ms | React reconciliation dengan `Set<string>` untuk collapsed state |
| Memory usage | < 50MB | 16 node default + max ~50 tambahan per sesi |

### 11.2 Usability

| Aspek | Detail |
|-------|--------|
| Mouse interaction | Drag to pan, scroll to zoom, click to select |
| Touch support | Tidak diimplementasikan secara eksplisit |
| Keyboard navigation | Tidak diimplementasikan |
| Color accessibility | Kontras tinggi untuk teks putih di background gelap |
| Hint text | "Scroll untuk zoom - Drag untuk geser - Hover node → klik + untuk tambah anak" |

### 11.3 Persistensi

| Aspek | Detail |
|-------|--------|
| Default data (ORG_DATA) | Hardcoded di file, selalu tersedia |
| Node baru (runtime) | Tersimpan di `useState`, hilang saat refresh/navigasi |
| localStorage | Tidak digunakan untuk data organisasi |

### 11.4 Import Mode

Modul ini menggunakan **direct import** (bukan lazy import) di `/src/app/routes.ts` untuk mencegah kegagalan dynamic import di lingkungan Figma Make dev server:

```typescript
import OrganisasiTree from './pages/OrganisasiTree';
```

---

## 12. Test Scenarios

### 12.1 Visualisasi

| TC | Skenario | Expected Result |
|----|----------|-----------------|
| TC-01 | Buka halaman `/organisasi` | Tree chart tampil dengan 16 node default, semua expanded |
| TC-02 | Verifikasi warna node | Hospital = navy, Direktur = blue, WaDir = sky, Bid/Bag = teal, Komite = white |
| TC-03 | Verifikasi connector lines | Garis vertikal dan horizontal menghubungkan setiap parent-child |
| TC-04 | Verifikasi info pejabat | Node "Direktur" menampilkan nama P001 dengan gelar |
| TC-05 | Verifikasi staff count | Setiap node menampilkan jumlah pegawai yang benar |
| TC-06 | Verifikasi stat pills | Header menampilkan jumlah PNS, PPPK, dan Honorer (jika > 0) |

### 12.2 Interaksi Zoom & Pan

| TC | Skenario | Expected Result |
|----|----------|-----------------|
| TC-07 | Scroll mouse wheel ke atas | Tree membesar (zoom in) |
| TC-08 | Scroll mouse wheel ke bawah | Tree mengecil (zoom out) |
| TC-09 | Drag mouse dari kiri ke kanan | Tree bergeser ke kanan |
| TC-10 | Klik tombol ZoomIn | Zoom bertambah 15% |
| TC-11 | Klik tombol ZoomOut | Zoom berkurang 15% |
| TC-12 | Klik tombol Reset | Zoom kembali ke 85%, posisi center |
| TC-13 | Zoom melebihi 200% | Zoom berhenti di 200% |
| TC-14 | Zoom kurang dari 30% | Zoom berhenti di 30% |
| TC-15 | Drag mouse tanpa melewati 5px threshold | Dianggap click, bukan drag |

### 12.3 Collapse / Expand

| TC | Skenario | Expected Result |
|----|----------|-----------------|
| TC-16 | Klik toggle ▼ pada node "Direktur" | Children (3 WaDir) tersembunyi, icon berubah ► |
| TC-17 | Klik toggle ► pada node yang collapsed | Children tampil kembali, icon berubah ▼ |
| TC-18 | Klik "Tutup Semua" | Semua node dengan children ter-collapse |
| TC-19 | Klik "Buka Semua" | Semua node expanded |

### 12.4 Select & Detail Panel

| TC | Skenario | Expected Result |
|----|----------|-----------------|
| TC-20 | Klik node "Bidang Keperawatan" | Detail panel muncul di kanan dengan info P012 dan staf unit |
| TC-21 | Klik node yang sama lagi | Detail panel tertutup |
| TC-22 | Klik node lain saat panel terbuka | Panel berubah ke info node baru |
| TC-23 | Klik X di detail panel | Panel tertutup |
| TC-24 | Node dengan `isVacant = true` | Alert box merah "Jabatan struktural saat ini kosong / lowong" |

### 12.5 Tambah Node

| TC | Skenario | Expected Result |
|----|----------|-----------------|
| TC-25 | Klik "Tambah Node" di header | Modal muncul, parent default = "Rumah Sakit" |
| TC-26 | Hover node "WaDir Umum", klik "+" | Modal muncul, parent = "WaDir Umum dan Keuangan" |
| TC-27 | Submit tanpa nama jabatan | Error "Nama jabatan/unit wajib diisi" |
| TC-28 | Submit tanpa memilih parent | Error "Node induk wajib dipilih" |
| TC-29 | Pilih tipe "eselon3" | Subtitle auto-fill "Eselon III/a", Eselon auto-fill "Eselon III/a" |
| TC-30 | Pilih pegawai di dropdown | Checkbox "Jabatan Lowong" tersembunyi |
| TC-31 | Submit valid: "Instalasi Litbang" (unit) under "Bid SDM" | Node baru muncul sebagai child Bid SDM, parent auto-expand |
| TC-32 | Node baru tampil dengan styling yang benar | Warna sesuai tipe yang dipilih |

### 12.6 Fullscreen

| TC | Skenario | Expected Result |
|----|----------|-----------------|
| TC-33 | Klik tombol Maximize | Halaman menjadi fullscreen (fixed inset-0 z-50) |
| TC-34 | Klik tombol Minimize | Kembali ke mode normal |

---

## 13. Limitasi & Catatan Teknis

### 13.1 Limitasi Saat Ini

| No | Limitasi | Dampak | Prioritas Perbaikan |
|----|----------|--------|---------------------|
| L1 | **Tidak ada Edit/Delete node** | Node yang salah dibuat tidak bisa diperbaiki atau dihapus | Tinggi |
| L2 | **Data tree tidak persisten** | Node baru hilang saat refresh/navigasi. Hanya tersimpan di `useState` | Tinggi |
| L3 | **Tidak ada export ke PDF/PNG** | Tidak bisa dicetak atau dibagikan sebagai gambar | Sedang |
| L4 | **Tidak ada drag-and-drop** | Node tidak bisa dipindahkan/reorder secara visual | Sedang |
| L5 | **Sinkronisasi satu arah** | Perubahan jabatan di modul lain tidak otomatis memperbarui node tree | Sedang |
| L6 | **Tidak ada riwayat/versioning** | Tidak bisa melihat struktur organisasi periode sebelumnya | Rendah |
| L7 | **Search node tidak tersedia** | Pengguna harus menelusuri tree secara manual untuk menemukan node tertentu | Rendah |
| L8 | **Touch/mobile support terbatas** | Zoom/pan hanya optimal untuk mouse, bukan touch gesture | Rendah |
| L9 | **Unit kerja harus exact match** | Typo pada field `unitKerja` menyebabkan staf tidak terhitung | — |

### 13.2 Catatan Teknis

1. **Direct Import:** File ini di-import langsung (non-lazy) di `routes.ts` untuk mencegah dynamic import failures di Figma Make dev server.
2. **No `React.Fragment`:** Sesuai konvensi HCMS, semua `<>...</>` diganti `<div className="contents">`.
3. **Immutable Tree Mutation:** `addNodeToTree()` menggunakan spread operator secara rekursif, menghasilkan tree baru tanpa mutasi langsung.
4. **Wheel Event Passive:** `handleWheel` menggunakan `{ passive: false }` untuk memungkinkan `e.preventDefault()` mencegah scroll halaman saat zoom.
5. **Singleton Router:** Modul ini mengikuti pola singleton router (`__hrAppRouter_v8`) untuk stabilitas HMR.
6. **No Global State Mutation:** Modul ini hanya **membaca** dari `AppContext.pegawai`, tidak pernah melakukan dispatch/write ke global state.

---

## 14. Rencana Pengembangan (Roadmap)

### Phase 1 — Core Improvements (Prioritas Tinggi)

| No | Fitur | Deskripsi | Effort |
|----|-------|-----------|--------|
| R1 | Edit Node | Modal edit untuk mengubah title, pejabat, eselon, unitKerja | Medium |
| R2 | Delete Node | Konfirmasi dialog + rekursif hapus children | Small |
| R3 | Persistensi Tree | Simpan tree ke localStorage atau global AppState | Small |
| R4 | Search / Filter Node | Input pencarian di header untuk menemukan dan highlight node | Small |

### Phase 2 — Enhanced Visualization (Prioritas Sedang)

| No | Fitur | Deskripsi | Effort |
|----|-------|-----------|--------|
| R5 | Export PDF/PNG | Export org chart sebagai gambar atau dokumen PDF menggunakan jsPDF | Large |
| R6 | Drag-and-Drop Reorder | Pindahkan node antar parent secara visual | Large |
| R7 | Minimap/Overview | Panel kecil menunjukkan posisi viewport pada keseluruhan tree | Medium |
| R8 | Horizontal Layout | Opsi tampilan horizontal (left-to-right) selain vertikal | Medium |
| R9 | Multi-select Nodes | Pilih beberapa node sekaligus untuk aksi batch | Medium |

### Phase 3 — Advanced Features (Prioritas Rendah)

| No | Fitur | Deskripsi | Effort |
|----|-------|-----------|--------|
| R10 | Audit Trail / Versioning | Simpan riwayat perubahan organisasi, bisa melihat struktur per periode | Large |
| R11 | Auto-sync dari Mutasi | Perubahan jabatan/unitKerja di modul lain otomatis update tree | Large |
| R12 | Span of Control Analysis | Analisis rasio atasan:bawahan per node | Medium |
| R13 | Comparison View | Bandingkan 2 versi struktur organisasi berdampingan | Large |
| R14 | Touch Gesture Support | Pinch-to-zoom, two-finger pan untuk tablet/mobile | Medium |
| R15 | Animated Transitions | Animasi saat collapse/expand dan saat zoom | Small |

---

## Lampiran

### A. Dependency List

| Package | Versi | Kegunaan dalam Modul |
|---------|-------|---------------------|
| `react` | ^19 | Component framework |
| `lucide-react` | * | Icons (Users, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronRight, User, Building2, Info, X, Search, Maximize2, Minimize2, Briefcase, Award, AlertCircle, Plus, GitBranch) |
| `react-router` | * | Navigasi (route `/organisasi`) |

### B. File Registry

| File | Tipe | Keterangan |
|------|------|------------|
| `/src/app/pages/OrganisasiTree.tsx` | Page Component | Implementasi utama modul (1108 baris) |
| `/src/app/routes.ts` | Router Config | Route definition: `{ path: 'organisasi', Component: OrganisasiTree }` |
| `/src/app/components/Layout.tsx` | Layout | Menu item: `{ path: '/organisasi', label: 'Struktur Organisasi', icon: Network }` |
| `/src/app/context/AppContext.tsx` | Context | Sumber data `pegawai[]` |
| `/src/app/types/index.ts` | Types | Tipe `Pegawai` |
| `/src/app/data/constants.ts` | Constants | `UNIT_KERJA[]` (82 entries) |

### C. Glossary

| Istilah | Definisi |
|---------|----------|
| **Eselon** | Tingkatan jabatan struktural dalam birokrasi ASN Indonesia (I-IV) |
| **TMT** | Terhitung Mulai Tanggal — tanggal efektif berlakunya suatu keputusan |
| **PNS** | Pegawai Negeri Sipil |
| **PPPK** | Pegawai Pemerintah dengan Perjanjian Kerja |
| **SPI** | Satuan Pengawas Internal |
| **SMF** | Staf Medis Fungsional |
| **OrgNode** | Representasi satu kotak/entitas dalam pohon organisasi |
| **Collapse** | Menyembunyikan node anak suatu parent |
| **Pan** | Menggeser canvas tanpa mengubah zoom level |
| **Viewport** | Area layar yang terlihat dari keseluruhan canvas tree |

---

*Dokumen ini mendeskripsikan spesifikasi fungsional modul Struktur Organisasi berdasarkan implementasi aktual di `/src/app/pages/OrganisasiTree.tsx` (1108 baris kode).*
