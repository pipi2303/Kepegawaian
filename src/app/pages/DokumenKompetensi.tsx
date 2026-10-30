import React, { useState } from 'react';
import { BadgeCheck, Plus, Edit2, Trash2, AlertTriangle, X, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

// ── Types ─────────────────────────────────────────────────────────────────────

type DokumenRecord = {
  id: number;
  pegawai_id: number;
  jenis_dokumen: string;
  nama_dokumen: string;
  nomor_sertifikat?: string;
  penyelenggara?: string;
  tanggal_terbit: string;
  tanggal_expired: string;
  status: 'Aktif' | 'Akan Expired' | 'Expired';
  file_dokumen?: string;
  keterangan?: string;
  pegawai?: { nama: string; jabatan: string; unit_kerja: string };
};

type ExpiringDoc = DokumenRecord & { hari_tersisa: number };

type ExpiringSummary = {
  data: ExpiringDoc[];
  summary: { total_expiring: number; by_jenis: Record<string, number>; expired: number };
};

// ── Constants ─────────────────────────────────────────────────────────────────

const JENIS_LIST = ['BLS', 'ACLS', 'BTCLS', 'PPGD', 'ATLS', 'NLS', 'Pelatihan Khusus', 'Sertifikat Kompetensi', 'Lainnya'];

const statusColor: Record<string, string> = {
  Aktif: 'bg-green-100 text-green-700',
  'Akan Expired': 'bg-yellow-100 text-yellow-700',
  Expired: 'bg-red-100 text-red-700',
};

const jenisColor: Record<string, string> = {
  BLS: 'bg-blue-100 text-blue-700',
  ACLS: 'bg-purple-100 text-purple-700',
  BTCLS: 'bg-orange-100 text-orange-700',
  PPGD: 'bg-pink-100 text-pink-700',
  ATLS: 'bg-indigo-100 text-indigo-700',
  NLS: 'bg-cyan-100 text-cyan-700',
};

const fmtTgl = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const daysDiff = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const EMPTY_FORM = {
  pegawai_id: '',
  jenis_dokumen: JENIS_LIST[0],
  nama_dokumen: '',
  nomor_sertifikat: '',
  penyelenggara: '',
  tanggal_terbit: '',
  tanggal_expired: '',
  keterangan: '',
};

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
const btnTeal = 'px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50';
const btnSecondary = 'px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50';

// ── Component ─────────────────────────────────────────────────────────────────

export default function DokumenKompetensi() {
  const qc = useQueryClient();

  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<DokumenRecord | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: expiringData } = useQuery<ExpiringSummary>({
    queryKey: ['dokumen-expiring'],
    queryFn: () => http.get('/dokumen-kompetensi/expiring').then(r => r.data),
    staleTime: 60000,
  });

  const { data: listData, isLoading } = useQuery<{ data: DokumenRecord[] }>({
    queryKey: ['dokumen-kompetensi', filterJenis, filterStatus],
    queryFn: () =>
      http
        .get('/dokumen-kompetensi', {
          params: {
            jenis_dokumen: filterJenis || undefined,
            status: filterStatus || undefined,
          },
        })
        .then(r => r.data),
    staleTime: 30000,
  });

  const list: DokumenRecord[] = (listData as any)?.data?.data ?? listData?.data ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const saveMut = useMutation({
    mutationFn: (d: typeof EMPTY_FORM) =>
      editTarget
        ? http.put(`/dokumen-kompetensi/${editTarget.id}`, { ...d, pegawai_id: Number(d.pegawai_id) }).then(r => r.data)
        : http.post('/dokumen-kompetensi', { ...d, pegawai_id: Number(d.pegawai_id) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dokumen-kompetensi'] });
      qc.invalidateQueries({ queryKey: ['dokumen-expiring'] });
      toast.success(editTarget ? 'Dokumen diperbarui' : 'Dokumen berhasil ditambah');
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menyimpan dokumen'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => http.delete(`/dokumen-kompetensi/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dokumen-kompetensi'] });
      qc.invalidateQueries({ queryKey: ['dokumen-expiring'] });
      toast.success('Dokumen dihapus');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (row: DokumenRecord) => {
    setEditTarget(row);
    setForm({
      pegawai_id: String(row.pegawai_id),
      jenis_dokumen: row.jenis_dokumen,
      nama_dokumen: row.nama_dokumen,
      nomor_sertifikat: row.nomor_sertifikat ?? '',
      penyelenggara: row.penyelenggara ?? '',
      tanggal_terbit: row.tanggal_terbit,
      tanggal_expired: row.tanggal_expired,
      keterangan: row.keterangan ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
  };

  const expiredColor = (dateStr: string) => {
    const d = daysDiff(dateStr);
    if (d < 0) return 'text-red-600 font-semibold';
    if (d <= 90) return 'text-yellow-600 font-semibold';
    return 'text-gray-700';
  };

  const summary = expiringData?.summary;
  const byJenis = summary?.by_jenis ?? {};

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <BadgeCheck className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dokumen Kompetensi</h1>
            <p className="text-sm text-gray-500">BLS, ACLS, BTCLS &amp; sertifikat lainnya</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Tambah Dokumen
        </button>
      </div>

      {/* Alert Banner */}
      {summary && (summary.total_expiring > 0 || summary.expired > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <span>
              {summary.expired > 0 && `${summary.expired} dokumen sudah expired. `}
              {summary.total_expiring > 0 && `${summary.total_expiring} dokumen akan expired dalam 90 hari.`}
            </span>
          </div>
          {Object.keys(byJenis).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(byJenis).map(([jenis, count]) => (
                <span key={jenis} className={`px-2 py-0.5 rounded-full text-xs font-medium ${jenisColor[jenis] ?? 'bg-gray-100 text-gray-600'}`}>
                  {jenis}: {count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <select
          value={filterJenis}
          onChange={e => setFilterJenis(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Semua Jenis</option>
          {JENIS_LIST.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Akan Expired">Akan Expired</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Pegawai', 'Jenis', 'Nama Dokumen', 'No. Sertifikat', 'Penyelenggara', 'Berlaku s.d.', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Tidak ada data dokumen</td></tr>
              ) : (
                list.map(row => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.pegawai?.nama ?? `ID ${row.pegawai_id}`}</p>
                      <p className="text-xs text-gray-400">{row.pegawai?.unit_kerja}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${jenisColor[row.jenis_dokumen] ?? 'bg-gray-100 text-gray-600'}`}>
                        {row.jenis_dokumen}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate" title={row.nama_dokumen}>
                      {row.nama_dokumen}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.nomor_sertifikat ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{row.penyelenggara ?? '—'}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${expiredColor(row.tanggal_expired)}`}>
                      {fmtTgl(row.tanggal_expired)}
                      {daysDiff(row.tanggal_expired) >= 0 && daysDiff(row.tanggal_expired) <= 90 && (
                        <p className="text-xs text-yellow-500">{daysDiff(row.tanggal_expired)} hari lagi</p>
                      )}
                      {daysDiff(row.tanggal_expired) < 0 && (
                        <p className="text-xs text-red-500">{Math.abs(daysDiff(row.tanggal_expired))} hari lalu</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Hapus dokumen ini?')) deleteMut.mutate(row.id); }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editTarget ? 'Edit Dokumen' : 'Tambah Dokumen'} onClose={closeModal}>
          <form onSubmit={e => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID Pegawai">
                <input
                  type="number"
                  required
                  value={form.pegawai_id}
                  onChange={e => setForm(f => ({ ...f, pegawai_id: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Jenis Dokumen">
                <select
                  value={form.jenis_dokumen}
                  onChange={e => setForm(f => ({ ...f, jenis_dokumen: e.target.value }))}
                  className={inputCls}
                >
                  {JENIS_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Nama Dokumen">
              <input
                required
                value={form.nama_dokumen}
                onChange={e => setForm(f => ({ ...f, nama_dokumen: e.target.value }))}
                className={inputCls}
                placeholder="Nama sertifikat / dokumen"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nomor Sertifikat">
                <input
                  value={form.nomor_sertifikat}
                  onChange={e => setForm(f => ({ ...f, nomor_sertifikat: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Penyelenggara">
                <input
                  value={form.penyelenggara}
                  onChange={e => setForm(f => ({ ...f, penyelenggara: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal Terbit">
                <input
                  type="date"
                  required
                  value={form.tanggal_terbit}
                  onChange={e => setForm(f => ({ ...f, tanggal_terbit: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Tanggal Expired">
                <input
                  type="date"
                  required
                  value={form.tanggal_expired}
                  onChange={e => setForm(f => ({ ...f, tanggal_expired: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Keterangan">
              <textarea
                value={form.keterangan}
                onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                className={inputCls + ' resize-none'}
                rows={2}
              />
            </Field>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={closeModal} className={btnSecondary}>Batal</button>
              <button type="submit" disabled={saveMut.isPending} className={btnTeal}>
                {saveMut.isPending ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Tambah'}
              </button>
            </div>
          </form>
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
