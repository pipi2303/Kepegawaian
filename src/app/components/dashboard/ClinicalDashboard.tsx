/**
 * ClinicalDashboard.tsx — Medical Director / Clinical Management
 * Tab 1: Clinical Overview | Tab 2: Service Line Performance
 * Tab 3: Doctor & Department | Tab 4: Quality & Safety
 */
import React, { useState } from 'react';
import {
  Stethoscope, Activity, ShieldCheck, Users,
} from 'lucide-react';
import RechartsWrapper from '../RechartsWrapper';
import { TabButton, MiniBar } from '../DashboardWidgets';
import { C, CHART_COLORS } from '../colors';
import {
  clinicalKPI, patientVolumeTrend, topDiagnoses, borByWard,
  doctorProductivity, incidentTrend,
} from '../../data/hospitalDashboardData';

type Tab = 'overview' | 'service' | 'doctor' | 'quality';

export default function ClinicalDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex gap-1 overflow-x-auto">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={Activity} label="Clinical Overview" />
        <TabButton active={tab === 'service'} onClick={() => setTab('service')} icon={Stethoscope} label="Service Line Performance" />
        <TabButton active={tab === 'doctor'} onClick={() => setTab('doctor')} icon={Users} label="Doctor & Department" />
        <TabButton active={tab === 'quality'} onClick={() => setTab('quality')} icon={ShieldCheck} label="Quality & Safety" />
      </div>

      {/* TAB 1 */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'BOR', value: `${clinicalKPI.bor}%`, sub: 'Bed Occupancy', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'ALOS', value: `${clinicalKPI.alos} hari`, sub: 'Avg Length of Stay', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'CMI', value: `${clinicalKPI.caseMixIndex}`, sub: 'Case Mix Index', color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Mortality Rate', value: `${clinicalKPI.mortalityRate}%`, sub: 'NDR: 2.1%, GDR: 3.8%', color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Readmission', value: `${clinicalKPI.readmissionRate}%`, sub: 'Rate (30 hari)', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(k => (
              <div key={k.label} className={`rounded-xl border border-gray-100 shadow-sm p-4 bg-white`}>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs font-medium text-gray-700 mt-1">{k.label}</p>
                <p className="text-[10px] text-gray-400">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Patient Volume Trend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">Patient Volume Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tren volume pasien 6 bulan terakhir</p>
            </div>
            <RechartsWrapper type="line" data={patientVolumeTrend} xKey="bulan" lines={[
              { dataKey: 'rawatInap', stroke: CHART_COLORS[0], name: 'Rawat Inap' },
              { dataKey: 'rawatJalan', stroke: '#10b981', name: 'Rawat Jalan' },
              { dataKey: 'igd', stroke: '#f59e0b', name: 'IGD' },
            ]} height={260} />
          </div>

          {/* BOR & ALOS detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">BOR & ALOS per Bangsal</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tingkat hunian per ruangan</p>
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
                <h3 className="text-gray-800">Indikator Mutu Klinis</h3>
                <p className="text-xs text-gray-500 mt-0.5">Key clinical performance indicators</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'BTO', value: clinicalKPI.bto, sub: 'Bed Turn Over', unit: 'kali', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'TOI', value: clinicalKPI.toi, sub: 'Turn Over Interval', unit: 'hari', color: 'text-teal-600', bg: 'bg-teal-50' },
                  { label: 'NDR', value: `${clinicalKPI.ndr}%`, sub: 'Net Death Rate', unit: '', color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'GDR', value: `${clinicalKPI.gdr}%`, sub: 'Gross Death Rate', unit: '', color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: 'Surgery Success', value: `${clinicalKPI.surgerySuccessRate}%`, sub: 'Tingkat keberhasilan', unit: '', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'ICU Utilization', value: `${clinicalKPI.icuUtilization}%`, sub: 'Utilisasi ICU', unit: '', color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(k => (
                  <div key={k.label} className={`p-3 rounded-lg ${k.bg}`}>
                    <p className={`text-xl font-bold ${k.color}`}>{k.value}{k.unit && ` ${k.unit}`}</p>
                    <p className="text-xs font-medium text-gray-700 mt-0.5">{k.label}</p>
                    <p className="text-[10px] text-gray-400">{k.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {tab === 'service' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Top Diagnoses</h3>
                <p className="text-xs text-gray-500 mt-0.5">10 diagnosa terbanyak (Mar 2026)</p>
              </div>
              <RechartsWrapper type="bar" data={topDiagnoses} xKey="diagnosis" yKey="count" colors={[C.brand, C.brandMid, CHART_COLORS[0], CHART_COLORS[4], C.lemon, '#FFE580', '#FFD84D', '#012B26']} height={240} radius={[4,4,0,0]} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Procedure Volume</h3>
                <p className="text-xs text-gray-500 mt-0.5">Volume prosedur medis per kategori</p>
              </div>
              <RechartsWrapper type="bar" data={[
                { prosedur: 'Bedah Umum', count: 185 },
                { prosedur: 'Orthopedi', count: 142 },
                { prosedur: 'Obgyn', count: 168 },
                { prosedur: 'Kateterisasi', count: 86 },
                { prosedur: 'Endoskopi', count: 124 },
                { prosedur: 'Hemodialisa', count: 312 },
              ]} xKey="prosedur" yKey="count" colors={['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#8b5cf6', '#7c3aed']} height={240} radius={[4,4,0,0]} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Surgery Success Rate</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tingkat keberhasilan per jenis operasi</p>
              </div>
              <div className="space-y-3">
                {[
                  { jenis: 'Bedah Umum', rate: 98.2 },
                  { jenis: 'Bedah Orthopedi', rate: 97.5 },
                  { jenis: 'Bedah Obgyn', rate: 99.1 },
                  { jenis: 'Bedah Saraf', rate: 95.8 },
                  { jenis: 'Bedah Jantung', rate: 96.4 },
                ].map(s => (
                  <div key={s.jenis}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{s.jenis}</span>
                      <span className="font-semibold text-green-600">{s.rate}%</span>
                    </div>
                    <MiniBar value={s.rate} total={100} color="bg-green-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">ICU Utilization</h3>
                <p className="text-xs text-gray-500 mt-0.5">Penggunaan ICU / NICU / HCU</p>
              </div>
              <div className="space-y-4">
                {[
                  { unit: 'ICU Dewasa', kapasitas: 12, terisi: 10 },
                  { unit: 'NICU', kapasitas: 8, terisi: 6 },
                  { unit: 'HCU', kapasitas: 16, terisi: 13 },
                  { unit: 'PICU', kapasitas: 6, terisi: 4 },
                ].map(u => {
                  const pct = Math.round(u.terisi / u.kapasitas * 100);
                  return (
                    <div key={u.unit} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{u.unit}</span>
                        <span className={`font-semibold ${pct > 85 ? 'text-red-600' : 'text-green-600'}`}>{u.terisi}/{u.kapasitas} ({pct}%)</span>
                      </div>
                      <MiniBar value={u.terisi} total={u.kapasitas} color={pct > 85 ? 'bg-red-500' : 'bg-green-500'} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {tab === 'doctor' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">Doctor Workload & Productivity</h3>
              <p className="text-xs text-gray-500 mt-0.5">Jumlah pasien dan prosedur per dokter (Mar 2026)</p>
            </div>
            <RechartsWrapper type="bar" data={doctorProductivity.map(d => ({
              nama: d.nama.split(',')[0],
              Pasien: d.pasien,
              Prosedur: d.prosedur,
            }))} xKey="nama" yKey={['Pasien', 'Prosedur']} colors={[CHART_COLORS[0], '#8b5cf6']} height={260} radius={[4,4,0,0]} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Outcome vs Volume</h3>
                <p className="text-xs text-gray-500 mt-0.5">Korelasi volume & hasil per departemen</p>
              </div>
              <RechartsWrapper type="bar" data={[
                { dept: 'Bedah', volume: 185, successRate: 98 },
                { dept: 'Penyakit Dalam', volume: 420, successRate: 96 },
                { dept: 'Anak', volume: 290, successRate: 97 },
                { dept: 'Obgyn', volume: 168, successRate: 99 },
                { dept: 'Saraf', volume: 142, successRate: 95 },
              ]} xKey="dept" yKey={['volume', 'successRate']} colors={[CHART_COLORS[0], CHART_COLORS[1]]} height={220} radius={[4,4,0,0]} legendFormatter={(v: string) => v === 'successRate' ? 'Success Rate' : 'Volume'} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">LOS per Doctor</h3>
                <p className="text-xs text-gray-500 mt-0.5">Rata-rata lama rawat per DPJP (hari)</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { nama: 'dr. Chandra, Sp.PD', los: 5.2 },
                  { nama: 'dr. Budi, Sp.B', los: 4.8 },
                  { nama: 'dr. Rina S., Sp.OG', los: 3.6 },
                  { nama: 'dr. Ahmad, Sp.A', los: 3.2 },
                  { nama: 'dr. Imam Ghozali, Sp.An.', los: 2.8 },
                  { nama: 'dr. Surya P. Dewi, MARS', los: 4.1 },
                ].map(d => (
                  <div key={d.nama} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <Stethoscope className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 flex-1 truncate">{d.nama}</span>
                    <span className={`text-sm font-bold ${d.los > 5 ? 'text-amber-600' : 'text-green-600'}`}>{d.los} hari</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 */}
      {tab === 'quality' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Incident Reports Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5">Sentinel · KTD · KNC · KPC (6 bulan)</p>
              </div>
              <RechartsWrapper type="line" data={incidentTrend} xKey="bulan" lines={[
                { dataKey: 'sentinel', stroke: '#ef4444', name: 'Sentinel' },
                { dataKey: 'ktd', stroke: '#f59e0b', name: 'KTD' },
                { dataKey: 'knc', stroke: CHART_COLORS[0], name: 'KNC' },
                { dataKey: 'kpc', stroke: '#8b5cf6', name: 'KPC' },
              ]} height={240} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Infection Rate & Medication Error</h3>
                <p className="text-xs text-gray-500 mt-0.5">Indikator patient safety</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'HAIs (Healthcare-Associated Infections)', value: '1.2%', target: '< 2%', status: 'green' },
                  { label: 'Phlebitis Rate', value: '0.8%', target: '< 1.5%', status: 'green' },
                  { label: 'Decubitus Rate', value: '0.5%', target: '< 1%', status: 'green' },
                  { label: 'Medication Error', value: '0.3%', target: '< 0.5%', status: 'green' },
                  { label: 'Surgical Site Infection', value: '1.8%', target: '< 2%', status: 'yellow' },
                  { label: 'Patient Falls', value: '0.4%', target: '< 0.5%', status: 'green' },
                ].map(i => (
                  <div key={i.label} className={`p-3 rounded-lg border ${i.status === 'green' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-700">{i.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${i.status === 'green' ? 'text-green-600' : 'text-amber-600'}`}>{i.value}</span>
                        <span className="text-[9px] text-gray-400">target: {i.target}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">Clinical Pathway Compliance</h3>
              <p className="text-xs text-gray-500 mt-0.5">Kepatuhan terhadap clinical pathway per departemen</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { dept: 'Penyakit Dalam', compliance: 92 },
                { dept: 'Bedah', compliance: 88 },
                { dept: 'Anak', compliance: 94 },
                { dept: 'Obgyn', compliance: 91 },
                { dept: 'Saraf', compliance: 86 },
                { dept: 'Jantung', compliance: 89 },
                { dept: 'THT', compliance: 93 },
                { dept: 'Mata', compliance: 95 },
              ].map(d => (
                <div key={d.dept} className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className={`text-2xl font-bold ${d.compliance >= 90 ? 'text-green-600' : 'text-amber-600'}`}>{d.compliance}%</p>
                  <p className="text-xs text-gray-600 mt-1">{d.dept}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}