import React, { useState } from 'react';
import { AlertOctagon, TrendingUp, Minus, Info, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import http from '../lib/http';

type RisikoLevel = 'Tinggi' | 'Sedang';

interface BurnoutRecord {
  id: number;
  nama: string;
  jabatan: string;
  unit_kerja: string;
  skor: number;
  risiko: RisikoLevel;
  alpha_60_hari: number;
  tren_naik: boolean;
  malam_max_streak: number;
  bulan_tanpa_cuti: number;
}

interface DashboardData {
  pegawai_risiko: BurnoutRecord[];
  summary: { tinggi: number; sedang: number; total_dipantau: number; total_aktif: number };
  unit_list: string[];
}

const risikoStyle: Record<RisikoLevel, { badge: string; bar: string }> = {
  Tinggi: { badge: 'bg-red-100 text-red-700',    bar: 'bg-red-500' },
  Sedang: { badge: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-400' },
};

const KOMPONEN_INFO = [
  { label: 'Alpha 60 Hari', pct: '40%', desc: 'Tingkat ketidakhadiran dalam 60 hari terakhir' },
  { label: 'Tren Naik', pct: '20%', desc: 'Tren alpha memburuk dibanding periode sebelumnya' },
  { label: 'Shift Malam Streak', pct: '20%', desc: 'Jumlah shift malam beruntun maksimum' },
  { label: 'Bulan Tanpa Cuti', pct: '20%', desc: 'Akumulasi bulan tanpa pengambilan cuti' },
];

export default function BurnoutDashboard() {
  const [filterUnit, setFilterUnit] = useState('');

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['burnout-dashboard', filterUnit],
    queryFn: () => http.get('/burnout/dashboard', {
      params: filterUnit ? { unit_kerja: filterUnit } : {},
    }).then(r => r.data),
    staleTime: 60000,
  });

  const records = data?.pegawai_risiko ?? [];
  const summary = data?.summary ?? { tinggi: 0, sedang: 0, total_dipantau: 0, total_aktif: 0 };
  const unitList = data?.unit_list ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertOctagon className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Burnout Early Warning</h1>
            <p className="text-sm text-gray-500">Sistem deteksi dini — bukan penilaian kinerja</p>
          </div>
        </div>
        <select
          value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Semua Unit</option>
          {unitList.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {/* Disclaimer banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Perhatian:</strong> Data ini adalah indikator risiko berbasis pola kehadiran dan jadwal kerja.
          Tidak mencerminkan penilaian kinerja atau disiplin. Gunakan sebagai dasar pendekatan dukungan, bukan sanksi.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">At Risk Tinggi</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{summary.tinggi}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">At Risk Sedang</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.sedang}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Dipantau</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summary.total_dipantau}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Aktif</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summary.total_aktif}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Pegawai Terdeteksi Risiko</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-40">
                  <div className="flex items-center gap-1">
                    Skor Risiko
                    <span className="text-gray-300 font-normal">(0-100)</span>
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Alpha 60hr</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tren</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Malam Streak</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Bln Tanpa Cuti</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Risiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Memuat data...</td></tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    <p className="text-gray-500 font-medium text-sm">Tidak ada pegawai at-risk terdeteksi</p>
                    <p className="text-xs text-gray-400 mt-1">Kondisi baik — terus pantau secara berkala</p>
                  </td>
                </tr>
              ) : records.map(r => {
                const style = risikoStyle[r.risiko];
                return (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">{r.nama}</p>
                      <p className="text-xs text-gray-400">{r.jabatan} · {r.unit_kerja}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full min-w-[60px]">
                          <div
                            className={`h-full rounded-full ${style.bar}`}
                            style={{ width: `${Math.min(r.skor, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8">{r.skor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-center">
                      <span className={`text-xs font-semibold ${r.alpha_60_hari >= 10 ? 'text-red-600' : r.alpha_60_hari >= 5 ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {r.alpha_60_hari}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-center">
                      {r.tren_naik
                        ? <TrendingUp className="w-4 h-4 text-red-500 mx-auto" />
                        : <Minus className="w-4 h-4 text-gray-400 mx-auto" />
                      }
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-center text-sm text-gray-700">
                      {r.malam_max_streak}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-center text-sm text-gray-700">
                      {r.bulan_tanpa_cuti}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
                        {r.risiko}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scoring info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="w-full">
            <p className="text-xs font-semibold text-gray-700 mb-2">Komponen Skor Risiko</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {KOMPONEN_INFO.map(k => (
                <div key={k.label} className="bg-white border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{k.label}</span>
                    <span className="text-xs font-bold text-orange-600">{k.pct}</span>
                  </div>
                  <p className="text-xs text-gray-500">{k.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
