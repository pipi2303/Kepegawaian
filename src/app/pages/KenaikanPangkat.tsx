import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus, Search, Info, X, CheckCircle, Clock, XCircle, Eye, Edit2, FileText, Loader2, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kenaikanPangkatApi } from '../data/api';
import http from '../lib/http';
import { downloadBlob } from '../lib/downloadBlob';
import { PANGKAT_GOLONGAN } from '../data/constants';
import { toast } from 'sonner';

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  'Proses':   { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  'Selesai':  { color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  'Ditolak':  { color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle },
};

const jenisKPList = [
  'Kenaikan Pangkat Reguler',
  'Kenaikan Pangkat Fungsional',
  'Kenaikan Pangkat Pilihan',
  'Kenaikan Pangkat Istimewa',
  'Kenaikan Pangkat Anumerta',
];

const eselonList = [
  'Non-Eselon', 'Eselon II/a', 'Eselon II/b', 'Eselon III/a', 'Eselon III/b',
  'Eselon IV/a', 'Eselon IV/b', 'Eselon V/a',
];

interface KPRecord {
  id: number | string;
  pegawai_id?: number | string;
  pegawaiId?: number | string;
  golongan_lama?: string; golonganLama?: string;
  golongan_baru?: string; golonganBaru?: string;
  pangkat_lama?: string;  pangkatLama?: string;
  pangkat_baru?: string;  pangkatBaru?: string;
  jenis_kenaikan?: string; jenisKenaikan?: string;
  periode_usulan?: string; periodeUsulan?: string;
  tanggal_berlaku?: string; tanggalBerlaku?: string;
  status: 'Proses' | 'Selesai' | 'Ditolak';
  nomor_sk?: string; nomorSK?: string;
  catatan?: string;
  jabatan?: string;
  eselon?: string;
  pegawai?: { id: number; nama: string; nip?: string; unit_kerja?: string; jabatan?: string; golongan?: string; pangkat?: string; gelar_depan?: string; tmt_golongan?: string };
}

const norm = (k: KPRecord) => ({
  id:            k.id,
  pegawaiId:     k.pegawai_id    ?? k.pegawaiId,
  golonganLama:  k.golongan_lama ?? k.golonganLama  ?? '',
  golonganBaru:  k.golongan_baru ?? k.golonganBaru  ?? '',
  pangkatLama:   k.pangkat_lama  ?? k.pangkatLama   ?? '',
  pangkatBaru:   k.pangkat_baru  ?? k.pangkatBaru   ?? '',
  jenisKenaikan: k.jenis_kenaikan ?? k.jenisKenaikan ?? 'Kenaikan Pangkat Reguler',
  periodeUsulan: k.periode_usulan ?? k.periodeUsulan ?? '',
  tanggalBerlaku: k.tanggal_berlaku ?? k.tanggalBerlaku,
  status:        k.status,
  nomorSK:       k.nomor_sk ?? k.nomorSK,
  catatan:       k.catatan,
  jabatan:       k.jabatan ?? '',
  eselon:        k.eselon ?? '',
  _pegawai:      k.pegawai,
});
type NormKP = ReturnType<typeof norm>;

const EMPTY_FORM = {
  pegawaiId: '' as number | string,
  golonganLama: '', golonganBaru: '', pangkatLama: '', pangkatBaru: '',
  jenisKenaikan: 'Kenaikan Pangkat Reguler',
  periodeUsulan: 'April 2026',
  tanggalBerlaku: '',
  status: 'Proses' as 'Proses' | 'Selesai' | 'Ditolak',
  nomorSK: '', catatan: '', eselon: '', jabatan: '',
};

export default function KenaikanPangkat() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editData, setEditData] = useState<NormKP | null>(null);
  const [detailData, setDetailData] = useState<NormKP | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const filters = useMemo(() => ({
    status: filterStatus || undefined,
    jenis_kenaikan: filterJenis || undefined,
    search: search || undefined,
  }), [filterStatus, filterJenis, search]);

  const { data: kpData, isLoading } = useQuery({
    queryKey: ['kenaikan-pangkat', filters],
    queryFn: () => kenaikanPangkatApi.getAll(filters),
    staleTime: 60000,
  });

  const { data: pegawaiList } = useQuery({
    queryKey: ['pegawai-dropdown'],
    queryFn: () => http.get('/pegawai', { params: { per_page: 100 } }).then(r => r.data.data?.data ?? r.data.data ?? []),
    staleTime: 300000,
  });

  const rawKP: KPRecord[] = (kpData as any)?.data?.data ?? (kpData as any)?.data ?? [];
  const kenaikanPangkat: NormKP[] = rawKP.map(norm);
  const pegawaiArr: any[] = pegawaiList ?? [];

  const createMutation = useMutation({
    mutationFn: kenaikanPangkatApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kenaikan-pangkat'] });
      toast.success('Usulan KP berhasil dibuat');
      setShowModal(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal membuat usulan KP'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => kenaikanPangkatApi.updateStatus(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kenaikan-pangkat'] });
      toast.success('Status KP diperbarui');
      setShowDetailModal(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal memperbarui status'),
  });

  const suratMutation = useMutation({
    mutationFn: (d: { pegawai_id: number | string; kp_id: number | string }) =>
      kenaikanPangkatApi.suratUsulan({ pegawai_id: Number(d.pegawai_id), kp_id: Number(d.kp_id) }),
    onSuccess: (res: any) => downloadBlob(res.data, `usulan_kp_${Date.now()}.pdf`),
    onError: () => toast.error('Gagal mengunduh surat usulan'),
  });

  const getPegawai = (k: NormKP) => {
    if (k._pegawai) return k._pegawai;
    return pegawaiArr.find((p: any) => String(p.id) === String(k.pegawaiId));
  };

  const getFullName = (k: NormKP) => {
    const p = getPegawai(k);
    if (!p) return '-';
    return `${p.gelar_depan || ''} ${p.nama}`.trim();
  };

  // Pegawai eligible (tmt_golongan >= 4 tahun, not already in Proses)
  const eligiblePegawai = useMemo(() => pegawaiArr.filter(p => {
    const tmt = new Date(p.tmt_golongan || p.tmtGolongan || '2000-01-01');
    const now = new Date();
    const diffYears = (now.getTime() - tmt.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears >= 4 && !kenaikanPangkat.some(k => String(k.pegawaiId) === String(p.id) && k.status === 'Proses');
  }), [pegawaiArr, kenaikanPangkat]);

  const filtered = useMemo(() => kenaikanPangkat.filter(k => {
    const matchStatus = !filterStatus || k.status === filterStatus;
    const matchJenis = !filterJenis || k.jenisKenaikan === filterJenis;
    const matchSearch = !search || getFullName(k).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchJenis && matchSearch;
  }), [kenaikanPangkat, filterStatus, filterJenis, search]);

  const openAdd = (prefilledPegawaiId?: number | string) => {
    setEditData(null);
    const pg = prefilledPegawaiId ? pegawaiArr.find((p: any) => String(p.id) === String(prefilledPegawaiId)) : null;
    setForm({
      ...EMPTY_FORM,
      pegawaiId: prefilledPegawaiId ?? '',
      golonganLama: pg?.golongan || '',
      pangkatLama: pg?.pangkat || '',
      jabatan: pg?.jabatan || '',
      eselon: pg?.eselon || '',
    });
    setShowModal(true);
  };

  const openEdit = (k: NormKP) => {
    setEditData(k);
    setForm({
      pegawaiId: k.pegawaiId ?? '',
      golonganLama: k.golonganLama, golonganBaru: k.golonganBaru,
      pangkatLama: k.pangkatLama,   pangkatBaru: k.pangkatBaru,
      jenisKenaikan: k.jenisKenaikan, periodeUsulan: k.periodeUsulan,
      tanggalBerlaku: k.tanggalBerlaku || '',
      status: k.status, nomorSK: k.nomorSK || '',
      catatan: k.catatan || '', eselon: k.eselon, jabatan: k.jabatan,
    });
    setShowModal(true);
  };

  const openDetail = (k: NormKP) => { setDetailData(k); setShowDetailModal(true); };

  const handleGolonganChange = (field: 'golonganLama' | 'golonganBaru', val: string) => {
    const pangkat = PANGKAT_GOLONGAN[val as keyof typeof PANGKAT_GOLONGAN] || '';
    if (field === 'golonganLama') setForm(f => ({ ...f, golonganLama: val, pangkatLama: pangkat }));
    else setForm(f => ({ ...f, golonganBaru: val, pangkatBaru: pangkat }));
  };

  const handlePegawaiChange = (pegawaiId: string) => {
    const p = pegawaiArr.find((x: any) => String(x.id) === pegawaiId);
    setForm(f => ({ ...f, pegawaiId, golonganLama: p?.golongan || '', pangkatLama: p?.pangkat || '', jabatan: p?.jabatan || '', eselon: p?.eselon || '' }));
  };

  const handleSave = () => {
    if (!form.pegawaiId || !form.golonganLama || !form.golonganBaru) {
      toast.error('Harap isi semua field yang wajib diisi');
      return;
    }
    if (form.jenisKenaikan === 'Kenaikan Pangkat Pilihan' && (!form.eselon || form.eselon === 'Non-Eselon')) {
      toast.error('Kenaikan Pangkat Pilihan mensyaratkan jabatan struktural (Eselon).');
      return;
    }
    const payload = {
      pegawai_id:      form.pegawaiId,
      golongan_lama:   form.golonganLama,
      golongan_baru:   form.golonganBaru,
      pangkat_lama:    form.pangkatLama,
      pangkat_baru:    form.pangkatBaru,
      jenis_kenaikan:  form.jenisKenaikan,
      periode_usulan:  form.periodeUsulan,
      tanggal_berlaku: form.tanggalBerlaku || undefined,
      status:          form.status,
      nomor_sk:        form.nomorSK || undefined,
      catatan:         form.catatan || undefined,
      jabatan:         form.jabatan || undefined,
      eselon:          form.eselon || undefined,
    };

    if (editData) {
      // Update via status endpoint (full update not specified; use status + re-create pattern)
      updateStatusMutation.mutate({ id: editData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const prosesCount  = kenaikanPangkat.filter(k => k.status === 'Proses').length;
  const selesaiCount = kenaikanPangkat.filter(k => k.status === 'Selesai').length;

  const isSaving = createMutation.isPending || updateStatusMutation.isPending;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">Kenaikan Pangkat</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pengusulan kenaikan pangkat ASN sesuai PP No. 11 Tahun 2017</p>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Usulkan Kenaikan Pangkat
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">Sedang Diproses</p>
          <p className="text-2xl font-semibold text-yellow-600">{prosesCount}</p>
          <p className="text-xs text-gray-400">Periode April 2026</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">Selesai</p>
          <p className="text-2xl font-semibold text-green-600">{selesaiCount}</p>
          <p className="text-xs text-gray-400">SK telah diterbitkan</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">Eligible Naik Pangkat</p>
          <p className="text-2xl font-semibold text-blue-600">{eligiblePegawai.length}</p>
          <p className="text-xs text-gray-400">Memenuhi syarat</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">Periode Usulan</p>
          <p className="text-lg font-semibold text-purple-600">Apr &amp; Okt</p>
          <p className="text-xs text-gray-400">2 kali setahun</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">Syarat Kenaikan Pangkat Reguler (PP No. 11/2017)</p>
            <ul className="mt-2 space-y-1 text-xs text-blue-700 list-disc list-inside">
              <li>Minimal 4 tahun dalam pangkat terakhir</li>
              <li>Penilaian SKP bernilai baik dalam 2 tahun terakhir</li>
              <li>Tidak sedang dalam hukuman disiplin tingkat sedang atau berat</li>
              <li>Melengkapi berkas persyaratan administrasi kepegawaian</li>
            </ul>
          </div>
          <div className="text-xs text-blue-500 whitespace-nowrap">
            <p>Periode: April &amp; Oktober</p>
            <p className="mt-0.5">Batas usulan: Feb &amp; Agus</p>
          </div>
        </div>
      </div>

      {/* Eligible Pegawai */}
      {eligiblePegawai.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
          <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">{eligiblePegawai.length} Pegawai Memenuhi Syarat Kenaikan Pangkat</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Unit Kerja</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Gol. Sekarang</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {eligiblePegawai.map((p: any) => (
                  <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{p.gelar_depan || ''} {p.nama}</p>
                      <p className="text-xs text-gray-400">{p.nip}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{p.unit_kerja}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">{p.golongan}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{p.pangkat}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button onClick={() => openAdd(p.id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                        Usulkan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter & Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari nama pegawai..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Jenis KP</option>
            {jenisKPList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
        <div className="px-5 py-2.5 border-b border-gray-100">
          <p className="text-xs text-gray-500">Menampilkan <span className="font-semibold text-gray-700">{filtered.length}</span> dari {kenaikanPangkat.length} data</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Kenaikan Pangkat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jenis KP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Periode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden xl:table-cell">No. SK</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400 text-sm">Tidak ada data kenaikan pangkat</td></tr>
              ) : filtered.map(k => {
                const sc = statusConfig[k.status] ?? { color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock };
                const IconComp = sc.icon;
                return (
                  <tr key={k.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => openDetail(k)}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{getFullName(k)}</p>
                      <p className="text-xs text-gray-400">{getPegawai(k)?.unit_kerja}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{k.golonganLama}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{k.golonganBaru}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{k.pangkatLama} → {k.pangkatBaru}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{k.jenisKenaikan}</td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-700 font-medium">{k.periodeUsulan}</td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-xs text-gray-500">
                      {k.nomorSK || (k.status === 'Proses' ? <span className="text-yellow-500">Belum diterbitkan</span> : '—')}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                        <IconComp className="w-3 h-3" />{k.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDetail(k)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Detail"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(k)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button
                          onClick={() => suratMutation.mutate({ pegawai_id: k.pegawaiId!, kp_id: k.id })}
                          disabled={suratMutation.isPending}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-60"
                          title="Surat Usulan PDF"
                        >
                          {suratMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Form Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">{editData ? 'Edit Kenaikan Pangkat' : 'Usulan Kenaikan Pangkat'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={String(form.pegawaiId)} onChange={e => handlePegawaiChange(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih Pegawai</option>
                  {pegawaiArr.map((p: any) => <option key={p.id} value={String(p.id)}>{p.gelar_depan || ''} {p.nama} — Gol. {p.golongan}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan</label>
                  <input type="text" value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
                    placeholder="Jabatan pegawai..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Eselon</label>
                  <select value={form.eselon} onChange={e => setForm(f => ({ ...f, eselon: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih Eselon</option>
                    {eselonList.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Kenaikan Pangkat *</label>
                <select value={form.jenisKenaikan} onChange={e => setForm(f => ({ ...f, jenisKenaikan: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {jenisKPList.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Golongan Lama *</label>
                  <select value={form.golonganLama} onChange={e => handleGolonganChange('golonganLama', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih</option>
                    {Object.keys(PANGKAT_GOLONGAN).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {form.pangkatLama && <p className="text-xs text-gray-400 mt-1">{form.pangkatLama}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Golongan Baru *</label>
                  <select value={form.golonganBaru} onChange={e => handleGolonganChange('golonganBaru', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih</option>
                    {Object.keys(PANGKAT_GOLONGAN).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {form.pangkatBaru && <p className="text-xs text-gray-400 mt-1">{form.pangkatBaru}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Periode Usulan *</label>
                  <select value={form.periodeUsulan} onChange={e => setForm(f => ({ ...f, periodeUsulan: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="April 2026">April 2026</option>
                    <option value="Oktober 2026">Oktober 2026</option>
                    <option value="April 2027">April 2027</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Proses">Proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK</label>
                  <input type="text" value={form.nomorSK} onChange={e => setForm(f => ({ ...f, nomorSK: e.target.value }))}
                    placeholder="SK/KP/IV/2026/..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal Berlaku</label>
                  <input type="date" value={form.tanggalBerlaku} onChange={e => setForm(f => ({ ...f, tanggalBerlaku: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan</label>
                <textarea rows={2} value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
                  placeholder="Catatan tambahan..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-800"><strong>Berkas yang diperlukan:</strong> SK CPNS/PPPK, SK KP terakhir, SKP 2 tahun terakhir, Ijazah, Surat pernyataan tidak sedang hukuman disiplin.</p>
              </div>
              {form.jenisKenaikan === 'Kenaikan Pangkat Pilihan' && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs text-purple-800"><strong>KP Pilihan:</strong> Mensyaratkan pejabat struktural aktif (Eselon II–V).</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={isSaving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editData ? 'Perbarui' : 'Simpan Usulan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Kenaikan Pangkat</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Pegawai</p>
                <p className="text-sm font-semibold text-gray-800">{getFullName(detailData)}</p>
                <p className="text-xs text-gray-500">{getPegawai(detailData)?.jabatan} · {getPegawai(detailData)?.unit_kerja}</p>
              </div>
              <div className={`p-3 rounded-xl ${statusConfig[detailData.status]?.bg ?? 'bg-gray-100'}`}>
                <p className={`text-sm font-semibold ${statusConfig[detailData.status]?.color ?? 'text-gray-700'}`}>{detailData.jenisKenaikan}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded">{detailData.golonganLama}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-xs bg-white/70 font-medium text-gray-800 px-2 py-0.5 rounded">{detailData.golonganBaru}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{detailData.pangkatLama} → {detailData.pangkatBaru}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 mb-1">Periode Usulan</p><p className="text-sm text-gray-800">{detailData.periodeUsulan}</p></div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[detailData.status]?.bg ?? 'bg-gray-100'} ${statusConfig[detailData.status]?.color ?? 'text-gray-700'}`}>{detailData.status}</span>
                </div>
                {detailData.jabatan && <div><p className="text-xs text-gray-400 mb-1">Jabatan saat KP</p><p className="text-sm text-gray-800">{detailData.jabatan}</p></div>}
                {detailData.eselon && <div><p className="text-xs text-gray-400 mb-1">Eselon</p><span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${detailData.eselon === 'Non-Eselon' ? 'bg-gray-100 text-gray-600' : 'bg-purple-100 text-purple-700'}`}>{detailData.eselon}</span></div>}
                {detailData.nomorSK && <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Nomor SK</p><p className="text-sm font-mono text-gray-800">{detailData.nomorSK}</p></div>}
                {detailData.tanggalBerlaku && <div><p className="text-xs text-gray-400 mb-1">Tanggal Berlaku</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggalBerlaku)}</p></div>}
              </div>
              {detailData.catatan && <div><p className="text-xs text-gray-400 mb-1">Catatan</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detailData.catatan}</p></div>}

              {/* Status update buttons */}
              {detailData.status === 'Proses' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: detailData.id, data: { status: 'Selesai' } })}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Selesai
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: detailData.id, data: { status: 'Ditolak' } })}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Tolak
                  </button>
                </div>
              )}

              {/* Surat Usulan PDF */}
              <button
                onClick={() => suratMutation.mutate({ pegawai_id: detailData.pegawaiId!, kp_id: detailData.id })}
                disabled={suratMutation.isPending}
                className="w-full py-2 text-sm border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {suratMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Unduh Surat Usulan PDF
              </button>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowDetailModal(false); openEdit(detailData); }} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 className="w-4 h-4" /> Edit</button>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
