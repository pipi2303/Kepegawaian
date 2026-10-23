import React, { lazy } from 'react';
import { createHashRouter } from 'react-router';
import Layout from './components/Layout';
import Root   from './components/Root';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
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
const MyProfile              = lazy(() => import('./pages/MyProfile'));
const MyCuti                 = lazy(() => import('./pages/MyCuti'));
const MyPayroll              = lazy(() => import('./pages/MyPayroll'));
const ActivityLog            = lazy(() => import('./pages/ActivityLog'));
const AdminSettings          = lazy(() => import('./pages/AdminSettings'));
const ImportPegawai          = lazy(() => import('./pages/ImportPegawai'));
const ImportAbsensi          = lazy(() => import('./pages/ImportAbsensi'));
const Integrasi              = lazy(() => import('./pages/Integrasi'));

// ─── Router Singleton ─────────────────────────────────────────────────────────
const ROUTER_KEY = '__hrAppRouter_v9';
type RouterType = ReturnType<typeof createHashRouter>;

function buildRouter(): RouterType {
  return createHashRouter([
    {
      Component: Root,
      children: [
        { path: '/login', Component: Login },
        {
          path: '/',
          Component: Layout,
          children: [
            { index: true,                      Component: Dashboard },
            { 
              path: 'pegawai',                  
              element: <ProtectedRoute roles={['admin', 'direktur', 'kepala_unit']}><DataPegawai /></ProtectedRoute> 
            },
            { path: 'pegawai/:id',              Component: DetailPegawai },
            { path: 'absensi',                  Component: Absensi },
            { path: 'cuti',                     Component: Cuti },
            { path: 'riwayat-jabatan',          Component: RiwayatJabatan },
            { 
              path: 'kenaikan-pangkat',         
              element: <ProtectedRoute roles={['admin']}><KenaikanPangkat /></ProtectedRoute>
            },
            { path: 'skp',                      Component: SKP },
            { 
              path: 'laporan',                  
              element: <ProtectedRoute roles={['admin', 'direktur']}><Laporan /></ProtectedRoute>
            },
            { 
              path: 'disiplin',                 
              element: <ProtectedRoute roles={['admin', 'direktur']}><Disiplin /></ProtectedRoute>
            },
            { path: 'diklat',                   Component: Diklat },
            { 
              path: 'surat-kepegawaian',        
              element: <ProtectedRoute roles={['admin', 'direktur']}><SuratKepegawaian /></ProtectedRoute> 
            },
            { 
              path: 'credentialing',            
              element: <ProtectedRoute roles={['admin', 'kepala_unit']}><Credentialing /></ProtectedRoute>
            },
            { path: 'k3rs',                     Component: K3RS },
            { 
              path: 'penggajian',               
              element: <ProtectedRoute roles={['admin', 'direktur']}><Penggajian /></ProtectedRoute>
            },
            { 
              path: 'penjadwalan',              
              element: <ProtectedRoute roles={['admin', 'kepala_unit']}><Penjadwalan /></ProtectedRoute>
            },
            { 
              path: 'bpjs',                     
              element: <ProtectedRoute roles={['admin', 'direktur']}><BPJS /></ProtectedRoute>
            },
            { 
              path: 'kontrak',                  
              element: <ProtectedRoute roles={['admin', 'direktur']}><Kontrak /></ProtectedRoute>
            },
            { 
              path: 'penghargaan',              
              element: <ProtectedRoute roles={['admin']}><Penghargaan /></ProtectedRoute>
            },
            { 
              path: 'mutasi',                   
              element: <ProtectedRoute roles={['admin']}><Mutasi /></ProtectedRoute>
            },
            { 
              path: 'komite-rs',                
              element: <ProtectedRoute roles={['admin', 'direktur']}><KomiteRS /></ProtectedRoute>
            },
            { 
              path: 'hubungan-industrial',      
              element: <ProtectedRoute roles={['admin', 'direktur']}><HubunganIndustrial /></ProtectedRoute>
            },
            { 
              path: 'organisasi',               
              element: <ProtectedRoute roles={['admin', 'direktur', 'kepala_unit']}><OrganisasiTree /></ProtectedRoute>
            },
            { 
              path: 'performance',              
              element: <ProtectedRoute roles={['admin', 'direktur']}><PerformanceManagement /></ProtectedRoute>
            },
            // Admin pages
            {
              path: 'activity-log',
              element: <ProtectedRoute roles={['admin', 'direktur']}><ActivityLog /></ProtectedRoute>
            },
            {
              path: 'settings',
              element: <ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>
            },
            // Import & Integrasi
            {
              path: 'import',
              element: <ProtectedRoute roles={['admin']}><ImportPegawai /></ProtectedRoute>
            },
            {
              path: 'import-absensi',
              element: <ProtectedRoute roles={['admin']}><ImportAbsensi /></ProtectedRoute>
            },
            {
              path: 'integrasi',
              element: <ProtectedRoute roles={['admin']}><Integrasi /></ProtectedRoute>
            },
            // Self-service portal
            { path: 'my/profile',               Component: MyProfile },
            { path: 'my/cuti',                  Component: MyCuti },
            { path: 'my/payroll',               Component: MyPayroll },
            { path: '*',                        Component: NotFound },
          ],
        },
        { path: '*', Component: NotFound },
      ],
    },
  ]);
}

// Bersihkan cache router versi lama
(['__hrAppRouter_v3', '__hrAppRouter_v4', '__hrAppRouter_v5', '__hrAppRouter_v6', '__hrAppRouter_v7', '__hrAppRouter_v8'] as string[]).forEach(key => {
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