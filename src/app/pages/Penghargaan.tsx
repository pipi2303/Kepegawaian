import React, { useState, useMemo, useRef } from 'react';
import {
  Award, Search, Plus, Edit2, Trash2, X, Star,
  Printer, Medal, Shield, CheckCircle2, Calendar, FileDown, Loader2,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { PenghargaanRecord, JenisPenghargaan } from '../types';
import { toast } from 'sonner';
// jsPDF & html2canvas diimpor secara dinamis di dalam fungsi untuk menghindari
// module-load failure yang bisa crash seluruh app

const tingkatConfig: Record<string, { chip: string; ribbon: string; label: string }> = {
  'Nasional':        { chip: 'bg-red-100 text-red-700 border border-red-200',       ribbon: 'from-red-600 to-red-800',     label: 'Nasional'        },
  'Provinsi':        { chip: 'bg-orange-100 text-orange-700 border border-orange-200', ribbon: 'from-orange-500 to-orange-700', label: 'Provinsi'     },
  'Kota/Kabupaten':  { chip: 'bg-yellow-100 text-yellow-700 border border-yellow-200', ribbon: 'from-yellow-500 to-yellow-700', label: 'Kota/Kab.'    },
  'Instansi':        { chip: 'bg-blue-100 text-blue-700 border border-blue-200',      ribbon: 'from-blue-600 to-blue-800',   label: 'Instansi'       },
};

const jenisList: JenisPenghargaan[] = [
  'Satyalancana Karya Satya 10 Tahun', 'Satyalancana Karya Satya 20 Tahun', 'Satyalancana Karya Satya 30 Tahun',
  'ASN Teladan Tingkat Nasional', 'ASN Teladan Tingkat Provinsi', 'Nakes Teladan RS',
  'Pegawai Inovatif', 'Penghargaan Direktur', 'Penghargaan Gubernur', 'Penghargaan Presiden', 'Penghargaan Lainnya',
];

function fmtDateLong(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Sertifikat Component ────────────────────────────────────────────────────
function SertifikatPenghargaan({ data, pg, isPrint = false }: {
  data: PenghargaanRecord;
  pg: ReturnType<typeof Array.prototype.find>;
  isPrint?: boolean;
}) {
  const getFullName = () => {
    if (!pg) return '—';
    return `${pg.gelarDepan ? pg.gelarDepan + ' ' : ''}${pg.nama}${pg.gelarBelakang ? ', ' + pg.gelarBelakang : ''}`;
  };

  const tingkat = tingkatConfig[data.tingkat] ?? tingkatConfig['Instansi'];

  return (
    <div
      className={`relative bg-white ${isPrint ? 'p-0' : ''}`}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Ornamental outer border */}
      <div className="relative border-[6px] border-double border-yellow-600 rounded-sm m-0 overflow-hidden"
        style={{ minHeight: isPrint ? '680px' : undefined }}>

        {/* Gold gradient header band */}
        <div className={`bg-gradient-to-r ${tingkat.ribbon} px-6 py-4 text-center`}>
          {/* Hospital header */}
          <p className="text-yellow-100 text-[11px] tracking-widest uppercase">Pemerintah Provinsi Lampung</p>
          <p className="text-white font-bold text-[15px] tracking-wider mt-0.5 uppercase">
            Rumah Sakit Umum Daerah
          </p>
          <p className="text-yellow-200 text-[10px] tracking-widest mt-0.5">
            Jl. Dr. Rivai No. 6, Bandar Lampung · Telp. (0721) 703312
          </p>
        </div>

        {/* Inner ornament line */}
        <div className="flex items-center gap-2 px-6 py-2 bg-yellow-50 border-y border-yellow-300">
          <div className="flex-1 h-px bg-yellow-400" />
          <Medal className="w-4 h-4 text-yellow-600" />
          <Star className="w-3 h-3 text-yellow-500" />
          <Award className="w-5 h-5 text-yellow-600" />
          <Star className="w-3 h-3 text-yellow-500" />
          <Medal className="w-4 h-4 text-yellow-600" />
          <div className="flex-1 h-px bg-yellow-400" />
        </div>

        {/* Certificate body */}
        <div className="px-8 py-6 text-center space-y-4 bg-[#fffdf5]">
          {/* Title */}
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-yellow-700 font-medium">Nomor: {data.nomorSK || '—'}</p>
            <h1 className="text-[26px] font-bold text-gray-800 mt-2 tracking-wider uppercase"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>
              Sertifikat Penghargaan
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent max-w-[100px]" />
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent max-w-[100px]" />
            </div>
          </div>

          {/* Awarded to */}
          <div>
            <p className="text-[12px] text-gray-500 italic">Diberikan dengan bangga kepada:</p>

            {/* Recipient block */}
            <div className="mt-3 border-b-2 border-t-2 border-yellow-400 py-4 bg-white mx-4 rounded-sm">
              <p className="text-[22px] font-bold text-gray-900"
                style={{ fontFamily: 'Georgia, serif' }}>
                {getFullName()}
              </p>
              <p className="text-[12px] text-gray-500 mt-1 font-mono tracking-wider">NIP. {pg?.nip || '—'}</p>
              <p className="text-[12px] text-gray-600 mt-1">{pg?.jabatan || '—'}</p>
              <p className="text-[11px] text-gray-400">{pg?.unitKerja || '—'}</p>
            </div>

            {/* Award description */}
            <div className="mt-4 space-y-2">
              <p className="text-[12px] text-gray-500 italic">atas prestasi dan dedikasi dalam</p>
              <p className="text-[17px] font-bold text-gray-800 px-4 leading-snug"
                style={{ fontFamily: 'Georgia, serif' }}>
                {data.jenisPenghargaan}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className={`text-[11px] px-3 py-1 rounded-full font-semibold ${tingkat.chip}`}>
                  Tingkat {data.tingkat}
                </span>
                {data.instansiPemberi && (
                  <span className="text-[11px] text-gray-500">· {data.instansiPemberi}</span>
                )}
              </div>
            </div>

            {/* Keterangan */}
            {data.keterangan && (
              <p className="text-[11px] text-gray-500 italic mt-3 px-6 border-l-2 border-yellow-300 text-left mx-8">
                {data.keterangan}
              </p>
            )}
          </div>

          {/* Date & Signature */}
          <div className="flex justify-between items-end mt-6 px-4">
            {/* Official seal placeholder */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-yellow-400 flex flex-col items-center justify-center text-center bg-yellow-50">
                <Shield className="w-6 h-6 text-yellow-500" />
                <p className="text-[8px] text-yellow-600 font-bold mt-0.5">STEMPEL</p>
                <p className="text-[8px] text-yellow-600">RESMI</p>
              </div>
              <p className="text-[9px] text-gray-400">Cap Dinas</p>
            </div>

            {/* Signature block */}
            <div className="text-right">
              <p className="text-[11px] text-gray-600">Ditetapkan di Bandar Lampung</p>
              <p className="text-[11px] text-gray-600">pada tanggal {fmtDateLong(data.tanggalPemberian)}</p>
              <p className="text-[11px] font-bold text-gray-800 mt-2 uppercase tracking-wide">
                Direktur Rumah Sakit
              </p>
              <p className="text-[10px] text-gray-500">Provinsi Lampung,</p>
              <div className="h-14" />
              <p className="text-[12px] font-bold text-gray-900 underline" style={{ fontFamily: 'Georgia, serif' }}>
                dr. IMAM GHOZALI, Sp.An., M.Kes.
              </p>
              <p className="text-[10px] text-gray-500">NIP. 19680415 199703 1 001</p>
            </div>
          </div>

          {/* Verification strip */}
          <div className="mt-4 border-t border-yellow-300 pt-3 flex items-center justify-center gap-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">
              Sertifikat ini diterbitkan secara resmi oleh Rumah Sakit Provinsi Lampung
            </p>
          </div>
        </div>

        {/* Bottom gold band */}
        <div className={`bg-gradient-to-r ${tingkat.ribbon} px-6 py-2 flex items-center justify-between`}>
          <p className="text-yellow-100 text-[9px] tracking-wider">© HCMS Application</p>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 text-yellow-300" />)}
          </div>
          <p className="text-yellow-100 text-[9px] tracking-wider">Dokumen Kepegawaian Resmi</p>
        </div>

      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Penghargaan() {
  const { penghargaan, pegawai, addPenghargaan, updatePenghargaan, deletePenghargaan } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<PenghargaanRecord | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const empty: Omit<PenghargaanRecord, 'id'> = {
    pegawaiId: '', jenisPenghargaan: 'Satyalancana Karya Satya 10 Tahun',
    tanggalPemberian: '', nomorSK: '', instansiPemberi: '', tingkat: 'Nasional', keterangan: '',
  };
  const [form, setForm] = useState<Omit<PenghargaanRecord, 'id'>>(empty);

  const getFullName = (id: string) => {
    const p = pegawai.find(x => x.id === id);
    if (!p) return '—';
    return `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`;
  };

  const getEligibleSatyalancana = () => {
    return pegawai.filter(p => {
      const tgl = new Date(p.tanggalMasuk);
      const masaKerja = Math.floor((Date.now() - tgl.getTime()) / (365.25 * 24 * 3600 * 1000));
      const sudahDapat = penghargaan.filter(ph => ph.pegawaiId === p.id && ph.jenisPenghargaan.startsWith('Satyalancana'));
      const tertinggi = sudahDapat.reduce((max, ph) => {
        const thn = parseInt(ph.jenisPenghargaan.match(/\d+/)?.[0] || '0');
        return Math.max(max, thn);
      }, 0);
      return (masaKerja >= 10 && tertinggi < 10) || (masaKerja >= 20 && tertinggi < 20) || (masaKerja >= 30 && tertinggi < 30);
    });
  };

  const eligible = useMemo(getEligibleSatyalancana, [pegawai, penghargaan]);

  const filtered = useMemo(() => penghargaan.filter(p => {
    const nm = getFullName(p.pegawaiId).toLowerCase();
    const ok = !search || nm.includes(search.toLowerCase()) || p.jenisPenghargaan.toLowerCase().includes(search.toLowerCase());
    const okT = !filterTingkat || p.tingkat === filterTingkat;
    return ok && okT;
  }), [penghargaan, search, filterTingkat, pegawai]);

  const handleSave = () => {
    if (!form.pegawaiId || !form.tanggalPemberian) { toast.error('Harap isi field wajib'); return; }
    if (editId) { updatePenghargaan({ ...form, id: editId }); toast.success('Data penghargaan diperbarui'); }
    else { addPenghargaan(form); toast.success('Penghargaan berhasil ditambahkan'); }
    setShowModal(false);
  };

  const openDetail = (p: PenghargaanRecord) => { setDetailData(p); setShowDetailModal(true); };

  const handlePrintCert = () => {
    const el = certRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>Sertifikat Penghargaan</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; background: white; }
        @media print { @page { size: A4 landscape; margin: 10mm; } }
      </style>
      </head><body>
      ${el.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const handleDownloadPdf = async () => {
    const el = certRef.current;
    if (!el || !detailData) return;
    setPdfLoading(true);

    // Clone element ke document.body agar tidak terpotong oleh overflow modal
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      z-index: -9999;
      width: ${el.scrollWidth}px;
      background: #ffffff;
      font-family: 'Times New Roman', Times, serif;
    `;
    document.body.appendChild(clone);

    try {
      await new Promise(r => setTimeout(r, 150));

      // Resolve oklch() → rgb() menggunakan canvas 1px trick
      // html2canvas v1 tidak mendukung oklch (Tailwind v4 default)
      const resolveOklch = (css: string): string => {
        return css.replace(/oklch\(([^)]+)\)/g, (match) => {
          try {
            const tmp = document.createElement('canvas');
            tmp.width = tmp.height = 1;
            const ctx = tmp.getContext('2d');
            if (!ctx) return '#000';
            ctx.fillStyle = match;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            if (a === 0) return 'transparent';
            return `rgb(${r},${g},${b})`;
          } catch {
            return '#000';
          }
        });
      };

      // Dynamic import untuk menghindari top-level module crash
      const [html2canvasModule, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        // Patch oklch di semua <style> pada cloned document
        onclone: (_clonedDoc: Document) => {
          const styleEls = _clonedDoc.querySelectorAll('style');
          styleEls.forEach((styleEl) => {
            if (styleEl.textContent?.includes('oklch')) {
              styleEl.textContent = resolveOklch(styleEl.textContent);
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let imgW = pageW - 16;
      let imgH = imgW / ratio;
      if (imgH > pageH - 16) { imgH = pageH - 16; imgW = imgH * ratio; }
      const x = (pageW - imgW) / 2;
      const y = (pageH - imgH) / 2;
      pdf.addImage(imgData, 'JPEG', x, y, imgW, imgH);
      const namaFile = `Sertifikat_${detailData.jenisPenghargaan.replace(/\s+/g, '_')}_${detailData.pegawaiId}.pdf`;
      pdf.save(namaFile);
      toast.success('PDF berhasil diunduh');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Gagal mengunduh PDF, coba gunakan tombol Cetak');
    } finally {
      if (document.body.contains(clone)) document.body.removeChild(clone);
      setPdfLoading(false);
    }
  };

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
        <button
          onClick={() => { setEditId(null); setForm(empty); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Penghargaan', value: penghargaan.length, sub: 'Semua jenis', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Award },
          { label: 'Satyalancana', value: penghargaan.filter(p => p.jenisPenghargaan.startsWith('Satyal')).length, sub: 'Karya Satya', color: 'text-red-600', bg: 'bg-red-50', icon: Medal },
          { label: 'Teladan & Inovatif', value: penghargaan.filter(p => p.jenisPenghargaan.includes('Teladan') || p.jenisPenghargaan.includes('Inovatif')).length, sub: 'Prestasi terbaik', color: 'text-blue-600', bg: 'bg-blue-50', icon: Star },
          { label: 'Eligible Satyalancana', value: eligible.length, sub: 'Segera diusulkan', color: eligible.length > 0 ? 'text-orange-600' : 'text-gray-500', bg: eligible.length > 0 ? 'bg-orange-50' : 'bg-gray-50', icon: Calendar },
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau jenis penghargaan..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterTingkat} onChange={e => setFilterTingkat(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="">Semua Tingkat</option>
            {['Nasional', 'Provinsi', 'Kota/Kabupaten', 'Instansi'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis Penghargaan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Instansi Pemberi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tanggal</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Tingkat</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0
                ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada data penghargaan</td></tr>
                : filtered.map(p => {
                  const tc = tingkatConfig[p.tingkat] ?? tingkatConfig['Instansi'];
                  return (
                    <tr key={p.id} className="hover:bg-yellow-50/30 cursor-pointer transition-colors" onClick={() => openDetail(p)}>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-sm text-gray-800">{getFullName(p.pegawaiId)}</p>
                        <p className="text-xs text-gray-400">{pegawai.find(x => x.id === p.pegawaiId)?.jabatan}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm text-gray-800">{p.jenisPenghargaan}</span>
                        </div>
                        {p.nomorSK && <p className="text-xs font-mono text-gray-400 mt-0.5">{p.nomorSK}</p>}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{p.instansiPemberi}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{fmtDateLong(p.tanggalPemberian)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tc.chip}`}>{p.tingkat}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openDetail(p)} className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600" title="Lihat Sertifikat">
                            <Award className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditId(p.id);
                              setForm({ pegawaiId: p.pegawaiId, jenisPenghargaan: p.jenisPenghargaan, tanggalPemberian: p.tanggalPemberian, nomorSK: p.nomorSK || '', instansiPemberi: p.instansiPemberi, tingkat: p.tingkat, keterangan: p.keterangan || '' });
                              setShowModal(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setShowDeleteConfirm(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Sertifikat Detail Modal ─────────────────────────────────────── */}
      {showDetailModal && detailData && (() => {
        const pg = pegawai.find(x => x.id === detailData.pegawaiId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">

              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-amber-50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">Sertifikat Penghargaan</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{detailData.nomorSK || 'No. Sertifikat belum diisi'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintCert}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Cetak
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {pdfLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                      : <><FileDown className="w-4 h-4" /> PDF</>
                    }
                  </button>
                  <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Certificate preview */}
              <div className="flex-1 overflow-y-auto p-5 bg-gray-100">
                <div ref={certRef}>
                  <SertifikatPenghargaan data={detailData} pg={pg} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Sertifikat resmi diterbitkan oleh Rumah Sakit
                </p>
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                  Tutup
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─── Form Modal ──────────────────────────────────────────────────── */}
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
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select
                  value={form.pegawaiId}
                  onChange={e => setForm(f => ({ ...f, pegawaiId: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Penghargaan *</label>
                <select
                  value={form.jenisPenghargaan}
                  onChange={e => setForm(f => ({ ...f, jenisPenghargaan: e.target.value as JenisPenghargaan }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {jenisList.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Pemberian *</label>
                  <input
                    type="date" value={form.tanggalPemberian}
                    onChange={e => setForm(f => ({ ...f, tanggalPemberian: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tingkat</label>
                  <select
                    value={form.tingkat}
                    onChange={e => setForm(f => ({ ...f, tingkat: e.target.value as PenghargaanRecord['tingkat'] }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Nasional', 'Provinsi', 'Kota/Kabupaten', 'Instansi'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Instansi Pemberi</label>
                <input
                  value={form.instansiPemberi}
                  onChange={e => setForm(f => ({ ...f, instansiPemberi: e.target.value }))}
                  placeholder="Contoh: Gubernur Provinsi Lampung"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK / Sertifikat</label>
                <input
                  value={form.nomorSK || ''}
                  onChange={e => setForm(f => ({ ...f, nomorSK: e.target.value }))}
                  placeholder="Contoh: SK.800/PGH-001/2024"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Keterangan</label>
                <textarea
                  rows={2} value={form.keterangan || ''}
                  onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                  placeholder="Keterangan tambahan tentang penghargaan ini..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Star className="w-4 h-4" />
                {editId ? 'Perbarui' : 'Simpan'}
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
              <button
                onClick={() => { deletePenghargaan(showDeleteConfirm); toast.success('Data dihapus'); setShowDeleteConfirm(null); }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}