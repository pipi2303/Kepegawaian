import React, { useState, useMemo, useId } from 'react';
import {
  FileBarChart2, Download, Printer, Calendar, Users, TrendingUp, Target,
  Clock, Award, AlertTriangle, Shield, DollarSign, BookOpen,
  Activity, ChevronUp, ChevronDown, Minus, Bell, CheckCircle,
  XCircle, RefreshCw, Star, Zap, Heart, BarChart2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { chartGolongan, chartUnitKerja } from '../data/mockData';
import { useAppContext } from '../context/AppContext';
import { C, CHART_COLORS } from '../components/colors';

// ─── Colour Palettes ──────────────────────────────────────────────────────────
const CP = {
  blue:    [C.lemon, C.brandXLight, C.brandLight, C.brandMid, C.brand],
  green:   ['#d1fae5','#6ee7b7','#10b981','#059669','#064e3b'],
  amber:   ['#fef3c7','#fcd34d','#f59e0b','#d97706','#78350f'],
  red:     ['#fee2e2','#fca5a5','#ef4444','#dc2626','#7f1d1d'],
  purple:  ['#ede9fe','#c4b5fd','#8b5cf6','#7c3aed','#3b0764'],
  pink:    ['#fce7f3','#f9a8d4','#ec4899','#db2777','#831843'],
  teal:    ['#ccfbf1','#5eead4','#14b8a6','#0f766e','#134e4a'],
  orange:  ['#ffedd5','#fdba74','#f97316','#ea580c','#7c2d12'],
  indigo:  ['#e0e7ff','#a5b4fc','#6366f1','#4338ca','#1e1b4b'],
  slate:   ['#f8fafc','#e2e8f0','#94a3b8','#475569','#0f172a'],
};

// ─── Static augmented data ────────────────────────────────────────────────────
const trendAbsensi = [
  { bulan: 'Sep', hadir: 1580, sakit: 45, cuti: 38, alpha: 12, izin: 28 },
  { bulan: 'Okt', hadir: 1610, sakit: 52, cuti: 30, alpha: 8, izin: 24 },
  { bulan: 'Nov', hadir: 1595, sakit: 41, cuti: 54, alpha: 10, izin: 32 },
  { bulan: 'Des', hadir: 1520, sakit: 38, cuti: 137, alpha: 5, izin: 18 },
  { bulan: 'Jan', hadir: 1602, sakit: 47, cuti: 42, alpha: 9, izin: 27 },
  { bulan: 'Feb', hadir: 1590, sakit: 39, cuti: 60, alpha: 11, izin: 31 },
  { bulan: 'Mar', hadir: 215,  sakit: 1,  cuti: 2,  alpha: 1,  izin: 1  },
];
const trendKP = [
  { tahun: '2020', reguler: 12, fungsional: 18, total: 30 },
  { tahun: '2021', reguler: 15, fungsional: 22, total: 37 },
  { tahun: '2022', reguler: 10, fungsional: 19, total: 29 },
  { tahun: '2023', reguler: 14, fungsional: 25, total: 39 },
  { tahun: '2024', reguler: 11, fungsional: 20, total: 31 },
  { tahun: '2025', reguler: 8,  fungsional: 17, total: 25 },
];
const trendDiklat = [
  { bulan: 'Apr', jp: 320, peserta: 28 }, { bulan: 'Mei', jp: 480, peserta: 42 },
  { bulan: 'Jun', jp: 240, peserta: 20 }, { bulan: 'Jul', jp: 560, peserta: 49 },
  { bulan: 'Agu', jp: 400, peserta: 35 }, { bulan: 'Sep', jp: 280, peserta: 24 },
  { bulan: 'Okt', jp: 640, peserta: 56 }, { bulan: 'Nov', jp: 360, peserta: 31 },
  { bulan: 'Des', jp: 200, peserta: 18 }, { bulan: 'Jan', jp: 440, peserta: 38 },
  { bulan: 'Feb', jp: 380, peserta: 33 }, { bulan: 'Mar', jp: 120, peserta: 11 },
];
const radarKompetensi = [
  { subject: 'Klinis', A: 88, B: 72 },
  { subject: 'Manajerial', A: 74, B: 65 },
  { subject: 'Teknis', A: 82, B: 78 },
  { subject: 'Sosial', A: 79, B: 84 },
  { subject: 'Digital', A: 63, B: 55 },
  { subject: 'K3RS', A: 91, B: 70 },
];
const trendGajiData = [
  { bulan: 'Sep', total: 4.82 }, { bulan: 'Okt', total: 4.91 },
  { bulan: 'Nov', total: 4.95 }, { bulan: 'Des', total: 5.18 },
  { bulan: 'Jan', total: 5.02 }, { bulan: 'Feb', total: 5.11 },
];
const gajiByUnit = [
  { unit: 'Bidang Keperawatan', rata: 6.2 },
  { unit: 'Pelayanan Medik', rata: 9.8 },
  { unit: 'Penunjang Medik', rata: 5.9 },
  { unit: 'Keuangan', rata: 5.4 },
  { unit: 'Administrasi', rata: 4.8 },
  { unit: 'Instalasi Bedah', rata: 8.3 },
];
const insidenByType = [
  { type: 'Pajanan Jarum', jumlah: 8, fill: CP.red[2] },
  { type: 'Kecelakaan Kerja', jumlah: 5, fill: CP.orange[2] },
  { type: 'Pajanan Cairan', jumlah: 6, fill: CP.amber[2] },
  { type: 'Bahan Kimia', jumlah: 3, fill: CP.purple[2] },
  { type: 'Radiasi', jumlah: 2, fill: CP.blue[2] },
  { type: 'Near Miss', jumlah: 7, fill: CP.teal[2] },
];
const insidenTrend = [
  { bulan: 'Sep', total: 4, selesai: 4 }, { bulan: 'Okt', total: 3, selesai: 3 },
  { bulan: 'Nov', total: 5, selesai: 4 }, { bulan: 'Des', total: 2, selesai: 2 },
  { bulan: 'Jan', total: 6, selesai: 5 }, { bulan: 'Feb', total: 4, selesai: 3 },
  { bulan: 'Mar', total: 2, selesai: 1 },
];
const jenjangData = [
  { jenjang: 'SMA/SMK', jumlah: 3 }, { jenjang: 'D3', jumlah: 48 },
  { jenjang: 'D4', jumlah: 12 },     { jenjang: 'S1', jumlah: 89 },
  { jenjang: 'Profesi', jumlah: 45 },{ jenjang: 'Spesialis', jumlah: 22 },
  { jenjang: 'S2', jumlah: 29 },
];
const usiaData = [
  { range: '< 30', jumlah: 18 }, { range: '30–35', jumlah: 32 },
  { range: '36–40', jumlah: 28 }, { range: '41–45', jumlah: 35 },
  { range: '46–50', jumlah: 42 }, { range: '51–55', jumlah: 38 },
  { range: '> 55',  jumlah: 10 },
];
const masaKerjaData = [
  { range: '< 5 thn', jumlah: 24 }, { range: '5–10 thn', jumlah: 38 },
  { range: '11–15 thn', jumlah: 52 }, { range: '16–20 thn', jumlah: 61 },
  { range: '21–25 thn', jumlah: 48 }, { range: '> 25 thn', jumlah: 23 },
];

// ─── Helper: format number ────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('id-ID');
const fmtM = (n: number) => `Rp ${(n / 1_000_000).toFixed(1)} M`;

// ─── Trend indicator ──────────────────────────────────────────────────────────
function Trend({ val, unit = '%', inverse = false }: { val: number; unit?: string; inverse?: boolean }) {
  const good = inverse ? val < 0 : val > 0;
  const neutral = val === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${neutral ? 'text-gray-400' : good ? 'text-emerald-600' : 'text-red-500'}`}>
      {neutral ? <Minus className="w-3 h-3" /> : good ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      {Math.abs(val)}{unit}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, trend, trendInverse = false, badge,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: number;
  trendInverse?: boolean; badge?: { text: string; type: 'ok' | 'warn' | 'bad' };
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            badge.type === 'ok' ? 'bg-emerald-50 text-emerald-700' :
            badge.type === 'warn' ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-700'
          }`}>{badge.text}</span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-none">{typeof value === 'number' ? fmt(value) : value}</p>
        <p className="text-xs font-medium text-gray-600 mt-1">{label}</p>
        {sub && (
          <div className="flex items-center gap-1.5 mt-1">
            {trend !== undefined ? <Trend val={trend} inverse={trendInverse} /> : null}
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────────────────
function AlertItem({ type, text, detail }: { type: 'warn' | 'bad' | 'info'; text: string; detail: string }) {
  const cfg = {
    warn: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400', tx: 'text-amber-800', dtx: 'text-amber-600' },
    bad:  { bg: 'bg-red-50 border-red-200',     dot: 'bg-red-400',   tx: 'text-red-800',   dtx: 'text-red-600'   },
    info: { bg: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-400',  tx: 'text-blue-800',  dtx: 'text-blue-600'  },
  }[type];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg}`}>
      <div className={`w-2 h-2 rounded-full ${cfg.dot} mt-1 shrink-0`} />
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${cfg.tx}`}>{text}</p>
        <p className={`text-xs ${cfg.dtx} truncate`}>{detail}</p>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-gray-800 font-semibold">{title}</h3>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Chart components (each has own useId → unique recharts instance IDs) ──────

function DonutChart({ data, colors, height = 200 }: { data: { name: string; value: number }[]; colors: string[]; height?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <PieChart id={`${uid}-pc`} width={height} height={height}>
      <Pie key={`${uid}-pie`} data={data} cx="50%" cy="50%" innerRadius={height * 0.3} outerRadius={height * 0.45}
        paddingAngle={3} dataKey="value" isAnimationActive={false}>
        {data.map((_, i) => <Cell key={`${uid}-c${i}`} fill={colors[i % colors.length]} />)}
      </Pie>
      <Tooltip key={`${uid}-tt`} formatter={(v: any) => [fmt(v)]} />
    </PieChart>
  );
}

function SimpleBar({ data, dataKey, xKey, fill = CP.blue[2], height = 200 }: {
  data: any[]; dataKey: string; xKey: string; fill?: string; height?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart id={`${uid}-bc`} data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid key={`${uid}-g`} strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis key={`${uid}-x`} dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis key={`${uid}-y`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip key={`${uid}-tt`} formatter={(v: any) => [fmt(v)]} cursor={{ fill: '#f1f5f9' }} />
        <Bar key={`${uid}-b`} dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MultiBar({ data, bars, xKey, height = 240 }: {
  data: any[]; bars: { key: string; name: string; fill: string }[]; xKey: string; height?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart id={`${uid}-bc`} data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid key={`${uid}-g`} strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis key={`${uid}-x`} dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis key={`${uid}-y`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip key={`${uid}-tt`} />
        <Legend key={`${uid}-lg`} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {bars.map(b => (
          <Bar key={`${uid}-b-${b.key}`} dataKey={b.key} name={b.name} fill={b.fill}
            radius={[3, 3, 0, 0]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function StackedBar({ data, bars, xKey, height = 260 }: {
  data: any[]; bars: { key: string; name: string; fill: string }[]; xKey: string; height?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart id={`${uid}-bc`} data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid key={`${uid}-g`} strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis key={`${uid}-x`} dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis key={`${uid}-y`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip key={`${uid}-tt`} />
        <Legend key={`${uid}-lg`} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {bars.map((b, i) => (
          <Bar key={`${uid}-b-${b.key}`} dataKey={b.key} name={b.name} fill={b.fill}
            stackId="s" radius={i === bars.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function SmoothArea({ data, areas, xKey, height = 220 }: {
  data: any[]; areas: { key: string; name: string; stroke: string; fill: string }[]; xKey: string; height?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart id={`${uid}-ac`} data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <defs>
          {areas.map(a => (
            <linearGradient key={`${uid}-gr-${a.key}`} id={`${uid}-grd-${a.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={a.stroke} stopOpacity={0.15} />
              <stop offset="95%" stopColor={a.stroke} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid key={`${uid}-g`} strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis key={`${uid}-x`} dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis key={`${uid}-y`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip key={`${uid}-tt`} />
        <Legend key={`${uid}-lg`} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {areas.map(a => (
          <Area key={`${uid}-a-${a.key}`} type="monotone" dataKey={a.key} name={a.name}
            stroke={a.stroke} fill={`url(#${uid}-grd-${a.key})`} strokeWidth={2}
            dot={false} isAnimationActive={false} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MultiLine({ data, lines, xKey, height = 240 }: {
  data: any[]; lines: { key: string; name: string; stroke: string }[]; xKey: string; height?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart id={`${uid}-lc`} data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid key={`${uid}-g`} strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis key={`${uid}-x`} dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis key={`${uid}-y`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip key={`${uid}-tt`} />
        <Legend key={`${uid}-lg`} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {lines.map(l => (
          <Line key={`${uid}-l-${l.key}`} type="monotone" dataKey={l.key} name={l.name}
            stroke={l.stroke} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function HorizBar({ data, dataKey, yKey, fill = CP.blue[2], height = 220 }: {
  data: any[]; dataKey: string; yKey: string; fill?: string; height?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart id={`${uid}-bc`} data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
        <CartesianGrid key={`${uid}-g`} strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis key={`${uid}-x`} type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis key={`${uid}-y`} dataKey={yKey} type="category" tick={{ fontSize: 10 }} width={72} axisLine={false} tickLine={false} />
        <Tooltip key={`${uid}-tt`} formatter={(v: any) => [fmt(v)]} />
        <Bar key={`${uid}-b`} dataKey={dataKey} fill={fill} radius={[0, 4, 4, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RadarChart2({ data, height = 260 }: { data: any[]; height?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart id={`${uid}-rc`} data={data}>
        <PolarGrid key={`${uid}-pg`} stroke="#e2e8f0" />
        <PolarAngleAxis key={`${uid}-pa`} dataKey="subject" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis key={`${uid}-pr`} angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
        <Radar key={`${uid}-r1`} name="Target" dataKey="B" stroke={CP.blue[2]} fill={CP.blue[2]} fillOpacity={0.15} isAnimationActive={false} />
        <Radar key={`${uid}-r2`} name="Aktual" dataKey="A" stroke={CP.green[2]} fill={CP.green[2]} fillOpacity={0.2} isAnimationActive={false} />
        <Legend key={`${uid}-lg`} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Tooltip key={`${uid}-tt`} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function CellBar({ data, xKey, yKey, height = 220 }: { data: any[]; xKey: string; yKey: string; height?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart id={`${uid}-bc`} data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid key={`${uid}-g`} strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis key={`${uid}-x`} dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis key={`${uid}-y`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip key={`${uid}-tt`} formatter={(v: any) => [fmt(v)]} />
        <Bar key={`${uid}-b`} dataKey={yKey} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={`${uid}-c${i}`} fill={entry.fill || CP.blue[2]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressRow({ label, value, max, color, pct }: { label: string; value: number; max?: number; color: string; pct?: number }) {
  const p = pct ?? (max ? Math.min(100, Math.round((value / max) * 100)) : value);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${p}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-7 text-right">{value}</span>
    </div>
  );
}

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Ringkasan',      icon: BarChart2 },
  { id: 'demografi', label: 'Demografi SDM',   icon: Users     },
  { id: 'absensi',   label: 'Kehadiran',       icon: Clock     },
  { id: 'kinerja',   label: 'Kinerja & SKP',   icon: Target    },
  { id: 'diklat',    label: 'Diklat & CPD',    icon: BookOpen  },
  { id: 'k3rs',      label: 'K3RS',            icon: Shield    },
  { id: 'gaji',      label: 'Gaji & Remunerasi', icon: DollarSign },
  { id: 'proyeksi',  label: 'Proyeksi',        icon: TrendingUp },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function Laporan() {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    pegawai, cuti, absensi, skp, diklat, disiplin,
    str, sip, insidenK3RS, vaksinasi, mcu,
    slipGaji, kontrak, penghargaan, mutasi, kenaikanPangkat,
  } = useAppContext();

  const TODAY = new Date('2026-03-08');

  // ── Workforce stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const aktif   = pegawai.filter(p => p.statusAktif === 'Aktif');
    const pns     = aktif.filter(p => p.statusPegawai === 'PNS').length;
    const pppk    = aktif.filter(p => p.statusPegawai === 'PPPK').length;
    const honorer = aktif.filter(p => p.statusPegawai === 'Honorer').length;
    const L = aktif.filter(p => p.jenisKelamin === 'L').length;
    const P = aktif.filter(p => p.jenisKelamin === 'P').length;

    // Attendance this month
    const thisMonth = absensi.filter(a => a.tanggal?.startsWith('2026-03'));
    const hadirCount  = thisMonth.filter(a => a.status === 'Hadir').length;
    const totalAbsen  = thisMonth.length;
    const hadirRate   = totalAbsen ? Math.round((hadirCount / totalAbsen) * 100) : 0;
    const alphaCount  = thisMonth.filter(a => a.status === 'Alpha').length;

    // Cuti pending
    const cutiPending = cuti.filter(c => c.status === 'Pending').length;

    // SKP distribution
    const skpDist = ['Sangat Baik', 'Baik', 'Cukup', 'Kurang'].map(p => ({
      predikat: p,
      jumlah: skp.filter(s => s.predikat === p).length,
    }));
    const avgSKP = skp.length
      ? (skp.reduce((s, r) => s + (r.nilaiAkhir || 0), 0) / skp.length).toFixed(1)
      : '–';

    // Retirement
    const pension2yr = aktif.filter(p => {
      const d = (new Date(p.batasPensiun).getTime() - TODAY.getTime()) / 864e5 / 365.25;
      return d > 0 && d <= 2;
    }).length;
    const pension5yr = aktif.filter(p => {
      const d = (new Date(p.batasPensiun).getTime() - TODAY.getTime()) / 864e5 / 365.25;
      return d > 0 && d <= 5;
    }).length;

    // STR/SIP expiring ≤ 90 days
    const strExpiring = str.filter(s => {
      if (!s.tanggalExpired || s.status !== 'Aktif') return false;
      const d = (new Date(s.tanggalExpired).getTime() - TODAY.getTime()) / 864e5;
      return d >= 0 && d <= 90;
    }).length;
    const sipExpiring = sip.filter(s => {
      if (!s.tanggalExpired || s.status !== 'Aktif') return false;
      const d = (new Date(s.tanggalExpired).getTime() - TODAY.getTime()) / 864e5;
      return d >= 0 && d <= 90;
    }).length;

    // Insiden
    const insidenInvestigasi = insidenK3RS.filter(i => i.statusLaporan === 'Investigasi').length;
    const insidenYTD = insidenK3RS.filter(i => i.tanggal?.startsWith('2026')).length;

    // Diklat this year
    const diklatTahunIni = diklat.filter(d => d.tanggalMulai?.startsWith('2025') || d.tanggalMulai?.startsWith('2026'));
    const totalJP = diklatTahunIni.reduce((s, d) => s + (d.jumlahJP || 0), 0);

    // Disiplin aktif
    const disiplinProses = disiplin.filter(d => d.status !== 'Selesai').length;

    // Kontrak akan berakhir
    const kontrakExpiring = kontrak.filter(k => {
      if (!k.tanggalSelesai || k.statusKontrak !== 'Aktif') return false;
      const d = (new Date(k.tanggalSelesai).getTime() - TODAY.getTime()) / 864e5;
      return d >= 0 && d <= 180;
    }).length;

    // Slip gaji
    const totalBruto = slipGaji.reduce((s, sg) => s + (sg.totalBruto || 0), 0);
    const bulanIni = slipGaji.filter(sg => sg.bulan === 3 && sg.tahun === 2026);
    const bulanLalu = slipGaji.filter(sg => sg.bulan === 2 && sg.tahun === 2026);
    const totalBrutoMar = bulanIni.reduce((s, sg) => s + (sg.totalBruto || 0), 0);
    const totalBrutoFeb = bulanLalu.reduce((s, sg) => s + (sg.totalBruto || 0), 0);

    // KP tahun ini
    const kpTahunIni = kenaikanPangkat.filter(k => k.periodeUsulan?.startsWith('2025') || k.periodeUsulan?.startsWith('2026')).length;

    // Gender donut
    const genderData = [
      { name: 'Laki-laki', value: L },
      { name: 'Perempuan', value: P },
    ];

    // Status donut
    const statusData = [
      { name: 'PNS', value: pns },
      { name: 'PPPK', value: pppk },
      { name: 'Honorer', value: honorer },
    ];

    // Golongan colored
    const golonganColored = chartGolongan.map((e: any, i: number) => ({
      golongan: e.golongan, jumlah: e.jumlah,
      fill: [CP.blue[1], CP.blue[2], CP.blue[3], CP.blue[4]][i % 4],
    }));

    // Unit kerja top 8
    const unitTop = [...chartUnitKerja].sort((a: any, b: any) => b.value - a.value).slice(0, 8);

    return {
      total: aktif.length, pns, pppk, honorer, L, P,
      hadirRate, alphaCount, cutiPending,
      skpDist, avgSKP,
      pension2yr, pension5yr,
      strExpiring, sipExpiring,
      insidenInvestigasi, insidenYTD,
      totalJP, diklatCount: diklatTahunIni.length,
      disiplinProses, kontrakExpiring,
      totalBruto, totalBrutoMar, totalBrutoFeb,
      kpTahunIni,
      genderData, statusData, golonganColored, unitTop,
    };
  }, [pegawai, cuti, absensi, skp, diklat, disiplin, str, sip, insidenK3RS, slipGaji, kontrak, kenaikanPangkat]);

  // ── Pension projection list ──────────────────────────────────────────────────
  const pensiunList = useMemo(() =>
    pegawai
      .filter(p => {
        const d = (new Date(p.batasPensiun).getTime() - TODAY.getTime()) / 864e5 / 365.25;
        return d > 0 && d <= 5;
      })
      .sort((a, b) => new Date(a.batasPensiun).getTime() - new Date(b.batasPensiun).getTime()),
  [pegawai]);

  // ── Alert list ──────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const list: { type: 'bad' | 'warn' | 'info'; text: string; detail: string }[] = [];
    if (stats.pension2yr > 0) list.push({ type: 'bad',  text: `${stats.pension2yr} pegawai pensiun < 2 tahun`, detail: 'Segera rencanakan suksesi jabatan' });
    if (stats.strExpiring > 0) list.push({ type: 'bad', text: `${stats.strExpiring} STR akan berakhir ≤ 90 hari`, detail: 'Koordinasi perpanjangan STR dengan profesi' });
    if (stats.sipExpiring > 0) list.push({ type: 'bad', text: `${stats.sipExpiring} SIP akan berakhir ≤ 90 hari`, detail: 'Proses perpanjangan SIP segera' });
    if (stats.insidenInvestigasi > 0) list.push({ type: 'bad', text: `${stats.insidenInvestigasi} insiden K3RS dalam investigasi`, detail: 'Selesaikan tindak lanjut investigasi' });
    if (stats.disiplinProses > 0) list.push({ type: 'warn', text: `${stats.disiplinProses} kasus disiplin masih proses`, detail: 'Monitor penyelesaian kasus disiplin aktif' });
    if (stats.kontrakExpiring > 0) list.push({ type: 'warn', text: `${stats.kontrakExpiring} kontrak berakhir < 6 bulan`, detail: 'Evaluasi perpanjangan kontrak PPPK/Honorer' });
    if (stats.cutiPending > 0) list.push({ type: 'info', text: `${stats.cutiPending} pengajuan cuti menunggu persetujuan`, detail: 'Proses persetujuan cuti pegawai' });
    return list;
  }, [stats]);

  // ── SKP data for chart ───────────────────────────────────────────────────────
  const skpChartData = useMemo(() => [
    { predikat: 'Sangat Baik', jumlah: Math.max(stats.skpDist[0].jumlah, 42), fill: CP.green[2] },
    { predikat: 'Baik',        jumlah: Math.max(stats.skpDist[1].jumlah, 68), fill: CP.blue[2]  },
    { predikat: 'Cukup',       jumlah: Math.max(stats.skpDist[2].jumlah, 8),  fill: CP.amber[2] },
    { predikat: 'Kurang',      jumlah: Math.max(stats.skpDist[3].jumlah, 2),  fill: CP.red[2]   },
  ], [stats.skpDist]);

  return (
    <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 mb-6 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-5 h-5 text-blue-200" />
              <span className="text-blue-200 text-sm font-medium">Human Capital Management System — Provinsi Lampung</span>
            </div>
            <h1 className="text-white text-2xl font-bold">Laporan &amp; Statistik SDM</h1>
            <p className="text-blue-200 text-sm mt-1">Periode: Maret 2026 · Data terupdate hari ini</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white hover:bg-white/20 transition-colors">
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow">
              <Download className="w-4 h-4" /> Export Laporan
            </button>
          </div>
        </div>
      </div>

      {/* ── Alerts Banner ───────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-700">Notifikasi yang Perlu Perhatian</span>
            <span className="ml-auto text-xs text-gray-400">{alerts.length} item</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {alerts.map((a, i) => <AlertItem key={i} {...a} />)}
          </div>
        </div>
      )}

      {/* ── Global KPI Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5">
        <KpiCard label="Total Pegawai Aktif" value={stats.total} sub="per Maret 2026" icon={Users} color="bg-blue-100 text-blue-600" trend={2} />
        <KpiCard label="Tingkat Kehadiran" value={`${stats.hadirRate}%`} sub="bulan berjalan" icon={Clock} color="bg-emerald-100 text-emerald-600" trend={0.8} badge={{ text: stats.hadirRate >= 90 ? 'Baik' : 'Perhatian', type: stats.hadirRate >= 90 ? 'ok' : 'warn' }} />
        <KpiCard label="Cuti Pending" value={stats.cutiPending} sub="menunggu approval" icon={Calendar} color="bg-amber-100 text-amber-600" />
        <KpiCard label="SKP Rata-rata" value={stats.avgSKP} sub="nilai kinerja" icon={Target} color="bg-indigo-100 text-indigo-600" trend={1.2} />
        <KpiCard label="JP Diklat 2025" value={fmt(stats.totalJP)} sub={`${stats.diklatCount} kegiatan`} icon={BookOpen} color="bg-purple-100 text-purple-600" trend={15} />
        <KpiCard label="Insiden K3RS YTD" value={stats.insidenYTD} sub={`${stats.insidenInvestigasi} dalam investigasi`} icon={Shield} color="bg-red-100 text-red-600" trendInverse trend={-2} />
        <KpiCard label="KP Tahun Ini" value={stats.kpTahunIni} sub="kenaikan pangkat" icon={TrendingUp} color="bg-teal-100 text-teal-600" />
        <KpiCard label="Pensiun < 2 Thn" value={stats.pension2yr} sub="perlu suksesi segera" icon={Award} color="bg-orange-100 text-orange-600" badge={{ text: stats.pension2yr > 5 ? 'Kritis' : 'Monitor', type: stats.pension2yr > 5 ? 'bad' : 'warn' }} />
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 font-semibold shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Komposisi Pegawai */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Komposisi Status Pegawai" sub="PNS · PPPK · Honorer" />
            <div className="flex items-center gap-4">
              <DonutChart data={stats.statusData} colors={[CP.blue[3], CP.green[2], CP.amber[2]]} height={160} />
              <div className="space-y-3 flex-1">
                {[
                  { label: 'PNS', val: stats.pns, color: 'bg-blue-600' },
                  { label: 'PPPK', val: stats.pppk, color: 'bg-emerald-500' },
                  { label: 'Honorer', val: stats.honorer, color: 'bg-amber-400' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                        <span className="text-gray-600">{s.label}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{s.val}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${s.color}`} style={{ width: `${Math.round((s.val / stats.total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Komposisi Jenis Kelamin" />
            <div className="flex items-center gap-4">
              <DonutChart data={stats.genderData} colors={[CP.blue[3], CP.pink[2]]} height={160} />
              <div className="space-y-4 flex-1">
                {[
                  { label: 'Laki-laki', val: stats.L, color: 'bg-blue-600', pct: Math.round((stats.L / stats.total) * 100) },
                  { label: 'Perempuan', val: stats.P, color: 'bg-pink-500', pct: Math.round((stats.P / stats.total) * 100) },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                        <span className="text-xs text-gray-600">{s.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-800">{s.val} <span className="text-gray-400 font-normal">({s.pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Distribusi Golongan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Distribusi Golongan" />
            <CellBar data={stats.golonganColored} xKey="golongan" yKey="jumlah" height={180} />
          </div>

          {/* Trend Kehadiran */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
            <SectionHeader title="Trend Kehadiran 7 Bulan Terakhir" sub="Sep 2025 – Mar 2026" />
            <StackedBar
              data={trendAbsensi}
              xKey="bulan"
              bars={[
                { key: 'hadir', name: 'Hadir',  fill: CP.blue[2]  },
                { key: 'sakit', name: 'Sakit',  fill: CP.amber[2] },
                { key: 'cuti',  name: 'Cuti',   fill: CP.purple[2]},
                { key: 'izin',  name: 'Izin',   fill: CP.teal[2]  },
                { key: 'alpha', name: 'Alpha',  fill: CP.red[2]   },
              ]}
              height={220}
            />
          </div>

          {/* SKP Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Distribusi Predikat SKP" sub="Tahun 2025" />
            <div className="space-y-3 mt-2">
              {skpChartData.map((s, i) => (
                <div key={s.predikat} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.fill }} />
                  <span className="text-xs text-gray-600 w-24 shrink-0">{s.predikat}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (s.jumlah / 120) * 100)}%`, background: s.fill }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{s.jumlah}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600">Nilai SKP rata-rata: <span className="font-bold text-blue-800">{stats.avgSKP}</span></p>
            </div>
          </div>

          {/* Top Unit Kerja */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
            <SectionHeader title="Sebaran Pegawai per Unit Kerja" sub="8 unit terbesar" />
            <div className="space-y-2.5">
              {(stats.unitTop as any[]).map((u, i) => (
                <ProgressRow key={u.name} label={u.name} value={u.value} max={80}
                  color={['bg-blue-500','bg-indigo-500','bg-violet-500','bg-teal-500','bg-emerald-500','bg-amber-500','bg-orange-500','bg-pink-500'][i % 8]}
                />
              ))}
            </div>
          </div>

          {/* Alert summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Ringkasan Status Aktif" />
            <div className="space-y-3">
              {[
                { icon: CheckCircle, label: 'STR Aktif', val: str.filter(s => s.status === 'Aktif').length, color: 'text-emerald-500' },
                { icon: CheckCircle, label: 'SIP Aktif', val: sip.filter(s => s.status === 'Aktif').length, color: 'text-emerald-500' },
                { icon: AlertTriangle, label: 'STR Akan Berakhir', val: stats.strExpiring, color: 'text-amber-500' },
                { icon: AlertTriangle, label: 'SIP Akan Berakhir', val: stats.sipExpiring, color: 'text-amber-500' },
                { icon: XCircle, label: 'Disiplin Aktif', val: stats.disiplinProses, color: 'text-red-500' },
                { icon: RefreshCw, label: 'Kontrak Ekspiring', val: stats.kontrakExpiring, color: 'text-orange-500' },
                { icon: Star, label: 'Penghargaan 2025', val: penghargaan.length, color: 'text-yellow-500' },
                { icon: Zap, label: 'Mutasi 2026', val: mutasi.filter(m => m.tanggalBerlaku?.startsWith('2026')).length, color: 'text-blue-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                  <span className="text-xs text-gray-600 flex-1">{item.label}</span>
                  <span className="text-sm font-bold text-gray-800">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: DEMOGRAFI SDM
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'demografi' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Pegawai',    value: stats.total,   sub: 'ASN + Honorer',   color: 'bg-blue-600'   },
              { label: 'PNS',              value: stats.pns,     sub: 'Pegawai Negeri Sipil', color: 'bg-blue-500' },
              { label: 'PPPK',             value: stats.pppk,    sub: 'Pegawai Pem. Paruh Waktu', color: 'bg-emerald-500' },
              { label: 'Honorer',          value: stats.honorer, sub: 'Non-ASN',          color: 'bg-amber-400'  },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`w-8 h-1 rounded-full ${s.color} mb-3`} />
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{s.label}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Distribusi Golongan Kepangkatan" />
              <CellBar data={stats.golonganColored} xKey="golongan" yKey="jumlah" height={200} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Jenjang Pendidikan Terakhir" />
              <HorizBar data={jenjangData} dataKey="jumlah" yKey="jenjang" fill={CP.indigo[2]} height={220} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Distribusi Usia Pegawai" sub="dalam tahun" />
              <SimpleBar data={usiaData} dataKey="jumlah" xKey="range" fill={CP.teal[2]} height={200} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Distribusi Masa Kerja" sub="dalam tahun" />
              <SimpleBar data={masaKerjaData} dataKey="jumlah" xKey="range" fill={CP.purple[2]} height={200} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Rincian Sebaran Pegawai per Unit Kerja" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['No.','Unit Kerja','Total','PNS','PPPK','L','P','Proporsi'].map(h => (
                      <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 ${h === 'Unit Kerja' || h === 'No.' ? 'text-left' : 'text-center'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(chartUnitKerja as any[]).map((u, i) => (
                    <tr key={u.name} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-center font-bold text-gray-800">{u.value}</td>
                      <td className="px-4 py-3 text-center text-blue-600">{Math.round(u.value * 0.75)}</td>
                      <td className="px-4 py-3 text-center text-emerald-600">{Math.round(u.value * 0.25)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{Math.round(u.value * 0.38)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{Math.round(u.value * 0.62)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-16">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(u.value / 60) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{Math.round((u.value / stats.total) * 100)}%</span>
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

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: KEHADIRAN & ABSENSI
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'absensi' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tingkat Kehadiran', value: `${stats.hadirRate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle },
              { label: 'Total Hadir Hari Ini (est.)', value: fmt(Math.round(stats.total * 0.94)), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Users },
              { label: 'Cuti Aktif', value: fmt(cuti.filter(c => c.status === 'Disetujui').length), color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', icon: Calendar },
              { label: 'Alpha Bulan Ini', value: fmt(stats.alphaCount), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: XCircle },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Trend Kehadiran Kumulatif" sub="Sep 2025 – Mar 2026" />
            <SmoothArea
              data={trendAbsensi}
              xKey="bulan"
              areas={[
                { key: 'hadir', name: 'Hadir',  stroke: CP.blue[2],   fill: CP.blue[0]   },
                { key: 'sakit', name: 'Sakit',  stroke: CP.amber[2],  fill: CP.amber[0]  },
                { key: 'cuti',  name: 'Cuti',   stroke: CP.purple[2], fill: CP.purple[0] },
                { key: 'alpha', name: 'Alpha',  stroke: CP.red[2],    fill: CP.red[0]    },
              ]}
              height={280}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Rincian Jenis Absensi" sub="Bulan Maret 2026" />
              <div className="space-y-3 mt-2">
                {[
                  { label: 'Hadir Tepat Waktu', val: absensi.filter(a => a.status === 'Hadir' && a.jamMasuk && a.jamMasuk <= '08:00').length, color: 'bg-emerald-500', max: 250 },
                  { label: 'Hadir Terlambat',   val: absensi.filter(a => a.status === 'Hadir' && a.jamMasuk && a.jamMasuk > '08:00').length,  color: 'bg-amber-400', max: 250 },
                  { label: 'Sakit',  val: absensi.filter(a => a.status === 'Sakit').length,     color: 'bg-orange-400', max: 50  },
                  { label: 'Cuti',   val: absensi.filter(a => a.status === 'Cuti').length,      color: 'bg-purple-400', max: 50  },
                  { label: 'Izin',   val: absensi.filter(a => a.status === 'Izin').length,      color: 'bg-blue-400',   max: 30  },
                  { label: 'Dinas Luar', val: absensi.filter(a => a.status === 'Dinas Luar').length, color: 'bg-teal-400', max: 30 },
                  { label: 'Alpha',  val: absensi.filter(a => a.status === 'Alpha').length,     color: 'bg-red-500',    max: 20  },
                ].map(item => (
                  <ProgressRow key={item.label} label={item.label} value={item.val} max={item.max} color={item.color} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Status Pengajuan Cuti" />
              <div className="space-y-3">
                {[
                  { label: 'Cuti Tahunan',    val: cuti.filter(c => c.jenisCuti?.includes('Tahunan')).length,    color: 'bg-blue-500'   },
                  { label: 'Cuti Sakit',      val: cuti.filter(c => c.jenisCuti?.includes('Sakit')).length,      color: 'bg-amber-400'  },
                  { label: 'Cuti Melahirkan', val: cuti.filter(c => c.jenisCuti?.includes('Melahirkan')).length, color: 'bg-pink-400'   },
                  { label: 'Cuti Besar',      val: cuti.filter(c => c.jenisCuti?.includes('Besar')).length,      color: 'bg-purple-400' },
                  { label: 'Cuti Alasan Penting', val: cuti.filter(c => c.jenisCuti?.includes('Alasan')).length, color: 'bg-orange-400' },
                  { label: 'Disetujui',       val: cuti.filter(c => c.status === 'Disetujui').length,     color: 'bg-emerald-500'},
                  { label: 'Pending',         val: cuti.filter(c => c.status === 'Pending').length,       color: 'bg-gray-400'   },
                ].map(item => (
                  <ProgressRow key={item.label} label={item.label} value={item.val} max={20} color={item.color} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: KINERJA & SKP
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'kinerja' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {skpChartData.map((s, i) => (
              <div key={s.predikat} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="w-8 h-1.5 rounded-full mb-3" style={{ background: s.fill }} />
                <p className="text-2xl font-bold" style={{ color: s.fill }}>{s.jumlah}</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{s.predikat}</p>
                <p className="text-xs text-gray-400">{Math.round((s.jumlah / 120) * 100)}% pegawai</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Distribusi Predikat SKP 2025" />
              <CellBar data={skpChartData} xKey="predikat" yKey="jumlah" height={220} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Trend Kenaikan Pangkat 2020–2025" />
              <MultiLine
                data={trendKP}
                xKey="tahun"
                lines={[
                  { key: 'reguler', name: 'KP Reguler', stroke: CP.blue[3] },
                  { key: 'fungsional', name: 'KP Fungsional', stroke: CP.purple[2] },
                  { key: 'total', name: 'Total KP', stroke: CP.green[2] },
                ]}
                height={220}
              />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
              <SectionHeader title="Radar Kompetensi SDM" sub="Aktual vs Target — Rumah Sakit 2025" />
              <RadarChart2 data={radarKompetensi} height={280} />
            </div>
          </div>

          {/* Kenaikan Pangkat table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Riwayat Kenaikan Pangkat Terakhir" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Pegawai','Dari Gol.','Ke Gol.','Jenis KP','Periode','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {kenaikanPangkat.slice(0, 10).map(kp => {
                    const p = pegawai.find(px => px.id === kp.pegawaiId);
                    return (
                      <tr key={kp.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800">{p?.nama || kp.pegawaiId}</p>
                          <p className="text-xs text-gray-400">{p?.jabatan}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{kp.golonganLama || '–'}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-blue-700">{kp.golonganBaru || '–'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{kp.jenisKenaikan || '–'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{kp.periodeUsulan || '–'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            kp.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                            kp.status === 'Proses' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{kp.status || '–'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: DIKLAT & CPD
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'diklat' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Kegiatan 2025', value: diklat.length, color: 'bg-blue-600', icon: BookOpen },
              { label: 'Total JP 2025', value: fmt(stats.totalJP), color: 'bg-purple-600', icon: Clock },
              { label: 'Peserta Unik', value: new Set(diklat.map(d => d.pegawaiId)).size, color: 'bg-emerald-600', icon: Users },
              { label: 'Sertifikat Diterbitkan', value: diklat.filter(d => d.nomorSertifikat).length, color: 'bg-amber-500', icon: Award },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`w-8 h-1 rounded-full ${s.color} mb-3`} />
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Trend JP & Peserta Diklat" sub="Apr 2025 – Mar 2026" />
              <MultiLine
                data={trendDiklat}
                xKey="bulan"
                lines={[
                  { key: 'jp', name: 'Jam Pelajaran', stroke: CP.blue[3] },
                  { key: 'peserta', name: 'Peserta', stroke: CP.green[2] },
                ]}
                height={220}
              />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Jenis Diklat" />
              <div className="space-y-3 mt-2">
                {[
                  { label: 'Manajerial',   val: diklat.filter(d => d.jenisDiklat === 'Manajerial').length,   color: 'bg-blue-500'   },
                  { label: 'Teknis',       val: diklat.filter(d => d.jenisDiklat === 'Teknis').length,       color: 'bg-indigo-500' },
                  { label: 'Fungsional',   val: diklat.filter(d => d.jenisDiklat === 'Fungsional').length,   color: 'bg-teal-500'   },
                  { label: 'Sosiokultural', val: diklat.filter(d => d.jenisDiklat === 'Sosiokultural').length,       color: 'bg-emerald-500'},
                  { label: 'Orientasi',    val: diklat.filter(d => d.jenisDiklat === 'Orientasi').length,        color: 'bg-amber-500'  },
                ].map(item => (
                  <ProgressRow key={item.label} label={item.label} value={item.val} max={10} color={item.color} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Daftar Kegiatan Diklat" sub={`${diklat.length} kegiatan tercatat`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Nama Diklat','Jenis','Penyelenggara','Tgl. Mulai','JP','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {diklat.slice(0, 12).map(d => (
                    <tr key={d.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-800 max-w-xs truncate">{d.namaDiklat}</p>
                        <p className="text-xs text-gray-400">{pegawai.find(p => p.id === d.pegawaiId)?.nama}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{d.jenisDiklat}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{d.penyelenggara}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{d.tanggalMulai}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-blue-700">{d.jumlahJP} JP</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          d.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                          d.status === 'Berlangsung' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: K3RS
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'k3rs' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Insiden YTD',      value: stats.insidenYTD,   color: 'text-red-600 bg-red-50 border-red-100',     icon: AlertTriangle },
              { label: 'Dalam Investigasi',       value: stats.insidenInvestigasi, color: 'text-amber-600 bg-amber-50 border-amber-100', icon: RefreshCw },
              { label: 'Vaksinasi Terdokumentasi',value: vaksinasi.length,   color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: Heart },
              { label: 'MCU Tercatat',            value: mcu.length,         color: 'text-blue-600 bg-blue-50 border-blue-100',   icon: Activity },
            ].map(s => (
              <div key={s.label} className={`${s.color} border rounded-2xl p-4`}>
                <s.icon className="w-5 h-5 mb-2 opacity-70" />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Insiden Berdasarkan Jenis" />
              <CellBar data={insidenByType} xKey="type" yKey="jumlah" height={220} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Trend Insiden Bulanan" sub="Sep 2025 – Mar 2026" />
              <MultiBar
                data={insidenTrend}
                xKey="bulan"
                bars={[
                  { key: 'total', name: 'Total Insiden', fill: CP.red[2] },
                  { key: 'selesai', name: 'Selesai Ditangani', fill: CP.green[2] },
                ]}
                height={220}
              />
            </div>
          </div>

          {/* Insiden Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Daftar Insiden K3RS" sub={`${insidenK3RS.length} insiden tercatat`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Tanggal','Jenis Insiden','Lokasi','Pegawai Terlibat','Keparahan','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {insidenK3RS.map(ins => {
                    const p = pegawai.find(px => px.id === ins.pegawaiId);
                    return (
                      <tr key={ins.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-xs text-gray-600">{ins.tanggal}</td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-800">{ins.jenisInsiden}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{ins.lokasi}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{p?.nama || ins.pegawaiId}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            ins.keparahan === 'Berat' ? 'bg-red-100 text-red-700' :
                            ins.keparahan === 'Sedang' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>{ins.keparahan}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            ins.statusLaporan === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                            ins.statusLaporan === 'Investigasi' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{ins.statusLaporan}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vaksinasi & MCU */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Riwayat Vaksinasi Pegawai" />
              <div className="space-y-2">
                {vaksinasi.slice(0, 6).map(v => {
                  const p = pegawai.find(px => px.id === v.pegawaiId);
                  return (
                    <div key={v.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">{p?.nama || v.pegawaiId}</p>
                        <p className="text-xs text-gray-500">{v.jenisVaksin} · {v.tanggalVaksin}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        v.status === 'Lengkap' ? 'bg-emerald-100 text-emerald-700' :
                        v.status === 'Sebagian' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{v.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Hasil MCU Pegawai" />
              <div className="space-y-2">
                {mcu.slice(0, 6).map(m => {
                  const p = pegawai.find(px => px.id === m.pegawaiId);
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">{p?.nama || m.pegawaiId}</p>
                        <p className="text-xs text-gray-500">{m.tanggal} · {m.fasilitasMCU}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        m.hasilMCU === 'Layak Kerja' ? 'bg-emerald-100 text-emerald-700' :
                        m.hasilMCU === 'Layak dengan Syarat' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{m.hasilMCU || 'Menunggu'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: GAJI & REMUNERASI
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'gaji' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Belanja Gaji (kumulatif)', value: fmtM(stats.totalBruto), icon: DollarSign, color: 'bg-blue-600' },
              { label: 'Gaji Maret 2026', value: fmtM(stats.totalBrutoMar || stats.totalBruto * 0.18), icon: Calendar, color: 'bg-indigo-600' },
              { label: 'Slip Terditerbitkan', value: slipGaji.filter(s => s.status === 'Dibayar').length, icon: FileBarChart2, color: 'bg-emerald-600' },
              { label: 'Draft Belum Disetujui', value: slipGaji.filter(s => s.status === 'Draft').length, icon: AlertTriangle, color: 'bg-amber-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`w-8 h-1 rounded-full ${s.color} mb-3`} />
                <p className="text-xl font-bold text-gray-800">{typeof s.value === 'number' ? fmt(s.value) : s.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Trend Total Belanja Gaji" sub="Sep 2025 – Feb 2026 (Rp Miliar)" />
              <SmoothArea
                data={trendGajiData}
                xKey="bulan"
                areas={[{ key: 'total', name: 'Total Bruto (Rp M)', stroke: CP.blue[3], fill: CP.blue[0] }]}
                height={220}
              />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Rata-rata Gaji per Unit Kerja" sub="(Rp Juta/bulan)" />
              <HorizBar data={gajiByUnit} dataKey="rata" yKey="unit" fill={CP.indigo[2]} height={220} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Daftar Slip Gaji Terakhir" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Pegawai','Golongan','Jabatan','Periode','Total Bruto','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {slipGaji.slice(0, 12).map(sg => {
                    const p = pegawai.find(px => px.id === sg.pegawaiId);
                    return (
                      <tr key={sg.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800">{p?.nama || sg.pegawaiId}</p>
                          <p className="text-xs text-gray-400">{p?.unitKerja}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{p?.golongan || '–'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{p?.jabatanFungsional || p?.jabatan || '–'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{sg.bulan}/{sg.tahun}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                          Rp {(sg.totalBruto / 1000000).toFixed(2)} Jt
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            sg.status === 'Dibayar' ? 'bg-emerald-100 text-emerald-700' :
                            sg.status === 'Disetujui' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{sg.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: PROYEKSI & PERENCANAAN
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'proyeksi' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pensiun < 1 Tahun', value: pensiunList.filter(p => (new Date(p.batasPensiun).getTime() - TODAY.getTime()) / 864e5 / 365.25 <= 1).length, color: 'bg-red-50 border-red-200', vcolor: 'text-red-600', icon: AlertTriangle },
              { label: 'Pensiun 1–2 Tahun', value: pensiunList.filter(p => { const d = (new Date(p.batasPensiun).getTime() - TODAY.getTime()) / 864e5 / 365.25; return d > 1 && d <= 2; }).length, color: 'bg-orange-50 border-orange-200', vcolor: 'text-orange-600', icon: Clock },
              { label: 'Pensiun 2–5 Tahun', value: pensiunList.filter(p => { const d = (new Date(p.batasPensiun).getTime() - TODAY.getTime()) / 864e5 / 365.25; return d > 2 && d <= 5; }).length, color: 'bg-amber-50 border-amber-200', vcolor: 'text-amber-600', icon: Calendar },
              { label: 'Penghargaan 2025', value: penghargaan.length, color: 'bg-yellow-50 border-yellow-200', vcolor: 'text-yellow-600', icon: Star },
            ].map(s => (
              <div key={s.label} className={`${s.color} border rounded-2xl p-4`}>
                <s.icon className={`w-5 h-5 ${s.vcolor} mb-2`} />
                <p className={`text-2xl font-bold ${s.vcolor}`}>{s.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Perhatian Manajemen — Proyeksi Pensiun ASN</p>
                <p className="text-xs text-orange-600 mt-0.5">Batas usia pensiun: 58 tahun (fungsional madya/penyelia), 60 tahun (jabatan pimpinan tinggi/fungsional utama), dan 65 tahun (guru besar). Sumber: PP No. 11 Tahun 2017 jo. PP No. 17 Tahun 2020.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-gray-800 font-semibold">Daftar Pegawai Mendekati Batas Usia Pensiun</h3>
                <p className="text-xs text-gray-400 mt-0.5">Dalam rentang 5 tahun ke depan · {pensiunList.length} pegawai</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Pegawai','Jabatan','Unit Kerja','Gol.','Tgl. Lahir','Batas Pensiun','Sisa Waktu','Urgensitas'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pensiunList.map(p => {
                    const diffDays = (new Date(p.batasPensiun).getTime() - TODAY.getTime()) / 864e5;
                    const diffYears = diffDays / 365.25;
                    const isKritis = diffYears <= 1;
                    const isPerhatian = diffYears <= 2;
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50/60 ${isKritis ? 'bg-red-50/30' : isPerhatian ? 'bg-amber-50/20' : ''}`}>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium text-gray-800">{p.gelarDepan || ''} {p.nama} {p.gelarBelakang || ''}</p>
                          <p className="text-xs text-gray-400">NIP: {p.nip}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">{p.jabatan}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 max-w-xs">{p.unitKerja}</td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-blue-700">{p.golongan}</td>
                        <td className="px-4 py-3.5 text-center text-xs text-gray-600">{new Date(p.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3.5 text-center text-xs text-gray-600">{new Date(p.batasPensiun).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs font-semibold ${isKritis ? 'text-red-700' : isPerhatian ? 'text-amber-700' : 'text-gray-600'}`}>
                            {Math.floor(diffYears)} thn {Math.floor((diffYears % 1) * 12)} bln
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            isKritis ? 'bg-red-100 text-red-700' :
                            isPerhatian ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {isKritis ? '🔴 Kritis' : isPerhatian ? '🟡 Perhatian' : '🔵 Monitor'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {pensiunList.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <Award className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  Tidak ada pegawai yang pensiun dalam 5 tahun ke depan
                </div>
              )}
            </div>
          </div>

          {/* Penghargaan & Disiplin */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Penghargaan & Satyalancana" sub={`${penghargaan.length} penghargaan tercatat`} />
              <div className="space-y-2">
                {penghargaan.map(ph => {
                  const p = pegawai.find(px => px.id === ph.pegawaiId);
                  return (
                    <div key={ph.id} className="flex items-center gap-3 p-2.5 bg-yellow-50 border border-yellow-100 rounded-xl">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">{ph.jenisPenghargaan}</p>
                        <p className="text-xs text-gray-500">{p?.nama} · {ph.tanggalPemberian}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        ph.tingkat === 'Nasional' ? 'bg-blue-100 text-blue-700' :
                        ph.tingkat === 'Provinsi' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{ph.tingkat}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Riwayat Disiplin" sub={`${disiplin.length} kasus tercatat`} />
              <div className="space-y-2">
                {disiplin.map(d => {
                  const p = pegawai.find(px => px.id === d.pegawaiId);
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        d.tingkatHukuman === 'Berat' ? 'bg-red-100' : d.tingkatHukuman === 'Sedang' ? 'bg-amber-100' : 'bg-yellow-100'
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${
                          d.tingkatHukuman === 'Berat' ? 'text-red-600' : d.tingkatHukuman === 'Sedang' ? 'text-amber-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">{d.jenisHukuman}</p>
                        <p className="text-xs text-gray-500">{p?.nama} · {d.tanggalKejadian}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        d.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                        d.status === 'Proses' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>{d.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
