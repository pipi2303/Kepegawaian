/**
 * OperationsSimulation.tsx — Advanced Multi-Scenario Simulation Engine
 * 5 Scenarios: Volume Growth, Bed Expansion, Emergency Surge,
 *              Efficiency Improvement, Staffing Optimization
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, Bed, AlertTriangle, Zap, Users,
  ChevronDown, ChevronUp, CheckCircle2, XCircle,
  DollarSign, Clock, Activity, Shield,
  ArrowRight, RotateCcw, BarChart3, Shuffle,
} from 'lucide-react';
import RechartsWrapper from '../RechartsWrapper';
import { MiniBar } from '../DashboardWidgets';
import { C, CHART_COLORS } from '../colors';
import {
  borByWard, clinicalKPI, waitingTimeByUnit,
} from '../../data/hospitalDashboardData';
import { PdfExportButton, generateSimulationPdf } from './SimulationPdfExport';
import type { PdfSection } from './SimulationPdfExport';
import { SensitivityAnalysis, MonteCarloSimulation } from './SimulationAdvanced';

// ─── Types ────────────────────────────────────────────────────────────────────
type Scenario = 'volume' | 'bed' | 'surge' | 'efficiency' | 'staffing' | 'sensitivity' | 'montecarlo';

interface ScenarioDef {
  id: Scenario;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  desc: string;
}

const SCENARIOS: ScenarioDef[] = [
  { id: 'volume', label: 'Volume Growth', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Simulasi dampak kenaikan volume pasien terhadap kapasitas, SDM, dan pendapatan' },
  { id: 'bed', label: 'Bed Expansion', icon: Bed, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Analisis ROI penambahan tempat tidur dan kebutuhan infrastruktur' },
  { id: 'surge', label: 'Emergency Surge', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'Simulasi lonjakan darurat (KLB/bencana) dan kesiapan surge capacity' },
  { id: 'efficiency', label: 'Efficiency Improvement', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Dampak perbaikan efisiensi (ALOS, waiting time, discharge) terhadap kapasitas' },
  { id: 'staffing', label: 'Staffing Optimization', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', desc: 'Skenario optimalisasi komposisi SDM dan dampak terhadap biaya & kualitas' },
  { id: 'sensitivity', label: 'Sensitivity Analysis', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', desc: 'Tornado chart & heatmap — identifikasi variabel mana yang paling berpengaruh terhadap output KPI' },
  { id: 'montecarlo', label: 'Monte Carlo', icon: Shuffle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', desc: 'Simulasi probabilistik 1.000+ iterasi dengan distribusi normal — histogram, confidence interval, & risk gauge' },
];

// ─── Preset Configs ───────────────────────────────────────────────────────────
interface VolumePreset { label: string; pct: number; desc: string; }
const VOLUME_PRESETS: VolumePreset[] = [
  { label: 'Konservatif', pct: 10, desc: 'Pertumbuhan organik normal' },
  { label: 'Moderat', pct: 25, desc: 'Target pertumbuhan RS tahun ini' },
  { label: 'Agresif', pct: 40, desc: 'Skenario ekspansi layanan baru' },
  { label: 'Ekstrem', pct: 60, desc: 'Stress test kapasitas maksimal' },
];

// ─── Baseline Data ────────────────────────────────────────────────────────────
const BASELINE = {
  totalBeds: 280,
  bor: clinicalKPI.bor,
  alos: clinicalKPI.alos,
  erWait: clinicalKPI.erWaitingTime,
  dailyPatients: 420,
  monthlyRevenue: 18_500_000_000, // 18.5M IDR
  costPerBed: 850_000_000, // cost to add bed with infra
  staffCostPerMonth: 8_200_000, // avg staff cost
  staffTotal: 246,
  surgeryPerMonth: 185,
  icuBeds: 12,
  icuOccupied: 10,
};

const formatIDR = (n: number) => {
  if (n >= 1e12) return `Rp ${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}M`;
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(0)}jt`;
  return `Rp ${n.toLocaleString('id-ID')}`;
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SimSlider({ label, value, onChange, min, max, step, unit, color = 'accent-blue-600' }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string; color?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs text-gray-600 font-medium">{label}</label>
        <span className="text-sm font-bold text-gray-800">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full ${color} h-2 rounded-lg cursor-pointer`} />
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function ResultCard({ label, value, sub, color, bg, icon: Icon }: {
  label: string; value: string; sub: string; color: string; bg: string; icon?: React.ElementType;
}) {
  return (
    <div className={`p-4 rounded-xl border ${bg}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs font-medium text-gray-700 mt-1">{label}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
        </div>
        {Icon && <Icon className={`w-5 h-5 ${color} opacity-50`} />}
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const cfg = {
    low: { bg: 'bg-green-100 text-green-700', label: 'RISIKO RENDAH' },
    medium: { bg: 'bg-amber-100 text-amber-700', label: 'RISIKO SEDANG' },
    high: { bg: 'bg-orange-100 text-orange-700', label: 'RISIKO TINGGI' },
    critical: { bg: 'bg-red-100 text-red-700', label: 'RISIKO KRITIS' },
  }[level];
  return <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.bg}`}>{cfg.label}</span>;
}

function RecommendationBox({ items, type = 'info' }: { items: string[]; type?: 'info' | 'warning' | 'success' }) {
  const cfg = {
    info: { bg: 'bg-blue-50 border-blue-200', icon: Activity, color: 'text-blue-600' },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle, color: 'text-amber-600' },
    success: { bg: 'bg-green-50 border-green-200', icon: CheckCircle2, color: 'text-green-600' },
  }[type];
  return (
    <div className={`p-4 rounded-xl border ${cfg.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
        <p className={`text-xs font-bold ${cfg.color}`}>Rekomendasi</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
            <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1: VOLUME GROWTH
// ═══════════════════════════════════════════════════════════════════════════════
function VolumeGrowthScenario() {
  const [pct, setPct] = useState(20);
  const [revenueGrowth, setRevenueGrowth] = useState(15);
  const [showDetail, setShowDetail] = useState(false);

  const handleExportPdf = useCallback((result: any) => {
    const sections: PdfSection[] = [
      { title: 'Proyeksi BOR per Bangsal', rows: result.wardProj.map((w: any) => ({ label: w.ward, value: `${w.current}% → ${w.projected.toFixed(1)}%` })) },
      { title: 'Kebutuhan SDM Tambahan', rows: result.staffing.map((s: any) => ({ label: s.role, value: `+${s.additional} orang (current: ${s.current})` })) },
    ];
    generateSimulationPdf({
      scenarioTitle: 'Volume Growth Simulation',
      scenarioDesc: `Simulasi dampak kenaikan volume pasien +${pct}% dan target revenue growth +${revenueGrowth}% terhadap BOR, ER wait time, kebutuhan SDM, dan net financial impact.`,
      parameters: [
        { label: 'Kenaikan Volume', value: `+${pct}%` },
        { label: 'Revenue Growth Target', value: `+${revenueGrowth}%` },
        { label: 'Baseline BOR', value: `${BASELINE.bor}%` },
        { label: 'Baseline Pasien/Hari', value: `${BASELINE.dailyPatients}` },
      ],
      kpiResults: [
        { label: 'BOR Proyeksi', value: `${result.newBOR.toFixed(1)}%`, status: result.newBOR > 90 ? 'bad' : result.newBOR > 85 ? 'warning' : 'good' },
        { label: 'ER Wait Time', value: `${result.newER.toFixed(0)} mnt`, status: result.newER > 25 ? 'bad' : 'warning' },
        { label: 'Pasien/Hari', value: `${result.newDaily}`, status: 'good' },
        { label: 'Net Impact/Tahun', value: formatIDR(result.netImpact), status: result.netImpact > 0 ? 'good' : 'bad' },
      ],
      sections,
      recommendations: result.newBOR > 90
        ? ['BOR melebihi 90% — perlu penambahan TT atau optimasi ALOS segera', `Rekrut minimal ${result.additionalStaff} staf baru`, 'Aktifkan protokol Bed Management System', 'Siapkan anggaran tambahan ' + formatIDR(result.additionalCost) + '/tahun']
        : ['Pertumbuhan volume masih dalam kapasitas manageable', `Antisipasi kebutuhan ${result.additionalStaff} staf tambahan dalam 6-12 bulan`, 'Monitoring BOR mingguan untuk deteksi dini bottleneck'],
      riskLevel: result.riskLevel === 'critical' ? 'RISIKO KRITIS' : result.riskLevel === 'high' ? 'RISIKO TINGGI' : result.riskLevel === 'medium' ? 'RISIKO SEDANG' : 'RISIKO RENDAH',
    });
  }, [pct, revenueGrowth]);

  const result = useMemo(() => {
    const factor = 1 + pct / 100;
    const newBOR = Math.min(100, BASELINE.bor * factor);
    const newER = BASELINE.erWait * (1 + pct / 200);
    const newDaily = Math.round(BASELINE.dailyPatients * factor);
    const additionalStaff = Math.ceil(BASELINE.staffTotal * pct / 100 * 0.3);
    const additionalCost = additionalStaff * BASELINE.staffCostPerMonth * 12;
    const revFactor = 1 + revenueGrowth / 100;
    const newRevenue = BASELINE.monthlyRevenue * revFactor;
    const netImpact = (newRevenue - BASELINE.monthlyRevenue) * 12 - additionalCost;
    const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
      newBOR > 95 ? 'critical' : newBOR > 90 ? 'high' : newBOR > 85 ? 'medium' : 'low';

    // Proyeksi per bangsal
    const wardProj = borByWard.map(w => ({
      ward: w.ward,
      current: w.bor,
      projected: Math.min(100, w.bor * factor),
    }));

    // Proyeksi timeline 12 bulan
    const timeline = Array.from({ length: 12 }, (_, i) => {
      const monthFactor = 1 + (pct / 100) * ((i + 1) / 12);
      return {
        bulan: `Bln ${i + 1}`,
        bor: Math.min(100, +(BASELINE.bor * monthFactor).toFixed(1)),
        pasien: Math.round(BASELINE.dailyPatients * monthFactor),
        revenue: +(BASELINE.monthlyRevenue * (1 + (revenueGrowth / 100) * ((i + 1) / 12)) / 1e9).toFixed(1),
      };
    });

    // Staffing breakdown
    const staffing = [
      { role: 'Perawat', current: 98, factor: 0.5 },
      { role: 'Dokter Spesialis', current: 42, factor: 0.3 },
      { role: 'Penunjang Medis', current: 36, factor: 0.4 },
      { role: 'Farmasi', current: 18, factor: 0.35 },
      { role: 'Laboratorium', current: 22, factor: 0.4 },
      { role: 'Admin & Support', current: 30, factor: 0.15 },
    ].map(s => ({ ...s, additional: Math.ceil(s.current * pct / 100 * s.factor) }));

    return { newBOR, newER, newDaily, additionalStaff, additionalCost, newRevenue, netImpact, riskLevel, wardProj, timeline, staffing };
  }, [pct, revenueGrowth]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-800">Volume Growth Simulator</h3>
            <p className="text-xs text-gray-500 mt-0.5">Proyeksikan dampak pertumbuhan volume pasien</p>
          </div>
          <div className="flex items-center gap-2">
            <PdfExportButton onClick={() => handleExportPdf(result)} />
            <RiskBadge level={result.riskLevel} />
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2 mb-5">
          {VOLUME_PRESETS.map(p => (
            <button key={p.label} onClick={() => setPct(p.pct)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${pct === p.pct ? 'bg-[#013E37] text-white border-[#013E37]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#048A75]/50'}`}>
              {p.label} (+{p.pct}%)
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimSlider label="Kenaikan Volume Pasien" value={pct} onChange={setPct} min={0} max={80} step={5} unit="%" color="accent-blue-600" />
          <SimSlider label="Target Pertumbuhan Revenue" value={revenueGrowth} onChange={setRevenueGrowth} min={0} max={50} step={5} unit="%" color="accent-emerald-600" />
        </div>
      </div>

      {/* KPI Results */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultCard label="BOR Proyeksi" value={`${result.newBOR.toFixed(1)}%`} sub={`Saat ini: ${BASELINE.bor}%`}
          color={result.newBOR > 90 ? 'text-red-600' : result.newBOR > 85 ? 'text-amber-600' : 'text-green-600'}
          bg={result.newBOR > 90 ? 'bg-red-50 border-red-200' : result.newBOR > 85 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}
          icon={Bed} />
        <ResultCard label="ER Wait Time" value={`${result.newER.toFixed(0)} mnt`} sub={`Saat ini: ${BASELINE.erWait} mnt`}
          color={result.newER > 25 ? 'text-red-600' : 'text-amber-600'}
          bg={result.newER > 25 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}
          icon={Clock} />
        <ResultCard label="Pasien/Hari" value={`${result.newDaily}`} sub={`Saat ini: ${BASELINE.dailyPatients}`}
          color="text-blue-600" bg="bg-blue-50 border-blue-200" icon={Users} />
        <ResultCard label="Net Impact/Tahun" value={formatIDR(result.netImpact)} sub={result.netImpact > 0 ? 'Potensi surplus' : 'Potensi defisit'}
          color={result.netImpact > 0 ? 'text-green-600' : 'text-red-600'}
          bg={result.netImpact > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
          icon={DollarSign} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Timeline Projection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Proyeksi 12 Bulan</h3>
            <p className="text-xs text-gray-500 mt-0.5">BOR & Revenue bulanan (Miliar Rp)</p>
          </div>
          <RechartsWrapper type="line" data={result.timeline} xKey="bulan" lines={[
            { dataKey: 'bor', stroke: '#048A75', name: 'BOR (%)' },
            { dataKey: 'revenue', stroke: '#10b981', name: 'Revenue (M)' },
          ]} height={220} />
        </div>

        {/* Ward BOR Comparison */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">BOR per Bangsal: Current vs Projected</h3>
            <p className="text-xs text-gray-500 mt-0.5">Dampak +{pct}% volume per ruangan</p>
          </div>
          <RechartsWrapper type="bar" data={result.wardProj} xKey="ward" yKey={['current', 'projected']}
            colors={['#36B5A0', '#048A75']} height={220} radius={[4, 4, 0, 0]}
            legendFormatter={(v: string) => v === 'current' ? 'Saat Ini' : 'Proyeksi'} />
        </div>
      </div>

      {/* Staffing Detail (expandable) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <button onClick={() => setShowDetail(!showDetail)} className="w-full flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-gray-800">Kebutuhan Tambahan SDM (+{result.additionalStaff} orang)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Estimasi biaya: {formatIDR(result.additionalCost)}/tahun</p>
          </div>
          {showDetail ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showDetail && (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
            {result.staffing.map(s => (
              <div key={s.role} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{s.role}</p>
                    <p className="text-[10px] text-gray-400">Saat ini: {s.current}</p>
                  </div>
                  <p className={`text-lg font-bold ${s.additional > 10 ? 'text-red-600' : s.additional > 5 ? 'text-amber-600' : 'text-blue-600'}`}>+{s.additional}</p>
                </div>
                <MiniBar value={s.current} total={s.current + s.additional} color="bg-blue-500" />
                <p className="text-[10px] text-gray-400 mt-1">Target: {s.current + s.additional} orang</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <RecommendationBox type={result.riskLevel === 'critical' || result.riskLevel === 'high' ? 'warning' : 'info'} items={
        result.newBOR > 90
          ? [
            'BOR melebihi 90% — perlu penambahan TT atau optimasi ALOS segera',
            `Rekrut minimal ${result.additionalStaff} staf baru (prioritas: perawat & penunjang medis)`,
            'Aktifkan protokol Bed Management System untuk percepatan discharge',
            'Pertimbangkan kerjasama rujukan dengan RS jejaring untuk overflow',
            'Siapkan anggaran tambahan ' + formatIDR(result.additionalCost) + '/tahun untuk SDM',
          ]
          : [
            'Pertumbuhan volume masih dalam kapasitas yang manageable',
            `Antisipasi kebutuhan ${result.additionalStaff} staf tambahan dalam 6-12 bulan`,
            'Lakukan monitoring BOR mingguan untuk deteksi dini bottleneck',
            'Optimasi jadwal poliklinik untuk distribusi beban merata',
          ]
      } />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 2: BED EXPANSION
// ═══════════════════════════════════════════════════════════════════════════════
function BedExpansionScenario() {
  const [addBeds, setAddBeds] = useState(20);
  const [bedClass, setBedClass] = useState<'kelas3' | 'kelas2' | 'kelas1' | 'vip'>('kelas3');

  const handleExportPdf = useCallback((result: any, bedClassLabel: string) => {
    generateSimulationPdf({
      scenarioTitle: 'Bed Expansion ROI Analysis',
      scenarioDesc: `Analisis ROI penambahan ${addBeds} TT ${bedClassLabel} — investasi, revenue gain, biaya operasional, staffing, dan break-even analysis.`,
      parameters: [
        { label: 'Jumlah TT Tambahan', value: `${addBeds}` },
        { label: 'Kelas TT', value: bedClassLabel },
        { label: 'Baseline Total TT', value: `${BASELINE.totalBeds}` },
        { label: 'Baseline BOR', value: `${BASELINE.bor}%` },
      ],
      kpiResults: [
        { label: 'Total TT Baru', value: `${result.newTotal}`, status: 'good' },
        { label: 'BOR Baru', value: `${result.newBOR.toFixed(1)}%`, status: result.newBOR < 60 ? 'warning' : 'good' },
        { label: 'Investasi', value: formatIDR(result.investmentCost), status: 'warning' },
        { label: 'ROI Period', value: result.roiMonths > 120 ? '> 10 thn' : `${result.roiMonths} bln`, status: result.roiMonths <= 36 ? 'good' : 'warning' },
      ],
      sections: [
        { title: 'Rincian Finansial Tahunan', rows: [
          { label: 'Pendapatan Tambahan/Tahun', value: `+${formatIDR(result.annualRevenueGain)}` },
          { label: 'Biaya Operasional/Tahun', value: `-${formatIDR(result.operationalCost)}` },
          { label: `Biaya SDM (+${result.staffNeeded} perawat)/Tahun`, value: `-${formatIDR(result.staffCost)}` },
          { label: 'NET IMPACT / TAHUN', value: `${result.netAnnual > 0 ? '+' : ''}${formatIDR(result.netAnnual)}` },
        ]},
        { title: 'Proyeksi 5 Tahun', rows: result.yearProjection.map((y: any) => ({ label: y.tahun, value: `Revenue: ${y.revenue}M | Cost: ${y.cost}M | Profit: ${y.profit}M` })) },
      ],
      recommendations: [
        result.roiMonths <= 36 ? `ROI ${result.roiMonths} bulan — investasi layak dilanjutkan` : `ROI ${result.roiMonths} bulan — perlu evaluasi ulang`,
        `Rekrut ${result.staffNeeded} perawat baru sebelum bed operasional`,
        'Lakukan feasibility study mendalam dan konsultasi dengan Direksi sebelum implementasi',
      ],
    });
  }, [addBeds]);

  const classConfig = {
    kelas3: { label: 'Kelas III', revenuePerBed: 1_800_000, costFactor: 1.0, bpjsCoverage: 95 },
    kelas2: { label: 'Kelas II', revenuePerBed: 3_200_000, costFactor: 1.3, bpjsCoverage: 80 },
    kelas1: { label: 'Kelas I', revenuePerBed: 5_500_000, costFactor: 1.6, bpjsCoverage: 60 },
    vip: { label: 'VIP/VVIP', revenuePerBed: 12_000_000, costFactor: 2.5, bpjsCoverage: 10 },
  };

  const result = useMemo(() => {
    const cfg = classConfig[bedClass];
    const newTotal = BASELINE.totalBeds + addBeds;
    const newBOR = Math.max(40, (BASELINE.totalBeds * BASELINE.bor / 100) / newTotal * 100);
    const investmentCost = addBeds * BASELINE.costPerBed * cfg.costFactor;
    const avgOccupancy = 0.75;
    const monthlyRevenueGain = addBeds * cfg.revenuePerBed * 30 * avgOccupancy;
    const annualRevenueGain = monthlyRevenueGain * 12;
    const operationalCost = addBeds * 15_000_000 * 12; // annual ops per bed
    const staffNeeded = Math.ceil(addBeds / 6); // 1 perawat per 6 bed
    const staffCost = staffNeeded * BASELINE.staffCostPerMonth * 12;
    const netAnnual = annualRevenueGain - operationalCost - staffCost;
    const roiMonths = netAnnual > 0 ? Math.ceil(investmentCost / netAnnual * 12) : 999;

    const yearProjection = Array.from({ length: 5 }, (_, i) => {
      const yr = i + 1;
      const cumRevenue = annualRevenueGain * yr;
      const cumCost = investmentCost + (operationalCost + staffCost) * yr;
      return {
        tahun: `Thn ${yr}`,
        revenue: +(cumRevenue / 1e9).toFixed(1),
        cost: +(cumCost / 1e9).toFixed(1),
        profit: +((cumRevenue - cumCost) / 1e9).toFixed(1),
      };
    });

    return { newTotal, newBOR, investmentCost, monthlyRevenueGain, annualRevenueGain, netAnnual, roiMonths, staffNeeded, staffCost, operationalCost, yearProjection, cfg };
  }, [addBeds, bedClass]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-gray-800">Bed Expansion ROI Calculator</h3>
            <p className="text-xs text-gray-500 mt-0.5">Analisis kelayakan investasi penambahan tempat tidur</p>
          </div>
          <PdfExportButton onClick={() => handleExportPdf(result, classConfig[bedClass].label)} />
        </div>

        {/* Class Selector */}
        <div className="mb-5">
          <label className="text-xs text-gray-600 font-medium mb-2 block">Kelas Tempat Tidur</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(classConfig) as Array<keyof typeof classConfig>).map(k => (
              <button key={k} onClick={() => setBedClass(k)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${bedClass === k ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                {classConfig[k].label}
                <span className="block text-[10px] opacity-80 mt-0.5">Rp {(classConfig[k].revenuePerBed / 1000).toFixed(0)}rb/hari</span>
              </button>
            ))}
          </div>
        </div>

        <SimSlider label="Jumlah TT Tambahan" value={addBeds} onChange={setAddBeds} min={5} max={80} step={5} unit=" TT" color="accent-emerald-600" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultCard label="Total TT Baru" value={`${result.newTotal}`} sub={`Saat ini: ${BASELINE.totalBeds}`} color="text-emerald-600" bg="bg-emerald-50 border-emerald-200" icon={Bed} />
        <ResultCard label="BOR Baru" value={`${result.newBOR.toFixed(1)}%`} sub={`Saat ini: ${BASELINE.bor}%`}
          color={result.newBOR < 60 ? 'text-amber-600' : 'text-green-600'}
          bg={result.newBOR < 60 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}
          icon={Activity} />
        <ResultCard label="Investasi" value={formatIDR(result.investmentCost)} sub="Biaya pembangunan & peralatan" color="text-red-600" bg="bg-red-50 border-red-200" icon={DollarSign} />
        <ResultCard label="ROI Period" value={result.roiMonths > 120 ? '> 10 thn' : `${result.roiMonths} bln`} sub={result.netAnnual > 0 ? 'Break-even point' : 'Tidak feasible'}
          color={result.roiMonths <= 36 ? 'text-green-600' : result.roiMonths <= 60 ? 'text-amber-600' : 'text-red-600'}
          bg={result.roiMonths <= 36 ? 'bg-green-50 border-green-200' : result.roiMonths <= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}
          icon={TrendingUp} />
      </div>

      {/* Financial Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Rincian Finansial Tahunan</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pendapatan vs Biaya dari bed tambahan</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Pendapatan Tambahan', value: result.annualRevenueGain, color: 'text-green-600', positive: true },
              { label: 'Biaya Operasional', value: result.operationalCost, color: 'text-red-600', positive: false },
              { label: `Biaya SDM (+${result.staffNeeded} perawat)`, value: result.staffCost, color: 'text-red-600', positive: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.positive ? '+' : '-'}{formatIDR(item.value)}</span>
              </div>
            ))}
            <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${result.netAnnual > 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <span className="text-xs font-bold text-gray-700">NET IMPACT / TAHUN</span>
              <span className={`text-lg font-bold ${result.netAnnual > 0 ? 'text-green-600' : 'text-red-600'}`}>{result.netAnnual > 0 ? '+' : ''}{formatIDR(result.netAnnual)}</span>
            </div>
          </div>
        </div>

        {/* 5-Year Projection Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Proyeksi 5 Tahun (Kumulatif)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Revenue vs Cost vs Profit (Miliar Rp)</p>
          </div>
          <RechartsWrapper type="bar" data={result.yearProjection} xKey="tahun" yKey={['revenue', 'cost', 'profit']}
            colors={['#10b981', '#ef4444', '#048A75']} height={220} radius={[4, 4, 0, 0]}
            legendFormatter={(v: string) => v === 'revenue' ? 'Revenue' : v === 'cost' ? 'Cost' : 'Profit'} />
        </div>
      </div>

      <RecommendationBox type={result.roiMonths <= 36 ? 'success' : 'warning'} items={[
        `BPJS coverage untuk ${result.cfg.label}: ${result.cfg.bpjsCoverage}% — pertimbangkan casemix impact`,
        result.roiMonths <= 36 ? `ROI ${result.roiMonths} bulan — investasi layak dilanjutkan` : `ROI ${result.roiMonths > 120 ? '> 120' : result.roiMonths} bulan — perlu evaluasi ulang skema pembiayaan`,
        `Rekrut ${result.staffNeeded} perawat baru (rasio 1:6 bed) sebelum bed operasional`,
        result.newBOR < 60 ? 'BOR proyeksi rendah — pastikan demand pasien cukup sebelum ekspansi' : 'BOR proyeksi stabil — kapasitas tambahan sesuai kebutuhan',
        'Lakukan feasibility study mendalam dan konsultasi dengan Direksi sebelum implementasi',
      ]} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 3: EMERGENCY SURGE (KLB / BENCANA)
// ═══════════════════════════════════════════════════════════════════════════════
function EmergencySurgeScenario() {
  const [surgeType, setSurgeType] = useState<'pandemic' | 'disaster' | 'masscas'>('pandemic');
  const [multiplier, setMultiplier] = useState(2);
  const [duration, setDuration] = useState(14);

  const handleExportPdf = useCallback((result: any, typeLabel: string) => {
    generateSimulationPdf({
      scenarioTitle: `Emergency Surge — ${typeLabel}`,
      scenarioDesc: `Simulasi lonjakan darurat tipe "${typeLabel}" dengan volume ${multiplier}x lipat selama ${duration} hari. Evaluasi kesiapan sumber daya kritis RS.`,
      parameters: [
        { label: 'Tipe Kejadian', value: typeLabel },
        { label: 'Volume Multiplier', value: `${multiplier}x` },
        { label: 'Durasi', value: `${duration} hari` },
        { label: 'Status Kesiapan', value: result.overallReadiness },
      ],
      kpiResults: [
        { label: 'Pasien/Hari (Peak)', value: `${result.surgePatients}`, status: 'bad' },
        { label: 'BOR Peak', value: `${result.surgeBOR.toFixed(0)}%`, status: 'bad' },
        { label: 'TT Tambahan', value: `+${result.extraBeds}`, status: 'warning' },
        { label: 'Total Biaya Surge', value: formatIDR(result.totalSurgeCost), status: 'bad' },
      ],
      sections: [
        { title: 'Resource Readiness', rows: [
          { label: 'ICU Beds', value: `Demand: ${result.readiness.icu.demand} / Capacity: ${result.readiness.icu.capacity} — Gap: ${result.readiness.icu.gap}` },
          { label: 'Ventilator', value: `Demand: ${result.readiness.ventilator.demand} / Capacity: ${result.readiness.ventilator.capacity} — Gap: ${result.readiness.ventilator.gap}` },
          { label: 'APD/PPE', value: `${result.readiness.ppe.days} hari supply — ${result.readiness.ppe.sufficient ? 'Cukup' : 'KURANG'}` },
          { label: 'Stok Darah', value: `${result.readiness.blood.units} unit (${result.readiness.blood.daysSupply} hari)` },
        ]},
        { title: 'Mobilisasi SDM Darurat', rows: [
          { label: 'Total Tambahan', value: `+${result.extraStaff} orang` },
          { label: 'Biaya/Hari', value: formatIDR(result.additionalCostPerDay) },
        ]},
      ],
      recommendations: [
        'Aktifkan Disaster Plan / HEICS',
        `Siapkan area triase darurat (kapasitas +${result.extraBeds} TT)`,
        `Total anggaran darurat: ${formatIDR(result.totalSurgeCost)} untuk ${duration} hari`,
      ],
      riskLevel: result.overallReadiness === 'SIAP' ? 'RISIKO SEDANG' : 'RISIKO KRITIS',
    });
  }, [multiplier, duration]);

  const surgeTypes = {
    pandemic: { label: 'Pandemi / KLB', icon: '🦠', desc: 'Wabah penyakit menular (COVID-like)', defaultMult: 2, defaultDur: 30 },
    disaster: { label: 'Bencana Alam', icon: '🌊', desc: 'Gempa, banjir, dll', defaultMult: 3, defaultDur: 7 },
    masscas: { label: 'Mass Casualty', icon: '🚨', desc: 'Kecelakaan massal, ledakan', defaultMult: 5, defaultDur: 3 },
  };

  const result = useMemo(() => {
    const surgePatients = Math.round(BASELINE.dailyPatients * multiplier);
    const surgeER = Math.round(BASELINE.erWait * multiplier * 0.8);
    const surgeBOR = Math.min(100, BASELINE.bor * multiplier * 0.7);
    const extraBeds = Math.max(0, Math.round(BASELINE.totalBeds * (multiplier - 1) * 0.6));
    const extraStaff = Math.ceil(BASELINE.staffTotal * (multiplier - 1) * 0.5);
    const additionalCostPerDay = extraStaff * (BASELINE.staffCostPerMonth / 30) + extraBeds * 500_000;
    const totalSurgeCost = additionalCostPerDay * duration;

    const readiness = {
      icu: { capacity: BASELINE.icuBeds, demand: Math.round(BASELINE.icuBeds * multiplier * 0.8), gap: 0 },
      ventilator: { capacity: 15, demand: Math.round(15 * multiplier * 0.6), gap: 0 },
      oxygen: { capacity: 50, demand: Math.round(50 * multiplier * 0.5), gap: 0 },
      ppe: { days: Math.round(90 / multiplier), sufficient: Math.round(90 / multiplier) > duration },
      blood: { units: 200, demandPerDay: Math.round(8 * multiplier), daysSupply: Math.round(200 / (8 * multiplier)) },
    };
    readiness.icu.gap = Math.max(0, readiness.icu.demand - readiness.icu.capacity);
    readiness.ventilator.gap = Math.max(0, readiness.ventilator.demand - readiness.ventilator.capacity);
    readiness.oxygen.gap = Math.max(0, readiness.oxygen.demand - readiness.oxygen.capacity);

    const overallReadiness = readiness.icu.gap === 0 && readiness.ventilator.gap === 0 && readiness.ppe.sufficient ? 'SIAP' : 'BELUM SIAP';

    const timeline = Array.from({ length: Math.min(duration, 14) }, (_, i) => {
      const day = i + 1;
      const peakFactor = surgeType === 'masscas' ? Math.max(0.3, 1 - (day / duration)) : surgeType === 'disaster' ? (day <= 3 ? 1 : Math.max(0.4, 1 - (day - 3) / (duration - 3) * 0.6)) : Math.min(1, day / 7);
      return {
        hari: `H+${day}`,
        pasien: Math.round(surgePatients * peakFactor),
        icu: Math.round(readiness.icu.demand * peakFactor),
        er: Math.round(surgeER * peakFactor),
      };
    });

    return { surgePatients, surgeER, surgeBOR, extraBeds, extraStaff, additionalCostPerDay, totalSurgeCost, readiness, overallReadiness, timeline };
  }, [multiplier, duration, surgeType]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-800">Emergency Surge Capacity Assessment</h3>
            <p className="text-xs text-gray-500 mt-0.5">Evaluasi kesiapan RS menghadapi lonjakan darurat</p>
          </div>
          <div className="flex items-center gap-2">
            <PdfExportButton onClick={() => handleExportPdf(result, surgeTypes[surgeType].label)} />
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${result.overallReadiness === 'SIAP' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {result.overallReadiness === 'SIAP' ? '✓' : '✕'} {result.overallReadiness}
            </span>
          </div>
        </div>

        {/* Surge Type */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(Object.keys(surgeTypes) as Array<keyof typeof surgeTypes>).map(k => (
            <button key={k} onClick={() => { setSurgeType(k); setMultiplier(surgeTypes[k].defaultMult); setDuration(surgeTypes[k].defaultDur); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${surgeType === k ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}>
              <span className="mr-1">{surgeTypes[k].icon}</span> {surgeTypes[k].label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimSlider label="Multiplier Volume" value={multiplier} onChange={setMultiplier} min={1.5} max={8} step={0.5} unit="x" color="accent-red-600" />
          <SimSlider label="Durasi Kejadian" value={duration} onChange={setDuration} min={1} max={60} step={1} unit=" hari" color="accent-red-600" />
        </div>
      </div>

      {/* Impact KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultCard label="Pasien/Hari (Peak)" value={`${result.surgePatients}`} sub={`Normal: ${BASELINE.dailyPatients}`} color="text-red-600" bg="bg-red-50 border-red-200" icon={Users} />
        <ResultCard label="BOR Peak" value={`${result.surgeBOR.toFixed(0)}%`} sub={`Normal: ${BASELINE.bor}%`} color="text-red-600" bg="bg-red-50 border-red-200" icon={Bed} />
        <ResultCard label="TT Tambahan" value={`+${result.extraBeds}`} sub="Kebutuhan bed darurat" color="text-orange-600" bg="bg-orange-50 border-orange-200" icon={Bed} />
        <ResultCard label="Total Biaya Surge" value={formatIDR(result.totalSurgeCost)} sub={`${duration} hari operasi darurat`} color="text-red-600" bg="bg-red-50 border-red-200" icon={DollarSign} />
      </div>

      {/* Resource Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Resource Readiness Check</h3>
            <p className="text-xs text-gray-500 mt-0.5">Ketersediaan sumber daya kritis</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'ICU Beds', capacity: result.readiness.icu.capacity, demand: result.readiness.icu.demand, unit: 'TT' },
              { label: 'Ventilator', capacity: result.readiness.ventilator.capacity, demand: result.readiness.ventilator.demand, unit: 'unit' },
              { label: 'Oxygen Supply', capacity: result.readiness.oxygen.capacity, demand: result.readiness.oxygen.demand, unit: 'tabung' },
            ].map(r => {
              const ok = r.demand <= r.capacity;
              return (
                <div key={r.label} className={`p-3 rounded-lg border ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                      <span className="text-xs font-medium text-gray-700">{r.label}</span>
                    </div>
                    <span className={`text-xs font-bold ${ok ? 'text-green-600' : 'text-red-600'}`}>
                      {r.demand}/{r.capacity} {r.unit}
                    </span>
                  </div>
                  <MiniBar value={Math.min(r.demand, r.capacity)} total={r.capacity} color={ok ? 'bg-green-500' : 'bg-red-500'} />
                  {!ok && <p className="text-[10px] text-red-500 mt-1">Kekurangan: {r.demand - r.capacity} {r.unit}</p>}
                </div>
              );
            })}
            {/* PPE & Blood */}
            <div className={`p-3 rounded-lg border ${result.readiness.ppe.sufficient ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.readiness.ppe.sufficient ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  <span className="text-xs font-medium text-gray-700">APD / PPE Stock</span>
                </div>
                <span className={`text-xs font-bold ${result.readiness.ppe.sufficient ? 'text-green-600' : 'text-red-600'}`}>
                  {result.readiness.ppe.days} hari supply
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${result.readiness.blood.daysSupply >= duration ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.readiness.blood.daysSupply >= duration ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  <span className="text-xs font-medium text-gray-700">Stok Darah (PMI)</span>
                </div>
                <span className={`text-xs font-bold ${result.readiness.blood.daysSupply >= duration ? 'text-green-600' : 'text-amber-600'}`}>
                  {result.readiness.blood.units} unit ({result.readiness.blood.daysSupply} hari)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Surge Timeline */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Surge Curve Projection</h3>
            <p className="text-xs text-gray-500 mt-0.5">Tren pasien selama kejadian darurat</p>
          </div>
          <RechartsWrapper type="line" data={result.timeline} xKey="hari" lines={[
            { dataKey: 'pasien', stroke: '#ef4444', name: 'Total Pasien' },
            { dataKey: 'icu', stroke: '#f59e0b', name: 'Butuh ICU' },
            { dataKey: 'er', stroke: '#8b5cf6', name: 'ER Wait (mnt)' },
          ]} height={240} />
        </div>
      </div>

      {/* Staffing Mobilization */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="text-gray-800">Mobilisasi SDM Darurat (+{result.extraStaff} orang)</h3>
          <p className="text-xs text-gray-500 mt-0.5">Estimasi biaya tambahan: {formatIDR(result.additionalCostPerDay)}/hari</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { role: 'Dokter Jaga', count: Math.ceil(result.extraStaff * 0.15), shift: '3 shift/24 jam' },
            { role: 'Perawat IGD', count: Math.ceil(result.extraStaff * 0.35), shift: '3 shift/24 jam' },
            { role: 'Paramedis', count: Math.ceil(result.extraStaff * 0.25), shift: '2 shift/12 jam' },
            { role: 'Support Staff', count: Math.ceil(result.extraStaff * 0.25), shift: 'On-call' },
          ].map(s => (
            <div key={s.role} className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xl font-bold text-red-600">+{s.count}</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">{s.role}</p>
              <p className="text-[10px] text-gray-400">{s.shift}</p>
            </div>
          ))}
        </div>
      </div>

      <RecommendationBox type="warning" items={[
        `Aktifkan Disaster Plan / Hospital Emergency Incident Command System (HEICS)`,
        `Siapkan area triase darurat di halaman RS (kapasitas +${result.extraBeds} TT darurat)`,
        `Koordinasi dengan PMI untuk tambahan ${Math.ceil(result.readiness.blood.demandPerDay * duration)} unit darah`,
        `Hubungi RS jejaring untuk kemungkinan evakuasi ${Math.max(0, result.surgePatients - BASELINE.dailyPatients * 1.5).toFixed(0)} pasien overflow`,
        `Total anggaran darurat: ${formatIDR(result.totalSurgeCost)} untuk ${duration} hari operasi surge`,
      ]} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 4: EFFICIENCY IMPROVEMENT
// ═══════════════════════════════════════════════════════════════════════════════
function EfficiencyScenario() {
  const [alosReduction, setAlosReduction] = useState(10);
  const [waitReduction, setWaitReduction] = useState(15);
  const [dischargeImprove, setDischargeImprove] = useState(20);

  const handleExportPdf = useCallback((result: any) => {
    generateSimulationPdf({
      scenarioTitle: 'Efficiency Improvement Analysis',
      scenarioDesc: `Simulasi dampak perbaikan efisiensi: reduksi ALOS -${alosReduction}%, waiting time -${waitReduction}%, discharge delay -${dischargeImprove}%.`,
      parameters: [
        { label: 'Reduksi ALOS', value: `-${alosReduction}%` },
        { label: 'Reduksi Waiting Time', value: `-${waitReduction}%` },
        { label: 'Perbaikan Discharge', value: `+${dischargeImprove}%` },
      ],
      kpiResults: [
        { label: 'BOR Baru', value: `${result.newBOR.toFixed(1)}%`, status: 'good' },
        { label: 'TT Freed', value: `+${result.freedBeds}`, status: 'good' },
        { label: 'Kapasitas Tambahan', value: `+${result.additionalCapacity}/bln`, status: 'good' },
        { label: 'Revenue/Bulan', value: formatIDR(result.revenueGain), status: 'good' },
      ],
      sections: [
        { title: 'Before vs After', rows: result.impactAreas.map((r: any) => ({ label: r.area, value: `${r.before} → ${r.after} (${r.impact})` })) },
        { title: 'Initiative Roadmap', rows: result.initiatives.map((i: any) => ({ label: i.name, value: `Effort: ${i.effort} | Impact: ${i.impact} | ${i.timeline}` })) },
      ],
      recommendations: [
        `Perbaikan ALOS -${alosReduction}% membebaskan ${result.freedBeds} TT`,
        `Potensi revenue tambahan ${formatIDR(result.revenueGain * 12)}/tahun`,
        'Quick win: Discharge Planning & Digital Queue',
      ],
    });
  }, [alosReduction, waitReduction, dischargeImprove]);

  const result = useMemo(() => {
    const newALOS = BASELINE.alos * (1 - alosReduction / 100);
    const freedBeds = Math.round(BASELINE.totalBeds * BASELINE.bor / 100 * alosReduction / 100 * 0.3);
    const newBOR = Math.max(40, BASELINE.bor - (freedBeds / BASELINE.totalBeds * 100));
    const additionalCapacity = Math.round(freedBeds * 30 / newALOS);
    const revenueGain = additionalCapacity * 3_500_000;
    const newERWait = BASELINE.erWait * (1 - waitReduction / 100);
    const dischargeSaved = Math.round(dischargeImprove / 100 * 45); // 45 min avg delay
    const satisfactionLift = +(waitReduction * 0.3 + dischargeImprove * 0.2).toFixed(1);

    const impactAreas = [
      { area: 'BOR', before: `${BASELINE.bor}%`, after: `${newBOR.toFixed(1)}%`, impact: `${(BASELINE.bor - newBOR).toFixed(1)}% ↓`, good: true },
      { area: 'ALOS', before: `${BASELINE.alos} hari`, after: `${newALOS.toFixed(1)} hari`, impact: `${(BASELINE.alos - newALOS).toFixed(1)} hari ↓`, good: true },
      { area: 'ER Wait', before: `${BASELINE.erWait} mnt`, after: `${newERWait.toFixed(0)} mnt`, impact: `${(BASELINE.erWait - newERWait).toFixed(0)} mnt ↓`, good: true },
      { area: 'Discharge Delay', before: '45 mnt', after: `${(45 - dischargeSaved)} mnt`, impact: `${dischargeSaved} mnt ↓`, good: true },
      { area: 'Kapasitas Tambahan', before: '0', after: `+${additionalCapacity}/bln`, impact: `+${additionalCapacity} pasien`, good: true },
      { area: 'Patient Satisfaction', before: '82.5%', after: `${(82.5 + satisfactionLift).toFixed(1)}%`, impact: `+${satisfactionLift}%`, good: true },
    ];

    const initiatives = [
      { name: 'Clinical Pathway Optimization', effort: 'Sedang', impact: 'Tinggi', timeline: '3-6 bulan', cost: 150_000_000, saving: revenueGain * 0.4 * 12 },
      { name: 'Discharge Planning System', effort: 'Rendah', impact: 'Tinggi', timeline: '1-3 bulan', cost: 80_000_000, saving: revenueGain * 0.3 * 12 },
      { name: 'Lab TAT Improvement', effort: 'Sedang', impact: 'Sedang', timeline: '3-6 bulan', cost: 200_000_000, saving: revenueGain * 0.15 * 12 },
      { name: 'Digital Queue System', effort: 'Rendah', impact: 'Sedang', timeline: '1-2 bulan', cost: 120_000_000, saving: revenueGain * 0.1 * 12 },
      { name: 'Bed Management System', effort: 'Tinggi', impact: 'Tinggi', timeline: '6-12 bulan', cost: 500_000_000, saving: revenueGain * 0.5 * 12 },
    ];

    const waitTimeImpact = waitingTimeByUnit.map(w => ({
      unit: w.unit,
      sebelum: w.menit,
      sesudah: Math.round(w.menit * (1 - waitReduction / 100)),
    }));

    return { newALOS, freedBeds, newBOR, additionalCapacity, revenueGain, newERWait, dischargeSaved, satisfactionLift, impactAreas, initiatives, waitTimeImpact };
  }, [alosReduction, waitReduction, dischargeImprove]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-gray-800">Efficiency Improvement Simulator</h3>
            <p className="text-xs text-gray-500 mt-0.5">Analisis dampak perbaikan efisiensi terhadap kapasitas dan revenue</p>
          </div>
          <PdfExportButton onClick={() => handleExportPdf(result)} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SimSlider label="Reduksi ALOS" value={alosReduction} onChange={setAlosReduction} min={0} max={40} step={5} unit="%" color="accent-amber-600" />
          <SimSlider label="Reduksi Waiting Time" value={waitReduction} onChange={setWaitReduction} min={0} max={50} step={5} unit="%" color="accent-amber-600" />
          <SimSlider label="Perbaikan Discharge" value={dischargeImprove} onChange={setDischargeImprove} min={0} max={50} step={5} unit="%" color="accent-amber-600" />
        </div>
      </div>

      {/* Before vs After */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="text-gray-800">Before vs After Comparison</h3>
          <p className="text-xs text-gray-500 mt-0.5">Dampak efisiensi terhadap KPI operasional</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Indikator</th>
                <th className="text-center py-2 px-3 text-gray-500 font-medium">Sebelum</th>
                <th className="text-center py-2 px-3 text-gray-500 font-medium">Sesudah</th>
                <th className="text-center py-2 px-3 text-gray-500 font-medium">Dampak</th>
              </tr>
            </thead>
            <tbody>
              {result.impactAreas.map(row => (
                <tr key={row.area} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-gray-700">{row.area}</td>
                  <td className="py-2.5 px-3 text-center text-gray-500">{row.before}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-600">{row.after}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">{row.impact}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Waiting Time Comparison */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Waiting Time: Sebelum vs Sesudah</h3>
            <p className="text-xs text-gray-500 mt-0.5">Perbaikan waktu tunggu per unit</p>
          </div>
          <RechartsWrapper type="bar" data={result.waitTimeImpact} xKey="unit" yKey={['sebelum', 'sesudah']}
            colors={['#fbbf24', '#10b981']} height={220} radius={[4, 4, 0, 0]}
            legendFormatter={(v: string) => v === 'sebelum' ? 'Sebelum' : 'Sesudah'}
            tooltipFormatter={(v: number) => `${v} menit`} />
        </div>

        {/* Revenue Impact */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Revenue Impact dari Efisiensi</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pendapatan tambahan dari kapasitas yang dibebaskan</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xl font-bold text-green-600">+{result.freedBeds}</p>
                <p className="text-xs text-gray-600 mt-0.5">TT tersedia (freed)</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xl font-bold text-blue-600">+{result.additionalCapacity}</p>
                <p className="text-xs text-gray-600 mt-0.5">Pasien tambahan/bln</p>
              </div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border-2 border-emerald-300">
              <p className="text-xs text-gray-600">Potensi Revenue Tambahan/Bulan</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatIDR(result.revenueGain)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatIDR(result.revenueGain * 12)}/tahun</p>
            </div>
          </div>
        </div>
      </div>

      {/* Initiative Roadmap */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="text-gray-800">Initiative Roadmap & ROI</h3>
          <p className="text-xs text-gray-500 mt-0.5">Inisiatif perbaikan efisiensi beserta perkiraan biaya & penghematan</p>
        </div>
        <div className="space-y-2">
          {result.initiatives.map(init => (
            <div key={init.name} className="p-3 bg-gray-50 rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700">{init.name}</p>
                <div className="flex gap-3 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${init.effort === 'Rendah' ? 'bg-green-100 text-green-700' : init.effort === 'Sedang' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    Effort: {init.effort}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${init.impact === 'Tinggi' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    Impact: {init.impact}
                  </span>
                  <span className="text-[10px] text-gray-400">{init.timeline}</span>
                </div>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="text-[10px] text-gray-400">Investasi</p>
                  <p className="text-xs font-bold text-red-600">{formatIDR(init.cost)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Saving/thn</p>
                  <p className="text-xs font-bold text-green-600">{formatIDR(init.saving)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RecommendationBox type="success" items={[
        `Perbaikan ALOS -${alosReduction}% membebaskan ${result.freedBeds} TT — prioritas Clinical Pathway Optimization`,
        `Reduksi waiting time -${waitReduction}% meningkatkan kepuasan pasien +${result.satisfactionLift}%`,
        `Potensi revenue tambahan ${formatIDR(result.revenueGain * 12)}/tahun tanpa investasi infrastruktur besar`,
        'Quick win: Mulai dari Discharge Planning & Digital Queue (effort rendah, impact tinggi)',
        'Implementasikan Bed Management System untuk dampak jangka panjang',
      ]} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 5: STAFFING OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════════
function StaffingScenario() {
  const [nurseRatio, setNurseRatio] = useState(6);
  const [overtimeReduction, setOvertimeReduction] = useState(20);
  const [turnoverReduction, setTurnoverReduction] = useState(15);
  const [trainingBudget, setTrainingBudget] = useState(5);

  const handleExportPdf = useCallback((result: any) => {
    generateSimulationPdf({
      scenarioTitle: 'Staffing Optimization Analysis',
      scenarioDesc: `Optimasi komposisi SDM: rasio perawat 1:${nurseRatio}, reduksi overtime -${overtimeReduction}%, reduksi turnover -${turnoverReduction}%, budget pelatihan ${trainingBudget}% payroll.`,
      parameters: [
        { label: 'Rasio Perawat:Bed', value: `1:${nurseRatio}` },
        { label: 'Reduksi Overtime', value: `-${overtimeReduction}%` },
        { label: 'Reduksi Turnover', value: `-${turnoverReduction}%` },
        { label: 'Budget Pelatihan', value: `${trainingBudget}% payroll` },
      ],
      kpiResults: [
        { label: 'Gap Perawat', value: result.nurseGap > 0 ? `+${result.nurseGap}` : 'Tercukupi', status: result.nurseGap > 10 ? 'bad' : result.nurseGap > 0 ? 'warning' : 'good' },
        { label: 'Quality Score', value: `${result.qualityScore.toFixed(1)}%`, status: result.qualityScore >= 90 ? 'good' : 'warning' },
        { label: 'Burnout Risk', value: `${result.burnoutRisk.toFixed(0)}%`, status: result.burnoutRisk > 40 ? 'bad' : result.burnoutRisk > 25 ? 'warning' : 'good' },
        { label: 'Net Impact/Tahun', value: formatIDR(result.netAnnualImpact), status: result.netAnnualImpact > 0 ? 'good' : 'warning' },
      ],
      sections: [
        { title: 'Cost-Benefit Analysis', rows: result.costBreakdown.map((c: any) => ({ label: c.item, value: `${c.type === 'saving' ? '+' : '-'}${formatIDR(c.value)}` })) },
        { title: 'Komposisi SDM', rows: result.staffComposition.flatMap((cat: any) => cat.subcategories.map((s: any) => ({ label: `${cat.category} — ${s.role}`, value: `${s.count} → ${s.ideal} (rasio ${s.ratio} → ${s.idealRatio})` }))) },
      ],
      recommendations: [
        result.nurseGap > 0 ? `Prioritas rekrutmen: ${result.nurseGap} perawat baru` : 'Rasio perawat sudah memenuhi standar',
        `Reduksi overtime menghemat ${formatIDR(result.overtimeSaved)}/tahun`,
        `Program retensi staf hemat ${formatIDR(result.turnoverSaved)}/tahun`,
        `Total net impact: ${formatIDR(result.netAnnualImpact)}/tahun`,
      ],
    });
  }, [nurseRatio, overtimeReduction, turnoverReduction, trainingBudget]);

  const result = useMemo(() => {
    const currentNurses = 98;

    // Nurse ratio impact
    const idealNurses = Math.ceil(BASELINE.totalBeds * BASELINE.bor / 100 / nurseRatio);
    const nurseGap = idealNurses - currentNurses;
    const nurseCostImpact = nurseGap * BASELINE.staffCostPerMonth * 12;

    // Overtime
    const currentOvertimeCost = currentNurses * 2_500_000 * 12; // avg 2.5jt overtime/nurse/month
    const overtimeSaved = currentOvertimeCost * overtimeReduction / 100;

    // Turnover
    const currentTurnoverRate = 12; // 12%
    const newTurnoverRate = currentTurnoverRate * (1 - turnoverReduction / 100);
    const recruitCostPerPerson = 25_000_000;
    const currentRecruitCost = Math.round(BASELINE.staffTotal * currentTurnoverRate / 100) * recruitCostPerPerson;
    const newRecruitCost = Math.round(BASELINE.staffTotal * newTurnoverRate / 100) * recruitCostPerPerson;
    const turnoverSaved = currentRecruitCost - newRecruitCost;

    // Training
    const trainingTotal = BASELINE.staffTotal * BASELINE.staffCostPerMonth * trainingBudget / 100 * 12;
    const productivityGain = trainingBudget * 0.8; // each 1% training budget = 0.8% productivity

    // Quality impact
    const qualityScore = Math.min(100, 82.5 + (nurseGap > 0 ? nurseGap * 0.3 : 0) + overtimeReduction * 0.1 + turnoverReduction * 0.15 + trainingBudget * 0.5);
    const burnoutRisk = Math.max(0, 45 - overtimeReduction * 0.8 - (nurseGap > 0 ? nurseGap * 0.5 : nurseGap * -0.3));

    const netAnnualImpact = -nurseCostImpact + overtimeSaved + turnoverSaved - trainingTotal;

    const staffComposition = [
      { category: 'Medis', subcategories: [
        { role: 'Dokter Spesialis', count: 42, ideal: 48, ratio: '1:15', idealRatio: '1:12' },
        { role: 'Dokter Umum', count: 18, ideal: 22, ratio: '1:25', idealRatio: '1:20' },
        { role: 'Dokter Gigi', count: 4, ideal: 4, ratio: '1:60', idealRatio: '1:60' },
      ]},
      { category: 'Keperawatan', subcategories: [
        { role: 'Perawat', count: 98, ideal: idealNurses, ratio: `1:${nurseRatio}`, idealRatio: '1:5' },
        { role: 'Bidan', count: 12, ideal: 14, ratio: '1:8', idealRatio: '1:6' },
      ]},
      { category: 'Penunjang', subcategories: [
        { role: 'Farmasi', count: 18, ideal: 22, ratio: '1:30', idealRatio: '1:25' },
        { role: 'Lab Analis', count: 14, ideal: 16, ratio: '1:35', idealRatio: '1:30' },
        { role: 'Radiografer', count: 8, ideal: 10, ratio: '1:45', idealRatio: '1:35' },
      ]},
    ];

    const costBreakdown = [
      { item: 'Rekrut Perawat Baru', value: nurseCostImpact, type: 'cost' as const },
      { item: 'Penghematan Overtime', value: overtimeSaved, type: 'saving' as const },
      { item: 'Penghematan Turnover', value: turnoverSaved, type: 'saving' as const },
      { item: 'Budget Pelatihan', value: trainingTotal, type: 'cost' as const },
    ];

    return {
      idealNurses, nurseGap, nurseCostImpact, overtimeSaved, currentTurnoverRate, newTurnoverRate,
      turnoverSaved, trainingTotal, productivityGain, qualityScore, burnoutRisk, netAnnualImpact,
      staffComposition, costBreakdown,
    };
  }, [nurseRatio, overtimeReduction, turnoverReduction, trainingBudget]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-gray-800">Staffing Optimization Simulator</h3>
            <p className="text-xs text-gray-500 mt-0.5">Optimasi komposisi SDM, overtime, turnover, dan pelatihan</p>
          </div>
          <PdfExportButton onClick={() => handleExportPdf(result)} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimSlider label="Rasio Perawat : Bed" value={nurseRatio} onChange={setNurseRatio} min={3} max={10} step={1} unit=":1" color="accent-purple-600" />
          <SimSlider label="Reduksi Overtime" value={overtimeReduction} onChange={setOvertimeReduction} min={0} max={50} step={5} unit="%" color="accent-purple-600" />
          <SimSlider label="Reduksi Turnover" value={turnoverReduction} onChange={setTurnoverReduction} min={0} max={40} step={5} unit="%" color="accent-purple-600" />
          <SimSlider label="Budget Pelatihan (% Payroll)" value={trainingBudget} onChange={setTrainingBudget} min={0} max={15} step={1} unit="%" color="accent-purple-600" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultCard label="Gap Perawat" value={result.nurseGap > 0 ? `+${result.nurseGap} dibutuhkan` : 'Tercukupi'}
          sub={`Ideal: ${result.idealNurses} | Saat ini: 98`}
          color={result.nurseGap > 10 ? 'text-red-600' : result.nurseGap > 0 ? 'text-amber-600' : 'text-green-600'}
          bg={result.nurseGap > 10 ? 'bg-red-50 border-red-200' : result.nurseGap > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}
          icon={Users} />
        <ResultCard label="Quality Score" value={`${result.qualityScore.toFixed(1)}%`} sub="Indeks kualitas layanan"
          color={result.qualityScore >= 90 ? 'text-green-600' : 'text-amber-600'}
          bg={result.qualityScore >= 90 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}
          icon={Shield} />
        <ResultCard label="Burnout Risk" value={`${result.burnoutRisk.toFixed(0)}%`} sub="Risiko kelelahan staf"
          color={result.burnoutRisk > 40 ? 'text-red-600' : result.burnoutRisk > 25 ? 'text-amber-600' : 'text-green-600'}
          bg={result.burnoutRisk > 40 ? 'bg-red-50 border-red-200' : result.burnoutRisk > 25 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}
          icon={Activity} />
        <ResultCard label="Net Impact/Tahun" value={formatIDR(result.netAnnualImpact)}
          sub={result.netAnnualImpact > 0 ? 'Penghematan bersih' : 'Investasi SDM'}
          color={result.netAnnualImpact > 0 ? 'text-green-600' : 'text-blue-600'}
          bg={result.netAnnualImpact > 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}
          icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Staff Composition Analysis */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Analisis Komposisi SDM</h3>
            <p className="text-xs text-gray-500 mt-0.5">Current vs Ideal staffing per kategori</p>
          </div>
          <div className="space-y-4">
            {result.staffComposition.map(cat => (
              <div key={cat.category}>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{cat.category}</p>
                <div className="space-y-2">
                  {cat.subcategories.map(sub => {
                    const gap = sub.ideal - sub.count;
                    return (
                      <div key={sub.role} className="p-2.5 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-700">{sub.role}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{sub.count}</span>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <span className={`text-xs font-bold ${gap > 0 ? 'text-amber-600' : 'text-green-600'}`}>{sub.ideal}</span>
                          </div>
                        </div>
                        <MiniBar value={sub.count} total={sub.ideal} color={gap > 0 ? 'bg-amber-500' : 'bg-green-500'} />
                        {gap > 0 && <p className="text-[10px] text-amber-500 mt-0.5">Gap: +{gap} orang (rasio {sub.ratio} → {sub.idealRatio})</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost-Benefit Analysis */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Cost-Benefit Analysis</h3>
            <p className="text-xs text-gray-500 mt-0.5">Biaya vs penghematan per inisiatif</p>
          </div>
          <div className="space-y-3">
            {result.costBreakdown.map(item => (
              <div key={item.item} className={`p-3 rounded-lg border ${item.type === 'saving' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">{item.item}</span>
                  <span className={`text-sm font-bold ${item.type === 'saving' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'saving' ? '+' : '-'}{formatIDR(item.value)}
                  </span>
                </div>
              </div>
            ))}
            <div className={`p-4 rounded-lg border-2 ${result.netAnnualImpact > 0 ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">NET IMPACT / TAHUN</span>
                <span className={`text-lg font-bold ${result.netAnnualImpact > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                  {result.netAnnualImpact > 0 ? '+' : ''}{formatIDR(result.netAnnualImpact)}
                </span>
              </div>
            </div>
          </div>

          {/* Turnover Comparison */}
          <div className="mt-5 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Turnover Rate Impact</p>
            <div className="flex items-center gap-4">
              <div className="text-center flex-1">
                <p className="text-xl font-bold text-red-600">{result.currentTurnoverRate}%</p>
                <p className="text-[10px] text-gray-400">Sebelum</p>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-400" />
              <div className="text-center flex-1">
                <p className="text-xl font-bold text-green-600">{result.newTurnoverRate.toFixed(1)}%</p>
                <p className="text-[10px] text-gray-400">Sesudah</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">
              Penghematan biaya rekrutmen: {formatIDR(result.turnoverSaved)}/tahun
            </p>
          </div>
        </div>
      </div>

      <RecommendationBox type={result.nurseGap > 10 ? 'warning' : 'success'} items={[
        result.nurseGap > 0
          ? `Prioritas rekrutmen: ${result.nurseGap} perawat baru (rasio 1:${nurseRatio}) untuk standar patient safety`
          : 'Rasio perawat sudah memenuhi standar — fokus pada peningkatan kompetensi',
        `Reduksi overtime ${overtimeReduction}% mengurangi burnout risk ke ${result.burnoutRisk.toFixed(0)}% dan menghemat ${formatIDR(result.overtimeSaved)}/tahun`,
        `Program retensi staf (reduksi turnover ${result.currentTurnoverRate}% → ${result.newTurnoverRate.toFixed(1)}%) hemat ${formatIDR(result.turnoverSaved)}/tahun`,
        `Alokasikan ${trainingBudget}% payroll untuk pelatihan — proyeksi peningkatan produktivitas +${result.productivityGain.toFixed(1)}%`,
        `Total net impact: ${formatIDR(result.netAnnualImpact)}/tahun — ${result.netAnnualImpact > 0 ? 'investasi SDM menghasilkan penghematan bersih' : 'investasi SDM untuk kualitas jangka panjang'}`,
      ]} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function OperationsSimulation() {
  const [scenario, setScenario] = useState<Scenario>('volume');

  return (
    <div className="space-y-5">
      {/* Scenario Selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-gray-800">Operations Simulation Engine</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pilih skenario untuk menjalankan simulasi interaktif</p>
          </div>
          <button onClick={() => setScenario('volume')} className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {SCENARIOS.map(s => {
            const active = scenario === s.id;
            return (
              <button key={s.id} onClick={() => setScenario(s.id)}
                className={`p-2.5 rounded-xl border-2 text-left transition-all ${active ? `${s.bg} ${s.border} shadow-sm` : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                <s.icon className={`w-4 h-4 mb-1 ${active ? s.color : 'text-gray-400'}`} />
                <p className={`text-[11px] font-medium leading-tight ${active ? s.color : 'text-gray-600'}`}>{s.label}</p>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">{SCENARIOS.find(s => s.id === scenario)?.desc}</p>
      </div>

      {/* Scenario Content */}
      {scenario === 'volume' && <VolumeGrowthScenario />}
      {scenario === 'bed' && <BedExpansionScenario />}
      {scenario === 'surge' && <EmergencySurgeScenario />}
      {scenario === 'efficiency' && <EfficiencyScenario />}
      {scenario === 'staffing' && <StaffingScenario />}
      {scenario === 'sensitivity' && <SensitivityAnalysis />}
      {scenario === 'montecarlo' && <MonteCarloSimulation />}
    </div>
  );
}
