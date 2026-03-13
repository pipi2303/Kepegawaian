/**
 * ExecutiveDashboard.tsx — Hospital Director / Board: Executive Command Center
 * Tab 1: Hospital Overview | Tab 2: Financial & Sustainability
 * Tab 3: Operational Performance | Tab 4: Risk & Compliance
 */
import React, { useState } from 'react';
import {
  Activity, TrendingUp, Bed, Clock, DollarSign,
  AlertCircle, ShieldCheck, Heart, ChevronRight, Stethoscope,
  Users, BarChart2, Layers, Gauge,
} from 'lucide-react';
import RechartsWrapper from '../RechartsWrapper';
import { MiniBar, TabButton } from '../DashboardWidgets';
import {
  revenueVsCost, revenueByService, bpjsVsNonBPJS,
  clinicalKPI, patientVolumeTrend, borByWard,
  riskIndicators, patientSatisfaction,
  fmtRpShort, profitByDept, costBreakdown,
  orUtilization, waitingTimeByUnit, doctorProductivity,
  accreditationScore, incidentTrend, auditFindings, riskHeatmap,
  claimOverview,
} from '../../data/hospitalDashboardData';

type Tab = 'overview' | 'financial' | 'operational' | 'risk';

export default function ExecutiveDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

  const ebitdaMargin = revenueVsCost.map(r => ({
    bulan: r.bulan,
    margin: Number(((r.revenue - r.cost) / r.revenue * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex gap-1 overflow-x-auto">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={Gauge} label="Hospital Overview" />
        <TabButton active={tab === 'financial'} onClick={() => setTab('financial')} icon={DollarSign} label="Financial & Sustainability" />
        <TabButton active={tab === 'operational'} onClick={() => setTab('operational')} icon={Activity} label="Operational Performance" />
        <TabButton active={tab === 'risk'} onClick={() => setTab('risk')} icon={ShieldCheck} label="Risk & Compliance" />
      </div>

      {/* ── TAB 1: Hospital Overview ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'BOR', value: `${clinicalKPI.bor}%`, sub: 'Target: 75–85%', icon: Bed, color: 'bg-blue-50', iconColor: 'text-blue-600', status: clinicalKPI.bor >= 75 && clinicalKPI.bor <= 85 ? 'text-green-600' : 'text-amber-600' },
              { label: 'ALOS', value: `${clinicalKPI.alos} hari`, sub: 'Target: 3–5 hari', icon: Clock, color: 'bg-emerald-50', iconColor: 'text-emerald-600', status: 'text-green-600' },
              { label: 'Cash Flow Netto', value: fmtRpShort(29_400_000_000 - 25_800_000_000), sub: 'Mar 2026', icon: DollarSign, color: 'bg-teal-50', iconColor: 'text-teal-600', status: 'text-green-600' },
              { label: 'Patient Satisfaction', value: '85.6', sub: 'Index (1–100)', icon: Heart, color: 'bg-pink-50', iconColor: 'text-pink-600', status: 'text-green-600' },
              { label: 'BPJS Claim Rate', value: `${claimOverview.acceptanceRate}%`, sub: `${claimOverview.totalRejected} ditolak`, icon: ShieldCheck, color: 'bg-cyan-50', iconColor: 'text-cyan-600', status: claimOverview.acceptanceRate >= 90 ? 'text-green-600' : 'text-amber-600' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${k.color} flex items-center justify-center`}>
                    <k.icon className={`w-4 h-4 ${k.iconColor}`} />
                  </div>
                  <span className={`text-xs font-semibold ${k.status}`}>{k.value}</span>
                </div>
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue vs Cost + EBITDA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Total Revenue vs Cost (MTD/YTD)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tren 6 bulan terakhir · dalam Milyar Rupiah</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={revenueVsCost}
                xKey="bulan"
                yKey={['revenue', 'cost']}
                colors={['#3b82f6', '#f87171']}
                height={240}
                radius={[4, 4, 0, 0]}
                tooltipFormatter={(v: number) => fmtRpShort(v)}
                legendFormatter={(v: string) => v === 'revenue' ? 'Revenue' : 'Cost'}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">EBITDA Margin</h3>
                <p className="text-xs text-gray-500 mt-0.5">Profitabilitas operasional (%)</p>
              </div>
              <RechartsWrapper
                type="line"
                data={ebitdaMargin}
                xKey="bulan"
                lines={[{ dataKey: 'margin', stroke: '#10b981', name: 'Margin %' }]}
                height={200}
              />
              <div className="mt-3 p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{ebitdaMargin[ebitdaMargin.length - 1].margin}%</p>
                <p className="text-[10px] text-green-600">EBITDA Margin Terkini</p>
              </div>
            </div>
          </div>

          {/* Patient Volume + BPJS Mix + BOR by Ward */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Volume Pasien</h3>
                <p className="text-xs text-gray-500 mt-0.5">Rawat Inap · Rawat Jalan · IGD</p>
              </div>
              <RechartsWrapper
                type="line"
                data={patientVolumeTrend}
                xKey="bulan"
                lines={[
                  { dataKey: 'rawatInap', stroke: '#3b82f6', name: 'Rawat Inap' },
                  { dataKey: 'rawatJalan', stroke: '#10b981', name: 'Rawat Jalan' },
                  { dataKey: 'igd', stroke: '#f59e0b', name: 'IGD' },
                ]}
                height={200}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">BPJS vs Non-BPJS Revenue</h3>
                <p className="text-xs text-gray-500 mt-0.5">Komposisi pendapatan per sumber</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={bpjsVsNonBPJS}
                xKey="bulan"
                yKey={['BPJS', 'Non-BPJS']}
                colors={['#06b6d4', '#8b5cf6']}
                height={200}
                radius={[4, 4, 0, 0]}
                tooltipFormatter={(v: number) => fmtRpShort(v)}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Patient Satisfaction Index</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tren kepuasan pasien</p>
              </div>
              <RechartsWrapper
                type="line"
                data={patientSatisfaction}
                xKey="bulan"
                lines={[{ dataKey: 'skor', stroke: '#ec4899', name: 'Satisfaction' }]}
                height={200}
              />
            </div>
          </div>

          {/* Risk Indicators Traffic Light */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">Top 5 Risk Indicators</h3>
              <p className="text-xs text-gray-500 mt-0.5">Status traffic light berdasarkan target KPI rumah sakit</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {riskIndicators.map(r => (
                <div key={r.label} className={`p-3 rounded-xl border ${r.status === 'green' ? 'bg-green-50 border-green-200' : r.status === 'yellow' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${r.status === 'green' ? 'bg-green-500' : r.status === 'yellow' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="text-xs font-semibold text-gray-700">{r.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${r.status === 'green' ? 'text-green-700' : r.status === 'yellow' ? 'text-amber-700' : 'text-red-700'}`}>{r.value}</p>
                  <p className="text-[10px] text-gray-500">Target: {r.target}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Financial & Sustainability ── */}
      {tab === 'financial' && (
        <div className="space-y-5">
          {/* Revenue By Service + Cost Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Revenue by Service Line</h3>
                <p className="text-xs text-gray-500 mt-0.5">IPD, OPD, IGD, MCU, Penunjang (Mar 2026)</p>
              </div>
              <RechartsWrapper
                type="pie"
                data={revenueByService}
                dataKey="value"
                nameKey="service"
                innerRadius={50}
                outerRadius={85}
                colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']}
                height={220}
                tooltipFormatter={(v: number) => fmtRpShort(v)}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Cost Breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">SDM, Obat & BMHP, Alkes, Operasional, Utilitas</p>
              </div>
              <RechartsWrapper
                type="pie"
                data={costBreakdown}
                dataKey="value"
                nameKey="kategori"
                innerRadius={50}
                outerRadius={85}
                colors={['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4']}
                height={220}
                tooltipFormatter={(v: number) => fmtRpShort(v)}
              />
            </div>
          </div>

          {/* Profitability + BPJS Tariff vs Actual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Profitability per Department</h3>
                <p className="text-xs text-gray-500 mt-0.5">Margin (%) per departemen klinik</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={profitByDept}
                xKey="dept"
                yKey="margin"
                colors={['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857', '#065f46', '#064e3b']}
                height={220}
                radius={[4, 4, 0, 0]}
                tooltipFormatter={(v: number) => `${v}%`}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">BPJS Tariff vs Actual Cost</h3>
                <p className="text-xs text-gray-500 mt-0.5">Gap analisis tarif INA-CBG vs biaya riil</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={[
                  ...revenueByService.slice(0, 0), // unused
                ].length === 0 ? [
                  { kategori: 'Bedah Mayor', 'Tarif INA-CBG': 15_000_000, 'Biaya Riil': 18_200_000 },
                  { kategori: 'Bedah Minor', 'Tarif INA-CBG': 6_500_000, 'Biaya Riil': 7_100_000 },
                  { kategori: 'ICU', 'Tarif INA-CBG': 8_000_000, 'Biaya Riil': 9_500_000 },
                  { kategori: 'R.Inap', 'Tarif INA-CBG': 3_200_000, 'Biaya Riil': 3_800_000 },
                  { kategori: 'R.Jalan', 'Tarif INA-CBG': 450_000, 'Biaya Riil': 520_000 },
                ] : []}
                xKey="kategori"
                yKey={['Tarif INA-CBG', 'Biaya Riil']}
                colors={['#3b82f6', '#ef4444']}
                height={220}
                radius={[4, 4, 0, 0]}
                tooltipFormatter={(v: number) => fmtRpShort(v)}
              />
            </div>
          </div>

          {/* Claim Stats */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">Claim Acceptance vs Rejection</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tren klaim BPJS 6 bulan terakhir</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total Diajukan', value: claimOverview.totalSubmitted.toLocaleString('id-ID'), color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Disetujui', value: claimOverview.totalApproved.toLocaleString('id-ID'), color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Ditolak', value: claimOverview.totalRejected.toLocaleString('id-ID'), color: 'text-red-600', bg: 'bg-red-50' },
              ].map(c => (
                <div key={c.label} className={`p-3 rounded-lg ${c.bg} text-center`}>
                  <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-[10px] text-gray-500">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Operational Performance ── */}
      {tab === 'operational' && (
        <div className="space-y-5">
          {/* BOR by Ward + ER Waiting Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">BOR per Bangsal</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tingkat hunian tempat tidur per ruangan</p>
              </div>
              <div className="space-y-3">
                {borByWard.map(w => (
                  <div key={w.ward}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{w.ward}</span>
                      <span className={`font-semibold ${w.bor > 85 ? 'text-red-600' : w.bor >= 75 ? 'text-green-600' : 'text-amber-600'}`}>{w.bor}%</span>
                    </div>
                    <MiniBar value={w.bor} total={100} color={w.bor > 85 ? 'bg-red-500' : w.bor >= 75 ? 'bg-green-500' : 'bg-amber-500'} />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Waktu Tunggu per Unit (menit)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Rata-rata waiting time Maret 2026</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={waitingTimeByUnit}
                xKey="unit"
                yKey="menit"
                colors={['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#fffbeb']}
                height={220}
                radius={[4, 4, 0, 0]}
                tooltipFormatter={(v: number) => `${v} menit`}
              />
            </div>
          </div>

          {/* OR Utilization + Doctor Productivity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Surgery Utilization Rate</h3>
                <p className="text-xs text-gray-500 mt-0.5">Utilisasi kamar operasi (%)</p>
              </div>
              <RechartsWrapper
                type="line"
                data={orUtilization}
                xKey="bulan"
                lines={[{ dataKey: 'persen', stroke: '#8b5cf6', name: 'Utilisasi %' }]}
                height={200}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Doctor Productivity</h3>
                <p className="text-xs text-gray-500 mt-0.5">Jumlah pasien & prosedur per dokter (Mar 2026)</p>
              </div>
              <div className="space-y-2.5">
                {doctorProductivity.map(d => (
                  <div key={d.nama} className="p-2.5 bg-gray-50 rounded-lg flex items-center gap-3">
                    <Stethoscope className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{d.nama}</p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-sm font-bold text-blue-600">{d.pasien}</p>
                        <p className="text-[9px] text-gray-400">Pasien</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-purple-600">{d.prosedur}</p>
                        <p className="text-[9px] text-gray-400">Prosedur</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Queue vs Capacity */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">Volume Pasien – Outpatient & Inpatient Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">6 bulan terakhir · Rawat Inap, Rawat Jalan, IGD</p>
            </div>
            <RechartsWrapper
              type="line"
              data={patientVolumeTrend}
              xKey="bulan"
              lines={[
                { dataKey: 'rawatInap', stroke: '#3b82f6', name: 'Rawat Inap' },
                { dataKey: 'rawatJalan', stroke: '#10b981', name: 'Rawat Jalan' },
                { dataKey: 'igd', stroke: '#f59e0b', name: 'IGD' },
              ]}
              height={240}
            />
          </div>
        </div>
      )}

      {/* ── TAB 4: Risk & Compliance ── */}
      {tab === 'risk' && (
        <div className="space-y-5">
          {/* Accreditation + Claim Rejection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Accreditation Compliance Score</h3>
                <p className="text-xs text-gray-500 mt-0.5">Skor per Pokja Akreditasi SNARS</p>
              </div>
              <div className="flex justify-center mb-4">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="absolute inset-0" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle cx="56" cy="56" r="48" fill="none" stroke={accreditationScore.overall >= 85 ? '#10b981' : '#f59e0b'} strokeWidth="8"
                      strokeDasharray={`${accreditationScore.overall * 3.01} 999`} strokeLinecap="round" transform="rotate(-90 56 56)" />
                  </svg>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{accreditationScore.overall}</p>
                    <p className="text-[9px] text-gray-400">Overall</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {accreditationScore.pokja.map(p => (
                  <div key={p.nama}>
                    <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                      <span>{p.nama}</span>
                      <span className="font-semibold">{p.skor}</span>
                    </div>
                    <MiniBar value={p.skor} total={100} color={p.skor >= 90 ? 'bg-green-500' : p.skor >= 80 ? 'bg-blue-500' : 'bg-amber-500'} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">BPJS Claim Rejection Rate</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tingkat penolakan klaim per bulan</p>
              </div>
              <RechartsWrapper
                type="bar"
                data={[
                  { bulan: 'Okt 25', rate: 10.0 },
                  { bulan: 'Nov 25', rate: 10.1 },
                  { bulan: 'Des 25', rate: 10.9 },
                  { bulan: 'Jan 26', rate: 10.3 },
                  { bulan: 'Feb 26', rate: 10.4 },
                  { bulan: 'Mar 26', rate: 9.6 },
                ]}
                xKey="bulan"
                yKey="rate"
                colors={['#ef4444']}
                height={200}
                radius={[4, 4, 0, 0]}
                tooltipFormatter={(v: number) => `${v}%`}
              />
              <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700"><strong>Target:</strong> Rejection rate &lt; 8%. Perlu perbaikan pada kode diagnosis dan kelengkapan dokumen.</p>
              </div>
            </div>
          </div>

          {/* Incident Trend + Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Incident & Adverse Event Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5">Sentinel, KTD, KNC, KPC (6 bulan)</p>
              </div>
              <RechartsWrapper
                type="line"
                data={incidentTrend}
                xKey="bulan"
                lines={[
                  { dataKey: 'sentinel', stroke: '#ef4444', name: 'Sentinel' },
                  { dataKey: 'ktd', stroke: '#f59e0b', name: 'KTD' },
                  { dataKey: 'knc', stroke: '#3b82f6', name: 'KNC' },
                  { dataKey: 'kpc', stroke: '#8b5cf6', name: 'KPC' },
                ]}
                height={220}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Audit Findings Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">Status temuan audit internal & eksternal</p>
              </div>
              <div className="space-y-3 mb-4">
                {auditFindings.map(a => (
                  <div key={a.kategori} className={`p-3 rounded-lg flex items-center justify-between ${a.severity === 'high' ? 'bg-red-50' : a.severity === 'medium' ? 'bg-amber-50' : 'bg-green-50'}`}>
                    <span className="text-xs text-gray-700">{a.kategori}</span>
                    <span className={`text-lg font-bold ${a.severity === 'high' ? 'text-red-600' : a.severity === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>{a.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Risk Register</h4>
                <div className="space-y-2">
                  {riskHeatmap.slice(0, 4).map(r => (
                    <div key={r.risk} className={`p-2.5 rounded-lg border text-xs ${r.level === 'Tinggi' ? 'bg-red-50 border-red-200' : r.level === 'Sedang' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 flex-1">{r.risk}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.level === 'Tinggi' ? 'bg-red-100 text-red-700' : r.level === 'Sedang' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{r.level}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">L: {r.likelihood} × I: {r.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}