import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  User, TrendingUp, TrendingDown, Award, Target, Clock,
  ChevronDown, ChevronUp, Calendar, BarChart2, Minus,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

// ─── Types re-used from parent ───────────────────────────────────────────────
const PREDIKAT_CFG: Record<string, { color: string; bg: string; border: string }> = {
  'Sangat Baik': { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  'Baik':        { color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-200'    },
  'Cukup':       { color: 'text-yellow-700',  bg: 'bg-yellow-100',  border: 'border-yellow-200'  },
  'Kurang':      { color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-200'  },
  'Sangat Kurang':{ color: 'text-red-700',    bg: 'bg-red-100',     border: 'border-red-200'     },
};
const STATUS_CFG: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-600', 'Aktif': 'bg-blue-100 text-blue-700', 'Selesai': 'bg-green-100 text-green-700',
};
const BEHAVIOR_DIMS = ['orientasi','integritas','kerjasama','inisiatif','kepemimpinan'];
const BEHAVIOR_LABELS: Record<string,string> = {
  orientasi: 'Orientasi Pelayanan', integritas: 'Integritas', kerjasama: 'Kerjasama',
  inisiatif: 'Inisiatif', kepemimpinan: 'Kepemimpinan',
};
const BEHAVIOR_SCORE: Record<number, number> = { 1: 25, 2: 50, 3: 70, 4: 85, 5: 100 };

function loadBehavior(skpId: string): Record<string,number> {
  try { const r = localStorage.getItem(`skp_behavior_${skpId}`); return r ? JSON.parse(r) : {}; } catch { return {}; }
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilKinerjaTab() {
  const { skp, pegawai, absensi, diklat, disiplin } = useAppContext();
  const [selectedPegawaiId, setSelectedPegawaiId] = useState('');
  const [expandedSKP, setExpandedSKP] = useState<Set<string>>(new Set());

  const pegawaiAktif = pegawai.filter(p => p.statusAktif === 'Aktif');
  const selectedPegawai = pegawaiAktif.find(p => p.id === selectedPegawaiId);

  // All SKPs for selected employee
  const mySKPs = useMemo(() =>
    skp.filter(s => s.pegawaiId === selectedPegawaiId)
       .sort((a, b) => a.tahun !== b.tahun ? a.tahun - b.tahun : a.semester - b.semester),
    [skp, selectedPegawaiId]
  );

  // Trend data for LineChart
  const trendData = useMemo(() =>
    mySKPs.filter(s => s.nilaiAkhir != null).map(s => {
      const beh = loadBehavior(s.id);
      const isSupv = !!selectedPegawai?.eselon;
      const dims = isSupv ? BEHAVIOR_DIMS : BEHAVIOR_DIMS.filter(d => d !== 'kepemimpinan');
      const behScore = dims.length > 0 && dims.some(d => beh[d])
        ? Math.round(dims.reduce((sum, d) => sum + (BEHAVIOR_SCORE[beh[d] ?? 3] || 70), 0) / dims.length)
        : null;
      const finalScore = behScore != null ? Math.round((s.nilaiAkhir! * 0.7) + (behScore * 0.3)) : s.nilaiAkhir!;
      return {
        label: `Sem.${s.semester}/${s.tahun}`,
        'Nilai KPI': s.nilaiAkhir,
        'Nilai Perilaku': behScore,
        'Final Score': finalScore,
      };
    }),
    [mySKPs, selectedPegawai]
  );

  // Behavior radar data (latest SKP with behavior)
  const latestSKPWithBeh = useMemo(() => {
    const selesai = mySKPs.filter(s => s.status === 'Selesai');
    if (!selesai.length) return null;
    const latest = selesai[selesai.length - 1];
    const beh = loadBehavior(latest.id);
    if (!Object.keys(beh).length) return null;
    return { skp: latest, beh };
  }, [mySKPs]);

  const radarData = useMemo(() => {
    if (!latestSKPWithBeh) return [];
    const isSupv = !!selectedPegawai?.eselon;
    const dims = isSupv ? BEHAVIOR_DIMS : BEHAVIOR_DIMS.filter(d => d !== 'kepemimpinan');
    return dims.map(d => ({
      subject: BEHAVIOR_LABELS[d],
      Nilai: BEHAVIOR_SCORE[latestSKPWithBeh.beh[d] ?? 3] || 70,
      fullMark: 100,
    }));
  }, [latestSKPWithBeh, selectedPegawai]);

  // Summary stats
  const selesaiList = mySKPs.filter(s => s.status === 'Selesai' && s.nilaiAkhir != null);
  const avgNilai = selesaiList.length
    ? (selesaiList.reduce((s, r) => s + r.nilaiAkhir!, 0) / selesaiList.length).toFixed(1) : '–';
  const bestNilai = selesaiList.length
    ? Math.max(...selesaiList.map(s => s.nilaiAkhir!)) : null;
  const lastNilai = selesaiList.length ? selesaiList[selesaiList.length - 1].nilaiAkhir! : null;
  const prevNilai = selesaiList.length > 1 ? selesaiList[selesaiList.length - 2].nilaiAkhir! : null;
  const trendDir = lastNilai && prevNilai ? (lastNilai > prevNilai ? 'up' : lastNilai < prevNilai ? 'down' : 'flat') : 'flat';

  // Absensi stats for this employee
  const myAbsensi = absensi.filter(a => a.pegawaiId === selectedPegawaiId);
  const hadir = myAbsensi.filter(a => a.status === 'Hadir' || a.status === 'Dinas Luar').length;
  const kehadiranPct = myAbsensi.length ? ((hadir / myAbsensi.length) * 100).toFixed(1) : '–';

  // Diklat stats
  const myDiklat = diklat.filter(d => d.pegawaiId === selectedPegawaiId && d.status === 'Selesai');
  const totalJP = myDiklat.reduce((s, d) => s + (d.jumlahJP || 0), 0);

  // Disiplin
  const myDisiplin = disiplin.filter(d => d.pegawaiId === selectedPegawaiId);

  // Unit comparison data
  const unitAvg = useMemo(() => {
    if (!selectedPegawai) return null;
    const unitSKP = skp.filter(s => {
      const p = pegawai.find(px => px.id === s.pegawaiId);
      return p?.unitKerja === selectedPegawai.unitKerja && s.status === 'Selesai' && s.nilaiAkhir;
    });
    if (!unitSKP.length) return null;
    return (unitSKP.reduce((sum, s) => sum + s.nilaiAkhir!, 0) / unitSKP.length).toFixed(1);
  }, [skp, pegawai, selectedPegawai]);

  const toggleSKP = (id: string) =>
    setExpandedSKP(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <User className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">Profil Kinerja Individual</p>
          <p className="text-xs text-indigo-600 mt-0.5">Rekam jejak performa setiap pegawai secara menyeluruh: tren nilai SKP, skor perilaku, kehadiran, dan diklat. Data terhubung real-time dari semua modul HCMS.</p>
        </div>
      </div>

      {/* Pegawai Selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <label className="text-xs font-medium text-gray-700 block mb-2">Pilih Pegawai</label>
        <select value={selectedPegawaiId} onChange={e => setSelectedPegawaiId(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">— Pilih pegawai untuk melihat profil kinerja —</option>
          {pegawaiAktif.map(p => (
            <option key={p.id} value={p.id}>
              {p.gelarDepan || ''} {p.nama} — {p.jabatan} | {p.unitKerja}
            </option>
          ))}
        </select>
      </div>

      {selectedPegawai && (
        <div className="space-y-5">
          {/* Identity Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {selectedPegawai.nama.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{selectedPegawai.gelarDepan || ''} {selectedPegawai.nama} {selectedPegawai.gelarBelakang || ''}</p>
                  <p className="text-blue-200 text-sm">{selectedPegawai.jabatan}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{selectedPegawai.unitKerja}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Gol. {selectedPegawai.golongan}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{selectedPegawai.statusPegawai}</span>
                    {selectedPegawai.eselon && <span className="text-xs bg-yellow-400/30 text-yellow-200 px-2 py-0.5 rounded-full">{selectedPegawai.eselon}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-blue-200">NIP</p>
                <p className="text-sm font-mono font-semibold">{selectedPegawai.nip}</p>
                <p className="text-xs text-blue-200 mt-1">Masa Kerja</p>
                <p className="text-sm">{selectedPegawai.masaKerja}</p>
              </div>
            </div>
            {/* KPI pills */}
            <div className="grid grid-cols-4 gap-3 mt-4 border-t border-white/20 pt-4">
              {[
                { label: 'Total SKP', value: mySKPs.length, sub: 'semua periode' },
                { label: 'Avg KPI', value: avgNilai, sub: 'dari SKP selesai' },
                { label: 'Kehadiran', value: `${kehadiranPct}%`, sub: `${hadir} hari hadir` },
                { label: 'Total Diklat', value: `${totalJP} JP`, sub: `${myDiklat.length} pelatihan` },
              ].map(c => (
                <div key={c.label} className="text-center">
                  <p className="text-[10px] text-blue-300">{c.label}</p>
                  <p className="text-lg font-bold">{c.value}</p>
                  <p className="text-[10px] text-blue-300">{c.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'SKP Terbaik', value: bestNilai ?? '–', sub: bestNilai ? `Predikat: ${bestNilai >= 110 ? 'Sangat Baik' : bestNilai >= 90 ? 'Baik' : 'Cukup'}` : 'Belum ada data',
                cls: 'bg-emerald-50 border-emerald-100', val: 'text-emerald-700', icon: Award,
              },
              {
                label: 'Nilai Terakhir', value: lastNilai ?? '–', sub: trendDir === 'up' ? `▲ Naik dari ${prevNilai}` : trendDir === 'down' ? `▼ Turun dari ${prevNilai}` : 'Stabil',
                cls: 'bg-blue-50 border-blue-100', val: trendDir === 'up' ? 'text-emerald-600' : trendDir === 'down' ? 'text-red-600' : 'text-blue-600',
                icon: trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus,
              },
              {
                label: 'Disiplin', value: myDisiplin.length, sub: `${myDisiplin.filter(d => d.status !== 'Selesai').length} aktif`,
                cls: myDisiplin.some(d => d.status !== 'Selesai') ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100',
                val: myDisiplin.some(d => d.status !== 'Selesai') ? 'text-red-600' : 'text-gray-600', icon: Target,
              },
              {
                label: 'Avg Unit', value: unitAvg ?? '–', sub: selectedPegawai.unitKerja,
                cls: 'bg-purple-50 border-purple-100', val: 'text-purple-700', icon: BarChart2,
              },
            ].map(c => (
              <div key={c.label} className={`rounded-xl border shadow-sm p-4 ${c.cls}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <c.icon className="w-4 h-4 text-gray-400" />
                </div>
                <p className={`text-2xl font-bold ${c.val}`}>{c.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          {trendData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Trend Line Chart */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 text-sm">Tren Nilai Kinerja</h3>
                  <span className="text-xs text-gray-400">Lintas semester</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis domain={[50, 130]} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={90} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'Baik', position: 'insideRight', fontSize: 9, fill: '#3b82f6' }} />
                    <ReferenceLine y={110} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'SB', position: 'insideRight', fontSize: 9, fill: '#10b981' }} />
                    <Line type="monotone" dataKey="Nilai KPI" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    {trendData.some(d => d['Final Score'] !== d['Nilai KPI']) && (
                      <Line type="monotone" dataKey="Final Score" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart */}
              {radarData.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 text-sm">Profil Perilaku Kerja</h3>
                    <span className="text-xs text-gray-400">SKP terbaru</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar name="Nilai" dataKey="Nilai" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 flex flex-col items-center justify-center text-gray-400">
                  <BarChart2 className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs text-center">Radar perilaku tersedia setelah<br/>penilaian perilaku diisi di tab<br/>Penilaian Perilaku</p>
                </div>
              )}
            </div>
          )}

          {/* SKP Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">
              Riwayat SKP <span className="text-gray-400 font-normal ml-1">({mySKPs.length} periode)</span>
            </h3>
            {mySKPs.length === 0 ? (
              <div className="text-center text-gray-400 py-6">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Belum ada SKP untuk pegawai ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...mySKPs].reverse().map(s => {
                  const isOpen = expandedSKP.has(s.id);
                  const predikatCfg = s.predikat ? PREDIKAT_CFG[s.predikat] : null;
                  const beh = loadBehavior(s.id);
                  const hasBeh = Object.keys(beh).length > 0;
                  const isSupv = !!selectedPegawai?.eselon;
                  const dims = isSupv ? BEHAVIOR_DIMS : BEHAVIOR_DIMS.filter(d => d !== 'kepemimpinan');
                  const behScore = hasBeh ? Math.round(dims.reduce((sum, d) => sum + (BEHAVIOR_SCORE[beh[d] ?? 3] || 70), 0) / dims.length) : null;
                  const finalScore = s.nilaiAkhir != null && behScore != null
                    ? Math.round(s.nilaiAkhir * 0.7 + behScore * 0.3) : null;

                  return (
                    <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/60 transition-colors"
                        onClick={() => toggleSKP(s.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <div className="w-px h-4 bg-gray-200 mt-1" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">Semester {s.semester} — {s.tahun}</p>
                            <p className="text-xs text-gray-500">{s.targetKinerja.length} butir kegiatan</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.nilaiAkhir != null && (
                            <span className="text-base font-bold text-gray-800">{s.nilaiAkhir}</span>
                          )}
                          {finalScore != null && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Final: {finalScore}</span>
                          )}
                          {s.predikat && predikatCfg && (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${predikatCfg.bg} ${predikatCfg.color}`}>{s.predikat}</span>
                          )}
                          <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_CFG[s.status]}`}>{s.status}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-gray-50">
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                            {[
                              { label: 'Nilai KPI', value: s.nilaiAkhir ?? '–', cls: 'bg-blue-50 text-blue-700' },
                              { label: 'Skor Perilaku', value: behScore ?? '–', cls: 'bg-purple-50 text-purple-700' },
                              { label: 'Final Score', value: finalScore ?? '–', cls: 'bg-indigo-50 text-indigo-700' },
                              { label: 'Butir Kegiatan', value: s.targetKinerja.length, cls: 'bg-gray-50 text-gray-700' },
                            ].map(c => (
                              <div key={c.label} className={`rounded-xl p-3 text-center ${c.cls}`}>
                                <p className="text-[10px] text-gray-500 mb-0.5">{c.label}</p>
                                <p className="text-lg font-bold">{c.value}</p>
                              </div>
                            ))}
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400 border-b border-gray-100">
                                <th className="text-left pb-1.5 pr-3">Uraian Kegiatan</th>
                                <th className="text-center pb-1.5 px-2">Target</th>
                                <th className="text-center pb-1.5 px-2">Realisasi</th>
                                <th className="text-center pb-1.5 px-2">Bobot</th>
                                <th className="text-center pb-1.5">Capaian</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.targetKinerja.map(t => (
                                <tr key={t.id} className="border-b border-gray-50 last:border-0">
                                  <td className="py-2 pr-3 text-gray-700">{t.uraianKegiatan}</td>
                                  <td className="py-2 text-center text-gray-500">{t.target.toLocaleString()} {t.satuan}</td>
                                  <td className="py-2 text-center font-medium">{t.realisasi != null ? t.realisasi.toLocaleString() : '–'}</td>
                                  <td className="py-2 text-center text-gray-500">{t.bobot}%</td>
                                  <td className="py-2 text-center">
                                    {t.nilaiCapaian != null ? (
                                      <span className={`font-semibold ${t.nilaiCapaian >= 100 ? 'text-emerald-600' : t.nilaiCapaian >= 75 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                        {t.nilaiCapaian.toFixed(1)}
                                      </span>
                                    ) : '–'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedPegawaiId && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          <User className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Pilih pegawai di atas untuk melihat profil kinerja lengkap</p>
        </div>
      )}
    </div>
  );
}