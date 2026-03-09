import React, { useMemo } from 'react';
import {
  CheckCircle2, AlertTriangle, AlertCircle, TrendingUp,
  Calendar, BarChart2, Target, Star, Clock, UserCheck,
  Activity, Award,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import {
  okrObjectives, performanceReviews,
} from '../data/performanceData';
import type { Pegawai } from '../types';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const RATING_CONFIG = {
  A: { label: 'Sangat Baik',   color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', range: '91–100' },
  B: { label: 'Baik',          color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-300',    range: '76–90'  },
  C: { label: 'Cukup',         color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-300',   range: '61–75'  },
  D: { label: 'Kurang',        color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-300',  range: '46–60'  },
  E: { label: 'Sangat Kurang', color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-300',     range: '≤45'    },
};

const ratingFromScore = (s: number): keyof typeof RATING_CONFIG =>
  s >= 91 ? 'A' : s >= 76 ? 'B' : s >= 61 ? 'C' : s >= 46 ? 'D' : 'E';

const scoreColor = (s: number) =>
  s >= 85 ? 'text-emerald-600' : s >= 75 ? 'text-blue-600' : s >= 65 ? 'text-amber-600' : 'text-red-600';

const progressColor = (p: number) =>
  p >= 80 ? 'bg-emerald-500' : p >= 60 ? 'bg-blue-500' : p >= 40 ? 'bg-amber-500' : 'bg-red-500';

const ProgressBar = ({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) => (
  <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
    <div className={`h-full rounded-full ${progressColor(value)}`} style={{ width: `${Math.min(100, value)}%` }} />
  </div>
);

// Generate deterministic mock performance score based on pegawaiId
const mockScore = (id: string, offset: number = 0): number => {
  const seed = id.replace('P', '').replace(/\D/g, '');
  const n = parseInt(seed || '1', 10);
  return Math.min(98, Math.max(55, 72 + (n % 20) - 10 + offset));
};

// OKR progress helper
const okrProgress = (obj: typeof okrObjectives[0]): number => {
  if (!obj.keyResults.length) return 0;
  const total = obj.keyResults.reduce((sum, kr) => {
    const range = Math.abs(kr.targetValue - kr.startValue);
    if (range === 0) return sum + 100;
    return sum + Math.min(100, Math.round((Math.abs(kr.currentValue - kr.startValue) / range) * 100));
  }, 0);
  return Math.round(total / obj.keyResults.length);
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface Props {
  pegawai: Pegawai;
}

export function MyPerformanceTab({ pegawai: pg }: Props) {
  const { absensi: allAbsensi, skp: allSKP } = useAppContext();

  // ── 1. Attendance from real data ──────────────────────────────────────────
  const attendanceStats = useMemo(() => {
    const records = allAbsensi.filter(a => a.pegawaiId === pg.id);
    if (!records.length) {
      // Generate plausible mock for pegawai with no real absensi data
      const base = mockScore(pg.id, 10);
      const total = 22; // typical working days/month
      const hadir = Math.round(total * (base / 100));
      return {
        hadir, sakit: Math.max(0, total - hadir - 1), izin: 1, alpha: 0, cuti: 0, total,
        rate: base,
        isReal: false,
      };
    }
    const hadir = records.filter(r => r.status === 'Hadir' || r.status === 'Dinas Luar').length;
    const sakit = records.filter(r => r.status === 'Sakit').length;
    const izin = records.filter(r => r.status === 'Izin').length;
    const alpha = records.filter(r => r.status === 'Alpha').length;
    const cuti = records.filter(r => r.status === 'Cuti').length;
    const total = records.filter(r => r.status !== 'Libur').length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { hadir, sakit, izin, alpha, cuti, total, rate, isReal: true };
  }, [allAbsensi, pg.id]);

  // ── 2. SKP Score ──────────────────────────────────────────────────────────
  const skpData = useMemo(() => {
    const records = allSKP.filter(s => s.pegawaiId === pg.id && s.nilaiAkhir);
    if (!records.length) return { latest: mockScore(pg.id), avg: mockScore(pg.id), isReal: false };
    const sorted = [...records].sort((a, b) => (b.tahun * 2 + b.semester) - (a.tahun * 2 + a.semester));
    const latest = sorted[0].nilaiAkhir ?? mockScore(pg.id);
    const avg = Math.round(records.reduce((s, r) => s + (r.nilaiAkhir ?? 0), 0) / records.length);
    return { latest, avg, isReal: true };
  }, [allSKP, pg.id]);

  // ── 3. OKR Data ───────────────────────────────────────────────────────────
  const myOKRs = useMemo(() =>
    okrObjectives.filter(o => o.ownerId === pg.id),
    [pg.id]
  );
  const avgOKRProgress = myOKRs.length
    ? Math.round(myOKRs.reduce((s, o) => s + okrProgress(o), 0) / myOKRs.length)
    : null;

  // ── 4. Review History ─────────────────────────────────────────────────────
  const myReviews = useMemo(() =>
    performanceReviews.filter(r => r.revieweeId === pg.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [pg.id]
  );

  // ── 5. Overall Final Score Calculation ───────────────────────────────────
  const finalScore = useMemo(() => {
    if (myReviews.length > 0) return myReviews[0].finalScore;
    // Compute from available data
    const skpW = 0.40, attendW = 0.35, okrW = 0.25;
    const okrVal = avgOKRProgress !== null ? avgOKRProgress : mockScore(pg.id, 5);
    return Math.round(skpData.latest * skpW + attendanceStats.rate * attendW + okrVal * okrW);
  }, [myReviews, skpData, attendanceStats, avgOKRProgress, pg.id]);

  const rating = ratingFromScore(finalScore);
  const rCfg = RATING_CONFIG[rating];

  // ── 6. 3-Year Performance Trend ───────────────────────────────────────────
  const trendData = useMemo(() => {
    const base = mockScore(pg.id);
    const periods = [
      { period: 'S1 2023', skp: base - 8 }, { period: 'S2 2023', skp: base - 6 },
      { period: 'S1 2024', skp: base - 4 }, { period: 'S2 2024', skp: base - 2 },
      { period: 'S1 2025', skp: base - 1 }, { period: 'S2 2025', skp: base     },
      { period: 'Q1 2026', skp: finalScore },
    ];
    // Overlay actual SKP data if available
    const skpMap: Record<string, number> = {};
    allSKP.filter(s => s.pegawaiId === pg.id && s.nilaiAkhir).forEach(s => {
      const key = `S${s.semester} ${s.tahun}`;
      skpMap[key] = s.nilaiAkhir!;
    });
    return periods.map(p => ({ ...p, skp: skpMap[p.period] ?? p.skp, overall: skpMap[p.period] ? Math.min(98, (skpMap[p.period]! + 2)) : (p.skp + Math.round(Math.sin(p.skp / 10) * 3)) }));
  }, [pg.id, allSKP, finalScore]);

  // ── 7. Radar Data ─────────────────────────────────────────────────────────
  const radarData = useMemo(() => {
    const base = mockScore(pg.id);
    return [
      { subject: 'Kehadiran',    value: attendanceStats.rate },
      { subject: 'SKP',          value: skpData.latest },
      { subject: 'OKR',          value: avgOKRProgress ?? base },
      { subject: 'Kompetensi',   value: Math.min(98, base + 3) },
      { subject: 'Perilaku',     value: Math.min(98, base - 2) },
    ];
  }, [attendanceStats, skpData, avgOKRProgress, pg.id]);

  return (
    <div className="space-y-6">
      {/* ── Score Header ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Big Score */}
          <div className={`flex-shrink-0 w-28 h-28 rounded-2xl border-2 ${rCfg.border} ${rCfg.bg} flex flex-col items-center justify-center`}>
            <span className={`text-5xl font-black ${rCfg.color}`}>{rating}</span>
            <span className={`text-xs font-medium ${rCfg.color}`}>{rCfg.range}</span>
          </div>
          <div className="flex-1">
            <p className="text-blue-200 text-sm">Skor Kinerja Personal</p>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-4xl font-black">{finalScore}</span>
              <span className="text-blue-200 text-lg mb-1">/ 100</span>
              <span className={`mb-1 text-sm font-semibold px-2 py-0.5 rounded-full ${rCfg.bg} ${rCfg.color}`}>{rCfg.label}</span>
            </div>
            <p className="text-blue-200 text-xs mt-1">Q1 2026 · {pg.jabatan} · {pg.unitKerja}</p>
            {/* Mini bars */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: 'Kehadiran', value: attendanceStats.rate, icon: Calendar },
                { label: 'SKP',       value: skpData.latest,       icon: Target },
                { label: 'OKR',       value: avgOKRProgress ?? mockScore(pg.id, 5), icon: Activity },
              ].map(m => {
                const MIcon = m.icon;
                return (
                  <div key={m.label} className="bg-white/10 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MIcon className="w-3 h-3 text-blue-200" />
                      <span className="text-xs text-blue-200">{m.label}</span>
                    </div>
                    <span className="text-lg font-bold">{m.value}%</span>
                    <ProgressBar value={m.value} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Review count */}
          {myReviews.length > 0 && (
            <div className="flex-shrink-0 text-center bg-white/10 rounded-xl p-4">
              <Award className="w-6 h-6 text-yellow-300 mx-auto mb-1" />
              <p className="text-2xl font-bold">{myReviews.length}</p>
              <p className="text-xs text-blue-200">Review Tersimpan</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 3-Year Trend Chart ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-800">Tren Kinerja 3 Tahun</h4>
              <p className="text-xs text-gray-500">SKP vs Overall Score per semester</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={40} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <ReferenceLine y={76} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Baik', fontSize: 9, fill: '#10b981' }} />
              <Line type="monotone" dataKey="skp" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="SKP" />
              <Line type="monotone" dataKey="overall" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Overall" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Radar Chart ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-800">Profil Kompetensi</h4>
              <p className="text-xs text-gray-500">5 dimensi kinerja Q1 2026</p>
            </div>
            <BarChart2 className="w-4 h-4 text-violet-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar name="Skor" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Attendance Detail ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-800">Data Kehadiran</h4>
            <p className="text-xs text-gray-500">
              {attendanceStats.isReal
                ? `Data nyata dari modul Absensi — ${attendanceStats.total} hari kerja tercatat`
                : 'Estimasi kehadiran berdasarkan catatan tersedia'}
            </p>
          </div>
          {attendanceStats.isReal && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Live Data
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Hadir',      value: attendanceStats.hadir, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: UserCheck },
            { label: 'Sakit',      value: attendanceStats.sakit, color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock },
            { label: 'Izin',       value: attendanceStats.izin,  color: 'text-blue-600',    bg: 'bg-blue-50',    icon: Calendar },
            { label: 'Cuti',       value: attendanceStats.cuti,  color: 'text-violet-600',  bg: 'bg-violet-50',  icon: Calendar },
            { label: 'Alpha',      value: attendanceStats.alpha, color: 'text-red-600',     bg: 'bg-red-50',     icon: AlertCircle },
          ].map(s => {
            const SIcon = s.icon;
            return (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                <SIcon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-gray-600">Tingkat Kehadiran:</span>
          <ProgressBar value={attendanceStats.rate} />
          <span className={`text-sm font-bold ${scoreColor(attendanceStats.rate)}`}>{attendanceStats.rate}%</span>
          {attendanceStats.rate >= 95
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            : attendanceStats.rate >= 80
            ? <AlertTriangle className="w-4 h-4 text-amber-500" />
            : <AlertCircle className="w-4 h-4 text-red-500" />}
        </div>
      </div>

      {/* ── OKR Personal ──────────────────────────────────────────────────────── */}
      {myOKRs.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-800">OKR Aktif</h4>
              <p className="text-xs text-gray-500">{myOKRs.length} objective · rata-rata progress {avgOKRProgress}%</p>
            </div>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          {myOKRs.map(obj => {
            const prog = okrProgress(obj);
            return (
              <div key={obj.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{obj.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{obj.period}</p>
                  </div>
                  <span className={`text-sm font-bold ${prog >= 70 ? 'text-emerald-600' : prog >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{prog}%</span>
                </div>
                <ProgressBar value={prog} />
                <div className="mt-2 space-y-1">
                  {obj.keyResults.map(kr => {
                    const kp = Math.min(100, Math.round((Math.abs(kr.currentValue - kr.startValue) / Math.max(1, Math.abs(kr.targetValue - kr.startValue))) * 100));
                    return (
                      <div key={kr.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="flex-1 truncate">{kr.title}</span>
                        <span className="font-medium">{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                        <span className={`w-8 text-right font-medium ${kp >= 80 ? 'text-emerald-600' : kp >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{kp}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
          <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Belum ada OKR yang ditetapkan untuk pegawai ini</p>
          <p className="text-xs text-gray-400 mt-1">OKR dapat ditetapkan di menu Performance Management</p>
        </div>
      )}

      {/* ── Review History ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-800">Riwayat Review Kinerja</h4>
            <p className="text-xs text-gray-500">{myReviews.length > 0 ? `${myReviews.length} review tercatat` : 'Belum ada review formal'}</p>
          </div>
          <Star className="w-4 h-4 text-yellow-500" />
        </div>
        {myReviews.length > 0 ? (
          <div className="space-y-3">
            {myReviews.map(rev => {
              const rc = RATING_CONFIG[rev.rating];
              return (
                <div key={rev.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${rc.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-lg font-black ${rc.color}`}>{rev.rating}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-800 text-sm">{rev.period}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${rev.status === 'Diakui' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{rev.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Reviewer: {rev.reviewerName} · {rev.createdAt}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>BSC: <b className="text-blue-600">{rev.bscScore}</b></span>
                        <span>OKR: <b className="text-violet-600">{rev.okrScore}</b></span>
                        <span>Final: <b className={scoreColor(rev.finalScore)}>{rev.finalScore}/100</b></span>
                      </div>
                      {rev.feedback && (
                        <p className="text-xs text-gray-500 mt-1.5 italic bg-gray-50 rounded-lg px-3 py-1.5">"{rev.feedback}"</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Belum ada review formal yang tersimpan</p>
            <p className="text-xs text-gray-400 mt-1">Tambahkan review di menu Performance Management → Review & Feedback</p>
          </div>
        )}
      </div>
    </div>
  );
}
