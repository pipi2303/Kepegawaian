import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  Download, FileText, Printer, Search, Filter, BarChart2,
  CheckCircle2, Clock, AlertTriangle, Award, Users,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PREDIKAT_CFG: Record<string, { color: string; bg: string; hex: string }> = {
  'Sangat Baik': { color: 'text-emerald-700', bg: 'bg-emerald-100', hex: '#10b981' },
  'Baik':        { color: 'text-blue-700',    bg: 'bg-blue-100',    hex: '#3b82f6' },
  'Cukup':       { color: 'text-yellow-700',  bg: 'bg-yellow-100',  hex: '#f59e0b' },
  'Kurang':      { color: 'text-orange-700',  bg: 'bg-orange-100',  hex: '#f97316' },
  'Sangat Kurang':{ color: 'text-red-700',    bg: 'bg-red-100',     hex: '#ef4444' },
};
const STATUS_CFG: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-600', 'Aktif': 'bg-blue-100 text-blue-700', 'Selesai': 'bg-green-100 text-green-700',
};
const UNIT_COLORS = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];

function getNilaiPredikat(n: number) {
  if (n >= 110) return 'Sangat Baik';
  if (n >= 90)  return 'Baik';
  if (n >= 70)  return 'Cukup';
  if (n >= 50)  return 'Kurang';
  return 'Sangat Kurang';
}
function loadBehavior(id: string): Record<string,number> {
  try { const r = localStorage.getItem(`skp_behavior_${id}`); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
const BEHAVIOR_SCORE: Record<number, number> = { 1: 25, 2: 50, 3: 70, 4: 85, 5: 100 };

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs max-w-48">
      <p className="font-semibold text-gray-700 mb-1.5 truncate">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="text-gray-500">{p.name}</span>
          <span className="font-bold" style={{ color: p.fill || p.color }}>{p.value?.toFixed ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LaporanTab() {
  const { skp, pegawai } = useAppContext();
  const [filterTahun, setFilterTahun] = useState('2026');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchNama, setSearchNama] = useState('');

  // Unique units
  const unitList = useMemo(() => [...new Set(pegawai.map(p => p.unitKerja))].sort(), [pegawai]);

  // Filtered SKP
  const filteredSKP = useMemo(() =>
    skp.filter(s => {
      if (filterTahun && s.tahun !== Number(filterTahun)) return false;
      if (filterSemester && s.semester !== Number(filterSemester)) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      if (filterUnit) {
        const p = pegawai.find(px => px.id === s.pegawaiId);
        if (p?.unitKerja !== filterUnit) return false;
      }
      if (searchNama) {
        const p = pegawai.find(px => px.id === s.pegawaiId);
        if (!p || !`${p.gelarDepan || ''} ${p.nama}`.toLowerCase().includes(searchNama.toLowerCase())) return false;
      }
      return true;
    }),
    [skp, filterTahun, filterSemester, filterStatus, filterUnit, searchNama, pegawai]
  );

  // Summary stats
  const selesaiList = filteredSKP.filter(s => s.status === 'Selesai' && s.nilaiAkhir != null);
  const avgNilai = selesaiList.length ? (selesaiList.reduce((s, r) => s + r.nilaiAkhir!, 0) / selesaiList.length).toFixed(1) : '–';
  const dist: Record<string, number> = { 'Sangat Baik': 0, 'Baik': 0, 'Cukup': 0, 'Kurang': 0, 'Sangat Kurang': 0 };
  selesaiList.forEach(s => { if (s.predikat) dist[s.predikat] = (dist[s.predikat] || 0) + 1; });

  // Unit bar chart data
  const unitChartData = useMemo(() => {
    const map = new Map<string, { total: number; sum: number; count: number }>();
    filteredSKP.filter(s => s.nilaiAkhir != null).forEach(s => {
      const p = pegawai.find(px => px.id === s.pegawaiId);
      if (!p) return;
      const u = p.unitKerja.length > 25 ? p.unitKerja.slice(0, 25) + '…' : p.unitKerja;
      if (!map.has(u)) map.set(u, { total: 0, sum: 0, count: 0 });
      const entry = map.get(u)!;
      entry.total++;
      entry.sum += s.nilaiAkhir!;
      entry.count++;
    });
    return Array.from(map.entries())
      .map(([unit, d]) => ({ unit, 'Rata-rata KPI': parseFloat((d.sum / d.count).toFixed(1)), 'Jumlah SKP': d.total }))
      .sort((a, b) => b['Rata-rata KPI'] - a['Rata-rata KPI'])
      .slice(0, 10);
  }, [filteredSKP, pegawai]);

  // Enriched rows for table
  const tableRows = useMemo(() =>
    filteredSKP.map(s => {
      const p = pegawai.find(px => px.id === s.pegawaiId);
      const beh = loadBehavior(s.id);
      const isSupv = !!p?.eselon;
      const dims = isSupv ? ['orientasi','integritas','kerjasama','inisiatif','kepemimpinan'] : ['orientasi','integritas','kerjasama','inisiatif'];
      const behScore = dims.some(d => beh[d])
        ? Math.round(dims.reduce((sum, d) => sum + (BEHAVIOR_SCORE[beh[d] ?? 3] || 70), 0) / dims.length)
        : null;
      const finalScore = s.nilaiAkhir != null && behScore != null
        ? Math.round(s.nilaiAkhir * 0.7 + behScore * 0.3) : null;
      const finalPredikat = finalScore != null ? getNilaiPredikat(finalScore) : null;
      return { s, p, behScore, finalScore, finalPredikat };
    }),
    [filteredSKP, pegawai]
  );

  // ─── PDF Export ─────────────────────────────────────────────────────────────
  const handleExportSummaryPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const W = 210; const M = 20;
      let y = 20;

      // Header
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN SKP & PENILAIAN KINERJA', W / 2, y, { align: 'center' });
      y += 7;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('RSUD Abdul Moeloek Provinsi Lampung', W / 2, y, { align: 'center' });
      y += 5;
      doc.setFontSize(9);
      const periodLabel = [filterTahun && `Tahun ${filterTahun}`, filterSemester && `Semester ${filterSemester}`].filter(Boolean).join(', ') || 'Semua Periode';
      doc.text(`Periode: ${periodLabel}  |  Unit: ${filterUnit || 'Semua Unit'}`, W / 2, y, { align: 'center' });
      y += 5;
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, W / 2, y, { align: 'center' });
      y += 3;
      doc.line(M, y, W - M, y); y += 8;

      // Summary stats
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('RINGKASAN STATISTIK', M, y); y += 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(`Total SKP dalam Filter   : ${filteredSKP.length}`, M, y); y += 5;
      doc.text(`SKP Selesai Dinilai       : ${selesaiList.length}`, M, y); y += 5;
      doc.text(`Rata-rata Nilai KPI       : ${avgNilai}`, M, y); y += 5;
      doc.text(`Sangat Baik (>=110)       : ${dist['Sangat Baik']} pegawai`, M, y); y += 5;
      doc.text(`Baik (90-109)             : ${dist['Baik']} pegawai`, M, y); y += 5;
      doc.text(`Cukup (70-89)             : ${dist['Cukup']} pegawai`, M, y); y += 5;
      doc.text(`Kurang (50-69)            : ${dist['Kurang']} pegawai`, M, y); y += 5;
      doc.text(`Sangat Kurang (<50)       : ${dist['Sangat Kurang']} pegawai`, M, y); y += 5;
      y += 3;
      doc.line(M, y, W - M, y); y += 8;

      // Table header
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('DAFTAR DETAIL SKP', M, y); y += 6;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      const cols = [M, 55, 75, 90, 105, 120, 140, 160];
      const headers = ['Nama Pegawai', 'Unit', 'Sem/Thn', 'Status', 'Nilai KPI', 'Perilaku', 'Final', 'Predikat'];
      headers.forEach((h, i) => doc.text(h, cols[i], y));
      y += 4; doc.line(M, y, W - M, y); y += 5;

      // Table rows
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      tableRows.forEach(({ s, p, behScore, finalScore, finalPredikat }) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const nama = p ? `${p.gelarDepan || ''} ${p.nama}`.trim() : s.pegawaiId;
        const unit = (p?.unitKerja || '-').slice(0, 18);
        const sem = `${s.semester}/${s.tahun}`;
        doc.text(nama.slice(0, 25), cols[0], y);
        doc.text(unit, cols[1], y);
        doc.text(sem, cols[2], y);
        doc.text(s.status, cols[3], y);
        doc.text(s.nilaiAkhir != null ? String(s.nilaiAkhir) : '–', cols[4], y);
        doc.text(behScore != null ? String(behScore) : '–', cols[5], y);
        doc.text(finalScore != null ? String(finalScore) : '–', cols[6], y);
        doc.text(finalPredikat || s.predikat || '–', cols[7], y);
        y += 5;
        doc.setDrawColor(230, 230, 230);
        doc.line(M, y - 1, W - M, y - 1);
      });

      // Footer
      y += 5;
      doc.setFontSize(8); doc.setFont('helvetica', 'italic');
      doc.text('Dokumen ini digenerate otomatis oleh HR APP RSUD Abdul Moeloek.', W / 2, y, { align: 'center' });
      y += 4;
      doc.text('Ditandatangani oleh Direktur: dr. IMAM GHOZALI, Sp.An., M.Kes. (NIP. 19680415 199703 1 001)', W / 2, y, { align: 'center' });

      doc.save(`Laporan-SKP-${filterTahun || 'Semua'}-Sem${filterSemester || 'Semua'}.pdf`);
      toast.success('PDF berhasil diunduh!');
    } catch (err) {
      toast.error('Gagal generate PDF. Silakan coba lagi.');
    }
  };

  const handleCetakIndividual = (skpId: string) => {
    const row = tableRows.find(r => r.s.id === skpId);
    if (!row) return;
    const { s, p, behScore, finalScore, finalPredikat } = row;
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const W = 210; const M = 20;
      let y = 20;

      // Letterhead
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('SASARAN KINERJA PEGAWAI (SKP)', W / 2, y, { align: 'center' }); y += 7;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('RSUD Abdul Moeloek — Pemerintah Provinsi Lampung', W / 2, y, { align: 'center' }); y += 5;
      doc.setFontSize(9);
      doc.text('Jl. Dr. Rivai No. 6, Bandar Lampung — Telp. (0721) 703614', W / 2, y, { align: 'center' }); y += 4;
      doc.line(M, y, W - M, y); y += 8;

      // Identitas Pegawai
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('I. IDENTITAS PEGAWAI', M, y); y += 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const fields = [
        ['Nama', p ? `${p.gelarDepan || ''} ${p.nama} ${p.gelarBelakang || ''}`.trim() : s.pegawaiId],
        ['NIP', p?.nip || '-'],
        ['Jabatan', p?.jabatan || '-'],
        ['Unit Kerja', p?.unitKerja || '-'],
        ['Golongan/Pangkat', p ? `${p.golongan} / ${p.pangkat}` : '-'],
        ['Status Pegawai', p?.statusPegawai || '-'],
        ['Periode SKP', `Semester ${s.semester} Tahun ${s.tahun}`],
      ];
      fields.forEach(([label, value]) => {
        doc.text(`${label}`, M, y);
        doc.text(`: ${value}`, M + 50, y);
        y += 5;
      });
      y += 3; doc.line(M, y, W - M, y); y += 8;

      // Target Kinerja
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('II. TARGET DAN REALISASI KINERJA', M, y); y += 6;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      const c2 = [M, 75, 95, 115, 130, 148, 165];
      ['Uraian Kegiatan / KPI', 'Target', 'Satuan', 'Realisasi', 'Bobot %', 'Capaian', 'Nilai'].forEach((h, i) => doc.text(h, c2[i], y));
      y += 4; doc.line(M, y, W - M, y); y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      s.targetKinerja.forEach((t, idx) => {
        if (y > 260) { doc.addPage(); y = 20; }
        const uraian = t.uraianKegiatan.length > 35 ? t.uraianKegiatan.slice(0, 35) + '…' : t.uraianKegiatan;
        doc.text(`${idx + 1}. ${uraian}`, M, y);
        doc.text(String(t.target), c2[1], y);
        doc.text(t.satuan, c2[2], y);
        doc.text(t.realisasi != null ? String(t.realisasi) : '-', c2[3], y);
        doc.text(`${t.bobot}%`, c2[4], y);
        doc.text(t.nilaiCapaian != null ? `${t.nilaiCapaian.toFixed(1)}` : '-', c2[5], y);
        doc.text(t.nilaiCapaian != null ? `${((t.nilaiCapaian * t.bobot) / 100).toFixed(1)}` : '-', c2[6], y);
        y += 5;
      });
      y += 2; doc.line(M, y, W - M, y); y += 5;

      // Score summary
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      if (s.nilaiAkhir != null) {
        doc.text(`Nilai Akhir KPI (70%)        : ${s.nilaiAkhir}`, M, y); y += 5;
        if (behScore != null) {
          doc.text(`Nilai Perilaku Kerja (30%)   : ${behScore}`, M, y); y += 5;
          doc.text(`FINAL SCORE                  : ${finalScore} — ${finalPredikat}`, M, y); y += 5;
        } else {
          doc.text(`Predikat Kinerja             : ${s.predikat || '-'}`, M, y); y += 5;
        }
      }
      y += 5; doc.line(M, y, W - M, y); y += 10;

      // Signature
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text('Pegawai Yang Dinilai,', M, y);
      doc.text('Pejabat Penilai Kinerja,', W - M - 50, y); y += 25;
      const nama = p ? `${p.gelarDepan || ''} ${p.nama} ${p.gelarBelakang || ''}`.trim() : '-';
      doc.setFont('helvetica', 'bold');
      doc.text(nama.slice(0, 40), M, y);
      doc.text('dr. IMAM GHOZALI, Sp.An., M.Kes.', W - M - 50, y); y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(`NIP. ${p?.nip || '-'}`, M, y);
      doc.text('NIP. 19680415 199703 1 001', W - M - 50, y);

      doc.save(`SKP-${p?.nama?.replace(/\s+/g,'_') || s.pegawaiId}-Sem${s.semester}-${s.tahun}.pdf`);
      toast.success('SKP individual berhasil dicetak!');
    } catch {
      toast.error('Gagal mencetak PDF.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
        <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Laporan & Cetak SKP (PDF)</p>
          <p className="text-xs text-gray-600 mt-0.5">Filter data SKP, lihat visualisasi per unit kerja, dan ekspor ke PDF menggunakan jsPDF text API sesuai standar dokumen kepegawaian.</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">Filter Laporan</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={searchNama} onChange={e => setSearchNama(e.target.value)} placeholder="Nama pegawai..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Tahun</option>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Selesai">Selesai</option>
            <option value="Draft">Draft</option>
          </select>
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Unit</option>
            {unitList.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{filteredSKP.length} SKP ditemukan</p>
          <button onClick={handleExportSummaryPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs rounded-xl hover:bg-gray-700 transition-colors">
            <Download className="w-3.5 h-3.5" /> Ekspor PDF Rekapitulasi
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total SKP', value: filteredSKP.length, icon: FileText, cls: 'border-gray-100', val: 'text-gray-800' },
          { label: 'SKP Selesai', value: selesaiList.length, icon: CheckCircle2, cls: 'border-green-100 bg-green-50', val: 'text-green-700' },
          { label: 'Rata-rata KPI', value: avgNilai, icon: Award, cls: 'border-blue-100 bg-blue-50', val: 'text-blue-700' },
          { label: 'Sangat Baik', value: dist['Sangat Baik'], icon: BarChart2, cls: 'border-emerald-100 bg-emerald-50', val: 'text-emerald-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border shadow-sm p-4 bg-white ${c.cls}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">{c.label}</p>
              <c.icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className={`text-2xl font-bold ${c.val}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart: Nilai per Unit */}
      {unitChartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Rata-rata KPI per Unit Kerja</h3>
            <span className="text-xs text-gray-400">Top {unitChartData.length} unit</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={unitChartData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 130]} tick={{ fontSize: 10 }} />
              <YAxis dataKey="unit" type="category" width={140} tick={{ fontSize: 9 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="Rata-rata KPI" radius={[0, 4, 4, 0]}>
                {unitChartData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={UNIT_COLORS[i % UNIT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Predikat Distribution */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 text-sm mb-4">Distribusi Predikat</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(dist).map(([pred, count]) => {
            const cfg = PREDIKAT_CFG[pred];
            const pct = selesaiList.length ? Math.round((count / selesaiList.length) * 100) : 0;
            return (
              <div key={pred} className={`flex-1 min-w-28 p-4 rounded-xl text-center border ${cfg.bg} ${cfg.color}`} style={{ borderColor: cfg.hex + '40' }}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-[11px] font-semibold mt-0.5">{pred}</p>
                <p className="text-[10px] opacity-70">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Tabel Detail SKP</h3>
          <p className="text-xs text-gray-400">{tableRows.length} data ditampilkan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr className="text-gray-500 border-b border-gray-100">
                <th className="text-left px-5 py-3">Pegawai</th>
                <th className="text-left px-3 py-3">Unit Kerja</th>
                <th className="text-center px-3 py-3">Periode</th>
                <th className="text-center px-3 py-3">Status</th>
                <th className="text-center px-3 py-3">KPI</th>
                <th className="text-center px-3 py-3">Perilaku</th>
                <th className="text-center px-3 py-3">Final</th>
                <th className="text-center px-3 py-3">Predikat</th>
                <th className="text-center px-3 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">Tidak ada data</td></tr>
              ) : tableRows.map(({ s, p, behScore, finalScore, finalPredikat }) => {
                const prCfg = (finalPredikat || s.predikat) ? PREDIKAT_CFG[finalPredikat || s.predikat!] : null;
                const nama = p ? `${p.gelarDepan || ''} ${p.nama}`.trim() : s.pegawaiId;
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{nama}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-36">{p?.jabatan}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-600 max-w-32">
                      <p className="truncate">{p?.unitKerja || '-'}</p>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">S{s.semester}/{s.tahun}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CFG[s.status]}`}>{s.status}</span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-blue-700">{s.nilaiAkhir ?? '–'}</td>
                    <td className="px-3 py-3 text-center font-semibold text-purple-700">{behScore ?? '–'}</td>
                    <td className="px-3 py-3 text-center font-bold text-gray-800">{finalScore ?? '–'}</td>
                    <td className="px-3 py-3 text-center">
                      {(finalPredikat || s.predikat) && prCfg ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${prCfg.bg} ${prCfg.color}`}>
                          {finalPredikat || s.predikat}
                        </span>
                      ) : '–'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => handleCetakIndividual(s.id)}
                        className="flex items-center gap-1 px-2 py-1 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-[10px] transition-colors">
                        <Printer className="w-3 h-3" /> Cetak
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
