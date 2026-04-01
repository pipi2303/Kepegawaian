import { lazy } from 'react';
import { createHashRouter } from 'react-router';
import Layout from './components/Layout';
import Root   from './components/Root';
import NotFound from './components/NotFound';
// Dashboard di-import langsung (bukan lazy) untuk mencegah
// "Failed to fetch dynamically imported module" pada file berukuran besar
// di lingkungan Figma Make dev server.
import Dashboard from './pages/Dashboard';
import Penggajian from './pages/Penggajian';
import Absensi from './pages/Absensi';
import DataPegawai from './pages/DataPegawai';
import OrganisasiTree from './pages/OrganisasiTree';

// Semua halaman lain tetap lazy-loaded untuk performa optimal.
const Login              = lazy(() => import('./pages/Login'));
const DetailPegawai      = lazy(() => import('./pages/DetailPegawai'));
const Cuti               = lazy(() => import('./pages/Cuti'));
const RiwayatJabatan     = lazy(() => import('./pages/RiwayatJabatan'));
const KenaikanPangkat    = lazy(() => import('./pages/KenaikanPangkat'));
const SKP                = lazy(() => import('./pages/SKP'));
const Laporan            = lazy(() => import('./pages/Laporan'));
const Disiplin           = lazy(() => import('./pages/Disiplin'));
const Diklat             = lazy(() => import('./pages/Diklat'));
const SuratKepegawaian   = lazy(() => import('./pages/SuratKepegawaian'));
const Credentialing      = lazy(() => import('./pages/Credentialing'));
const K3RS               = lazy(() => import('./pages/K3RS'));
const Penjadwalan        = lazy(() => import('./pages/Penjadwalan'));
const BPJS               = lazy(() => import('./pages/BPJS'));
const Kontrak            = lazy(() => import('./pages/Kontrak'));
const Penghargaan        = lazy(() => import('./pages/Penghargaan'));
const Mutasi             = lazy(() => import('./pages/Mutasi'));
const KomiteRS           = lazy(() => import('./pages/KomiteRS'));
const HubunganIndustrial = lazy(() => import('./pages/HubunganIndustrial'));
const PerformanceManagement = lazy(() => import('./pages/PerformanceManagement'));

// ─── Router Singleton ─────────────────────────────────────────────────────────
// Singleton mencegah RouterProvider menerima instance router baru saat HMR
// (router baru → React Router unmount/remount context → useNavigate error).
const ROUTER_KEY = '__hrAppRouter_v8';
type RouterType = ReturnType<typeof createHashRouter>;

function buildRouter(): RouterType {
  return createHashRouter([
    {
      // Pathless layout route — menyediakan AppProvider + Toaster untuk semua rute.
      Component: Root,
      children: [
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
            { path: 'organisasi',               Component: OrganisasiTree },
            { path: 'performance',              Component: PerformanceManagement },
            { path: '*',                        Component: NotFound },
          ],
        },
        { path: '*', Component: NotFound },
      ],
    },
  ]);
}

// Bersihkan cache router versi lama dari globalThis
(['__hrAppRouter_v3', '__hrAppRouter_v4', '__hrAppRouter_v5', '__hrAppRouter_v6', '__hrAppRouter_v7'] as string[]).forEach(key => {
  delete (globalThis as Record<string, unknown>)[key];
});

export const router: RouterType =
  (globalThis as Record<string, unknown>)[ROUTER_KEY] as RouterType ??
  (() => {
    const r = buildRouter();
    (globalThis as Record<string, unknown>)[ROUTER_KEY] = r;
    return r;
  })();

// Vite HMR: invalidasi cache agar router baru dibuat saat modul ini diperbarui
// @ts-ignore – import.meta.hot tersedia di lingkungan Vite
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.dispose(() => {
    delete (globalThis as Record<string, unknown>)[ROUTER_KEY];
  });
}