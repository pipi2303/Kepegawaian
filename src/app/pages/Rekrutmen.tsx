import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, Eye, ChevronDown, X, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { rekrutmenApi } from '../data/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusFormasiBadge: Record<string, string> = {
  Draft:   'bg-gray-100 text-gray-700',
  Aktif:   'bg-green-100 text-green-700',
  Ditutup: 'bg-orange-100 text-orange-700',
  Selesai: 'bg-blue-100 text-blue-700',
};

const statusLamaranBadge: Record<string, string> = {
  Diterima:    'bg-yellow-100 text-yellow-700',
  Review:      'bg-blue-100 text-blue-700',
  Tes:         'bg-purple-100 text-purple-700',
  Wawancara:   'bg-indigo-100 text-indigo-700',
  Lolos:       'bg-green-100 text-green-700',
  'Tidak Lolos': 'bg-red-100 text-red-700',
  Cadangan:    'bg-gray-100 text-gray-700',
};

const formatRp = (v: number | null) =>
  v != null ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v) : '-';

const EMPTY_FORMASI = {
  jabatan: '', unit_kerja: '', kualifikasi_pendidikan: '', jurusan_dibutuhkan: '',
  jumlah_formasi: 1, gaji_min: '', gaji_max: '', status_pegawai_target: 'PPPK',
  persyaratan_khusus: '', batas_usia_min: '', batas_usia_max: '',
  tanggal_buka: '', tanggal_tutup: '',
};

// ── Modal Formasi ─────────────────────────────────────────────────────────────

function FormasiModal({ onClose, edit }: { onClose: () => void; edit?: any }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(edit ? {
    ...edit,
    gaji_min: edit.gaji_min ?? '', gaji_max: edit.gaji_max ?? '',
    batas_usia_min: edit.batas_usia_min ?? '', batas_usia_max: edit.batas_usia_max ?? '',
  } : { ...EMPTY_FORMASI });

  const mut = useMutation({
    mutationFn: (d: any) => edit ? rekrutmenApi.updateFormasi(edit.id, d) : rekrutmenApi.createFormasi(d),
    onSuccess: () => {
      toast.success(edit ? 'Formasi diperbarui' : 'Formasi berhasil dibuat');
      qc.invalidateQueries({ queryKey: ['formasi'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Gagal menyimpan'),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => { e.preventDefault(); mut.mutate(form); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{edit ? 'Edit Formasi' : 'Buka Formasi Baru'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          {([
            ['jabatan', 'Jabatan', 'text', true],
            ['unit_kerja', 'Unit Kerja', 'text', true],
            ['kualifikasi_pendidikan', 'Kualifikasi Pendidikan', 'text', true],
            ['jurusan_dibutuhkan', 'Jurusan (opsional)', 'text', false],
          ] as [string, string, string, boolean][]).map(([k, label, type, req]) => (
            <div key={k} className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" type={type}
                value={form[k as keyof typeof form] ?? ''} required={req}
                onChange={e => set(k, e.target.value)} />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1">Jumlah Formasi</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min={1} required
              value={form.jumlah_formasi} onChange={e => set('jumlah_formasi', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Pegawai</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.status_pegawai_target} onChange={e => set('status_pegawai_target', e.target.value)}>
              <option value="PPPK">PPPK</option>
              <option value="Honorer">Honorer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gaji Min (Rp)</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min={0}
              value={form.gaji_min} onChange={e => set('gaji_min', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gaji Max (Rp)</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min={0}
              value={form.gaji_max} onChange={e => set('gaji_max', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Batas Usia Min</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min={17}
              value={form.batas_usia_min} onChange={e => set('batas_usia_min', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Batas Usia Max</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" max={65}
              value={form.batas_usia_max} onChange={e => set('batas_usia_max', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Buka</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" type="date" required
              value={form.tanggal_buka} onChange={e => set('tanggal_buka', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Tutup</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" type="date" required
              value={form.tanggal_tutup} onChange={e => set('tanggal_tutup', e.target.value)} />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Persyaratan Khusus</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
              value={form.persyaratan_khusus} onChange={e => set('persyaratan_khusus', e.target.value)} />
          </div>

          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
            <button type="submit" disabled={mut.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
              {mut.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Detail Lamaran ──────────────────────────────────────────────────────

function DetailLamaranModal({ lamaran, onClose }: { lamaran: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(lamaran.status);
  const [catatan, setCatatan] = useState(lamaran.catatan_admin ?? '');
  const [nilai, setNilai] = useState(lamaran.nilai_tes ?? '');

  const mut = useMutation({
    mutationFn: () => rekrutmenApi.updateStatus(lamaran.id, { status, catatan_admin: catatan || null, nilai_tes: nilai || null }),
    onSuccess: () => { toast.success('Status diperbarui'); qc.invalidateQueries({ queryKey: ['lamaran'] }); onClose(); },
    onError: () => toast.error('Gagal memperbarui'),
  });

  const rows: [string, any][] = [
    ['Nama', lamaran.nama_lengkap], ['Email', lamaran.email], ['No HP', lamaran.no_hp],
    ['Tempat/Tgl Lahir', `${lamaran.tempat_lahir}, ${lamaran.tanggal_lahir}`],
    ['Jenis Kelamin', lamaran.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
    ['Agama', lamaran.agama], ['Alamat', lamaran.alamat],
    ['Pendidikan', `${lamaran.pendidikan_terakhir} - ${lamaran.jurusan} (${lamaran.institusi})`],
    ['IPK', lamaran.ipk ?? '-'], ['Pengalaman Kerja', lamaran.pengalaman_kerja ?? '-'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Detail Lamaran #{lamaran.id}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <dl className="space-y-2 mb-4 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="w-36 text-gray-500 shrink-0">{k}</dt>
              <dd className="font-medium break-words">{v}</dd>
            </div>
          ))}
        </dl>

        <hr className="my-4" />
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Update Status</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
              {['Diterima','Review','Tes','Wawancara','Lolos','Tidak Lolos','Cadangan'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nilai Tes</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min={0} max={100}
              value={nilai} onChange={e => setNilai(e.target.value)} placeholder="0–100" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Catatan Admin</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
              value={catatan} onChange={e => setCatatan(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Tutup</button>
            <button onClick={() => mut.mutate()} disabled={mut.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
              {mut.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Rekrutmen() {
  const [tab, setTab] = useState<'formasi' | 'lamaran'>('formasi');
  const [showFormasiModal, setShowFormasiModal] = useState(false);
  const [editFormasi, setEditFormasi] = useState<any>(null);
  const [selectedLamaran, setSelectedLamaran] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFormasi, setFilterFormasi] = useState('');
  const [filterLamaranStatus, setFilterLamaranStatus] = useState('');
  const [page, setPage] = useState(1);

  const qc = useQueryClient();

  const { data: formasiData, isLoading: loadingFormasi } = useQuery({
    queryKey: ['formasi', filterStatus, page],
    queryFn: () => rekrutmenApi.getFormasi({ status: filterStatus || undefined, page }),
  });

  const { data: lamaranData, isLoading: loadingLamaran } = useQuery({
    queryKey: ['lamaran', filterFormasi, filterLamaranStatus, page],
    queryFn: () => rekrutmenApi.getLamaran({
      formasi_id: filterFormasi || undefined,
      status: filterLamaranStatus || undefined,
      page,
    }),
    enabled: tab === 'lamaran',
  });

  const aktifkanMut = useMutation({
    mutationFn: (id: number) => rekrutmenApi.aktifkan(id),
    onSuccess: () => { toast.success('Formasi diaktifkan'); qc.invalidateQueries({ queryKey: ['formasi'] }); },
  });

  const tutupMut = useMutation({
    mutationFn: (id: number) => rekrutmenApi.tutup(id),
    onSuccess: () => { toast.success('Formasi ditutup'); qc.invalidateQueries({ queryKey: ['formasi'] }); },
  });

  const handleExport = useCallback((formasiId: number) => {
    rekrutmenApi.exportLamaran(formasiId).then(res => {
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `lamaran_${formasiId}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    }).catch(() => toast.error('Gagal export'));
  }, []);

  const formasi = formasiData?.data?.data ?? [];
  const lamaranList = lamaranData?.data?.data ?? [];
  const lamaranMeta = lamaranData?.data?.meta ?? lamaranData?.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Briefcase className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold">Rekrutmen PPPK / Honorer</h1>
        </div>
        {tab === 'formasi' && (
          <button onClick={() => { setEditFormasi(null); setShowFormasiModal(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            <Plus size={16} /> Buka Formasi Baru
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([['formasi','Kelola Formasi'],['lamaran','Daftar Pelamar']] as [typeof tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Formasi ── */}
      {tab === 'formasi' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select className="border rounded-lg px-3 py-2 text-sm" value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              {['Draft','Aktif','Ditutup','Selesai'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loadingFormasi ? <p className="text-gray-500 text-sm">Memuat...</p> : (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {['Jabatan','Unit Kerja','Jumlah Formasi','Status','Tanggal Tutup','Pelamar','Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {formasi.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada formasi</td></tr>
                  ) : formasi.map((f: any) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{f.jabatan}</td>
                      <td className="px-4 py-3 text-gray-600">{f.unit_kerja}</td>
                      <td className="px-4 py-3">{f.jumlah_formasi}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusFormasiBadge[f.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{f.tanggal_tutup}</td>
                      <td className="px-4 py-3">{f.lamaran_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {f.status === 'Draft' && (
                            <button onClick={() => aktifkanMut.mutate(f.id)}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Aktifkan</button>
                          )}
                          {f.status === 'Aktif' && (
                            <button onClick={() => tutupMut.mutate(f.id)}
                              className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Tutup</button>
                          )}
                          <button onClick={() => { setEditFormasi(f); setShowFormasiModal(true); }}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Edit</button>
                          <button onClick={() => { setFilterFormasi(String(f.id)); setTab('lamaran'); }}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                            <Eye size={12} /> Pelamar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Lamaran ── */}
      {tab === 'lamaran' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap items-center">
            <select className="border rounded-lg px-3 py-2 text-sm" value={filterFormasi}
              onChange={e => { setFilterFormasi(e.target.value); setPage(1); }}>
              <option value="">Semua Formasi</option>
              {formasi.map((f: any) => <option key={f.id} value={f.id}>{f.jabatan} — {f.unit_kerja}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm" value={filterLamaranStatus}
              onChange={e => { setFilterLamaranStatus(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              {['Diterima','Review','Tes','Wawancara','Lolos','Tidak Lolos','Cadangan'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {filterFormasi && (
              <button onClick={() => handleExport(Number(filterFormasi))}
                className="flex items-center gap-2 border border-green-600 text-green-700 px-3 py-2 rounded-lg text-sm">
                <Download size={14} /> Export Excel
              </button>
            )}
          </div>

          {loadingLamaran ? <p className="text-gray-500 text-sm">Memuat...</p> : (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {['Nama','Pendidikan','No HP','Email','Status','Nilai Tes','Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lamaranList.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada pelamar</td></tr>
                  ) : lamaranList.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{l.nama_lengkap}</td>
                      <td className="px-4 py-3 text-gray-600">{l.pendidikan_terakhir} / {l.jurusan}</td>
                      <td className="px-4 py-3">{l.no_hp}</td>
                      <td className="px-4 py-3">{l.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLamaranBadge[l.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{l.nilai_tes ?? '-'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedLamaran(l)}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                          <Eye size={12} /> Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showFormasiModal && (
        <FormasiModal edit={editFormasi} onClose={() => { setShowFormasiModal(false); setEditFormasi(null); }} />
      )}
      {selectedLamaran && (
        <DetailLamaranModal lamaran={selectedLamaran} onClose={() => setSelectedLamaran(null)} />
      )}
    </div>
  );
}
