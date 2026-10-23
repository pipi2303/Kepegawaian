import React, { useState, useMemo } from 'react';
import { Calendar, Plus, X, Edit2, Trash2, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jadwalApi, pegawaiApi } from '../data/api';
import { toast } from 'sonner';

const SHIFT_CONFIG: Record<string, { bg: string; text: string; border: string; jam?: string }> = {
  'Pagi':     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  jam: '07:00–14:00' },
  'Sore':     { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', jam: '14:00–21:00' },
  'Malam':    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', jam: '21:00–07:00' },
  'Non-Shift':{ bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',  jam: '08:00–16:00' },
  'On-Call':  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Libur':    { bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200' },
};

const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const HARI_FULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

function getWeekDates(baseDate: Date) {
  const day = baseDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(baseDate);
  mon.setDate(baseDate.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}

const EMPTY_FORM = {
  pegawai_id: '', tanggal: '', jenis_shift: 'Pagi' as string,
  jam_mulai: '07:00', jam_selesai: '14:00', unit_kerja: '', catatan: '',
};

export default function Penjadwalan() {
  const qc = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [filterUnit, setFilterUnit] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [detailJadwal, setDetailJadwal] = useState<any | null>(null);
  const [showSwap, setShowSwap] = useState(false);
  const [swapA, setSwapA] = useState('');
  const [swapB, setSwapB] = useState('');
  const [showRekap, setShowRekap] = useState(false);
  const [rekapFilter, setRekapFilter] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() });
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  const weekDateStrs = weekDates.map(d => d.toISOString().split('T')[0]);
  const bulan = weekDates[0].getMonth() + 1;
  const tahun = weekDates[0].getFullYear();

  const { data: jadwalResp, isLoading: loadingJadwal } = useQuery({
    queryKey: ['jadwal', { bulan, tahun, unit_kerja: filterUnit || undefined }],
    queryFn: () => jadwalApi.getAll({ bulan, tahun, unit_kerja: filterUnit || undefined }),
  });

  const { data: pegawaiResp } = useQuery({
    queryKey: ['pegawai', {}],
    queryFn: () => pegawaiApi.getAll({ per_page: 500 }),
  });

  const { data: rekapResp } = useQuery({
    queryKey: ['jadwal-rekap', rekapFilter],
    queryFn: () => jadwalApi.rekap(rekapFilter),
    enabled: showRekap,
  });

  // jadwal items — backend paginates; grab all from current page
  const jadwalShift: any[] = jadwalResp?.data?.data ?? jadwalResp?.data ?? [];
  const pegawai: any[] = pegawaiResp?.data ?? pegawaiResp ?? [];

  const createMut = useMutation({
    mutationFn: (d: any) => jadwalApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jadwal'] }); toast.success('Jadwal ditambahkan'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menyimpan jadwal'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: any }) => jadwalApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jadwal'] }); toast.success('Jadwal diperbarui'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal memperbarui jadwal'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => jadwalApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jadwal'] }); toast.success('Jadwal dihapus'); setShowDeleteConfirm(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
  });

  const swapMut = useMutation({
    mutationFn: ({ a, b }: { a: number; b: number }) => jadwalApi.swap(a, b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jadwal'] }); toast.success('Shift berhasil ditukar'); setShowSwap(false); setSwapA(''); setSwapB(''); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menukar shift'),
  });

  const units = useMemo(() => [...new Set(pegawai.map((p: any) => p.unit_kerja).filter(Boolean))].sort(), [pegawai]);

  const filteredPegawai = useMemo(() => {
    const pids = new Set(jadwalShift.filter((j: any) => weekDateStrs.includes(j.tanggal)).map((j: any) => j.pegawai_id));
    return pegawai.filter((p: any) => (pids.has(p.id) || filterUnit === '') && (!filterUnit || p.unit_kerja === filterUnit) && p.status_aktif === 'Aktif');
  }, [jadwalShift, weekDateStrs, pegawai, filterUnit]);

  const getShift = (pegId: number, dateStr: string) => jadwalShift.find((j: any) => j.pegawai_id === pegId && j.tanggal === dateStr);

  const fmtDate = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  const weekRange = `${weekDates[0].getDate()} – ${weekDates[6].getDate()} ${weekDates[0].toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

  const shiftCounts = useMemo(() => {
    const c: Record<string, number> = { Pagi: 0, Sore: 0, Malam: 0, 'Non-Shift': 0, 'On-Call': 0, Libur: 0 };
    jadwalShift.filter((j: any) => weekDateStrs.includes(j.tanggal)).forEach((j: any) => { if (c[j.jenis_shift] !== undefined) c[j.jenis_shift]++; });
    return c;
  }, [jadwalShift, weekDateStrs]);

  const handleSave = () => {
    if (!form.pegawai_id || !form.tanggal) { toast.error('Harap pilih pegawai dan tanggal'); return; }
    if (editId) updateMut.mutate({ id: editId, d: form });
    else createMut.mutate(form);
  };

  const listJadwal = useMemo(() =>
    jadwalShift.filter((j: any) => weekDateStrs.includes(j.tanggal)).sort((a: any, b: any) => a.tanggal.localeCompare(b.tanggal)),
    [jadwalShift, weekDateStrs]);

  const openEdit = (j: any) => {
    setEditId(j.id);
    setForm({ pegawai_id: j.pegawai_id, tanggal: j.tanggal, jenis_shift: j.jenis_shift, jam_mulai: j.jam_mulai || '', jam_selesai: j.jam_selesai || '', unit_kerja: j.unit_kerja, catatan: j.catatan || '' });
    setShowModal(true);
  };

  const rekapRows: any[] = rekapResp?.data ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Penjadwalan Shift & On-Call</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 13/2003 Pasal 77–85 · Permenkes No. 33/2015 · Pola Ketenagaan RS</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRekap(v => !v)} className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4" /> Rekap
          </button>
          <button onClick={() => setShowSwap(true)} className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-lg">
            <Users className="w-4 h-4" /> Tukar Shift
          </button>
          <button onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(shiftCounts).map(([shift, count]) => {
          const cfg = SHIFT_CONFIG[shift] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
          return (
            <div key={shift} className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
              <p className={`text-xs font-medium ${cfg.text}`}>{shift}</p>
              <p className={`text-2xl font-bold mt-0.5 ${cfg.text}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Rekap Jam Kerja */}
      {showRekap && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold text-gray-800 text-sm">Rekap Jam Kerja Per Pegawai</h2>
            <div className="flex items-center gap-2">
              <select value={rekapFilter.bulan} onChange={e => setRekapFilter(f => ({ ...f, bulan: +e.target.value }))} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleDateString('id-ID', { month: 'long' })}</option>)}
              </select>
              <select value={rekapFilter.tahun} onChange={e => setRekapFilter(f => ({ ...f, tahun: +e.target.value }))} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Unit</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Pagi</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Sore</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Malam</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Total Shift</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Total Jam</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {rekapRows.length === 0
                  ? <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-sm">Tidak ada data rekap</td></tr>
                  : rekapRows.map((r: any) => (
                    <tr key={r.pegawai_id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-medium text-sm text-gray-800">{r.nama}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{r.unit_kerja}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{r.shift_pagi}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{r.shift_sore}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{r.shift_malam}</td>
                      <td className="px-3 py-2.5 text-center text-sm font-semibold text-gray-700">{r.total_shift}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-gray-600">{r.total_jam ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Week Nav */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() - 7); setCurrentWeek(d); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
            <span className="text-sm font-medium text-gray-700">{weekRange}</span>
            <button onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() + 7); setCurrentWeek(d); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
          </div>
          <div className="flex items-center gap-3">
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Semua Unit</option>
              {units.map((u: string) => <option key={u} value={u}>{u}</option>)}
            </select>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 text-xs ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Grid</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>List</button>
            </div>
          </div>
        </div>

        {loadingJadwal && <div className="py-10 text-center text-gray-400 text-sm">Memuat jadwal...</div>}

        {/* Grid View */}
        {!loadingJadwal && viewMode === 'grid' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 min-w-[160px] sticky left-0 bg-gray-50 border-r border-gray-100">Pegawai</th>
                  {weekDates.map((d, i) => {
                    const isWeekend = i >= 5;
                    return (
                      <th key={i} className={`text-center px-2 py-3 text-xs font-semibold min-w-[100px] ${isWeekend ? 'text-red-400 bg-red-50/50' : 'text-gray-500'}`}>
                        <p>{HARI[i]}</p>
                        <p className="text-[11px] font-normal">{fmtDate(d)}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPegawai.length === 0 ? (
                  <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-sm">Tidak ada jadwal untuk minggu ini</td></tr>
                ) : filteredPegawai.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 sticky left-0 bg-white border-r border-gray-100">
                      <p className="font-medium text-xs text-gray-800 truncate max-w-[140px]">{p.nama}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{p.unit_kerja}</p>
                    </td>
                    {weekDateStrs.map((ds, di) => {
                      const shift = getShift(p.id, ds);
                      const isWeekend = di >= 5;
                      const cfg = shift ? (SHIFT_CONFIG[shift.jenis_shift] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }) : null;
                      return (
                        <td key={ds} className={`px-1 py-2 text-center ${isWeekend ? 'bg-red-50/30' : ''}`}>
                          {shift ? (
                            <div className={`inline-block rounded px-2 py-1 text-xs ${cfg?.bg} ${cfg?.text} border ${cfg?.border} cursor-pointer`}
                              onClick={() => openEdit(shift)}>
                              {shift.jenis_shift}
                              {shift.status_kehadiran === 'Tukar Shift' && <span className="ml-1 text-[9px]">↔</span>}
                            </div>
                          ) : (
                            <button onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM, pegawai_id: p.id, tanggal: ds, unit_kerja: p.unit_kerja }); setShowModal(true); }} className="text-gray-300 hover:text-blue-400 text-xs px-2 py-1 rounded hover:bg-blue-50">+</button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* List View */}
        {!loadingJadwal && viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal & Hari</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Shift</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jam</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Unit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Catatan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {listJadwal.length === 0
                  ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada jadwal</td></tr>
                  : listJadwal.map((j: any) => {
                    const cfg = SHIFT_CONFIG[j.jenis_shift] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
                    const d = new Date(j.tanggal);
                    const hariIdx = (d.getDay() + 6) % 7;
                    const pg = pegawai.find((x: any) => x.id === j.pegawai_id) ?? j.pegawai;
                    return (
                      <tr key={j.id} className="hover:bg-gray-50/60 cursor-pointer transition-colors" onClick={() => setDetailJadwal(j)}>
                        <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{pg?.nama || '—'}</p><p className="text-xs text-gray-400">{pg?.jabatan}</p></td>
                        <td className="px-4 py-3.5"><p className="text-sm text-gray-700">{HARI_FULL[hariIdx]}, {d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p></td>
                        <td className="px-4 py-3.5"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{j.jenis_shift}{j.status_kehadiran === 'Tukar Shift' ? ' (Swap)' : ''}</span></td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{j.jam_mulai && j.jam_selesai ? `${j.jam_mulai} – ${j.jam_selesai}` : cfg.jam || '—'}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{j.unit_kerja}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-400">{j.catatan || '—'}</td>
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(j)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setShowDeleteConfirm(j.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(SHIFT_CONFIG).map(([shift, cfg]) => (
          <div key={shift} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className="font-medium">{shift}</span>
            {cfg.jam && <span className="text-gray-400">{cfg.jam}</span>}
          </div>
        ))}
      </div>

      {/* Detail Jadwal Modal */}
      {detailJadwal && (() => {
        const pg = pegawai.find((x: any) => x.id === detailJadwal.pegawai_id) ?? detailJadwal.pegawai;
        const cfg = SHIFT_CONFIG[detailJadwal.jenis_shift] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
        const d = new Date(detailJadwal.tanggal);
        const hariIdx = (d.getDay() + 6) % 7;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailJadwal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Detail Jadwal Shift</h2>
                <button onClick={() => setDetailJadwal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
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
                    { label: 'Hari & Tanggal', value: `${HARI_FULL[hariIdx]}, ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` },
                    { label: 'Shift', value: <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{detailJadwal.jenis_shift}</span> },
                    { label: 'Jam Kerja', value: detailJadwal.jam_mulai && detailJadwal.jam_selesai ? `${detailJadwal.jam_mulai} – ${detailJadwal.jam_selesai}` : cfg.jam || '—' },
                    { label: 'Unit Kerja', value: detailJadwal.unit_kerja || '—' },
                    { label: 'Status Kehadiran', value: detailJadwal.status_kehadiran },
                    { label: 'Catatan', value: detailJadwal.catatan || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-500 w-36 flex-shrink-0">{row.label}</span>
                      <span className="text-xs font-medium text-gray-800 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setDetailJadwal(null); openEdit(detailJadwal); }} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 className="w-4 h-4" /> Edit</button>
                <button onClick={() => setDetailJadwal(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select value={form.pegawai_id} onChange={e => { const p = pegawai.find((x: any) => x.id === +e.target.value); setForm(f => ({ ...f, pegawai_id: e.target.value, unit_kerja: p?.unit_kerja || '' })); }} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.filter((p: any) => p.status_aktif === 'Aktif').map((p: any) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal *</label><input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Shift</label>
                  <select value={form.jenis_shift} onChange={e => { const s = e.target.value; const cfg = SHIFT_CONFIG[s]; const [mulai, selesai] = cfg.jam ? cfg.jam.split('–').map(x => x.trim()) : ['', '']; setForm(f => ({ ...f, jenis_shift: s, jam_mulai: mulai, jam_selesai: selesai })); }} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.keys(SHIFT_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jam Mulai</label><input type="time" value={form.jam_mulai} onChange={e => setForm(f => ({ ...f, jam_mulai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jam Selesai</label><input type="time" value={form.jam_selesai} onChange={e => setForm(f => ({ ...f, jam_selesai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Unit Kerja</label><input value={form.unit_kerja} onChange={e => setForm(f => ({ ...f, unit_kerja: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan</label><input value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="On-call, tukar shift, dll." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{editId ? 'Perbarui' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Tukar Shift Modal */}
      {showSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSwap(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Tukar Shift</h2>
              <button onClick={() => setShowSwap(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <p className="text-xs text-gray-500">Masukkan ID jadwal dari dua pegawai yang akan ditukar shiftnya.</p>
            <div><label className="text-xs font-medium text-gray-700 block mb-1.5">ID Jadwal A</label><input type="number" value={swapA} onChange={e => setSwapA(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="text-xs font-medium text-gray-700 block mb-1.5">ID Jadwal B</label><input type="number" value={swapB} onChange={e => setSwapB(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSwap(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={() => { if (!swapA || !swapB) { toast.error('Harap isi kedua ID jadwal'); return; } swapMut.mutate({ a: +swapA, b: +swapB }); }} disabled={swapMut.isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">Tukar</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Hapus Jadwal?</h3>
            <p className="text-sm text-gray-500 mb-4">Jadwal ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={() => deleteMut.mutate(showDeleteConfirm!)} disabled={deleteMut.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg disabled:opacity-60">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
