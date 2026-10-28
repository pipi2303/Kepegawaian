import React, { useState } from 'react';
import { LogOut, Plus, Trash2, X, Star, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

interface ExitRecord {
  id: number;
  pegawai_id: number;
  tanggal_wawancara: string;
  tanggal_akhir_kerja: string;
  unit_kerja: string;
  jabatan: string;
  masa_kerja_tahun: number;
  alasan_utama: string;
  kepuasan_gaji: number;
  kepuasan_atasan: number;
  kepuasan_rekan: number;
  kepuasan_fasilitas: number;
  kepuasan_pengembangan: number;
  kepuasan_overall: number;
  komentar?: string;
  bersedia_kembali: boolean;
  pegawai?: { nama: string; nip: string };
}

interface Summary {
  total: number;
  alasanDist: Record<string, number>;
  unitTurnover: { unit_kerja: string; jumlah: number }[];
  avgKepuasan: { gaji: number; atasan: number; rekan: number; fasilitas: number; pengembangan: number; overall: number };
  bersediaKembali: number;
  unitList: string[];
  tahunList: number[];
}

const ALASAN_LIST = [
  'Gaji & Tunjangan', 'Jenjang Karir', 'Lingkungan Kerja',
  'Kepemimpinan', 'Keluarga & Personal', 'Kesehatan', 'Pensiun', 'Lainnya',
];

const ALASAN_COLOR: Record<string, string> = {
  'Gaji & Tunjangan':   'bg-red-100 text-red-700',
  'Jenjang Karir':      'bg-orange-100 text-orange-700',
  'Lingkungan Kerja':   'bg-yellow-100 text-yellow-700',
  'Kepemimpinan':       'bg-amber-100 text-amber-700',
  'Keluarga & Personal':'bg-blue-100 text-blue-700',
  'Kesehatan':          'bg-purple-100 text-purple-700',
  'Pensiun':            'bg-gray-100 text-gray-600',
  'Lainnya':            'bg-slate-100 text-slate-600',
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const kepuasanColor = (v: number) =>
  v >= 4 ? 'text-emerald-600' : v >= 3 ? 'text-yellow-600' : 'text-red-600';

const EMPTY_FORM = {
  pegawai_id: '',
  tanggal_wawancara: '',
  tanggal_akhir_kerja: '',
  unit_kerja: '',
  jabatan: '',
  masa_kerja_tahun: 0,
  alasan_utama: ALASAN_LIST[0],
  kepuasan_gaji: 3,
  kepuasan_atasan: 3,
  kepuasan_rekan: 3,
  kepuasan_fasilitas: 3,
  kepuasan_pengembangan: 3,
  kepuasan_overall: 3,
  komentar: '',
  bersedia_kembali: false,
};

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </span>
  );
}

export default function ExitInterview() {
  const qc = useQueryClient();
  const [filterUnit, setFilterUnit] = useState('');
  const [filterAlasan, setFilterAlasan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: summary } = useQuery<Summary>({
    queryKey: ['exit-summary'],
    queryFn: () => http.get('/exit-interview/summary').then(r => r.data),
    staleTime: 60000,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['exit-interview', filterUnit, filterAlasan, filterTahun],
    queryFn: () => http.get('/exit-interview', {
      params: {
        ...(filterUnit ? { unit_kerja: filterUnit } : {}),
        ...(filterAlasan ? { alasan_utama: filterAlasan } : {}),
        ...(filterTahun ? { tahun: filterTahun } : {}),
      },
    }).then(r => r.data),
    staleTime: 30000,
  });

  const rows: ExitRecord[] = listData?.data ?? listData ?? [];

  const createMut = useMutation({
    mutationFn: (payload: object) => http.post('/exit-interview', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exit-interview'] });
      qc.invalidateQueries({ queryKey: ['exit-summary'] });
      toast.success('Data exit interview disimpan');
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: () => toast.error('Gagal menyimpan data'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => http.delete(`/exit-interview/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exit-interview'] });
      qc.invalidateQueries({ queryKey: ['exit-summary'] });
      toast.success('Data dihapus');
      setShowDeleteConfirm(null);
    },
    onError: () => toast.error('Gagal menghapus data'),
  });

  const handleSave = () => {
    if (!form.pegawai_id || !form.tanggal_wawancara || !form.tanggal_akhir_kerja) {
      toast.error('ID Pegawai, tanggal wawancara, dan tanggal akhir kerja wajib diisi');
      return;
    }
    createMut.mutate({ ...form, pegawai_id: Number(form.pegawai_id) });
  };

  // Top 3 alasan for bar chart
  const topAlasan = Object.entries(summary?.alasanDist ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const maxAlasan = topAlasan[0]?.[1] ?? 1;

  const kepuasanAspects = summary?.avgKepuasan
    ? [
        { label: 'Gaji', value: summary.avgKepuasan.gaji },
        { label: 'Atasan', value: summary.avgKepuasan.atasan },
        { label: 'Rekan', value: summary.avgKepuasan.rekan },
        { label: 'Fasilitas', value: summary.avgKepuasan.fasilitas },
        { label: 'Pengembangan', value: summary.avgKepuasan.pengembangan },
        { label: 'Overall', value: summary.avgKepuasan.overall },
      ]
    : [];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <LogOut className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Exit Interview & Turnover</h1>
            <p className="text-sm text-gray-500">Analisis kepuasan dan pola pengunduran diri pegawai</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Data
        </button>
      </div>

      {/* Summary section */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stat cards */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ringkasan</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-orange-600">{summary.total}</span>
              <span className="text-sm text-gray-500">total exits</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Bersedia kembali:</span>
              <span className="font-semibold text-emerald-600">{summary.bersediaKembali}%</span>
            </div>
          </div>

          {/* Top alasan bar chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top 3 Alasan</p>
            <div className="space-y-2.5">
              {topAlasan.map(([alasan, count]) => (
                <div key={alasan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 truncate flex-1 mr-2">{alasan}</span>
                    <span className="font-semibold text-orange-600">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all"
                      style={{ width: `${(count / maxAlasan) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Avg kepuasan */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rata-rata Kepuasan (1-5)</p>
            <div className="space-y-2">
              {kepuasanAspects.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 w-24">{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                      <div
                        className={`h-full rounded-full ${value >= 4 ? 'bg-emerald-400' : value >= 3 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${(value / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-6 ${kepuasanColor(value)}`}>{value?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-3">
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">Semua Unit</option>
            {(summary?.unitList ?? []).map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={filterAlasan} onChange={e => setFilterAlasan(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">Semua Alasan</option>
            {ALASAN_LIST.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">Semua Tahun</option>
            {(summary?.tahunList ?? []).map(t => <option key={t} value={String(t)}>{t}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Unit</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Masa Kerja</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Alasan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Kepuasan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tanggal</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Memuat data...</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <LogOut className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">Belum ada data exit interview</p>
                  </td>
                </tr>
              ) : rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-800">{row.pegawai?.nama ?? `ID ${row.pegawai_id}`}</p>
                    {row.pegawai?.nip && <p className="text-xs text-gray-400 font-mono">{row.pegawai.nip}</p>}
                    <p className="text-xs text-gray-400">{row.jabatan}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-600">{row.unit_kerja}</td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-center text-sm text-gray-600">
                    {row.masa_kerja_tahun} thn
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ALASAN_COLOR[row.alasan_utama] ?? 'bg-gray-100 text-gray-600'}`}>
                      {row.alasan_utama}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StarRating value={row.kepuasan_overall} />
                    <p className={`text-xs font-semibold mt-0.5 ${kepuasanColor(row.kepuasan_overall)}`}>
                      {row.kepuasan_overall}/5
                    </p>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-center text-xs text-gray-500">
                    {fmtDate(row.tanggal_wawancara)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => setShowDeleteConfirm(row.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">Tambah Data Exit Interview</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">ID Pegawai *</label>
                  <input
                    type="number" value={form.pegawai_id}
                    onChange={e => setForm(f => ({ ...f, pegawai_id: e.target.value }))}
                    placeholder="ID pegawai"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Wawancara *</label>
                  <input
                    type="date" value={form.tanggal_wawancara}
                    onChange={e => setForm(f => ({ ...f, tanggal_wawancara: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Akhir Kerja *</label>
                  <input
                    type="date" value={form.tanggal_akhir_kerja}
                    onChange={e => setForm(f => ({ ...f, tanggal_akhir_kerja: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Unit Kerja</label>
                  <input
                    type="text" value={form.unit_kerja}
                    onChange={e => setForm(f => ({ ...f, unit_kerja: e.target.value }))}
                    placeholder="Unit kerja"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan</label>
                  <input
                    type="text" value={form.jabatan}
                    onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
                    placeholder="Jabatan"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Masa Kerja (tahun)</label>
                  <input
                    type="number" min="0" value={form.masa_kerja_tahun}
                    onChange={e => setForm(f => ({ ...f, masa_kerja_tahun: Number(e.target.value) }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Alasan Utama</label>
                  <select
                    value={form.alasan_utama}
                    onChange={e => setForm(f => ({ ...f, alasan_utama: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {ALASAN_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">Kepuasan (1-5)</p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { key: 'kepuasan_gaji', label: 'Gaji' },
                      { key: 'kepuasan_atasan', label: 'Atasan' },
                      { key: 'kepuasan_rekan', label: 'Rekan Kerja' },
                      { key: 'kepuasan_fasilitas', label: 'Fasilitas' },
                      { key: 'kepuasan_pengembangan', label: 'Pengembangan' },
                      { key: 'kepuasan_overall', label: 'Overall' },
                    ] as { key: keyof typeof EMPTY_FORM; label: string }[]
                  ).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-28 flex-shrink-0">{label}</label>
                      <input
                        type="number" min="1" max="5" value={form[key] as number}
                        onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                        className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Komentar</label>
                <textarea
                  rows={3} value={form.komentar}
                  onChange={e => setForm(f => ({ ...f, komentar: e.target.value }))}
                  placeholder="Masukan atau komentar pegawai..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.bersedia_kembali}
                  onChange={e => setForm(f => ({ ...f, bersedia_kembali: e.target.checked }))}
                  className="w-4 h-4 rounded accent-orange-600"
                />
                <span className="text-sm text-gray-700">Bersedia kembali bekerja di sini</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={createMut.isPending}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60"
              >
                {createMut.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Hapus Data Exit Interview?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Data ini akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button
                onClick={() => deleteMut.mutate(showDeleteConfirm!)}
                disabled={deleteMut.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
