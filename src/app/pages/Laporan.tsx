import React, { useState } from 'react';
import { FileBarChart2, Download, Printer, Calendar, Users, TrendingUp, Target, Clock, Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { dataPegawai, chartKehadiran, chartGolongan, chartUnitKerja, dataSKP, dataKenaikanPangkat } from '../data/mockData';

const COLORS = ['#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

const jenjangData = [
  { jenjang: 'SD', jumlah: 0 },
  { jenjang: 'SMA/SMK', jumlah: 3 },
  { jenjang: 'D3', jumlah: 48 },
  { jenjang: 'D4', jumlah: 12 },
  { jenjang: 'S1', jumlah: 89 },
  { jenjang: 'Profesi', jumlah: 45 },
  { jenjang: 'Spesialis', jumlah: 22 },
  { jenjang: 'S2', jumlah: 29 },
];

const trendKPData = [
  { tahun: '2020', reguler: 12, fungsional: 18 },
  { tahun: '2021', reguler: 15, fungsional: 22 },
  { tahun: '2022', reguler: 10, fungsional: 19 },
  { tahun: '2023', reguler: 14, fungsional: 25 },
  { tahun: '2024', reguler: 11, fungsional: 20 },
  { tahun: '2025', reguler: 8, fungsional: 17 },
];

const skpDistribusi = [
  { predikat: 'Sangat Baik', jumlah: 42, percent: 35 },
  { predikat: 'Baik', jumlah: 68, percent: 56 },
  { predikat: 'Cukup', jumlah: 8, percent: 7 },
  { predikat: 'Kurang', jumlah: 2, percent: 2 },
];

const jenisKelaminData = [
  { name: 'Laki-laki', value: dataPegawai.filter(p => p.jenisKelamin === 'L').length },
  { name: 'Perempuan', value: dataPegawai.filter(p => p.jenisKelamin === 'P').length },
];

const usiaData = [
  { range: '< 30', jumlah: 18 },
  { range: '30-35', jumlah: 32 },
  { range: '36-40', jumlah: 28 },
  { range: '41-45', jumlah: 35 },
  { range: '46-50', jumlah: 42 },
  { range: '51-55', jumlah: 38 },
  { range: '> 55', jumlah: 10 },
];

const reportTypes = [
  { id: 'kepegawaian', label: 'Laporan Kepegawaian', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { id: 'kehadiran', label: 'Laporan Kehadiran', icon: Clock, color: 'text-green-600 bg-green-50' },
  { id: 'cuti', label: 'Laporan Cuti', icon: Calendar, color: 'text-orange-600 bg-orange-50' },
  { id: 'kenaikan', label: 'Laporan Kenaikan Pangkat', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  { id: 'skp', label: 'Laporan SKP', icon: Target, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'pensiun', label: 'Proyeksi Pensiun', icon: Award, color: 'text-red-600 bg-red-50' },
];

export default function Laporan() {
  const [activeReport, setActiveReport] = useState('kepegawaian');

  const totalPNS = dataPegawai.filter(p => p.statusPegawai === 'PNS').length;
  const totalPPPK = dataPegawai.filter(p => p.statusPegawai === 'PPPK').length;
  const akanPensiun2Thn = dataPegawai.filter(p => {
    const pensiun = new Date(p.batasPensiun);
    const now = new Date('2026-03-03');
    const diff = (pensiun.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diff <= 2 && diff > 0;
  }).length;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">Laporan & Statistik</h1>
          <p className="text-sm text-gray-500 mt-0.5">RSUD Abdul Moeloek · Periode Maret 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" /> Cetak
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" /> Export Laporan
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {reportTypes.map(rt => (
          <button
            key={rt.id}
            onClick={() => setActiveReport(rt.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
              activeReport === rt.id
                ? 'border-blue-300 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeReport === rt.id ? rt.color : 'text-gray-400 bg-gray-50'}`}>
              <rt.icon className="w-4 h-4" />
            </div>
            <span className={`text-xs text-center leading-tight ${activeReport === rt.id ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
              {rt.label}
            </span>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {activeReport === 'kepegawaian' && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Pegawai', value: dataPegawai.length, sub: `${totalPNS} PNS + ${totalPPPK} PPPK`, color: 'bg-blue-600' },
              { label: 'Jenis Kelamin P', value: jenisKelaminData[1].value, sub: `${Math.round((jenisKelaminData[1].value / dataPegawai.length) * 100)}% dari total`, color: 'bg-pink-500' },
              { label: 'Jenis Kelamin L', value: jenisKelaminData[0].value, sub: `${Math.round((jenisKelaminData[0].value / dataPegawai.length) * 100)}% dari total`, color: 'bg-blue-500' },
              { label: 'Akan Pensiun (2 thn)', value: akanPensiun2Thn, sub: 'Perlu perencanaan suksesi', color: 'bg-red-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`w-8 h-1 rounded-full ${s.color} mb-3`} />
                <p className="text-2xl font-semibold text-gray-800">{s.value}</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Distribusi Golongan */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-800 mb-4">Distribusi Golongan</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart id="chart-golongan" data={chartGolongan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="golongan" tick={{ fontSize: 12 }} tickFormatter={v => `Gol. ${v}`} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip key="tt-golongan" formatter={(val: any) => [`${val} pegawai`]} />
                  <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {chartGolongan.map((entry, i) => (
                      <Cell key={`cell-golongan-${i}`} fill={['#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a5f'][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribusi Jenjang Pendidikan */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-800 mb-4">Distribusi Jenjang Pendidikan</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart id="chart-jenjang" data={jenjangData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="jenjang" type="category" tick={{ fontSize: 11 }} width={65} />
                  <Tooltip key="tt-jenjang" formatter={(val: any) => [`${val} pegawai`]} />
                  <Bar dataKey="jumlah" fill="#6366f1" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gender & Unit */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-800 mb-4">Komposisi Jenis Kelamin</h3>
              <div className="flex items-center">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart id="chart-gender">
                    <Pie
                      data={jenisKelaminData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      <Cell key="cell-gender-0" fill="#3b82f6" />
                      <Cell key="cell-gender-1" fill="#ec4899" />
                    </Pie>
                    <Tooltip key="tt-gender" formatter={(val: any) => [`${val} orang`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  {jenisKelaminData.map((d, i) => (
                    <div key={d.name}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? '#3b82f6' : '#ec4899' }} />
                        <span className="text-sm text-gray-700">{d.name}</span>
                      </div>
                      <p className="text-xl font-semibold text-gray-800 ml-5">{d.value}</p>
                      <p className="text-xs text-gray-400 ml-5">{Math.round((d.value / dataPegawai.length) * 100)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribusi Usia */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-800 mb-4">Distribusi Usia Pegawai</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart id="chart-usia" data={usiaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip key="tt-usia" formatter={(val: any) => [`${val} pegawai`]} labelFormatter={l => `Usia ${l} tahun`} />
                  <Bar dataKey="jumlah" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unit Kerja Detail */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-gray-800 mb-4">Rincian Pegawai per Unit Kerja</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Unit Kerja</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">PNS</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">PPPK</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">L</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">P</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Proporsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {chartUnitKerja.map(u => (
                    <tr key={u.name} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-gray-700 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-800">{u.value}</td>
                      <td className="px-4 py-3 text-center text-blue-600">{Math.round(u.value * 0.75)}</td>
                      <td className="px-4 py-3 text-center text-green-600">{Math.round(u.value * 0.25)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{Math.round(u.value * 0.38)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{Math.round(u.value * 0.62)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(u.value / 203) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{Math.round((u.value / 203) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'kehadiran' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-gray-800 mb-4">Trend Kehadiran 7 Bulan Terakhir</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart id="chart-kehadiran" data={chartKehadiran}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip key="tt-kehadiran" />
                <Legend />
                <Bar dataKey="hadir" name="Hadir" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="sakit" name="Sakit" fill="#f59e0b" stackId="a" isAnimationActive={false} />
                <Bar dataKey="cuti" name="Cuti" fill="#8b5cf6" stackId="a" isAnimationActive={false} />
                <Bar dataKey="alpha" name="Alpha" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Rata-rata Kehadiran', value: '94.2%', sub: 'Per hari kerja', color: 'text-green-600' },
              { label: 'Total Hari Alpha', value: '56', sub: 'Sem. 2 2025', color: 'text-red-600' },
              { label: 'Total Hari Sakit', value: '267', sub: 'Sem. 2 2025', color: 'text-yellow-600' },
              { label: 'Total Hari Cuti', value: '347', sub: 'Sem. 2 2025', color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeReport === 'kenaikan' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-gray-800 mb-4">Trend Kenaikan Pangkat 2020–2025</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart id="chart-kp-trend" data={trendKPData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="tahun" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip key="tt-kp" />
                <Legend />
                <Line type="monotone" dataKey="reguler" name="KP Reguler" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="fungsional" name="KP Fungsional" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeReport === 'skp' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {skpDistribusi.map(s => (
              <div key={s.predikat} className={`rounded-xl border p-4 ${
                s.predikat === 'Sangat Baik' ? 'bg-emerald-50 border-emerald-100' :
                s.predikat === 'Baik' ? 'bg-blue-50 border-blue-100' :
                s.predikat === 'Cukup' ? 'bg-yellow-50 border-yellow-100' :
                'bg-red-50 border-red-100'
              }`}>
                <p className="text-xs text-gray-500">{s.predikat}</p>
                <p className={`text-2xl font-semibold ${
                  s.predikat === 'Sangat Baik' ? 'text-emerald-600' :
                  s.predikat === 'Baik' ? 'text-blue-600' :
                  s.predikat === 'Cukup' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>{s.jumlah}</p>
                <p className="text-xs text-gray-400">{s.percent}% pegawai</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-gray-800 mb-4">Distribusi Predikat SKP Tahun 2025</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart id="chart-skp" data={skpDistribusi}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="predikat" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip key="tt-skp" formatter={(val: any) => [`${val} pegawai`]} />
                <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {skpDistribusi.map((entry, i) => (
                    <Cell
                      key={`cell-skp-${i}`}
                      fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][i]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeReport === 'pensiun' && (
        <div className="space-y-5">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-sm font-medium text-orange-800">⚠️ Proyeksi Pensiun</p>
            <p className="text-xs text-orange-600 mt-1">Batas usia pensiun PNS: 58 tahun (jabatan fungsional madya/penyelia) dan 60 tahun (jabatan pimpinan tinggi/fungsional utama). Sumber: PP No. 11 Tahun 2017.</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-gray-800">Daftar Pegawai yang Akan Memasuki BUP (5 Tahun ke Depan)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jabatan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Unit Kerja</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Tgl. Lahir</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Batas Pensiun</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Sisa Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dataPegawai
                    .filter(p => {
                      const pensiun = new Date(p.batasPensiun);
                      const now = new Date('2026-03-03');
                      const diff = (pensiun.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                      return diff > 0 && diff <= 5;
                    })
                    .sort((a, b) => new Date(a.batasPensiun).getTime() - new Date(b.batasPensiun).getTime())
                    .map(p => {
                      const pensiun = new Date(p.batasPensiun);
                      const now = new Date('2026-03-03');
                      const diffDays = (pensiun.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                      const diffYears = diffDays / 365.25;
                      const isUrgent = diffYears <= 1;
                      return (
                        <tr key={p.id} className={`hover:bg-gray-50/60 ${isUrgent ? 'bg-red-50/30' : ''}`}>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-medium text-gray-800">{p.gelarDepan || ''} {p.nama}</p>
                            <p className="text-xs text-gray-400">Gol. {p.golongan}</p>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600">{p.jabatan}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-500">{p.unitKerja}</td>
                          <td className="px-4 py-3.5 text-center text-xs text-gray-600">
                            {new Date(p.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5 text-center text-xs text-gray-600">
                            {new Date(p.batasPensiun).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {Math.floor(diffYears)} thn {Math.floor((diffYears % 1) * 12)} bln
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {dataPegawai.filter(p => {
                const pensiun = new Date(p.batasPensiun);
                const now = new Date('2026-03-03');
                const diff = (pensiun.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                return diff > 0 && diff <= 5;
              }).length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Tidak ada pegawai yang akan pensiun dalam 5 tahun ke depan dari daftar sampel ini
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(activeReport === 'cuti') && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <FileBarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Laporan {reportTypes.find(r => r.id === activeReport)?.label} akan ditampilkan di sini</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
            <Download className="w-4 h-4" /> Generate Laporan
          </button>
        </div>
      )}
    </div>
  );
}