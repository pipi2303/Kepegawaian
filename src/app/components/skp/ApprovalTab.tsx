import React, { useState, useMemo } from 'react';
import {
  Send, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown,
  ChevronUp, MessageSquare, History, Eye, Filter, FileCheck,
  RotateCcw, ChevronRight, User2,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { SKPRecord } from '../../types';
import { toast } from 'sonner';

// ─── Approval Types ───────────────────────────────────────────────────────────
type ApprovalStatus = 'Belum Diajukan' | 'Diajukan' | 'Disetujui Atasan' | 'Perlu Revisi' | 'Final';
interface ApprovalHistory {
  tgl: string;
  aksi: string;
  oleh: string;
  catatan?: string;
}
interface ApprovalData {
  status: ApprovalStatus;
  history: ApprovalHistory[];
}

const APPROVAL_KEY = (id: string) => `skp_approval_v2_${id}`;

function loadApproval(skpId: string): ApprovalData {
  try {
    const r = localStorage.getItem(APPROVAL_KEY(skpId));
    return r ? JSON.parse(r) : { status: 'Belum Diajukan', history: [] };
  } catch { return { status: 'Belum Diajukan', history: [] }; }
}
function saveApproval(skpId: string, data: ApprovalData) {
  try { localStorage.setItem(APPROVAL_KEY(skpId), JSON.stringify(data)); } catch {}
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_APPROVAL_CFG: Record<ApprovalStatus, { color: string; bg: string; border: string; icon: React.ElementType; step: number }> = {
  'Belum Diajukan': { color: 'text-gray-600',    bg: 'bg-gray-100',    border: 'border-gray-200',    icon: Clock,         step: 0 },
  'Diajukan':       { color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-200',    icon: Send,          step: 1 },
  'Disetujui Atasan':{ color: 'text-indigo-700', bg: 'bg-indigo-100',  border: 'border-indigo-200',  icon: CheckCircle2,  step: 2 },
  'Perlu Revisi':   { color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-200',  icon: RotateCcw,     step: 1 },
  'Final':          { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: FileCheck,     step: 3 },
};

const STEPS = ['Belum Diajukan', 'Diajukan', 'Disetujui Atasan', 'Final'];
const PREDIKAT_CFG: Record<string, { color: string; bg: string }> = {
  'Sangat Baik': { color: 'text-emerald-700', bg: 'bg-emerald-100' },
  'Baik':        { color: 'text-blue-700',    bg: 'bg-blue-100'    },
  'Cukup':       { color: 'text-yellow-700',  bg: 'bg-yellow-100'  },
  'Kurang':      { color: 'text-orange-700',  bg: 'bg-orange-100'  },
  'Sangat Kurang':{ color: 'text-red-700',    bg: 'bg-red-100'     },
};
const STATUS_SKP_CFG: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-600', 'Aktif': 'bg-blue-100 text-blue-700', 'Selesai': 'bg-green-100 text-green-700',
};

// ─── Approval Steps Bar ───────────────────────────────────────────────────────
function ApprovalStepsBar({ currentStatus }: { currentStatus: ApprovalStatus }) {
  const currentStep = STATUS_APPROVAL_CFG[currentStatus].step;
  const isRevisi = currentStatus === 'Perlu Revisi';
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const active = idx <= currentStep && !isRevisi;
        const isCurrent = (step === currentStatus) || (isRevisi && idx === 1);
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              active ? 'bg-blue-600 text-white' : isRevisi && idx === 1 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'
            }`}>
              {idx === 0 && <Clock className="w-2.5 h-2.5" />}
              {idx === 1 && !isRevisi && <Send className="w-2.5 h-2.5" />}
              {idx === 1 && isRevisi && <RotateCcw className="w-2.5 h-2.5" />}
              {idx === 2 && <CheckCircle2 className="w-2.5 h-2.5" />}
              {idx === 3 && <FileCheck className="w-2.5 h-2.5" />}
              <span className="hidden sm:inline">{isRevisi && idx === 1 ? 'Revisi' : step.replace('Belum Diajukan','Baru')}</span>
            </div>
            {idx < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ApprovalTab() {
  const { skp, pegawai, currentUser } = useAppContext();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPegawai, setFilterPegawai] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalData>>(() =>
    Object.fromEntries(skp.map(s => [s.id, loadApproval(s.id)]))
  );
  // Modal state
  const [modalSKP, setModalSKP] = useState<SKPRecord | null>(null);
  const [modalAction, setModalAction] = useState<'ajukan' | 'setujui' | 'tolak' | 'final' | null>(null);
  const [catatan, setCatatan] = useState('');

  const getApproval = (id: string) => approvalStates[id] ?? loadApproval(id);
  const updateApproval = (skpId: string, newData: ApprovalData) => {
    saveApproval(skpId, newData);
    setApprovalStates(prev => ({ ...prev, [skpId]: newData }));
  };

  const filteredSKP = useMemo(() =>
    skp.filter(s => {
      if (filterPegawai && s.pegawaiId !== filterPegawai) return false;
      if (filterStatus) {
        const appr = getApproval(s.id);
        if (appr.status !== filterStatus) return false;
      }
      return true;
    }),
    [skp, filterPegawai, filterStatus, approvalStates]
  );

  const stats = useMemo(() => {
    const all = skp.map(s => getApproval(s.id).status);
    return {
      belum: all.filter(s => s === 'Belum Diajukan').length,
      diajukan: all.filter(s => s === 'Diajukan').length,
      disetujui: all.filter(s => s === 'Disetujui Atasan').length,
      revisi: all.filter(s => s === 'Perlu Revisi').length,
      final: all.filter(s => s === 'Final').length,
    };
  }, [skp, approvalStates]);

  const getPegawai = (id: string) => pegawai.find(p => p.id === id);
  const getFullName = (id: string) => {
    const p = getPegawai(id);
    return p ? `${p.gelarDepan || ''} ${p.nama}`.trim() : id;
  };

  const toggleHistory = (id: string) =>
    setExpandedHistory(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAction = () => {
    if (!modalSKP || !modalAction) return;
    const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const aktor = currentUser ? `${currentUser.nama} (${currentUser.role})` : 'Admin HR';
    const appr = { ...getApproval(modalSKP.id) };
    const hist: ApprovalHistory = { tgl: now, oleh: aktor, catatan: catatan || undefined, aksi: '' };

    if (modalAction === 'ajukan') {
      hist.aksi = 'SKP diajukan untuk persetujuan';
      appr.status = 'Diajukan';
      toast.success('SKP berhasil diajukan ke atasan');
    } else if (modalAction === 'setujui') {
      hist.aksi = 'SKP disetujui oleh atasan';
      appr.status = 'Disetujui Atasan';
      toast.success('SKP disetujui. Status: Disetujui Atasan');
    } else if (modalAction === 'tolak') {
      if (!catatan.trim()) { toast.error('Catatan wajib diisi saat menolak/meminta revisi'); return; }
      hist.aksi = 'SKP dikembalikan — perlu revisi';
      appr.status = 'Perlu Revisi';
      toast.warning('SKP dikembalikan untuk revisi');
    } else if (modalAction === 'final') {
      hist.aksi = 'SKP ditetapkan sebagai Final';
      appr.status = 'Final';
      toast.success('🎉 SKP ditetapkan Final!');
    }

    appr.history = [...appr.history, hist];
    updateApproval(modalSKP.id, appr);
    setModalSKP(null);
    setModalAction(null);
    setCatatan('');
  };

  const ACTION_LABELS: Record<string, string> = {
    ajukan: 'Ajukan SKP', setujui: 'Setujui SKP', tolak: 'Minta Revisi', final: 'Tetapkan Final',
  };
  const ACTION_COLORS: Record<string, string> = {
    ajukan: 'bg-blue-600 hover:bg-blue-700', setujui: 'bg-emerald-600 hover:bg-emerald-700',
    tolak: 'bg-orange-500 hover:bg-orange-600', final: 'bg-purple-600 hover:bg-purple-700',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <FileCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Alur Persetujuan SKP (Approval Workflow)</p>
          <p className="text-xs text-blue-600 mt-0.5">Kelola siklus hidup SKP: dari penyusunan draft, pengajuan ke atasan, persetujuan bertingkat, hingga penetapan final. Setiap langkah tercatat dalam log riwayat persetujuan.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Belum Diajukan', value: stats.belum, cls: 'bg-gray-50 border-gray-200 text-gray-700' },
          { label: 'Diajukan', value: stats.diajukan, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Disetujui', value: stats.disetujui, cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
          { label: 'Perlu Revisi', value: stats.revisi, cls: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Final', value: stats.final, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-3 text-center ${c.cls}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-[10px] mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <select value={filterPegawai} onChange={e => setFilterPegawai(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Semua Pegawai</option>
          {pegawai.map(p => <option key={p.id} value={p.id}>{p.gelarDepan || ''} {p.nama} — {p.unitKerja}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="w-full sm:w-52 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Semua Status Persetujuan</option>
          {Object.keys(STATUS_APPROVAL_CFG).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* SKP Approval List */}
      <div className="space-y-3">
        {filteredSKP.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Tidak ada SKP ditemukan</p>
          </div>
        ) : filteredSKP.map(s => {
          const appr = getApproval(s.id);
          const cfg = STATUS_APPROVAL_CFG[appr.status];
          const p = getPegawai(s.pegawaiId);
          const prCfg = s.predikat ? PREDIKAT_CFG[s.predikat] : null;
          const showHistory = expandedHistory.has(s.id);

          return (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Main row */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  {/* Left: identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {p?.nama.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{getFullName(s.pegawaiId)}</p>
                      <p className="text-xs text-gray-500 truncate">{p?.jabatan} · Sem. {s.semester}/{s.tahun}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_SKP_CFG[s.status]}`}>{s.status}</span>
                        {s.nilaiAkhir != null && <span className="text-[10px] text-gray-500 font-medium">KPI: {s.nilaiAkhir}</span>}
                        {s.predikat && prCfg && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${prCfg.bg} ${prCfg.color}`}>{s.predikat}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: approval status + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      <cfg.icon className="w-3.5 h-3.5" />
                      {appr.status}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* Action buttons based on status */}
                      {appr.status === 'Belum Diajukan' && (
                        <button onClick={() => { setModalSKP(s); setModalAction('ajukan'); setCatatan(''); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                          <Send className="w-3 h-3" /> Ajukan SKP
                        </button>
                      )}
                      {appr.status === 'Perlu Revisi' && (
                        <button onClick={() => { setModalSKP(s); setModalAction('ajukan'); setCatatan(''); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors">
                          <RotateCcw className="w-3 h-3" /> Ajukan Ulang
                        </button>
                      )}
                      {appr.status === 'Diajukan' && (
                        <div className="contents">
                          <button onClick={() => { setModalSKP(s); setModalAction('setujui'); setCatatan(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors">
                            <CheckCircle2 className="w-3 h-3" /> Setujui
                          </button>
                          <button onClick={() => { setModalSKP(s); setModalAction('tolak'); setCatatan(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors">
                            <XCircle className="w-3 h-3" /> Revisi
                          </button>
                        </div>
                      )}
                      {appr.status === 'Disetujui Atasan' && (
                        <button onClick={() => { setModalSKP(s); setModalAction('final'); setCatatan(''); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
                          <FileCheck className="w-3 h-3" /> Tetapkan Final
                        </button>
                      )}
                      {appr.history.length > 0 && (
                        <button onClick={() => toggleHistory(s.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors">
                          <History className="w-3 h-3" />
                          Log ({appr.history.length})
                          {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Steps bar */}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <ApprovalStepsBar currentStatus={appr.status} />
                </div>
              </div>

              {/* History Log */}
              {showHistory && appr.history.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-600 mb-2 mt-3">Riwayat Persetujuan</p>
                  <div className="space-y-2">
                    {[...appr.history].reverse().map((h, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-700">{h.aksi}</p>
                          <p className="text-gray-400">oleh <strong>{h.oleh}</strong> — {h.tgl}</p>
                          {h.catatan && <p className="mt-0.5 text-orange-600 italic">"{h.catatan}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Modal */}
      {modalSKP && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalSKP(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{ACTION_LABELS[modalAction]}</h2>
              <button onClick={() => setModalSKP(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* SKP Info */}
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-blue-800">{getFullName(modalSKP.pegawaiId)}</p>
                <p className="text-xs text-blue-600">SKP Semester {modalSKP.semester} — {modalSKP.tahun}</p>
                {modalSKP.nilaiAkhir && (
                  <p className="text-xs text-blue-500 mt-0.5">Nilai KPI: {modalSKP.nilaiAkhir} ({modalSKP.predikat})</p>
                )}
              </div>

              {/* Context messages */}
              {modalAction === 'ajukan' && (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
                  <p>SKP akan dikirim ke Pejabat Penilai Kinerja (atasan langsung) untuk direview dan disetujui.</p>
                </div>
              )}
              {modalAction === 'setujui' && (
                <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-700">
                  <p>Dengan menyetujui, SKP ini akan berpindah ke status <strong>Disetujui Atasan</strong> dan siap ditetapkan Final.</p>
                </div>
              )}
              {modalAction === 'tolak' && (
                <div className="p-3 bg-orange-50 rounded-xl text-xs text-orange-700">
                  <p><strong>Wajib isi catatan</strong> untuk memberikan arahan revisi kepada pegawai.</p>
                </div>
              )}
              {modalAction === 'final' && (
                <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-700">
                  <p>SKP akan ditetapkan <strong>Final</strong> sebagai dokumen resmi penilaian kinerja semester ini.</p>
                </div>
              )}

              {/* Catatan */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">
                  Catatan {modalAction === 'tolak' ? '(Wajib)' : '(Opsional)'}
                </label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={3}
                  placeholder={modalAction === 'tolak' ? 'Tuliskan arahan revisi secara spesifik...' : 'Catatan tambahan (opsional)...'}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModalSKP(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Batal</button>
              <button onClick={handleAction} className={`px-5 py-2 text-sm text-white rounded-xl font-medium ${ACTION_COLORS[modalAction]}`}>
                {ACTION_LABELS[modalAction]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
