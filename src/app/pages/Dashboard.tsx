import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, Clock, CalendarDays, TrendingUp, Target, AlertCircle,
  UserCheck, UserX, Building2, ArrowRight, ChevronRight, Award,
} from 'lucide-react';
import { dataPegawai, dataAbsensi, dataCuti, dataKenaikanPangkat, chartKehadiran, chartGolongan, chartUnitKerja } from '../data/mockData';
import { ChartSkeleton } from '../components/ChartSkeleton';

// Lazy load Recharts wrapper
const RechartsWrapper = lazy(() => import('../components/RechartsWrapper'));

export default function Dashboard() {
  const navigate = useNavigate();

  // Stats
  const totalPegawai = dataPegawai.length;
  const pegawaiAktif = dataPegawai.filter(p => p.statusAktif === 'Aktif').length;
  const pegawaiCuti = dataPegawai.filter(p => p.statusAktif === 'Cuti').length;

  const today = '2026-03-03';
  const thisMonth = '2026-03';
  const hadirHariIni = dataAbsensi.filter(a => a.tanggal === today && a.status === 'Hadir').length;
  const alphaHariIni = dataAbsensi.filter(a => a.tanggal === today && a.status === 'Alpha').length;

  const cutiPending = dataCuti.filter(c => c.status === 'Pending').length;
  const cutiDisetujuiBulanIni = dataCuti.filter(c => c.status === 'Disetujui' && c.tanggalMulai.startsWith(thisMonth)).length;

  const kpProses = dataKenaikanPangkat.filter(k => k.status === 'Proses').length;

  const akanPensiun2Thn = dataPegawai.filter(p => {
    const pensiun = new Date(p.batasPensiun);
    const now = new Date(today);
    const diff = (pensiun.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diff <= 2 && diff > 0;
  }).length;

  // Quick Actions
  const quickActions = [
    { label: 'Data Pegawai', icon: Users, path: '/pegawai', color: 'bg-blue-600' },
    { label: 'Absensi', icon: Clock, path: '/absensi', color: 'bg-green-600' },
    { label: 'Cuti', icon: CalendarDays, path: '/cuti', color: 'bg-orange-600' },
    { label: 'Kenaikan Pangkat', icon: TrendingUp, path: '/kenaikan-pangkat', color: 'bg-purple-600' },
    { label: 'SKP', icon: Target, path: '/skp', color: 'bg-indigo-600' },
  ];

  // Recent activities
  const recentActivities = [
    { id: 1, text: 'Pengajuan cuti Dewi Kusumawardani disetujui', time: '5 menit lalu', type: 'cuti' },
    { id: 2, text: 'Kenaikan pangkat Wahyu Hidayat periode April 2026', time: '1 jam lalu', type: 'pangkat' },
    { id: 3, text: 'Absensi hari ini: 215 hadir dari 219 pegawai', time: '2 jam lalu', type: 'absensi' },
    { id: 4, text: 'SKP Semester 1 2026 untuk 12 pegawai telah ditetapkan', time: '1 hari lalu', type: 'skp' },
  ];

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-800">Dashboard HR APP</h1>
        <p className="text-sm text-gray-500 mt-0.5">RSUD Abdul Moeloek · Selasa, 3 Maret 2026</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Pegawai</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{totalPegawai}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> {pegawaiAktif} aktif
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">Hadir Hari Ini</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{hadirHariIni}</p>
              <p className="text-xs text-gray-500 mt-1">{totalPegawai - hadirHariIni - alphaHariIni} izin/sakit</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">Pengajuan Cuti</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{cutiPending}</p>
              <p className="text-xs text-yellow-600 mt-1">Menunggu approval</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">Kenaikan Pangkat</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{kpProses}</p>
              <p className="text-xs text-purple-600 mt-1">Periode April 2026</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {akanPensiun2Thn > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Peringatan: {akanPensiun2Thn} pegawai akan memasuki batas pensiun dalam 2 tahun ke depan
            </p>
            <p className="text-xs text-red-600 mt-1">
              Perlu dilakukan perencanaan suksesi dan regenerasi pegawai untuk posisi-posisi strategis.
            </p>
          </div>
          <button
            onClick={() => navigate('/pegawai')}
            className="text-xs text-red-700 hover:text-red-800 font-medium whitespace-nowrap"
          >
            Lihat Detail →
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {quickActions.map(action => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Kehadiran Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-800 mb-4">Statistik Kehadiran (6 Bulan Terakhir)</h3>
          <Suspense fallback={<ChartSkeleton height={280} />}>
            <RechartsWrapper
              type="line"
              data={chartKehadiran}
              xKey="bulan"
              lines={[
                { dataKey: 'hadir', stroke: '#10b981', name: 'Hadir' },
                { dataKey: 'cuti', stroke: '#f59e0b', name: 'Cuti' },
                { dataKey: 'sakit', stroke: '#3b82f6', name: 'Sakit' },
                { dataKey: 'alpha', stroke: '#ef4444', name: 'Alpha' },
              ]}
              height={280}
            />
          </Suspense>
        </div>

        {/* Golongan Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-800 mb-4">Distribusi Golongan Pegawai</h3>
          <Suspense fallback={<ChartSkeleton height={280} />}>
            <RechartsWrapper
              type="pie"
              data={chartGolongan}
              dataKey="jumlah"
              nameKey="golongan"
              innerRadius={60}
              outerRadius={100}
              colors={['#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a5f']}
              height={280}
            />
          </Suspense>
        </div>
      </div>

      {/* Recent Activities & Unit Kerja */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-gray-800">Aktivitas Terbaru</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivities.map(activity => (
              <div key={activity.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                    activity.type === 'cuti' ? 'bg-orange-400' :
                    activity.type === 'pangkat' ? 'bg-purple-400' :
                    activity.type === 'absensi' ? 'bg-green-400' :
                    'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 text-center">
            <button className="text-xs text-blue-600 hover:underline">Lihat Semua Aktivitas</button>
          </div>
        </div>

        {/* Unit Kerja Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-800 mb-4">Distribusi Unit Kerja (Top 5)</h3>
          <Suspense fallback={<ChartSkeleton height={280} />}>
            <RechartsWrapper
              type="bar"
              data={chartUnitKerja.slice(0, 5)}
              xKey="name"
              yKey="value"
              colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']}
              height={280}
              radius={[8, 8, 0, 0]}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}