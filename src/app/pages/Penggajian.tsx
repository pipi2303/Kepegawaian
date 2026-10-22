import React, { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  DollarSign, Search, Eye, CheckCircle, Clock, CreditCard,
  ChevronLeft, ChevronRight, FileDown, RefreshCw, X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { usePayroll, useGeneratePayroll } from '../hooks';
import { payrollApi } from '../data/api';
import { downloadBlob } from '../lib/downloadBlob';
import { toast } from 'sonner';

const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const fmtRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

const STATUS_CFG: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
  Draft:        { bg: 'bg-gray-100',  text: 'text-gray-600',  label: 'Draft',       icon: Clock },
  Approved:     { bg: 'bg-blue-50',   text: 'text-blue-700',  label: 'Approved',    icon: CheckCircle },
  Dibayarkan:   { bg: 'bg-green-50',  text: 'text-green-700', label: 'Dibayarkan',  icon: CreditCard },
};

// ── Generate single-slip modal ────────────────────────────────────────────────
function GenerateModal({ pegawaiId, bulan, tahun, onClose }: {
  pegawaiId: number; bulan: number; tahun: number; onClose: () => void;
}) {
  const [tukin, setTukin] = useState('0');
  const genMut = useGeneratePayroll();

  const submit = () => {
    genMut.mutate(
      { pegawai_id: pegawaiId, bulan, tahun, tunjangan_kinerja: parseFloat(tukin) || 0 },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Generate Slip Gaji</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Periode: {BULAN[bulan]} {tahun}</p>
        <label className="text-xs font-medium text-gray-700 block mb-1">Tunjangan Kinerja (opsional)</label>
        <input
          type="number" min="0" value={tukin}
          onChange={e => setTukin(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={submit} disabled={genMut.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {genMut.isPending ? 'Memproses...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Expand row detail ─────────────────────────────────────────────────────────
function ExpandedDetail({ slip }: { slip: any }) {
  const penerimaan: any[] = slip.details?.filter((d: any) => d.tipe === 'penerimaan') ?? [];
  const potongan: any[]   = slip.details?.filter((d: any) => d.tipe === 'potongan')   ?? [];

  return (
    <tr>
      <td colSpan={7} className="bg-gray-50 border-b border-gray-100 px-6 py-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Penerimaan</p>
            {penerimaan.length === 0
              ? <p className="text-xs text-gray-400">—</p>
              : penerimaan.map((d: any, i: number) => (
                <div key={i} className="flex justify-between text-xs text-gray-700 py-0.5">
                  <span>{d.nama_komponen}</span>
                  <span>{fmtRp(d.jumlah)}</span>
                </div>
              ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wide">Potongan</p>
            {potongan.length === 0
              ? <p className="text-xs text-gray-400">—</p>
              : potongan.map((d: any, i: number) => (
                <div key={i} className="flex justify-between text-xs text-gray-700 py-0.5">
                  <span>{d.nama_komponen}</span>
                  <span className="text-red-600">-{fmtRp(d.jumlah)}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-6 text-xs">
          <span className="text-gray-500">Total Bruto: <strong className="text-gray-800">{fmtRp(slip.total_bruto ?? 0)}</strong></span>
          <span className="text-gray-500">Total Potongan: <strong className="text-red-600">-{fmtRp(slip.total_potongan ?? 0)}</strong></span>
          <span className="text-gray-500">NETTO: <strong className="text-gray-900 text-sm">{fmtRp(slip.total_netto ?? 0)}</strong></span>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Penggajian() {
  const { currentUser } = useAppContext();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'direktur';

  const now = new Date();
  const [bulan, setBulan]             = useState(now.getMonth() + 1);
  const [tahun, setTahun]             = useState(now.getFullYear());
  const [expanded, setExpanded]       = useState<number | null>(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(1);
  const [generateFor, setGenerateFor] = useState<number | null>(null); // pegawai_id

  const { data, isLoading, refetch } = usePayroll({
    bulan, tahun, search: search || undefined,
    status_pembayaran: statusFilter || undefined,
    page,
  });

  // data may be array or paginated object
  const rows: any[]  = Array.isArray(data) ? data : (data?.data ?? []);
  const meta: any    = Array.isArray(data) ? null : data?.meta;
  const totalPages   = meta?.last_page ?? 1;

  // Summary from current page
  const summary = useMemo(() => rows.reduce((acc: any, r: any) => ({
    count:    acc.count + 1,
    bruto:    acc.bruto    + (r.total_bruto    ?? 0),
    potongan: acc.potongan + (r.total_potongan ?? 0),
    netto:    acc.netto    + (r.total_netto    ?? 0),
  }), { count: 0, bruto: 0, potongan: 0, netto: 0 }), [rows]);

  const bulkGenMut = useMutation({
    mutationFn: () => payrollApi.bulkGenerate(bulan, tahun),
    onSuccess: (res: any) => {
      toast.success(`${res.data?.generated ?? 0} slip gaji berhasil digenerate`);
      refetch();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Backend tidak tersedia'),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => payrollApi.approve(id),
    onSuccess: () => { toast.success('Slip gaji disetujui'); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal menyetujui'),
  });

  const bayarMut = useMutation({
    mutationFn: (id: number) => payrollApi.bayar(id),
    onSuccess: () => { toast.success('Ditandai sebagai dibayarkan'); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal menandai'),
  });

  const handlePdf = async (id: number) => {
    try {
      const res = await payrollApi.downloadPdf(id);
      downloadBlob(res.data as Blob, `slip-gaji-${id}.pdf`);
    } catch {
      toast.error('Gagal mengunduh PDF');
    }
  };

  const toggleExpand = (id: number) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Penggajian & Slip Gaji</h1>
            <p className="text-xs text-gray-400">Manajemen penggajian pegawai rumah sakit</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selectors */}
          <select value={bulan} onChange={e => { setBulan(+e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{BULAN[i + 1]}</option>
            ))}
          </select>
          <input type="number" value={tahun} onChange={e => { setTahun(+e.target.value); setPage(1); }}
            className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

          {isAdmin && (
            <button onClick={() => bulkGenMut.mutate()} disabled={bulkGenMut.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${bulkGenMut.isPending ? 'animate-spin' : ''}`} />
              Generate Semua
            </button>
          )}

          <button disabled title="Segera hadir"
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-sm text-gray-400 rounded-lg cursor-not-allowed">
            <FileDown className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Pegawai Digaji', value: summary.count,    fmt: (n: number) => n.toString(), color: 'text-blue-700',  bg: 'bg-blue-50' },
          { label: 'Total Bruto',          value: summary.bruto,    fmt: fmtRp,                      color: 'text-gray-800',  bg: 'bg-white'   },
          { label: 'Total Potongan',        value: summary.potongan, fmt: fmtRp,                      color: 'text-red-600',   bg: 'bg-red-50'  },
          { label: 'Total Netto',           value: summary.netto,    fmt: fmtRp,                      color: 'text-green-700', bg: 'bg-green-50' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl border border-gray-100 p-4`}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`font-bold text-lg leading-tight ${c.color}`}>{c.fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama / NIP..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Dibayarkan">Dibayarkan</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Jabatan / Unit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Gaji Pokok</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Netto</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>Belum ada slip gaji untuk periode ini.</p>
                    {isAdmin && <p className="text-xs mt-1">Klik "Generate Semua" untuk membuat slip gaji.</p>}
                  </td>
                </tr>
              ) : rows.map((r: any) => {
                const cfg = STATUS_CFG[r.status_pembayaran] ?? STATUS_CFG.Draft;
                const Icon = cfg.icon;
                const isExpanded = expanded === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800 leading-tight">{r.pegawai?.nama ?? '—'}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{r.pegawai?.nip ?? ''}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-sm text-gray-700 leading-tight">{r.pegawai?.jabatan ?? '—'}</p>
                        <p className="text-xs text-gray-400">{r.pegawai?.unit_kerja ?? ''}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-right text-xs text-gray-700">
                        {fmtRp(r.gaji_pokok ?? 0)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                        {fmtRp(r.total_netto ?? 0)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Detail expand */}
                          <button onClick={() => toggleExpand(r.id)}
                            title="Detail" className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:bg-blue-50'}`}>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Approve — admin only, Draft only */}
                          {isAdmin && r.status_pembayaran === 'Draft' && (
                            <button onClick={() => approveMut.mutate(r.id)} disabled={approveMut.isPending}
                              title="Setujui" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Bayar — Approved only */}
                          {r.status_pembayaran === 'Approved' && (
                            <button onClick={() => bayarMut.mutate(r.id)} disabled={bayarMut.isPending}
                              title="Tandai Dibayar" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40">
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* PDF download */}
                          <button onClick={() => handlePdf(r.id)}
                            title="Download PDF" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          {/* Generate / Regenerate per row */}
                          {isAdmin && (
                            <button onClick={() => setGenerateFor(r.pegawai?.id ?? r.pegawai_id)}
                              title="Regenerate" className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && <ExpandedDetail slip={r} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Halaman {page} dari {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === pg ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generate single modal */}
      {generateFor !== null && (
        <GenerateModal
          pegawaiId={generateFor}
          bulan={bulan}
          tahun={tahun}
          onClose={() => { setGenerateFor(null); refetch(); }}
        />
      )}
    </div>
  );
}
