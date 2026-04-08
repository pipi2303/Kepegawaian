# HCMS (Human Capital Management System) - Dokumentasi Teknis

> Dokumentasi lengkap arsitektur, modul, dan konvensi teknis aplikasi HCMS Smart Hospital.
> Dokumen ini ditujukan sebagai referensi untuk replikasi atau adaptasi ke proyek lain.

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Direktori](#3-struktur-direktori)
4. [Arsitektur Aplikasi](#4-arsitektur-aplikasi)
5. [Routing](#5-routing)
6. [Global State Management](#6-global-state-management)
7. [Sistem Autentikasi](#7-sistem-autentikasi)
8. [Color Token System](#8-color-token-system)
9. [Daftar Modul](#9-daftar-modul)
10. [Type Definitions](#10-type-definitions)
11. [CRUD Pattern](#11-crud-pattern)
12. [Fitur PDF Export](#12-fitur-pdf-export)
13. [Floating Digital Assistant](#13-floating-digital-assistant)
14. [Konvensi & Batasan Teknis](#14-konvensi--batasan-teknis)
15. [Panduan Adaptasi ke Proyek Lain](#15-panduan-adaptasi-ke-proyek-lain)

---

## 1. Gambaran Umum

HCMS adalah aplikasi HR berbasis web untuk rumah sakit, dibangun sesuai regulasi ASN Indonesia (PP No. 11/2017 dan PermenPAN-RB No. 6/2022). Aplikasi mencakup 25+ halaman dan mengelola 246 pegawai (P001-P246) dengan fitur CRUD lengkap di setiap modul.

**Karakteristik utama:**
- Single Page Application (SPA) berbasis React + Tailwind CSS v4
- Client-side state management via React Context + useReducer
- Persistensi sesi login via `localStorage` (key: `hr_app_user`)
- Hash-based routing (`createHashRouter`) untuk kompatibilitas hosting statis
- UI generik tanpa referensi langsung ke nama institusi tertentu

---

## 2. Tech Stack

| Kategori | Teknologi | Versi |
|---|---|---|
| Framework | React | 18+ |
| Styling | Tailwind CSS | v4 |
| Routing | react-router (`createHashRouter`) | 7.13.0 |
| State | React Context + useReducer | - |
| Charts | Recharts | 2.15.2 |
| Icons | Lucide React | 0.487.0 |
| PDF Export | jsPDF (text API, tanpa html2canvas) | 4.2.0 |
| Animations | Motion (formerly Framer Motion) | 12.23.24 |
| Toast/Notif | Sonner | 2.0.3 |
| Date Utils | date-fns | 3.6.0 |
| Forms | react-hook-form | 7.55.0 |
| Build Tool | Vite | - |

**Packages tambahan:** Radix UI primitives, class-variance-authority, clsx, tailwind-merge, cmdk, react-dnd, react-day-picker, MUI (opsional).

---

## 3. Struktur Direktori

```
src/app/
  App.tsx                   # Entrypoint — ErrorBoundary + RouterProvider
  routes.ts                 # Definisi semua route (createHashRouter)
  context/
    AppContext.tsx           # Global state: reducer, actions, provider
  types/
    index.ts                # Semua TypeScript interfaces & types
  data/
    index.ts                # Data awal pegawai (P001-P246)
    mockData.ts             # Mock data untuk modul-modul
    mockDataRS.ts           # Mock data spesifik rumah sakit
    constants.ts            # Konstanta umum
    hospitalDashboardData.ts # Data dashboard
    performanceData.ts      # Data BSC, OKR, Performance Review
  components/
    Root.tsx                # Pathless layout: AppProvider + redirect logic
    Layout.tsx              # Sidebar + header + Outlet
    NotFound.tsx            # Halaman 404
    AskIntramedika.tsx      # Floating AI Assistant
    GlobalSearch.tsx        # Pencarian global
    colors.ts               # Color tokens (C, CHART_COLORS, BSC_COLORS, dll)
    EmployeeAvatar.tsx      # Komponen avatar pegawai
    RechartsWrapper.tsx     # Wrapper untuk chart components
    DashboardWidgets.tsx    # Widget-widget dashboard
    dashboard/              # Sub-komponen Dashboard
    skp/                    # Sub-komponen SKP
    ui/                     # Shadcn-style UI primitives
    figma/                  # Komponen dari Figma import
  pages/
    Login.tsx
    Dashboard.tsx
    DataPegawai.tsx
    DetailPegawai.tsx
    Absensi.tsx
    Cuti.tsx
    RiwayatJabatan.tsx
    KenaikanPangkat.tsx
    SKP.tsx
    Disiplin.tsx
    Diklat.tsx
    Penggajian.tsx
    Penjadwalan.tsx
    SuratKepegawaian.tsx
    Credentialing.tsx
    K3RS.tsx
    BPJS.tsx
    Kontrak.tsx
    Penghargaan.tsx
    Mutasi.tsx
    KomiteRS.tsx
    HubunganIndustrial.tsx
    OrganisasiTree.tsx
    PerformanceManagement.tsx
    Laporan.tsx
```

---

## 4. Arsitektur Aplikasi

### Diagram Komponen

```
App.tsx (ErrorBoundary)
  └── RouterProvider (createHashRouter)
        └── Root.tsx (pathless layout)
              ├── AppProvider (Context + Reducer)
              ├── Toaster (Sonner)
              ├── Suspense fallback
              ├── /login → Login.tsx
              └── / → Layout.tsx (sidebar + header)
                    ├── AskIntramedika (floating)
                    ├── GlobalSearch
                    └── <Outlet /> → semua halaman modul
```

### Error Boundary

`App.tsx` membungkus `RouterProvider` dalam `AppErrorBoundary` yang menangkap:
- `Failed to fetch dynamically imported module` (lazy-loading failures)
- `Loading chunk` errors
- Error umum lainnya

Menampilkan UI recovery dengan tombol "Ke Beranda" dan "Muat Ulang".

### Direct Import vs Lazy Import

Modul-modul besar menggunakan **direct import** untuk menghindari dynamic import failures:
- `Dashboard`
- `Penggajian`
- `Absensi`
- `DataPegawai`
- `OrganisasiTree`

Semua modul lain menggunakan `React.lazy()`.

---

## 5. Routing

### Konfigurasi

```typescript
// routes.ts
import { createHashRouter } from 'react-router';

const router = createHashRouter([
  {
    Component: Root,           // Pathless — provides AppProvider
    children: [
      { path: '/login', Component: Login },
      {
        path: '/',
        Component: Layout,     // Sidebar + Header
        children: [
          { index: true, Component: Dashboard },
          { path: 'pegawai', Component: DataPegawai },
          { path: 'pegawai/:id', Component: DetailPegawai },
          { path: 'absensi', Component: Absensi },
          // ... 20+ route lainnya
          { path: '*', Component: NotFound },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
]);
```

### Mengapa `createHashRouter`?

`createBrowserRouter` membutuhkan server-side fallback (semua path harus mereturn `index.html`). Pada hosting statis / Figma Make dev server, ini menyebabkan 404 saat refresh. `createHashRouter` menyimpan route di hash fragment (`/#/pegawai`) sehingga server selalu melayani `index.html`.

### Singleton Pattern

Router di-cache di `globalThis` dengan key `__hrAppRouter_v8` agar tidak di-recreate saat HMR (Hot Module Replacement), yang bisa menyebabkan React Router unmount/remount error.

```typescript
const ROUTER_KEY = '__hrAppRouter_v8';
export const router =
  (globalThis as Record<string, unknown>)[ROUTER_KEY] ??
  (() => {
    const r = buildRouter();
    (globalThis as Record<string, unknown>)[ROUTER_KEY] = r;
    return r;
  })();
```

---

## 6. Global State Management

### Arsitektur: Context + useReducer

```
AppContext.tsx
  ├── AppState (interface)        → semua data modul + auth state
  ├── Action (union type)         → 50+ action types (CRUD per modul)
  ├── reducer()                   → pure function state transitions
  ├── AppProvider (component)     → useReducer + memoized action creators
  └── useAppContext() (hook)      → consumer hook
```

### AppState Interface

```typescript
interface AppState {
  // Auth
  currentUser: AppUser | null;
  isLoggedIn: boolean;
  
  // Data Modules
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
}
```

### Action Pattern

Setiap modul memiliki 3 action standar: `ADD_*`, `UPDATE_*`, `DELETE_*`.
Beberapa modul memiliki action tambahan:
- Cuti: `APPROVE_CUTI`, `REJECT_CUTI` (multi-level approval)
- Absensi: `BULK_INPUT_ABSENSI`

### Penggunaan di Komponen

```tsx
import { useAppContext } from '../context/AppContext';

function MyComponent() {
  const { pegawai, addPegawai, updatePegawai, deletePegawai } = useAppContext();
  // ... gunakan data dan actions
}
```

---

## 7. Sistem Autentikasi

### Login Flow

```
1. User submit username + password
2. login() mencari match di array appUsers (hardcoded)
3. Jika cocok → simpan ke localStorage('hr_app_user') + dispatch LOGIN
4. Jika tidak → return false
```

### Persistensi Sesi

Saat aplikasi dimuat, `AppProvider` membaca `localStorage('hr_app_user')` dan memvalidasi ulang terhadap daftar `appUsers`:

```typescript
const savedUser = (() => {
  const saved = localStorage.getItem('hr_app_user');
  if (!saved) return null;
  const parsed = JSON.parse(saved);
  const matched = appUsers.find(u => u.id === parsed.id && u.username === parsed.username);
  if (matched) {
    localStorage.setItem('hr_app_user', JSON.stringify(matched));
    return matched;
  }
  localStorage.removeItem('hr_app_user');
  return null;
})();
```

### Redirect Logic (Root.tsx)

```typescript
// Jika sudah login & di /login → redirect ke /
// Jika belum login & bukan di /login → redirect ke /login
useEffect(() => {
  if (isLoggedIn && location.pathname === '/login') navigate('/', { replace: true });
  if (!isLoggedIn && location.pathname !== '/login') navigate('/login', { replace: true });
}, [isLoggedIn, location.pathname, navigate]);
```

### User Roles & Access Control

```typescript
type UserRole = 'admin' | 'direktur' | 'kepala_unit' | 'pegawai';

interface AppUser {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: UserRole;
  jabatan: string;
  golongan?: string;
  unitKerja?: string;
  pegawaiId?: string;
  excludedModules?: string[];  // modul yang disembunyikan dari user ini
}
```

`excludedModules` digunakan di `Layout.tsx` untuk menyembunyikan item sidebar dan opsi dropdown profile secara kondisional.

---

## 8. Color Token System

Semua warna didefinisikan di `/src/app/components/colors.ts`. **Tidak boleh hardcode hex di komponen.**

### Brand Colors

| Token | Hex | Kegunaan |
|---|---|---|
| `C.brand` | `#013E37` | Warna primer, sidebar, header |
| `C.brandMid` | `#025C52` | Hover state primer |
| `C.brandLight` | `#038E7D` | Aksen, link, badge |
| `C.brandXLight` | `#5BB5AB` | Border terang |
| `C.lemon` | `#FFEFB2` | Warna aksen (creamy lemon) |
| `C.lemonDark` | `#F5D800` | Aksen kuat |

### Semantic Colors

```typescript
export const C = {
  bg: '#EEF7F5',           // Background halaman
  card: '#FFFFFF',          // Background kartu
  border: '#C3DDD9',       // Border umum
  success: '#16A34A',       // Status berhasil
  warning: '#D97706',       // Status peringatan
  danger: '#DC2626',        // Status bahaya
  text: '#012D29',          // Teks utama
  textMuted: '#4D8078',     // Teks sekunder
};
```

### Chart Palette

```typescript
export const CHART_COLORS = [
  '#038E7D', '#FFBE00', '#E87040', '#0891B2',
  '#6C63FF', '#FF6B6B', '#4ECDC4', '#16A34A',
];
```

### Penggunaan

```tsx
import { C, CHART_COLORS } from './colors';

// Di inline style
<div style={{ backgroundColor: C.brand, color: C.white }}>

// Di Tailwind (hardcode hex hanya jika mengacu token)
<div className={`bg-[${C.brand}]`}>

// Di Recharts
<Bar fill={CHART_COLORS[0]} />
```

---

## 9. Daftar Modul

### Sidebar Menu Structure

| Section | Modul | Path | Halaman |
|---|---|---|---|
| **UTAMA** | Dashboard (Workforce Analytics) | `/` | `Dashboard.tsx` |
| **DATA PEGAWAI** | Data Pegawai | `/pegawai` | `DataPegawai.tsx` |
| | Detail Pegawai | `/pegawai/:id` | `DetailPegawai.tsx` |
| | Struktur Organisasi | `/organisasi` | `OrganisasiTree.tsx` |
| | Mutasi & Rotasi | `/mutasi` | `Mutasi.tsx` |
| | Penghargaan | `/penghargaan` | `Penghargaan.tsx` |
| **KEHADIRAN & JADWAL** | Presensi / Absensi | `/absensi` | `Absensi.tsx` |
| | Manajemen Cuti | `/cuti` | `Cuti.tsx` |
| | Penjadwalan Shift | `/penjadwalan` | `Penjadwalan.tsx` |
| **KARIR & PANGKAT** | Riwayat Jabatan | `/riwayat-jabatan` | `RiwayatJabatan.tsx` |
| | Kenaikan Pangkat | `/kenaikan-pangkat` | `KenaikanPangkat.tsx` |
| **KINERJA & PENGEMBANGAN** | SKP & Penilaian Kinerja | `/skp` | `SKP.tsx` |
| | Performance Management | `/performance` | `PerformanceManagement.tsx` |
| | Diklat & Kompetensi | `/diklat` | `Diklat.tsx` |
| **KLINIS & LISENSI** | Credentialing & Lisensi | `/credentialing` | `Credentialing.tsx` |
| | K3RS & Kesehatan Kerja | `/k3rs` | `K3RS.tsx` |
| | Komite Rumah Sakit | `/komite-rs` | `KomiteRS.tsx` |
| **KEPEGAWAIAN** | Penggajian & Tunjangan | `/penggajian` | `Penggajian.tsx` |
| | BPJS Kesehatan & TK | `/bpjs` | `BPJS.tsx` |
| | Kontrak Kerja | `/kontrak` | `Kontrak.tsx` |
| **DISIPLIN & HUKUM** | Disiplin Pegawai | `/disiplin` | `Disiplin.tsx` |
| | Hubungan Industrial | `/hubungan-industrial` | `HubunganIndustrial.tsx` |
| **SURAT & LAPORAN** | Surat Kepegawaian | `/surat-kepegawaian` | `SuratKepegawaian.tsx` |
| | Laporan & Statistik | `/laporan` | `Laporan.tsx` |

### Deskripsi Modul

#### Dashboard
- Menampilkan **Workforce Analytics** langsung tanpa pill button pemilih role
- Widget: total pegawai, distribusi gender, status kepegawaian, unit kerja, pensiun, dll.
- Charts menggunakan Recharts (Bar, Pie, Line, Area)

#### Data Pegawai
- Tabel dengan search, filter, pagination
- CRUD: tambah, edit, hapus pegawai
- Detail pegawai (`/pegawai/:id`): tab data keluarga, dokumen, sertifikat, riwayat

#### Cuti
- Multi-level approval (Kepala Unit → Direktur)
- 6 jenis cuti sesuai PP ASN: Tahunan, Sakit, Melahirkan, Alasan Penting, Besar, CLTN
- Tracking sisa kuota cuti per pegawai per tahun

#### SKP (Sasaran Kinerja Pegawai)
- Per semester, per pegawai
- Target kinerja dengan bobot, realisasi, nilai capaian
- Predikat: Sangat Baik / Baik / Cukup / Kurang

#### Performance Management
- BSC (Balanced Scorecard): 4 perspektif (Financial, Customer, Internal Process, Learning & Growth)
- OKR (Objectives & Key Results): multi-level (Organisasi, Divisi, Tim, Individu)
- KPI Matrix: integrasi BSC + OKR dengan bobot kontribusi
- Performance Review: skor gabungan, rating A-E

#### Penggajian
- Komponen gaji: gaji pokok, 6 jenis tunjangan
- Potongan: BPJS Kes, BPJS TK, PPh 21, Taspen
- Slip gaji dengan status (Draft → Disetujui → Dibayar)

#### Surat Kepegawaian
- Template surat dinas menggunakan jsPDF text API
- Nama Direktur: `dr. IMAM GHOZALI, Sp.An., M.Kes.` (NIP. 19680415 199703 1 001)

---

## 10. Type Definitions

Semua interface didefinisikan di `/src/app/types/index.ts`. Berikut ringkasannya:

### Core Types

| Interface | Field Kunci | Digunakan Oleh |
|---|---|---|
| `Pegawai` | id, nip, nama, jabatan, unitKerja, golongan, statusPegawai, statusAktif | DataPegawai, DetailPegawai |
| `AppUser` | id, username, password, role, excludedModules | Login, Layout |
| `ApprovalLevel` | level, jabatan, nama, status | Cuti (multi-level approval) |

### Status Pegawai

```typescript
statusPegawai: 'PNS' | 'PPPK' | 'Honorer';
statusAktif: 'Aktif' | 'Pensiun' | 'Meninggal' | 'Diberhentikan';
```

### Modul-Specific Types

| Interface | Modul |
|---|---|
| `AbsensiRecord` | Presensi |
| `CutiRecord`, `SisaCuti` | Cuti |
| `SKPRecord`, `TargetKinerja` | SKP |
| `RiwayatJabatan` | Riwayat Jabatan |
| `KenaikanPangkat` | Kenaikan Pangkat |
| `DisiplinRecord` | Disiplin |
| `DiklatRecord` | Diklat |
| `STRRecord`, `SIPRecord` | Credentialing |
| `CredentialingRecord`, `KewenangaKlinis` | Credentialing |
| `CPDRecord` | CPD (Continuing Professional Development) |
| `InsidenK3RS`, `VaksinasiRecord`, `MCURecord` | K3RS |
| `SlipGaji`, `SlipGajiItem` | Penggajian |
| `JadwalShift` | Penjadwalan |
| `BPJSRecord`, `BPJSTanggungan` | BPJS |
| `KontrakRecord` | Kontrak |
| `PenghargaanRecord` | Penghargaan |
| `MutasiRecord` | Mutasi |
| `AnggotaKomite`, `KegiatanKomite` | Komite RS |
| `GrievanceRecord` | Hubungan Industrial |
| `PHKRecord` | PHK / Pensiun |
| `BSCObjective`, `OKRObjective`, `PerformanceReview` | Performance Management |
| `KPIDefinition`, `KPICombinedScore` | KPI Matrix |
| `DataKeluarga` | Detail Pegawai (tab keluarga) |
| `DokumenPegawai` | Detail Pegawai (tab dokumen) |

---

## 11. CRUD Pattern

Setiap modul mengikuti pattern yang sama:

### 1. Definisikan Type (types/index.ts)

```typescript
export interface MyRecord {
  id: string;
  pegawaiId: string;
  // ... fields
  status: 'Aktif' | 'Tidak Aktif';
}
```

### 2. Tambahkan ke AppState (context/AppContext.tsx)

```typescript
interface AppState {
  // ... existing
  myRecords: MyRecord[];
}
```

### 3. Definisikan Actions

```typescript
type Action =
  | { type: 'ADD_MY_RECORD'; record: MyRecord }
  | { type: 'UPDATE_MY_RECORD'; record: MyRecord }
  | { type: 'DELETE_MY_RECORD'; id: string }
  // ... existing
```

### 4. Handle di Reducer

```typescript
case 'ADD_MY_RECORD':
  return { ...state, myRecords: [...state.myRecords, action.record] };
case 'UPDATE_MY_RECORD':
  return { ...state, myRecords: state.myRecords.map(r => r.id === action.record.id ? action.record : r) };
case 'DELETE_MY_RECORD':
  return { ...state, myRecords: state.myRecords.filter(r => r.id !== action.id) };
```

### 5. Buat Action Creators di Provider

```typescript
const addMyRecord = useCallback(
  (r: Omit<MyRecord, 'id'>) => dispatch({ type: 'ADD_MY_RECORD', record: { ...r, id: genId('MR') } }),
  []
);
const updateMyRecord = useCallback(
  (r: MyRecord) => dispatch({ type: 'UPDATE_MY_RECORD', record: r }),
  []
);
const deleteMyRecord = useCallback(
  (id: string) => dispatch({ type: 'DELETE_MY_RECORD', id }),
  []
);
```

### 6. ID Generation

```typescript
const genId = (prefix: string) => `${prefix}${Date.now()}`;
// Contoh output: "MR1714567890123"
```

---

## 12. Fitur PDF Export

### Mengapa jsPDF Text API (bukan html2canvas)?

Tailwind CSS v4 menggunakan `oklch()` color function yang **tidak didukung** oleh `html2canvas`. Ini menyebabkan rendering error. Solusi: gunakan jsPDF text API langsung.

### Pattern Penggunaan

```typescript
import jsPDF from 'jspdf';

function exportPDF() {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header
  doc.setFontSize(14);
  doc.text('JUDUL DOKUMEN', 105, 20, { align: 'center' });
  
  // Body
  doc.setFontSize(10);
  doc.text(`Nama: ${pegawai.nama}`, 20, 40);
  doc.text(`NIP: ${pegawai.nip}`, 20, 47);
  
  // Tabel manual
  let y = 60;
  data.forEach((row, i) => {
    doc.text(`${i + 1}`, 20, y);
    doc.text(row.uraian, 35, y);
    doc.text(row.nilai.toString(), 150, y);
    y += 7;
  });
  
  // Tanda tangan
  doc.text('Direktur,', 140, y + 20);
  doc.text('dr. IMAM GHOZALI, Sp.An., M.Kes.', 120, y + 40);
  doc.text('NIP. 19680415 199703 1 001', 125, y + 47);
  
  doc.save('dokumen.pdf');
}
```

---

## 13. Floating Digital Assistant

**Komponen:** `AskIntramedika.tsx`
**Nama:** "Ask INTRAMEDIKA"
**Posisi:** Floating button di pojok kanan bawah

Fitur:
- Chat interface dengan bubble messages
- Menjawab pertanyaan terkait HR dan kepegawaian
- Bisa query data dari AppContext (pegawai, cuti, gaji, dll.)
- Terintegrasi di `Layout.tsx` sehingga tersedia di semua halaman

---

## 14. Konvensi & Batasan Teknis

### Wajib Diikuti

| Konvensi | Detail |
|---|---|
| **Tidak boleh `<>...</>`** | Gunakan `<div className="contents">` sebagai pengganti `React.Fragment` / `<>` |
| **Tidak boleh hardcode warna** | Import dari `colors.ts` (`C`, `CHART_COLORS`, dll.) |
| **Routing** | Gunakan `react-router` (bukan `react-router-dom`) |
| **PDF** | Gunakan jsPDF text API (bukan html2canvas) untuk menghindari error `oklch()` |
| **Large modules** | Direct import di `routes.ts` (bukan `lazy()`) untuk modul besar |
| **localStorage key** | `hr_app_user` untuk sesi login |

### Batasan Environment (Figma Make)

- Dynamic import (`React.lazy`) bisa gagal untuk file besar → gunakan direct import
- `oklch()` Tailwind v4 tidak kompatibel dengan `html2canvas`
- `createBrowserRouter` menyebabkan 404 saat refresh → gunakan `createHashRouter`
- Package `react-router-dom` tidak tersedia → gunakan `react-router`

---

## 15. Panduan Adaptasi ke Proyek Lain

### Langkah 1: Setup Dasar

```bash
# Install dependencies
npm install react react-dom react-router recharts lucide-react
npm install jspdf sonner date-fns tailwind-merge clsx
npm install react-hook-form@7.55.0
```

### Langkah 2: Copy Core Files

1. `/src/app/types/index.ts` — semua interface
2. `/src/app/components/colors.ts` — color tokens
3. `/src/app/context/AppContext.tsx` — state management
4. `/src/app/routes.ts` — routing config
5. `/src/app/App.tsx` — entrypoint + error boundary
6. `/src/app/components/Root.tsx` — auth redirect logic
7. `/src/app/components/Layout.tsx` — sidebar + header

### Langkah 3: Kustomisasi

**Ganti brand colors:**
```typescript
// colors.ts
export const C = {
  brand: '#YOUR_PRIMARY',
  lemon: '#YOUR_ACCENT',
  // ...
};
```

**Ganti data pegawai:**
- Edit `/src/app/data/index.ts` dan `/src/app/data/mockData.ts`

**Ganti Direktur (untuk template surat):**
- Search & replace `dr. IMAM GHOZALI, Sp.An., M.Kes.` dan NIP-nya

**Tambah/hapus modul:**
1. Tambah/hapus route di `routes.ts`
2. Tambah/hapus menu item di `Layout.tsx` (`menuItems` array)
3. Tambah/hapus type, state, dan actions di `AppContext.tsx`
4. Buat/hapus file halaman di `/src/app/pages/`

### Langkah 4: Tambah Modul Baru

Ikuti [CRUD Pattern](#11-crud-pattern) di atas. Checklist:
- [ ] Definisi interface di `types/index.ts`
- [ ] Tambah ke `AppState` di `AppContext.tsx`
- [ ] Tambah Action types
- [ ] Handle di reducer
- [ ] Buat action creators di Provider
- [ ] Expose di context value
- [ ] Tambah initial data di `data/`
- [ ] Buat halaman di `pages/`
- [ ] Tambah route di `routes.ts`
- [ ] Tambah menu item di `Layout.tsx`

### Langkah 5: Migrasi ke Backend (Opsional)

Untuk production, ganti localStorage + Context dengan:
- **Supabase** / **Firebase** untuk database + auth
- **React Query / TanStack Query** untuk server state
- **JWT** untuk autentikasi yang aman

Pattern migrasi: ganti setiap `useCallback` action creator di `AppProvider` dengan API call + cache invalidation.

---

## Lisensi & Referensi Regulasi

- PP No. 11 Tahun 2017 tentang Manajemen PNS
- PermenPAN-RB No. 6 Tahun 2022 tentang Pengelolaan Kinerja Pegawai ASN
- Jenis cuti mengacu pada Pasal 311-319 PP 11/2017

---

*Dokumen ini di-generate pada 1 April 2026. Untuk pertanyaan teknis, hubungi tim pengembang HCMS.*
