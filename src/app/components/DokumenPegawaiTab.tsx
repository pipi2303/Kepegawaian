import React, { useState, useRef } from 'react';
import {
  FileText, Upload, Plus, X, Eye, Download, Trash2,
  CreditCard, Users, GraduationCap, Hospital, CheckCircle2,
  AlertCircle, Clock, ChevronDown, ChevronUp, Search, Filter,
} from 'lucide-react';
import type { DokumenPegawai, KategoriDokumen, StatusDokumen } from '../types';

// ─── Konstanta ───────────────────────────────────────────────────────────────
const TEMPLATE_DOKUMEN: Record<KategoriDokumen, string[]> = {
  'Identitas Diri': [
    'KTP (Kartu Tanda Penduduk)',
    'Kartu Keluarga (KK)',
    'Akte Kelahiran',
    'NPWP',
    'Paspor',
    'Kartu BPJS Kesehatan',
    'Kartu BPJS Ketenagakerjaan',
  ],
  'Kepegawaian': [
    'SK Pengangkatan Pertama',
    'SK Kenaikan Pangkat Terakhir',
    'SK Jabatan Terakhir',
    'Kartu Pegawai (Karpeg)',
    'Kartu Istri / Kartu Suami (Karis/Karsu)',
    'Surat Pernyataan Melaksanakan Tugas (SPMT)',
    'SK Pensiun',
    'Taspen',
  ],
  'Pendidikan & Sertifikasi': [
    'Ijazah Terakhir',
    'Transkrip Nilai',
    'Sertifikat Diklat Prajabatan / CPNS',
    'Sertifikat Diklat Kepemimpinan',
    'Sertifikat Keahlian / Kompetensi',
    'Sertifikat Pelatihan Klinis',
    'Sertifikat Akreditasi Profesi',
  ],
  'Dokumen Rumah Sakit': [
    'Surat Tanda Registrasi (STR)',
    'Surat Izin Praktik (SIP)',
    'Surat Keterangan Sehat',
    'Surat Keterangan Bebas Narkoba',
    'Sertifikat Kredensial / Re-Kredensial',
    'Surat Penugasan Klinis (SPK)',
    'Rincian Kewenangan Klinis (RKK)',
    'Sertifikat BHD / ACLS / ATLS',
    'Sertifikat K3RS',
    'Hasil MCU (Medical Check Up)',
  ],
};

const KATEGORI_CONFIG: Record<KategoriDokumen, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  'Identitas Diri':       { icon: CreditCard,  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  'Kepegawaian':          { icon: Users,        color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  'Pendidikan & Sertifikasi': { icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Dokumen Rumah Sakit':  { icon: Hospital,     color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const STATUS_CONFIG: Record<StatusDokumen, { label: string; color: string; icon: React.ElementType }> = {
  'Valid':               { label: 'Valid',           color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  'Segera Kadaluarsa':   { label: 'Segera Expired',  color: 'bg-amber-100 text-amber-700',    icon: Clock },
  'Kadaluarsa':          { label: 'Kadaluarsa',      color: 'bg-red-100 text-red-700',        icon: AlertCircle },
  'Belum Upload':        { label: 'Belum Upload',    color: 'bg-gray-100 text-gray-500',      icon: Upload },
};

function hitungStatus(tanggalKadaluarsa?: string): StatusDokumen {
  if (!tanggalKadaluarsa) return 'Valid';
  const exp = new Date(tanggalKadaluarsa);
  const now = new Date();
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'Kadaluarsa';
  if (diff <= 90) return 'Segera Kadaluarsa';
  return 'Valid';
}

function generateId() {
  return 'DOC-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

// ─── Modal Tambah/Edit ────────────────────────────────────────────────────────
interface ModalDokumenProps {
  pegawaiId: string;
  editData?: DokumenPegawai | null;
  defaultKategori?: KategoriDokumen;
  defaultNama?: string;
  onSave: (doc: DokumenPegawai) => void;
  onClose: () => void;
}

function ModalDokumen({ pegawaiId, editData, defaultKategori, defaultNama, onSave, onClose }: ModalDokumenProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Omit<DokumenPegawai, 'id' | 'pegawaiId' | 'status'>>({
    kategori:         editData?.kategori         ?? defaultKategori ?? 'Identitas Diri',
    namaDokumen:      editData?.namaDokumen      ?? defaultNama ?? '',
    nomorDokumen:     editData?.nomorDokumen     ?? '',
    tanggalTerbit:    editData?.tanggalTerbit    ?? '',
    tanggalKadaluarsa:editData?.tanggalKadaluarsa?? '',
    instansiPenerbit: editData?.instansiPenerbit ?? '',
    keterangan:       editData?.keterangan       ?? '',
    fileUrl:          editData?.fileUrl          ?? '',
    fileName:         editData?.fileName         ?? '',
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(f => ({ ...f, fileUrl: ev.target?.result as string, fileName: file.name }));
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!form.namaDokumen.trim()) return;
    const status = form.fileUrl
      ? hitungStatus(form.tanggalKadaluarsa || undefined)
      : 'Belum Upload';
    onSave({
      id:        editData?.id ?? generateId(),
      pegawaiId,
      ...form,
      namaDokumen: form.namaDokumen.trim(),
      status,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{editData ? 'Edit Dokumen' : 'Tambah Dokumen'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Kategori */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Kategori Dokumen *</label>
            <select
              value={form.kategori}
              onChange={e => setForm(f => ({ ...f, kategori: e.target.value as KategoriDokumen }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(Object.keys(KATEGORI_CONFIG) as KategoriDokumen[]).map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Nama Dokumen */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nama Dokumen *</label>
            <input
              value={form.namaDokumen}
              onChange={e => setForm(f => ({ ...f, namaDokumen: e.target.value }))}
              list="doc-templates"
              placeholder="Contoh: KTP, Ijazah, STR..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="doc-templates">
              {TEMPLATE_DOKUMEN[form.kategori].map(t => <option key={t} value={t} />)}
            </datalist>
          </div>

          {/* Nomor & Instansi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nomor Dokumen</label>
              <input
                value={form.nomorDokumen}
                onChange={e => setForm(f => ({ ...f, nomorDokumen: e.target.value }))}
                placeholder="No. dokumen"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Instansi Penerbit</label>
              <input
                value={form.instansiPenerbit}
                onChange={e => setForm(f => ({ ...f, instansiPenerbit: e.target.value }))}
                placeholder="Instansi"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal Terbit</label>
              <input
                type="date"
                value={form.tanggalTerbit}
                onChange={e => setForm(f => ({ ...f, tanggalTerbit: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal Kadaluarsa</label>
              <input
                type="date"
                value={form.tanggalKadaluarsa}
                onChange={e => setForm(f => ({ ...f, tanggalKadaluarsa: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Keterangan</label>
            <textarea
              value={form.keterangan}
              onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Upload File */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">File Dokumen (PDF/JPG/PNG)</label>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
            {form.fileUrl ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs text-green-700 flex-1 truncate">{form.fileName || 'File terupload'}</span>
                <button onClick={() => setForm(f => ({ ...f, fileUrl: '', fileName: '' }))} className="text-red-400 hover:text-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg px-3 py-3 text-sm text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Upload className="w-4 h-4" /> Klik untuk upload file
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!form.namaDokumen.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {editData ? 'Simpan Perubahan' : 'Tambah Dokumen'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface DokumenPegawaiTabProps {
  pegawaiId: string;
}

const LS_KEY = 'hr_app_dokumen_pegawai';

function loadDokumen(pegawaiId: string): DokumenPegawai[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all: DokumenPegawai[] = raw ? JSON.parse(raw) : [];
    return all.filter(d => d.pegawaiId === pegawaiId);
  } catch { return []; }
}

function saveDokumen(pegawaiId: string, docs: DokumenPegawai[]) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all: DokumenPegawai[] = raw ? JSON.parse(raw) : [];
    const others = all.filter(d => d.pegawaiId !== pegawaiId);
    localStorage.setItem(LS_KEY, JSON.stringify([...others, ...docs]));
  } catch {}
}

export function DokumenPegawaiTab({ pegawaiId }: DokumenPegawaiTabProps) {
  const [docs, setDocs] = useState<DokumenPegawai[]>(() => loadDokumen(pegawaiId));
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState<DokumenPegawai | null>(null);
  const [defaultKat, setDefaultKat] = useState<KategoriDokumen | undefined>();
  const [defaultNama, setDefaultNama] = useState<string | undefined>();
  const [previewDoc, setPreviewDoc] = useState<DokumenPegawai | null>(null);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Partial<Record<KategoriDokumen, boolean>>>({});

  const kategoriList = Object.keys(KATEGORI_CONFIG) as KategoriDokumen[];

  function handleSave(doc: DokumenPegawai) {
    const updated = editDoc
      ? docs.map(d => d.id === doc.id ? doc : d)
      : [...docs, doc];
    setDocs(updated);
    saveDokumen(pegawaiId, updated);
    setShowModal(false);
    setEditDoc(null);
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus dokumen ini?')) return;
    const updated = docs.filter(d => d.id !== id);
    setDocs(updated);
    saveDokumen(pegawaiId, updated);
  }

  function openAdd(kat?: KategoriDokumen, nama?: string) {
    setEditDoc(null);
    setDefaultKat(kat);
    setDefaultNama(nama);
    setShowModal(true);
  }

  function openEdit(doc: DokumenPegawai) {
    setEditDoc(doc);
    setDefaultKat(undefined);
    setDefaultNama(undefined);
    setShowModal(true);
  }

  function toggleCollapse(kat: KategoriDokumen) {
    setCollapsed(c => ({ ...c, [kat]: !c[kat] }));
  }

  const filteredDocs = docs.filter(d =>
    d.namaDokumen.toLowerCase().includes(search.toLowerCase()) ||
    d.nomorDokumen?.toLowerCase().includes(search.toLowerCase())
  );

  // Statistik
  const totalValid = docs.filter(d => d.status === 'Valid').length;
  const totalExpiring = docs.filter(d => d.status === 'Segera Kadaluarsa').length;
  const totalExpired = docs.filter(d => d.status === 'Kadaluarsa').length;
  const totalBelum = docs.filter(d => d.status === 'Belum Upload').length;

  return (
    <div>
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h4 className="font-semibold text-gray-800">Dokumen Pegawai</h4>
          <p className="text-xs text-gray-400 mt-0.5">Kelola semua dokumen identitas, kepegawaian, dan RS</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari dokumen..."
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>
          <button
            onClick={() => openAdd()}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        </div>
      </div>

      {/* Statistik */}
      {docs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Valid', count: totalValid, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { label: 'Segera Expired', count: totalExpiring, color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Kadaluarsa', count: totalExpired, color: 'bg-red-50 border-red-200 text-red-700' },
            { label: 'Belum Upload', count: totalBelum, color: 'bg-gray-50 border-gray-200 text-gray-500' },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl px-4 py-3 ${s.color}`}>
              <p className="text-xl font-bold">{s.count}</p>
              <p className="text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Kategori Cards */}
      <div className="space-y-4">
        {kategoriList.map(kat => {
          const cfg = KATEGORI_CONFIG[kat];
          const Icon = cfg.icon;
          const docsKat = (search ? filteredDocs : docs).filter(d => d.kategori === kat);
          const templates = TEMPLATE_DOKUMEN[kat];
          const isCollapsed = collapsed[kat];

          return (
            <div key={kat} className={`border ${cfg.border} rounded-xl overflow-hidden`}>
              {/* Kategori Header */}
              <div className={`flex items-center justify-between px-4 py-3 ${cfg.bg}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  <span className={`text-sm font-semibold ${cfg.color}`}>{kat}</span>
                  <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-gray-600">
                    {docsKat.length} dokumen
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAdd(kat)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white ${cfg.color} transition-colors border ${cfg.border}`}
                  >
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                  <button onClick={() => toggleCollapse(kat)} className={`p-1 ${cfg.color} hover:bg-white/50 rounded`}>
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="divide-y divide-gray-50">
                  {/* Dokumen yang sudah diupload */}
                  {docsKat.map(doc => {
                    const sc = STATUS_CONFIG[doc.status];
                    const SIcon = sc.icon;
                    return (
                      <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                          <FileText className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.namaDokumen}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            {doc.nomorDokumen && (
                              <span className="text-xs text-gray-400">No. {doc.nomorDokumen}</span>
                            )}
                            {doc.tanggalTerbit && (
                              <span className="text-xs text-gray-400">
                                Terbit: {new Date(doc.tanggalTerbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {doc.tanggalKadaluarsa && (
                              <span className="text-xs text-gray-400">
                                Exp: {new Date(doc.tanggalKadaluarsa).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {doc.instansiPenerbit && (
                              <span className="text-xs text-gray-400 truncate">{doc.instansiPenerbit}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.color}`}>
                            <SIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {doc.fileUrl && (
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                title="Lihat"
                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(doc)}
                              title="Edit"
                              className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              title="Hapus"
                              className="p-1.5 hover:bg-red-100 text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Template dokumen yang belum diupload */}
                  {!search && (
                    <div className="px-4 py-2">
                      <p className="text-xs text-gray-400 mb-2">Dokumen yang disarankan:</p>
                      <div className="flex flex-wrap gap-2">
                        {templates
                          .filter(t => !docsKat.some(d => d.namaDokumen === t))
                          .map(t => (
                            <button
                              key={t}
                              onClick={() => openAdd(kat, t)}
                              className={`text-xs px-2.5 py-1 rounded-full border border-dashed ${cfg.border} ${cfg.color} hover:bg-white/80 transition-colors flex items-center gap-1`}
                            >
                              <Plus className="w-2.5 h-2.5" />
                              {t}
                            </button>
                          ))}
                        {templates.every(t => docsKat.some(d => d.namaDokumen === t)) && docsKat.length > 0 && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Semua dokumen telah diupload
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {docs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium text-gray-500">Belum ada dokumen tersimpan</p>
          <p className="text-xs mt-1">Klik tombol kategori di atas untuk menambah dokumen</p>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <ModalDokumen
          pegawaiId={pegawaiId}
          editData={editDoc}
          defaultKategori={defaultKat}
          defaultNama={defaultNama}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditDoc(null); }}
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">{previewDoc.namaDokumen}</h3>
                {previewDoc.nomorDokumen && <p className="text-xs text-gray-400">No. {previewDoc.nomorDokumen}</p>}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName || previewDoc.namaDokumen}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh
                </a>
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {previewDoc.fileUrl?.startsWith('data:image') ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.namaDokumen} className="max-w-full rounded-lg" />
              ) : previewDoc.fileUrl?.startsWith('data:application/pdf') ? (
                <iframe src={previewDoc.fileUrl} className="w-full h-[60vh] rounded-lg" title={previewDoc.namaDokumen} />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <FileText className="w-12 h-12 opacity-30 mb-2" />
                  <p className="text-sm">Preview tidak tersedia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
