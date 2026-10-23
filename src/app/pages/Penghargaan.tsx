import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Award, Search, Plus, Edit2, Trash2, X, Star,
  Printer, Medal, Shield, CheckCircle2, Calendar, FileDown, Loader2, Upload,
} from 'lucide-react';
import { penghargaanApi } from '../data/api';
import { toast } from 'sonner';

// ─── Config ──────────────────────────────────────────────────────────────────
const tingkatConfig: Record<string, { chip: string; ribbon: string }> = {
  'Nasional':       { chip: 'bg-red-100 text-red-700 border border-red-200',        ribbon: 'from-red-600 to-red-800'       },
  'Provinsi':       { chip: 'bg-orange-100 text-orange-700 border border-orange-200', ribbon: 'from-orange-500 to-orange-700' },
  'Kabupaten/Kota': { chip: 'bg-yellow-100 text-yellow-700 border border-yellow-200', ribbon: 'from-yellow-500 to-yellow-700' },
  'Internal':       { chip: 'bg-blue-100 text-blue-700 border border-blue-200',      ribbon: 'from-blue-600 to-blue-800'     },
};

const JENIS_LIST = ['Pegawai Teladan', 'Inovasi', 'Dedikasi', 'Masa Kerja', 'Kehadiran', 'Lainnya'];
const LEVEL_LIST = ['Internal', 'Kabupaten/Kota', 'Provinsi', 'Nasional'];

function fmtDateLong(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Sertifikat Component ────────────────────────────────────────────────────
function SertifikatPenghargaan({ data, pg }: { data: any; pg: any }) {
  const nama = pg ? `${pg.nama}` : '—';
  const tc = tingkatConfig[data.level] ?? tingkatConfig['Internal'];

  return (
    <div className="relative bg-white" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <div className="relative border-[6px] border-double border-yellow-600 rounded-sm m-0 overflow-hidden" style={{ minHeight: '680px' }}>
        <div className={`bg-gradient-to-r ${tc.ribbon} px-6 py-4 text-center`}>
          <p className="text-yellow-100 text-[11px] tracking-widest uppercase">Pemerintah Provinsi Lampung</p>
          <p className="text-white font-bold text-[15px] tracking-wider mt-0.5 uppercase">Rumah Sakit Umum Daerah</p>
          <p className="text-yellow-200 text-[10px] tracking-widest mt-0.5">Jl. Dr. Rivai No. 6, Bandar Lampung · Telp. (0721) 703312</p>
        </div>
        <div className="flex items-center gap-2 px-6 py-2 bg-yellow-50 border-y border-yellow-300">
          <div className="flex-1 h-px bg-yellow-400" />
          <Medal className="w-4 h-4 text-yellow-600" />
          <Star className="w-3 h-3 text-yellow-500" />
          <Award className="w-5 h-5 text-yellow-600" />
          <Star className="w-3 h-3 text-yellow-500" />
          <Medal className="w-4 h-4 text-yellow-600" />
          <div className="flex-1 h-px bg-yellow-400" />
        </div>
        <div className="px-8 py-6 text-center space-y-4 bg-[#fffdf5]">
          <div>
            <h1 className="text-[26px] font-bold text-gray-800 mt-2 tracking-wider uppercase" style={{ fontFamily: 'Georgia, serif' }}>
              Sertifikat Penghargaan
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent max-w-[100px]" />
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent max-w-[100px]" />
            </div>
          </div>
          <div>
            <p className="text-[12px] text-gray-500 italic">Diberikan dengan bangga kepada:</p>
            <div className="mt-3 border-b-2 border-t-2 border-yellow-400 py-4 bg-white mx-4 rounded-sm">
              <p className="text-[22px] font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{nama}</p>
              <p className="text-[12px] text-gray-500 mt-1 font-mono tracking-wider">NIP. {pg?.nip ?? '—'}</p>
              <p className="text-[12px] text-gray-600 mt-1">{pg?.jabatan ?? '—'}</p>
              <p className="text-[11px] text-gray-400">{pg?.unit_kerja ?? '—'}</p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-[12px] text-gray-500 italic">atas prestasi dan dedikasi dalam</p>
              <p className="text-[17px] font-bold text-gray-800 px-4 leading-snug" style={{ fontFamily: 'Georgia, serif' }}>{data.nama_penghargaan}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className={`text-[11px] px-3 py-1 rounded-full font-semibold ${tc.chip}`}>Tingkat {data.level}</span>
                {data.pemberi && <span className="text-[11px] text-gray-500">· {data.pemberi}</span>}
              </div>
            </div>
            {data.deskripsi && (
              <p className="text-[11px] text-gray-500 italic mt-3 px-6 border-l-2 border-yellow-300 text-left mx-8">{data.deskripsi}</p>
            )}
          </div>
          <div className="flex justify-between items-end mt-6 px-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-yellow-400 flex flex-col items-center justify-center text-center bg-yellow-50">
                <Shield className="w-6 h-6 text-yellow-500" />
                <p className="text-[8px] text-yellow-600 font-bold mt-0.5">STEMPEL</p>
                <p className="text-[8px] text-yellow-600">RESMI</p>
              </div>
              <p className="text-[9px] text-gray-400">Cap Dinas</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-600">Ditetapkan di Bandar Lampung</p>
              <p className="text-[11px] text-gray-600">pada tanggal {fmtDateLong(data.tanggal)}</p>
              <p className="text-[11px] font-bold text-gray-800 mt-2 uppercase tracking-wide">Direktur Rumah Sakit</p>
              <p className="text-[10px] text-gray-500">Provinsi Lampung,</p>
              <div className="h-14" />
              <p className="text-[12px] font-bold text-gray-900 underline" style={{ fontFamily: 'Georgia, serif' }}>dr. IMAM GHOZALI, Sp.An., M.Kes.</p>
              <p className="text-[10px] text-gray-500">NIP. 19680415 199703 1 001</p>
            </div>
          </div>
          <div className="mt-4 border-t border-yellow-300 pt-3 flex items-center justify-center gap-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">Sertifikat ini diterbitkan secara resmi oleh Rumah Sakit Provinsi Lampung</p>
          </div>
        </div>
        <div className={`bg-gradient-to-r ${tc.ribbon} px-6 py-2 flex items-center justify-between`}>
          <p className="text-yellow-100 text-[9px] tracking-wider">© HCMS Application</p>
          <div className="flex items-center gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 text-yellow-300" />)}</div>
          <p className="text-yellow-100 text-[9px] tracking-wider">Dokumen Kepegawaian Resmi</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const emptyForm = { pegawai_id: '', nama_penghargaan: '', jenis: 'Lainnya', pemberi: '', level: 'Internal', tanggal: '', deskripsi: '' };

export default function Penghargaan() {
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const [showModal, setShowModal]           = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData]         = useState<any | null>(null);
  const [editId, setEditId]                 = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [pdfLoading, setPdfLoading]         = useState(false);
  const [uploadingId, setUploadingId]       = useState<number | null>(null);

  const [form, setForm] = useState({ ...emptyForm });
  const certRef  = useRef<HTMLDivElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterLevel) params.level = filterLevel;
      const [dataRes, statsRes] = await Promise.all([
        penghargaanApi.getAll(params),
        penghargaanApi.stats(),
      ]);
      setRows(dataRes.data?.data ?? dataRes.data ?? []);
      setStats(statsRes.data);
    } catch { toast.error('Gagal memuat data penghargaan'); }
    finally { setLoading(false); }
  }, [filterLevel]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => rows.filter(r => {
    const nm = (r.pegawai?.nama ?? '').toLowerCase();
    const ok = !search || nm.includes(search.toLowerCase()) || r.nama_penghargaan.toLowerCase().includes(search.toLowerCase());
    return ok;
  }), [rows, search]);

  const handleSave = async () => {
    if (!form.pegawai_id || !form.tanggal || !form.nama_penghargaan) { toast.error('Harap isi field wajib'); return; }
    try {
      if (editId) { await penghargaanApi.update(editId, form); toast.success('Data penghargaan diperbarui'); }
      else        { await penghargaanApi.create(form);         toast.success('Penghargaan berhasil ditambahkan'); }
      setShowModal(false);
      loadData();
    } catch { toast.error('Gagal menyimpan data'); }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await penghargaanApi.remove(showDeleteConfirm);
      toast.success('Data dihapus');
      setShowDeleteConfirm(null);
      loadData();
    } catch { toast.error('Gagal menghapus data'); }
  };

  const handleUploadSertifikat = async (id: number, file: File) => {
    setUploadingId(id);
    try {
      await penghargaanApi.uploadSertifikat(id, file);
      toast.success('Sertifikat berhasil diunggah');
      loadData();
    } catch { toast.error('Gagal mengunggah sertifikat'); }
    finally { setUploadingId(null); }
  };

  const handlePrintCert = () => {
    const el = certRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Sertifikat Penghargaan</title>
      <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Times New Roman', Times, serif; background: white; }
      @media print { @page { size: A4 landscape; margin: 10mm; } }</style></head><body>
      ${el.innerHTML}<script>window.onload = () => { window.print(); window.close(); }<\/script></body></html>`);
    win.document.close();
  };

  const handleDownloadPdf = async () => {
    const el = certRef.current;
    if (!el || !detailData) return;
    setPdfLoading(true);
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText = `position:fixed;top:-9999px;left:-9999px;z-index:-9999;width:${el.scrollWidth}px;background:#fff;`;
    document.body.appendChild(clone);
    try {
      await new Promise(r => setTimeout(r, 150));
      const resolveOklch = (css: string) =>
        css.replace(/oklch\(([^)]+)\)/g, (match) => {
          try {
            const tmp = document.createElement('canvas');
            tmp.width = tmp.height = 1;
            const ctx = tmp.getContext('2d');
            if (!ctx) return '#000';
            ctx.fillStyle = match; ctx.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            if (a === 0) return 'transparent';
            return `rgb(${r},${g},${b})`;
          } catch { return '#000'; }
        });
      const [html2canvasModule, { default: jsPDF }] = await Promise.all([
        import('html2canvas'), import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default;
      const canvas = await html2canvas(clone, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
        width: clone.scrollWidth, height: clone.scrollHeight,
        onclone: (_doc: Document) => {
          _doc.querySelectorAll('style').forEach(s => {
            if (s.textContent?.includes('oklch')) s.textContent = resolveOklch(s.textContent);
          });
        },
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let iw = pw - 16, ih = iw / ratio;
      if (ih > ph - 16) { ih = ph - 16; iw = ih * ratio; }
      pdf.addImage(imgData, 'JPEG', (pw - iw) / 2, (ph - ih) / 2, iw, ih);
      pdf.save(`Sertifikat_${detailData.nama_penghargaan.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF berhasil diunduh');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh PDF, coba gunakan tombol Cetak');
    } finally {
      if (document.body.contains(clone)) document.body.removeChild(clone);
      setPdfLoading(false);
    }
  };

  const openDetail = (r: any) => { setDetailData(r); setShowDetailModal(true); };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Penghargaan & Tanda Kehormatan
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">PP No. 35/2010 · UU No. 20/2009 (Gelar, Tanda Jasa & Kehormatan)</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Penghargaan', value: rows.length, sub: 'Semua jenis', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Award },
          { label: 'Pegawai Teladan', value: stats?.by_jenis?.['Pegawai Teladan'] ?? 0, sub: 'Termasuk semua level', color: 'text-red-600', bg: 'bg-red-50', icon: Medal },
          { label: 'Tingkat Nasional', value: stats?.by_level?.['Nasional'] ?? 0, sub: 'Prestasi tertinggi', color: 'text-blue-600', bg: 'bg-blue-50', icon: Star },
          { label: 'Tahun Ini', value: rows.filter(r => r.tahun === new Date().getFullYear()).length, sub: String(new Date().getFullYear()), color: 'text-green-600', bg: 'bg-green-50', icon: Calendar },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top units */}
      {stats?.top_unit?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">Unit Kerja Berprestasi</p>
          <div className="flex flex-wrap gap-2">
            {stats.top_unit.slice(0, 6).map((u: any) => (
              <span key={u.unit_kerja} className="text-xs bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full">
                {u.unit_kerja} <span className="font-bold ml-1">{u.total}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau penghargaan..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Level</option>
            {LEVEL_LIST.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Penghargaan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Pemberi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tanggal</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Level</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada data penghargaan</td></tr>
              ) : filtered.map(r => {
                const tc = tingkatConfig[r.level] ?? tingkatConfig['Internal'];
                return (
                  <tr key={r.id} className="hover:bg-yellow-50/30 cursor-pointer transition-colors" onClick={() => openDetail(r)}>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-sm text-gray-800">{r.pegawai?.nama ?? '—'}</p>
                      <p className="text-xs text-gray-400">{r.pegawai?.jabatan ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        <span className="text-sm text-gray-800">{r.nama_penghargaan}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{r.jenis}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{r.pemberi ?? '—'}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{fmtDateLong(r.tanggal)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tc.chip}`}>{r.level}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDetail(r)} className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600" title="Lihat Sertifikat">
                          <Award className="w-3.5 h-3.5" />
                        </button>
                        {/* Upload sertifikat file */}
                        <label className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 cursor-pointer" title="Upload Sertifikat">
                          {uploadingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadSertifikat(r.id, f); e.target.value = ''; }} />
                        </label>
                        <button onClick={() => { setEditId(r.id); setForm({ pegawai_id: String(r.pegawai_id), nama_penghargaan: r.nama_penghargaan, jenis: r.jenis, pemberi: r.pemberi ?? '', level: r.level, tanggal: r.tanggal, deskripsi: r.deskripsi ?? '' }); setShowModal(true); }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowDeleteConfirm(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sertifikat Detail Modal */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-amber-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Sertifikat Penghargaan</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{detailData.nama_penghargaan}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintCert}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg">
                  <Printer className="w-4 h-4" /> Cetak
                </button>
                <button onClick={handleDownloadPdf} disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg">
                  {pdfLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : <><FileDown className="w-4 h-4" /> PDF</>}
                </button>
                <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 bg-gray-100">
              <div ref={certRef}>
                <SertifikatPenghargaan data={detailData} pg={detailData.pegawai} />
              </div>
            </div>
            <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Sertifikat resmi diterbitkan oleh Rumah Sakit
              </p>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Tambah/Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <h2 className="font-semibold text-gray-800">{editId ? 'Edit Penghargaan' : 'Tambah Penghargaan'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">ID Pegawai *</label>
                <input value={form.pegawai_id} onChange={e => setForm(f => ({ ...f, pegawai_id: e.target.value }))}
                  placeholder="ID pegawai (integer)"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nama Penghargaan *</label>
                <input value={form.nama_penghargaan} onChange={e => setForm(f => ({ ...f, nama_penghargaan: e.target.value }))}
                  placeholder="Contoh: Pegawai Teladan 2025"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis</label>
                  <select value={form.jenis} onChange={e => setForm(f => ({ ...f, jenis: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {JENIS_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Level</label>
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {LEVEL_LIST.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal *</label>
                  <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pemberi</label>
                  <input value={form.pemberi} onChange={e => setForm(f => ({ ...f, pemberi: e.target.value }))}
                    placeholder="RS, Pemda, Kemenkes..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Deskripsi</label>
                <textarea rows={2} value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Star className="w-4 h-4" />{editId ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold mb-2">Hapus Penghargaan?</h3>
            <p className="text-sm text-gray-500 mb-4">Data ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
