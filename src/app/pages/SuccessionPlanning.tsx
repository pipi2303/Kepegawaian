import React, { useState } from 'react';
import { Network, Plus, ChevronDown, ChevronUp, Edit2, Trash2, X, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

// ── Types ─────────────────────────────────────────────────────────────────────

type SuccessionKandidat = {
  id: number;
  succession_id: number;
  pegawai_id: number;
  urutan: number;
  readiness: 'Siap Sekarang' | '1-2 Tahun' | '3-5 Tahun';
  gap_kompetensi?: string;
  rencana_pengembangan?: string;
  pegawai?: { nama: string; jabatan: string; unit_kerja: string };
};

type SuccessionPlan = {
  id: number;
  jabatan_kritis: string;
  unit_kerja: string;
  incumbent_id?: number;
  urgency: 'Segera' | '1 Tahun' | '2-3 Tahun' | '3+ Tahun';
  alasan_kritis?: string;
  kompetensi_dibutuhkan?: string;
  incumbent?: { nama: string; jabatan: string; batas_pensiun?: string };
  kandidat: SuccessionKandidat[];
};

type Summary = {
  total: number;
  segera: number;
  satu_tahun: number;
  unit_list: string[];
};

type ListResponse = { data: SuccessionPlan[]; summary: Summary };

// ── Constants ─────────────────────────────────────────────────────────────────

const urgencyBadge: Record<string, string> = {
  Segera: 'bg-red-100 text-red-700 border border-red-200',
  '1 Tahun': 'bg-orange-100 text-orange-700 border border-orange-200',
  '2-3 Tahun': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  '3+ Tahun': 'bg-gray-100 text-gray-600 border border-gray-200',
};

const readinessBadge: Record<string, string> = {
  'Siap Sekarang': 'bg-green-100 text-green-700',
  '1-2 Tahun': 'bg-yellow-100 text-yellow-700',
  '3-5 Tahun': 'bg-red-100 text-red-700',
};

const fmtTgl = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const URGENCY_LIST: SuccessionPlan['urgency'][] = ['Segera', '1 Tahun', '2-3 Tahun', '3+ Tahun'];
const READINESS_LIST: SuccessionKandidat['readiness'][] = ['Siap Sekarang', '1-2 Tahun', '3-5 Tahun'];

const EMPTY_PLAN = {
  jabatan_kritis: '',
  unit_kerja: '',
  incumbent_id: '',
  urgency: 'Segera' as SuccessionPlan['urgency'],
  alasan_kritis: '',
  kompetensi_dibutuhkan: '',
};

const EMPTY_KANDIDAT = {
  pegawai_id: '',
  urutan: '1',
  readiness: 'Siap Sekarang' as SuccessionKandidat['readiness'],
  gap_kompetensi: '',
  rencana_pengembangan: '',
};

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const btnIndigo = 'px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50';
const btnSecondary = 'px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50';
const btnDanger = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50';

// ── Component ─────────────────────────────────────────────────────────────────

export default function SuccessionPlanning() {
  const qc = useQueryClient();

  const [filterUnit, setFilterUnit] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState<SuccessionPlan | null>(null);
  const [planForm, setPlanForm] = useState({ ...EMPTY_PLAN });

  const [showKandidatModal, setShowKandidatModal] = useState(false);
  const [kandidatTarget, setKandidatTarget] = useState<SuccessionPlan | null>(null);
  const [kandidatForm, setKandidatForm] = useState({ ...EMPTY_KANDIDAT });

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ['succession', filterUnit, filterUrgency],
    queryFn: () =>
      http
        .get('/succession', {
          params: { unit_kerja: filterUnit || undefined, urgency: filterUrgency || undefined },
        })
        .then(r => r.data),
    staleTime: 30000,
  });

  const plans: SuccessionPlan[] = data?.data ?? [];
  const summary: Summary = data?.summary ?? { total: 0, segera: 0, satu_tahun: 0, unit_list: [] };

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const savePlanMut = useMutation({
    mutationFn: (d: typeof EMPTY_PLAN) => {
      const body = { ...d, incumbent_id: d.incumbent_id ? Number(d.incumbent_id) : undefined };
      return editPlan
        ? http.put(`/succession/${editPlan.id}`, body).then(r => r.data)
        : http.post('/succession', body).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['succession'] });
      toast.success(editPlan ? 'Succession plan diperbarui' : 'Succession plan ditambah');
      closePlanModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menyimpan'),
  });

  const deletePlanMut = useMutation({
    mutationFn: (id: number) => http.delete(`/succession/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['succession'] });
      toast.success('Succession plan dihapus');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
  });

  const addKandidatMut = useMutation({
    mutationFn: ({ planId, d }: { planId: number; d: typeof EMPTY_KANDIDAT }) =>
      http
        .post(`/succession/${planId}/kandidat`, { ...d, pegawai_id: Number(d.pegawai_id), urutan: Number(d.urutan) })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['succession'] });
      toast.success('Kandidat berhasil ditambah');
      closeKandidatModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menambah kandidat'),
  });

  const deleteKandidatMut = useMutation({
    mutationFn: (id: number) => http.delete(`/succession-kandidat/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['succession'] });
      toast.success('Kandidat dihapus');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus kandidat'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditPlan(null);
    setPlanForm({ ...EMPTY_PLAN });
    setShowPlanModal(true);
  };

  const openEdit = (plan: SuccessionPlan) => {
    setEditPlan(plan);
    setPlanForm({
      jabatan_kritis: plan.jabatan_kritis,
      unit_kerja: plan.unit_kerja,
      incumbent_id: String(plan.incumbent_id ?? ''),
      urgency: plan.urgency,
      alasan_kritis: plan.alasan_kritis ?? '',
      kompetensi_dibutuhkan: plan.kompetensi_dibutuhkan ?? '',
    });
    setShowPlanModal(true);
  };

  const closePlanModal = () => { setShowPlanModal(false); setEditPlan(null); setPlanForm({ ...EMPTY_PLAN }); };

  const openAddKandidat = (plan: SuccessionPlan) => {
    setKandidatTarget(plan);
    setKandidatForm({ ...EMPTY_KANDIDAT });
    setShowKandidatModal(true);
  };

  const closeKandidatModal = () => { setShowKandidatModal(false); setKandidatTarget(null); setKandidatForm({ ...EMPTY_KANDIDAT }); };

  const toggleExpand = (id: number) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Network className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Succession Planning</h1>
            <p className="text-sm text-gray-500">Perencanaan suksesi jabatan kritis</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Tambah Plan
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Jabatan Kritis', value: summary.total, color: 'indigo' },
          { label: 'Perlu Segera', value: summary.segera, color: 'red' },
          { label: 'Dalam 1 Tahun', value: summary.satu_tahun, color: 'orange' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <select
          value={filterUnit}
          onChange={e => setFilterUnit(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Unit</option>
          {summary.unit_list.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select
          value={filterUrgency}
          onChange={e => setFilterUrgency(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Urgency</option>
          {URGENCY_LIST.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Memuat data...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Belum ada succession plan</div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => {
            const expanded = expandedIds.has(plan.id);
            return (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Card Header */}
                <div
                  className="flex items-start justify-between p-5 cursor-pointer hover:bg-gray-50/50"
                  onClick={() => toggleExpand(plan.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-lg">{plan.jabatan_kritis}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyBadge[plan.urgency]}`}>
                        {plan.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{plan.unit_kerja}</p>

                    {plan.incumbent && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>Incumbent: <span className="font-medium">{plan.incumbent.nama}</span></span>
                        {plan.incumbent.batas_pensiun && (
                          <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                            Pensiun: {fmtTgl(plan.incumbent.batas_pensiun)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span>{plan.kandidat.length} kandidat</span>
                      {plan.alasan_kritis && <span className="truncate max-w-[300px]">{plan.alasan_kritis}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(plan); }}
                      className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('Hapus succession plan ini?')) deletePlanMut.mutate(plan.id);
                      }}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Kandidat List */}
                {expanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 space-y-3">
                    {plan.kompetensi_dibutuhkan && (
                      <div className="p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800">
                        <strong>Kompetensi:</strong> {plan.kompetensi_dibutuhkan}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">Daftar Kandidat</h4>
                      <button
                        onClick={() => openAddKandidat(plan)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        <Plus className="w-3 h-3" /> Tambah Kandidat
                      </button>
                    </div>

                    {plan.kandidat.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">Belum ada kandidat</p>
                    ) : (
                      <div className="space-y-2">
                        {[...plan.kandidat]
                          .sort((a, b) => a.urutan - b.urutan)
                          .map(k => (
                            <div key={k.id} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center shrink-0">
                                {k.urutan}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {k.pegawai?.nama ?? `ID ${k.pegawai_id}`}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${readinessBadge[k.readiness]}`}>
                                    {k.readiness}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{k.pegawai?.jabatan} · {k.pegawai?.unit_kerja}</p>
                                {k.gap_kompetensi && (
                                  <p className="text-xs text-gray-500 mt-1"><strong>Gap:</strong> {k.gap_kompetensi}</p>
                                )}
                                {k.rencana_pengembangan && (
                                  <p className="text-xs text-gray-500"><strong>Rencana:</strong> {k.rencana_pengembangan}</p>
                                )}
                              </div>
                              <button
                                onClick={() => { if (confirm('Hapus kandidat ini?')) deleteKandidatMut.mutate(k.id); }}
                                className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <Modal title={editPlan ? 'Edit Succession Plan' : 'Tambah Succession Plan'} onClose={closePlanModal}>
          <form onSubmit={e => { e.preventDefault(); savePlanMut.mutate(planForm); }} className="space-y-4">
            <Field label="Jabatan Kritis">
              <input
                required
                value={planForm.jabatan_kritis}
                onChange={e => setPlanForm(f => ({ ...f, jabatan_kritis: e.target.value }))}
                className={inputCls}
                placeholder="Nama jabatan kritis"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Unit Kerja">
                <input
                  required
                  value={planForm.unit_kerja}
                  onChange={e => setPlanForm(f => ({ ...f, unit_kerja: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="ID Incumbent (opsional)">
                <input
                  type="number"
                  value={planForm.incumbent_id}
                  onChange={e => setPlanForm(f => ({ ...f, incumbent_id: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Urgency">
              <select
                value={planForm.urgency}
                onChange={e => setPlanForm(f => ({ ...f, urgency: e.target.value as SuccessionPlan['urgency'] }))}
                className={inputCls}
              >
                {URGENCY_LIST.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Alasan Kritis">
              <textarea
                value={planForm.alasan_kritis}
                onChange={e => setPlanForm(f => ({ ...f, alasan_kritis: e.target.value }))}
                className={inputCls + ' resize-none'}
                rows={2}
              />
            </Field>
            <Field label="Kompetensi Dibutuhkan">
              <textarea
                value={planForm.kompetensi_dibutuhkan}
                onChange={e => setPlanForm(f => ({ ...f, kompetensi_dibutuhkan: e.target.value }))}
                className={inputCls + ' resize-none'}
                rows={2}
              />
            </Field>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={closePlanModal} className={btnSecondary}>Batal</button>
              <button type="submit" disabled={savePlanMut.isPending} className={btnIndigo}>
                {savePlanMut.isPending ? 'Menyimpan...' : editPlan ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Kandidat Modal */}
      {showKandidatModal && kandidatTarget && (
        <Modal
          title={`Tambah Kandidat — ${kandidatTarget.jabatan_kritis}`}
          onClose={closeKandidatModal}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              addKandidatMut.mutate({ planId: kandidatTarget.id, d: kandidatForm });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID Pegawai">
                <input
                  type="number"
                  required
                  value={kandidatForm.pegawai_id}
                  onChange={e => setKandidatForm(f => ({ ...f, pegawai_id: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Urutan (1–5)">
                <input
                  type="number"
                  min={1}
                  max={5}
                  required
                  value={kandidatForm.urutan}
                  onChange={e => setKandidatForm(f => ({ ...f, urutan: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Readiness">
              <select
                value={kandidatForm.readiness}
                onChange={e => setKandidatForm(f => ({ ...f, readiness: e.target.value as SuccessionKandidat['readiness'] }))}
                className={inputCls}
              >
                {READINESS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Gap Kompetensi">
              <textarea
                value={kandidatForm.gap_kompetensi}
                onChange={e => setKandidatForm(f => ({ ...f, gap_kompetensi: e.target.value }))}
                className={inputCls + ' resize-none'}
                rows={2}
              />
            </Field>
            <Field label="Rencana Pengembangan">
              <textarea
                value={kandidatForm.rencana_pengembangan}
                onChange={e => setKandidatForm(f => ({ ...f, rencana_pengembangan: e.target.value }))}
                className={inputCls + ' resize-none'}
                rows={2}
              />
            </Field>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={closeKandidatModal} className={btnSecondary}>Batal</button>
              <button type="submit" disabled={addKandidatMut.isPending} className={btnIndigo}>
                {addKandidatMut.isPending ? 'Menambah...' : 'Tambah Kandidat'}
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
