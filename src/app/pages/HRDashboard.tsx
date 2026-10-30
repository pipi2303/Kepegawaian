import React from 'react';
import { LayoutDashboard, RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import http from '../lib/http';

// ── Types ─────────────────────────────────────────────────────────────────────

type DashboardData = {
  headcount: {
    total_aktif: number;
    komposisi: Record<string, number>;
    trend: { bulan: string; aktif: number }[];
  };
  turnover: { rate_persen: number; exit_12bulan: number; alasan_top: Record<string, number> };
  absenteeism: { rate_persen: number; alpha_bulanini: number };
  training: { jam_realisasi: number; jam_target: number; pct_tercapai: number };
  oppe: { pct_compliance: number; selesai: number; total: number; periode: string };
  wisn_gap: { unit_kerja: string; jabatan_kategori: string; kebutuhan_sdmk: number; jumlah_aktual: number; wisn_ratio: number }[];
  lisensi_expiry: { str: number; sip: number; dok: number };
  biaya_sdm: { gaji: number; tpp: number; lembur: number; total: number };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtBillion = (n: number) =>
  `Rp ${(n / 1_000_000_000).toFixed(2)} M`;

const pct = (n: number) => `${n.toFixed(1)}%`;

const now = new Date();
const REFRESH_MS = 300_000; // 5 minutes

// ── Traffic light helpers ─────────────────────────────────────────────────────

const turnoverColor = (r: number) =>
  r < 10 ? 'text-green-600' : r < 20 ? 'text-yellow-600' : 'text-red-600';

const absenColor = (r: number) =>
  r < 2 ? 'text-green-600' : r < 5 ? 'text-yellow-600' : 'text-red-600';

const trainColor = (r: number) =>
  r >= 90 ? 'text-green-600' : r >= 60 ? 'text-yellow-600' : 'text-red-600';

const oppeColor = (r: number) =>
  r >= 90 ? 'text-green-600' : r >= 70 ? 'text-yellow-600' : 'text-red-600';

// ── Component ─────────────────────────────────────────────────────────────────

export default function HRDashboard() {
  const {
    data,
    isLoading,
    dataUpdatedAt,
    refetch,
    isFetching,
  } = useQuery<DashboardData>({
    queryKey: ['hr-dashboard'],
    queryFn: () => http.get('/hr-dashboard').then(r => r.data),
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6 text-gray-400">Data tidak tersedia</div>;

  const {
    headcount,
    turnover,
    absenteeism,
    training,
    oppe,
    wisn_gap,
    lisensi_expiry,
    biaya_sdm,
  } = data;

  const totalLisensi = lisensi_expiry.str + lisensi_expiry.sip + lisensi_expiry.dok;
  const wisnUnderstaffed = wisn_gap.filter(w => w.wisn_ratio < 1);

  const komposisiKeys = Object.keys(headcount.komposisi);
  const komposisiTotal = komposisiKeys.reduce((s, k) => s + headcount.komposisi[k], 0);

  const turnoverAlasan = Object.entries(turnover.alasan_top).sort((a, b) => b[1] - a[1]);
  const maxAlasan = Math.max(...turnoverAlasan.map(([, v]) => v), 1);

  const trendList = headcount.trend.slice(-12);
  const maxTrend = Math.max(...trendList.map(t => t.aktif), 1);

  const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString('id-ID') : '—';

  // ── KPI Cards config ──────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Analytics Dashboard</h1>
            <p className="text-xs text-gray-400">Data per {updatedAt}</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white disabled:opacity-50 bg-white shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Grid — 4 columns, 2 rows = 8 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Headcount */}
        <KPICard title="Total SDM Aktif">
          <p className="text-4xl font-bold text-slate-800">{headcount.total_aktif.toLocaleString('id-ID')}</p>
          <div className="mt-3 space-y-1.5">
            {komposisiKeys.map(k => (
              <div key={k} className="space-y-0.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{k}</span>
                  <span className="font-medium">{headcount.komposisi[k]}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full"
                    style={{ width: `${(headcount.komposisi[k] / komposisiTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </KPICard>

        {/* 2. Turnover */}
        <KPICard title="Turnover Rate">
          <p className={`text-4xl font-bold ${turnoverColor(turnover.rate_persen)}`}>
            {pct(turnover.rate_persen)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{turnover.exit_12bulan} exit dalam 12 bulan</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {turnover.rate_persen < 10
              ? <><TrendingDown className="w-3 h-3 text-green-500" /><span className="text-green-600">Di bawah ambang</span></>
              : <><TrendingUp className="w-3 h-3 text-red-500" /><span className="text-red-600">Perlu perhatian</span></>
            }
          </div>
        </KPICard>

        {/* 3. Absenteeism */}
        <KPICard title="Absenteeism Rate">
          <p className={`text-4xl font-bold ${absenColor(absenteeism.rate_persen)}`}>
            {pct(absenteeism.rate_persen)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{absenteeism.alpha_bulanini} alpha bulan ini</p>
        </KPICard>

        {/* 4. Training */}
        <KPICard title="Training Hours">
          <p className={`text-4xl font-bold ${trainColor(training.pct_tercapai)}`}>
            {pct(training.pct_tercapai)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {training.jam_realisasi.toLocaleString('id-ID')} / {training.jam_target.toLocaleString('id-ID')} jam
          </p>
          <ProgressBar value={training.pct_tercapai} color="bg-blue-500" />
        </KPICard>

        {/* 5. OPPE */}
        <KPICard title="OPPE Compliance">
          <p className={`text-4xl font-bold ${oppeColor(oppe.pct_compliance)}`}>
            {pct(oppe.pct_compliance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{oppe.selesai}/{oppe.total} · {oppe.periode}</p>
          <ProgressBar value={oppe.pct_compliance} color="bg-indigo-500" />
        </KPICard>

        {/* 6. Lisensi Expiry */}
        <KPICard title="Lisensi Akan Expired">
          <p className={`text-4xl font-bold ${totalLisensi > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {totalLisensi}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            {[['STR', lisensi_expiry.str], ['SIP', lisensi_expiry.sip], ['Dok', lisensi_expiry.dok]].map(([label, val]) => (
              <div key={label} className={`rounded-lg py-1 ${Number(val) > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400'}`}>
                <p className="text-xs font-medium">{label}</p>
                <p className="text-sm font-bold">{val}</p>
              </div>
            ))}
          </div>
        </KPICard>

        {/* 7. Biaya SDM */}
        <KPICard title="Biaya SDM Bulan Ini">
          <p className="text-2xl font-bold text-slate-800">{fmtBillion(biaya_sdm.total)}</p>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            {[['Gaji', biaya_sdm.gaji], ['TPP', biaya_sdm.tpp], ['Lembur', biaya_sdm.lembur]].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span>{label}</span>
                <span className="font-medium text-gray-700">{fmtRp(Number(val))}</span>
              </div>
            ))}
          </div>
        </KPICard>

        {/* 8. WISN Gap */}
        <KPICard title="Unit Kekurangan SDM">
          <p className={`text-4xl font-bold ${wisnUnderstaffed.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {wisnUnderstaffed.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">dari {wisn_gap.length} unit analisis</p>
          {wisnUnderstaffed.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="w-3 h-3" />
              <span>Perlu rekrutmen</span>
            </div>
          )}
        </KPICard>
      </div>

      {/* Bottom section — 3 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Headcount Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Tren Headcount (12 Bulan)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">Bulan</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 font-medium">Aktif</th>
                  <th className="px-4 py-2 text-xs text-gray-500 font-medium">Grafik</th>
                </tr>
              </thead>
              <tbody>
                {trendList.map((t, i) => {
                  const isLast = i === trendList.length - 1;
                  const barW = Math.round((t.aktif / maxTrend) * 100);
                  return (
                    <tr
                      key={t.bulan}
                      className={`border-b border-gray-50 ${isLast ? 'bg-slate-50 font-semibold' : ''}`}
                    >
                      <td className={`px-4 py-2 text-xs ${isLast ? 'text-slate-800' : 'text-gray-600'}`}>{t.bulan}</td>
                      <td className={`px-4 py-2 text-right text-xs tabular-nums ${isLast ? 'text-slate-800' : 'text-gray-700'}`}>
                        {t.aktif.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-2 w-40">
                        <div className="h-4 bg-gray-100 rounded overflow-hidden">
                          <div
                            className={`h-full rounded ${isLast ? 'bg-slate-600' : 'bg-slate-300'}`}
                            style={{ width: `${barW}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column — Turnover reasons + WISN */}
        <div className="space-y-6">
          {/* Turnover Reasons */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Alasan Turnover</h2>
            </div>
            <div className="p-4 space-y-3">
              {turnoverAlasan.length === 0 ? (
                <p className="text-xs text-gray-400">Tidak ada data</p>
              ) : (
                turnoverAlasan.map(([alasan, count]) => (
                  <div key={alasan} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span className="truncate pr-2">{alasan}</span>
                      <span className="font-semibold shrink-0">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-500 rounded-full"
                        style={{ width: `${(count / maxAlasan) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* WISN Critical Units */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Unit Kekurangan SDM (Top 5)</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {wisnUnderstaffed.length === 0 ? (
                <p className="p-4 text-xs text-green-600">Semua unit terpenuhi</p>
              ) : (
                wisnUnderstaffed
                  .sort((a, b) => a.wisn_ratio - b.wisn_ratio)
                  .slice(0, 5)
                  .map(w => {
                    const gap = w.kebutuhan_sdmk - w.jumlah_aktual;
                    return (
                      <div key={`${w.unit_kerja}-${w.jabatan_kategori}`} className="px-4 py-3">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{w.unit_kerja}</p>
                            <p className="text-xs text-gray-400">{w.jabatan_kategori}</p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              -{gap}
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {w.jumlah_aktual}/{w.kebutuhan_sdmk}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-400 rounded-full"
                            style={{ width: `${Math.min((w.jumlah_aktual / w.kebutuhan_sdmk) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          WISN ratio: {w.wisn_ratio.toFixed(2)}
                        </p>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── File-local helpers ────────────────────────────────────────────────────────

function KPICard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
