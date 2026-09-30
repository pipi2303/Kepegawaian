/**
 * EditPegawaiModal.tsx — Modal edit/tambah pegawai komprehensif
 * - 5 tab: Identitas, Jabatan, Kepegawaian, Pendidikan, Kontak
 * - Live preview header, auto-kalkulasi, change tracker, validasi real-time
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, Save, AlertCircle, CheckCircle2,
  User, Briefcase, GraduationCap, Phone, ShieldCheck,
  Camera, Info, AlertTriangle, Clock, Calendar, Building2,
  Hash, Pencil, RefreshCw, BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Pegawai } from '../types';
import { UNIT_KERJA, PANGKAT_GOLONGAN } from '../data/constants';
import { EmployeeAvatar, AvatarUpload } from './EmployeeAvatar';
import { SertifikatInput } from './SertifikatInput';

// ─── Statics ──────────────────────────────────────────────────────────────────
const GOLONGAN_LIST = [
  'I/a','I/b','I/c','I/d',
  'II/a','II/b','II/c','II/d',
  'III/a','III/b','III/c','III/d',
  'IV/a','IV/b','IV/c','IV/d','IV/e',
];
const ESELON_LIST = ['', 'I/a','I/b','II/a','II/b','III/a','III/b','IV/a','IV/b','Non Eselon'];
const TODAY = new Date('2026-03-09');

type FormData = Omit<Pegawai, 'id'> & { id?: string };

const EMPTY_FORM: FormData = {
  nip: '', nama: '', gelarDepan: '', gelarBelakang: '', jenisKelamin: 'L',
  tempatLahir: '', tanggalLahir: '', agama: 'Islam', statusPerkawinan: 'Belum Kawin',
  alamat: '', noTelp: '', email: '', jabatan: '', jabatanFungsional: '',
  unitKerja: '', golongan: 'III/a', pangkat: 'Penata Muda', tmtGolongan: '',
  tmtJabatan: '', statusPegawai: 'PNS', statusAktif: 'Aktif', eselon: '',
  pendidikanTerakhir: 'S1', jurusan: '', institusi: '', tahunLulus: 2020,
  tanggalMasuk: '', batasPensiun: '', masaKerja: '', badge: '', foto: '',
  sertifikat: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hitungMasaKerja(tanggalMasuk: string): string {
  if (!tanggalMasuk) return '';
  const mulai = new Date(tanggalMasuk);
  if (isNaN(mulai.getTime())) return '';
  let tahun = TODAY.getFullYear() - mulai.getFullYear();
  let bulan = TODAY.getMonth() - mulai.getMonth();
  if (bulan < 0) { tahun--; bulan += 12; }
  if (tahun < 0) return '0 tahun';
  return `${tahun} tahun ${bulan} bulan`;
}

function hitungBatasPensiun(tanggalLahir: string, statusPegawai: string, eselon?: string, jabatanFungsional?: string): string {
  if (!tanggalLahir || statusPegawai === 'Honorer') return '';
  const lahir = new Date(tanggalLahir);
  if (isNaN(lahir.getTime())) return '';
  let usia = 58;
  if (eselon && ['I/a','I/b','II/a','II/b'].includes(eselon)) usia = 60;
  if (jabatanFungsional?.toLowerCase().includes('utama') || jabatanFungsional?.toLowerCase().includes('ahli utama')) usia = 65;
  const pensiun = new Date(lahir);
  pensiun.setFullYear(pensiun.getFullYear() + usia);
  return pensiun.toISOString().split('T')[0];
}

function validate(form: FormData): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.nama?.trim()) e.nama = 'Nama wajib diisi';
  if (!form.nip?.trim()) e.nip = 'NIP wajib diisi';
  else if (form.statusPegawai !== 'Honorer' && form.nip.replace(/\D/g, '').length !== 18)
    e.nip = 'NIP PNS/PPPK harus 18 digit angka';
  if (!form.tanggalLahir) e.tanggalLahir = 'Tanggal lahir wajib diisi';
  if (!form.unitKerja) e.unitKerja = 'Unit kerja wajib dipilih';
  if (!form.tanggalMasuk) e.tanggalMasuk = 'Tanggal masuk wajib diisi';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid';
  if (!form.jabatan?.trim() && !form.jabatanFungsional?.trim()) e.jabatan = 'Isi minimal jabatan atau jabatan fungsional';
  return e;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId = 'identitas' | 'jabatan' | 'kepegawaian' | 'pendidikan' | 'kontak';
const TABS: { id: TabId; label: string; icon: React.ElementType; errorFields: string[]; requiredFields: string[] }[] = [
  { id: 'identitas',    label: 'Identitas',    icon: User,          errorFields: ['nama','nip','tanggalLahir'],          requiredFields: ['nama','nip','tanggalLahir'] },
  { id: 'jabatan',      label: 'Jabatan',      icon: Briefcase,     errorFields: ['jabatan','unitKerja'],                requiredFields: ['unitKerja'] },
  { id: 'kepegawaian',  label: 'Kepegawaian',  icon: ShieldCheck,   errorFields: ['tanggalMasuk','golongan'],            requiredFields: ['tanggalMasuk','golongan'] },
  { id: 'pendidikan',   label: 'Pendidikan',   icon: GraduationCap, errorFields: ['pendidikanTerakhir'],                 requiredFields: ['pendidikanTerakhir'] },
  { id: 'kontak',       label: 'Kontak',       icon: Phone,         errorFields: ['email'],                              requiredFields: [] },
];

// ─── Reusable field components ────────────────────────────────────────────────
const BASE_INPUT = 'w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-colors';

function FieldLabel({ label, required, changed, error, hint }: {
  label: string; required?: boolean; changed?: boolean; error?: string; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        {changed && (
          <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Diubah</span>
        )}
      </div>
      {error && <p className="flex items-center gap-1 text-[11px] text-red-500"><AlertCircle className="w-3 h-3" />{error}</p>}
      {hint && !error && <p className="flex items-center gap-1 text-[11px] text-gray-400"><Info className="w-3 h-3" />{hint}</p>}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  editData: Pegawai | null;
  onClose: () => void;
  onSave: (data: FormData) => void;
}

// ─── Main Modal Component ─────────────────────────────────────────────────────
export default function EditPegawaiModal({ open, editData, onClose, onSave }: Props) {
  const isEdit = !!editData;
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [activeTab, setActiveTab] = useState<TabId>('identitas');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [originalData, setOriginalData] = useState<Pegawai | null>(null);

  // Reset form on open
  useEffect(() => {
    if (open) {
      const initial: FormData = editData
        ? { ...EMPTY_FORM, ...editData }
        : { ...EMPTY_FORM };
      setForm(initial);
      setOriginalData(editData);
      setActiveTab('identitas');
      setErrors({});
      setTouched(new Set());
      setSubmitted(false);
      setConfirmClose(false);
    }
  }, [open]); // intentionally only [open] so it resets only on open/close, not on editData re-renders

  // Auto-fill pangkat from golongan
  useEffect(() => {
    const pangkat = PANGKAT_GOLONGAN[form.golongan];
    if (pangkat && pangkat !== form.pangkat) {
      setForm(prev => ({ ...prev, pangkat }));
    }
  }, [form.golongan]);

  // Auto-calc masa kerja
  useEffect(() => {
    if (form.tanggalMasuk) {
      const mk = hitungMasaKerja(form.tanggalMasuk);
      setForm(prev => ({ ...prev, masaKerja: mk }));
    }
  }, [form.tanggalMasuk]);

  // Auto-calc batas pensiun
  useEffect(() => {
    if (form.tanggalLahir && form.statusPegawai !== 'Honorer') {
      const bp = hitungBatasPensiun(form.tanggalLahir, form.statusPegawai, form.eselon, form.jabatanFungsional);
      if (bp) setForm(prev => ({ ...prev, batasPensiun: bp }));
    }
  }, [form.tanggalLahir, form.statusPegawai, form.eselon, form.jabatanFungsional]);

  // Run validation when form changes (after first submit or touch)
  useEffect(() => {
    if (submitted || touched.size > 0) {
      setErrors(validate(form));
    }
  }, [form, submitted]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function touch(field: string) {
    setTouched(prev => new Set([...prev, field]));
  }

  function setF<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    touch(key as string);
  }

  function inputCls(field: string): string {
    const hasErr = (submitted || touched.has(field)) && !!errors[field];
    const isChanged = isEdit && originalData && String((form as any)[field] ?? '') !== String((originalData as any)[field] ?? '');
    if (hasErr) return `${BASE_INPUT} border-red-300 focus:ring-red-200`;
    if (isChanged) return `${BASE_INPUT} border-amber-300 focus:ring-amber-200 bg-amber-50/40`;
    return `${BASE_INPUT} border-gray-200 focus:ring-[#038E7D]/50 focus:border-[#038E7D]`;
  }

  function isChanged(field: string): boolean {
    if (!isEdit || !originalData) return false;
    return String((form as any)[field] ?? '') !== String((originalData as any)[field] ?? '');
  }

  function fieldError(field: string): string {
    return (submitted || touched.has(field)) ? (errors[field] || '') : '';
  }

  // ─── Actions ────────────────────────────────────────────────────────────────
  function handleSave() {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      for (const tab of TABS) {
        if (tab.errorFields.some(f => !!errs[f])) {
          setActiveTab(tab.id);
          break;
        }
      }
      toast.error('Harap perbaiki kesalahan pada formulir');
      return;
    }
    onSave(form);
  }

  function handleClose() {
    const dirty = isEdit && originalData
      ? Object.keys(form).some(k => String((form as any)[k] ?? '') !== String((originalData as any)[k] ?? ''))
      : Object.keys(form).some(k => k !== 'id' && String((form as any)[k] ?? '') !== String((EMPTY_FORM as any)[k] ?? ''));
    if (dirty && !confirmClose) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }

  // Ctrl+S handler
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, form, submitted]); // form & submitted in deps so handleSave sees fresh state

  // ─── Derived ────────────────────────────────────────────────────────────────
  const tabIdx = TABS.findIndex(t => t.id === activeTab);
  const canPrev = tabIdx > 0;
  const canNext = tabIdx < TABS.length - 1;
  const fullName = [form.gelarDepan, form.nama, form.gelarBelakang ? `, ${form.gelarBelakang}` : ''].filter(Boolean).join(' ').replace(' ,', ',');

  const changedCount = isEdit && originalData
    ? Object.keys(EMPTY_FORM).filter(k => String((form as any)[k] ?? '') !== String((originalData as any)[k] ?? '')).length
    : 0;

  // ─── Tab status ─────────────────────────────────────────────────────────────
  function tabStatus(tab: typeof TABS[0]): 'error' | 'complete' | 'default' {
    if (submitted && tab.errorFields.some(f => !!errors[f])) return 'error';
    if (tab.requiredFields.every(f => !!(form as any)[f])) return 'complete';
    return 'default';
  }

  // ─── Pensiun alert ────────────────────────────────────────────────────────
  let pensiunAlert: 'overdue' | 'soon' | null = null;
  if (form.batasPensiun && form.statusPegawai !== 'Honorer') {
    const bp = new Date(form.batasPensiun);
    const diffDays = Math.ceil((bp.getTime() - TODAY.getTime()) / 86400000);
    if (diffDays < 0) pensiunAlert = 'overdue';
    else if (diffDays <= 730) pensiunAlert = 'soon';
  }

  if (!open) return null;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden">

        {/* ═══ HEADER ════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-[#013E37] to-[#038E7D] px-5 py-4 flex items-center gap-4 flex-shrink-0">
          <EmployeeAvatar
            id={editData?.id || 'new'}
            nama={form.nama || '?'}
            foto={form.foto}
            size="lg"
            shape="rounded"
            className="border-2 border-white/30 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-base leading-tight truncate">
              {fullName || 'Nama Pegawai'}
            </p>
            <p className="text-blue-200 text-xs mt-0.5 truncate">
              {form.jabatan || form.jabatanFungsional || '—'} · {form.unitKerja || 'Unit belum dipilih'}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {form.nip && (
                <span className="text-[10px] font-mono bg-white/15 text-white px-2 py-0.5 rounded">{form.nip}</span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                form.statusPegawai === 'PNS' ? 'bg-[#013E37] text-white'
                : form.statusPegawai === 'PPPK' ? 'bg-purple-400/30 text-purple-100'
                : 'bg-orange-400/30 text-orange-100'
              }`}>{form.statusPegawai}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                form.statusAktif === 'Aktif' ? 'bg-green-400/30 text-green-100' : 'bg-gray-400/30 text-gray-200'
              }`}>{form.statusAktif}</span>
              {changedCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-amber-200 bg-amber-400/20 px-2 py-0.5 rounded">
                  <Pencil className="w-2.5 h-2.5" />{changedCount} perubahan
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-blue-100 text-[10px]">{isEdit ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}</p>
              <p className="text-white/40 text-[9px]">Ctrl+S untuk simpan</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-white/60 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══ TAB BAR ═══════════════════════════════════════════════════════ */}
        <div className="flex border-b border-gray-100 bg-gray-50 flex-shrink-0 overflow-x-auto">
          {TABS.map((tab) => {
            const status = tabStatus(tab);
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  isActive
                    ? 'border-[#013E37] text-[#013E37] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {status === 'error' && (
                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertCircle className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
                {status === 'complete' && status !== 'error' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* ═══ FORM BODY ══════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* ── Tab: Identitas ────────────────────────────────────────── */}
            {activeTab === 'identitas' && (
              <div className="space-y-5">
                {/* Foto */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5" /> Foto Pegawai
                  </p>
                  <AvatarUpload
                    foto={form.foto}
                    nama={form.nama || 'Pegawai'}
                    id={editData?.id || 'new'}
                    onChange={base64 => setF('foto', base64)}
                    onRemove={() => setF('foto', '')}
                  />
                </div>

                {/* Nama */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Nama & Identitas
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <FieldLabel label="Gelar Depan" changed={isChanged('gelarDepan')} />
                      <input className={inputCls('gelarDepan')} value={form.gelarDepan || ''}
                        onChange={e => setF('gelarDepan', e.target.value)} placeholder="dr. / Ns. / Drs." />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Nama Lengkap" required changed={isChanged('nama')} error={fieldError('nama')} />
                      <input className={inputCls('nama')} value={form.nama}
                        onChange={e => setF('nama', e.target.value)}
                        onBlur={() => touch('nama')} placeholder="Nama tanpa gelar" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Gelar Belakang" changed={isChanged('gelarBelakang')} />
                      <input className={inputCls('gelarBelakang')} value={form.gelarBelakang || ''}
                        onChange={e => setF('gelarBelakang', e.target.value)} placeholder="S.Kep / M.Kes" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="NIP" required changed={isChanged('nip')}
                      error={fieldError('nip')}
                      hint={form.statusPegawai !== 'Honorer' ? `${(form.nip || '').replace(/\D/g,'').length}/18 digit` : undefined} />
                    <input className={`${inputCls('nip')} font-mono tracking-wider`} value={form.nip}
                      onChange={e => setF('nip', e.target.value)}
                      onBlur={() => touch('nip')} placeholder="18 digit NIP" maxLength={20} />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Nomor Badge / ID Card" changed={isChanged('badge')}
                      hint="Nomor pada kartu tanda pengenal fisik pegawai" />
                    <input className={`${inputCls('badge')} font-mono tracking-wider`} value={form.badge || ''}
                      onChange={e => setF('badge', e.target.value)}
                      placeholder="Contoh: RSAM-2024-0001" maxLength={30} />
                  </div>
                </div>

                {/* Sertifikat Keahlian */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <BadgeCheck className="w-3.5 h-3.5" /> Sertifikat Keahlian
                  </p>
                  <SertifikatInput
                    value={form.sertifikat ?? []}
                    onChange={v => setF('sertifikat', v)}
                    changed={isChanged('sertifikat')}
                  />
                </div>

                {/* Data Diri */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> Data Diri
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <FieldLabel label="Jenis Kelamin" changed={isChanged('jenisKelamin')} />
                      <div className="flex gap-2">
                        {(['L','P'] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setF('jenisKelamin', v)}
                            className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                              form.jenisKelamin === v
                                ? 'bg-[#013E37] text-white border-[#013E37]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#038E7D]'
                            }`}>
                            {v === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Agama" changed={isChanged('agama')} />
                      <select className={inputCls('agama')} value={form.agama} onChange={e => setF('agama', e.target.value)}>
                        {['Islam','Kristen','Katolik','Hindu','Budha','Konghucu'].map(a => <option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Tempat Lahir" changed={isChanged('tempatLahir')} />
                      <input className={inputCls('tempatLahir')} value={form.tempatLahir}
                        onChange={e => setF('tempatLahir', e.target.value)} placeholder="Bandar Lampung" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Tanggal Lahir" required changed={isChanged('tanggalLahir')} error={fieldError('tanggalLahir')} />
                      <input type="date" className={inputCls('tanggalLahir')} value={form.tanggalLahir}
                        onChange={e => setF('tanggalLahir', e.target.value)}
                        onBlur={() => touch('tanggalLahir')} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Status Perkawinan" changed={isChanged('statusPerkawinan')} />
                      <select className={inputCls('statusPerkawinan')} value={form.statusPerkawinan} onChange={e => setF('statusPerkawinan', e.target.value)}>
                        {['Belum Kawin','Kawin','Cerai Hidup','Cerai Mati'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Jabatan ──────────────────────────────────────────── */}
            {activeTab === 'jabatan' && (
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5" /> Jabatan
                  </p>
                  <div className="space-y-1">
                    <FieldLabel label="Jabatan Struktural" changed={isChanged('jabatan')}
                      error={fieldError('jabatan')}
                      hint="Isi minimal jabatan atau jabatan fungsional" />
                    <input className={inputCls('jabatan')} value={form.jabatan}
                      onChange={e => setF('jabatan', e.target.value)}
                      onBlur={() => touch('jabatan')}
                      placeholder="Kepala Bidang / Dokter / Perawat Ahli Madya" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Jabatan Fungsional" changed={isChanged('jabatanFungsional')} />
                    <input className={inputCls('jabatanFungsional')} value={form.jabatanFungsional}
                      onChange={e => setF('jabatanFungsional', e.target.value)}
                      placeholder="Dokter Ahli Madya / Perawat Penyelia" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <FieldLabel label="Eselon" changed={isChanged('eselon')} hint="Kosongkan jika jabatan fungsional" />
                      <select className={inputCls('eselon')} value={form.eselon || ''} onChange={e => setF('eselon', e.target.value)}>
                        {ESELON_LIST.map(e => <option key={e} value={e}>{e || '— Tidak Ada —'}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="TMT Jabatan" changed={isChanged('tmtJabatan')} />
                      <input type="date" className={inputCls('tmtJabatan')} value={form.tmtJabatan}
                        onChange={e => setF('tmtJabatan', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Unit Kerja
                  </p>
                  <div className="space-y-1">
                    <FieldLabel label="Unit Kerja / Instalasi" required changed={isChanged('unitKerja')} error={fieldError('unitKerja')} />
                    <select className={inputCls('unitKerja')} value={form.unitKerja}
                      onChange={e => setF('unitKerja', e.target.value)}
                      onBlur={() => touch('unitKerja')}>
                      <option value="">— Pilih Unit Kerja —</option>
                      {UNIT_KERJA.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Kepegawaian ─────────────────────────────────────── */}
            {activeTab === 'kepegawaian' && (
              <div className="space-y-5">
                {/* Status */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Status Pegawai
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <FieldLabel label="Jenis Kepegawaian" required changed={isChanged('statusPegawai')} />
                      <div className="flex gap-2">
                        {(['PNS','PPPK','Honorer'] as const).map(s => (
                          <button key={s} type="button" onClick={() => setF('statusPegawai', s)}
                            className={`flex-1 py-2 rounded-lg text-xs border font-semibold transition-all ${
                              form.statusPegawai === s
                                ? s === 'PNS' ? 'bg-[#013E37] text-white border-[#013E37]'
                                  : s === 'PPPK' ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Status Aktif" changed={isChanged('statusAktif')} />
                      <div className="flex gap-2 flex-wrap">
                        {(['Aktif','Pensiun','Meninggal','Diberhentikan'] as const).map(s => (
                          <button key={s} type="button" onClick={() => setF('statusAktif', s)}
                            className={`px-3 py-2 rounded-lg text-xs border font-medium transition-all ${
                              form.statusAktif === s
                                ? s === 'Aktif' ? 'bg-green-600 text-white border-green-600'
                                  : 'bg-red-500 text-white border-red-500'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Golongan */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> Golongan & Pangkat
                    {form.statusPegawai === 'Honorer' && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full normal-case font-normal">Tidak berlaku untuk Honorer</span>
                    )}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <FieldLabel label="Golongan / Ruang" required changed={isChanged('golongan')} />
                      <select className={inputCls('golongan')} value={form.golongan}
                        onChange={e => setF('golongan', e.target.value)}
                        disabled={form.statusPegawai === 'Honorer'}>
                        {GOLONGAN_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Pangkat" hint="Otomatis dari golongan" changed={isChanged('pangkat')} />
                      <input className={`${BASE_INPUT} border-gray-100 bg-gray-100 text-gray-500 cursor-default`}
                        value={form.pangkat} readOnly />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="TMT Golongan" changed={isChanged('tmtGolongan')} />
                      <input type="date" className={inputCls('tmtGolongan')} value={form.tmtGolongan}
                        onChange={e => setF('tmtGolongan', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Masa Kerja */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Masa Kerja & Pensiun
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <FieldLabel label="Tanggal Masuk / CPNS" required changed={isChanged('tanggalMasuk')} error={fieldError('tanggalMasuk')} />
                      <input type="date" className={inputCls('tanggalMasuk')} value={form.tanggalMasuk}
                        onChange={e => setF('tanggalMasuk', e.target.value)}
                        onBlur={() => touch('tanggalMasuk')} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Masa Kerja" hint="Dihitung otomatis dari tanggal masuk" />
                      <div className="flex gap-2">
                        <input className={`${BASE_INPUT} border-gray-100 bg-gray-100 text-gray-500 flex-1`}
                          value={form.masaKerja} readOnly placeholder="Otomatis" />
                        <button type="button" title="Hitung ulang"
                          onClick={() => setF('masaKerja', hitungMasaKerja(form.tanggalMasuk))}
                          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 flex-shrink-0">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Batas Usia Pensiun" changed={isChanged('batasPensiun')}
                        hint={form.statusPegawai === 'Honorer' ? 'Tidak berlaku' : 'Dihitung dari tgl lahir + eselon'} />
                      <input type="date"
                        className={form.statusPegawai === 'Honorer'
                          ? `${BASE_INPUT} bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed`
                          : inputCls('batasPensiun')}
                        value={form.batasPensiun}
                        onChange={e => setF('batasPensiun', e.target.value)}
                        readOnly={form.statusPegawai === 'Honorer'} />
                    </div>
                  </div>
                  {pensiunAlert === 'overdue' && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      Pegawai ini telah melewati batas usia pensiun.
                    </div>
                  )}
                  {pensiunAlert === 'soon' && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      Pegawai akan pensiun dalam kurang dari <strong className="mx-1">2 tahun</strong>
                      ({new Date(form.batasPensiun).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}).
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab: Pendidikan ───────────────────────────────────────── */}
            {activeTab === 'pendidikan' && (
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" /> Pendidikan Formal Terakhir
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['SMA/SMK','D3','D4','S1','Profesi','Spesialis','S2','S3'].map(p => (
                      <button key={p} type="button" onClick={() => setF('pendidikanTerakhir', p)}
                        className={`py-2.5 rounded-lg text-sm border font-medium transition-all ${
                          form.pendidikanTerakhir === p
                            ? 'bg-[#013E37] text-white border-[#013E37]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#038E7D]'
                        }`}>{p}</button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Program Studi / Jurusan" changed={isChanged('jurusan')} />
                    <input className={inputCls('jurusan')} value={form.jurusan}
                      onChange={e => setF('jurusan', e.target.value)}
                      placeholder="Ilmu Kedokteran / Keperawatan / Kesehatan Masyarakat" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <FieldLabel label="Nama Institusi / Universitas" changed={isChanged('institusi')} />
                      <input className={inputCls('institusi')} value={form.institusi}
                        onChange={e => setF('institusi', e.target.value)}
                        placeholder="Universitas Lampung / Poltekkes" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Tahun Lulus" changed={isChanged('tahunLulus')} />
                      <input type="number" className={inputCls('tahunLulus')} value={form.tahunLulus}
                        onChange={e => setF('tahunLulus', parseInt(e.target.value) || 0)}
                        min={1970} max={2030} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Kontak ───────────────────────────────────────────── */}
            {activeTab === 'kontak' && (
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Informasi Kontak
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <FieldLabel label="No. Telepon / WhatsApp" changed={isChanged('noTelp')} />
                      <input className={inputCls('noTelp')} value={form.noTelp}
                        onChange={e => setF('noTelp', e.target.value)} placeholder="08xxxxxxxxxx" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Email" changed={isChanged('email')} error={fieldError('email')} />
                      <input type="email" className={inputCls('email')} value={form.email}
                        onChange={e => setF('email', e.target.value)}
                        onBlur={() => touch('email')}
                        placeholder="nama@rsudabdulmoeloek.go.id" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Alamat Tinggal" changed={isChanged('alamat')} />
                    <textarea rows={3} className={`${inputCls('alamat')} resize-none`} value={form.alamat}
                      onChange={e => setF('alamat', e.target.value)}
                      placeholder="Jl. ... No. ..., Kelurahan ..., Kec. ..., Kota/Kab. ..." />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/60 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {TABS.map((t) => {
              const status = tabStatus(t);
              const isAct = t.id === activeTab;
              return (
                <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                  title={t.label}
                  className={`rounded-full transition-all ${
                    isAct ? 'w-5 h-2 bg-[#013E37]'
                    : status === 'error' ? 'w-2 h-2 bg-red-400'
                    : status === 'complete' ? 'w-2 h-2 bg-green-400'
                    : 'w-2 h-2 bg-gray-300'
                  }`} />
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {canPrev && (
              <button type="button" onClick={() => setActiveTab(TABS[tabIdx - 1].id)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>
            )}
            <button type="button" onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              Batal
            </button>
            {canNext ? (
              <button type="button" onClick={() => setActiveTab(TABS[tabIdx + 1].id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-[#013E37] rounded-lg hover:bg-[#025046] transition-colors">
                Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 text-sm text-white bg-[#013E37] rounded-lg hover:bg-[#025046] transition-colors font-medium shadow-sm">
                <Save className="w-4 h-4" />
                {isEdit
                  ? `Simpan Perubahan${changedCount > 0 ? ` (${changedCount})` : ''}`
                  : 'Simpan Pegawai'}
              </button>
            )}
          </div>
        </div>

        {/* ═══ CONFIRM CLOSE DIALOG ═══════════════════════════════════════════ */}
        {confirmClose && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-2xl">
            <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-center font-semibold text-gray-800 mb-2">Perubahan belum disimpan</h3>
              <p className="text-center text-sm text-gray-500 mb-5">
                Data yang Anda ubah akan hilang jika keluar sekarang.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmClose(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Kembali
                </button>
                <button type="button" onClick={() => { setConfirmClose(false); handleSave(); }}
                  className="flex-1 py-2 bg-[#013E37] text-white rounded-lg text-sm hover:bg-[#025046] transition-colors">
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}