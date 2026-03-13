/**
 * SimulationAdvanced.tsx — Sensitivity Analysis & Monte Carlo Simulation
 * Advanced analytics for Operations Simulation Engine
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Shuffle, Target, TrendingUp,
  ArrowRight, AlertTriangle, CheckCircle2, Activity,
  Play, RefreshCw, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import RechartsWrapper from '../RechartsWrapper';
import { clinicalKPI } from '../../data/hospitalDashboardData';
import { PdfExportButton, generateSimulationPdf } from './SimulationPdfExport';
import type { PdfSection } from './SimulationPdfExport';

// ─── Baseline (shared) ───────────────────────────────────────────────────────
const BL = {
  totalBeds: 280,
  bor: clinicalKPI.bor,
  alos: clinicalKPI.alos,
  erWait: clinicalKPI.erWaitingTime,
  dailyPatients: 420,
  monthlyRevenue: 18_500_000_000,
  staffTotal: 246,
  staffCostPerMonth: 8_200_000,
};

// ─── Pseudo-random with Box-Muller ────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function boxMuller(rand: () => number): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = rand();
  while (u2 === 0) u2 = rand();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function normalRandom(mean: number, stdDev: number, rand: () => number): number {
  return mean + boxMuller(rand) * stdDev;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children, rightSlot }: {
  title: string; subtitle: string; children: React.ReactNode; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SENSITIVITY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

interface SensitivityVar {
  id: string;
  label: string;
  baseline: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SENS_VARS: SensitivityVar[] = [
  { id: 'volumeGrowth', label: 'Kenaikan Volume Pasien', baseline: 20, min: 0, max: 60, step: 5, unit: '%' },
  { id: 'alosReduction', label: 'Reduksi ALOS', baseline: 10, min: 0, max: 40, step: 5, unit: '%' },
  { id: 'waitReduction', label: 'Reduksi Waiting Time', baseline: 15, min: 0, max: 50, step: 5, unit: '%' },
  { id: 'addBeds', label: 'Penambahan TT', baseline: 20, min: 0, max: 80, step: 10, unit: ' TT' },
  { id: 'nurseRatio', label: 'Rasio Perawat:Bed', baseline: 6, min: 3, max: 10, step: 1, unit: ':1' },
  { id: 'revenueGrowth', label: 'Pertumbuhan Revenue', baseline: 15, min: 0, max: 40, step: 5, unit: '%' },
];

type OutputKPI = 'bor' | 'revenue' | 'staffCost' | 'erWait' | 'netImpact';

const OUTPUT_KPIS: { id: OutputKPI; label: string; unit: string }[] = [
  { id: 'bor', label: 'BOR (%)', unit: '%' },
  { id: 'revenue', label: 'Revenue/thn (M)', unit: 'M' },
  { id: 'staffCost', label: 'Biaya SDM/thn (M)', unit: 'M' },
  { id: 'erWait', label: 'ER Wait (mnt)', unit: 'mnt' },
  { id: 'netImpact', label: 'Net Impact (M)', unit: 'M' },
];

function computeKPIs(vars: Record<string, number>): Record<OutputKPI, number> {
  const vg = vars.volumeGrowth ?? 20;
  const ar = vars.alosReduction ?? 10;
  const wr = vars.waitReduction ?? 15;
  const ab = vars.addBeds ?? 20;
  const nr = vars.nurseRatio ?? 6;
  const rg = vars.revenueGrowth ?? 15;

  const factor = 1 + vg / 100;
  const newTotalBeds = BL.totalBeds + ab;
  const alosEffect = ar / 100 * 0.3;
  const rawBOR = BL.bor * factor * (1 - alosEffect);
  const bor = Math.min(100, Math.max(30, rawBOR * (BL.totalBeds / newTotalBeds)));
  const erWait = Math.max(5, BL.erWait * (1 + vg / 200) * (1 - wr / 100));
  const monthlyRev = BL.monthlyRevenue * (1 + rg / 100);
  const annualRevenue = monthlyRev * 12;
  const idealNurses = Math.ceil(newTotalBeds * bor / 100 / nr);
  const additionalStaff = Math.max(0, Math.ceil(BL.staffTotal * vg / 100 * 0.3) + Math.max(0, idealNurses - 98));
  const staffCost = additionalStaff * BL.staffCostPerMonth * 12;
  const revenueGain = (monthlyRev - BL.monthlyRevenue) * 12;
  const netImpact = revenueGain - staffCost;

  return {
    bor: +bor.toFixed(1),
    revenue: +(annualRevenue / 1e9).toFixed(1),
    staffCost: +(staffCost / 1e9).toFixed(2),
    erWait: +erWait.toFixed(1),
    netImpact: +(netImpact / 1e9).toFixed(2),
  };
}

export function SensitivityAnalysis() {
  const [selectedOutput, setSelectedOutput] = useState<OutputKPI>('netImpact');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatVar1, setHeatVar1] = useState('volumeGrowth');
  const [heatVar2, setHeatVar2] = useState('addBeds');

  // ─── Tornado Data: vary each variable while keeping others at baseline ──
  const tornadoData = useMemo(() => {
    const baseVars: Record<string, number> = {};
    SENS_VARS.forEach(v => { baseVars[v.id] = v.baseline; });
    const baseKPI = computeKPIs(baseVars)[selectedOutput];

    return SENS_VARS.map(sv => {
      const lowVars = { ...baseVars, [sv.id]: sv.min };
      const highVars = { ...baseVars, [sv.id]: sv.max };
      const lowKPI = computeKPIs(lowVars)[selectedOutput];
      const highKPI = computeKPIs(highVars)[selectedOutput];
      const swing = Math.abs(highKPI - lowKPI);
      return {
        variable: sv.label,
        low: +Math.min(lowKPI, highKPI).toFixed(2),
        high: +Math.max(lowKPI, highKPI).toFixed(2),
        base: baseKPI,
        swing,
        lowLabel: `${sv.min}${sv.unit}`,
        highLabel: `${sv.max}${sv.unit}`,
      };
    }).sort((a, b) => b.swing - a.swing);
  }, [selectedOutput]);

  // ─── One-way sensitivity chart data ────────────────────────────────────
  const oneWayData = useMemo(() => {
    return SENS_VARS.map(sv => {
      const baseVars: Record<string, number> = {};
      SENS_VARS.forEach(v => { baseVars[v.id] = v.baseline; });

      const points: { x: number; y: number }[] = [];
      for (let val = sv.min; val <= sv.max; val += sv.step) {
        const vars = { ...baseVars, [sv.id]: val };
        const kpi = computeKPIs(vars)[selectedOutput];
        points.push({ x: val, y: kpi });
      }
      return { variable: sv, points };
    });
  }, [selectedOutput]);

  // ─── Heatmap Data ──────────────────────────────────────────────────────
  const heatmapData = useMemo(() => {
    if (!showHeatmap) return [];
    const v1 = SENS_VARS.find(v => v.id === heatVar1)!;
    const v2 = SENS_VARS.find(v => v.id === heatVar2)!;
    const baseVars: Record<string, number> = {};
    SENS_VARS.forEach(v => { baseVars[v.id] = v.baseline; });

    const v1Steps: number[] = [];
    for (let val = v1.min; val <= v1.max; val += v1.step * 2) v1Steps.push(val);
    const v2Steps: number[] = [];
    for (let val = v2.min; val <= v2.max; val += v2.step * 2) v2Steps.push(val);

    return v1Steps.map(x => {
      const row: Record<string, any> = { [v1.label]: `${x}${v1.unit}` };
      v2Steps.forEach(z => {
        const vars = { ...baseVars, [v1.id]: x, [v2.id]: z };
        row[`${z}${v2.unit}`] = computeKPIs(vars)[selectedOutput];
      });
      return { row, v2Steps, v2Unit: v2.unit };
    });
  }, [showHeatmap, heatVar1, heatVar2, selectedOutput]);

  // PDF Export
  const handleExportPdf = useCallback(() => {
    const baseVars: Record<string, number> = {};
    SENS_VARS.forEach(v => { baseVars[v.id] = v.baseline; });

    const sections: PdfSection[] = [
      {
        title: 'Tornado Analysis — Variable Ranking',
        rows: tornadoData.map(t => ({
          label: t.variable,
          value: `Swing: ${t.swing.toFixed(2)} | Range: ${t.low} — ${t.high}`,
        })),
      },
    ];

    generateSimulationPdf({
      scenarioTitle: 'Sensitivity Analysis',
      scenarioDesc: `Analisis sensitivitas terhadap KPI "${OUTPUT_KPIS.find(k => k.id === selectedOutput)?.label}". Setiap variabel diuji dari nilai minimum hingga maksimum sementara variabel lain dipertahankan pada baseline.`,
      parameters: SENS_VARS.map(v => ({ label: v.label, value: `${v.baseline}${v.unit} (range: ${v.min}–${v.max})` })),
      kpiResults: [
        { label: 'Output KPI', value: OUTPUT_KPIS.find(k => k.id === selectedOutput)?.label || '', status: 'good' },
        { label: 'Most Sensitive', value: tornadoData[0]?.variable || '-', status: 'warning' },
        { label: 'Swing Terbesar', value: tornadoData[0]?.swing.toFixed(2) || '-', status: 'warning' },
        { label: 'Baseline Value', value: `${computeKPIs(baseVars)[selectedOutput]}`, status: 'good' },
      ],
      sections,
      recommendations: [
        `Variabel "${tornadoData[0]?.variable}" memiliki pengaruh terbesar — perlu pengelolaan dan monitoring ketat`,
        `Variabel "${tornadoData[1]?.variable}" di urutan kedua — pertimbangkan mitigasi risiko`,
        'Gunakan hasil tornado untuk memprioritaskan intervensi manajemen',
        'Lakukan analisis lebih mendalam pada 2 variabel teratas menggunakan heatmap dua-variabel',
      ],
    });
  }, [tornadoData, selectedOutput]);

  const selectedOutLabel = OUTPUT_KPIS.find(k => k.id === selectedOutput)?.label || '';

  return (
    <div className="space-y-5">
      {/* Output KPI selector */}
      <SectionCard title="Sensitivity Analysis" subtitle="Analisis dampak perubahan setiap variabel terhadap KPI output"
        rightSlot={<PdfExportButton onClick={handleExportPdf} />}>
        <div className="mb-2">
          <label className="text-xs text-gray-600 font-medium mb-2 block">Output KPI yang Dianalisis</label>
          <div className="flex flex-wrap gap-2">
            {OUTPUT_KPIS.map(k => (
              <button key={k.id} onClick={() => setSelectedOutput(k.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedOutput === k.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                {k.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 text-xs text-indigo-700">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Setiap variabel divariasikan dari nilai minimum ke maksimum sementara variabel lain tetap pada baseline. Tornado chart menunjukkan variabel mana yang paling berpengaruh.</span>
          </div>
        </div>
      </SectionCard>

      {/* Tornado Chart */}
      <SectionCard title={`Tornado Chart — ${selectedOutLabel}`} subtitle="Variabel diurutkan berdasarkan magnitude pengaruh (swing terbesar di atas)">
        <div className="space-y-2.5">
          {tornadoData.map((t, i) => {
            const maxSwing = tornadoData[0]?.swing || 1;
            const barPct = Math.max(5, (t.swing / maxSwing) * 100);
            const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-lime-500'];
            return (
              <div key={t.variable} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 w-4">#{i + 1}</span>
                    <span className="text-xs font-medium text-gray-700">{t.variable}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-gray-400">{t.lowLabel}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                    <span className="text-gray-400">{t.highLabel}</span>
                    <span className="font-bold text-indigo-600 ml-1">Swing: {t.swing.toFixed(2)}</span>
                  </div>
                </div>
                {/* Dual bar: low to base, base to high */}
                <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`absolute top-0 h-full ${colors[i % colors.length]} opacity-70 rounded-full`}
                    style={{ left: '0%', width: `${barPct}%` }} />
                  <div className="absolute top-0 h-full flex items-center justify-between w-full px-2">
                    <span className="text-[9px] text-white font-bold z-10">{t.low}</span>
                    <span className="text-[9px] text-gray-600 font-bold z-10">{t.high}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* One-Way Sensitivity Lines */}
      <SectionCard title={`One-Way Sensitivity — ${selectedOutLabel}`} subtitle="Kurva respons setiap variabel terhadap output KPI">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {oneWayData.slice(0, 4).map(ow => (
            <div key={ow.variable.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">{ow.variable.label} ({ow.variable.min}–{ow.variable.max}{ow.variable.unit})</p>
              <RechartsWrapper type="line" data={ow.points.map(p => ({ x: `${p.x}`, value: p.y }))} xKey="x"
                lines={[{ dataKey: 'value', stroke: '#6366f1', name: selectedOutLabel }]} height={150} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Heatmap (2-variable) */}
      <SectionCard title="Two-Variable Heatmap" subtitle="Interaksi dua variabel terhadap output KPI">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Variabel 1 (baris)</label>
            <select value={heatVar1} onChange={e => setHeatVar1(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
              {SENS_VARS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          <span className="text-gray-300 mt-4">×</span>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Variabel 2 (kolom)</label>
            <select value={heatVar2} onChange={e => setHeatVar2(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
              {SENS_VARS.filter(v => v.id !== heatVar1).map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          <button onClick={() => setShowHeatmap(true)}
            className="mt-4 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
            <Play className="w-3 h-3" /> Generate Heatmap
          </button>
        </div>

        {showHeatmap && heatmapData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="text-[10px] w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-1.5 px-2 text-left text-gray-500 font-medium">
                    {SENS_VARS.find(v => v.id === heatVar1)?.label} ↓ / {SENS_VARS.find(v => v.id === heatVar2)?.label} →
                  </th>
                  {heatmapData[0]?.v2Steps.map(s => (
                    <th key={s} className="py-1.5 px-2 text-center text-gray-500 font-medium">{s}{heatmapData[0]?.v2Unit}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((hd, ri) => {
                  const v1Def = SENS_VARS.find(v => v.id === heatVar1)!;
                  const rowLabel = hd.row[v1Def.label];
                  return (
                    <tr key={ri} className="border-b border-gray-50">
                      <td className="py-1.5 px-2 font-medium text-gray-600">{rowLabel}</td>
                      {hd.v2Steps.map(s => {
                        const val = hd.row[`${s}${hd.v2Unit}`] as number;
                        // Color scale
                        const allVals = heatmapData.flatMap(h => h.v2Steps.map(st => h.row[`${st}${h.v2Unit}`] as number));
                        const minVal = Math.min(...allVals);
                        const maxVal = Math.max(...allVals);
                        const ratio = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal);
                        const r = Math.round(59 + (239 - 59) * (1 - ratio));
                        const g = Math.round(130 + (68 - 130) * (1 - ratio));
                        const b = Math.round(246 + (68 - 246) * (1 - ratio));
                        return (
                          <td key={s} className="py-1.5 px-2 text-center font-bold"
                            style={{ backgroundColor: `rgb(${r},${g},${b})`, color: ratio > 0.5 ? 'white' : '#1e3a8a' }}>
                            {typeof val === 'number' ? val.toFixed(1) : val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              Output: {selectedOutLabel} | Warna biru = nilai tinggi, merah = nilai rendah
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTE CARLO SIMULATION
// ═══════════════════════════════════════════════════════════════════════════════

interface MCVar {
  id: string;
  label: string;
  mean: number;
  stdDev: number;
  unit: string;
  min: number;
  max: number;
}

const MC_DEFAULTS: MCVar[] = [
  { id: 'volumeGrowth', label: 'Volume Pasien Growth', mean: 20, stdDev: 8, unit: '%', min: -5, max: 60 },
  { id: 'revenueGrowth', label: 'Revenue Growth', mean: 15, stdDev: 6, unit: '%', min: 0, max: 40 },
  { id: 'alosReduction', label: 'ALOS Reduction', mean: 10, stdDev: 5, unit: '%', min: 0, max: 35 },
  { id: 'addBeds', label: 'Bed Expansion', mean: 20, stdDev: 10, unit: ' TT', min: 0, max: 80 },
  { id: 'waitReduction', label: 'Wait Time Reduction', mean: 15, stdDev: 7, unit: '%', min: 0, max: 50 },
  { id: 'nurseRatio', label: 'Rasio Perawat:Bed', mean: 6, stdDev: 1, unit: ':1', min: 3, max: 10 },
];

interface MCResult {
  iterations: number;
  outputKPI: OutputKPI;
  values: number[];
  mean: number;
  median: number;
  stdDev: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  min: number;
  max: number;
  histogram: { bin: string; count: number; pct: number }[];
  riskOfLoss: number;
}

function runMonteCarlo(vars: MCVar[], outputKPI: OutputKPI, iterations: number, seed: number): MCResult {
  const rand = seededRandom(seed);
  const values: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const simVars: Record<string, number> = {};
    vars.forEach(v => {
      let sampled = normalRandom(v.mean, v.stdDev, rand);
      sampled = Math.max(v.min, Math.min(v.max, sampled));
      // Round to reasonable precision
      simVars[v.id] = Math.round(sampled * 10) / 10;
    });
    const kpis = computeKPIs(simVars);
    values.push(kpis[outputKPI]);
  }

  values.sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const percentile = (p: number) => values[Math.floor(p / 100 * (values.length - 1))];

  // Histogram
  const binCount = 20;
  const minVal = values[0];
  const maxVal = values[values.length - 1];
  const binWidth = (maxVal - minVal) / binCount || 1;
  const bins = Array.from({ length: binCount }, (_, i) => {
    const lo = minVal + i * binWidth;
    const hi = lo + binWidth;
    const count = values.filter(v => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)).length;
    return {
      bin: lo.toFixed(1),
      count,
      pct: +(count / values.length * 100).toFixed(1),
    };
  });

  // Risk of loss (net impact < 0 or BOR > 95%)
  const riskOfLoss = outputKPI === 'netImpact'
    ? values.filter(v => v < 0).length / values.length * 100
    : outputKPI === 'bor'
      ? values.filter(v => v > 95).length / values.length * 100
      : values.filter(v => v < mean - stdDev * 2).length / values.length * 100;

  return {
    iterations,
    outputKPI,
    values,
    mean: +mean.toFixed(2),
    median: +percentile(50).toFixed(2),
    stdDev: +stdDev.toFixed(2),
    p5: +percentile(5).toFixed(2),
    p25: +percentile(25).toFixed(2),
    p75: +percentile(75).toFixed(2),
    p95: +percentile(95).toFixed(2),
    min: +minVal.toFixed(2),
    max: +maxVal.toFixed(2),
    histogram: bins,
    riskOfLoss: +riskOfLoss.toFixed(1),
  };
}

export function MonteCarloSimulation() {
  const [outputKPI, setOutputKPI] = useState<OutputKPI>('netImpact');
  const [iterations, setIterations] = useState(1000);
  const [seed, setSeed] = useState(42);
  const [mcVars, setMcVars] = useState<MCVar[]>(MC_DEFAULTS);
  const [result, setResult] = useState<MCResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showVarConfig, setShowVarConfig] = useState(false);

  const handleRun = useCallback(() => {
    setRunning(true);
    // Use requestAnimationFrame to let UI update
    requestAnimationFrame(() => {
      const res = runMonteCarlo(mcVars, outputKPI, iterations, seed);
      setResult(res);
      setRunning(false);
    });
  }, [mcVars, outputKPI, iterations, seed]);

  const handleReseed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const updateVar = (id: string, field: 'mean' | 'stdDev', value: number) => {
    setMcVars(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  // PDF Export
  const handleExportPdf = useCallback(() => {
    if (!result) return;

    const sections: PdfSection[] = [
      {
        title: 'Distribusi Statistik',
        rows: [
          { label: 'Mean', value: `${result.mean}` },
          { label: 'Median (P50)', value: `${result.median}` },
          { label: 'Std Deviation', value: `${result.stdDev}` },
          { label: 'P5 (Pesimistis)', value: `${result.p5}` },
          { label: 'P25 (Konservatif)', value: `${result.p25}` },
          { label: 'P75 (Optimistis)', value: `${result.p75}` },
          { label: 'P95 (Best Case)', value: `${result.p95}` },
          { label: 'Min', value: `${result.min}` },
          { label: 'Max', value: `${result.max}` },
          { label: 'Risk of Adverse Outcome', value: `${result.riskOfLoss}%` },
        ],
      },
      {
        title: 'Input Variable Distributions',
        rows: mcVars.map(v => ({
          label: v.label,
          value: `Mean: ${v.mean}${v.unit} | StdDev: ${v.stdDev}${v.unit} | Range: ${v.min}–${v.max}`,
        })),
      },
    ];

    const riskLevel = result.riskOfLoss > 40 ? 'RISIKO KRITIS' :
      result.riskOfLoss > 25 ? 'RISIKO TINGGI' :
        result.riskOfLoss > 10 ? 'RISIKO SEDANG' : 'RISIKO RENDAH';

    generateSimulationPdf({
      scenarioTitle: 'Monte Carlo Simulation',
      scenarioDesc: `Monte Carlo simulation dengan ${iterations} iterasi menggunakan distribusi normal untuk setiap variabel input. Output KPI: ${OUTPUT_KPIS.find(k => k.id === outputKPI)?.label}. Seed: ${seed}.`,
      parameters: [
        { label: 'Iterasi', value: `${iterations}` },
        { label: 'Seed', value: `${seed}` },
        { label: 'Output KPI', value: OUTPUT_KPIS.find(k => k.id === outputKPI)?.label || '' },
        { label: 'Confidence Interval (90%)', value: `${result.p5} — ${result.p95}` },
      ],
      kpiResults: [
        { label: 'Mean', value: `${result.mean}`, status: 'good' },
        { label: 'Median', value: `${result.median}`, status: 'good' },
        { label: 'P5–P95 Range', value: `${result.p5} — ${result.p95}`, status: 'warning' },
        { label: 'Risk', value: `${result.riskOfLoss}%`, status: result.riskOfLoss > 25 ? 'bad' : result.riskOfLoss > 10 ? 'warning' : 'good' },
      ],
      sections,
      recommendations: [
        `Median outcome: ${result.median} — ini adalah skenario "most likely"`,
        `90% confidence interval: ${result.p5} sampai ${result.p95}`,
        result.riskOfLoss > 25 ? `PERINGATAN: Risk of adverse outcome ${result.riskOfLoss}% — perlu mitigasi serius` : `Risk of adverse outcome ${result.riskOfLoss}% — dalam batas toleransi`,
        'Variasi terbesar berasal dari variabel dengan standard deviation terbesar',
        'Jalankan ulang dengan seed berbeda untuk memverifikasi stabilitas hasil',
      ],
      riskLevel,
    });
  }, [result, mcVars, iterations, seed, outputKPI]);

  const outLabel = OUTPUT_KPIS.find(k => k.id === outputKPI)?.label || '';

  return (
    <div className="space-y-5">
      {/* Config */}
      <SectionCard title="Monte Carlo Simulation" subtitle={`Simulasi probabilistik ${iterations.toLocaleString()} iterasi dengan distribusi normal`}
        rightSlot={result ? <PdfExportButton onClick={handleExportPdf} /> : undefined}>

        {/* Output + Iterations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Output KPI</label>
            <select value={outputKPI} onChange={e => setOutputKPI(e.target.value as OutputKPI)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white">
              {OUTPUT_KPIS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Jumlah Iterasi</label>
            <select value={iterations} onChange={e => setIterations(Number(e.target.value))}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white">
              {[500, 1000, 2500, 5000, 10000].map(n => (
                <option key={n} value={n}>{n.toLocaleString()} iterasi</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Random Seed</label>
            <div className="flex gap-2">
              <input type="number" value={seed} onChange={e => setSeed(Number(e.target.value))}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white" />
              <button onClick={handleReseed} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50" title="Random seed">
                <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Variable Config (collapsible) */}
        <button onClick={() => setShowVarConfig(!showVarConfig)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4 hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Konfigurasi Distribusi Input Variables</span>
          </div>
          {showVarConfig ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showVarConfig && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            {mcVars.map(v => (
              <div key={v.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">{v.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block">Mean</label>
                    <input type="number" value={v.mean} onChange={e => updateVar(v.id, 'mean', Number(e.target.value))}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block">Std Dev (σ)</label>
                    <input type="number" value={v.stdDev} onChange={e => updateVar(v.id, 'stdDev', Number(e.target.value))}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white" step="0.5" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Range clamp: {v.min} – {v.max}{v.unit}</p>
              </div>
            ))}
          </div>
        )}

        {/* Run Button */}
        <button onClick={handleRun} disabled={running}
          className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${running ? 'bg-gray-300 text-gray-500 cursor-wait' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'}`}>
          {running ? (
            <div className="contents">
              <RefreshCw className="w-4 h-4 animate-spin" /> Running {iterations.toLocaleString()} Simulations...
            </div>
          ) : (
            <div className="contents">
              <Play className="w-4 h-4" /> Run Monte Carlo ({iterations.toLocaleString()} iterasi)
            </div>
          )}
        </button>
      </SectionCard>

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Mean', value: `${result.mean}`, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
              { label: 'Median (P50)', value: `${result.median}`, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
              { label: 'Std Dev (σ)', value: `${result.stdDev}`, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
              { label: '90% CI', value: `${result.p5} — ${result.p95}`, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
              { label: 'Risk Adverse', value: `${result.riskOfLoss}%`, color: result.riskOfLoss > 25 ? 'text-red-600' : 'text-green-600', bg: result.riskOfLoss > 25 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200' },
            ].map(s => (
              <div key={s.label} className={`p-3 rounded-xl border ${s.bg}`}>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Histogram */}
          <SectionCard title={`Distribution Histogram — ${outLabel}`}
            subtitle={`${iterations.toLocaleString()} iterasi | Seed: ${seed}`}>
            <RechartsWrapper type="bar" data={result.histogram} xKey="bin" yKey="count"
              colors={['#6366f1']} height={280} radius={[2, 2, 0, 0]}
              tooltipFormatter={(v: number, name: string) => name === 'count' ? `${v} iterasi` : `${v}%`} />

            {/* Percentile Markers */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {[
                { label: 'P5', value: result.p5, color: 'bg-red-400' },
                { label: 'P25', value: result.p25, color: 'bg-amber-400' },
                { label: 'P50 (Median)', value: result.median, color: 'bg-blue-500' },
                { label: 'P75', value: result.p75, color: 'bg-emerald-400' },
                { label: 'P95', value: result.p95, color: 'bg-green-500' },
              ].map(p => (
                <div key={p.label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                  <span className="text-[10px] text-gray-500">{p.label}: <span className="font-bold text-gray-700">{p.value}</span></span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Box Plot Representation */}
          <SectionCard title="Box Plot & Confidence Intervals" subtitle="Visualisasi distribusi hasil simulasi">
            <div className="p-4">
              {/* Box plot visual */}
              <div className="relative h-16 mb-6">
                {/* Scale line */}
                <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-300" />

                {/* Min-Max whiskers */}
                {(() => {
                  const range = result.max - result.min || 1;
                  const scale = (v: number) => ((v - result.min) / range) * 100;
                  return (
                    <div className="contents">
                      {/* Left whisker */}
                      <div className="absolute top-6 h-4 w-0.5 bg-gray-400" style={{ left: `${scale(result.p5)}%` }} />
                      <div className="absolute top-8 h-0.5 bg-gray-400" style={{ left: `${scale(result.p5)}%`, width: `${scale(result.p25) - scale(result.p5)}%` }} />
                      {/* Box */}
                      <div className="absolute top-4 h-8 bg-indigo-100 border-2 border-indigo-400 rounded"
                        style={{ left: `${scale(result.p25)}%`, width: `${Math.max(2, scale(result.p75) - scale(result.p25))}%` }} />
                      {/* Median line */}
                      <div className="absolute top-4 h-8 w-0.5 bg-indigo-700 z-10" style={{ left: `${scale(result.median)}%` }} />
                      {/* Mean diamond */}
                      <div className="absolute top-6 w-3 h-3 bg-red-500 rotate-45 z-10" style={{ left: `${scale(result.mean) - 0.5}%` }} />
                      {/* Right whisker */}
                      <div className="absolute top-8 h-0.5 bg-gray-400" style={{ left: `${scale(result.p75)}%`, width: `${scale(result.p95) - scale(result.p75)}%` }} />
                      <div className="absolute top-6 h-4 w-0.5 bg-gray-400" style={{ left: `${scale(result.p95)}%` }} />

                      {/* Labels */}
                      <div className="absolute top-14 text-[9px] text-gray-500" style={{ left: `${scale(result.p5)}%`, transform: 'translateX(-50%)' }}>P5: {result.p5}</div>
                      <div className="absolute top-14 text-[9px] text-gray-500" style={{ left: `${scale(result.p25)}%`, transform: 'translateX(-50%)' }}>P25: {result.p25}</div>
                      <div className="absolute top-0 text-[9px] font-bold text-indigo-700" style={{ left: `${scale(result.median)}%`, transform: 'translateX(-50%)' }}>Median: {result.median}</div>
                      <div className="absolute top-14 text-[9px] text-gray-500" style={{ left: `${scale(result.p75)}%`, transform: 'translateX(-50%)' }}>P75: {result.p75}</div>
                      <div className="absolute top-14 text-[9px] text-gray-500" style={{ left: `${scale(result.p95)}%`, transform: 'translateX(-50%)' }}>P95: {result.p95}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-8 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-indigo-400 bg-indigo-100 rounded" />
                  <span className="text-gray-500">IQR (P25–P75)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 bg-indigo-700" />
                  <span className="text-gray-500">Median</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-500 rotate-45" />
                  <span className="text-gray-500">Mean</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-0.5 bg-gray-400" />
                  <span className="text-gray-500">P5–P95 Range</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Risk Assessment */}
          <SectionCard title="Risk Assessment" subtitle="Analisis risiko berdasarkan distribusi simulasi">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Scenario Outcomes */}
              <div className="space-y-2.5">
                {[
                  { scenario: 'Pesimistis (P5)', value: result.p5, desc: '5% kemungkinan lebih buruk dari ini', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
                  { scenario: 'Konservatif (P25)', value: result.p25, desc: '25% kemungkinan lebih buruk', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
                  { scenario: 'Most Likely (P50)', value: result.median, desc: 'Skenario paling mungkin', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                  { scenario: 'Optimistis (P75)', value: result.p75, desc: '75% kemungkinan tercapai atau lebih baik', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
                  { scenario: 'Best Case (P95)', value: result.p95, desc: '5% kemungkinan mencapai level ini', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
                ].map(s => (
                  <div key={s.scenario} className={`p-3 rounded-lg border ${s.bg} flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                      <div>
                        <p className="text-xs font-medium text-gray-700">{s.scenario}</p>
                        <p className="text-[10px] text-gray-400">{s.desc}</p>
                      </div>
                    </div>
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Risk Meter */}
              <div className="flex flex-col items-center justify-center p-4">
                <div className="relative w-40 h-40">
                  {/* Gauge background */}
                  <svg className="w-full h-full" viewBox="0 0 100 60">
                    <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
                    {/* Green zone */}
                    <path d="M 10 55 A 40 40 0 0 1 30 20" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
                    {/* Yellow zone */}
                    <path d="M 30 20 A 40 40 0 0 1 50 15" fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
                    {/* Orange zone */}
                    <path d="M 50 15 A 40 40 0 0 1 70 20" fill="none" stroke="#f97316" strokeWidth="8" strokeLinecap="round" />
                    {/* Red zone */}
                    <path d="M 70 20 A 40 40 0 0 1 90 55" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />

                    {/* Needle */}
                    {(() => {
                      const angle = -90 + (result.riskOfLoss / 100) * 180;
                      const rads = (angle * Math.PI) / 180;
                      const nx = 50 + Math.cos(rads) * 30;
                      const ny = 55 + Math.sin(rads) * 30;
                      return <line x1="50" y1="55" x2={nx} y2={ny} stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />;
                    })()}
                    <circle cx="50" cy="55" r="3" fill="#1e3a8a" />
                  </svg>
                </div>
                <p className={`text-3xl font-bold mt-2 ${result.riskOfLoss > 40 ? 'text-red-600' : result.riskOfLoss > 25 ? 'text-orange-600' : result.riskOfLoss > 10 ? 'text-amber-600' : 'text-green-600'}`}>
                  {result.riskOfLoss}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {outputKPI === 'netImpact' ? 'Probabilitas Net Impact Negatif' : outputKPI === 'bor' ? 'Probabilitas BOR > 95%' : 'Probabilitas Outcome Buruk'}
                </p>
                <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold ${
                  result.riskOfLoss > 40 ? 'bg-red-100 text-red-700' :
                    result.riskOfLoss > 25 ? 'bg-orange-100 text-orange-700' :
                      result.riskOfLoss > 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}>
                  {result.riskOfLoss > 40 ? 'RISIKO KRITIS' : result.riskOfLoss > 25 ? 'RISIKO TINGGI' : result.riskOfLoss > 10 ? 'RISIKO SEDANG' : 'RISIKO RENDAH'}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Recommendations */}
          <div className={`p-4 rounded-xl border ${result.riskOfLoss > 25 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.riskOfLoss > 25 ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
              <p className={`text-xs font-bold ${result.riskOfLoss > 25 ? 'text-amber-600' : 'text-green-600'}`}>Interpretasi & Rekomendasi</p>
            </div>
            <ul className="space-y-1.5">
              {[
                `Dari ${iterations.toLocaleString()} simulasi, median ${outLabel} = ${result.median} (range: ${result.min} — ${result.max})`,
                `90% Confidence Interval: ${result.p5} sampai ${result.p95} — perencanaan sebaiknya mengacu rentang ini`,
                result.riskOfLoss > 25
                  ? `PERINGATAN: ${result.riskOfLoss}% kemungkinan outcome buruk — perlu strategi mitigasi risiko`
                  : `Risiko adverse outcome ${result.riskOfLoss}% — dalam batas toleransi manajemen`,
                `Untuk perencanaan konservatif, gunakan P25 (${result.p25}) sebagai angka acuan`,
                `Variasi output (σ=${result.stdDev}) menunjukkan ${result.stdDev > result.mean * 0.3 ? 'ketidakpastian tinggi — perlu reduksi variabilitas input' : 'ketidakpastian terkendali'}`,
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}