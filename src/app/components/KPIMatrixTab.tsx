import React, { useState, useMemo } from 'react';
import {
  CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, ChevronUp,
  Target, BarChart2, ArrowRight, Info, Search, Filter, Link2,
  TrendingUp, TrendingDown, Minus, Database, Clock, User,
  BookOpen, Layers, Zap, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  bscObjectives, okrObjectives, kpiDefinitions,
} from '../data/performanceData';
import type {
  BSCObjective, BSCPerspektiveName, OKRKeyResult,
} from '../types';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type KPIStatus = 'Achieved' | 'On Track' | 'At Risk' | 'Behind';
type View = 'matrix' | 'table' | 'formula';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PERSPEKTIF_CFG: Record<BSCPerspektiveName, {
  color: string; bg: string; border: string; textLight: string;
  ring: string; icon: string; hex: string;
}> = {
  'Financial':         { color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', textLight: 'text-emerald-600', ring: 'ring-emerald-200', icon: '💰', hex: '#059669' },
  'Customer':          { color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    textLight: 'text-blue-600',    ring: 'ring-blue-200',    icon: '🏥', hex: '#2563eb' },
  'Internal Process':  { color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200',  textLight: 'text-violet-600',  ring: 'ring-violet-200',  icon: '⚙️', hex: '#7c3aed' },
  'Learning & Growth': { color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-200',  textLight: 'text-orange-600',  ring: 'ring-orange-200',  icon: '📚', hex: '#ea580c' },
};

const STATUS_CFG: Record<KPIStatus, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Achieved': { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: CheckCircle2   },
  'On Track': { color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-200',    icon: CheckCircle2   },
  'At Risk':  { color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-200',   icon: AlertTriangle  },
  'Behind':   { color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-200',     icon: AlertCircle    },
};

const FREKUENSI_CFG: Record<string, { bg: string; color: string }> = {
  'Harian':    { bg: 'bg-rose-50',   color: 'text-rose-600'   },
  'Mingguan':  { bg: 'bg-pink-50',   color: 'text-pink-600'   },
  'Bulanan':   { bg: 'bg-blue-50',   color: 'text-blue-600'   },
  'Kuartalan': { bg: 'bg-violet-50', color: 'text-violet-600' },
  'Semesteran':{ bg: 'bg-amber-50',  color: 'text-amber-600'  },
  'Tahunan':   { bg: 'bg-gray-50',   color: 'text-gray-600'   },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const krProgress = (kr: OKRKeyResult): number => {
  const range = Math.abs(kr.targetValue - kr.startValue);
  if (range === 0) return 100;
  return Math.min(100, Math.round((Math.abs(kr.currentValue - kr.startValue) / range) * 100));
};

/** Hitung skor BSC untuk satu objective (0–100) */
const calcBSCScore = (obj: BSCObjective): number => {
  // Untuk unit "hari" dan "kasus" lebih kecil = lebih baik
  const isLowerBetter = obj.unit === 'hari' || obj.unit === 'kasus' || obj.unit === 'menit';
  if (isLowerBetter) {
    if (obj.target === 0) return obj.actual === 0 ? 100 : Math.max(0, Math.round((1 - obj.actual / (obj.target + obj.actual)) * 100));
    return Math.min(100, Math.max(0, Math.round((obj.target / Math.max(0.01, obj.actual)) * 100)));
  }
  return Math.min(100, Math.max(0, Math.round((obj.actual / obj.target) * 100)));
};

/** Hitung skor OKR dari daftar KR yang terhubung (0–100) */
const calcOKRScore = (linkedKRIds: string[]): number => {
  if (!linkedKRIds.length) return 0;
  const allKRs = okrObjectives.flatMap(o => o.keyResults);
  const linked = linkedKRIds.map(id => allKRs.find(kr => kr.id === id)).filter(Boolean) as OKRKeyResult[];
  if (!linked.length) return 0;
  return Math.round(linked.reduce((s, kr) => s + krProgress(kr), 0) / linked.length);
};

/** Hitung Combined Score dari BSC + OKR */
const calcCombined = (bscScore: number, okrScore: number, bscW: number, okrW: number): number => {
  if (!okrScore) return bscScore; // jika tidak ada OKR, pakai BSC saja
  return Math.round((bscScore * bscW / 100) + (okrScore * okrW / 100));
};

const scoreColor = (s: number) =>
  s >= 90 ? 'text-emerald-600' : s >= 75 ? 'text-blue-600' : s >= 60 ? 'text-amber-600' : 'text-red-600';

const scoreBg = (s: number) =>
  s >= 90 ? 'bg-emerald-100' : s >= 75 ? 'bg-blue-100' : s >= 60 ? 'bg-amber-100' : 'bg-red-100';

const progressBarColor = (s: number) =>
  s >= 90 ? 'bg-emerald-500' : s >= 75 ? 'bg-blue-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500';

// ─── MINI GAUGE ───────────────────────────────────────────────────────────────
const MiniGauge = ({ value, max = 100, label, color = 'bg-blue-500' }: {
  value: number; max?: number; label: string; color?: string;
}) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="text-center">
      <div className="relative w-14 h-14 mx-auto">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke={pct >= 90 ? '#10b981' : pct >= 75 ? '#3b82f6' : pct >= 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-black ${scoreColor(pct)}`}>{pct}</span>
        </div>
      </div>
      <p className="text-[10px] text-gray-500 mt-1 leading-tight">{label}</p>
    </div>
  );
};

// ─── MINI PROGRESS BAR ────────────────────────────────────────────────────────
const ProgBar = ({ value, size = 'sm' }: { value: number; size?: 'xs' | 'sm' | 'md' }) => (
  <div className={`flex items-center gap-2`}>
    <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${size === 'xs' ? 'h-1' : size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
      <div className={`h-full rounded-full ${progressBarColor(value)}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
    <span className={`text-xs font-medium ${scoreColor(value)} w-7 text-right`}>{value}%</span>
  </div>
);

// ─── KPI CARD (DETAIL) ────────────────────────────────────────────────────────
const KPICard = ({
  obj, bscW, okrW,
}: {
  obj: BSCObjective;
  bscW: number;
  okrW: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const def = kpiDefinitions.find(d => d.kpiId === obj.id);
  const allKRs = okrObjectives.flatMap(o => o.keyResults);
  const linkedKRs = (def?.linkedKRIds ?? []).map(id => allKRs.find(kr => kr.id === id)).filter(Boolean) as OKRKeyResult[];
  const linkedObjs = okrObjectives.filter(o => o.keyResults.some(kr => def?.linkedKRIds.includes(kr.id)));

  const bscScore = calcBSCScore(obj);
  const okrScore = linkedKRs.length ? Math.round(linkedKRs.reduce((s, kr) => s + krProgress(kr), 0) / linkedKRs.length) : 0;
  const hasOKR = linkedKRs.length > 0;
  const combinedScore = hasOKR ? calcCombined(bscScore, okrScore, bscW, okrW) : bscScore;

  const sc = STATUS_CFG[obj.status];
  const StatusIcon = sc.icon;
  const pcfg = PERSPEKTIF_CFG[obj.perspektif];

  return (
    <div className={`rounded-2xl border-2 ${sc.border} bg-white shadow-sm overflow-hidden transition-all`}>
      {/* Header */}
      <button
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sc.bg} ${sc.color}`}>
                  {obj.status}
                </span>
                {hasOKR && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700 flex items-center gap-0.5">
                    <Link2 className="w-2.5 h-2.5" /> {linkedKRs.length} OKR-KR
                  </span>
                )}
                {def && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${FREKUENSI_CFG[def.frekuensi].bg} ${FREKUENSI_CFG[def.frekuensi].color} font-medium`}>
                    {def.frekuensi}
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 text-sm leading-snug">{obj.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{obj.kpi}</p>
              {def && <p className="text-xs text-gray-400 mt-0.5">PIC: {def.pic}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* 3 gauges */}
              <div className="hidden lg:flex gap-2">
                <MiniGauge value={bscScore} label="BSC" />
                {hasOKR && <MiniGauge value={okrScore} label="OKR" />}
                <MiniGauge value={combinedScore} label="Combined" />
              </div>
              {/* Mobile: single combined score */}
              <div className={`lg:hidden w-12 h-12 rounded-xl flex items-center justify-center ${scoreBg(combinedScore)}`}>
                <span className={`font-black ${scoreColor(combinedScore)}`}>{combinedScore}</span>
              </div>
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>

          {/* Compact score bar */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">BSC ({bscW}%)</span>
              <ProgBar value={bscScore} />
            </div>
            {hasOKR && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">OKR ({okrW}%)</span>
                <ProgBar value={okrScore} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-blue-500 w-14 flex-shrink-0 font-semibold">Combined</span>
              <ProgBar value={combinedScore} size="md" />
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="p-4 space-y-4">
            {/* BSC Metric Detail */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">BSC Metric</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${scoreBg(bscScore)} ${scoreColor(bscScore)} font-bold`}>
                  {bscScore}/100
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <p className="text-xs text-gray-400">Target</p>
                  <p className="font-semibold text-gray-800">{obj.target} {obj.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Aktual Q1 2026</p>
                  <p className={`font-semibold ${scoreColor(bscScore)}`}>{obj.actual} {obj.unit}</p>
                </div>
              </div>
              {def && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 rounded-lg p-2.5">
                    <BookOpen className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p>{def.definisi}</p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
                    <Database className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Formula: <span className="font-normal text-gray-600">{def.formula}</span></p>
                      <p className="mt-0.5 text-gray-500">Sumber: {def.dataSource}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* OKR Linked Section */}
            {hasOKR ? (
              <div className="bg-white rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">OKR Key Results Terhubung</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${scoreBg(okrScore)} ${scoreColor(okrScore)} font-bold`}>
                    {okrScore}/100
                  </span>
                </div>
                <div className="space-y-3">
                  {linkedKRs.map(kr => {
                    const prog = krProgress(kr);
                    const parentObj = okrObjectives.find(o => o.id === kr.objectiveId);
                    const latestCI = [...kr.checkIns].sort((a, b) => b.date.localeCompare(a.date))[0];
                    return (
                      <div key={kr.id} className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800">{kr.title}</p>
                            {parentObj && (
                              <p className="text-[10px] text-indigo-500 mt-0.5 flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" />
                                {parentObj.ownerName} — {parentObj.title.substring(0, 40)}{parentObj.title.length > 40 ? '…' : ''}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${scoreBg(prog)} ${scoreColor(prog)}`}>{prog}%</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>Start: {kr.startValue} {kr.unit}</span>
                            <span>Current: <b>{kr.currentValue}</b></span>
                            <span>Target: {kr.targetValue} {kr.unit}</span>
                          </div>
                          <ProgBar value={prog} size="xs" />
                        </div>
                        {latestCI && (
                          <div className="mt-2 flex items-start gap-1.5 bg-white rounded-lg px-2 py-1.5 text-[10px] text-gray-500">
                            <Activity className="w-2.5 h-2.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <span>Check-in {latestCI.date}: <em>"{latestCI.note}"</em> — {latestCI.createdBy}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 bg-indigo-50 rounded-lg p-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-semibold mb-1">
                    <Zap className="w-3 h-3" /> Rumus Kontribusi OKR
                  </div>
                  <p className="text-indigo-700">
                    OKR Score = Rata-rata progress {linkedKRs.length} KR = {linkedKRs.map(kr => `${krProgress(kr)}%`).join(' + ')} / {linkedKRs.length} = <b>{okrScore}%</b>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 border border-dashed border-gray-200 text-center">
                <Link2 className="w-4 h-4 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">KPI ini belum ditautkan ke OKR Key Result</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Tambahkan OKR KR untuk pengukuran kombinasi</p>
              </div>
            )}

            {/* Combined Score Calculation */}
            <div className={`rounded-xl p-4 ${scoreBg(combinedScore)} border ${STATUS_CFG[obj.status].border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${scoreColor(combinedScore)}`} />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Combined KPI Score</span>
                </div>
                <span className={`text-2xl font-black ${scoreColor(combinedScore)}`}>{combinedScore}</span>
              </div>
              <div className="bg-white/80 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <p className="font-mono">Combined = (BSC × {bscW}%) + ({hasOKR ? 'OKR' : 'BSC'} × {hasOKR ? okrW : 100 - bscW}%)</p>
                <p className="font-mono font-medium text-gray-800">
                  = ({bscScore} × {bscW/100}) + ({hasOKR ? okrScore : bscScore} × {hasOKR ? okrW/100 : (100-bscW)/100}) = <b className={scoreColor(combinedScore)}>{combinedScore}</b>
                </p>
                {!hasOKR && <p className="text-amber-600 text-[10px] mt-1">⚠ Tidak ada OKR terhubung — skor menggunakan 100% BSC</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function KPIMatrixTab() {
  const [bscW, setBscW] = useState(60);
  const [view, setView] = useState<View>('matrix');
  const [filterPerspektif, setFilterPerspektif] = useState<BSCPerspektiveName | 'Semua'>('Semua');
  const [filterStatus, setFilterStatus] = useState<KPIStatus | 'Semua'>('Semua');
  const [search, setSearch] = useState('');
  const [expandedP, setExpandedP] = useState<BSCPerspektiveName | null>(null);
  const okrW = 100 - bscW;

  // ── Computed KPI scores ────────────────────────────────────────────────────
  const kpiScores = useMemo(() => {
    return bscObjectives.map(obj => {
      const def = kpiDefinitions.find(d => d.kpiId === obj.id);
      const allKRs = okrObjectives.flatMap(o => o.keyResults);
      const linkedKRs = (def?.linkedKRIds ?? []).map(id => allKRs.find(kr => kr.id === id)).filter(Boolean) as OKRKeyResult[];
      const bscScore = calcBSCScore(obj);
      const okrScore = linkedKRs.length ? Math.round(linkedKRs.reduce((s, kr) => s + krProgress(kr), 0) / linkedKRs.length) : 0;
      const hasOKR = linkedKRs.length > 0;
      const combinedScore = hasOKR ? calcCombined(bscScore, okrScore, bscW, okrW) : bscScore;
      return { obj, def, linkedKRs, bscScore, okrScore, hasOKR, combinedScore };
    });
  }, [bscW, okrW]);

  // ── Per-perspective summary ────────────────────────────────────────────────
  const perspSummary = useMemo(() => {
    const names: BSCPerspektiveName[] = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];
    return names.map(name => {
      const kpis = kpiScores.filter(k => k.obj.perspektif === name);
      const avgBSC = Math.round(kpis.reduce((s, k) => s + k.bscScore, 0) / kpis.length);
      const avgOKR = Math.round(kpis.filter(k => k.hasOKR).reduce((s, k) => s + k.okrScore, 0) / Math.max(1, kpis.filter(k => k.hasOKR).length));
      const avgCombined = Math.round(kpis.reduce((s, k) => s + k.combinedScore, 0) / kpis.length);
      const linkedCount = kpis.filter(k => k.hasOKR).length;
      return { name, kpis, avgBSC, avgOKR, avgCombined, linkedCount, total: kpis.length };
    });
  }, [kpiScores]);

  // ── Overall org score ──────────────────────────────────────────────────────
  const overallScore = Math.round(perspSummary.reduce((s, p) => s + p.avgCombined, 0) / 4);

  // ── Filtered KPIs ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return kpiScores.filter(k => {
      const matchP = filterPerspektif === 'Semua' || k.obj.perspektif === filterPerspektif;
      const matchS = filterStatus === 'Semua' || k.obj.status === filterStatus;
      const matchQ = !search || k.obj.title.toLowerCase().includes(search.toLowerCase()) || k.obj.kpi.toLowerCase().includes(search.toLowerCase());
      return matchP && matchS && matchQ;
    });
  }, [kpiScores, filterPerspektif, filterStatus, search]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = perspSummary.map(p => ({
    name: p.name.replace('Internal Process', 'Internal').replace('Learning & Growth', 'L&G'),
    BSC: p.avgBSC,
    OKR: p.avgOKR,
    Combined: p.avgCombined,
  }));

  return (
    <div className="space-y-5">

      {/* ── Formula Control Bar ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-2xl p-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold">Rumus Kombinasi BSC + OKR</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 font-semibold">AKTIF</span>
            </div>
            <p className="text-blue-200 text-sm font-mono">
              Combined KPI Score = (BSC Score × <b className="text-yellow-300">{bscW}%</b>) + (OKR Progress × <b className="text-green-300">{okrW}%</b>)
            </p>
            <p className="text-blue-300 text-xs mt-1">
              BSC mengukur <em>lagging indicators</em> (hasil) · OKR mengukur <em>leading indicators</em> (upaya)
            </p>
          </div>
          <div className="flex-shrink-0 bg-white/10 rounded-xl p-4 min-w-[260px]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-yellow-300 font-medium">BSC: {bscW}%</span>
              <span className="text-green-300 font-medium">OKR: {okrW}%</span>
            </div>
            <input
              type="range" min={20} max={80} step={5} value={bscW}
              onChange={e => setBscW(parseInt(e.target.value))}
              className="w-full accent-yellow-400"
            />
            <div className="flex gap-2 mt-2">
              {[{bsc:60,okr:40,lbl:'Default (60/40)'},{bsc:70,okr:30,lbl:'BSC-Heavy'},{bsc:50,okr:50,lbl:'Equal'}].map(p => (
                <button
                  key={p.lbl}
                  onClick={() => setBscW(p.bsc)}
                  className={`flex-1 text-[10px] px-1.5 py-1 rounded-lg transition-colors ${bscW === p.bsc ? 'bg-yellow-400 text-slate-900 font-semibold' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                >
                  {p.lbl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Perspective Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {perspSummary.map(p => {
          const cfg = PERSPEKTIF_CFG[p.name];
          return (
            <div
              key={p.name}
              className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-4 cursor-pointer transition-all ${filterPerspektif === p.name ? 'ring-2 ' + cfg.ring : 'hover:shadow-md'}`}
              onClick={() => setFilterPerspektif(filterPerspektif === p.name ? 'Semua' : p.name)}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-lg">{cfg.icon}</span>
                <div className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${scoreBg(p.avgCombined)} ${scoreColor(p.avgCombined)}`}>
                  {p.avgCombined}
                </div>
              </div>
              <p className={`text-xs font-semibold ${cfg.color} uppercase tracking-wide leading-tight`}>{p.name}</p>
              <p className={`text-2xl font-black ${cfg.color} mt-1`}>{p.avgCombined}</p>
              <p className="text-xs text-gray-400 mt-0.5">Combined Score</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <BarChart2 className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-gray-500">BSC</span>
                  <span className={`ml-auto font-semibold ${scoreColor(p.avgBSC)}`}>{p.avgBSC}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Target className="w-2.5 h-2.5 text-indigo-400" />
                  <span className="text-gray-500">OKR</span>
                  <span className={`ml-auto font-semibold ${scoreColor(p.avgOKR)}`}>{p.linkedCount > 0 ? p.avgOKR : '—'}</span>
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-1 border-t border-gray-200/60">
                  <Link2 className="w-2.5 h-2.5" />
                  {p.linkedCount}/{p.total} KPI tertaut OKR
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Overall Combined Score ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${scoreBg(overallScore)} border-2 ${overallScore >= 90 ? 'border-emerald-300' : overallScore >= 75 ? 'border-blue-300' : overallScore >= 60 ? 'border-amber-300' : 'border-red-300'}`}>
              <span className={`text-3xl font-black ${scoreColor(overallScore)}`}>{overallScore}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Skor Kinerja Organisasi — Kombinasi BSC+OKR</p>
              <p className="text-xl font-bold text-gray-900">RSUD Abdul Moeloek</p>
              <p className="text-xs text-gray-500">Q1 2026 · {bscObjectives.length} KPI · {kpiScores.filter(k=>k.hasOKR).length} tertaut OKR</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(['Achieved','On Track','At Risk','Behind'] as KPIStatus[]).map(s => {
                  const cnt = bscObjectives.filter(o => o.status === s).length;
                  const cfg = STATUS_CFG[s];
                  return (
                    <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                      {cnt} {s}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={chartData} barSize={20} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid key="kpi-grid" strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis key="kpi-xaxis" dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis key="kpi-yaxis" domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip key="kpi-tooltip" contentStyle={{ fontSize: 11 }} />
                <ReferenceLine key="kpi-ref80" y={80} stroke="#10b981" strokeDasharray="4 2" label={{ value: '80', fontSize: 8, fill: '#10b981' }} />
                <Bar key="kpi-bar-bsc" dataKey="BSC" fill="#3b82f6" opacity={0.8} radius={[2,2,0,0]} name="BSC Score" />
                <Bar key="kpi-bar-okr" dataKey="OKR" fill="#8b5cf6" opacity={0.8} radius={[2,2,0,0]} name="OKR Score" />
                <Bar key="kpi-bar-combined" dataKey="Combined" fill="#0f172a" opacity={0.9} radius={[3,3,0,0]} name="Combined Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── View Toggle + Filters ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {([['matrix','Matrix View'],['table','Tabel KPI'],['formula','Panduan Formula']] as [View,string][]).map(([v,lbl]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === v ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari KPI..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none"
          >
            <option value="Semua">Semua Status</option>
            {(['Achieved','On Track','At Risk','Behind'] as KPIStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── MATRIX VIEW ─────────────────────────────────────────────────────── */}
      {view === 'matrix' && (
        <div className="space-y-4">
          {(['Financial','Customer','Internal Process','Learning & Growth'] as BSCPerspektiveName[]).map(pname => {
            const pcfg = PERSPEKTIF_CFG[pname];
            const pKPIs = filtered.filter(k => k.obj.perspektif === pname);
            const pSum = perspSummary.find(p => p.name === pname)!;
            if (!pKPIs.length && filterPerspektif !== 'Semua') return null;
            const isOpen = expandedP === pname || filterPerspektif === pname;
            return (
              <div key={pname} className={`rounded-2xl border-2 ${pcfg.border} overflow-hidden`}>
                <button
                  className={`w-full ${pcfg.bg} px-5 py-4 flex items-center justify-between`}
                  onClick={() => setExpandedP(isOpen ? null : pname)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pcfg.icon}</span>
                    <div className="text-left">
                      <p className={`font-bold ${pcfg.color} text-sm`}>{pname}</p>
                      <p className="text-xs text-gray-500">{pSum.total} KPI · {pSum.linkedCount} tertaut OKR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-400">BSC</p>
                        <p className={`font-bold ${scoreColor(pSum.avgBSC)}`}>{pSum.avgBSC}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">OKR</p>
                        <p className={`font-bold ${scoreColor(pSum.avgOKR)}`}>{pSum.linkedCount > 0 ? pSum.avgOKR : '—'}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-xl ${scoreBg(pSum.avgCombined)}`}>
                        <p className="text-xs text-gray-400">Combined</p>
                        <p className={`font-black ${scoreColor(pSum.avgCombined)}`}>{pSum.avgCombined}</p>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {pKPIs.length > 0 ? pKPIs.map(k => (
                      <KPICard key={k.obj.id} obj={k.obj} bscW={bscW} okrW={okrW} />
                    )) : (
                      <div className="col-span-2 text-center py-8 text-gray-400 text-sm">
                        Tidak ada KPI yang sesuai filter
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TABLE VIEW ──────────────────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800 text-white">
                  {['#','Perspektif','KPI','Indikator','Target','Aktual','BSC Score','OKR Score','Combined','Status','OKR-KR','PIC'].map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((k, idx) => {
                  const pcfg = PERSPEKTIF_CFG[k.obj.perspektif];
                  const sc = STATUS_CFG[k.obj.status];
                  const SIcon = sc.icon;
                  return (
                    <tr key={k.obj.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pcfg.bg} ${pcfg.color}`}>
                          {pcfg.icon} {k.obj.perspektif.replace('Internal Process','Internal').replace('Learning & Growth','L&G')}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-800 max-w-[180px]">
                        <p className="leading-tight">{k.obj.title}</p>
                      </td>
                      <td className="px-3 py-3 text-gray-500 max-w-[160px] leading-tight">{k.obj.kpi}</td>
                      <td className="px-3 py-3 text-gray-700 font-mono">{k.obj.target} {k.obj.unit}</td>
                      <td className={`px-3 py-3 font-mono font-semibold ${scoreColor(k.bscScore)}`}>{k.obj.actual} {k.obj.unit}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${scoreColor(k.bscScore)}`}>{k.bscScore}</span>
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${progressBarColor(k.bscScore)}`} style={{ width: `${k.bscScore}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {k.hasOKR ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${scoreColor(k.okrScore)}`}>{k.okrScore}</span>
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${progressBarColor(k.okrScore)}`} style={{ width: `${k.okrScore}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${scoreBg(k.combinedScore)}`}>
                          <span className={`font-black ${scoreColor(k.combinedScore)}`}>{k.combinedScore}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${sc.bg} ${sc.color}`}>
                          <SIcon className="w-2.5 h-2.5" /> {k.obj.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${k.hasOKR ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                          {k.hasOKR ? `${k.linkedKRs.length} KR` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                        {k.def?.pic ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                  <td colSpan={6} className="px-3 py-3 text-sm text-gray-700">
                    Rata-rata Keseluruhan ({filtered.length} KPI)
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-sm font-black ${scoreColor(Math.round(filtered.reduce((s,k)=>s+k.bscScore,0)/Math.max(1,filtered.length)))}`}>
                      {Math.round(filtered.reduce((s,k)=>s+k.bscScore,0)/Math.max(1,filtered.length))}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-sm font-black ${scoreColor(Math.round(filtered.filter(k=>k.hasOKR).reduce((s,k)=>s+k.okrScore,0)/Math.max(1,filtered.filter(k=>k.hasOKR).length)))}`}>
                      {Math.round(filtered.filter(k=>k.hasOKR).reduce((s,k)=>s+k.okrScore,0)/Math.max(1,filtered.filter(k=>k.hasOKR).length))}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-sm font-black ${scoreColor(Math.round(filtered.reduce((s,k)=>s+k.combinedScore,0)/Math.max(1,filtered.length)))}`}>
                      {Math.round(filtered.reduce((s,k)=>s+k.combinedScore,0)/Math.max(1,filtered.length))}
                    </span>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── FORMULA / PANDUAN VIEW ───────────────────────────────────────────── */}
      {view === 'formula' && (
        <div className="space-y-4">
          {/* Diagram Framework */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-1">Framework Kombinasi BSC + OKR — RSUD Abdul Moeloek</h3>
            <p className="text-sm text-gray-500 mb-5">Setiap KPI diukur dari dua dimensi yang saling melengkapi: BSC (lagging/hasil) dan OKR (leading/upaya)</p>
            {/* Framework flow diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* BSC Column */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-800">Balanced Scorecard</p>
                    <p className="text-[10px] text-blue-600">Lagging Indicators</p>
                  </div>
                </div>
                <ul className="space-y-2 text-xs text-blue-700">
                  {[
                    '4 Perspektif strategis (F, C, I, L&G)',
                    'Mengukur hasil yang sudah terjadi',
                    '17 KPI utama organisasi',
                    'Data dari SIRS, SIM Keuangan, Rekam Medis',
                    'Target tahunan dari Renstra RS',
                  ].map((t, i) => <li key={i} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />{t}</li>)}
                </ul>
                <div className="mt-3 bg-blue-100 rounded-lg p-2 text-center">
                  <p className="text-xs font-semibold text-blue-700">Bobot default: <span className="text-lg font-black">{bscW}%</span></p>
                </div>
              </div>
              {/* Arrow + Formula */}
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <div className="bg-gradient-to-b from-slate-700 to-blue-800 text-white rounded-2xl p-4 w-full text-center shadow-lg">
                  <p className="text-xs text-slate-300 mb-1">Rumus Pengukuran</p>
                  <p className="font-mono text-xs text-white leading-relaxed">
                    Combined Score =<br/>
                    <b className="text-yellow-300">(BSC × {bscW}%)</b><br/>
                    +<br/>
                    <b className="text-green-300">(OKR × {okrW}%)</b>
                  </p>
                </div>
                <div className="bg-white border-2 border-slate-200 rounded-xl p-3 w-full">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Kategori Penilaian:</p>
                  <div className="space-y-1">
                    {[
                      {r:'A',s:'91–100',c:'text-emerald-600',bg:'bg-emerald-50',lbl:'Sangat Baik'},
                      {r:'B',s:'76–90', c:'text-blue-600',   bg:'bg-blue-50',   lbl:'Baik'},
                      {r:'C',s:'61–75', c:'text-amber-600',  bg:'bg-amber-50',  lbl:'Cukup'},
                      {r:'D',s:'46–60', c:'text-orange-600', bg:'bg-orange-50', lbl:'Kurang'},
                      {r:'E',s:'≤ 45',  c:'text-red-600',    bg:'bg-red-50',    lbl:'Sangat Kurang'},
                    ].map(({r,s,c,bg,lbl}) => (
                      <div key={r} className={`${bg} rounded-lg px-2 py-1 flex justify-between items-center`}>
                        <span className={`font-black ${c}`}>{r}</span>
                        <span className="text-[10px] text-gray-600">{lbl}</span>
                        <span className="text-[10px] font-mono text-gray-500">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* OKR Column */}
              <div className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-violet-800">OKR</p>
                    <p className="text-[10px] text-violet-600">Leading Indicators</p>
                  </div>
                </div>
                <ul className="space-y-2 text-xs text-violet-700">
                  {[
                    '4 Level: Org → Divisi → Tim → Individu',
                    'Mengukur upaya & inisiatif strategis',
                    '23 Key Results aktif Q1 2026',
                    'Check-in rutin mingguan/bulanan',
                    'Cascading dari Objective ke Key Result',
                  ].map((t, i) => <li key={i} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />{t}</li>)}
                </ul>
                <div className="mt-3 bg-violet-100 rounded-lg p-2 text-center">
                  <p className="text-xs font-semibold text-violet-700">Bobot default: <span className="text-lg font-black">{okrW}%</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Definitions Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Kamus KPI — Definisi, Formula & Sumber Data</h3>
              <p className="text-xs text-gray-500 mt-0.5">{kpiDefinitions.length} KPI terdefinisi · Acuan pengukuran kombinasi BSC+OKR</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Perspektif','KPI','Definisi','Formula','Frekuensi','Sumber Data','PIC','OKR-KR','BSC%','OKR%'].map((h, i) => (
                      <th key={i} className="px-3 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {kpiDefinitions.map(def => {
                    const obj = bscObjectives.find(o => o.id === def.kpiId)!;
                    if (!obj) return null;
                    const pcfg = PERSPEKTIF_CFG[obj.perspektif];
                    const fCfg = FREKUENSI_CFG[def.frekuensi];
                    return (
                      <tr key={def.kpiId} className="hover:bg-gray-50/50 align-top">
                        <td className="px-3 py-3">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${pcfg.bg} ${pcfg.color}`}>
                            {pcfg.icon} {obj.perspektif.replace('Internal Process','Internal').replace('Learning & Growth','L&G')}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-medium text-gray-800 min-w-[140px] leading-snug">{obj.title}</td>
                        <td className="px-3 py-3 text-gray-500 max-w-[220px] leading-snug">{def.definisi.substring(0,100)}…</td>
                        <td className="px-3 py-3 font-mono text-gray-600 min-w-[140px] leading-snug text-[10px] bg-blue-50/30">{def.formula}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${fCfg.bg} ${fCfg.color}`}>{def.frekuensi}</span>
                        </td>
                        <td className="px-3 py-3 text-gray-500 min-w-[120px] leading-snug">{def.dataSource}</td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{def.pic}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${def.linkedKRIds.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                            {def.linkedKRIds.length > 0 ? `${def.linkedKRIds.length} KR` : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-blue-600">{def.bscContrib}%</td>
                        <td className="px-3 py-3 text-center font-bold text-violet-600">{def.okrContrib}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alignment Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-indigo-600" />
                <h4 className="font-semibold text-indigo-800">KPI Tertaut OKR ({kpiScores.filter(k=>k.hasOKR).length}/{bscObjectives.length})</h4>
              </div>
              <div className="space-y-2">
                {kpiScores.filter(k => k.hasOKR).map(k => (
                  <div key={k.obj.id} className="bg-white rounded-lg p-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{k.obj.title}</p>
                      <p className="text-[10px] text-indigo-500">{k.linkedKRs.length} KR terhubung</p>
                    </div>
                    <span className={`text-xs font-bold ml-2 ${scoreColor(k.combinedScore)}`}>{k.combinedScore}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-amber-800">KPI Belum Tertaut OKR ({kpiScores.filter(k=>!k.hasOKR).length}/{bscObjectives.length})</h4>
              </div>
              <div className="space-y-2">
                {kpiScores.filter(k => !k.hasOKR).map(k => (
                  <div key={k.obj.id} className="bg-white rounded-lg p-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{k.obj.title}</p>
                      <p className="text-[10px] text-amber-500">Rekomendasi: tambahkan OKR KR yang relevan</p>
                    </div>
                    <span className={`text-xs font-bold ml-2 ${scoreColor(k.bscScore)}`}>{k.bscScore}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
