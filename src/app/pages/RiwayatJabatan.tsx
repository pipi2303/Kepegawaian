import React, { useState, useMemo } from 'react';
import { Briefcase, Search, X, Eye, Loader2, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { mutasiApi } from '../data/api';
import http from '../lib/http';

const jenisColor: Record<string, string> = {
  'Struktural': 'bg-purple-100 text-purple-700',
  'Fungsional': 'bg-blue-100 text-blue-700',
  'Pelaksana':  'bg-gray-100 text-gray-600',
};

interface RiwayatItem {
  id: number | string;
  jabatan?: string; position?: string;
  unit_kerja?: string; unitKerja?: string;
  golongan?: string;
  tmt_mulai?: string; tmtMulai?: string;
  tmt_selesai?: string; tmtSelesai?: string;
  nomor_sk?: string; nomorSK?: string;
  tanggal_sk?: string; tanggalSK?: string;
  jenis_jabatan?: string; jenisJabatan?: string;
  keterangan?: string;
}

const normRiwayat = (r: RiwayatItem) => ({
  id:           r.id,
  jabatan:      r.jabatan ?? r.position ?? '—',
  unitKerja:    r.unit_kerja  ?? r.unitKerja  ?? '',
  golongan:     r.golongan    ?? '',
  tmtMulai:     r.tmt_mulai   ?? r.tmtMulai   ?? '',
  tmtSelesai:   r.tmt_selesai ?? r.tmtSelesai,
  nomorSK:      r.nomor_sk    ?? r.nomorSK    ?? '',
  tanggalSK:    r.tanggal_sk  ?? r.tanggalSK  ?? '',
  jenisJabatan: r.jenis_jabatan ?? r.jenisJabatan ?? 'Fungsional',
  keterangan:   r.keterangan,
});
type NormRiwayat = ReturnType<typeof normRiwayat>;

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sekarang';

export default function RiwayatJabatan() {
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<NormRiwayat | null>(null);

  // Pegawai dropdown
  const { data: pegawaiList, isLoading: loadingPegawai } = useQuery({
    queryKey: ['pegawai-dropdown'],
    queryFn: () => http.get('/pegawai', { params: { per_page: 200 } }).then(r => r.data.data?.data ?? r.data.data ?? []),
    staleTime: 300000,
  });

  // Riwayat for selected pegawai
  const { data: riwayatData, isLoading: loadingRiwayat } = useQuery({
    queryKey: ['riwayat-jabatan', selectedPegawaiId],
    queryFn: () => mutasiApi.riwayat(selectedPegawaiId!),
    enabled: !!selectedPegawaiId,
    staleTime: 120000,
  });

  const pegawaiArr: any[] = pegawaiList ?? [];

  const rawRiwayat: RiwayatItem[] = useMemo(() => {
    const d: any = riwayatData;
    return d?.data?.data ?? d?.data ?? d ?? [];
  }, [riwayatData]);

  const riwayatAll: NormRiwayat[] = useMemo(() => rawRiwayat.map(normRiwayat), [rawRiwayat]);

  const filtered = useMemo(() => riwayatAll.filter(r => {
    return !filterJenis || r.jenisJabatan === filterJenis;
  }), [riwayatAll, filterJenis]);

  const selectedPegawai = selectedPegawaiId ? pegawaiArr.find((p: any) => p.id === selectedPegawaiId) : null;

  const getFullName = (p: any) =>
    `${p.gelar_depan ? p.gelar_depan + ' ' : ''}${p.nama}${p.gelar_belakang ? ', ' + p.gelar_belakang : ''}`.trim();

  const strukturalCount = filtered.filter(r => r.jenisJabatan === 'Struktural').length;
  const fungsionalCount = filtered.filter(r => r.jenisJabatan === 'Fungsional').length;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">Riwayat Jabatan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Riwayat penempatan jabatan pegawai ASN</p>
        </div>
      </div>

      {/* Pegawai Selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <label className="text-xs font-medium text-gray-700 block mb-2">Pilih Pegawai</label>
        <div className="relative">
          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedPegawaiId ?? ''}
            onChange={e => setSelectedPegawaiId(e.target.value ? Number(e.target.value) : null)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="">-- Pilih pegawai untuk melihat riwayat jabatan --</option>
            {pegawaiArr.map((p: any) => (
              <option key={p.id} value={p.id}>{getFullName(p)} — {p.nip || p.unit_kerja || ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* No selection state */}
      {!selectedPegawaiId && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">Pilih pegawai untuk melihat riwayat jabatan</p>
          <p className="text-xs text-gray-400 mt-1">Gunakan dropdown di atas untuk memilih pegawai</p>
        </div>
      )}

      {/* Loading state */}
      {selectedPegawaiId && loadingRiwayat && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
          <p className="text-gray-500">Memuat riwayat jabatan...</p>
        </div>
      )}

      {/* Results */}
      {selectedPegawaiId && !loadingRiwayat && (
        <>
          {/* Selected pegawai info */}
          {selectedPegawai && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {selectedPegawai.nama?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{getFullName(selectedPegawai)}</p>
                  <p className="text-xs text-gray-500">{selectedPegawai.nip} · {selectedPegawai.unit_kerja}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPegawaiId(null)} className="p-1.5 hover:bg-blue-100 rounded-lg">
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total Riwayat',      value: riwayatAll.length, cls: 'bg-white border-gray-100' },
              { label: 'Jabatan Struktural', value: strukturalCount,   cls: 'bg-purple-50 border-purple-100' },
              { label: 'Jabatan Fungsional', value: fungsionalCount,   cls: 'bg-blue-50 border-blue-100' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border shadow-sm p-4 ${s.cls}`}>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-semibold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filter & View Toggle */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Cari jabatan..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Jenis</option>
                <option value="Struktural">Struktural</option>
                <option value="Fungsional">Fungsional</option>
                <option value="Pelaksana">Pelaksana</option>
              </select>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(['grouped', 'list'] as const).map(v => (
                  <button key={v} onClick={() => setViewMode(v)}
                    className={`px-4 py-2 text-xs font-medium transition-colors ${viewMode === v ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {v === 'grouped' ? 'Timeline' : 'Tabel'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {riwayatAll.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada riwayat jabatan untuk pegawai ini</p>
            </div>
          ) : viewMode === 'grouped' ? (
            // ─── Timeline View ───
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Riwayat Jabatan</p>
                <span className="text-xs text-gray-400">{filtered.length} jabatan</span>
              </div>
              <div className="px-5 py-4">
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-4">
                    {filtered
                      .filter(r => !search || r.jabatan.toLowerCase().includes(search.toLowerCase()))
                      .sort((a, b) => new Date(b.tmtMulai).getTime() - new Date(a.tmtMulai).getTime())
                      .map((r, idx) => (
                        <div key={r.id} className="relative flex items-start gap-3 cursor-pointer group" onClick={() => setDetailData(r)}>
                          <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 border-white flex-shrink-0 mt-1 ${idx === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          <div className="flex-1 p-3 bg-gray-50 rounded-xl hover:bg-blue-50/40 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{r.jabatan}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{r.unitKerja}{r.golongan ? ` · Gol. ${r.golongan}` : ''}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <p className="text-xs text-gray-400">{fmtDate(r.tmtMulai)} — {fmtDate(r.tmtSelesai)}</p>
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${jenisColor[r.jenisJabatan] ?? 'bg-gray-100 text-gray-600'}`}>{r.jenisJabatan}</span>
                                </div>
                                {r.nomorSK && <p className="text-xs text-gray-400 mt-1">SK: {r.nomorSK}</p>}
                              </div>
                              <button
                                onClick={e => { e.stopPropagation(); setDetailData(r); }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ─── List/Table View ───
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-2.5 border-b border-gray-100">
                <p className="text-xs text-gray-500">Menampilkan <span className="font-semibold text-gray-700">{filtered.length}</span> riwayat jabatan</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jabatan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Unit Kerja</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Gol.</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Periode</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Jenis</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">No. SK</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="py-10 text-center text-gray-400 text-sm">Tidak ada riwayat jabatan</td></tr>
                    ) : filtered
                      .filter(r => !search || r.jabatan.toLowerCase().includes(search.toLowerCase()))
                      .sort((a, b) => new Date(b.tmtMulai).getTime() - new Date(a.tmtMulai).getTime())
                      .map(r => (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailData(r)}>
                          <td className="px-4 py-3.5 text-sm text-gray-700 font-medium">{r.jabatan}</td>
                          <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{r.unitKerja}</td>
                          <td className="px-4 py-3.5 hidden md:table-cell text-center">
                            {r.golongan && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{r.golongan}</span>}
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell text-center">
                            <p className="text-xs text-gray-600">{fmtDate(r.tmtMulai)}</p>
                            <p className="text-xs text-gray-400">s.d. {fmtDate(r.tmtSelesai)}</p>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${jenisColor[r.jenisJabatan] ?? 'bg-gray-100 text-gray-600'}`}>{r.jenisJabatan}</span>
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500 max-w-[140px] truncate">{r.nomorSK}</td>
                          <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setDetailData(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Detail Modal ─── */}
      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailData(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail Riwayat Jabatan</h2>
              <button onClick={() => setDetailData(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {selectedPegawai && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Pegawai</p>
                  <p className="text-sm font-semibold text-gray-800">{getFullName(selectedPegawai)}</p>
                  <p className="text-xs text-gray-500">{selectedPegawai.jabatan}</p>
                </div>
              )}
              <div className={`p-3 rounded-xl ${jenisColor[detailData.jenisJabatan] ?? 'bg-gray-100 text-gray-600'}`}>
                <p className="text-xs font-semibold mb-1">Jabatan {detailData.jenisJabatan}</p>
                <p className="text-sm font-medium">{detailData.jabatan}</p>
                <p className="text-xs mt-0.5">{detailData.unitKerja}{detailData.golongan ? ` · Gol. ${detailData.golongan}` : ''}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 mb-1">TMT Mulai</p><p className="text-sm text-gray-800">{fmtDate(detailData.tmtMulai)}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">TMT Selesai</p><p className="text-sm text-gray-800">{detailData.tmtSelesai ? fmtDate(detailData.tmtSelesai) : <span className="text-green-600">Masih Aktif</span>}</p></div>
                {detailData.nomorSK && <div><p className="text-xs text-gray-400 mb-1">Nomor SK</p><p className="text-sm font-mono text-gray-800">{detailData.nomorSK}</p></div>}
                {detailData.tanggalSK && <div><p className="text-xs text-gray-400 mb-1">Tanggal SK</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggalSK)}</p></div>}
              </div>
              {detailData.keterangan && <div><p className="text-xs text-gray-400 mb-1">Keterangan</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detailData.keterangan}</p></div>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setDetailData(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
