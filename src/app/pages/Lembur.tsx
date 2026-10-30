import React, { useState } from 'react';
import { Timer, Plus, Check, X, Info, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

// ── Types ─────────────────────────────────────────────────────────────────────

type LemburRecord = {
  id: number;
  pegawai_id: number;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  jenis_hari: 'Hari Kerja' | 'Hari Libur' | 'Hari Besar';
  alasan: string;
  status: 'Diajukan' | 'Disetujui' | 'Ditolak';
  upah_lembur?: number;
  catatan?: string;
  pegawai?: { nama: string; jabatan: string; unit_kerja: string };
  approver?: { nama: string };
};

type Summary = {
  totalDiajukan: number;
  totalDisetujui: number;
  totalJam: number;
  totalUpah: number;
  unitList: string[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtTgl = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const jenisColor: Record<string, string> = {
  'Hari Kerja': 'bg-blue-100 text-blue-700',
  'Hari Libur': 'bg-purple-100 text-purple-700',
  'Hari Besar': 'bg-red-100 text-red-700',
};

const statusColor: Record<string, string> = {
  Diajukan: 'bg-yellow-100 text-yellow-700',
  Disetujui: 'bg-green-100 text-green-700',
  Ditolak: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = {
  pegawai_id: '',
  tanggal: '',
  jam_mulai: '',
  jam_selesai: '',
  jenis_hari: 'Hari Kerja' as LemburRecord['jenis_hari'],
  alasan: '',
};

const now = new Date();
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Lembur() {
  const qc = useQueryClient();

  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUnit, setFilterUnit] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [approveTarget, setApproveTarget] = useState<LemburRecord | null>(null);
  const [approveAction, setApproveAction] = useState<'Disetujui' | 'Ditolak'>('Disetujui');
  const [catatan, setCatatan] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: summary } = useQuery<Summary>({
    queryKey: ['lembur-summary', bulan, tahun],
    queryFn: () =>
      http.get('/lembur/summary', { params: { bulan, tahun } }).then(r => r.data),
    staleTime: 30000,
  });

  const { data: listData, isLoading } = useQuery<{ data: LemburRecord[] }>({
    queryKey: ['lembur', filterStatus, filterUnit, bulan, tahun],
    queryFn: () =>
      http
        .get('/lembur', {
          params: {
            status: filterStatus || undefined,
            unit_kerja: filterUnit || undefined,
            bulan,
            tahun,
          },
        })
        .then(r => r.data),
    staleTime: 30000,
  });

  const list: LemburRecord[] = listData?.data ?? (listData as any) ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const addMut = useMutation({
    mutationFn: (d: typeof EMPTY_FORM) =>
      http.post('/lembur', { ...d, pegawai_id: Number(d.pegawai_id) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lembur'] });
      qc.invalidateQueries({ queryKey: ['lembur-summary'] });
      toast.success('Lembur berhasil diajukan');
      setShowAdd(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal mengajukan lembur'),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, status, cat }: { id: number; status: string; cat?: string }) =>
      http.post(`/lembur/${id}/approve`, { status, catatan: cat }).then(r => r.data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['lembur'] });
      qc.invalidateQueries({ queryKey: ['lembur-summary'] });
      toast.success(v.status === 'Disetujui' ? 'Lembur disetujui' : 'Lembur ditolak');
      setApproveTarget(null);
      setCatatan('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal memproses lembur'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => http.delete(`/lembur/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lembur'] });
      qc.invalidateQueries({ queryKey: ['lembur-summary'] });
      toast.success('Lembur dihapus');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
  });

  // ── Render ────────────────────────────────────────────────────────────────────

  const unitList: string[] = summary?.unitList ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Timer className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Lembur</h1>
            <p className="text-sm text-gray-500">UU 13/2003 — PP 35/2021</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Ajukan Lembur
        </button>
      </div>

      {/* Info Box */}
      <div className="flex gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          <strong>UU 13/2003 Pasal 78:</strong> Maks. 3 jam/hari dan 14 jam/minggu. Formula upah lembur PP 35/2021:
          jam pertama = 1,5× upah/jam; jam berikutnya = 2× upah/jam. Hari libur/besar = 2× s.d. 4×.
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Diajukan', value: summary?.totalDiajukan ?? 0, color: 'orange', suffix: 'pengajuan' },
          { label: 'Disetujui', value: summary?.totalDisetujui ?? 0, color: 'green', suffix: 'disetujui' },
          { label: 'Total Jam', value: summary?.totalJam ?? 0, color: 'blue', suffix: 'jam' },
          { label: 'Total Upah', value: null, color: 'purple', rp: summary?.totalUpah ?? 0 },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {c.rp !== undefined ? (
              <p className="text-xl font-bold text-gray-900 mt-1">{fmtRp(c.rp)}</p>
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {c.value}
                <span className="text-sm font-normal text-gray-400 ml-1">{c.suffix}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <select
          value={bulan}
          onChange={e => setBulan(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {MONTHS.map(m => (
            <option key={m} value={m}>
              {new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={tahun}
          onChange={e => setTahun(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filterUnit}
          onChange={e => setFilterUnit(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">Semua Unit</option>
          {unitList.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">Semua Status</option>
          <option value="Diajukan">Diajukan</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Pegawai', 'Tanggal', 'Jam', 'Durasi', 'Jenis Hari', 'Alasan', 'Upah', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">Memuat data...</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">Tidak ada data lembur</td>
                </tr>
              ) : (
                list.map(row => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.pegawai?.nama ?? `ID ${row.pegawai_id}`}</p>
                      <p className="text-xs text-gray-400">{row.pegawai?.unit_kerja}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtTgl(row.tanggal)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {row.jam_mulai} – {row.jam_selesai}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-orange-600">{row.durasi_jam} jam</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${jenisColor[row.jenis_hari]}`}>
                        {row.jenis_hari}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate text-gray-600" title={row.alasan}>{row.alasan}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {row.upah_lembur != null ? fmtRp(row.upah_lembur) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {row.status === 'Diajukan' && (
                          <>
                            <button
                              onClick={() => { setApproveTarget(row); setApproveAction('Disetujui'); setCatatan(''); }}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                              title="Setujui"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setApproveTarget(row); setApproveAction('Ditolak'); setCatatan(''); }}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                              title="Tolak"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Hapus data lembur ini?')) deleteMut.mutate(row.id);
                          }}
                          className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Ajukan Lembur" onClose={() => setShowAdd(false)}>
          <form
            onSubmit={e => { e.preventDefault(); addMut.mutate(form); }}
            className="space-y-4"
          >
            <Field label="ID Pegawai">
              <input
                type="number"
                required
                value={form.pegawai_id}
                onChange={e => setForm(f => ({ ...f, pegawai_id: e.target.value }))}
                className={inputCls}
                placeholder="Masukkan ID pegawai"
              />
            </Field>
            <Field label="Tanggal">
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jam Mulai">
                <input
                  type="time"
                  required
                  value={form.jam_mulai}
                  onChange={e => setForm(f => ({ ...f, jam_mulai: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Jam Selesai">
                <input
                  type="time"
                  required
                  value={form.jam_selesai}
                  onChange={e => setForm(f => ({ ...f, jam_selesai: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Jenis Hari">
              <select
                value={form.jenis_hari}
                onChange={e => setForm(f => ({ ...f, jenis_hari: e.target.value as LemburRecord['jenis_hari'] }))}
                className={inputCls}
              >
                <option value="Hari Kerja">Hari Kerja</option>
                <option value="Hari Libur">Hari Libur</option>
                <option value="Hari Besar">Hari Besar</option>
              </select>
            </Field>
            <Field label="Alasan">
              <textarea
                required
                value={form.alasan}
                onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))}
                className={inputCls + ' resize-none'}
                rows={3}
                placeholder="Jelaskan alasan lembur..."
              />
            </Field>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className={btnSecondary}>Batal</button>
              <button type="submit" disabled={addMut.isPending} className={btnOrange}>
                {addMut.isPending ? 'Menyimpan...' : 'Ajukan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Approve/Reject Dialog */}
      {approveTarget && (
        <Modal
          title={approveAction === 'Disetujui' ? 'Setujui Lembur' : 'Tolak Lembur'}
          onClose={() => setApproveTarget(null)}
        >
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <p><span className="text-gray-500">Pegawai:</span> <span className="font-medium">{approveTarget.pegawai?.nama ?? `ID ${approveTarget.pegawai_id}`}</span></p>
              <p><span className="text-gray-500">Tanggal:</span> {fmtTgl(approveTarget.tanggal)}</p>
              <p><span className="text-gray-500">Durasi:</span> {approveTarget.durasi_jam} jam ({approveTarget.jam_mulai}–{approveTarget.jam_selesai})</p>
            </div>
            <Field label="Catatan (opsional)">
              <textarea
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                className={inputCls + ' resize-none'}
                rows={2}
                placeholder="Catatan persetujuan/penolakan..."
              />
            </Field>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setApproveTarget(null)} className={btnSecondary}>Batal</button>
              <button
                onClick={() => approveMut.mutate({ id: approveTarget.id, status: approveAction, cat: catatan })}
                disabled={approveMut.isPending}
                className={approveAction === 'Disetujui' ? btnGreen : btnRed}
              >
                {approveMut.isPending ? 'Memproses...' : approveAction === 'Disetujui' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Shared mini-components (file-local) ───────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';
const btnOrange = 'px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-50';
const btnGreen = 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50';
const btnRed = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50';
const btnSecondary = 'px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50';
