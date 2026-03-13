/**
 * BPJSCasemixDashboard.tsx — BPJS / Casemix Team: BPJS & Casemix Control
 * Tab 1: Claim Overview | Tab 2: Rejection Analytics
 * Tab 3: Coding & Documentation | Tab 4: Financial Impact
 */
import React, { useState } from 'react';
import {
  FileText, AlertTriangle, Code, DollarSign,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import RechartsWrapper from '../RechartsWrapper';
import { TabButton, MiniBar } from '../DashboardWidgets';
import {
  claimOverview, claimTrend, claimAgingBuckets,
  rejectionReasons, codingAccuracy, missingDocRate,
  fmtRpShort,
} from '../../data/hospitalDashboardData';

type Tab = 'overview' | 'rejection' | 'coding' | 'impact';

export default function BPJSCasemixDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex gap-1 overflow-x-auto">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={FileText} label="Claim Overview" />
        <TabButton active={tab === 'rejection'} onClick={() => setTab('rejection')} icon={AlertTriangle} label="Rejection Analytics" />
        <TabButton active={tab === 'coding'} onClick={() => setTab('coding')} icon={Code} label="Coding & Documentation" />
        <TabButton active={tab === 'impact'} onClick={() => setTab('impact')} icon={DollarSign} label="Financial Impact" />
      </div>

      {/* TAB 1 */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Klaim', value: claimOverview.totalSubmitted.toLocaleString('id-ID'), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Acceptance Rate', value: `${claimOverview.acceptanceRate}%`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Pending', value: fmtRpShort(claimOverview.pendingAmount), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Avg Days to Pay', value: `${claimOverview.avgDaysToPayment} hari`, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <k.icon className={`w-4 h-4 ${k.color}`} />
                  </div>
                </div>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Claim Volume + Aging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Claim Volume Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5">Submitted vs Approved vs Rejected (6 bulan)</p>
              </div>
              <RechartsWrapper type="line" data={claimTrend} xKey="bulan" lines={[
                { dataKey: 'submitted', stroke: '#3b82f6', name: 'Submitted' },
                { dataKey: 'approved', stroke: '#10b981', name: 'Approved' },
                { dataKey: 'rejected', stroke: '#ef4444', name: 'Rejected' },
              ]} height={240} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Claim Aging</h3>
                <p className="text-xs text-gray-500 mt-0.5">Piutang BPJS berdasarkan umur klaim</p>
              </div>
              <div className="space-y-3">
                {claimAgingBuckets.map(b => (
                  <div key={b.bucket} className={`p-3 rounded-lg ${b.bucket.includes('> 90') ? 'bg-red-50' : b.bucket.includes('61') ? 'bg-amber-50' : 'bg-gray-50'}`}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{b.bucket}</span>
                      <span className="text-gray-500">{b.count.toLocaleString('id-ID')} klaim</span>
                    </div>
                    <p className="text-sm font-bold text-blue-600">{fmtRpShort(b.amount)}</p>
                    <MiniBar value={b.count} total={claimAgingBuckets[0].count} color={b.bucket.includes('> 90') ? 'bg-red-500' : b.bucket.includes('61') ? 'bg-amber-500' : 'bg-blue-500'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {tab === 'rejection' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Rejection by Reason (Pareto)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Distribusi alasan penolakan klaim</p>
              </div>
              <RechartsWrapper type="bar" data={rejectionReasons} xKey="reason" yKey="count" colors={['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2']} height={260} radius={[4,4,0,0]} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Rejection by Doctor</h3>
                <p className="text-xs text-gray-500 mt-0.5">DPJP dengan rejection rate tertinggi</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { nama: 'dr. A (Sp.PD)', rejected: 28, total: 186, rate: 15.1 },
                  { nama: 'dr. B (Sp.B)', rejected: 18, total: 142, rate: 12.7 },
                  { nama: 'dr. C (Sp.OG)', rejected: 14, total: 164, rate: 8.5 },
                  { nama: 'dr. D (Sp.An.)', rejected: 12, total: 148, rate: 8.1 },
                  { nama: 'dr. E (Sp.A)', rejected: 10, total: 178, rate: 5.6 },
                ].map(d => (
                  <div key={d.nama} className="p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">{d.nama}</span>
                      <span className={`text-xs font-bold ${d.rate > 10 ? 'text-red-600' : 'text-amber-600'}`}>{d.rate}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>{d.rejected} ditolak dari {d.total} klaim</span>
                    </div>
                    <MiniBar value={d.rejected} total={d.total} color={d.rate > 10 ? 'bg-red-500' : 'bg-amber-500'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Rejection by Diagnosis</h3>
                <p className="text-xs text-gray-500 mt-0.5">Diagnosis dengan rejection rate tertinggi</p>
              </div>
              <RechartsWrapper type="bar" data={[
                { diagnosis: 'Stroke', rejected: 32 },
                { diagnosis: 'CHF', rejected: 28 },
                { diagnosis: 'DM Komplikasi', rejected: 24 },
                { diagnosis: 'CKD', rejected: 18 },
                { diagnosis: 'Pneumonia', rejected: 15 },
              ]} xKey="diagnosis" yKey="rejected" colors={['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2']} height={200} radius={[4,4,0,0]} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Rejection Trend Over Time</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tren rejection rate per bulan</p>
              </div>
              <RechartsWrapper type="line" data={claimTrend.map(c => ({
                bulan: c.bulan,
                rate: Number((c.rejected / c.submitted * 100).toFixed(1)),
              }))} xKey="bulan" lines={[{ dataKey: 'rate', stroke: '#ef4444', name: 'Rejection Rate (%)' }]} height={200} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {tab === 'coding' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Coding Accuracy Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5">Akurasi kode diagnosis ICD-10 per bulan</p>
              </div>
              <RechartsWrapper type="line" data={codingAccuracy.byMonth} xKey="bulan" lines={[{ dataKey: 'akurasi', stroke: '#10b981', name: 'Akurasi (%)' }]} height={220} />
              <div className="mt-3 p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{codingAccuracy.overall}%</p>
                <p className="text-[10px] text-green-600">Overall Coding Accuracy</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Missing Document Rate</h3>
                <p className="text-xs text-gray-500 mt-0.5">Persentase dokumen tidak lengkap per jenis</p>
              </div>
              <div className="space-y-3">
                {missingDocRate.map(d => (
                  <div key={d.jenis}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{d.jenis}</span>
                      <span className={`font-semibold ${d.persen > 5 ? 'text-red-600' : 'text-amber-600'}`}>{d.persen}%</span>
                    </div>
                    <MiniBar value={d.persen} total={15} color={d.persen > 5 ? 'bg-red-500' : 'bg-amber-500'} />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700"><strong>Resume Medis</strong> menjadi dokumen dengan tingkat ketidaklengkapan tertinggi (8.2%). Perlu perbaikan SOP penulisan.</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">DRG Drift Detection</h3>
              <p className="text-xs text-gray-500 mt-0.5">Kasus dengan perbedaan signifikan antara DRG awal dan akhir</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {[
                { label: 'Upcoding Terdeteksi', value: 12, desc: 'Klaim dengan kode lebih tinggi dari seharusnya', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                { label: 'Downcoding Terdeteksi', value: 28, desc: 'Klaim dengan kode lebih rendah (revenue loss)', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                { label: 'Akurat', value: 398, desc: 'Klaim dengan kode DRG sesuai', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
              ].map(d => (
                <div key={d.label} className={`p-4 rounded-xl border ${d.bg} ${d.border}`}>
                  <p className={`text-3xl font-bold ${d.color}`}>{d.value}</p>
                  <p className="text-xs font-medium text-gray-700 mt-1">{d.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 */}
      {tab === 'impact' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              { label: 'Revenue Loss (Rejection)', value: fmtRpShort(2_180_000_000), desc: 'Total potensi pendapatan hilang akibat rejection', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Correction Success', value: '64.2%', desc: 'Klaim yang berhasil dikoreksi dan disetujui ulang', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
              { label: 'Tariff Leakage', value: fmtRpShort(1_450_000_000), desc: 'Selisih negatif tarif INA-CBG vs biaya riil', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
            ].map(d => (
              <div key={d.label} className={`p-5 rounded-xl border ${d.bg} ${d.border}`}>
                <p className={`text-3xl font-bold ${d.color}`}>{d.value}</p>
                <p className="text-sm font-medium text-gray-700 mt-2">{d.label}</p>
                <p className="text-xs text-gray-400 mt-1">{d.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Revenue Loss by Rejection Reason</h3>
                <p className="text-xs text-gray-500 mt-0.5">Estimasi kerugian per alasan penolakan</p>
              </div>
              <RechartsWrapper type="bar" data={[
                { reason: 'Kode Salah', loss: 680_000_000 },
                { reason: 'Dok. Tidak Lengkap', loss: 520_000_000 },
                { reason: 'Duplikasi', loss: 380_000_000 },
                { reason: 'Melebihi Tarif', loss: 340_000_000 },
                { reason: 'Tidak Dijamin', loss: 260_000_000 },
              ]} xKey="reason" yKey="loss" colors={['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2']} height={220} radius={[4,4,0,0]} tooltipFormatter={(v: number) => fmtRpShort(v)} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Correction Success Rate Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tren keberhasilan koreksi klaim</p>
              </div>
              <RechartsWrapper type="line" data={[
                { bulan: 'Okt 25', rate: 58.2 },
                { bulan: 'Nov 25', rate: 60.5 },
                { bulan: 'Des 25', rate: 56.8 },
                { bulan: 'Jan 26', rate: 62.1 },
                { bulan: 'Feb 26', rate: 63.8 },
                { bulan: 'Mar 26', rate: 64.2 },
              ]} xKey="bulan" lines={[{ dataKey: 'rate', stroke: '#10b981', name: 'Success Rate (%)' }]} height={220} />
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700"><strong>Tren positif:</strong> Correction success rate meningkat dari 58.2% ke 64.2% dalam 6 bulan. Target: &gt; 75%.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
