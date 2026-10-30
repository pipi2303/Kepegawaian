import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

type OppeFppe = {
  id: number;
  jenis: 'OPPE' | 'FPPE';
  periode: string;
  smf?: string;
  status: string;
  nilai_total?: number;
  predikat?: string;
  rekomendasi?: string;
};

type PendingPeerReview = {
  id: number;
  oppe_id: number;
  oppe?: {
    pegawai?: { nama: string; jabatan: string };
    periode: string;
    smf?: string;
  };
};

type ReviewForm = {
  kompetensi_klinis: number;
  komunikasi: number;
  etika_profesional: number;
  kerjasama_tim: number;
  pengetahuan: number;
  catatan: string;
};

const EMPTY_FORM: ReviewForm = {
  kompetensi_klinis: 0,
  komunikasi: 0,
  etika_profesional: 0,
  kerjasama_tim: 0,
  pengetahuan: 0,
  catatan: '',
};

const nilaiColor = (n?: number) => {
  if (n == null) return 'text-gray-400';
  if (n >= 85) return 'text-green-600';
  if (n >= 70) return 'text-blue-600';
  if (n >= 55) return 'text-yellow-600';
  return 'text-red-600';
};

const predikatBadge: Record<string, string> = {
  'Sangat Baik': 'bg-green-100 text-green-700',
  'Baik':        'bg-blue-100 text-blue-700',
  'Cukup':       'bg-yellow-100 text-yellow-700',
  'Kurang':      'bg-red-100 text-red-700',
};

const CRITERIA: { key: keyof Omit<ReviewForm, 'catatan'>; label: string }[] = [
  { key: 'kompetensi_klinis',   label: 'Kompetensi Klinis'    },
  { key: 'komunikasi',          label: 'Komunikasi'           },
  { key: 'etika_profesional',   label: 'Etika Profesional'    },
  { key: 'kerjasama_tim',       label: 'Kerjasama Tim'        },
  { key: 'pengetahuan',         label: 'Pengetahuan'          },
];

function avg(form: ReviewForm) {
  const vals = CRITERIA.map(c => form[c.key]);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function PeerReviewCard({ review }: { review: PendingPeerReview }) {
  const [form, setForm] = useState<ReviewForm>({ ...EMPTY_FORM });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      http.post(`/self/peer-review/${review.id}`, {
        kompetensi_klinis: form.kompetensi_klinis,
        komunikasi: form.komunikasi,
        etika_profesional: form.etika_profesional,
        kerjasama_tim: form.kerjasama_tim,
        pengetahuan: form.pengetahuan,
        catatan: form.catatan || undefined,
      }),
    onSuccess: () => {
      toast.success('Peer review berhasil disubmit');
      qc.invalidateQueries({ queryKey: ['self-peer-review-pending'] });
    },
    onError: () => toast.error('Gagal submit peer review'),
  });

  const set = (key: keyof ReviewForm, val: number | string) =>
    setForm(f => ({ ...f, [key]: val }));

  const avgScore = avg(form);
  const allFilled = CRITERIA.every(c => form[c.key] > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <p className="font-semibold text-gray-800">
          {review.oppe?.pegawai?.nama ?? `Pegawai #${review.oppe_id}`}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {review.oppe?.pegawai?.jabatan} · {review.oppe?.periode}
          {review.oppe?.smf ? ` · ${review.oppe.smf}` : ''}
        </p>
      </div>

      <div className="space-y-3">
        {CRITERIA.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 flex-shrink-0">{label}</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form[key] || ''}
              onChange={e => set(key, Math.min(100, Math.max(0, Number(e.target.value))))}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0–100"
            />
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full transition-all"
                style={{ width: `${form[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live average */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-gray-500">Rata-rata:</span>
        <span className={`text-lg font-bold ${nilaiColor(allFilled ? avgScore : undefined)}`}>
          {allFilled ? avgScore.toFixed(1) : '—'}
        </span>
      </div>

      <textarea
        value={form.catatan}
        onChange={e => set('catatan', e.target.value)}
        rows={2}
        placeholder="Catatan (opsional)"
        className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
      />

      <button
        onClick={() => mutation.mutate()}
        disabled={!allFilled || mutation.isPending}
        className="mt-3 w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
      >
        {mutation.isPending ? 'Menyimpan…' : 'Submit Peer Review'}
      </button>
    </div>
  );
}

export default function MyOPPE() {
  const { data: oppeList, isLoading: oppeLoading } = useQuery({
    queryKey: ['self-oppe'],
    queryFn: () =>
      http.get('/self/oppe').then(r => {
        const d = r.data;
        return (d?.data?.data ?? d?.data ?? d ?? []) as OppeFppe[];
      }),
    staleTime: 60000,
    meta: { onError: () => toast.error('Gagal memuat data OPPE') },
  });

  const { data: pendingList, isLoading: pendingLoading } = useQuery({
    queryKey: ['self-peer-review-pending'],
    queryFn: () =>
      http.get('/self/peer-review/pending').then(r => {
        const d = r.data;
        return (d?.data?.data ?? d?.data ?? d ?? []) as PendingPeerReview[];
      }),
    staleTime: 30000,
    meta: { onError: () => toast.error('Gagal memuat peer review pending') },
  });

  const evaluations: OppeFppe[] = oppeList ?? [];
  const pending: PendingPeerReview[] = pendingList ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">OPPE / FPPE Saya</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Hasil evaluasi kinerja klinis dan peer review yang perlu Anda isi.
            </p>
          </div>
        </div>

        {/* Section 1: Hasil Evaluasi */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Hasil Evaluasi Saya
          </h2>
          {oppeLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : evaluations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <ClipboardList size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">Belum ada data evaluasi OPPE/FPPE</p>
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.map(e => {
                const pd = e.predikat ? (predikatBadge[e.predikat] ?? 'bg-gray-100 text-gray-600') : null;
                return (
                  <div key={e.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex gap-4">
                    <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <span className={`text-lg font-bold ${nilaiColor(e.nilai_total)}`}>
                        {e.nilai_total != null ? e.nilai_total.toFixed(0) : '—'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          {e.jenis}
                        </span>
                        {pd && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pd}`}>
                            {e.predikat}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {e.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{e.periode}</p>
                      {e.smf && <p className="text-xs text-gray-500">{e.smf}</p>}
                      {e.rekomendasi && (
                        <p className="text-xs text-gray-600 mt-1 italic">"{e.rekomendasi}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Peer Review Pending */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Peer Review yang Perlu Saya Submit
            {pending.length > 0 && (
              <span className="ml-2 text-xs font-bold bg-purple-600 text-white rounded-full px-2 py-0.5">
                {pending.length}
              </span>
            )}
          </h2>
          {pendingLoading ? (
            <div className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-500 text-sm">Tidak ada peer review yang perlu diisi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(r => <PeerReviewCard key={r.id} review={r} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
