import React, { useState, useMemo } from 'react';
import {
  Shield, Search, Plus, Eye, Edit2, Trash2, X, AlertTriangle, CheckCircle,
  Clock, FileText, Award, ChevronDown, ChevronUp, RefreshCw, Star,
  AlertCircle, BookOpen, TrendingUp, Users, BadgeCheck, Activity,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { STRRecord, SIPRecord, CredentialingRecord, KewenangaKlinis, CPDRecord } from '../types';
import { dataCPD as initialCPD } from '../data/mockDataRS';
import { toast } from 'sonner';

type TabType = 'str' | 'sip' | 'credentialing' | 'cpd';

// ─── Config ───────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  'Aktif':              { bg: 'bg-green-50',  color: 'text-green-700',  icon: CheckCircle },
  'Akan Expired':       { bg: 'bg-yellow-50', color: 'text-yellow-700', icon: AlertTriangle },
  'Expired':            { bg: 'bg-red-50',    color: 'text-red-700',    icon: AlertTriangle },
  'Selesai':            { bg: 'bg-green-50',  color: 'text-green-700',  icon: CheckCircle },
  'Pengajuan':          { bg: 'bg-gray-50',   color: 'text-gray-600',   icon: Clock },
  'Verifikasi Dokumen': { bg: 'bg-blue-50',   color: 'text-blue-700',   icon: FileText },
  'Peer Review':        { bg: 'bg-purple-50', color: 'text-purple-700', icon: Eye },
  'Komite Medik':       { bg: 'bg-indigo-50', color: 'text-indigo-700', icon: Shield },
  'Ditolak':            { bg: 'bg-red-50',    color: 'text-red-700',    icon: X },
  'Diverifikasi':       { bg: 'bg-green-50',  color: 'text-green-700',  icon: CheckCircle },
  'Pending':            { bg: 'bg-yellow-50', color: 'text-yellow-700', icon: Clock },
};

const levelColor: Record<string, string> = {
  'Mandiri':         'bg-green-100 text-green-700',
  'Dengan Supervisi':'bg-yellow-100 text-yellow-700',
  'Tidak Berwenang': 'bg-red-100 text-red-700',
};

const WORKFLOW_STEPS = ['Pengajuan','Verifikasi Dokumen','Peer Review','Komite Medik','Selesai'];

// SKP target per konsil (5 tahun)
const SKP_TARGET: Record<string, number> = {
  'Konsil Kedokteran Indonesia (KKI)': 250,
  'Konsil Keperawatan Indonesia': 25,
  'Konsil Kebidanan Indonesia': 25,
  'Konsil Tenaga Kefarmasian': 150,
  'Konsil ATLM': 25,
  'Konsil Tenaga Gizi': 25,
  'Konsil Kesehatan Indonesia': 25,
  'default': 25,
};

const JENIS_TENAGA_LIST = [
  'Dokter Spesialis Penyakit Dalam','Dokter Spesialis Bedah','Dokter Spesialis Radiologi',
  'Dokter Spesialis Obstetri & Ginekologi','Dokter Spesialis Anak','Dokter Spesialis Anestesi',
  'Dokter Umum','Perawat','Bidan','Apoteker',
  'Ahli Teknologi Laboratorium Medik','Nutrisionis','Teknisi Elektromedik','Perekam Medis',
];
const KONSIL_LIST = [
  'Konsil Kedokteran Indonesia (KKI)','Konsil Keperawatan Indonesia','Konsil Kebidanan Indonesia',
  'Konsil Tenaga Kefarmasian','Konsil ATLM','Konsil Tenaga Gizi','Konsil Kesehatan Indonesia',
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function daysUntilExpiry(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : '—';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ComplianceBar({ label, aktif, total, color }: { label: string; aktif: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((aktif / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-gray-400">{aktif}/{total} Aktif</p>
    </div>
  );
}

function WorkflowStepper({ status }: { status: string }) {
  const idx = WORKFLOW_STEPS.indexOf(status);
  const isDitolak = status === 'Ditolak';
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = idx > i;
        const active = idx === i;
        return (
          <div className="contents" key={step}>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
              isDitolak && active ? 'bg-red-100 text-red-700' :
              active ? 'bg-blue-600 text-white' :
              done ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done && !isDitolak ? <CheckCircle className="w-2.5 h-2.5" /> : <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">{i+1}</span>}
              <span className="hidden sm:inline">{step}</span>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && <div className={`h-px w-3 ${done ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Credentialing() {
  const { str, sip, credentialing, pegawai, cpd,
    addSTR, updateSTR, deleteSTR,
    addSIP, updateSIP, deleteSIP,
    addCredentialing, updateCredentialing, deleteCredentialing,
    addCPD, updateCPD, deleteCPD,
  } = useAppContext();

  // Seed CPD initial data once
  const allCPD = cpd.length > 0 ? cpd : initialCPD as CPDRecord[];

  const [activeTab, setActiveTab] = useState<TabType>('str');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<STRRecord | SIPRecord | CredentialingRecord | CPDRecord | null>(null);
  const [detailCred, setDetailCred] = useState<CredentialingRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expandedKew, setExpandedKew] = useState<string | null>(null);
  const [cpdFilter, setCpdFilter] = useState('');

  // Helpers
  const getFullName = (id: string) => {
    const p = pegawai.find(x => x.id === id);
    if (!p) return '—';
    return `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`;
  };
  const getPegawai = (id: string) => pegawai.find(x => x.id === id);

  // ── Empty forms ──────────────────────────────────────────────────────────
  const emptySTR: Omit<STRRecord,'id'> = { pegawaiId:'', nomorSTR:'', jenisTenaga:'', konsil:'', tanggalTerbit:'', tanggalExpired:'', status:'Aktif' };
  const emptySIP: Omit<SIPRecord,'id'> = { pegawaiId:'', nomorSIP:'', jenisDokumen:'SIP', jenisPraktik:'', fasyankes:'Rumah Sakit', instansiPenerbit:'', tanggalTerbit:'', tanggalExpired:'', status:'Aktif' };
  const emptyCred: Omit<CredentialingRecord,'id'> = { pegawaiId:'', jenis:'Kredensial Awal', tanggalPengajuan:'', statusKredensial:'Pengajuan', kewenangan:[] };
  const emptyCPD: Omit<CPDRecord,'id'> = { pegawaiId:'', tahun: new Date().getFullYear(), namaKegiatan:'', jenisKegiatan:'Seminar', penyelenggara:'', tanggal:'', skp:0, diakuiOleh:'', status:'Pending' };

  const [formSTR, setFormSTR] = useState<Omit<STRRecord,'id'>>(emptySTR);
  const [formSIP, setFormSIP] = useState<Omit<SIPRecord,'id'>>(emptySIP);
  const [formCred, setFormCred] = useState<Omit<CredentialingRecord,'id'>>(emptyCred);
  const [formCPD, setFormCPD] = useState<Omit<CPDRecord,'id'>>(emptyCPD);
  const [newKew, setNewKew] = useState<Partial<KewenangaKlinis>>({ kode:'', namaKewenangan:'', kategori:'', level:'Mandiri' });

  // ── Filtered lists ────────────────────────────────────────────────────────
  const strFiltered = useMemo(() => str.filter(s => {
    const nm = getFullName(s.pegawaiId).toLowerCase();
    const q = search.toLowerCase();
    return (!search || nm.includes(q) || s.nomorSTR.toLowerCase().includes(q) || s.jenisTenaga.toLowerCase().includes(q))
        && (!filterStatus || s.status === filterStatus)
        && (!filterJenis || s.jenisTenaga === filterJenis);
  }), [str, search, filterStatus, filterJenis, pegawai]);

  const sipFiltered = useMemo(() => sip.filter(s => {
    const nm = getFullName(s.pegawaiId).toLowerCase();
    const q = search.toLowerCase();
    return (!search || nm.includes(q) || s.nomorSIP.toLowerCase().includes(q))
        && (!filterStatus || s.status === filterStatus)
        && (!filterJenis || s.jenisDokumen === filterJenis);
  }), [sip, search, filterStatus, filterJenis, pegawai]);

  const credFiltered = useMemo(() => credentialing.filter(c => {
    const nm = getFullName(c.pegawaiId).toLowerCase();
    const q = search.toLowerCase();
    return (!search || nm.includes(q))
        && (!filterStatus || c.statusKredensial === filterStatus)
        && (!filterJenis || c.jenis === filterJenis);
  }), [credentialing, search, filterStatus, filterJenis, pegawai]);

  const cpdFiltered = useMemo(() => allCPD.filter(c => {
    const nm = getFullName(c.pegawaiId).toLowerCase();
    const q = search.toLowerCase();
    return (!search || nm.includes(q) || c.namaKegiatan.toLowerCase().includes(q) || c.penyelenggara.toLowerCase().includes(q))
        && (!filterStatus || c.status === filterStatus)
        && (!cpdFilter || c.pegawaiId === cpdFilter);
  }), [allCPD, search, filterStatus, cpdFilter, pegawai]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const expiredSTR = str.filter(s => s.status === 'Expired').length;
  const akanExpiredSTR = str.filter(s => s.status === 'Akan Expired').length;
  const expiredSIP = sip.filter(s => s.status === 'Expired').length;
  const akanExpiredSIP = sip.filter(s => s.status === 'Akan Expired').length;
  const pendingCred = credentialing.filter(c => c.statusKredensial !== 'Selesai' && c.statusKredensial !== 'Ditolak').length;
  const totalSKP = allCPD.filter(c => c.status === 'Diverifikasi').reduce((a,b) => a + b.skp, 0);

  // Alert items
  const criticalAlerts = [
    ...str.filter(s => s.status === 'Expired').map(s => ({ type: 'STR Expired', name: getFullName(s.pegawaiId), detail: s.nomorSTR, color: 'red' })),
    ...str.filter(s => s.status === 'Akan Expired').map(s => ({ type: 'STR Akan Expired', name: getFullName(s.pegawaiId), detail: `${daysUntilExpiry(s.tanggalExpired)} hari lagi`, color: 'yellow' })),
    ...sip.filter(s => s.status === 'Expired').map(s => ({ type: 'SIP/SIK Expired', name: getFullName(s.pegawaiId), detail: s.nomorSIP, color: 'red' })),
    ...credentialing.filter(c => c.tanggalExpired && daysUntilExpiry(c.tanggalExpired!) <= 90 && c.statusKredensial === 'Selesai').map(c => ({ type: 'Kredensial Segera Expired', name: getFullName(c.pegawaiId), detail: `${daysUntilExpiry(c.tanggalExpired!)} hari lagi`, color: 'orange' })),
  ];

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditData(null);
    if (activeTab === 'str') setFormSTR(emptySTR);
    else if (activeTab === 'sip') setFormSIP(emptySIP);
    else if (activeTab === 'credentialing') setFormCred(emptyCred);
    else setFormCPD(emptyCPD);
    setShowModal(true);
  };

  const handleSaveSTR = () => {
    if (!formSTR.pegawaiId || !formSTR.nomorSTR || !formSTR.jenisTenaga) { toast.error('Pegawai, Nomor STR, dan Jenis Tenaga wajib diisi'); return; }
    if (editData && 'nomorSTR' in editData) { updateSTR({ ...formSTR, id: editData.id } as STRRecord); toast.success('STR berhasil diperbarui'); }
    else { addSTR(formSTR); toast.success('STR berhasil ditambahkan'); }
    setShowModal(false);
  };

  const handleSaveSIP = () => {
    if (!formSIP.pegawaiId || !formSIP.nomorSIP) { toast.error('Pegawai dan Nomor SIP/SIK wajib diisi'); return; }
    if (editData && 'nomorSIP' in editData) { updateSIP({ ...formSIP, id: editData.id } as SIPRecord); toast.success('SIP/SIK berhasil diperbarui'); }
    else { addSIP(formSIP); toast.success('SIP/SIK berhasil ditambahkan'); }
    setShowModal(false);
  };

  const handleSaveCred = () => {
    if (!formCred.pegawaiId || !formCred.tanggalPengajuan) { toast.error('Pegawai dan Tanggal Pengajuan wajib diisi'); return; }
    if (editData && 'statusKredensial' in editData) { updateCredentialing({ ...formCred, id: editData.id } as CredentialingRecord); toast.success('Data kredensial berhasil diperbarui'); }
    else { addCredentialing(formCred); toast.success('Pengajuan kredensial berhasil disimpan'); }
    setShowModal(false);
  };

  const handleSaveCPD = () => {
    if (!formCPD.pegawaiId || !formCPD.namaKegiatan || formCPD.skp <= 0) { toast.error('Pegawai, nama kegiatan, dan SKP wajib diisi'); return; }
    if (editData && 'jenisKegiatan' in editData && 'skp' in editData) { updateCPD({ ...formCPD, id: editData.id } as CPDRecord); toast.success('Data CPD berhasil diperbarui'); }
    else { addCPD(formCPD); toast.success('Kegiatan CPD berhasil ditambahkan'); }
    setShowModal(false);
  };

  const addKewenangan = () => {
    if (!newKew.namaKewenangan || !newKew.kode) { toast.error('Kode dan nama kewenangan wajib diisi'); return; }
    const kw: KewenangaKlinis = { id: `KW${Date.now()}`, kode: newKew.kode!, namaKewenangan: newKew.namaKewenangan!, kategori: newKew.kategori || '', level: newKew.level as KewenangaKlinis['level'] || 'Mandiri' };
    setFormCred(f => ({ ...f, kewenangan: [...f.kewenangan, kw] }));
    setNewKew({ kode:'', namaKewenangan:'', kategori:'', level:'Mandiri' });
  };

  const removeKew = (id: string) => setFormCred(f => ({ ...f, kewenangan: f.kewenangan.filter(k => k.id !== id) }));

  const handleDelete = (id: string) => {
    if (activeTab === 'str') deleteSTR(id);
    else if (activeTab === 'sip') deleteSIP(id);
    else if (activeTab === 'credentialing') deleteCredentialing(id);
    else deleteCPD(id);
    setShowDeleteConfirm(null);
    toast.success('Data berhasil dihapus');
  };

  const advanceWorkflow = (c: CredentialingRecord) => {
    const idx = WORKFLOW_STEPS.indexOf(c.statusKredensial);
    if (idx < 0 || idx >= WORKFLOW_STEPS.length - 1) return;
    const next = WORKFLOW_STEPS[idx + 1] as CredentialingRecord['statusKredensial'];
    updateCredentialing({ ...c, statusKredensial: next });
    setDetailCred({ ...c, statusKredensial: next });
    toast.success(`Status diperbarui → ${next}`);
  };

  const tabs: { key: TabType; label: string; count: number; icon: React.ElementType }[] = [
    { key: 'str', label: 'STR', count: str.length, icon: BadgeCheck },
    { key: 'sip', label: 'SIP / SIK', count: sip.length, icon: FileText },
    { key: 'credentialing', label: 'Kredensial & Kewenangan Klinis', count: credentialing.length, icon: Shield },
    { key: 'cpd', label: 'CPD / SKP Profesi', count: allCPD.length, icon: BookOpen },
  ];

  // CPD per-pegawai summary
  const cpdSummary = useMemo(() => {
    const map: Record<string, { nama: string; total: number; konsil: string }> = {};
    allCPD.filter(c => c.status === 'Diverifikasi').forEach(c => {
      if (!map[c.pegawaiId]) {
        const strRec = str.find(s => s.pegawaiId === c.pegawaiId);
        map[c.pegawaiId] = { nama: getFullName(c.pegawaiId), total: 0, konsil: strRec?.konsil || 'default' };
      }
      map[c.pegawaiId].total += c.skp;
    });
    return Object.entries(map).map(([id, v]) => ({ id, ...v, target: SKP_TARGET[v.konsil] || 25 }));
  }, [allCPD, str, pegawai]);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" /> Credentialing & Lisensi Tenaga Kesehatan
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">UU No. 29/2004 · UU No. 36/2014 · UU No. 17/2023 · Medical Staff Bylaws</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-semibold text-red-800">{criticalAlerts.length} Item Memerlukan Perhatian Segera</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {criticalAlerts.slice(0, 6).map((a, i) => (
              <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${a.color === 'red' ? 'bg-red-100 text-red-800' : a.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">{a.type}</span>
                  <p className="opacity-80 truncate">{a.name}</p>
                  <p className="opacity-60">{a.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'STR Aktif', value: str.filter(s=>s.status==='Aktif').length, total: str.length, sub: `${expiredSTR} Expired · ${akanExpiredSTR} Segera`, color: 'text-blue-600', bg: 'bg-blue-50', warn: expiredSTR > 0 },
          { label: 'SIP/SIK Bermasalah', value: expiredSIP + akanExpiredSIP, total: sip.length, sub: `${expiredSIP} Expired · ${akanExpiredSIP} Akan`, color: expiredSIP > 0 ? 'text-red-600' : 'text-orange-600', bg: expiredSIP > 0 ? 'bg-red-50' : 'bg-orange-50', warn: expiredSIP > 0 },
          { label: 'Proses Kredensial', value: pendingCred, total: credentialing.length, sub: `${credentialing.filter(c=>c.statusKredensial==='Selesai').length} Selesai`, color: 'text-purple-600', bg: 'bg-purple-50', warn: false },
          { label: 'Total SKP CPD', value: totalSKP, total: 250, sub: `${allCPD.length} kegiatan tercatat`, color: 'text-teal-600', bg: 'bg-teal-50', warn: false },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border ${s.warn ? 'border-red-200' : 'border-gray-200'} bg-white p-4`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Compliance Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Compliance Score Lisensi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ComplianceBar label="STR Aktif" aktif={str.filter(s=>s.status==='Aktif').length} total={str.length} color="bg-blue-500" />
          <ComplianceBar label="SIP/SIK Aktif" aktif={sip.filter(s=>s.status==='Aktif').length} total={sip.length} color="bg-teal-500" />
          <ComplianceBar label="Kredensial Valid (3 thn)" aktif={credentialing.filter(c=>c.statusKredensial==='Selesai' && (!c.tanggalExpired || daysUntilExpiry(c.tanggalExpired) > 0)).length} total={credentialing.length} color="bg-purple-500" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); setFilterStatus(''); setFilterJenis(''); }}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === t.key ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, nomor..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            {activeTab === 'credentialing'
              ? ['Pengajuan','Verifikasi Dokumen','Peer Review','Komite Medik','Selesai','Ditolak'].map(s => <option key={s} value={s}>{s}</option>)
              : activeTab === 'cpd'
              ? ['Diverifikasi','Pending','Ditolak'].map(s => <option key={s} value={s}>{s}</option>)
              : ['Aktif','Akan Expired','Expired'].map(s => <option key={s} value={s}>{s}</option>)
            }
          </select>
          {activeTab === 'str' && (
            <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Semua Jenis Tenaga</option>
              {JENIS_TENAGA_LIST.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          )}
          {activeTab === 'credentialing' && (
            <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Semua Jenis</option>
              <option value="Kredensial Awal">Kredensial Awal</option>
              <option value="Re-kredensial">Re-kredensial</option>
            </select>
          )}
          {activeTab === 'cpd' && (
            <select value={cpdFilter} onChange={e => setCpdFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Semua Pegawai</option>
              {pegawai.filter(p => ['P001','P002','P003','P004','P005','P011','P012'].includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          )}
        </div>

        {/* ── TAB: STR ── */}
        {activeTab === 'str' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tenaga Kesehatan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nomor STR</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jenis Tenaga</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Konsil Penerbit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Berlaku s.d.</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {strFiltered.length === 0
                  ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data STR</td></tr>
                  : strFiltered.map(s => {
                    const sc = statusConfig[s.status];
                    const Icon = sc.icon;
                    const days = daysUntilExpiry(s.tanggalExpired);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800 text-sm">{getFullName(s.pegawaiId)}</p>
                          <p className="text-xs text-gray-400">{getPegawai(s.pegawaiId)?.unitKerja}</p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-700">{s.nomorSTR}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{s.jenisTenaga}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{s.konsil}</td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-medium text-gray-700">{fmtDate(s.tanggalExpired)}</p>
                          {days < 90 && days > 0 && <p className="text-xs text-yellow-600 mt-0.5">{days} hari lagi</p>}
                          {days <= 0 && <p className="text-xs text-red-600 mt-0.5">Sudah expired</p>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}><Icon className="w-3 h-3" />{s.status}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditData(s); setFormSTR({ pegawaiId:s.pegawaiId, nomorSTR:s.nomorSTR, jenisTenaga:s.jenisTenaga, konsil:s.konsil, tanggalTerbit:s.tanggalTerbit, tanggalExpired:s.tanggalExpired, status:s.status }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setShowDeleteConfirm(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: SIP ── */}
        {activeTab === 'sip' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tenaga Kesehatan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nomor SIP/SIK</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jenis & Fasyankes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Instansi Penerbit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Berlaku s.d.</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {sipFiltered.length === 0
                  ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data SIP/SIK</td></tr>
                  : sipFiltered.map(s => {
                    const sc = statusConfig[s.status];
                    const Icon = sc.icon;
                    const days = daysUntilExpiry(s.tanggalExpired);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800 text-sm">{getFullName(s.pegawaiId)}</p>
                          <p className="text-xs text-gray-400">{getPegawai(s.pegawaiId)?.jabatan}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.jenisDokumen === 'SIP' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>{s.jenisDokumen}</span>
                          <p className="font-mono text-xs text-gray-700 mt-1 truncate max-w-[160px]">{s.nomorSIP}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <p className="text-xs text-gray-700">{s.jenisPraktik || s.jenisDokumen}</p>
                          <p className="text-xs text-gray-400">{s.fasyankes}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{s.instansiPenerbit}</td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-medium text-gray-700">{fmtDate(s.tanggalExpired)}</p>
                          {days < 90 && days > 0 && <p className="text-xs text-yellow-600">{days} hari lagi</p>}
                          {days <= 0 && <p className="text-xs text-red-600">Sudah expired</p>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}><Icon className="w-3 h-3" />{s.status}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditData(s); setFormSIP({ pegawaiId:s.pegawaiId, nomorSIP:s.nomorSIP, jenisDokumen:s.jenisDokumen, jenisPraktik:s.jenisPraktik||'', fasyankes:s.fasyankes, instansiPenerbit:s.instansiPenerbit, tanggalTerbit:s.tanggalTerbit, tanggalExpired:s.tanggalExpired, status:s.status }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setShowDeleteConfirm(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: CREDENTIALING ── */}
        {activeTab === 'credentialing' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tenaga Kesehatan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Alur Kredensial</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Berlaku s.d.</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {credFiltered.length === 0
                  ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada data kredensial</td></tr>
                  : credFiltered.map(c => {
                    const sc = statusConfig[c.statusKredensial] || statusConfig['Pengajuan'];
                    const Icon = sc.icon;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailCred(c)}>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800 text-sm">{getFullName(c.pegawaiId)}</p>
                          <p className="text-xs text-gray-400">{getPegawai(c.pegawaiId)?.jabatan}</p>
                          <p className="text-xs text-gray-300 mt-0.5">Pengajuan: {fmtDate(c.tanggalPengajuan)}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.jenis === 'Kredensial Awal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{c.jenis}</span>
                          <p className="text-xs text-gray-400 mt-1">{c.kewenangan.length} kewenangan</p>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <WorkflowStepper status={c.statusKredensial} />
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          {c.tanggalExpired ? (
                            <div>
                              <p className="text-xs font-medium text-gray-700">{fmtDate(c.tanggalExpired)}</p>
                              {daysUntilExpiry(c.tanggalExpired) < 90 && daysUntilExpiry(c.tanggalExpired) > 0 && <p className="text-xs text-yellow-600">{daysUntilExpiry(c.tanggalExpired)} hari lagi</p>}
                              {daysUntilExpiry(c.tanggalExpired) <= 0 && <p className="text-xs text-red-600">Perlu re-kredensial</p>}
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}><Icon className="w-3 h-3" />{c.statusKredensial}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setDetailCred(c)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setShowDeleteConfirm(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: CPD ── */}
        {activeTab === 'cpd' && (
          <div>
            {/* CPD Summary Cards */}
            {!cpdFilter && (
              <div className="p-4 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-500 mb-3">Progress SKP Profesi per Tenaga Kesehatan (Target 5 Tahun)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cpdSummary.map(s => {
                    const pct = Math.min(Math.round((s.total / s.target) * 100), 100);
                    return (
                      <div key={s.id} className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-blue-50/50 transition-colors" onClick={() => setCpdFilter(s.id)}>
                        <p className="text-xs font-medium text-gray-700 truncate">{s.nama}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-12 text-right">{s.total}/{s.target}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{pct}% terpenuhi</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tenaga Kesehatan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Kegiatan CPD</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jenis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tanggal</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">SKP</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {cpdFiltered.length === 0
                    ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data CPD</td></tr>
                    : cpdFiltered.map(c => {
                      const sc = statusConfig[c.status];
                      const Icon = sc.icon;
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-gray-800 text-sm">{getFullName(c.pegawaiId)}</p>
                            <p className="text-xs text-gray-400">{c.tahun}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm text-gray-700 font-medium">{c.namaKegiatan}</p>
                            <p className="text-xs text-gray-400">{c.penyelenggara}</p>
                            {c.nomorSertifikat && <p className="text-xs text-gray-300 mt-0.5 font-mono">{c.nomorSertifikat}</p>}
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{c.jenisKegiatan}</span>
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-600">{fmtDate(c.tanggal)}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-sm font-bold text-blue-700">{c.skp}</span>
                            <p className="text-[10px] text-gray-400">SKP</p>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}><Icon className="w-3 h-3" />{c.status}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => { setEditData(c); setFormCPD({ pegawaiId:c.pegawaiId, tahun:c.tahun, namaKegiatan:c.namaKegiatan, jenisKegiatan:c.jenisKegiatan, penyelenggara:c.penyelenggara, tanggal:c.tanggal, skp:c.skp, nomorSertifikat:c.nomorSertifikat||'', diakuiOleh:c.diakuiOleh, status:c.status }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setShowDeleteConfirm(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal STR ── */}
      {showModal && activeTab === 'str' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-blue-600" />{editData ? 'Edit STR' : 'Tambah STR'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai <span className="text-red-500">*</span></label>
                <select value={formSTR.pegawaiId} onChange={e => setFormSTR(f => ({ ...f, pegawaiId: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.gelarDepan ? p.gelarDepan+' ' : ''}{p.nama}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor STR <span className="text-red-500">*</span></label>
                <input value={formSTR.nomorSTR} onChange={e => setFormSTR(f => ({ ...f, nomorSTR: e.target.value }))} placeholder="STR-XXXXX" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Tenaga <span className="text-red-500">*</span></label>
                <select value={formSTR.jenisTenaga} onChange={e => setFormSTR(f => ({ ...f, jenisTenaga: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Jenis Tenaga --</option>
                  {JENIS_TENAGA_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Konsil Penerbit <span className="text-red-500">*</span></label>
                <select value={formSTR.konsil} onChange={e => setFormSTR(f => ({ ...f, konsil: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Konsil --</option>
                  {KONSIL_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Terbit</label><input type="date" value={formSTR.tanggalTerbit} onChange={e => setFormSTR(f => ({ ...f, tanggalTerbit: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Expired</label><input type="date" value={formSTR.tanggalExpired} onChange={e => setFormSTR(f => ({ ...f, tanggalExpired: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                <select value={formSTR.status} onChange={e => setFormSTR(f => ({ ...f, status: e.target.value as STRRecord['status'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['Aktif','Akan Expired','Expired'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan</label>
                <textarea rows={2} value={formSTR.catatan||''} onChange={e => setFormSTR(f => ({ ...f, catatan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                <strong>Info:</strong> STR berlaku 5 tahun (UU No. 36/2014). Sistem akan otomatis menandai status "Akan Expired" 90 hari sebelum tanggal berakhir.
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveSTR} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editData ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal SIP ── */}
      {showModal && activeTab === 'sip' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FileText className="w-4 h-4 text-teal-600" />{editData ? 'Edit SIP/SIK' : 'Tambah SIP/SIK'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={formSIP.pegawaiId} onChange={e => setFormSIP(f => ({ ...f, pegawaiId: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Dokumen</label>
                  <select value={formSIP.jenisDokumen} onChange={e => setFormSIP(f => ({ ...f, jenisDokumen: e.target.value as 'SIP'|'SIK' }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="SIP">SIP (Surat Izin Praktik)</option>
                    <option value="SIK">SIK (Surat Izin Kerja)</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={formSIP.status} onChange={e => setFormSIP(f => ({ ...f, status: e.target.value as SIPRecord['status'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Aktif','Akan Expired','Expired'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SIP/SIK *</label><input value={formSIP.nomorSIP} onChange={e => setFormSIP(f => ({ ...f, nomorSIP: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Praktik</label><input value={formSIP.jenisPraktik||''} onChange={e => setFormSIP(f => ({ ...f, jenisPraktik: e.target.value }))} placeholder="misal: Praktik Dokter Spesialis" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Fasyankes</label><input value={formSIP.fasyankes} onChange={e => setFormSIP(f => ({ ...f, fasyankes: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Instansi Penerbit</label><input value={formSIP.instansiPenerbit} onChange={e => setFormSIP(f => ({ ...f, instansiPenerbit: e.target.value }))} placeholder="DPM-PTSP / Dinkes" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Terbit</label><input type="date" value={formSIP.tanggalTerbit} onChange={e => setFormSIP(f => ({ ...f, tanggalTerbit: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Expired</label><input type="date" value={formSIP.tanggalExpired} onChange={e => setFormSIP(f => ({ ...f, tanggalExpired: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveSIP} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editData ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Credentialing ── */}
      {showModal && activeTab === 'credentialing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Shield className="w-4 h-4 text-purple-600" />Pengajuan Kredensial</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                  <select value={formCred.pegawaiId} onChange={e => setFormCred(f => ({ ...f, pegawaiId: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih Pegawai --</option>
                    {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Kredensial</label>
                  <select value={formCred.jenis} onChange={e => setFormCred(f => ({ ...f, jenis: e.target.value as CredentialingRecord['jenis'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Kredensial Awal">Kredensial Awal</option>
                    <option value="Re-kredensial">Re-kredensial</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Pengajuan *</label><input type="date" value={formCred.tanggalPengajuan} onChange={e => setFormCred(f => ({ ...f, tanggalPengajuan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={formCred.statusKredensial} onChange={e => setFormCred(f => ({ ...f, statusKredensial: e.target.value as CredentialingRecord['statusKredensial'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Pengajuan','Verifikasi Dokumen','Peer Review','Komite Medik','Selesai','Ditolak'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {(formCred.statusKredensial === 'Selesai') && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Kredensial</label><input type="date" value={formCred.tanggalKredensial||''} onChange={e => setFormCred(f => ({ ...f, tanggalKredensial: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Berlaku s.d. (3 tahun)</label><input type="date" value={formCred.tanggalExpired||''} onChange={e => setFormCred(f => ({ ...f, tanggalExpired: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              )}
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Disetujui Oleh</label><input value={formCred.disetujuiOleh||''} onChange={e => setFormCred(f => ({ ...f, disetujuiOleh: e.target.value }))} placeholder="Ketua Komite Medik / Komite Keperawatan" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Rekomendasi Komite</label>
                <textarea rows={2} value={formCred.rekomendasiKomite||''} onChange={e => setFormCred(f => ({ ...f, rekomendasiKomite: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Kewenangan Klinis */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">Delineasi Kewenangan Klinis ({formCred.kewenangan.length})</p>
                </div>
                <div className="p-4 space-y-3">
                  {formCred.kewenangan.map(k => (
                    <div key={k.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-mono text-gray-400 w-16 flex-shrink-0">{k.kode}</span>
                      <span className="flex-1 text-gray-700">{k.namaKewenangan}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${levelColor[k.level]}`}>{k.level}</span>
                      <button onClick={() => removeKew(k.id)} className="text-red-400 hover:text-red-600 ml-1"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <input value={newKew.kode||''} onChange={e => setNewKew(n => ({ ...n, kode: e.target.value }))} placeholder="Kode (PD-01)" className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    <input value={newKew.namaKewenangan||''} onChange={e => setNewKew(n => ({ ...n, namaKewenangan: e.target.value }))} placeholder="Nama Kewenangan" className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    <input value={newKew.kategori||''} onChange={e => setNewKew(n => ({ ...n, kategori: e.target.value }))} placeholder="Kategori" className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    <select value={newKew.level||'Mandiri'} onChange={e => setNewKew(n => ({ ...n, level: e.target.value as KewenangaKlinis['level'] }))} className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400">
                      <option>Mandiri</option><option>Dengan Supervisi</option><option>Tidak Berwenang</option>
                    </select>
                  </div>
                  <button onClick={addKewenangan} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1">
                    <Plus className="w-3.5 h-3.5" /> Tambah Kewenangan
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveCred} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">{editData ? 'Perbarui' : 'Simpan Pengajuan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal CPD ── */}
      {showModal && activeTab === 'cpd' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600" />{editData ? 'Edit CPD' : 'Tambah Kegiatan CPD'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={formCPD.pegawaiId} onChange={e => setFormCPD(f => ({ ...f, pegawaiId: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nama Kegiatan *</label>
                <input value={formCPD.namaKegiatan} onChange={e => setFormCPD(f => ({ ...f, namaKegiatan: e.target.value }))} placeholder="Judul seminar / pelatihan / workshop" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Kegiatan</label>
                  <select value={formCPD.jenisKegiatan} onChange={e => setFormCPD(f => ({ ...f, jenisKegiatan: e.target.value as CPDRecord['jenisKegiatan'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Seminar','Workshop','Webinar','Pelatihan','Publikasi','Mengajar','Keanggotaan Organisasi','Lainnya'].map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jumlah SKP *</label>
                  <input type="number" min={0} value={formCPD.skp} onChange={e => setFormCPD(f => ({ ...f, skp: +e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Penyelenggara</label>
                <input value={formCPD.penyelenggara} onChange={e => setFormCPD(f => ({ ...f, penyelenggara: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal</label><input type="date" value={formCPD.tanggal} onChange={e => setFormCPD(f => ({ ...f, tanggal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tahun</label><input type="number" value={formCPD.tahun} onChange={e => setFormCPD(f => ({ ...f, tahun: +e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">No. Sertifikat / SKP</label>
                <input value={formCPD.nomorSertifikat||''} onChange={e => setFormCPD(f => ({ ...f, nomorSertifikat: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Diakui Oleh (Konsil)</label>
                <select value={formCPD.diakuiOleh} onChange={e => setFormCPD(f => ({ ...f, diakuiOleh: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Konsil --</option>
                  {KONSIL_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status Verifikasi</label>
                <select value={formCPD.status} onChange={e => setFormCPD(f => ({ ...f, status: e.target.value as CPDRecord['status'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['Pending','Diverifikasi','Ditolak'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-800">
                <strong>Info SKP Profesi:</strong> Dokter wajib 250 SKP/5 tahun (KKI), Perawat 25 SKP/5 tahun, Bidan 25 SKP/5 tahun, Apoteker 150 SKP/5 tahun untuk perpanjangan STR.
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveCPD} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editData ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Credentialing Modal ── */}
      {detailCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailCred(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Kredensial</h2>
              <button onClick={() => setDetailCred(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Pegawai info */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{getFullName(detailCred.pegawaiId)}</p>
                  <p className="text-xs text-gray-500">{getPegawai(detailCred.pegawaiId)?.jabatan}</p>
                  <p className="text-xs text-gray-400">{getPegawai(detailCred.pegawaiId)?.unitKerja}</p>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${detailCred.jenis === 'Kredensial Awal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{detailCred.jenis}</span>
                </div>
              </div>

              {/* Workflow */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3">Alur Proses Kredensial</p>
                <WorkflowStepper status={detailCred.statusKredensial} />
                {detailCred.statusKredensial !== 'Selesai' && detailCred.statusKredensial !== 'Ditolak' && (
                  <button onClick={() => advanceWorkflow(detailCred)} className="mt-3 flex items-center gap-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                    <RefreshCw className="w-3 h-3" /> Lanjutkan ke Tahap Berikutnya
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-400 mb-0.5">Tanggal Pengajuan</p><p className="text-gray-800">{fmtDate(detailCred.tanggalPengajuan)}</p></div>
                {detailCred.tanggalKredensial && <div><p className="text-xs text-gray-400 mb-0.5">Tanggal Kredensial</p><p className="text-gray-800">{fmtDate(detailCred.tanggalKredensial)}</p></div>}
                {detailCred.tanggalExpired && <div><p className="text-xs text-gray-400 mb-0.5">Berlaku s.d.</p><p className={`font-medium ${daysUntilExpiry(detailCred.tanggalExpired) < 0 ? 'text-red-600' : daysUntilExpiry(detailCred.tanggalExpired) < 90 ? 'text-yellow-600' : 'text-gray-800'}`}>{fmtDate(detailCred.tanggalExpired)}</p></div>}
                {detailCred.disetujuiOleh && <div><p className="text-xs text-gray-400 mb-0.5">Disetujui Oleh</p><p className="text-gray-800">{detailCred.disetujuiOleh}</p></div>}
              </div>

              {detailCred.rekomendasiKomite && (
                <div><p className="text-xs font-semibold text-gray-500 mb-1">Rekomendasi Komite</p>
                  <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-100">{detailCred.rekomendasiKomite}</p>
                </div>
              )}

              {detailCred.catatanKomite && (
                <div><p className="text-xs font-semibold text-gray-500 mb-1">Catatan Komite</p>
                  <p className="text-sm text-gray-700 bg-amber-50 p-3 rounded-lg border border-amber-100">{detailCred.catatanKomite}</p>
                </div>
              )}

              {/* Kewenangan Klinis Matrix */}
              {detailCred.kewenangan.length > 0 && (
                <div>
                  <button className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-3" onClick={() => setExpandedKew(expandedKew === detailCred.id ? null : detailCred.id)}>
                    <Award className="w-4 h-4 text-purple-500" /> Delineasi Kewenangan Klinis ({detailCred.kewenangan.length})
                    {expandedKew === detailCred.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {(expandedKew === detailCred.id || true) && (
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-3 py-2 font-semibold text-gray-500">Kode</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-500">Kewenangan</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-500 hidden sm:table-cell">Kategori</th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-500">Level</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {detailCred.kewenangan.map(k => (
                            <tr key={k.id} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 font-mono text-gray-400">{k.kode}</td>
                              <td className="px-3 py-2 text-gray-700">{k.namaKewenangan}</td>
                              <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{k.kategori}</td>
                              <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColor[k.level]}`}>{k.level}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-3 text-xs">
                        {['Mandiri','Dengan Supervisi','Tidak Berwenang'].map(l => (
                          <span key={l} className={`px-2 py-0.5 rounded font-medium ${levelColor[l]}`}>{detailCred.kewenangan.filter(k=>k.level===l).length} {l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setDetailCred(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
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
              <div><p className="font-semibold text-gray-800">Hapus Data?</p><p className="text-xs text-gray-500 mt-0.5">Tindakan ini tidak dapat dibatalkan</p></div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
