/**
 * FinanceDashboard.tsx — Finance Director / Accounting: Hospital Financial Control
 * Tab 1: Financial Overview | Tab 2: BPJS Financial Analytics
 * Tab 3: Cost & Margin | Tab 4: Forecast & Scenario
 */
import React, { useState } from 'react';
import {
  DollarSign, TrendingUp, ChartPie, ChartLine,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import RechartsWrapper from '../RechartsWrapper';
import { TabButton, MiniBar } from '../DashboardWidgets';
import { C, CHART_COLORS } from '../colors';
import {
  revenueVsCost, bpjsVsNonBPJS, cashFlowData,
  claimTrend, claimAgingBuckets, rejectionReasons, claimOverview,
  costBreakdown, costPerPatient, profitByDept, revenueByService,
  fmtRpShort,
} from '../../data/hospitalDashboardData';

type Tab = 'overview' | 'bpjs' | 'cost' | 'forecast';

export default function FinanceDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

  const latestRev = revenueVsCost[revenueVsCost.length - 1];
  const prevRev = revenueVsCost[revenueVsCost.length - 2];
  const revGrowth = ((latestRev.revenue - prevRev.revenue) / prevRev.revenue * 100).toFixed(1);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex gap-1 overflow-x-auto">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={DollarSign} label="Financial Overview" />
        <TabButton active={tab === 'bpjs'} onClick={() => setTab('bpjs')} icon={ChartPie} label="BPJS Financial Analytics" />
        <TabButton active={tab === 'cost'} onClick={() => setTab('cost')} icon={ChartLine} label="Cost & Margin" />
        <TabButton active={tab === 'forecast'} onClick={() => setTab('forecast')} icon={TrendingUp} label="Forecast & Scenario" />
      </div>

      {/* TAB 1 */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Revenue Mar 2026', value: fmtRpShort(latestRev.revenue), delta: `+${revGrowth}%`, up: true, bg: 'bg-blue-50', color: 'text-blue-600' },
              { label: 'Expense Mar 2026', value: fmtRpShort(latestRev.cost), delta: '', up: false, bg: 'bg-red-50', color: 'text-red-600' },
              { label: 'Cash Flow Netto', value: fmtRpShort(cashFlowData[5].cashIn - cashFlowData[5].cashOut), delta: 'Surplus', up: true, bg: 'bg-green-50', color: 'text-green-600' },
              { label: 'BPJS Pending', value: fmtRpShort(claimOverview.pendingAmount), delta: `${claimOverview.avgDaysToPayment} hari avg`, up: false, bg: 'bg-amber-50', color: 'text-amber-600' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                {k.delta && (
                  <div className="flex items-center gap-1 mt-1">
                    {k.up ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-amber-500" />}
                    <span className={`text-[11px] font-medium ${k.up ? 'text-green-600' : 'text-amber-600'}`}>{k.delta}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Revenue vs Expense + Cash In/Out */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Revenue vs Expense</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tren pendapatan vs pengeluaran 6 bulan</p>
              </div>
              <RechartsWrapper type="bar" data={revenueVsCost} xKey="bulan" yKey={['revenue', 'cost']} colors={[CHART_COLORS[0], '#f87171']} height={220} radius={[4,4,0,0]} tooltipFormatter={(v: number) => fmtRpShort(v)} legendFormatter={(v: string) => v === 'revenue' ? 'Revenue' : 'Cost'} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Cash In / Cash Out</h3>
                <p className="text-xs text-gray-500 mt-0.5">Arus kas masuk vs keluar</p>
              </div>
              <RechartsWrapper type="line" data={cashFlowData} xKey="bulan" lines={[{ dataKey: 'cashIn', stroke: '#10b981', name: 'Cash In' }, { dataKey: 'cashOut', stroke: '#ef4444', name: 'Cash Out' }]} height={220} />
            </div>
          </div>

          {/* BPJS vs Private + Claim Aging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">BPJS vs Private Revenue</h3>
                <p className="text-xs text-gray-500 mt-0.5">Komposisi sumber pendapatan</p>
              </div>
              <RechartsWrapper type="bar" data={bpjsVsNonBPJS} xKey="bulan" yKey={['BPJS', 'Non-BPJS']} colors={['#06b6d4', '#8b5cf6']} height={200} radius={[4,4,0,0]} tooltipFormatter={(v: number) => fmtRpShort(v)} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Claim Aging Buckets</h3>
                <p className="text-xs text-gray-500 mt-0.5">Piutang BPJS berdasarkan umur</p>
              </div>
              <div className="space-y-3">
                {claimAgingBuckets.map(b => (
                  <div key={b.bucket} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 font-medium">{b.bucket}</span>
                      <span className="text-gray-500">{b.count.toLocaleString('id-ID')} klaim</span>
                    </div>
                    <p className="text-sm font-bold text-blue-600">{fmtRpShort(b.amount)}</p>
                    <MiniBar value={b.amount} total={claimAgingBuckets[0].amount * 1.5} color="bg-blue-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {tab === 'bpjs' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Claim Submitted vs Approved vs Rejected</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tren volume klaim BPJS</p>
              </div>
              <RechartsWrapper type="line" data={claimTrend} xKey="bulan" lines={[
                { dataKey: 'submitted', stroke: CHART_COLORS[0], name: 'Submitted' },
                { dataKey: 'approved', stroke: '#10b981', name: 'Approved' },
                { dataKey: 'rejected', stroke: '#ef4444', name: 'Rejected' },
              ]} height={240} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Rejection Reason (Pareto)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Alasan penolakan klaim terbanyak</p>
              </div>
              <RechartsWrapper type="bar" data={rejectionReasons} xKey="reason" yKey="count" colors={['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2']} height={240} radius={[4,4,0,0]} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Average Days to Payment</h3>
                <p className="text-xs text-gray-500 mt-0.5">Rata-rata waktu pembayaran klaim BPJS</p>
              </div>
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <p className="text-5xl font-bold text-amber-600">{claimOverview.avgDaysToPayment}</p>
                  <p className="text-sm text-gray-500 mt-2">Hari rata-rata</p>
                  <p className="text-xs text-gray-400 mt-1">Target: &lt; 30 hari</p>
                  <div className="mt-3 inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    Melebihi target 12 hari
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">INA-CBG Tariff Gap Analysis</h3>
                <p className="text-xs text-gray-500 mt-0.5">Selisih tarif INA-CBG vs biaya riil</p>
              </div>
              <RechartsWrapper type="bar" data={[
                { kategori: 'Bedah Mayor', 'Tarif': 15, 'Biaya': 18.2 },
                { kategori: 'Bedah Minor', 'Tarif': 6.5, 'Biaya': 7.1 },
                { kategori: 'ICU', 'Tarif': 8, 'Biaya': 9.5 },
                { kategori: 'R. Inap', 'Tarif': 3.2, 'Biaya': 3.8 },
                { kategori: 'R. Jalan', 'Tarif': 0.45, 'Biaya': 0.52 },
              ]} xKey="kategori" yKey={['Tarif', 'Biaya']} colors={[CHART_COLORS[0], '#ef4444']} height={220} radius={[4,4,0,0]} tooltipFormatter={(v: number) => `Rp ${v} Jt`} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {tab === 'cost' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Cost per Patient Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5">Rata-rata biaya per pasien (6 bulan)</p>
              </div>
              <RechartsWrapper type="line" data={costPerPatient} xKey="bulan" lines={[{ dataKey: 'biaya', stroke: '#ef4444', name: 'Biaya/Pasien' }]} height={220} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Cost Breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">Struktur biaya rumah sakit</p>
              </div>
              <RechartsWrapper type="pie" data={costBreakdown} dataKey="value" nameKey="kategori" innerRadius={50} outerRadius={85} colors={['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4']} height={220} tooltipFormatter={(v: number) => fmtRpShort(v)} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Margin per Service Line</h3>
                <p className="text-xs text-gray-500 mt-0.5">Profitabilitas per departemen (%)</p>
              </div>
              <RechartsWrapper type="bar" data={profitByDept} xKey="dept" yKey="margin" colors={['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857', '#065f46', '#064e3b']} height={220} radius={[4,4,0,0]} tooltipFormatter={(v: number) => `${v}%`} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Revenue by Service Line</h3>
                <p className="text-xs text-gray-500 mt-0.5">Kontribusi pendapatan per layanan</p>
              </div>
              <RechartsWrapper type="pie" data={revenueByService} dataKey="value" nameKey="service" innerRadius={50} outerRadius={85} colors={[CHART_COLORS[0], CHART_COLORS[1], CHART_COLORS[3], CHART_COLORS[2], CHART_COLORS[4]]} height={220} tooltipFormatter={(v: number) => fmtRpShort(v)} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 */}
      {tab === 'forecast' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Revenue Forecast Q2 2026</h3>
                <p className="text-xs text-gray-500 mt-0.5">Proyeksi pendapatan berdasarkan tren historis</p>
              </div>
              <RechartsWrapper type="line" data={[
                ...revenueVsCost,
                { bulan: 'Apr 26*', revenue: 32_500_000_000, cost: 26_800_000_000 },
                { bulan: 'Mei 26*', revenue: 33_200_000_000, cost: 27_100_000_000 },
                { bulan: 'Jun 26*', revenue: 34_000_000_000, cost: 27_500_000_000 },
              ]} xKey="bulan" lines={[
                { dataKey: 'revenue', stroke: CHART_COLORS[0], name: 'Revenue' },
                { dataKey: 'cost', stroke: '#ef4444', name: 'Cost' },
              ]} height={260} />
              <p className="text-[10px] text-gray-400 mt-2 text-center">* Proyeksi berdasarkan rata-rata pertumbuhan 3 bulan terakhir</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Cash Flow Projection</h3>
                <p className="text-xs text-gray-500 mt-0.5">Proyeksi arus kas Q2 2026</p>
              </div>
              <RechartsWrapper type="line" data={[
                ...cashFlowData,
                { bulan: 'Apr 26*', cashIn: 30_200_000_000, cashOut: 26_200_000_000 },
                { bulan: 'Mei 26*', cashIn: 31_000_000_000, cashOut: 26_800_000_000 },
                { bulan: 'Jun 26*', cashIn: 31_800_000_000, cashOut: 27_200_000_000 },
              ]} xKey="bulan" lines={[
                { dataKey: 'cashIn', stroke: '#10b981', name: 'Cash In' },
                { dataKey: 'cashOut', stroke: '#ef4444', name: 'Cash Out' },
              ]} height={260} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">BPJS Delay Impact Simulation</h3>
              <p className="text-xs text-gray-500 mt-0.5">Dampak keterlambatan pembayaran BPJS terhadap cash flow</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { scenario: 'Optimis (30 hari)', cashGap: 2_100_000_000, impact: 'Minimal', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
                { scenario: 'Normal (45 hari)', cashGap: 4_200_000_000, impact: 'Moderat', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
                { scenario: 'Pesimis (90 hari)', cashGap: 8_450_000_000, impact: 'Signifikan', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
              ].map(s => (
                <div key={s.scenario} className={`p-4 rounded-xl border ${s.color}`}>
                  <p className="text-xs font-semibold text-gray-700 mb-2">{s.scenario}</p>
                  <p className={`text-2xl font-bold ${s.textColor}`}>{fmtRpShort(s.cashGap)}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Gap Kas Potensial</p>
                  <div className="mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.color} ${s.textColor}`}>{s.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}