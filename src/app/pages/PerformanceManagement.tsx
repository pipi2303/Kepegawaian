import React, { useState, useMemo } from 'react';
import {
  BarChart2, Target, Map, TrendingUp, MessageSquare, Settings2,
  ChevronDown, ChevronUp, Plus, X, CheckCircle2, AlertTriangle,
  AlertCircle, Minus, Building2, User, Users, Layers,
  ArrowRight, RotateCcw, Edit3, Eye, Filter, Zap,
  Download, Loader2, Activity, Wifi,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  bscObjectives, departmentScorecards, okrObjectives,
  performanceReviews, monthlyTrendData, perspectiveRadarData,
  departmentBarData, defaultWeights,
} from '../data/performanceData';
import type {
  BSCObjective, OKRObjective, OKRKeyResult, PerformanceReview,
  IntegrationWeights, BSCPerspektiveName, OKRStatus,
} from '../types';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { KPIMatrixTab } from '../components/KPIMatrixTab';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'bsc',       label: 'BSC Dashboard',      icon: BarChart2     },
  { id: 'kpi',       label: 'KPI Matrix',          icon: Layers        },
  { id: 'okr',       label: 'OKR',                icon: Target        },
  { id: 'map',       label: 'Strategic Map',       icon: Map           },
  { id: 'analytics', label: 'Analytics',           icon: TrendingUp    },
  { id: 'review',    label: 'Review & Feedback',   icon: MessageSquare },
  { id: 'settings',  label: 'Pengaturan Integrasi',icon: Settings2     },
] as const;
type TabId = typeof TABS[number]['id'];

const PERSPEKTIF_CONFIG: Record<BSCPerspektiveName, { color: string; bg: string; border: string; icon: string }> = {
  'Financial':         { color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: '💰' },
  'Customer':          { color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    icon: '🏥' },
  'Internal Process':  { color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200',  icon: '⚙️' },
  'Learning & Growth': { color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-200',  icon: '📚' },
};

const STATUS_CONFIG = {
  'Achieved':  { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  'On Track':  { color: 'text-blue-700',    bg: 'bg-blue-100',    icon: CheckCircle2 },
  'At Risk':   { color: 'text-amber-700',   bg: 'bg-amber-100',   icon: AlertTriangle },
  'Behind':    { color: 'text-red-700',     bg: 'bg-red-100',     icon: AlertCircle },
};

const OKR_STATUS_CONFIG: Record<OKRStatus, { color: string; bg: string }> = {
  'Aktif':       { color: 'text-blue-700',    bg: 'bg-blue-100'    },
  'Selesai':     { color: 'text-emerald-700', bg: 'bg-emerald-100' },
  'Draft':       { color: 'text-gray-600',    bg: 'bg-gray-100'    },
  'Dibatalkan':  { color: 'text-red-700',     bg: 'bg-red-100'     },
};

const LEVEL_CONFIG = {
  'Organisasi': { color: 'text-purple-700',  bg: 'bg-purple-100',  icon: Building2 },
  'Divisi':     { color: 'text-blue-700',    bg: 'bg-blue-100',    icon: Layers    },
  'Tim':        { color: 'text-teal-700',    bg: 'bg-teal-100',    icon: Users     },
  'Individu':   { color: 'text-orange-700',  bg: 'bg-orange-100',  icon: User      },
};

const RATING_CONFIG = {
  A: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Sangat Baik (91–100)' },
  B: { color: 'text-blue-700',    bg: 'bg-blue-100',    label: 'Baik (76–90)' },
  C: { color: 'text-amber-700',   bg: 'bg-amber-100',   label: 'Cukup (61–75)' },
  D: { color: 'text-orange-700',  bg: 'bg-orange-100',  label: 'Kurang (46–60)' },
  E: { color: 'text-red-700',     bg: 'bg-red-100',     label: 'Sangat Kurang (≤45)' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const okrProgress = (obj: OKRObjective): number => {
  if (!obj.keyResults.length) return 0;
  const total = obj.keyResults.reduce((sum, kr) => {
    const range = Math.abs(kr.targetValue - kr.startValue);
    if (range === 0) return sum + 100;
    const achieved = Math.abs(kr.currentValue - kr.startValue);
    return sum + Math.min(100, Math.round((achieved / range) * 100));
  }, 0);
  return Math.round(total / obj.keyResults.length);
};

const krProgress = (kr: OKRKeyResult): number => {
  const range = Math.abs(kr.targetValue - kr.startValue);
  if (range === 0) return 100;
  const achieved = Math.abs(kr.currentValue - kr.startValue);
  return Math.min(100, Math.round((achieved / range) * 100));
};

const progressColor = (p: number) =>
  p >= 80 ? 'bg-emerald-500' : p >= 60 ? 'bg-blue-500' : p >= 40 ? 'bg-amber-500' : 'bg-red-500';

const scoreColor = (s: number) =>
  s >= 85 ? 'text-emerald-600' : s >= 75 ? 'text-blue-600' : s >= 65 ? 'text-amber-600' : 'text-red-600';

const ratingFromScore = (s: number): 'A' | 'B' | 'C' | 'D' | 'E' =>
  s >= 91 ? 'A' : s >= 76 ? 'B' : s >= 61 ? 'C' : s >= 46 ? 'D' : 'E';

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
const ProgressBar = ({ value, size = 'md', showLabel = true }: { value: number; size?: 'sm' | 'md'; showLabel?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
      <div
        className={`h-full rounded-full transition-all ${progressColor(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
    {showLabel && <span className="text-xs font-medium text-gray-600 w-8 text-right">{value}%</span>}
  </div>
);

// ─── BSC DASHBOARD TAB ────────────────────────────────────────────────────────
const BSCTab = () => {
  const [expandedPerspektif, setExpandedPerspektif] = useState<BSCPerspektiveName | null>('Financial');
  const { absensi: allAbsensi } = useAppContext();

  // ── Live Attendance KPI dari data absensi nyata ────────────────────────────
  const liveAttendance = useMemo(() => {
    const workRecords = allAbsensi.filter(a => a.status !== 'Libur');
    const total   = workRecords.length;
    const hadir   = allAbsensi.filter(a => a.status === 'Hadir' || a.status === 'Dinas Luar').length;
    const alpha   = allAbsensi.filter(a => a.status === 'Alpha').length;
    const sakit   = allAbsensi.filter(a => a.status === 'Sakit').length;
    const izin    = allAbsensi.filter(a => a.status === 'Izin').length;
    const rate    = total > 0 ? Math.round((hadir / total) * 100) : 0;
    const uniquePegawai = new Set(allAbsensi.map(a => a.pegawaiId)).size;
    const target  = 95;
    const status: BSCObjective['status'] =
      rate >= target       ? 'Achieved'
      : rate >= target - 5 ? 'On Track'
      : rate >= target - 10 ? 'At Risk'
      : 'Behind';
    return { rate, target, hadir, alpha, sakit, izin, total, uniquePegawai, status, isReal: total > 0 };
  }, [allAbsensi]);

  const perspektifSummary = useMemo(() => {
    const names: BSCPerspektiveName[] = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];
    return names.map(name => {
      const objs = bscObjectives.filter(o => o.perspektif === name);
      const achieved = objs.filter(o => o.status === 'Achieved').length;
      const onTrack = objs.filter(o => o.status === 'On Track').length;
      const atRisk = objs.filter(o => o.status === 'At Risk').length;
      const behind = objs.filter(o => o.status === 'Behind').length;
      const avgActual = objs.reduce((s, o) => {
        const pct = o.unit === '%' || o.unit === 'skor' || o.unit === 'poin'
          ? (o.status === 'Behind' && o.target > o.actual)
            ? (o.actual / o.target) * 100
            : Math.min(100, (o.actual / o.target) * 100)
          : Math.min(100, 100 - Math.abs(o.target - o.actual) / o.target * 100);
        return s + pct;
      }, 0) / (objs.length || 1);
      return { name, objs, achieved, onTrack, atRisk, behind, score: Math.round(avgActual) };
    });
  }, []);

  const overallScore = Math.round(perspektifSummary.reduce((s, p) => s + p.score, 0) / 4);

  return (
    <div className="space-y-6">
      {/* Overall Score Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm">Balanced Scorecard — Rumah Sakit</p>
            <h2 className="text-2xl font-bold mt-1">Skor Kinerja Organisasi Q1 2026</h2>
            <p className="text-blue-100 text-sm mt-1">4 Perspektif · 17 KPI Utama · Periode Januari–Maret 2026</p>
          </div>
          <div className="flex items-end gap-6">
            <div className="text-center">
              <p className="text-5xl font-black">{overallScore}</p>
              <p className="text-blue-200 text-sm mt-0.5">/ 100</p>
              <div className={`mt-1 px-3 py-0.5 rounded-full text-sm font-semibold inline-block ${overallScore >= 80 ? 'bg-emerald-400/30 text-emerald-100' : 'bg-amber-400/30 text-amber-100'}`}>
                Predikat {ratingFromScore(overallScore)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { label: 'Achieved', count: bscObjectives.filter(o => o.status === 'Achieved').length, color: 'text-emerald-300' },
                { label: 'On Track', count: bscObjectives.filter(o => o.status === 'On Track').length, color: 'text-blue-200' },
                { label: 'At Risk', count: bscObjectives.filter(o => o.status === 'At Risk').length, color: 'text-amber-300' },
                { label: 'Behind', count: bscObjectives.filter(o => o.status === 'Behind').length, color: 'text-red-300' },
              ].map(s => (
                <div key={s.label}>
                  <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-blue-200">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Perspective Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {perspektifSummary.map(p => {
          const cfg = PERSPEKTIF_CONFIG[p.name];
          const isExpanded = expandedPerspektif === p.name;
          return (
            <div key={p.name} className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} transition-all`}>
              <button
                className="w-full p-4 text-left"
                onClick={() => setExpandedPerspektif(isExpanded ? null : p.name)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xl">{cfg.icon}</span>
                    <p className={`text-xs font-semibold ${cfg.color} mt-1 uppercase tracking-wide`}>{p.name}</p>
                    <p className={`text-3xl font-black mt-1 ${cfg.color}`}>{p.score}</p>
                    <p className="text-xs text-gray-500">/ 100 pts</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 mt-1" />}
                </div>
                <div className="mt-3">
                  <ProgressBar value={p.score} />
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {p.achieved > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-700">{p.achieved} Achieved</span>}
                  {p.onTrack > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-200 text-blue-700">{p.onTrack} On Track</span>}
                  {p.atRisk > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-700">{p.atRisk} At Risk</span>}
                  {p.behind > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-red-200 text-red-700">{p.behind} Behind</span>}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-2 bg-white/70 rounded-b-2xl">
                  {p.objs.map(obj => {
                    const sc = STATUS_CONFIG[obj.status];
                    const pct = Math.min(100, Math.round((obj.actual / obj.target) * 100));
                    return (
                      <div key={obj.id} className="bg-white rounded-xl p-3 border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-gray-800 flex-1">{obj.title}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${sc.bg} ${sc.color}`}>
                            {obj.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{obj.kpi}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Target: <b>{obj.target}{obj.unit === '%' ? '%' : ` ${obj.unit}`}</b></span>
                            <span>Aktual: <b className={scoreColor(pct)}>{obj.actual}{obj.unit === '%' ? '%' : ` ${obj.unit}`}</b></span>
                          </div>
                          <ProgressBar value={pct} size="sm" showLabel={false} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Live Attendance KPI — hanya di perspektif Internal Process */}
                  {p.name === 'Internal Process' && (
                    <div className="bg-white rounded-xl p-3 border-2 border-violet-200 ring-1 ring-violet-100/60">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Wifi className="w-3 h-3 text-violet-500 flex-shrink-0" />
                          <p className="text-xs font-medium text-violet-900">Kehadiran Pegawai</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-semibold">LIVE</span>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_CONFIG[liveAttendance.status].bg} ${STATUS_CONFIG[liveAttendance.status].color}`}>
                          {liveAttendance.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Tingkat Kehadiran Seluruh Pegawai — Data Modul Absensi</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Target: <b>{liveAttendance.target}%</b></span>
                          <span>Aktual: <b className={liveAttendance.rate >= 90 ? 'text-emerald-600' : liveAttendance.rate >= 80 ? 'text-amber-600' : 'text-red-600'}>{liveAttendance.rate}%</b></span>
                        </div>
                        <ProgressBar value={liveAttendance.rate} size="sm" showLabel={false} />
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                        {[
                          { label: 'Hadir',     value: liveAttendance.hadir, color: 'text-emerald-600' },
                          { label: 'Sakit',     value: liveAttendance.sakit, color: 'text-amber-600' },
                          { label: 'Izin',      value: liveAttendance.izin,  color: 'text-blue-600' },
                          { label: 'Alpha',     value: liveAttendance.alpha, color: 'text-red-600' },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-50 rounded-lg p-1">
                            <p className={`text-xs font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-gray-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      {liveAttendance.isReal && (
                        <p className="text-[10px] text-violet-500 mt-1.5 flex items-center gap-1">
                          <Activity className="w-2.5 h-2.5" />
                          Real-time dari {liveAttendance.total} record · {liveAttendance.uniquePegawai} pegawai tercatat
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Department Scorecards */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Scorecard Per Divisi / Instalasi</h3>
          <p className="text-xs text-gray-500 mt-0.5">Rekap nilai 4 perspektif tiap unit kerja — Q1 2026</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Divisi / Instalasi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Kepala</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-emerald-600">Financial</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-blue-600">Customer</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-violet-600">Internal</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-orange-600">L&G</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {departmentScorecards.map(dept => (
                <tr key={dept.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800 text-sm">{dept.name}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{dept.headName}</td>
                  {[dept.financialScore, dept.customerScore, dept.internalScore, dept.learningScore].map((s, i) => (
                    <td key={i} className="px-3 py-3.5 text-center">
                      <span className={`text-sm font-semibold ${scoreColor(s)}`}>{s}</span>
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-base font-bold ${scoreColor(dept.score)}`}>{dept.score}</span>
                      <div className="w-16">
                        <ProgressBar value={dept.score} size="sm" showLabel={false} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── OKR TAB ──────────────────────────────────────────────────────────────────
const OKRTab = () => {
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterPeriod] = useState('Q1 2026');
  const [expandedId, setExpandedId] = useState<string | null>('okr-org-01');
  const [showCheckIn, setShowCheckIn] = useState<string | null>(null);
  const [checkInValue, setCheckInValue] = useState('');
  const [checkInNote, setCheckInNote] = useState('');

  const [okrData, setOkrData] = useState(okrObjectives);

  const filtered = useMemo(() =>
    okrData.filter(o =>
      (!filterLevel || o.level === filterLevel) &&
      o.period.includes('2026')
    ), [okrData, filterLevel]);

  const grouped = useMemo(() => {
    const levels: Array<typeof okrObjectives[0]['level']> = ['Organisasi', 'Divisi', 'Tim', 'Individu'];
    return levels.map(lv => ({
      level: lv,
      items: filtered.filter(o => o.level === lv),
    })).filter(g => g.items.length > 0);
  }, [filtered]);

  const handleCheckIn = (krId: string, objectiveId: string) => {
    const val = parseFloat(checkInValue);
    if (isNaN(val)) { toast.error('Masukkan nilai yang valid'); return; }
    setOkrData(prev => prev.map(obj => {
      if (obj.id !== objectiveId) return obj;
      return {
        ...obj,
        keyResults: obj.keyResults.map(kr => {
          if (kr.id !== krId) return kr;
          return {
            ...kr,
            currentValue: val,
            checkIns: [...kr.checkIns, {
              id: `ci-new-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              value: val,
              note: checkInNote,
              createdBy: 'Anda',
            }],
          };
        }),
      };
    }));
    toast.success('Check-in berhasil disimpan');
    setShowCheckIn(null); setCheckInValue(''); setCheckInNote('');
  };

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1 text-sm text-gray-500"><Filter className="w-4 h-4" /> Filter:</div>
        {['', 'Organisasi', 'Divisi', 'Tim', 'Individu'].map(lv => (
          <button
            key={lv}
            onClick={() => setFilterLevel(lv)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterLevel === lv ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {lv || 'Semua Level'}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} objective · {filterPeriod}</span>
      </div>

      {/* Grouped OKR List */}
      {grouped.map(group => {
        const lcfg = LEVEL_CONFIG[group.level];
        const LIcon = lcfg.icon;
        return (
          <div key={group.level} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${lcfg.bg}`}>
                <LIcon className={`w-4 h-4 ${lcfg.color}`} />
              </div>
              <h3 className={`font-semibold ${lcfg.color}`}>Level {group.level}</h3>
              <span className="text-xs text-gray-400">({group.items.length} OKR)</span>
            </div>

            {group.items.map(obj => {
              const prog = okrProgress(obj);
              const isExpanded = expandedId === obj.id;
              const scfg = OKR_STATUS_CONFIG[obj.status];
              return (
                <div key={obj.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors">
                  <button
                    className="w-full p-5 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : obj.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scfg.bg} ${scfg.color}`}>{obj.status}</span>
                          {obj.bscLink && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PERSPEKTIF_CONFIG[obj.bscLink].bg} ${PERSPEKTIF_CONFIG[obj.bscLink].color}`}>
                              {PERSPEKTIF_CONFIG[obj.bscLink].icon} {obj.bscLink}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{obj.period}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{obj.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{obj.ownerName}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <p className={`text-xl font-bold ${prog >= 70 ? 'text-emerald-600' : prog >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{prog}%</p>
                          <p className="text-xs text-gray-400">{obj.keyResults.length} KR</p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={prog} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/60 p-5 space-y-3">
                      <p className="text-sm text-gray-600 italic">{obj.description}</p>
                      {obj.keyResults.map(kr => {
                        const kprog = krProgress(kr);
                        const confColor = kr.confidence === 'Tinggi' ? 'text-emerald-600' : kr.confidence === 'Sedang' ? 'text-amber-600' : 'text-red-600';
                        return (
                          <div key={kr.id} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{kr.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {kr.startValue} → {kr.currentValue} / {kr.targetValue} {kr.unit}
                                  <span className={`ml-2 font-medium ${confColor}`}>● {kr.confidence}</span>
                                </p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowCheckIn(kr.id); setCheckInValue(String(kr.currentValue)); }}
                                className="flex-shrink-0 px-2.5 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                              >
                                Check-in
                              </button>
                            </div>
                            <div className="mt-2">
                              <ProgressBar value={kprog} size="sm" />
                            </div>
                            {kr.checkIns.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {kr.checkIns.slice(-2).map(ci => (
                                  <div key={ci.id} className="flex items-start gap-2 text-xs text-gray-500">
                                    <span className="text-gray-300">│</span>
                                    <span className="text-gray-400">{ci.date}</span>
                                    <span className="font-medium text-gray-600">{ci.value} {kr.unit}</span>
                                    {ci.note && <span className="text-gray-400 italic">— {ci.note}</span>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Check-in modal inline */}
                            {showCheckIn === kr.id && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-xs font-semibold text-blue-700 mb-2">Update Progress Check-in</p>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={checkInValue}
                                    onChange={e => setCheckInValue(e.target.value)}
                                    placeholder={`Nilai (${kr.unit})`}
                                    className="flex-1 px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  />
                                </div>
                                <input
                                  value={checkInNote}
                                  onChange={e => setCheckInNote(e.target.value)}
                                  placeholder="Catatan (opsional)"
                                  className="mt-2 w-full px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => handleCheckIn(kr.id, obj.id)} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                                  <button onClick={() => setShowCheckIn(null)} className="px-3 py-1.5 text-xs bg-white text-gray-600 border border-gray-200 rounded-lg">Batal</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ─── STRATEGIC MAP TAB ────────────────────────────────────────────────────────
const StrategicMapTab = () => {
  const perspektifs: BSCPerspektiveName[] = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Strategic Map</strong> — Visualisasi hubungan sebab-akibat antar Objective BSC. Membaca dari bawah ke atas: Learning & Growth mendukung Internal Process → Customer → Financial.
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 overflow-x-auto">
        <div className="min-w-[700px] space-y-4">
          {perspektifs.map((pname, pi) => {
            const cfg = PERSPEKTIF_CONFIG[pname];
            const objs = bscObjectives.filter(o => o.perspektif === pname);
            const weights: Record<BSCPerspektiveName, number> = {
              'Financial': 25, 'Customer': 30, 'Internal Process': 25, 'Learning & Growth': 20
            };
            return (
              <div key={pname} className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-4`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <p className={`font-bold text-sm ${cfg.color}`}>{pname}</p>
                    <p className="text-xs text-gray-500">Bobot: {weights[pname]}% dari total BSC</p>
                  </div>
                  {pi < perspektifs.length - 1 && (
                    <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                      <ArrowRight className="w-4 h-4" />
                      <span>mendukung {perspektifs[pi + 1]}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {objs.map(obj => {
                    const sc = STATUS_CONFIG[obj.status];
                    const SIcon = sc.icon;
                    const pct = Math.min(100, Math.round((obj.actual / obj.target) * 100));
                    return (
                      <div key={obj.id} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <p className="text-xs font-medium text-gray-800 leading-snug">{obj.title}</p>
                          <SIcon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${sc.color}`} />
                        </div>
                        <p className="text-xs text-gray-400">{obj.kpi}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className={`font-semibold ${sc.color}`}>{obj.actual}{obj.unit === '%' ? '%' : ''} / {obj.target}{obj.unit === '%' ? '%' : ''}</span>
                          <span className="text-gray-400">{obj.weight}%</span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar value={pct} size="sm" showLabel={false} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OKR Alignment Tree */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Cascading Alignment — OKR Tree</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px] space-y-3">
            {okrObjectives.filter(o => o.level === 'Organisasi').map(orgObj => {
              const divObjs = okrObjectives.filter(o => o.parentId === orgObj.id);
              const prog = okrProgress(orgObj);
              return (
                <div key={orgObj.id} className="border border-purple-200 rounded-xl p-4 bg-purple-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-purple-900 text-sm">{orgObj.title}</p>
                      <p className="text-xs text-purple-600">{orgObj.ownerName}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <ProgressBar value={prog} size="sm" />
                        <span className="text-xs font-bold text-purple-700 whitespace-nowrap">{prog}%</span>
                      </div>
                    </div>
                  </div>
                  {divObjs.length > 0 && (
                    <div className="mt-3 ml-11 space-y-2">
                      {divObjs.map(divObj => {
                        const timObjs = okrObjectives.filter(o => o.parentId === divObj.id);
                        const divProg = okrProgress(divObj);
                        const lcfg = LEVEL_CONFIG[divObj.level];
                        const DIcon = lcfg.icon;
                        return (
                          <div key={divObj.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                            <div className="flex items-center gap-2">
                              <DIcon className={`w-4 h-4 ${lcfg.color} flex-shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-blue-900 truncate">{divObj.title}</p>
                                <p className="text-xs text-blue-500">{divObj.ownerName}</p>
                              </div>
                              <span className="text-sm font-bold text-blue-700">{divProg}%</span>
                            </div>
                            <div className="mt-1.5 ml-6">
                              <ProgressBar value={divProg} size="sm" />
                            </div>
                            {timObjs.length > 0 && (
                              <div className="mt-2 ml-6 space-y-1.5">
                                {timObjs.map(timObj => {
                                  const tp = okrProgress(timObj);
                                  return (
                                    <div key={timObj.id} className="border border-teal-200 rounded-lg p-2 bg-teal-50 flex items-center gap-2">
                                      <Users className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-teal-900 truncate">{timObj.title}</p>
                                        <p className="text-xs text-teal-500">{timObj.ownerName}</p>
                                      </div>
                                      <span className="text-xs font-bold text-teal-700">{tp}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ANALYTICS TAB ────────────────────────────────────────────────────────────
const AnalyticsTab = () => (
  <div className="space-y-6">
    {/* Trend Line Chart */}
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Tren Kinerja Organisasi (Sep 2025 – Mar 2026)</h3>
      <p className="text-xs text-gray-500 mb-4">Perbandingan skor BSC, OKR, dan Overall per bulan</p>
      <div className="flex items-center gap-5 text-xs mb-2 ml-2">
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-blue-500 rounded" />BSC Score</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-violet-500 rounded" />OKR Score</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-emerald-500 rounded" />Overall</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={monthlyTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid key="lc-grid" strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis key="lc-xaxis" dataKey="bulan" tick={{ fontSize: 11 }} />
          <YAxis key="lc-yaxis" domain={[60, 100]} tick={{ fontSize: 11 }} />
          <Tooltip key="lc-tooltip" contentStyle={{ fontSize: 12 }} />
          <ReferenceLine key="lc-ref80" y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target 80', fontSize: 10, fill: '#10b981' }} />
          <Line key="lc-bsc" type="monotone" dataKey="bsc" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} name="BSC Score" />
          <Line key="lc-okr" type="monotone" dataKey="okr" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} name="OKR Score" />
          <Line key="lc-overall" type="monotone" dataKey="overall" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Overall" />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Radar BSC Perspectives */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Skor per Perspektif BSC</h3>
        <p className="text-xs text-gray-500 mb-4">Radar chart 4 perspektif periode Q1 2026</p>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={perspectiveRadarData}>
            <PolarGrid key="rc-pgrid" />
            <PolarAngleAxis key="rc-angle" dataKey="subject" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis key="rc-radius" angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar key="rc-radar" name="Skor BSC Perspektif" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
            <Tooltip key="rc-tooltip" contentStyle={{ fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Department */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Perbandingan Skor Divisi</h3>
        <p className="text-xs text-gray-500 mb-4">Overall score tiap unit kerja vs target 80</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={departmentBarData} margin={{ top: 5, right: 10, bottom: 60, left: 0 }}>
            <CartesianGrid key="dbc-grid" strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis key="dbc-xaxis" dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis key="dbc-yaxis" domain={[50, 100]} tick={{ fontSize: 11 }} />
            <Tooltip key="dbc-tooltip" contentStyle={{ fontSize: 12 }} />
            <ReferenceLine key="dbc-ref80" y={80} stroke="#ef4444" strokeDasharray="4 4" />
            <Bar key="dbc-score" dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Skor Divisi" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* OKR Completion Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total OKR Aktif', value: okrObjectives.filter(o => o.status === 'Aktif').length, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'OKR Selesai', value: okrObjectives.filter(o => o.status === 'Selesai').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Rata-rata Progress', value: `${Math.round(okrObjectives.reduce((s, o) => s + okrProgress(o), 0) / okrObjectives.length)}%`, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Total Key Results', value: okrObjectives.reduce((s, o) => s + o.keyResults.length, 0), color: 'text-orange-600', bg: 'bg-orange-50' },
      ].map((s, i) => (
        <div key={i} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
          <p className="text-xs text-gray-500">{s.label}</p>
          <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─── REVIEW & FEEDBACK TAB ────────────────────────────────────────────────────
const ReviewTab = () => {
  const { pegawai } = useAppContext();
  const [reviews, setReviews] = useState<PerformanceReview[]>(performanceReviews);
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<PerformanceReview>>({
    period: 'Q1 2026', bscScore: 80, okrScore: 80, strengths: '', improvements: '', feedback: '', status: 'Draft',
  });

  const handleSave = () => {
    if (!form.revieweeId) { toast.error('Pilih pegawai'); return; }
    const pg = pegawai.find(p => p.id === form.revieweeId);
    const bscW = 0.6, okrW = 0.4;
    const final = Math.round((form.bscScore! * bscW) + (form.okrScore! * okrW));
    const newRev: PerformanceReview = {
      id: `rev-${Date.now()}`,
      revieweeId: form.revieweeId!,
      revieweeName: pg ? `${pg.gelarDepan ? pg.gelarDepan + ' ' : ''}${pg.nama}${pg.gelarBelakang ? ', ' + pg.gelarBelakang : ''}` : '',
      reviewerName: 'Anda (Admin HR)',
      period: form.period!,
      bscScore: form.bscScore!,
      okrScore: form.okrScore!,
      finalScore: final,
      rating: ratingFromScore(final),
      strengths: form.strengths!,
      improvements: form.improvements!,
      feedback: form.feedback!,
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setReviews(prev => [newRev, ...prev]);
    toast.success('Review berhasil disimpan');
    setShowForm(false);
    setForm({ period: 'Q1 2026', bscScore: 80, okrScore: 80, strengths: '', improvements: '', feedback: '', status: 'Draft' });
  };

  const detailReview = reviews.find(r => r.id === detailId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">Review & Feedback Kinerja</h3>
          <p className="text-xs text-gray-500 mt-0.5">{reviews.length} review tercatat · Penilaian oleh atasan langsung</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Buat Review
        </button>
      </div>

      <div className="space-y-3">
        {reviews.map(rev => {
          const rc = RATING_CONFIG[rev.rating];
          return (
            <div key={rev.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-lg font-black px-2.5 py-0.5 rounded-lg ${rc.bg} ${rc.color}`}>{rev.rating}</span>
                    <p className="font-semibold text-gray-900">{rev.revieweeName}</p>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{rev.period}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rev.status === 'Diakui' ? 'bg-emerald-100 text-emerald-700' : rev.status === 'Submitted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {rev.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Reviewer: {rev.reviewerName} · {rev.createdAt}</p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    {[
                      { label: 'BSC', value: rev.bscScore, color: 'text-blue-600' },
                      { label: 'OKR', value: rev.okrScore, color: 'text-violet-600' },
                      { label: 'Final', value: rev.finalScore, color: scoreColor(rev.finalScore) },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    ))}
                    <div className="flex-1">
                      <ProgressBar value={rev.finalScore} />
                      <p className="text-xs text-gray-400 mt-0.5">{rc.label}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setDetailId(rev.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Review Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Buat Review Kinerja</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={form.revieweeId || ''} onChange={e => setForm(f => ({ ...f, revieweeId: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.slice(0, 30).map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Periode</label>
                  <input value={form.period || ''} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Skor BSC (0-100)</label>
                  <input type="number" min={0} max={100} value={form.bscScore || ''} onChange={e => setForm(f => ({ ...f, bscScore: parseInt(e.target.value) }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Skor OKR (0-100)</label>
                  <input type="number" min={0} max={100} value={form.okrScore || ''} onChange={e => setForm(f => ({ ...f, okrScore: parseInt(e.target.value) }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none" />
                </div>
              </div>
              {form.bscScore && form.okrScore && (
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Skor Final (BSC 60% + OKR 40%)</p>
                  <p className={`text-3xl font-black ${scoreColor(Math.round(form.bscScore * 0.6 + form.okrScore * 0.4))}`}>
                    {Math.round(form.bscScore * 0.6 + form.okrScore * 0.4)}
                  </p>
                  <p className="text-xs text-gray-500">Predikat: {RATING_CONFIG[ratingFromScore(Math.round(form.bscScore * 0.6 + form.okrScore * 0.4))].label}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Kelebihan / Strengths</label>
                <textarea rows={2} value={form.strengths || ''} onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))}
                  placeholder="Tuliskan kelebihan pegawai..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Area Pengembangan</label>
                <textarea rows={2} value={form.improvements || ''} onChange={e => setForm(f => ({ ...f, improvements: e.target.value }))}
                  placeholder="Tuliskan area yang perlu ditingkatkan..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Feedback Umum</label>
                <textarea rows={3} value={form.feedback || ''} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))}
                  placeholder="Feedback dan rekomendasi untuk pegawai..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan Review</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Review Modal */}
      {detailReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">Detail Review Kinerja</h2>
                <p className="text-xs text-gray-500">{detailReview.revieweeName} · {detailReview.period}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-center">
                <div className={`text-center p-4 rounded-2xl ${RATING_CONFIG[detailReview.rating].bg}`}>
                  <p className={`text-5xl font-black ${RATING_CONFIG[detailReview.rating].color}`}>{detailReview.rating}</p>
                  <p className="text-sm font-medium mt-1">{RATING_CONFIG[detailReview.rating].label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Final Score: {detailReview.finalScore}/100</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: 'Skor BSC (60%)', value: detailReview.bscScore, color: 'text-blue-600' },
                  { label: 'Skor OKR (40%)', value: detailReview.okrScore, color: 'text-violet-600' }].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
                    <ProgressBar value={s.value} size="sm" />
                  </div>
                ))}
              </div>
              {[
                { label: '✅ Kelebihan / Strengths', text: detailReview.strengths, bg: 'bg-emerald-50' },
                { label: '📈 Area Pengembangan', text: detailReview.improvements, bg: 'bg-amber-50' },
                { label: '💬 Feedback Reviewer', text: detailReview.feedback, bg: 'bg-blue-50' },
              ].map(s => s.text && (
                <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                  <p className="text-xs font-semibold text-gray-600 mb-1">{s.label}</p>
                  <p className="text-sm text-gray-700">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
const SettingsTab = () => {
  const [weights, setWeights] = useState<IntegrationWeights>(defaultWeights);

  const totalBscPerspektif = weights.financialWeight + weights.customerWeight + weights.internalWeight + weights.learningWeight;
  const totalMainWeight = weights.bscWeight + weights.okrWeight;

  const SliderRow = ({ label, key_, min = 0, max = 100, color }: { label: string; key_: keyof IntegrationWeights; min?: number; max?: number; color: string }) => (
    <div className="flex items-center gap-4">
      <label className="text-sm text-gray-700 w-48 flex-shrink-0">{label}</label>
      <input
        type="range" min={min} max={max} value={weights[key_]}
        onChange={e => setWeights(w => ({ ...w, [key_]: parseInt(e.target.value) }))}
        className="flex-1"
      />
      <span className={`text-sm font-bold w-10 text-right ${color}`}>{weights[key_]}%</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <strong>Pengaturan Bobot Integrasi</strong> — Rumus perhitungan nilai akhir kinerja pegawai:
        <br /><code className="bg-amber-100 px-1 rounded mt-1 inline-block">Final Score = (BSC Score × {weights.bscWeight}%) + (OKR Score × {weights.okrWeight}%)</code>
      </div>

      {/* Main Weights */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
        <h3 className="font-semibold text-gray-800">Bobot Utama: BSC vs OKR</h3>
        <SliderRow label="Bobot BSC (Organisasi)" key_="bscWeight" color="text-blue-600" />
        <SliderRow label="Bobot OKR (Tim/Individu)" key_="okrWeight" color="text-violet-600" />
        <div className={`flex items-center gap-2 p-3 rounded-lg ${totalMainWeight === 100 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {totalMainWeight === 100
            ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            : <AlertTriangle className="w-4 h-4 text-red-600" />
          }
          <span className={`text-sm font-medium ${totalMainWeight === 100 ? 'text-emerald-700' : 'text-red-700'}`}>
            Total: {totalMainWeight}% {totalMainWeight !== 100 ? '— Harus 100%!' : '✓'}
          </span>
        </div>
      </div>

      {/* BSC Perspective Weights */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
        <h3 className="font-semibold text-gray-800">Bobot Perspektif BSC</h3>
        <SliderRow label="💰 Financial" key_="financialWeight" color="text-emerald-600" />
        <SliderRow label="🏥 Customer" key_="customerWeight" color="text-blue-600" />
        <SliderRow label="⚙️ Internal Process" key_="internalWeight" color="text-violet-600" />
        <SliderRow label="📚 Learning & Growth" key_="learningWeight" color="text-orange-600" />
        <div className={`flex items-center gap-2 p-3 rounded-lg ${totalBscPerspektif === 100 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {totalBscPerspektif === 100
            ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            : <AlertTriangle className="w-4 h-4 text-red-600" />
          }
          <span className={`text-sm font-medium ${totalBscPerspektif === 100 ? 'text-emerald-700' : 'text-red-700'}`}>
            Total: {totalBscPerspektif}% {totalBscPerspektif !== 100 ? '— Harus 100%!' : '✓'}
          </span>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Preview Formula Perhitungan</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>📐 <strong>BSC Score</strong> = (Financial × {weights.financialWeight}%) + (Customer × {weights.customerWeight}%) + (Internal × {weights.internalWeight}%) + (L&G × {weights.learningWeight}%)</p>
          <p>🎯 <strong>OKR Score</strong> = Rata-rata progress seluruh Key Results pegawai</p>
          <p className="font-semibold text-blue-700">🏆 Final Score = (BSC Score × {weights.bscWeight}%) + (OKR Score × {weights.okrWeight}%)</p>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-1 text-xs text-center">
          {Object.entries(RATING_CONFIG).map(([r, cfg]) => (
            <div key={r} className={`p-2 rounded-lg ${cfg.bg}`}>
              <p className={`font-black text-lg ${cfg.color}`}>{r}</p>
              <p className="text-gray-500 leading-tight">{cfg.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => { setWeights(defaultWeights); toast.success('Reset ke default'); }}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RotateCcw className="w-4 h-4" /> Reset Default
        </button>
        <button
          onClick={() => toast.success('Pengaturan bobot berhasil disimpan')}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Zap className="w-4 h-4" /> Simpan Pengaturan
        </button>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PerformanceManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('bsc');
  const [pdfLoading, setPdfLoading] = useState(false);
  const { absensi: allAbsensi } = useAppContext();

  // Quick stats for header
  const orgAvgScore = Math.round(
    departmentScorecards.reduce((s, d) => s + d.score, 0) / departmentScorecards.length
  );
  const activeOKRs  = okrObjectives.filter(o => o.status === 'Aktif').length;
  const avgOKRProg  = Math.round(okrObjectives.reduce((s, o) => s + okrProgress(o), 0) / okrObjectives.length);
  const achievedBSC = bscObjectives.filter(o => o.status === 'Achieved').length;

  // Attendance rate dari data nyata (untuk PDF)
  const attendanceRate = useMemo(() => {
    const work  = allAbsensi.filter(a => a.status !== 'Libur');
    const hadir = allAbsensi.filter(a => a.status === 'Hadir' || a.status === 'Dinas Luar').length;
    return work.length > 0 ? Math.round((hadir / work.length) * 100) : 85;
  }, [allAbsensi]);

  // ─── PDF Export ───────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PW = 210; const ML = 20; const MR = 20; const CW = PW - ML - MR;
      let y = 0;

      type RGB = [number, number, number];
      const tx = (t: string, x: number, yy: number, sz = 10, st = 'normal', c: RGB = [30,30,30], align: 'left'|'center'|'right' = 'left') => {
        doc.setFontSize(sz); doc.setFont('helvetica', st); doc.setTextColor(c[0],c[1],c[2]); doc.text(t, x, yy, { align });
      };
      const hLine = (yy: number, lw = 0.3, c: RGB = [180,180,180]) => {
        doc.setDrawColor(c[0],c[1],c[2]); doc.setLineWidth(lw); doc.line(ML, yy, PW-MR, yy);
      };
      const fillR = (x: number, yy: number, w: number, h: number, c: RGB) => {
        doc.setFillColor(c[0],c[1],c[2]); doc.rect(x, yy, w, h, 'F');
      };
      const strokeR = (x: number, yy: number, w: number, h: number, c: RGB = [210,215,225], lw = 0.2) => {
        doc.setDrawColor(c[0],c[1],c[2]); doc.setLineWidth(lw); doc.rect(x, yy, w, h, 'S');
      };
      const miniBar = (x: number, yy: number, w: number, pct: number, c: RGB) => {
        fillR(x, yy, w, 1.5, [215,220,230]); fillR(x, yy, w * Math.min(1, pct/100), 1.5, c);
      };

      // ═══════════════════════════════════════════════��═══════════════════════
      // PAGE 1 — KOP + BSC SCORECARD
      // ═══════════════════════════════════════════════════════════════════════
      fillR(0, 0, PW, 38, [30,64,175]);
      y = 10;
      tx('PEMERINTAH PROVINSI LAMPUNG', PW/2, y, 8.5, 'normal', [180,210,255], 'center');
      y += 6; tx('RUMAH SAKIT UMUM DAERAH', PW/2, y, 14, 'bold', [255,255,255], 'center');
      y += 6; tx('Jl. Dr. Rivai No. 6, Bandar Lampung 35213  |  Telp. (0721) 703312', PW/2, y, 7.5, 'normal', [180,210,255], 'center');
      y += 5; tx('Akreditasi KARS Paripurna  |  RS Tipe B Pendidikan Rujukan Regional', PW/2, y, 7.5, 'normal', [180,210,255], 'center');

      // Title box
      y = 44; fillR(ML, y, CW, 16, [240,249,255]); strokeR(ML, y, CW, 16, [147,197,253], 0.6);
      tx('LAPORAN KINERJA KUARTALAN', PW/2, y+6.5, 13, 'bold', [30,58,138], 'center');
      tx('Periode Q1 2026  (Januari — Maret 2026)', PW/2, y+12.5, 9.5, 'normal', [59,130,246], 'center');

      y = 65;
      tx(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}`, ML, y, 8, 'normal', [100,100,100]);
      tx('Disusun: Bagian SDM & Umum — Rumah Sakit', PW-MR, y, 8, 'normal', [100,100,100], 'right');
      y += 4; hLine(y, 0.5, [59,130,246]);

      // A. Ringkasan Eksekutif
      y += 7; tx('A. RINGKASAN EKSEKUTIF KINERJA ORGANISASI', ML, y, 11, 'bold', [30,58,138]);
      y += 2; hLine(y, 0.3, [200,215,235]); y += 6;

      const boxW = (CW - 9) / 4;
      [
        { lbl:'Skor BSC', val:`${orgAvgScore}`, sub:'Rata-rata Divisi',  c:[16,185,129] as RGB },
        { lbl:'OKR Aktif', val:`${activeOKRs}`, sub:'Objectives Aktif',  c:[99,102,241] as RGB },
        { lbl:'OKR Progress', val:`${avgOKRProg}%`, sub:'Avg Key Results', c:[59,130,246] as RGB },
        { lbl:'KPI Achieved', val:`${achievedBSC}/${bscObjectives.length}`, sub:'Target Tercapai', c:[245,158,11] as RGB },
      ].forEach((m, i) => {
        const bx = ML + i * (boxW + 3);
        fillR(bx, y, boxW, 22, m.c);
        tx(m.lbl, bx+boxW/2, y+7, 8, 'normal', [255,255,255], 'center');
        tx(m.val, bx+boxW/2, y+14.5, 13, 'bold', [255,255,255], 'center');
        tx(m.sub, bx+boxW/2, y+20, 7, 'normal', [220,240,255], 'center');
      });
      y += 27;

      // Live Attendance KPI
      fillR(ML, y, CW, 11, [239,246,255]); strokeR(ML, y, CW, 11, [147,197,253], 0.4);
      tx('LIVE KPI — Kehadiran Pegawai (Integrasi Real-time dari Modul Absensi)', ML+3, y+5, 8.5, 'bold', [30,58,138]);
      const ac: RGB = attendanceRate>=95?[5,150,105]:attendanceRate>=85?[245,158,11]:[220,38,38];
      tx(`${attendanceRate}%  (Target: 95%)`, PW-MR-3, y+5, 8.5, 'bold', ac, 'right');
      miniBar(ML+3, y+8, CW-60, attendanceRate, ac);
      tx(`Sumber: ${allAbsensi.length} record absensi · Diperbarui otomatis`, ML+3, y+10.5, 7, 'normal', [100,130,180]);
      y += 16;

      // B. BSC 4 Perspektif
      tx('B. BALANCED SCORECARD — SKOR 4 PERSPEKTIF', ML, y, 11, 'bold', [30,58,138]);
      y += 2; hLine(y, 0.3, [200,215,235]); y += 6;
      const pW4 = (CW - 6) / 4;
      [
        { ico:'Keuangan', s:82, c:[16,185,129] as RGB, a:2, on:1, r:1, b:0 },
        { ico:'Pelanggan', s:86, c:[59,130,246] as RGB, a:2, on:1, r:0, b:1 },
        { ico:'Internal',  s:78, c:[139,92,246] as RGB, a:1, on:1, r:1, b:2 },
        { ico:'L&G',       s:76, c:[245,158,11] as RGB, a:1, on:1, r:2, b:0 },
      ].forEach((p, i) => {
        const bx = ML + i * (pW4 + 2);
        fillR(bx, y, pW4, 7, p.c); tx(p.ico, bx+pW4/2, y+5.2, 8, 'bold', [255,255,255], 'center');
        fillR(bx, y+7, pW4, 18, [250,250,252]); strokeR(bx, y+7, pW4, 18);
        tx(`${p.s}`, bx+pW4/2, y+15.5, 15, 'bold', p.c, 'center');
        tx('/ 100', bx+pW4/2, y+19.5, 7, 'normal', [150,150,150], 'center');
        miniBar(bx+2, y+22, pW4-4, p.s, p.c);
        fillR(bx, y+25, pW4, 6, [248,250,252]); strokeR(bx, y+25, pW4, 6);
        tx(`A:${p.a} ●:${p.on} △:${p.r} X:${p.b}`, bx+pW4/2, y+29.2, 7, 'normal', [80,80,80], 'center');
      });
      y += 35;

      // C. Department Scorecard Table
      tx('C. SCORECARD PER DIVISI / INSTALASI', ML, y, 11, 'bold', [30,58,138]);
      y += 2; hLine(y, 0.3, [200,215,235]); y += 5;
      const cX = [ML, ML+85, ML+107, ML+129, ML+151, ML+173];
      const cW = [85, 22, 22, 22, 22, 22];
      fillR(ML, y, CW, 7, [30,64,175]);
      ['Unit Kerja','Financial','Customer','Internal','L&G','Overall'].forEach((h,i) =>
        tx(h, cX[i]+(i===0?2:cW[i]/2), y+5, 7.5, 'bold', [255,255,255], i===0?'left':'center')
      );
      y += 7;
      departmentScorecards.forEach((d,idx) => {
        if(idx%2===0) fillR(ML, y, CW, 6, [248,250,252]);
        strokeR(ML, y, CW, 6);
        tx(d.name.replace('Instalasi ','Ins. ').replace('Direktorat ','Dir. '), cX[0]+2, y+4.2, 7.5, 'normal', [40,40,40]);
        [d.financialScore,d.customerScore,d.internalScore,d.learningScore,d.score].forEach((s,i)=>{
          const sc: RGB = s>=85?[5,150,105]:s>=75?[59,130,246]:s>=65?[245,158,11]:[220,38,38];
          tx(`${s}`, cX[i+1]+cW[i+1]/2, y+4.2, 8, i===4?'bold':'normal', sc, 'center');
        });
        y += 6;
      });

      // ═══════════════════════════════════════════════════════════════════════
      // PAGE 2 — OKR + TOP PERFORMERS + TANDA TANGAN
      // ═══════════════════════════════════════════════════════════════════════
      doc.addPage();
      fillR(0, 0, PW, 12, [30,64,175]);
      tx('RUMAH SAKIT UMUM DAERAH — LAPORAN KINERJA Q1 2026 — HALAMAN 2', PW/2, 8, 9, 'bold', [255,255,255], 'center');
      y = 20;

      // D. OKR Summary
      tx('D. RINGKASAN CAPAIAN OKR (OBJECTIVES & KEY RESULTS)', ML, y, 11, 'bold', [30,58,138]);
      y += 2; hLine(y, 0.3, [200,215,235]); y += 6;

      ([['Organisasi',[124,58,237]],['Divisi',[59,130,246]],['Tim',[20,184,166]],['Individu',[249,115,22]]] as [string,RGB][]).forEach(([lv,c])=>{
        const objs = okrObjectives.filter(o => o.level === lv as any);
        if(!objs.length) return;
        const avg = Math.round(objs.reduce((s,o)=>s+okrProgress(o),0)/objs.length);
        fillR(ML, y, CW, 7, c);
        tx(`Level ${lv}`, ML+3, y+5, 8.5, 'bold', [255,255,255]);
        tx(`${objs.length} Objectives · Rata-rata: ${avg}%`, PW-MR-3, y+5, 8.5, 'normal', [220,240,255], 'right');
        y += 7;
        objs.forEach(obj=>{
          const prog = okrProgress(obj);
          const pc: RGB = prog>=70?[5,150,105]:prog>=40?[245,158,11]:[220,38,38];
          tx(`• ${obj.title}`, ML+4, y+4, 8, 'normal', [40,40,40]);
          tx(`${prog}%`, PW-MR-3, y+4, 8, 'bold', pc, 'right');
          miniBar(ML+4, y+5.5, CW-20, prog, pc);
          y += 9;
        });
        y += 2;
      });

      // E. Top Performers
      y += 3; tx('E. TOP PERFORMERS Q1 2026', ML, y, 11, 'bold', [30,58,138]);
      y += 2; hLine(y, 0.3, [200,215,235]); y += 6;
      const rc: Record<string,RGB> = {A:[5,150,105],B:[59,130,246],C:[245,158,11],D:[249,115,22],E:[220,38,38]};
      performanceReviews.filter(r=>r.status==='Diakui').sort((a,b)=>b.finalScore-a.finalScore).slice(0,5).forEach((r,i)=>{
        const col = rc[r.rating]??[100,100,100] as RGB;
        if(i%2===0) fillR(ML, y, CW, 10, [248,250,252]);
        strokeR(ML, y, CW, 10);
        fillR(ML+2, y+2, 6, 6, col);
        tx(r.rating, ML+5, y+6.5, 8, 'bold', [255,255,255], 'center');
        tx(`${i+1}. ${r.revieweeName}`, ML+11, y+5, 9, 'bold', [30,30,30]);
        tx(r.period, ML+11, y+8.5, 7.5, 'normal', [100,100,100]);
        tx(`Final: ${r.finalScore}  |  BSC: ${r.bscScore}  |  OKR: ${r.okrScore}`, PW-MR-3, y+5, 8, 'normal', [60,60,60], 'right');
        tx((r.strengths.substring(0,55)+(r.strengths.length>55?'…':'')), PW-MR-3, y+8.5, 7, 'normal', [120,120,120], 'right');
        y += 11;
      });

      // F. Tanda Tangan
      y = 238; hLine(y, 0.4, [180,180,180]); y += 6;
      tx('Mengetahui,', ML, y, 9);
      tx('Bandar Lampung, '+new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}), PW/2, y, 8.5, 'normal', [80,80,80], 'center');
      tx('Disetujui oleh,', PW-MR-50, y, 9);
      y += 5;
      tx('Kepala Bagian SDM & Umum', ML, y, 9, 'bold'); tx('Direktur Rumah Sakit', PW-MR-50, y, 9, 'bold');
      y += 25;
      tx('( ..................................... )', ML, y, 9, 'normal', [80,80,80]);
      tx('dr. IMAM GHOZALI, Sp.An., M.Kes.', PW-MR-50, y, 9, 'bold', [30,30,30]);
      y += 5;
      tx('NIP. ..............................', ML, y, 8.5, 'normal', [100,100,100]);
      tx('NIP. 19680415 199703 1 001', PW-MR-50, y, 8.5, 'normal', [100,100,100]);

      // Footer tiap halaman
      const total = doc.getNumberOfPages();
      for(let pg=1; pg<=total; pg++){
        doc.setPage(pg); doc.setFontSize(7.5); doc.setTextColor(150,150,150);
        doc.text(`Hal. ${pg} dari ${total}  |  Dicetak oleh HCMS — Rumah Sakit Provinsi Lampung`, PW/2, 292, { align:'center' });
      }

      doc.save(`Laporan_Kinerja_Q1_2026_RS_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Laporan Kinerja Q1 2026 berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Performance Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            BSC (Organisasi/Divisi) · OKR (Tim/Individu) · Review & Analytics — Q1 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Q1 2026</span>
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors font-medium"
          >
            {pdfLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses…</>
              : <><Download className="w-4 h-4" /> Export PDF Laporan</>
            }
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Skor BSC Organisasi', value: `${orgAvgScore}`, sub: 'Rata-rata semua divisi', color: 'text-blue-600', bg: 'from-blue-50 to-blue-100/50', icon: BarChart2 },
          { label: 'OKR Aktif', value: activeOKRs, sub: 'Objective berjalan', color: 'text-violet-600', bg: 'from-violet-50 to-violet-100/50', icon: Target },
          { label: 'Rata-rata OKR Progress', value: `${avgOKRProg}%`, sub: 'Pencapaian Key Results', color: 'text-teal-600', bg: 'from-teal-50 to-teal-100/50', icon: TrendingUp },
          { label: 'KPI Achieved', value: `${achievedBSC}/${bscObjectives.length}`, sub: 'Target tercapai', color: 'text-emerald-600', bg: 'from-emerald-50 to-emerald-100/50', icon: CheckCircle2 },
        ].map((s, i) => {
          const SIcon = s.icon;
          return (
            <div key={i} className={`bg-gradient-to-br ${s.bg} rounded-xl border border-gray-200 p-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color.replace('text-', 'bg-').replace('600', '100')}`}>
                  <SIcon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50">
          {TABS.map(tab => {
            const TIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {activeTab === 'bsc'       && <BSCTab />}
          {activeTab === 'kpi'       && <KPIMatrixTab />}
          {activeTab === 'okr'       && <OKRTab />}
          {activeTab === 'map'       && <StrategicMapTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'review'    && <ReviewTab />}
          {activeTab === 'settings'  && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
