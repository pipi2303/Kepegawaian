import React, { useState } from 'react';
import {
  Users, Plus, X, Trash2, Edit2, Heart, Baby, UserCheck,
  User, ShieldCheck, CheckCircle2, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { DataKeluarga, HubunganKeluarga } from '../types';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const HUBUNGAN_LIST: HubunganKeluarga[] = [
  'Suami', 'Istri', 'Anak', 'Orang Tua', 'Mertua', 'Saudara Kandung', 'Lainnya',
];

const PENDIDIKAN_LIST = [
  'Belum Sekolah', 'TK', 'SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4/S1', 'S2', 'S3',
];

const AGAMA_LIST = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];

const HUBUNGAN_CONFIG: Record<HubunganKeluarga, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  Suami:           { icon: Heart,      color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200' },
  Istri:           { icon: Heart,      color: 'text-pink-600',   bg: 'bg-pink-50',   border: 'border-pink-200' },
  Anak:            { icon: Baby,       color: 'text-sky-600',    bg: 'bg-sky-50',    border: 'border-sky-200' },
  'Orang Tua':     { icon: UserCheck,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  Mertua:          { icon: UserCheck,  color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  'Saudara Kandung': { icon: Users,   color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  Lainnya:         { icon: User,       color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200' },
};

function hitungUmur(tanggalLahir: string): string {
  if (!tanggalLahir) return '-';
  const diff = Date.now() - new Date(tanggalLahir).getTime();
  const tahun = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${tahun} tahun`;
}

function generateId() {
  return 'KEL-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

const LS_KEY = 'hr_app_data_keluarga';

function loadKeluarga(pegawaiId: string): DataKeluarga[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all: DataKeluarga[] = raw ? JSON.parse(raw) : [];
    return all.filter(d => d.pegawaiId === pegawaiId);
  } catch { return []; }
}

function saveKeluarga(pegawaiId: string, data: DataKeluarga[]) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all: DataKeluarga[] = raw ? JSON.parse(raw) : [];
    const others = all.filter(d => d.pegawaiId !== pegawaiId);
    localStorage.setItem(LS_KEY, JSON.stringify([...others, ...data]));
  } catch {}
}

// ─── Modal Form ───────────────────────────────────────────────────────────────
interface ModalKeluargaProps {
  pegawaiId: string;
  editData?: DataKeluarga | null;
  onSave: (d: DataKeluarga) => void;
  onClose: () => void;
}

const emptyForm = {
  hubungan: 'Anak' as HubunganKeluarga,
  nama: '',
  jenisKelamin: 'L' as 'L' | 'P',
  tempatLahir: '',
  tanggalLahir: '',
  nomorKTP: '',
  agama: '',
  pendidikan: '',
  pekerjaan: '',
  statusHidup: 'Hidup' as 'Hidup' | 'Meninggal',
  tunjangan: false,
  keterangan: '',
};

function ModalKeluarga({ pegawaiId, editData, onSave, onClose }: ModalKeluargaProps) {
  const [form, setForm] = useState(
    editData
      ? { ...editData }
      : { ...emptyForm, pegawaiId, id: '' }
  );

  const set = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  function handleSave() {
    if (!form.nama.trim()) return;
    onSave({
      ...form,
      id: editData?.id ?? generateId(),
      pegawaiId,
      nama: form.nama.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            {editData ? 'Edit Data Keluarga' : 'Tambah Anggota Keluarga'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Hubungan & JK */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hubungan Keluarga *</label>
              <select
                value={form.hubungan}
                onChange={e => set('hubungan', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
              >
                {HUBUNGAN_LIST.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jenis Kelamin *</label>
              <select
                value={form.jenisKelamin}
                onChange={e => set('jenisKelamin', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Nama */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nama Lengkap *</label>
            <input
              value={form.nama}
              onChange={e => set('nama', e.target.value)}
              placeholder="Nama lengkap anggota keluarga"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
            />
          </div>

          {/* Tempat & Tanggal Lahir */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tempat Lahir</label>
              <input
                value={form.tempatLahir}
                onChange={e => set('tempatLahir', e.target.value)}
                placeholder="Kota"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={form.tanggalLahir}
                onChange={e => set('tanggalLahir', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
              />
            </div>
          </div>

          {/* NIK & Agama */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nomor KTP (NIK)</label>
              <input
                value={form.nomorKTP}
                onChange={e => set('nomorKTP', e.target.value)}
                placeholder="16 digit NIK"
                maxLength={16}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Agama</label>
              <select
                value={form.agama}
                onChange={e => set('agama', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
              >
                <option value="">— Pilih —</option>
                {AGAMA_LIST.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Pendidikan & Pekerjaan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pendidikan Terakhir</label>
              <select
                value={form.pendidikan}
                onChange={e => set('pendidikan', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
              >
                <option value="">— Pilih —</option>
                {PENDIDIKAN_LIST.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pekerjaan</label>
              <input
                value={form.pekerjaan}
                onChange={e => set('pekerjaan', e.target.value)}
                placeholder="Pekerjaan / profesi"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
              />
            </div>
          </div>

          {/* Status Hidup & Tunjangan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={form.statusHidup}
                onChange={e => set('statusHidup', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D]"
              >
                <option value="Hidup">Hidup</option>
                <option value="Meninggal">Meninggal</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => set('tunjangan', !form.tunjangan)}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.tunjangan ? 'bg-[#013E37]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.tunjangan ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-700">Penerima Tunjangan</span>
              </label>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Keterangan</label>
            <textarea
              value={form.keterangan}
              onChange={e => set('keterangan', e.target.value)}
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E7D] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!form.nama.trim()}
            className="flex-1 px-4 py-2 bg-[#013E37] text-white rounded-lg text-sm hover:bg-[#025046] disabled:opacity-40 transition-colors"
          >
            {editData ? 'Simpan Perubahan' : 'Tambah Anggota'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kartu Anggota Keluarga ───────────────────────────────────────────────────
interface KartuKeluargaProps {
  data: DataKeluarga;
  onEdit: () => void;
  onDelete: () => void;
}

function KartuKeluarga({ data, onEdit, onDelete }: KartuKeluargaProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = HUBUNGAN_CONFIG[data.hubungan];
  const Icon = cfg.icon;

  return (
    <div className={`border ${cfg.border} rounded-xl overflow-hidden transition-all`}>
      {/* Baris utama */}
      <div className={`flex items-center gap-3 px-4 py-3 ${cfg.bg}`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border ${cfg.border} bg-white/70`}>
          <Icon className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{data.nama}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
              {data.hubungan}
            </span>
            {data.tunjangan && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Tunjangan
              </span>
            )}
            {data.statusHidup === 'Meninggal' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Meninggal</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500">{data.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
            {data.tanggalLahir && (
              <span className="text-xs text-gray-500">
                {data.tempatLahir ? `${data.tempatLahir}, ` : ''}
                {new Date(data.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' '}({hitungUmur(data.tanggalLahir)})
              </span>
            )}
            {data.pekerjaan && <span className="text-xs text-gray-500">{data.pekerjaan}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors" title="Edit">
            <Edit2 className={`w-3.5 h-3.5 ${cfg.color}`} />
          </button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors">
            {expanded
              ? <ChevronUp className={`w-4 h-4 ${cfg.color}`} />
              : <ChevronDown className={`w-4 h-4 ${cfg.color}`} />
            }
          </button>
        </div>
      </div>

      {/* Detail tersembunyi */}
      {expanded && (
        <div className="bg-white px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 border-t border-gray-100">
          {[
            { label: 'NIK / No. KTP', value: data.nomorKTP },
            { label: 'Agama',         value: data.agama },
            { label: 'Pendidikan',    value: data.pendidikan },
            { label: 'Pekerjaan',     value: data.pekerjaan },
            { label: 'Status',        value: data.statusHidup },
            { label: 'Keterangan',    value: data.keterangan },
          ].map(row => (
            <div key={row.label}>
              <p className="text-xs text-gray-400">{row.label}</p>
              <p className="text-sm text-gray-700 font-medium mt-0.5">{row.value || '-'}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-gray-400">Penerima Tunjangan</p>
            <p className={`text-sm font-medium mt-0.5 flex items-center gap-1 ${data.tunjangan ? 'text-emerald-600' : 'text-gray-400'}`}>
              {data.tunjangan
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> Ya</>
                : <><XCircle className="w-3.5 h-3.5" /> Tidak</>
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DataKeluargaTab({ pegawaiId }: { pegawaiId: string }) {
  const [data, setData] = useState<DataKeluarga[]>(() => loadKeluarga(pegawaiId));
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<DataKeluarga | null>(null);

  function handleSave(item: DataKeluarga) {
    const updated = editItem
      ? data.map(d => d.id === item.id ? item : d)
      : [...data, item];
    setData(updated);
    saveKeluarga(pegawaiId, updated);
    setShowModal(false);
    setEditItem(null);
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus data anggota keluarga ini?')) return;
    const updated = data.filter(d => d.id !== id);
    setData(updated);
    saveKeluarga(pegawaiId, updated);
  }

  function openEdit(item: DataKeluarga) {
    setEditItem(item);
    setShowModal(true);
  }

  function openAdd() {
    setEditItem(null);
    setShowModal(true);
  }

  // Statistik ringkas
  const jumlahIstri    = data.filter(d => d.hubungan === 'Istri' && d.statusHidup === 'Hidup').length;
  const jumlahSuami    = data.filter(d => d.hubungan === 'Suami' && d.statusHidup === 'Hidup').length;
  const jumlahAnak     = data.filter(d => d.hubungan === 'Anak' && d.statusHidup === 'Hidup').length;
  const jumlahTunjangan = data.filter(d => d.tunjangan && d.statusHidup === 'Hidup').length;

  // Urutan tampil
  const URUTAN: HubunganKeluarga[] = ['Suami', 'Istri', 'Anak', 'Orang Tua', 'Mertua', 'Saudara Kandung', 'Lainnya'];
  const sorted = [...data].sort((a, b) => URUTAN.indexOf(a.hubungan) - URUTAN.indexOf(b.hubungan));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h4 className="font-semibold text-gray-800">Data Keluarga</h4>
          <p className="text-xs text-gray-400 mt-0.5">Data susunan keluarga dan tanggungan pegawai</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#013E37] text-white rounded-lg text-xs hover:bg-[#025046] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Anggota
        </button>
      </div>

      {/* Statistik */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: jumlahSuami > 0 ? 'Suami' : 'Istri / Pasangan', count: jumlahSuami || jumlahIstri, color: 'bg-rose-50 border-rose-200 text-rose-700' },
            { label: 'Anak', count: jumlahAnak, color: 'bg-sky-50 border-sky-200 text-sky-700' },
            { label: 'Total Keluarga', count: data.filter(d => d.statusHidup === 'Hidup').length, color: 'bg-[#013E37]/5 border-[#013E37]/20 text-[#013E37]' },
            { label: 'Penerima Tunjangan', count: jumlahTunjangan, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl px-4 py-3 ${s.color}`}>
              <p className="text-xl font-bold">{s.count}</p>
              <p className="text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Daftar Anggota */}
      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map(item => (
            <KartuKeluarga
              key={item.id}
              data={item}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium text-gray-500">Belum ada data keluarga</p>
          <p className="text-xs mt-1">Klik tombol "Tambah Anggota" untuk menambahkan data</p>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <ModalKeluarga
          pegawaiId={pegawaiId}
          editData={editItem}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}