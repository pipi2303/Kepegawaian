import React, { useState } from 'react';
import { Gift, Plus, Check, X, Info, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

// ── Types ─────────────────────────────────────────────────────────────────────

type THRRecord = {
  id: number;
  pegawai_id: number;
  tahun: number;
  hari_raya: string;
  masa_kerja_bulan: number;
  formula: 'Penuh' | 'Proporsional';
  gaji_dasar: number;
  jumlah_thr: number;
  status: 'Draft' | 'Approved' | 'Dibayarkan';
  tanggal_bayar?: string;
  pegawai?: { nama: string; nip: string; jabatan: string; unit_kerja: string; status_pegawai: string };
};

type ListResponse = { data: THRRecord[]; total_thr: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Approved: 'bg-blue-100 text-blue-700',
  Dibayarkan: 'bg-green-100 text-green-700',
};

const formulaColor: Record<string, string> = {
  Penuh: 'bg-green-100 text-green-700',
  Proporsional: 'bg-yellow-100 text-yellow-700',
};

const now = new Date();
const TAHUN_LIST = [2024, 2025, 2026, 2027];
const HARI_RAYA_LIST = ['Idul Fitri', 'Idul Adha', 'Natal', 'Tahun Baru', 'Lainnya'];

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';
const btnGreen = 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50';
const btnSecondary = 'px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50';

// ── Component ─────────────────────────────────────────────────────────────────

export default function THR() {
  const qc = useQueryClient();

  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [hariRaya, setHariRaya] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ tahun: String(now.getFullYear()), hari_raya: 'Idul Fitri' });
  const [genResult, setGenResult] = useState<{ created: number; skipped: number } | null>(null);

  const [showApprove, setShowApprove] = useState(false);
  const [tanggalBayar, setTanggalBayar] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ['thr', tahun, hariRaya, filterStatus],
    queryFn: () =>
      http
        .get('/thr', {
          params: {
            tahun,
            hari_raya: hariRaya || undefined,
            status: filterStatus || undefined,
          },
        })
        .then(r => r.data),
    staleTime: 30000,
  });

  const list: THRRecord[] = (data as any)?.data?.data ?? (data as any)?.data ?? [];
  const totalTHR: number = data?.total_thr ?? 0;

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const generateMut = useMutation({
    mutationFn: (d: { tahun: string; hari_raya: string }) =>
      http.post('/thr/generate-bulk', d).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['thr'] });
      setGenResult(res);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal generate THR'),
  });

  const approveMut = useMutation({
    mutationFn: ({ ids, tanggal_bayar }: { ids: number[]; tanggal_bayar: string }) =>
      http.post('/thr/approve', { ids, tanggal_bayar }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thr'] });
      toast.success('THR berhasil diapprove');
      setSelectedIds([]);
      setShowApprove(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal approve THR'),
  });

  const dibayarMut = useMutation({
    mutationFn: (ids: number[]) => http.post('/thr/dibayar', { ids }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thr'] });
      toast.success('THR ditandai dibayarkan');
      setSelectedIds([]);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal update status'),
  });

  // ── Checkbox helpers ──────────────────────────────────────────────────────────

  const toggleAll = () =>
    setSelectedIds(prev => (prev.length === list.length ? [] : list.map(r => r.id)));

  const toggleOne = (id: number) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Gift className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tunjangan Hari Raya (THR)</h1>
            <p className="text-sm text-gray-500">PP 36/2021</p>
          </div>
        </div>
        <button
          onClick={() => { setShowGenerate(true); setGenResult(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Generate Bulk
        </button>
      </div>

      {/* Info */}
      <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          <strong>PP 36/2021:</strong> Masa kerja ≥ 12 bulan = 1 bulan gaji (Penuh). Masa kerja &lt; 12 bulan =
          (masa kerja / 12) × gaji (Proporsional). Wajib dibayar paling lambat 7 hari sebelum hari raya.
        </span>
      </div>

      {/* Total Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">Total THR {tahun} {hariRaya && `— ${hariRaya}`}</p>
        <p className="text-4xl font-bold mt-1">{fmtRp(totalTHR)}</p>
        <p className="text-xs opacity-70 mt-1">{list.length} pegawai</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <select
          value={tahun}
          onChange={e => setTahun(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {TAHUN_LIST.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={hariRaya}
          onChange={e => setHariRaya(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Semua Hari Raya</option>
          {HARI_RAYA_LIST.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Semua Status</option>
          <option value="Draft">Draft</option>
          <option value="Approved">Approved</option>
          <option value="Dibayarkan">Dibayarkan</option>
        </select>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex gap-2 ml-auto">
            <span className="self-center text-sm text-gray-500">{selectedIds.length} dipilih</span>
            <button
              onClick={() => setShowApprove(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Check className="w-4 h-4 inline mr-1" />Approve
            </button>
            <button
              onClick={() => dibayarMut.mutate(selectedIds)}
              disabled={dibayarMut.isPending}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              Tandai Dibayar
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={list.length > 0 && selectedIds.length === list.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                {['NIP', 'Nama', 'Unit', 'Masa Kerja', 'Formula', 'Gaji Dasar', 'Jumlah THR', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Tidak ada data THR</td></tr>
              ) : (
                list.map(row => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleOne(row.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.pegawai?.nip ?? '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.pegawai?.nama ?? `ID ${row.pegawai_id}`}</p>
                      <p className="text-xs text-gray-400">{row.pegawai?.jabatan}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{row.pegawai?.unit_kerja}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-700 font-medium">{row.masa_kerja_bulan}</span>
                      <span className="text-xs text-gray-400 ml-1">bln</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${formulaColor[row.formula]}`}>
                        {row.formula}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtRp(row.gaji_dasar)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-700">{fmtRp(row.jumlah_thr)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <Modal title="Generate THR Bulk" onClose={() => setShowGenerate(false)} accent="green">
          {genResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-700">{genResult.created}</p>
                <p className="text-sm text-green-600">data berhasil dibuat</p>
                {genResult.skipped > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{genResult.skipped} dilewati (sudah ada)</p>
                )}
              </div>
              <div className="flex justify-end">
                <button onClick={() => setShowGenerate(false)} className={btnGreen}>Tutup</button>
              </div>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); generateMut.mutate(genForm); }} className="space-y-4">
              <Field label="Tahun">
                <select
                  value={genForm.tahun}
                  onChange={e => setGenForm(f => ({ ...f, tahun: e.target.value }))}
                  className={inputCls}
                >
                  {TAHUN_LIST.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="Hari Raya">
                <select
                  value={genForm.hari_raya}
                  onChange={e => setGenForm(f => ({ ...f, hari_raya: e.target.value }))}
                  className={inputCls}
                >
                  {HARI_RAYA_LIST.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowGenerate(false)} className={btnSecondary}>Batal</button>
                <button type="submit" disabled={generateMut.isPending} className={btnGreen}>
                  {generateMut.isPending ? 'Memproses...' : 'Generate'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Approve Modal */}
      {showApprove && (
        <Modal title="Approve THR" onClose={() => setShowApprove(false)} accent="green">
          <form
            onSubmit={e => {
              e.preventDefault();
              approveMut.mutate({ ids: selectedIds, tanggal_bayar: tanggalBayar });
            }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-600">
              Approve THR untuk <strong>{selectedIds.length}</strong> pegawai dengan tanggal pembayaran:
            </p>
            <Field label="Tanggal Bayar">
              <input
                type="date"
                required
                value={tanggalBayar}
                onChange={e => setTanggalBayar(e.target.value)}
                className={inputCls}
              />
            </Field>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowApprove(false)} className={btnSecondary}>Batal</button>
              <button type="submit" disabled={approveMut.isPending} className={btnGreen}>
                {approveMut.isPending ? 'Memproses...' : 'Approve'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Shared mini-components (file-local) ───────────────────────────────────────

function Modal({ title, onClose, children, accent = 'green' }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
