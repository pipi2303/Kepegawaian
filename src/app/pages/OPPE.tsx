import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Edit2, Trash2, X, AlertTriangle,
  CheckCircle, Clock, Search, ChevronRight, Shield,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

// ─── Types ────────────────────────────────────────────────────────────────────
type Jenis  = 'OPPE' | 'FPPE';
type Status = 'Draft' | 'Berlangsung' | 'Selesai' | 'Tindak Lanjut';
type Rekomendasi = 'Lanjutkan Kewenangan' | 'Supervisi Ketat' | 'Batasi Kewenangan' | 'Cabut Kewenangan';

interface OppeFppeRecord {
  id: number;
  pegawai_id: number;
  credentialing_id?: number;
  jenis: Jenis;
  periode: string;
  smf?: string;
  tanggal_mulai: string;
  tanggal_selesai?: string;
  status: Status;
  jumlah_kasus: number;
  jumlah_komplikasi: number;
  alos?: number;
  kepatuhan_cp?: number;
  kelengkapan_klpcm?: number;
  nilai_rekan?: number;
  catatan_rekan?: string;
  nilai_total?: number;
  rekomendasi?: Rekomendasi;
  catatan_komite?: string;
  penilai_id?: number;
  tanggal_keputusan?: string;
  predikat?: string;
  pegawai?: { id: number; nama: string; jabatan: string; unit_kerja: string; nip: string };
  penilai?: { id: number; nama: string };
}

// ─── Config ───────────────────────────────────────────────────────────────────
const statusCfg: Record<Status, { bg: string; color: string; icon: React.ElementType }> = {
  'Draft':        { bg: 'bg-gray-100',   color: 'text-gray-600',   icon: Clock },
  'Berlangsung':  { bg: 'bg-blue-100',   color: 'text-blue-700',   icon: ClipboardList },
  'Selesai':      { bg: 'bg-green-100',  color: 'text-green-700',  icon: CheckCircle },
  'Tindak Lanjut':{ bg: 'bg-orange-100', color: 'text-orange-700', icon: AlertTriangle },
};

const rekomendasiCfg: Record<Rekomendasi, string> = {
  'Lanjutkan Kewenangan': 'bg-green-100 text-green-700',
  'Supervisi Ketat':      'bg-yellow-100 text-yellow-700',
  'Batasi Kewenangan':    'bg-orange-100 text-orange-700',
  'Cabut Kewenangan':     'bg-red-100 text-red-700',
};

const predikatCfg: Record<string, string> = {
  'Baik Sekali': 'text-green-700',
  'Baik':        'text-blue-700',
  'Cukup':       'text-yellow-700',
  'Kurang':      'text-red-700',
};

const PERIODE_OPTIONS = (() => {
  const opts: string[] = [];
  for (let y = 2024; y <= 2027; y++) {
    opts.push(`Semester 1 ${y}`, `Semester 2 ${y}`);
  }
  return opts;
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

// Bobot KARS: Clinical Pathway 40%, KLPCM 30%, Peer 30%
function computeScore(cp?: number, klpcm?: number, rekan?: number): number | null {
  if (cp == null && klpcm == null && rekan == null) return null;
  return Math.round(((cp ?? 0) * 0.4) + ((klpcm ?? 0) * 0.3) + ((rekan ?? 0) * 0.3));
}

function scoreToPredikat(s: number): string {
  if (s >= 90) return 'Baik Sekali';
  if (s >= 75) return 'Baik';
  if (s >= 60) return 'Cukup';
  return 'Kurang';
}

function scoreToRekomendasi(s: number): Rekomendasi {
  if (s >= 75) return 'Lanjutkan Kewenangan';
  if (s >= 60) return 'Supervisi Ketat';
  return 'Batasi Kewenangan';
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ nilai, predikat }: { nilai?: number; predikat?: string }) {
  if (nilai == null) return <span className="text-gray-300 text-xs">—</span>;
  const p = predikat ?? scoreToPredikat(nilai);
  return (
    <div className="text-center">
      <span className={`text-lg font-bold ${predikatCfg[p] ?? 'text-gray-700'}`}>{nilai}</span>
      <p className={`text-[10px] font-medium ${predikatCfg[p] ?? 'text-gray-500'}`}>{p}</p>
    </div>
  );
}

// ─── Empty form ───────────────────────────────────────────────────────────────
const emptyForm: Omit<OppeFppeRecord, 'id'> = {
  pegawai_id: 0,
  jenis: 'OPPE',
  periode: 'Semester 1 2026',
  smf: '',
  tanggal_mulai: new Date().toISOString().slice(0, 10),
  tanggal_selesai: '',
  status: 'Draft',
  jumlah_kasus: 0,
  jumlah_komplikasi: 0,
  alos: undefined,
  kepatuhan_cp: undefined,
  kelengkapan_klpcm: undefined,
  nilai_rekan: undefined,
  catatan_rekan: '',
  rekomendasi: undefined,
  catatan_komite: '',
  tanggal_keputusan: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OPPE() {
  const qc = useQueryClient();

  const [filterJenis, setFilterJenis]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]             = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editData, setEditData]         = useState<OppeFppeRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [form, setForm]                 = useState<Omit<OppeFppeRecord, 'id'>>(emptyForm);

  // Queries
  const { data: summaryData } = useQuery({
    queryKey: ['oppe-summary'],
    queryFn: () => http.get('/oppe/summary').then(r => r.data.data),
    staleTime: 60000,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['oppe', filterJenis, filterStatus],
    queryFn: () => http.get('/oppe', {
      params: {
        ...(filterJenis  ? { jenis: filterJenis }   : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
      },
    }).then(r => r.data.data),
    staleTime: 30000,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (d: any) => editData
      ? http.put(`/oppe/${editData.id}`, d).then(r => r.data)
      : http.post('/oppe', d).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oppe'] });
      qc.invalidateQueries({ queryKey: ['oppe-summary'] });
      toast.success(editData ? 'Data OPPE/FPPE diperbarui' : 'Evaluasi berhasil disimpan');
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menyimpan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => http.delete(`/oppe/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oppe'] });
      qc.invalidateQueries({ queryKey: ['oppe-summary'] });
      toast.success('Data dihapus');
      setShowDeleteConfirm(null);
    },
    onError: () => toast.error('Gagal menghapus'),
  });

  const records: OppeFppeRecord[] = useMemo(() => {
    const raw = (listData?.data ?? listData ?? []) as OppeFppeRecord[];
    if (!search) return raw;
    const q = search.toLowerCase();
    return raw.filter(r =>
      r.pegawai?.nama?.toLowerCase().includes(q) ||
      r.smf?.toLowerCase().includes(q) ||
      r.periode?.toLowerCase().includes(q)
    );
  }, [listData, search]);

  function openAdd() {
    setEditData(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(r: OppeFppeRecord) {
    setEditData(r);
    setForm({
      pegawai_id: r.pegawai_id,
      credentialing_id: r.credentialing_id,
      jenis: r.jenis,
      periode: r.periode,
      smf: r.smf ?? '',
      tanggal_mulai: r.tanggal_mulai,
      tanggal_selesai: r.tanggal_selesai ?? '',
      status: r.status,
      jumlah_kasus: r.jumlah_kasus,
      jumlah_komplikasi: r.jumlah_komplikasi,
      alos: r.alos,
      kepatuhan_cp: r.kepatuhan_cp,
      kelengkapan_klpcm: r.kelengkapan_klpcm,
      nilai_rekan: r.nilai_rekan,
      catatan_rekan: r.catatan_rekan ?? '',
      rekomendasi: r.rekomendasi,
      catatan_komite: r.catatan_komite ?? '',
      tanggal_keputusan: r.tanggal_keputusan ?? '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditData(null);
  }

  function handleSave() {
    if (!form.pegawai_id) { toast.error('Pilih klinisi'); return; }
    const payload = {
      ...form,
      smf:              form.smf || undefined,
      tanggal_selesai:  form.tanggal_selesai || undefined,
      catatan_rekan:    form.catatan_rekan || undefined,
      catatan_komite:   form.catatan_komite || undefined,
      tanggal_keputusan: form.tanggal_keputusan || undefined,
    };
    saveMutation.mutate(payload);
  }

  // Live score preview in modal
  const liveScore = computeScore(form.kepatuhan_cp, form.kelengkapan_klpcm, form.nilai_rekan);

  const setN = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
    setForm(f => ({ ...f, [key]: v }));
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            OPPE / FPPE — Evaluasi Praktik Klinis
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            KARS Standar KKS · Ongoing & Focused Professional Practice Evaluation
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" /> Tambah Evaluasi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Evaluasi', value: summaryData?.total ?? '—', color: 'text-gray-800' },
          { label: 'Berlangsung',    value: summaryData?.berlangsung ?? '—', color: 'text-blue-700' },
          { label: 'Selesai',        value: summaryData?.selesai ?? '—', color: 'text-green-700' },
          { label: 'Tindak Lanjut',  value: summaryData?.tindak_lanjut ?? '—', color: 'text-orange-600' },
          { label: 'Rata-rata Nilai',value: summaryData?.rata_nilai != null ? `${summaryData.rata_nilai}` : '—', color: 'text-purple-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Rekomendasi distribution */}
      {summaryData?.rekomendasi && Object.keys(summaryData.rekomendasi).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">Distribusi Rekomendasi (Evaluasi Selesai)</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(summaryData.rekomendasi) as [Rekomendasi, number][]).map(([rek, jml]) => (
              <span key={rek} className={`px-3 py-1 rounded-full text-xs font-medium ${rekomendasiCfg[rek]}`}>
                {rek} · {jml}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, SMF, periode..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">OPPE & FPPE</option>
            <option value="OPPE">OPPE</option>
            <option value="FPPE">FPPE</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Semua Status</option>
            {(['Draft','Berlangsung','Selesai','Tindak Lanjut'] as Status[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Records table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Klinisi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis & Periode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Metrik Klinis</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Nilai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Rekomendasi</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400 text-sm">Memuat data...</td></tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <ClipboardList className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">Belum ada evaluasi OPPE/FPPE</p>
                  </td>
                </tr>
              ) : records.map(r => {
                const sc = statusCfg[r.status];
                const Icon = sc.icon;
                return (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">{r.pegawai?.nama ?? '—'}</p>
                      <p className="text-xs text-gray-400">{r.pegawai?.unit_kerja ?? r.smf ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.jenis === 'OPPE' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>{r.jenis}</span>
                      <p className="text-xs text-gray-600 mt-1">{r.periode}</p>
                      <p className="text-[10px] text-gray-400">{fmtDate(r.tanggal_mulai)}{r.tanggal_selesai ? ` – ${fmtDate(r.tanggal_selesai)}` : ''}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {r.jumlah_kasus > 0 && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{r.jumlah_kasus} kasus</span>}
                        {r.kepatuhan_cp != null && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">CP {r.kepatuhan_cp}%</span>}
                        {r.kelengkapan_klpcm != null && <span className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded">RM {r.kelengkapan_klpcm}%</span>}
                        {r.nilai_rekan != null && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Rekan {r.nilai_rekan}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ScoreBadge nilai={r.nilai_total ?? undefined} predikat={r.predikat} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {r.rekomendasi
                        ? <span className={`text-xs px-2 py-0.5 rounded font-medium ${rekomendasiCfg[r.rekomendasi]}`}>{r.rekomendasi}</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                        <Icon className="w-3 h-3" />{r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
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

      {/* ── Panduan KARS ── */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-purple-800 space-y-1">
            <p className="font-semibold">KARS KKS — Ketentuan OPPE/FPPE</p>
            <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-purple-700">
              <span><ChevronRight className="w-3 h-3 inline" /> OPPE: evaluasi rutin tiap <strong>6 bulan</strong> untuk semua klinisi ber-SPK</span>
              <span><ChevronRight className="w-3 h-3 inline" /> FPPE: wajib untuk <strong>kredensial awal</strong> atau setelah insiden/komplain</span>
              <span><ChevronRight className="w-3 h-3 inline" /> Bobot nilai: Clinical Pathway <strong>40%</strong> · Kelengkapan RM <strong>30%</strong> · Peer Review <strong>30%</strong></span>
              <span><ChevronRight className="w-3 h-3 inline" /> Nilai &lt; 60 → wajib Batasi/Cabut Kewenangan, laporkan ke Komite Medik</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Tambah / Edit ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-600" />
                {editData ? 'Edit Evaluasi' : 'Tambah Evaluasi OPPE/FPPE'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Identitas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">ID Pegawai (Klinisi) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={form.pegawai_id || ''}
                    onChange={e => setForm(f => ({ ...f, pegawai_id: parseInt(e.target.value) || 0 }))}
                    placeholder="ID pegawai dari sistem"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Masukkan ID numerik pegawai dari halaman Data Pegawai</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis <span className="text-red-500">*</span></label>
                  <select value={form.jenis} onChange={e => setForm(f => ({ ...f, jenis: e.target.value as Jenis }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="OPPE">OPPE — Evaluasi Rutin</option>
                    <option value="FPPE">FPPE — Evaluasi Terarah</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Periode <span className="text-red-500">*</span></label>
                  <select value={form.periode} onChange={e => setForm(f => ({ ...f, periode: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {PERIODE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">SMF / Unit Klinis</label>
                  <input value={form.smf ?? ''} onChange={e => setForm(f => ({ ...f, smf: e.target.value }))} placeholder="cth: SMF Bedah, SMF Penyakit Dalam" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Mulai <span className="text-red-500">*</span></label>
                  <input type="date" value={form.tanggal_mulai} onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Selesai</label>
                  <input type="date" value={form.tanggal_selesai ?? ''} onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status <span className="text-red-500">*</span></label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {(['Draft','Berlangsung','Selesai','Tindak Lanjut'] as Status[]).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Metrik Klinis */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-3">Metrik Klinis</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Jumlah Kasus</label>
                    <input type="number" min="0" value={form.jumlah_kasus} onChange={e => setForm(f => ({ ...f, jumlah_kasus: parseInt(e.target.value) || 0 }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Jumlah Komplikasi</label>
                    <input type="number" min="0" value={form.jumlah_komplikasi} onChange={e => setForm(f => ({ ...f, jumlah_komplikasi: parseInt(e.target.value) || 0 }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">ALOS (hari)</label>
                    <input type="number" min="0" step="0.1" value={form.alos ?? ''} onChange={setN('alos')} placeholder="Avg length of stay" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Komponen Penilaian + Live Score */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-700">Komponen Penilaian</p>
                  {liveScore != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">Preview nilai:</span>
                      <span className={`text-sm font-bold ${predikatCfg[scoreToPredikat(liveScore)] ?? 'text-gray-700'}`}>{liveScore}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${rekomendasiCfg[scoreToRekomendasi(liveScore)]}`}>{scoreToRekomendasi(liveScore)}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">
                      Kepatuhan Clinical Pathway
                      <span className="ml-1 text-purple-500 font-semibold">(40%)</span>
                    </label>
                    <div className="relative">
                      <input type="number" min="0" max="100" step="0.1" value={form.kepatuhan_cp ?? ''} onChange={setN('kepatuhan_cp')} placeholder="0–100" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">
                      Kelengkapan KLPCM
                      <span className="ml-1 text-purple-500 font-semibold">(30%)</span>
                    </label>
                    <div className="relative">
                      <input type="number" min="0" max="100" step="0.1" value={form.kelengkapan_klpcm ?? ''} onChange={setN('kelengkapan_klpcm')} placeholder="0–100" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">
                      Nilai Peer Review
                      <span className="ml-1 text-purple-500 font-semibold">(30%)</span>
                    </label>
                    <input type="number" min="0" max="100" step="0.1" value={form.nilai_rekan ?? ''} onChange={setN('nilai_rekan')} placeholder="0–100" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Catatan Peer Review</label>
                  <textarea rows={2} value={form.catatan_rekan ?? ''} onChange={e => setForm(f => ({ ...f, catatan_rekan: e.target.value }))} placeholder="Ringkasan umpan balik rekan sejawat..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Hasil Komite */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-3">Keputusan Komite</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Rekomendasi</label>
                    <select value={form.rekomendasi ?? ''} onChange={e => setForm(f => ({ ...f, rekomendasi: e.target.value as Rekomendasi || undefined }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="">— Belum ditentukan —</option>
                      <option value="Lanjutkan Kewenangan">Lanjutkan Kewenangan</option>
                      <option value="Supervisi Ketat">Supervisi Ketat</option>
                      <option value="Batasi Kewenangan">Batasi Kewenangan</option>
                      <option value="Cabut Kewenangan">Cabut Kewenangan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Tanggal Keputusan</label>
                    <input type="date" value={form.tanggal_keputusan ?? ''} onChange={e => setForm(f => ({ ...f, tanggal_keputusan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Catatan Komite</label>
                    <textarea rows={2} value={form.catatan_komite ?? ''} onChange={e => setForm(f => ({ ...f, catatan_komite: e.target.value }))} placeholder="Catatan resmi dari Komite Medik/Keperawatan..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <div><p className="font-semibold text-gray-800">Hapus Evaluasi?</p><p className="text-xs text-gray-500 mt-0.5">Tindakan ini tidak dapat dibatalkan</p></div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={() => deleteMutation.mutate(showDeleteConfirm)} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
