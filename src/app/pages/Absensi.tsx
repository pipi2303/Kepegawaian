import React, { useState } from 'react';
import { Clock, Filter, Download, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { dataAbsensi } from '../data/mockData';

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  'Hadir': { label: 'Hadir', color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
  'Izin': { label: 'Izin', color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' },
  'Sakit': { label: 'Sakit', color: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
  'Cuti': { label: 'Cuti', color: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-500' },
  'Alpha': { label: 'Alpha', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
  'Libur': { label: 'Libur', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' },
  'Dinas Luar': { label: 'Dinas Luar', color: 'text-indigo-700', bg: 'bg-indigo-100', dot: 'bg-indigo-500' },
};

const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Generate mock monthly data
const generateMonthData = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const records: Record<string, string> = {};
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      records[day] = 'Libur';
    } else if (day < 3) {
      records[day] = Math.random() > 0.1 ? 'Hadir' : 'Alpha';
    } else if (day === 3) {
      records[day] = 'Hadir'; // today
    }
  }
  return records;
};

export default function Absensi() {
  const { pegawai: dataPegawai } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState(2); // March = 2
  const [selectedYear, setSelectedYear] = useState(2026);
  const [filterUnit, setFilterUnit] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeView, setActiveView] = useState<'table' | 'rekap'>('table');

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  // Stats for today (2026-03-02)
  const todayStr = '2026-03-02';
  const todayRecords = dataAbsensi.filter(a => a.tanggal === todayStr);

  const statusCounts = {
    hadir: todayRecords.filter(a => a.status === 'Hadir').length,
    sakit: todayRecords.filter(a => a.status === 'Sakit').length,
    cuti: todayRecords.filter(a => a.status === 'Cuti').length,
    alpha: todayRecords.filter(a => a.status === 'Alpha').length,
    dinasLuar: todayRecords.filter(a => a.status === 'Dinas Luar').length,
  };

  const getPegawai = (id: string) => dataPegawai.find(p => p.id === id);

  const filteredRecords = todayRecords.filter(a => {
    const p = getPegawai(a.pegawaiId);
    const matchUnit = !filterUnit || p?.unitKerja === filterUnit;
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchUnit && matchStatus;
  });

  // Rekap bulanan per pegawai
  const rekapData = dataPegawai.slice(0, 10).map(p => {
    const hadir = Math.floor(Math.random() * 10) + 14;
    const sakit = Math.floor(Math.random() * 2);
    const cuti = Math.floor(Math.random() * 3);
    const alpha = Math.floor(Math.random() * 1);
    const libur = 8;
    const total = hadir + sakit + cuti + alpha;
    return { ...p, hadir, sakit, cuti, alpha, libur, total };
  });

  const uniqueUnits = [...new Set(dataPegawai.map(p => p.unitKerja))].sort();

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">Presensi & Absensi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Senin, 2 Maret 2026 · RSUD Abdul Moeloek
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export Rekap
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Clock className="w-4 h-4" /> Input Kehadiran
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Hadir', value: statusCounts.hadir, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Sakit', value: statusCounts.sakit, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
          { label: 'Cuti', value: statusCounts.cuti, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
          { label: 'Alpha', value: statusCounts.alpha, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
          { label: 'Dinas Luar', value: statusCounts.dinasLuar, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.bg}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">orang</p>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => setActiveView('table')}
              className={`px-4 py-2 text-sm transition-colors ${activeView === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Data Harian
            </button>
            <button
              onClick={() => setActiveView('rekap')}
              className={`px-4 py-2 text-sm transition-colors ${activeView === 'rekap' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Rekap Bulanan
            </button>
          </div>

          {activeView === 'rekap' && (
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-32 text-center">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={filterUnit}
              onChange={e => setFilterUnit(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Unit</option>
              {uniqueUnits.map(u => <option key={u} value={u}>{u.replace('Instalasi ', '').replace('Sub Bagian ', '')}</option>)}
            </select>
            {activeView === 'table' && (
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Table View */}
        {activeView === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nama Pegawai</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Unit Kerja</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Jam Masuk</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Jam Keluar</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.map((a, i) => {
                  const p = getPegawai(a.pegawaiId);
                  const sc = statusConfig[a.status];
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {p?.gelarDepan || ''} {p?.nama}{p?.gelarBelakang ? `, ${p?.gelarBelakang}` : ''}
                          </p>
                          <p className="text-xs text-gray-400">{p?.jabatan}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-xs text-gray-600">{p?.unitKerja}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-sm font-medium ${a.jamMasuk ? 'text-gray-800' : 'text-gray-300'}`}>
                          {a.jamMasuk || '—'}
                        </span>
                        {a.jamMasuk && a.jamMasuk > '08:00' && (
                          <span className="ml-1 text-xs text-orange-500">Terlambat</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-sm font-medium ${a.jamKeluar ? 'text-gray-800' : 'text-gray-300'}`}>
                          {a.jamKeluar || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-gray-500">{a.keterangan || '—'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rekap View */}
        {activeView === 'rekap' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50">Nama Pegawai</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-green-600">Hadir</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-yellow-600">Sakit</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-purple-600">Cuti</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-indigo-600">Dinas Luar</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-red-600">Alpha</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Libur</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Terlambat</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">% Hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rekapData.map((r, i) => {
                  const persen = Math.round((r.hadir / (r.total || 1)) * 100);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5 sticky left-0 bg-white">
                        <p className="text-sm font-medium text-gray-800">{r.nama}</p>
                        <p className="text-xs text-gray-400">{r.nip}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-green-600">{r.hadir}</td>
                      <td className="px-4 py-3.5 text-center text-yellow-600">{r.sakit}</td>
                      <td className="px-4 py-3.5 text-center text-purple-600">{r.cuti}</td>
                      <td className="px-4 py-3.5 text-center text-indigo-600">{Math.floor(Math.random() * 2)}</td>
                      <td className="px-4 py-3.5 text-center text-red-600">{r.alpha}</td>
                      <td className="px-4 py-3.5 text-center text-gray-400">{r.libur}</td>
                      <td className="px-4 py-3.5 text-center text-orange-600">{Math.floor(Math.random() * 4)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${persen >= 95 ? 'bg-green-500' : persen >= 85 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${persen}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-10">{persen}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Keterlambatan Info */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800">Informasi Disiplin Kehadiran</p>
            <p className="text-xs text-orange-600 mt-1">
              Berdasarkan PP No. 94 Tahun 2021 tentang Disiplin PNS: Pegawai yang tidak masuk kerja tanpa keterangan dapat dikenakan hukuman disiplin. 
              Alpha/tidak hadir tanpa keterangan selama 5 hari kerja berturut-turut dikenakan hukuman disiplin tingkat ringan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}