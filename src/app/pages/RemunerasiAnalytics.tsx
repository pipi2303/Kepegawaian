import React, { useState } from 'react';
import { TrendingUp, Info, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import http from '../lib/http';

interface ScatterPoint {
  id: number;
  nama: string;
  jabatan: string;
  unit_kerja: string;
  avg_tpp: number;
  nilai_skp?: number;
  nilai_oppe?: number;
  predikat_skp?: string;
  rek_oppe?: string;
}

interface UnitStat {
  unit_kerja: string;
  jumlah: number;
  avg_tpp?: number;
  avg_skp?: number;
  avg_oppe?: number;
  gap_tpp: number;
  wisn_ratio?: number;
  wisn_status?: string;
}

interface AnalyticsData {
  scatter: ScatterPoint[];
  unitStats: UnitStat[];
  unitList: string[];
}

const TAHUN_LIST = ['2024', '2025', '2026', '2027'];

const fmtRp = (n?: number) =>
  n != null ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n) : '—';

function alignment(point: ScatterPoint, avgTpp: number): { label: string; style: string } {
  const oppe = point.nilai_oppe ?? 0;
  const tpp = point.avg_tpp;
  if (oppe >= 75 && tpp >= avgTpp) return { label: 'Selaras', style: 'bg-emerald-100 text-emerald-700' };
  if (oppe < 60 && tpp > avgTpp) return { label: 'Perlu Review', style: 'bg-red-100 text-red-700' };
  return { label: 'Cukup', style: 'bg-gray-100 text-gray-600' };
}

function wisnStatusStyle(status?: string): string {
  if (!status) return 'text-gray-400';
  if (status === 'Kekurangan') return 'text-red-600 font-medium';
  if (status === 'Kelebihan') return 'text-blue-600 font-medium';
  return 'text-emerald-600 font-medium';
}

function GapBar({ gap, maxGap }: { gap: number; maxGap: number }) {
  const pct = maxGap > 0 ? Math.min((gap / maxGap) * 100, 100) : 0;
  const color = pct > 66 ? 'bg-red-400' : pct > 33 ? 'bg-yellow-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full min-w-[40px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-20 text-right">{fmtRp(gap)}</span>
    </div>
  );
}

export default function RemunerasiAnalytics() {
  const [filterUnit, setFilterUnit] = useState('');
  const [filterTahun, setFilterTahun] = useState('2025');

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['remunerasi-analytics', filterUnit, filterTahun],
    queryFn: () => http.get('/remunerasi/analytics', {
      params: {
        ...(filterUnit ? { unit_kerja: filterUnit } : {}),
        ...(filterTahun ? { tahun: filterTahun } : {}),
      },
    }).then(r => r.data),
    staleTime: 60000,
  });

  const unitStats: UnitStat[] = data?.unitStats ?? [];
  const scatter: ScatterPoint[] = data?.scatter ?? [];
  const unitList: string[] = data?.unitList ?? [];

  // sorted by avg_tpp desc
  const sortedScatter = [...scatter].sort((a, b) => b.avg_tpp - a.avg_tpp);
  const globalAvgTpp = scatter.length
    ? scatter.reduce((s, p) => s + p.avg_tpp, 0) / scatter.length
    : 0;

  const maxGap = Math.max(...unitStats.map(u => u.gap_tpp), 1);

  const perluReviewCount = scatter.filter(p => {
    const oppe = p.nilai_oppe ?? 0;
    return oppe < 60 && p.avg_tpp > globalAvgTpp;
  }).length;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Remunerasi Analytics</h1>
            <p className="text-sm text-gray-500">Analisis keselarasan TPP · SKP · OPPE · WISN</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-shrink-0">
          <select
            value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Unit</option>
            {unitList.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select
            value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {TAHUN_LIST.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Equity gap alert */}
      {perluReviewCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            <strong>{perluReviewCount} pegawai</strong> terdeteksi potensi kesenjangan keadilan:
            nilai OPPE di bawah 60 namun TPP di atas rata-rata. Perlu ditinjau lebih lanjut.
          </p>
        </div>
      )}

      {/* Section 1: Per-unit table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Statistik Per Unit Kerja</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Unit Kerja</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Avg TPP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Avg SKP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Avg OPPE</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Gap TPP (High–Low)</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">WISN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Memuat data...</td></tr>
              ) : unitStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <TrendingUp className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">Tidak ada data untuk filter ini</p>
                  </td>
                </tr>
              ) : unitStats.map(u => (
                <tr key={u.unit_kerja} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-800">{u.unit_kerja}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600">{u.jumlah}</td>
                  <td className="px-4 py-3.5 text-right text-sm font-medium text-indigo-700">
                    {fmtRp(u.avg_tpp)}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-center">
                    {u.avg_skp != null ? (
                      <span className={`text-xs font-semibold ${u.avg_skp >= 90 ? 'text-emerald-600' : u.avg_skp >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {u.avg_skp.toFixed(1)}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-center">
                    {u.avg_oppe != null ? (
                      <span className={`text-xs font-semibold ${u.avg_oppe >= 75 ? 'text-emerald-600' : u.avg_oppe >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {u.avg_oppe.toFixed(1)}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell min-w-[160px]">
                    <GapBar gap={u.gap_tpp} maxGap={maxGap} />
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-center">
                    {u.wisn_ratio != null ? (
                      <div>
                        <span className="text-xs font-mono">{u.wisn_ratio.toFixed(2)}</span>
                        <p className={`text-[10px] ${wisnStatusStyle(u.wisn_status)}`}>{u.wisn_status ?? '—'}</p>
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Individual scatter table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Analisis Individual (diurutkan by TPP)</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Selaras</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Cukup</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700">Perlu Review</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Unit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Avg TPP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">SKP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">OPPE</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Keselarasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Memuat data...</td></tr>
              ) : sortedScatter.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Tidak ada data individu</td>
                </tr>
              ) : sortedScatter.map(p => {
                const align = alignment(p, globalAvgTpp);
                const isAboveAvg = p.avg_tpp >= globalAvgTpp;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">{p.nama}</p>
                      <p className="text-xs text-gray-400">{p.jabatan}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-600">{p.unit_kerja}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-sm font-semibold ${isAboveAvg ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {fmtRp(p.avg_tpp)}
                      </span>
                      {isAboveAvg && (
                        <p className="text-[10px] text-indigo-400 text-right">di atas rata-rata</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-center">
                      {p.nilai_skp != null ? (
                        <div>
                          <span className={`text-xs font-semibold ${p.nilai_skp >= 90 ? 'text-emerald-600' : p.nilai_skp >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {p.nilai_skp.toFixed(1)}
                          </span>
                          {p.predikat_skp && (
                            <p className="text-[10px] text-gray-400">{p.predikat_skp}</p>
                          )}
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-center">
                      {p.nilai_oppe != null ? (
                        <div>
                          <span className={`text-xs font-semibold ${p.nilai_oppe >= 75 ? 'text-emerald-600' : p.nilai_oppe >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {p.nilai_oppe.toFixed(1)}
                          </span>
                          {p.rek_oppe && (
                            <p className="text-[10px] text-gray-400">{p.rek_oppe}</p>
                          )}
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${align.style}`}>
                        {align.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-800 space-y-1">
          <p className="font-semibold">Definisi Keselarasan</p>
          <p><strong>Selaras:</strong> OPPE ≥ 75 dan TPP ≥ rata-rata — kinerja tinggi, bayaran kompetitif.</p>
          <p><strong>Perlu Review:</strong> OPPE &lt; 60 dan TPP &gt; rata-rata — potensi kesenjangan keadilan.</p>
          <p><strong>Cukup:</strong> Kondisi lainnya — tidak ada anomali signifikan.</p>
        </div>
      </div>
    </div>
  );
}
