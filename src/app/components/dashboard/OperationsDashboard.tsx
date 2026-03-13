/**
 * OperationsDashboard.tsx — Operations Manager: Hospital Operations Control Tower
 * Tab 1: Operations Overview | Tab 2: Capacity & Utilization
 * Tab 3: Bottleneck Analysis | Tab 4: Simulation
 */
import React, { useState } from 'react';
import {
  Activity, AlertTriangle, Gauge, Bed,
} from 'lucide-react';
import RechartsWrapper from '../RechartsWrapper';
import { TabButton, MiniBar } from '../DashboardWidgets';
import {
  patientJourneyFunnel, waitingTimeByUnit, borByWard,
  orUtilization, equipmentUsage, labTurnaroundTime,
  dischargeDelayCauses, clinicalKPI,
} from '../../data/hospitalDashboardData';
import OperationsSimulation from './OperationsSimulation';

type Tab = 'overview' | 'capacity' | 'bottleneck' | 'simulation';

export default function OperationsDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex gap-1 overflow-x-auto">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={Activity} label="Operations Overview" />
        <TabButton active={tab === 'capacity'} onClick={() => setTab('capacity')} icon={Bed} label="Capacity & Utilization" />
        <TabButton active={tab === 'bottleneck'} onClick={() => setTab('bottleneck')} icon={AlertTriangle} label="Bottleneck Analysis" />
        <TabButton active={tab === 'simulation'} onClick={() => setTab('simulation')} icon={Gauge} label="Simulation" />
      </div>

      {/* TAB 1 */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Patient Journey Funnel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">Patient Journey Funnel</h3>
              <p className="text-xs text-gray-500 mt-0.5">Registrasi IGD → Triase → Pemeriksaan → Rawat Inap → Discharge</p>
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-3">
              {patientJourneyFunnel.map((s, i) => {
                const maxCount = patientJourneyFunnel[0].count;
                const widthPct = Math.max(40, (s.count / maxCount) * 100);
                return (
                  <div key={s.stage} className="flex-1 w-full lg:w-auto">
                    <div className="relative">
                      <div
                        className={`mx-auto rounded-xl p-3 text-center transition-all ${
                          i === 0 ? 'bg-blue-100' : i === 1 ? 'bg-blue-200' : i === 2 ? 'bg-blue-300' : i === 3 ? 'bg-blue-400' : 'bg-blue-500'
                        }`}
                        style={{ width: `${widthPct}%`, minWidth: '80px' }}
                      >
                        <p className={`text-lg font-bold ${i >= 3 ? 'text-white' : 'text-blue-800'}`}>{s.count.toLocaleString('id-ID')}</p>
                        <p className={`text-[10px] ${i >= 3 ? 'text-blue-100' : 'text-blue-600'}`}>{s.stage}</p>
                      </div>
                    </div>
                    {i < patientJourneyFunnel.length - 1 && (
                      <div className="text-center text-gray-300 text-lg lg:hidden my-1">↓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waiting Time + Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Waiting Time per Unit</h3>
                <p className="text-xs text-gray-500 mt-0.5">Rata-rata waktu tunggu (menit)</p>
              </div>
              <RechartsWrapper type="bar" data={waitingTimeByUnit} xKey="unit" yKey="menit" colors={['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#fffbeb']} height={220} radius={[4,4,0,0]} tooltipFormatter={(v: number) => `${v} menit`} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">BOR Heatmap per Bangsal</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tingkat hunian tempat tidur</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {borByWard.map(w => {
                  const bgColor = w.bor > 90 ? 'bg-red-500' : w.bor > 80 ? 'bg-orange-500' : w.bor > 70 ? 'bg-yellow-500' : 'bg-green-500';
                  const textColor = w.bor > 70 ? 'text-white' : 'text-gray-800';
                  return (
                    <div key={w.ward} className={`${bgColor} rounded-lg p-3 text-center`}>
                      <p className={`text-lg font-bold ${textColor}`}>{w.bor}%</p>
                      <p className={`text-[10px] ${w.bor > 70 ? 'text-white/80' : 'text-gray-600'}`}>{w.ward}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Queue Length Trend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">Queue Length Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tren antrian per unit (6 bulan)</p>
            </div>
            <RechartsWrapper type="line" data={[
              { bulan: 'Okt 25', poliUmum: 42, poliSpesialis: 58, igd: 12 },
              { bulan: 'Nov 25', poliUmum: 38, poliSpesialis: 55, igd: 14 },
              { bulan: 'Des 25', poliUmum: 45, poliSpesialis: 62, igd: 16 },
              { bulan: 'Jan 26', poliUmum: 40, poliSpesialis: 52, igd: 11 },
              { bulan: 'Feb 26', poliUmum: 43, poliSpesialis: 56, igd: 13 },
              { bulan: 'Mar 26', poliUmum: 41, poliSpesialis: 54, igd: 12 },
            ]} xKey="bulan" lines={[
              { dataKey: 'poliUmum', stroke: '#3b82f6', name: 'Poli Umum' },
              { dataKey: 'poliSpesialis', stroke: '#ef4444', name: 'Poli Spesialis' },
              { dataKey: 'igd', stroke: '#f59e0b', name: 'IGD' },
            ]} height={220} />
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {tab === 'capacity' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Bed Utilization by Ward</h3>
                <p className="text-xs text-gray-500 mt-0.5">Kapasitas dan penggunaan TT</p>
              </div>
              <div className="space-y-3">
                {[
                  { ward: 'Kelas III', total: 120, terisi: 110 },
                  { ward: 'Kelas II', total: 80, terisi: 68 },
                  { ward: 'Kelas I', total: 40, terisi: 32 },
                  { ward: 'VIP', total: 20, terisi: 13 },
                  { ward: 'ICU', total: 12, terisi: 10 },
                  { ward: 'NICU', total: 8, terisi: 6 },
                ].map(w => {
                  const pct = Math.round(w.terisi / w.total * 100);
                  return (
                    <div key={w.ward}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{w.ward} ({w.terisi}/{w.total})</span>
                        <span className={`font-semibold ${pct > 90 ? 'text-red-600' : pct > 80 ? 'text-amber-600' : 'text-green-600'}`}>{pct}%</span>
                      </div>
                      <MiniBar value={w.terisi} total={w.total} color={pct > 90 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">OR Utilization Rate</h3>
                <p className="text-xs text-gray-500 mt-0.5">Utilisasi kamar operasi per bulan</p>
              </div>
              <RechartsWrapper type="line" data={orUtilization} xKey="bulan" lines={[{ dataKey: 'persen', stroke: '#8b5cf6', name: 'Utilisasi %' }]} height={200} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Diagnostic Equipment Usage</h3>
                <p className="text-xs text-gray-500 mt-0.5">Utilisasi alat diagnostik (%)</p>
              </div>
              <div className="space-y-3">
                {equipmentUsage.map(e => (
                  <div key={e.alat}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{e.alat}</span>
                      <span className="font-semibold text-blue-600">{e.persen}%</span>
                    </div>
                    <MiniBar value={e.persen} total={100} color="bg-blue-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Staff-to-Patient Ratio</h3>
                <p className="text-xs text-gray-500 mt-0.5">Rasio tenaga per pasien</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: 'Dokter Spesialis', ratio: '1:15', status: 'green' },
                  { role: 'Dokter Umum', ratio: '1:25', status: 'green' },
                  { role: 'Perawat', ratio: '1:6', status: 'green' },
                  { role: 'Bidan', ratio: '1:8', status: 'green' },
                  { role: 'Farmasi', ratio: '1:30', status: 'yellow' },
                  { role: 'Radiografer', ratio: '1:45', status: 'yellow' },
                ].map(r => (
                  <div key={r.role} className={`p-3 rounded-lg ${r.status === 'green' ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <p className={`text-xl font-bold ${r.status === 'green' ? 'text-green-600' : 'text-amber-600'}`}>{r.ratio}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{r.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {tab === 'bottleneck' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">ER Triage Delay</h3>
                <p className="text-xs text-gray-500 mt-0.5">Waktu tunggu triase IGD (menit)</p>
              </div>
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <p className="text-5xl font-bold text-amber-600">{clinicalKPI.erWaitingTime}</p>
                  <p className="text-sm text-gray-500 mt-2">Menit rata-rata</p>
                  <p className="text-xs text-gray-400 mt-1">Target: &lt; 15 menit</p>
                  <div className="mt-3 inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    3 menit di atas target
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Lab Turnaround Time</h3>
                <p className="text-xs text-gray-500 mt-0.5">Target vs Actual (menit)</p>
              </div>
              <RechartsWrapper type="bar" data={labTurnaroundTime.filter(l => l.target <= 300)} xKey="jenis" yKey={['target', 'actual']} colors={['#3b82f6', '#f59e0b']} height={200} radius={[4,4,0,0]} tooltipFormatter={(v: number) => `${v} mnt`} legendFormatter={(v: string) => v === 'target' ? 'Target' : 'Actual'} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Discharge Delay Causes</h3>
                <p className="text-xs text-gray-500 mt-0.5">Penyebab keterlambatan discharge</p>
              </div>
              <RechartsWrapper type="bar" data={dischargeDelayCauses} xKey="cause" yKey="count" colors={['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2']} height={220} radius={[4,4,0,0]} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Radiology SLA Compliance</h3>
                <p className="text-xs text-gray-500 mt-0.5">Kepatuhan waktu penyelesaian radiologi</p>
              </div>
              <div className="space-y-3">
                {[
                  { jenis: 'Rontgen', sla: '30 mnt', actual: '22 mnt', pct: 95, status: 'green' },
                  { jenis: 'CT-Scan', sla: '60 mnt', actual: '48 mnt', pct: 92, status: 'green' },
                  { jenis: 'MRI', sla: '90 mnt', actual: '82 mnt', pct: 88, status: 'yellow' },
                  { jenis: 'USG', sla: '30 mnt', actual: '25 mnt', pct: 96, status: 'green' },
                ].map(r => (
                  <div key={r.jenis} className={`p-3 rounded-lg border ${r.status === 'green' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">{r.jenis}</span>
                      <span className={`text-sm font-bold ${r.status === 'green' ? 'text-green-600' : 'text-amber-600'}`}>{r.pct}%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">SLA: {r.sla} · Actual: {r.actual}</p>
                    <MiniBar value={r.pct} total={100} color={r.status === 'green' ? 'bg-green-500' : 'bg-amber-500'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 */}
      {tab === 'simulation' && <OperationsSimulation />}
    </div>
  );
}