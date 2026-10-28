import React, { lazy, Suspense } from 'react';
import { createHashRouter } from 'react-router';
import Layout from './components/Layout';
import Root   from './components/Root';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
// Dashboard di-import langsung (bukan lazy) untuk mencegah
// "Failed to fetch dynamically imported module" pada file berukuran besar
// di lingkungan Figma Make dev server.
import Dashboard from './pages/Dashboard';
import Penggajian from './pages/Penggajian';
import Absensi from './pages/Absensi';
import DataPegawai from './pages/DataPegawai';
import OrganisasiTree from './pages/OrganisasiTree';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-blue-600 w-6 h-6" /></div>}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

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
const OPPE               = lazy(() => import('./pages/OPPE'));
const WISN               = lazy(() => import('./pages/WISN'));
const KarsTracker        = lazy(() => import('./pages/KarsTracker'));
const ExitInterview      = lazy(() => import('./pages/ExitInterview'));
const BurnoutDashboard   = lazy(() => import('./pages/BurnoutDashboard'));
const RemunerasiAnalytics= lazy(() => import('./pages/RemunerasiAnalytics'));
const K3RS               = lazy(() => import('./pages/K3RS'));
const Penjadwalan        = lazy(() => import('./pages/Penjadwalan'));
const BPJS               = lazy(() => import('./pages/BPJS'));
const Kontrak            = lazy(() => import('./pages/Kontrak'));
const Penghargaan        = lazy(() => import('./pages/Penghargaan'));
const Mutasi             = lazy(() => import('./pages/Mutasi'));
const KomiteRS           = lazy(() => import('./pages/KomiteRS'));
const HubunganIndustrial = lazy(() => import('./pages/HubunganIndustrial'));
const PerformanceManagement = lazy(() => import('./pages/PerformanceManagement'));
const MyProfile              = lazy(() => import('./pages/MyProfile'));
const MyCuti                 = lazy(() => import('./pages/MyCuti'));
const MyPayroll              = lazy(() => import('./pages/MyPayroll'));
const MyAbsensi              = lazy(() => import('./pages/MyAbsensi'));
const ActivityLog            = lazy(() => import('./pages/ActivityLog'));
const AdminSettings          = lazy(() => import('./pages/AdminSettings'));
const ImportPegawai          = lazy(() => import('./pages/ImportPegawai'));
const ImportAbsensi          = lazy(() => import('./pages/ImportAbsensi'));
const Integrasi              = lazy(() => import('./pages/Integrasi'));
const TPP                    = lazy(() => import('./pages/TPP'));
const RBK                    = lazy(() => import('./pages/RBK'));
const Rekrutmen              = lazy(() => import('./pages/Rekrutmen'));
const PortalLamaran          = lazy(() => import('./pages/PortalLamaran'));
const PensiunTracker         = lazy(() => import('./pages/PensiunTracker'));
const AngkaKredit            = lazy(() => import('./pages/AngkaKredit'));
const Onboarding             = lazy(() => import('./pages/Onboarding'));

// ─── Router Singleton ─────────────────────────────────────────────────────────
const ROUTER_KEY = '__hrAppRouter_v12';
type RouterType = ReturnType<typeof createHashRouter>;

function buildRouter(): RouterType {
  return createHashRouter([
    {
      Component: Root,
      children: [
        { path: '/login', Component: Login },
        { path: '/lowongan', Component: PortalLamaran },
        {
          path: '/',
          Component: Layout,
          children: [
            { index: true,                      Component: Dashboard },
            { 
              path: 'pegawai',                  
              element: <ProtectedRoute roles={['admin', 'direktur', 'kepala_unit']}><DataPegawai /></ProtectedRoute> 
            },
            { path: 'pegawai/:id',              element: <PageWrapper><DetailPegawai /></PageWrapper> },
            { path: 'absensi',                  Component: Absensi },
            { path: 'cuti',                     element: <PageWrapper><Cuti /></PageWrapper> },
            { path: 'riwayat-jabatan',          element: <PageWrapper><RiwayatJabatan /></PageWrapper> },
            {
              path: 'kenaikan-pangkat',
              element: <ProtectedRoute roles={['admin']}><PageWrapper><KenaikanPangkat /></PageWrapper></ProtectedRoute>
            },
            { path: 'skp',                      element: <PageWrapper><SKP /></PageWrapper> },
            {
              path: 'laporan',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><Laporan /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'disiplin',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><Disiplin /></PageWrapper></ProtectedRoute>
            },
            { path: 'diklat',                   element: <PageWrapper><Diklat /></PageWrapper> },
            {
              path: 'surat-kepegawaian',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><SuratKepegawaian /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'credentialing',
              element: <ProtectedRoute roles={['admin', 'kepala_unit']}><PageWrapper><Credentialing /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'oppe',
              element: <ProtectedRoute roles={['admin', 'direktur', 'kepala_unit']}><PageWrapper><OPPE /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'wisn',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><WISN /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'kars-tracker',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><KarsTracker /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'exit-interview',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><ExitInterview /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'burnout',
              element: <ProtectedRoute roles={['admin', 'direktur', 'kepala_unit']}><PageWrapper><BurnoutDashboard /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'remunerasi-analytics',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><RemunerasiAnalytics /></PageWrapper></ProtectedRoute>
            },
            { path: 'k3rs',                     element: <PageWrapper><K3RS /></PageWrapper> },
            {
              path: 'penggajian',
              element: <ProtectedRoute roles={['admin', 'direktur']}><Penggajian /></ProtectedRoute>
            },
            {
              path: 'tpp',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><TPP /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'rbk',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><RBK /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'penjadwalan',
              element: <ProtectedRoute roles={['admin', 'kepala_unit']}><PageWrapper><Penjadwalan /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'bpjs',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><BPJS /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'kontrak',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><Kontrak /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'penghargaan',
              element: <ProtectedRoute roles={['admin']}><PageWrapper><Penghargaan /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'mutasi',
              element: <ProtectedRoute roles={['admin']}><PageWrapper><Mutasi /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'pensiun-tracker',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><PensiunTracker /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'komite-rs',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><KomiteRS /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'hubungan-industrial',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><HubunganIndustrial /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'organisasi',
              element: <ProtectedRoute roles={['admin', 'direktur', 'kepala_unit']}><OrganisasiTree /></ProtectedRoute>
            },
            {
              path: 'performance',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><PerformanceManagement /></PageWrapper></ProtectedRoute>
            },
            // Admin pages
            {
              path: 'activity-log',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><ActivityLog /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'settings',
              element: <ProtectedRoute roles={['admin']}><PageWrapper><AdminSettings /></PageWrapper></ProtectedRoute>
            },
            // Import & Integrasi
            {
              path: 'import',
              element: <ProtectedRoute roles={['admin']}><PageWrapper><ImportPegawai /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'import-absensi',
              element: <ProtectedRoute roles={['admin']}><PageWrapper><ImportAbsensi /></PageWrapper></ProtectedRoute>
            },
            {
              path: 'integrasi',
              element: <ProtectedRoute roles={['admin']}><PageWrapper><Integrasi /></PageWrapper></ProtectedRoute>
            },
            // Rekrutmen PPPK/Honorer (admin)
            {
              path: 'rekrutmen',
              element: <ProtectedRoute roles={['admin', 'direktur']}><PageWrapper><Rekrutmen /></PageWrapper></ProtectedRoute>
            },
            // Angka Kredit JFT
            { path: 'angka-kredit', element: <PageWrapper><AngkaKredit /></PageWrapper> },
            { path: 'onboarding',   element: <PageWrapper><Onboarding /></PageWrapper> },
            // Self-service portal
            { path: 'my/profile',               element: <PageWrapper><MyProfile /></PageWrapper> },
            { path: 'my/cuti',                  element: <PageWrapper><MyCuti /></PageWrapper> },
            { path: 'my/payroll',               element: <PageWrapper><MyPayroll /></PageWrapper> },
            { path: 'my/absensi',               element: <PageWrapper><MyAbsensi /></PageWrapper> },
            { path: '*',                        Component: NotFound },
          ],
        },
        { path: '*', Component: NotFound },
      ],
    },
  ]);
}

// Bersihkan cache router versi lama
(['__hrAppRouter_v3', '__hrAppRouter_v4', '__hrAppRouter_v5', '__hrAppRouter_v6', '__hrAppRouter_v7', '__hrAppRouter_v8', '__hrAppRouter_v9', '__hrAppRouter_v10', '__hrAppRouter_v11'] as string[]).forEach(key => {
  delete (globalThis as Record<string, unknown>)[key];
});

export const router: RouterType =
  (globalThis as Record<string, unknown>)[ROUTER_KEY] as RouterType ??
  (() => {
    const r = buildRouter();
    (globalThis as Record<string, unknown>)[ROUTER_KEY] = r;
    return r;
  })();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    delete (globalThis as Record<string, unknown>)[ROUTER_KEY];
  });
}