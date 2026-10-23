import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, RefreshCw, FileDown, CheckCircle, CreditCard,
  Clock, ChevronDown, ChevronUp, Trash2, Plus, X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { rbkApi } from '../data/api';
import { downloadBlob } from '../lib/downloadBlob';
import { toast } from 'sonner';

const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const fmtRp  = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const fmtPct = (n: number) => n?.toFixed(1) + '%';

const STATUS_CFG: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
  Draft:      { bg: 'bg-gray-100',  text: 'text-gray-600',  label: 'Draft',      icon: Clock },
  Approved:   { bg: 'bg-blue-50',   text: 'text-blue-700',  label: 'Approved',   icon: CheckCircle },
  Dibayarkan: { bg: 'bg-green-50',  text: 'text-green-700', label: 'Dibayarkan', icon: CreditCard },
};

// ── Expanded row breakdown ────────────────────────────────────────────────────
function ExpandedRow({ r }: { r: any }) {
  const base = (r.nilai_dasar ?? 0) * (r.indeks_jabatan ?? 1);
  return (
    <tr>
      <td colSpan={9} className="bg-gray-50 border-b border-gray-100 px-6 py-4">
        <div className="flex flex-wrap gap-6 text-xs">
          <span className="text-gray-500">Nilai Dasar × Indeks:
            <strong className="text-gray-800 ml-1">{fmtRp(base)}</strong>
          </span>
          <span className="text-gray-500">Komponen SKP (60%):
            <strong className="text-gray-800 ml-1">{fmtRp(r.komponen_skp ?? 0)}</strong>
          </span>
          <span className="text-gray-500">Komponen Kehadiran (40%):
            <strong className="text-gray-800 ml-1">{fmtRp(r.komponen_kehadiran ?? 0)}</strong>
          </span>
          <span className="text-gray-500">Potongan Alpha (5%/hari):
            <strong className="text-red-600 ml-1">-{fmtRp(r.potongan_alpha ?? 0)}</strong>
          </span>
          <span className="text-gray-500">Total RBK:
            <strong className="text-green-700 ml-1 text-sm">{fmtRp(r.total_rbk ?? 0)}</strong>
          </span>
        </div>
      </td>
    </tr>
  );
}

// ── Indeks form modal ─────────────────────────────────────────────────────────
function IndeksForm({ initial, onClose }: { initial?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    id:              initial?.id              ?? undefined,
    nama_jabatan:    initial?.nama_jabatan    ?? '',
    eselon:          initial?.eselon          ?? '',
    indeks:          initial?.indeks          ?? '1.00',
    nilai_dasar_rbk: initial?.nilai_dasar_rbk ?? '',
    keterangan:      initial?.keterangan      ?? '',
  });

  const mut = useMutation({
    mutationFn: () => rbkApi.storeIndeks({
      ...form,
      indeks:          parseFloat(form.indeks),
      nilai_dasar_rbk: parseFloat(form.nilai_dasar_rbk),
      nama_jabatan:    form.nama_jabatan || null,
      eselon:          form.eselon       || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rbk-indeks'] }); onClose(); toast.success('Indeks RBK disimpan.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal menyimpan'),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">{initial ? 'Edit' : 'Tambah'} Indeks Jabatan</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <p className="text-xs text-gray-400 mb-3">Isi nama jabatan <em>atau</em> eselon (atau keduanya dikosongkan untuk default).</p>
        {[
          { label: 'Nama Jabatan (opsional)', key: 'nama_jabatan', type: 'text' },
          { label: 'Eselon (opsional)',        key: 'eselon',       type: 'text' },
          { label: 'Indeks Multiplier',        key: 'indeks',       type: 'number' },
          { label: 'Nilai Dasar RBK (Rp)',     key: 'nilai_dasar_rbk', type: 'number' },
          { label: 'Keterangan (opsional)',    key: 'keterangan',   type: 'text' },
        ].map(f => (
          <div key={f.key} className="mb-3">
            <label className="text-xs font-medium text-gray-700 block mb-1">{f.label}</label>
            <input
              type={f.type} value={(form as any)[f.key]} onChange={set(f.key)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Indeks tab ────────────────────────────────────────────────────────────────
function IndeksTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['rbk-indeks'],
    queryFn:  () => rbkApi.indeks().then((r: any) => r.data ?? []),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => rbkApi.deleteIndeks(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rbk-indeks'] }); toast.success('Indeks dihapus.'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal menghapus'),
  });

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Tambah Indeks
          </button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Nama Jabatan', 'Eselon', 'Indeks', 'Nilai Dasar RBK', 'Keterangan', ...(isAdmin ? ['Aksi'] : [])].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: isAdmin ? 6 : 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 animate-pulse rounded" /></td>
                ))}</tr>
              ))
            ) : (data as any[])?.length === 0 ? (
              <tr><td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-gray-400 text-sm">Belum ada indeks jabatan dikonfigurasi.</td></tr>
            ) : (data as any[])?.map((k: any) => (
              <tr key={k.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{k.nama_jabatan ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-gray-600">{k.eselon ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 font-mono text-gray-800">{parseFloat(k.indeks).toFixed(2)}×</td>
                <td className="px-4 py-3 font-mono text-gray-800">{fmtRp(k.nilai_dasar_rbk)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{k.keterangan ?? '—'}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(k); setShowForm(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs">Edit</button>
                      <button onClick={() => { if (confirm('Hapus indeks ini?')) deleteMut.mutate(k.id); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && <IndeksForm initial={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RBK() {
  const { currentUser } = useAppContext();
  const qc = useQueryClient();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'direktur';

  const now = new Date();
  const [bulan, setBulan]     = useState(now.getMonth() + 1);
  const [tahun, setTahun]     = useState(now.getFullYear());
  const [expanded, setExpanded] = useState<number | null>(null);
  const [tab, setTab]         = useState<'list' | 'indeks'>('list');
  const [page, setPage]       = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rbk', bulan, tahun, page],
    queryFn:  () => rbkApi.getAll({ bulan, tahun, page }),
  });

  const rows: any[] = (data as any)?.data?.data ?? [];
  const meta: any   = (data as any)?.data ?? {};
  const totalPages  = meta?.last_page ?? 1;

  const summary = useMemo(() => rows.reduce((acc: any, r: any) => ({
    total:      acc.total + 1,
    totalRbk:   acc.totalRbk + (r.total_rbk ?? 0),
    draft:      acc.draft      + (r.status === 'Draft'      ? 1 : 0),
    approved:   acc.approved   + (r.status === 'Approved'   ? 1 : 0),
    dibayarkan: acc.dibayarkan + (r.status === 'Dibayarkan' ? 1 : 0),
  }), { total: 0, totalRbk: 0, draft: 0, approved: 0, dibayarkan: 0 }), [rows]);

  const avgRbk = summary.total > 0 ? summary.totalRbk / summary.total : 0;

  const bulkMut = useMutation({
    mutationFn: () => rbkApi.bulkGenerate(bulan, tahun),
    onSuccess: (res: any) => { toast.success(`RBK berhasil digenerate: ${res.success} pegawai`); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal generate'),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => rbkApi.approve(id),
    onSuccess: () => { toast.success('RBK disetujui'); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal menyetujui'),
  });

  const bayarMut = useMutation({
    mutationFn: (id: number) => rbkApi.bayar(id),
    onSuccess: () => { toast.success('RBK ditandai dibayarkan'); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal menandai'),
  });

  const handleExport = async () => {
    try {
      const res = await rbkApi.export(bulan, tahun);
      downloadBlob(res.data as Blob, `rbk-${bulan}-${tahun}.xlsx`);
    } catch {
      toast.error('Gagal mengunduh Excel');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">RBK — Remunerasi Berbasis Kinerja</h1>
            <p className="text-xs text-gray-400">Nilai dasar × indeks jabatan × capaian SKP × capaian kehadiran (RS BLUD)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={bulan} onChange={e => { setBulan(+e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{BULAN[i + 1]}</option>
            ))}
          </select>
          <input type="number" value={tahun} onChange={e => { setTahun(+e.target.value); setPage(1); }}
            className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {isAdmin && (
            <button onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${bulkMut.isPending ? 'animate-spin' : ''}`} />
              Generate Semua
            </button>
          )}
          <button onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
            <FileDown className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Pegawai</p>
          <p className="font-bold text-xl text-purple-700">{summary.total}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total RBK Bulan Ini</p>
          <p className="font-bold text-xl text-emerald-700 leading-tight">{fmtRp(summary.totalRbk)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Rata-rata RBK</p>
          <p className="font-bold text-xl text-gray-800">{fmtRp(avgRbk)}</p>
          <div className="flex gap-2 text-xs mt-1">
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">D: {summary.draft}</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">A: {summary.approved}</span>
            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">P: {summary.dibayarkan}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['list', 'indeks'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'list' ? 'Daftar RBK' : 'Indeks Jabatan'}
          </button>
        ))}
      </div>

      {tab === 'indeks' ? <IndeksTab isAdmin={isAdmin} /> : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Pegawai', 'Indeks', 'Nilai Dasar', 'Capaian SKP%', 'Capaian Hadir%', 'Potongan', 'Total RBK', 'Status', 'Aksi']
                    .map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 animate-pulse rounded" /></td>
                    ))}</tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                      <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p>Belum ada data RBK untuk periode ini.</p>
                      {isAdmin && <p className="text-xs mt-1">Klik "Generate Semua" untuk menghitung RBK.</p>}
                    </td>
                  </tr>
                ) : rows.map((r: any) => {
                  const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.Draft;
                  const Icon = cfg.icon;
                  const isExpanded = expanded === r.id;
                  const indeksLabel = r.indeks?.nama_jabatan ?? r.indeks?.eselon ?? '—';
                  return (
                    <React.Fragment key={r.id}>
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 leading-tight">{r.pegawai?.nama ?? '—'}</p>
                          <p className="text-xs text-gray-400 font-mono">{r.pegawai?.nip ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          <span>{indeksLabel}</span>
                          <span className="ml-1 font-mono text-purple-600">{parseFloat(r.indeks_jabatan ?? 1).toFixed(2)}×</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-mono whitespace-nowrap">{fmtRp(r.nilai_dasar ?? 0)}</td>
                        <td className="px-4 py-3 text-xs text-center">{fmtPct(r.capaian_skp)}</td>
                        <td className="px-4 py-3 text-xs text-center">{fmtPct(r.capaian_kehadiran)}</td>
                        <td className="px-4 py-3 text-xs text-right text-red-600 whitespace-nowrap">-{fmtRp(r.potongan_alpha ?? 0)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{fmtRp(r.total_rbk ?? 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                            <Icon className="w-3 h-3" />{cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setExpanded(prev => prev === r.id ? null : r.id)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            {isAdmin && r.status === 'Draft' && (
                              <button onClick={() => approveMut.mutate(r.id)} disabled={approveMut.isPending}
                                title="Setujui" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isAdmin && r.status === 'Approved' && (
                              <button onClick={() => bayarMut.mutate(r.id)} disabled={bayarMut.isPending}
                                title="Tandai Dibayar" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40">
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && <ExpandedRow r={r} />}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">Halaman {page} dari {totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
