/**
 * GRCDashboard.tsx — Compliance / Quality / Accreditation: Governance, Risk & Compliance
 * Tab 1: Compliance Overview | Tab 2: Audit & Risk | Tab 3: Incident & Quality
 */
import React, { useState } from 'react';
import {
  ShieldCheck, Search, AlertTriangle,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import RechartsWrapper from '../RechartsWrapper';
import { TabButton, MiniBar } from '../DashboardWidgets';
import { C, CHART_COLORS } from '../colors';
import {
  accreditationScore, incidentTrend, auditFindings,
  riskHeatmap, correctiveActionStatus,
} from '../../data/hospitalDashboardData';

type Tab = 'compliance' | 'audit' | 'incident';

export default function GRCDashboard() {
  const [tab, setTab] = useState<Tab>('compliance');

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex gap-1 overflow-x-auto">
        <TabButton active={tab === 'compliance'} onClick={() => setTab('compliance')} icon={ShieldCheck} label="Compliance Overview" />
        <TabButton active={tab === 'audit'} onClick={() => setTab('audit')} icon={Search} label="Audit & Risk" />
        <TabButton active={tab === 'incident'} onClick={() => setTab('incident')} icon={AlertTriangle} label="Incident & Quality" />
      </div>

      {/* TAB 1 */}
      {tab === 'compliance' && (
        <div className="space-y-5">
          {/* Accreditation Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Accreditation Score</h3>
                <p className="text-xs text-gray-500 mt-0.5">Overall compliance SNARS</p>
              </div>
              <div className="flex justify-center mb-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="absolute inset-0" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle cx="64" cy="64" r="54" fill="none"
                      stroke={accreditationScore.overall >= 85 ? C.success : C.warning}
                      strokeWidth="10"
                      strokeDasharray={`${accreditationScore.overall * 3.39} 999`}
                      strokeLinecap="round"
                      transform="rotate(-90 64 64)" />
                  </svg>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{accreditationScore.overall}</p>
                    <p className="text-[10px] text-gray-400">/ 100</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs font-semibold text-green-700">Status: PARIPURNA</p>
                <p className="text-[10px] text-green-600">Akreditasi berlaku s/d Desember 2028</p>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Skor per Pokja Akreditasi</h3>
                <p className="text-xs text-gray-500 mt-0.5">Standar Nasional Akreditasi Rumah Sakit (SNARS)</p>
              </div>
              <div className="space-y-3">
                {accreditationScore.pokja.map(p => (
                  <div key={p.nama}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="font-medium">{p.nama}</span>
                      <span className={`font-semibold ${p.skor >= 90 ? 'text-green-600' : p.skor >= 80 ? 'text-blue-600' : 'text-amber-600'}`}>{p.skor}%</span>
                    </div>
                    <MiniBar value={p.skor} total={100} color={p.skor >= 90 ? 'bg-green-500' : p.skor >= 80 ? 'bg-blue-500' : 'bg-amber-500'} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Open Findings + Compliance Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Open Findings</h3>
                <p className="text-xs text-gray-500 mt-0.5">Status temuan yang belum ditutup</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {auditFindings.map(a => (
                  <div key={a.kategori} className={`p-4 rounded-xl text-center ${a.severity === 'high' ? 'bg-red-50' : a.severity === 'medium' ? 'bg-amber-50' : 'bg-green-50'}`}>
                    <p className={`text-3xl font-bold ${a.severity === 'high' ? 'text-red-600' : a.severity === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>{a.count}</p>
                    <p className="text-xs text-gray-600 mt-1">{a.kategori}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Compliance Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tren skor kepatuhan 6 bulan</p>
              </div>
              <RechartsWrapper type="line" data={[
                { bulan: 'Okt 25', skor: 84.2 },
                { bulan: 'Nov 25', skor: 85.1 },
                { bulan: 'Des 25', skor: 85.8 },
                { bulan: 'Jan 26', skor: 86.5 },
                { bulan: 'Feb 26', skor: 87.0 },
                { bulan: 'Mar 26', skor: 87.4 },
              ]} xKey="bulan" lines={[{ dataKey: 'skor', stroke: C.success, name: 'Compliance Score' }]} height={220} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {tab === 'audit' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Internal Audit Findings</h3>
                <p className="text-xs text-gray-500 mt-0.5">Temuan audit internal per kategori</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { area: 'Dokumentasi Medis', findings: 5, status: 'Terbuka', severity: 'high' },
                  { area: 'Pengendalian Infeksi', findings: 3, status: 'Dalam Proses', severity: 'medium' },
                  { area: 'Keselamatan Pasien', findings: 2, status: 'Terbuka', severity: 'high' },
                  { area: 'Manajemen Obat', findings: 4, status: 'Dalam Proses', severity: 'medium' },
                  { area: 'Hak Pasien', findings: 1, status: 'Terbuka', severity: 'low' },
                  { area: 'Tata Kelola', findings: 2, status: 'Dalam Proses', severity: 'low' },
                ].map(a => (
                  <div key={a.area} className={`p-3 rounded-lg border ${a.severity === 'high' ? 'bg-red-50 border-red-200' : a.severity === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">{a.area}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{a.findings}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${a.status === 'Terbuka' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">External Audit Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">Status audit eksternal terkini</p>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  { audit: 'SNARS Akreditasi', lastDate: 'Des 2025', nextDate: 'Des 2028', status: 'Paripurna', color: 'bg-green-50 border-green-200 text-green-700' },
                  { audit: 'BPK Audit Keuangan', lastDate: 'Feb 2026', nextDate: 'Feb 2027', status: 'WTP', color: 'bg-green-50 border-green-200 text-green-700' },
                  { audit: 'ISO 9001:2015', lastDate: 'Sep 2025', nextDate: 'Sep 2026', status: 'Bersertifikat', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { audit: 'K3RS Kemenkes', lastDate: 'Jan 2026', nextDate: 'Jan 2027', status: 'Comply', color: 'bg-green-50 border-green-200 text-green-700' },
                ].map(a => (
                  <div key={a.audit} className={`p-3 rounded-lg border ${a.color}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-800">{a.audit}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.color}`}>{a.status}</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Terakhir: {a.lastDate} · Berikutnya: {a.nextDate}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-semibold text-gray-600 mb-2">Risk Heatmap</h4>
              <div className="space-y-2">
                {riskHeatmap.map(r => (
                  <div key={r.risk} className={`p-2.5 rounded-lg border text-xs ${r.level === 'Tinggi' ? 'bg-red-50 border-red-200' : r.level === 'Sedang' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 flex-1">{r.risk}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.level === 'Tinggi' ? 'bg-red-100 text-red-700' : r.level === 'Sedang' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{r.level}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Likelihood: {r.likelihood} × Impact: {r.impact} = {r.likelihood * r.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {tab === 'incident' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Incident Frequency</h3>
                <p className="text-xs text-gray-500 mt-0.5">Frekuensi insiden keselamatan pasien (6 bulan)</p>
              </div>
              <RechartsWrapper type="line" data={incidentTrend} xKey="bulan" lines={[
                { dataKey: 'sentinel', stroke: C.danger, name: 'Sentinel' },
                { dataKey: 'ktd', stroke: C.warning, name: 'KTD' },
                { dataKey: 'knc', stroke: CHART_COLORS[0], name: 'KNC' },
                { dataKey: 'kpc', stroke: CHART_COLORS[4], name: 'KPC' },
              ]} height={260} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="text-gray-800">Root Cause Category</h3>
                <p className="text-xs text-gray-500 mt-0.5">Kategori akar penyebab insiden</p>
              </div>
              <RechartsWrapper type="pie" data={[
                { name: 'Komunikasi', value: 32 },
                { name: 'Prosedur/SOP', value: 24 },
                { name: 'SDM/Kompetensi', value: 18 },
                { name: 'Lingkungan', value: 12 },
                { name: 'Alat/Fasilitas', value: 8 },
                { name: 'Lainnya', value: 6 },
              ]} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} colors={[C.danger, C.warning, CHART_COLORS[0], C.success, CHART_COLORS[4], '#94a3b8']} height={240} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-gray-800">Corrective Action Status</h3>
              <p className="text-xs text-gray-500 mt-0.5">Status tindak lanjut temuan & insiden</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {correctiveActionStatus.map(c => {
                const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                  'Belum Dimulai': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
                  'Berjalan': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
                  'Selesai': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
                  'Overdue': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                };
                const style = colorMap[c.status] || colorMap['Belum Dimulai'];
                return (
                  <div key={c.status} className={`p-4 rounded-xl border text-center ${style.bg} ${style.border}`}>
                    <p className={`text-3xl font-bold ${style.text}`}>{c.count}</p>
                    <p className="text-xs text-gray-600 mt-1">{c.status}</p>
                  </div>
                );
              })}
            </div>
            {correctiveActionStatus.find(c => c.status === 'Overdue' && c.count > 0) && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-700"><strong>Perhatian:</strong> Terdapat 3 corrective action yang overdue. Segera tindak lanjuti untuk memenuhi standar akreditasi.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}