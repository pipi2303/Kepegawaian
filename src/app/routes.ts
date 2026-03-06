import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';

// Menggunakan React.lazy() dengan import() biasa — tanpa manualChunks agresif di vite.config.ts,
// semua dependencies di-bundle bersama chunk utama, menghindari cascading chunk loading failures.

const Login            = lazy(() => import('./pages/Login'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const DataPegawai      = lazy(() => import('./pages/DataPegawai'));
const DetailPegawai    = lazy(() => import('./pages/DetailPegawai'));
const Absensi          = lazy(() => import('./pages/Absensi'));
const Cuti             = lazy(() => import('./pages/Cuti'));
const RiwayatJabatan   = lazy(() => import('./pages/RiwayatJabatan'));
const KenaikanPangkat  = lazy(() => import('./pages/KenaikanPangkat'));
const SKP              = lazy(() => import('./pages/SKP'));
const Laporan          = lazy(() => import('./pages/Laporan'));
const Disiplin         = lazy(() => import('./pages/Disiplin'));
const Diklat           = lazy(() => import('./pages/Diklat'));
const SuratKepegawaian = lazy(() => import('./pages/SuratKepegawaian'));
const Credentialing    = lazy(() => import('./pages/Credentialing'));
const K3RS             = lazy(() => import('./pages/K3RS'));
const Penggajian       = lazy(() => import('./pages/Penggajian'));
const Penjadwalan      = lazy(() => import('./pages/Penjadwalan'));
const BPJS             = lazy(() => import('./pages/BPJS'));
const Kontrak          = lazy(() => import('./pages/Kontrak'));
const Penghargaan      = lazy(() => import('./pages/Penghargaan'));
const Mutasi           = lazy(() => import('./pages/Mutasi'));
const KomiteRS         = lazy(() => import('./pages/KomiteRS'));
const HubunganIndustrial = lazy(() => import('./pages/HubunganIndustrial'));

// ─── Router Singleton ─────────────────────────────────────────────────────────
// Menggunakan globalThis singleton agar HMR tidak membuat instance router baru.
// Router baru yang di-pass ke RouterProvider yang sudah mount akan menyebabkan
// Layout di-render sebentar di luar konteks Router (error useNavigate).
const ROUTER_KEY = '__hrAppRouter';
type RouterType = ReturnType<typeof createBrowserRouter>;

export const router: RouterType =
  (globalThis as Record<string, unknown>)[ROUTER_KEY] as RouterType ??
  (() => {
    const r = createBrowserRouter([
      { path: '/login', Component: Login },
      {
        path: '/',
        Component: Layout,
        children: [
          { index: true,                      Component: Dashboard },
          { path: 'pegawai',                  Component: DataPegawai },
          { path: 'pegawai/:id',              Component: DetailPegawai },
          { path: 'absensi',                  Component: Absensi },
          { path: 'cuti',                     Component: Cuti },
          { path: 'riwayat-jabatan',          Component: RiwayatJabatan },
          { path: 'kenaikan-pangkat',         Component: KenaikanPangkat },
          { path: 'skp',                      Component: SKP },
          { path: 'laporan',                  Component: Laporan },
          { path: 'disiplin',                 Component: Disiplin },
          { path: 'diklat',                   Component: Diklat },
          { path: 'surat-kepegawaian',        Component: SuratKepegawaian },
          { path: 'credentialing',            Component: Credentialing },
          { path: 'k3rs',                     Component: K3RS },
          { path: 'penggajian',               Component: Penggajian },
          { path: 'penjadwalan',              Component: Penjadwalan },
          { path: 'bpjs',                     Component: BPJS },
          { path: 'kontrak',                  Component: Kontrak },
          { path: 'penghargaan',              Component: Penghargaan },
          { path: 'mutasi',                   Component: Mutasi },
          { path: 'komite-rs',                Component: KomiteRS },
          { path: 'hubungan-industrial',      Component: HubunganIndustrial },
        ],
      },
    ]);
    (globalThis as Record<string, unknown>)[ROUTER_KEY] = r;
    return r;
  })();
