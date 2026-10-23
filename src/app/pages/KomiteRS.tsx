import React, { useState, useMemo } from 'react';
import { Users2, Search, Plus, Edit2, Trash2, X, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { komiteApi, pegawaiApi } from '../data/api';
import { toast } from 'sonner';

type TabType = 'anggota' | 'kegiatan';

const KOMITE_COLORS: Record<string, string> = {
  'Komite Medik':         'bg-blue-100 text-blue-700',
  'Komite Keperawatan':   'bg-green-100 text-green-700',
  'Komite Nakes Lain':    'bg-teal-100 text-teal-700',
  'Komite K3RS':          'bg-orange-100 text-orange-700',
  'Komite Etik & Hukum':  'bg-purple-100 text-purple-700',
};
const fallbackColor = 'bg-gray-100 text-gray-700';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const EMPTY_ANGGOTA = {
  komite_id: '', pegawai_id: '', jabatan_di_komite: '',
  tanggal_bergabung: '', tanggal_berakhir: '', status: 'Aktif',
};

const EMPTY_KEGIATAN = {
  komite_id: '', judul_kegiatan: '', tanggal_kegiatan: '',
  jam_mulai: '', jam_selesai: '', tempat: '', agenda: '', notulensi: '',
};

export default function KomiteRS() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('anggota');
  const [search, setSearch] = useState('');
  const [filterKomite, setFilterKomite] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [detailAnggota, setDetailAnggota] = useState<any | null>(null);
  const [detailKegiatan, setDetailKegiatan] = useState<any | null>(null);
  const [formAnggota, setFormAnggota] = useState({ ...EMPTY_ANGGOTA });
  const [formKegiatan, setFormKegiatan] = useState({ ...EMPTY_KEGIATAN });

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: komiteResp } = useQuery({
    queryKey: ['komite'],
    queryFn: komiteApi.getAll,
  });

  const { data: anggotaResp } = useQuery({
    queryKey: ['komite-anggota', filterKomite],
    queryFn: () => komiteApi.getAnggota(filterKomite ? { komite_id: filterKomite } : undefined),
  });

  const { data: kegiatanResp } = useQuery({
    queryKey: ['komite-kegiatan', filterKomite],
    queryFn: () => komiteApi.getKegiatan(filterKomite ? { komite_id: filterKomite } : undefined),
  });

  const { data: pegawaiResp } = useQuery({
    queryKey: ['pegawai', {}],
    queryFn: () => pegawaiApi.getAll({ per_page: 500 }),
  });

  const komiteList: any[] = komiteResp?.data ?? [];
  const anggotaList: any[] = anggotaResp?.data ?? [];
  const kegiatanList: any[] = kegiatanResp?.data ?? [];
  const pegawai: any[] = pegawaiResp?.data ?? pegawaiResp ?? [];

  const getPegawai = (id: number) => pegawai.find((p: any) => p.id === id);
  const getKomite  = (id: number | string) => komiteList.find((k: any) => k.id === +id);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const addAnggotaMut = useMutation({
    mutationFn: (d: any) => komiteApi.addAnggota(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['komite-anggota'] }); qc.invalidateQueries({ queryKey: ['komite'] }); toast.success('Anggota ditambahkan'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menambahkan anggota'),
  });

  const updateAnggotaMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: any }) => komiteApi.updateAnggota(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['komite-anggota'] }); toast.success('Anggota diperbarui'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal memperbarui anggota'),
  });

  const removeAnggotaMut = useMutation({
    mutationFn: (id: number) => komiteApi.removeAnggota(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['komite-anggota'] }); qc.invalidateQueries({ queryKey: ['komite'] }); toast.success('Anggota dihapus'); setShowDeleteConfirm(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
  });

  const addKegiatanMut = useMutation({
    mutationFn: (d: any) => komiteApi.addKegiatan(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['komite-kegiatan'] }); qc.invalidateQueries({ queryKey: ['komite'] }); toast.success('Kegiatan dijadwalkan'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menambahkan kegiatan'),
  });

  const updateKegiatanMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: any }) => komiteApi.updateKegiatan(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['komite-kegiatan'] }); toast.success('Kegiatan diperbarui'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal memperbarui kegiatan'),
  });

  const removeKegiatanMut = useMutation({
    mutationFn: (id: number) => komiteApi.removeKegiatan(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['komite-kegiatan'] }); qc.invalidateQueries({ queryKey: ['komite'] }); toast.success('Kegiatan dihapus'); setShowDeleteConfirm(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
  });

  // ── Filtered data ─────────────────────────────────────────────────────────────

  const filteredAnggota = useMemo(() => anggotaList.filter((a: any) => {
    const nama = a.pegawai?.nama ?? getPegawai(a.pegawai_id)?.nama ?? '';
    const ok = !search || nama.toLowerCase().includes(search.toLowerCase()) || (a.jabatan_di_komite || '').toLowerCase().includes(search.toLowerCase());
    const okK = !filterKomite || String(a.komite_id) === filterKomite;
    return ok && okK;
  }), [anggotaList, search, filterKomite]);

  const filteredKegiatan = useMemo(() => kegiatanList.filter((k: any) => {
    const komitaNama = k.komite?.nama_komite ?? getKomite(k.komite_id)?.nama_komite ?? '';
    const ok = !search || komitaNama.toLowerCase().includes(search.toLowerCase()) || (k.judul_kegiatan || '').toLowerCase().includes(search.toLowerCase()) || (k.agenda || '').toLowerCase().includes(search.toLowerCase());
    const okK = !filterKomite || String(k.komite_id) === filterKomite;
    return ok && okK;
  }), [kegiatanList, search, filterKomite]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (activeTab === 'anggota') {
      if (!formAnggota.pegawai_id || !formAnggota.tanggal_bergabung || !formAnggota.komite_id) { toast.error('Harap isi field wajib'); return; }
      if (editId) updateAnggotaMut.mutate({ id: editId, d: formAnggota });
      else addAnggotaMut.mutate(formAnggota);
    } else {
      if (!formKegiatan.komite_id || !formKegiatan.tanggal_kegiatan || !formKegiatan.judul_kegiatan) { toast.error('Harap isi field wajib'); return; }
      if (editId) updateKegiatanMut.mutate({ id: editId, d: formKegiatan });
      else addKegiatanMut.mutate(formKegiatan);
    }
  };

  const handleDelete = (id: number) => {
    if (activeTab === 'anggota') removeAnggotaMut.mutate(id);
    else removeKegiatanMut.mutate(id);
  };

  const colorFor = (nama: string) => KOMITE_COLORS[nama] ?? fallbackColor;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Komite Rumah Sakit</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 44/2009 Pasal 33–37 · Permenkes No. 755/2011 (Komite Medik) · Hospital Bylaws</p>
        </div>
        <button onClick={() => { setEditId(null); if (activeTab === 'anggota') setFormAnggota({ ...EMPTY_ANGGOTA }); else setFormKegiatan({ ...EMPTY_KEGIATAN }); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Komite Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {komiteList.map((k: any) => (
          <div key={k.id} className="bg-white rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all" onClick={() => setFilterKomite(filterKomite === String(k.id) ? '' : String(k.id))}>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colorFor(k.nama_komite)}`}>{k.nama_komite.replace('Komite ', '')}</span>
            <p className="text-lg font-bold text-gray-800 mt-1.5">{k.jumlah_anggota_aktif ?? 0}<span className="text-xs text-gray-400 font-normal ml-1">anggota</span></p>
            <p className="text-xs text-gray-400">{k.kegiatan_count ?? 0} kegiatan</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'anggota' as TabType, label: 'Keanggotaan Komite', count: anggotaList.length },
            { key: 'kegiatan' as TabType, label: 'Kegiatan & Rapat', count: kegiatanList.length },
          ].map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); }} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label} <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterKomite} onChange={e => setFilterKomite(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Komite</option>
            {komiteList.map((k: any) => <option key={k.id} value={k.id}>{k.nama_komite}</option>)}
          </select>
        </div>

        {/* Anggota Table */}
        {activeTab === 'anggota' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Anggota</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Komite</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jabatan dalam Komite</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Masa Jabatan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAnggota.length === 0
                  ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada data</td></tr>
                  : filteredAnggota.map((a: any) => {
                    const pg = a.pegawai ?? getPegawai(a.pegawai_id);
                    const km = a.komite ?? getKomite(a.komite_id);
                    return (
                      <tr key={a.id} className="hover:bg-gray-50/60 cursor-pointer transition-colors" onClick={() => setDetailAnggota(a)}>
                        <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{pg?.nama || '—'}</p><p className="text-xs text-gray-400">{pg?.jabatan}</p></td>
                        <td className="px-4 py-3.5"><span className={`text-xs px-2 py-0.5 rounded font-medium ${colorFor(km?.nama_komite ?? '')}`}>{km?.nama_komite || '—'}</span></td>
                        <td className="px-4 py-3.5 text-xs font-medium text-gray-700">{a.jabatan_di_komite}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{fmtDate(a.tanggal_bergabung)} — {a.tanggal_berakhir ? fmtDate(a.tanggal_berakhir) : 'Sekarang'}</td>
                        <td className="px-4 py-3.5 text-center"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${a.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.status}</span></td>
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setDetailAnggota(a)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setEditId(a.id); setFormAnggota({ komite_id: String(a.komite_id), pegawai_id: String(a.pegawai_id), jabatan_di_komite: a.jabatan_di_komite, tanggal_bergabung: a.tanggal_bergabung ?? '', tanggal_berakhir: a.tanggal_berakhir ?? '', status: a.status }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setShowDeleteConfirm(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Kegiatan Table */}
        {activeTab === 'kegiatan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Komite</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Judul Kegiatan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Tempat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Agenda</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredKegiatan.length === 0
                  ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Tidak ada kegiatan</td></tr>
                  : filteredKegiatan.map((k: any) => {
                    const km = k.komite ?? getKomite(k.komite_id);
                    return (
                      <tr key={k.id} className="hover:bg-gray-50/60 cursor-pointer transition-colors" onClick={() => setDetailKegiatan(k)}>
                        <td className="px-4 py-3.5"><span className={`text-xs px-2 py-0.5 rounded font-medium ${colorFor(km?.nama_komite ?? '')}`}>{km?.nama_komite || '—'}</span></td>
                        <td className="px-4 py-3.5 text-xs text-gray-700">{fmtDate(k.tanggal_kegiatan)}</td>
                        <td className="px-4 py-3.5 text-xs font-medium text-gray-800">{k.judul_kegiatan}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{k.tempat || '—'}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-600 max-w-xs truncate">{k.agenda}</td>
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setDetailKegiatan(k)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setEditId(k.id); setFormKegiatan({ komite_id: String(k.komite_id), judul_kegiatan: k.judul_kegiatan, tanggal_kegiatan: k.tanggal_kegiatan ?? '', jam_mulai: k.jam_mulai ?? '', jam_selesai: k.jam_selesai ?? '', tempat: k.tempat ?? '', agenda: k.agenda ?? '', notulensi: k.notulensi ?? '' }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setShowDeleteConfirm(k.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Anggota Modal */}
      {detailAnggota && (() => {
        const pg = detailAnggota.pegawai ?? getPegawai(detailAnggota.pegawai_id);
        const km = detailAnggota.komite ?? getKomite(detailAnggota.komite_id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailAnggota(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Detail Anggota Komite</h2>
                <button onClick={() => setDetailAnggota(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">{pg?.nama?.charAt(0) || '?'}</div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{pg?.nama || '—'}</p>
                    <p className="text-xs text-gray-500">{pg?.jabatan} · {pg?.unit_kerja}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Komite', value: <span className={`text-xs px-2 py-0.5 rounded font-medium ${colorFor(km?.nama_komite ?? '')}`}>{km?.nama_komite || '—'}</span> },
                    { label: 'Jabatan dalam Komite', value: detailAnggota.jabatan_di_komite },
                    { label: 'Mulai Bertugas', value: fmtDate(detailAnggota.tanggal_bergabung) },
                    { label: 'Selesai Bertugas', value: detailAnggota.tanggal_berakhir ? fmtDate(detailAnggota.tanggal_berakhir) : 'Masih aktif' },
                    { label: 'Status', value: <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${detailAnggota.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{detailAnggota.status}</span> },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-500 w-44 flex-shrink-0">{row.label}</span>
                      <span className="text-xs font-medium text-gray-800 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setDetailAnggota(null); setEditId(detailAnggota.id); setFormAnggota({ komite_id: String(detailAnggota.komite_id), pegawai_id: String(detailAnggota.pegawai_id), jabatan_di_komite: detailAnggota.jabatan_di_komite, tanggal_bergabung: detailAnggota.tanggal_bergabung ?? '', tanggal_berakhir: detailAnggota.tanggal_berakhir ?? '', status: detailAnggota.status }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 className="w-4 h-4" /> Edit</button>
                <button onClick={() => setDetailAnggota(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Detail Kegiatan Modal */}
      {detailKegiatan && (() => {
        const km = detailKegiatan.komite ?? getKomite(detailKegiatan.komite_id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailKegiatan(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Detail Kegiatan Komite</h2>
                <button onClick={() => setDetailKegiatan(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${colorFor(km?.nama_komite ?? '')}`}>{km?.nama_komite || '—'}</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Judul Kegiatan', value: detailKegiatan.judul_kegiatan },
                    { label: 'Tanggal', value: fmtDate(detailKegiatan.tanggal_kegiatan) },
                    { label: 'Jam', value: detailKegiatan.jam_mulai ? `${detailKegiatan.jam_mulai}${detailKegiatan.jam_selesai ? ' – ' + detailKegiatan.jam_selesai : ''}` : '—' },
                    { label: 'Tempat', value: detailKegiatan.tempat || '—' },
                    { label: 'Agenda', value: detailKegiatan.agenda },
                    { label: 'Notulensi', value: detailKegiatan.notulensi || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-500 w-36 flex-shrink-0">{row.label}</span>
                      <span className="text-xs font-medium text-gray-800 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setDetailKegiatan(null); setEditId(detailKegiatan.id); setFormKegiatan({ komite_id: String(detailKegiatan.komite_id), judul_kegiatan: detailKegiatan.judul_kegiatan, tanggal_kegiatan: detailKegiatan.tanggal_kegiatan ?? '', jam_mulai: detailKegiatan.jam_mulai ?? '', jam_selesai: detailKegiatan.jam_selesai ?? '', tempat: detailKegiatan.tempat ?? '', agenda: detailKegiatan.agenda ?? '', notulensi: detailKegiatan.notulensi ?? '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 className="w-4 h-4" /> Edit</button>
                <button onClick={() => setDetailKegiatan(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit' : 'Tambah'} {activeTab === 'anggota' ? 'Anggota Komite' : 'Kegiatan Komite'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {activeTab === 'anggota' ? <>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Komite *</label>
                  <select value={formAnggota.komite_id} onChange={e => setFormAnggota(f => ({ ...f, komite_id: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih Komite --</option>
                    {komiteList.map((k: any) => <option key={k.id} value={k.id}>{k.nama_komite}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                  <select value={formAnggota.pegawai_id} onChange={e => setFormAnggota(f => ({ ...f, pegawai_id: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih Pegawai --</option>
                    {pegawai.map((p: any) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan dalam Komite *</label><input value={formAnggota.jabatan_di_komite} onChange={e => setFormAnggota(f => ({ ...f, jabatan_di_komite: e.target.value }))} placeholder="Ketua, Sekretaris, Anggota..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Mulai *</label><input type="date" value={formAnggota.tanggal_bergabung} onChange={e => setFormAnggota(f => ({ ...f, tanggal_bergabung: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Selesai</label><input type="date" value={formAnggota.tanggal_berakhir} onChange={e => setFormAnggota(f => ({ ...f, tanggal_berakhir: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={formAnggota.status} onChange={e => setFormAnggota(f => ({ ...f, status: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </> : <>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Komite *</label>
                  <select value={formKegiatan.komite_id} onChange={e => setFormKegiatan(f => ({ ...f, komite_id: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih Komite --</option>
                    {komiteList.map((k: any) => <option key={k.id} value={k.id}>{k.nama_komite}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Judul Kegiatan *</label><input value={formKegiatan.judul_kegiatan} onChange={e => setFormKegiatan(f => ({ ...f, judul_kegiatan: e.target.value }))} placeholder="Rapat Rutin, Sidang Kredensial, dll." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal *</label><input type="date" value={formKegiatan.tanggal_kegiatan} onChange={e => setFormKegiatan(f => ({ ...f, tanggal_kegiatan: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tempat *</label><input value={formKegiatan.tempat} onChange={e => setFormKegiatan(f => ({ ...f, tempat: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jam Mulai</label><input type="time" value={formKegiatan.jam_mulai} onChange={e => setFormKegiatan(f => ({ ...f, jam_mulai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jam Selesai</label><input type="time" value={formKegiatan.jam_selesai} onChange={e => setFormKegiatan(f => ({ ...f, jam_selesai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Agenda *</label><textarea rows={2} value={formKegiatan.agenda} onChange={e => setFormKegiatan(f => ({ ...f, agenda: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Notulensi</label><textarea rows={2} value={formKegiatan.notulensi} onChange={e => setFormKegiatan(f => ({ ...f, notulensi: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
              </>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={addAnggotaMut.isPending || updateAnggotaMut.isPending || addKegiatanMut.isPending || updateKegiatanMut.isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{editId ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold mb-2">Hapus Data?</h3>
            <p className="text-sm text-gray-500 mb-4">Data ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={() => handleDelete(showDeleteConfirm!)} disabled={removeAnggotaMut.isPending || removeKegiatanMut.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg disabled:opacity-60">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
