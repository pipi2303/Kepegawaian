import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';

// Lazy load semua halaman — hanya dimuat saat dibutuhkan
const Login         = lazy(() => import('./pages/Login'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const DataPegawai   = lazy(() => import('./pages/DataPegawai'));
const DetailPegawai = lazy(() => import('./pages/DetailPegawai'));
const Absensi       = lazy(() => import('./pages/Absensi'));
const Cuti          = lazy(() => import('./pages/Cuti'));
const RiwayatJabatan  = lazy(() => import('./pages/RiwayatJabatan'));
const KenaikanPangkat = lazy(() => import('./pages/KenaikanPangkat'));
const SKP           = lazy(() => import('./pages/SKP'));
const Laporan       = lazy(() => import('./pages/Laporan'));
const Disiplin      = lazy(() => import('./pages/Disiplin'));
const Diklat        = lazy(() => import('./pages/Diklat'));
const SuratKepegawaian = lazy(() => import('./pages/SuratKepegawaian'));

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true,                Component: Dashboard },
      { path: 'pegawai',            Component: DataPegawai },
      { path: 'pegawai/:id',        Component: DetailPegawai },
      { path: 'absensi',            Component: Absensi },
      { path: 'cuti',               Component: Cuti },
      { path: 'riwayat-jabatan',    Component: RiwayatJabatan },
      { path: 'kenaikan-pangkat',   Component: KenaikanPangkat },
      { path: 'skp',                Component: SKP },
      { path: 'laporan',            Component: Laporan },
      { path: 'disiplin',           Component: Disiplin },
      { path: 'diklat',             Component: Diklat },
      { path: 'surat-kepegawaian',  Component: SuratKepegawaian },
    ],
  },
]);