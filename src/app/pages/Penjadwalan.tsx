import React, { useState, useMemo } from 'react';
import { Calendar, Plus, X, Edit2, Trash2, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { JadwalShift } from '../types';
import { toast } from 'sonner';

const SHIFT_CONFIG: Record<string, { bg: string; text: string; border: string; jam?: string }> = {
  'Pagi':    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  jam: '07:00–14:00' },
  'Sore':    { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', jam: '14:00–21:00' },
  'Malam':   { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', jam: '21:00–07:00' },
  'On-Call': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Libur':   { bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200' },
  'Lepas':   { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
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

export default function Penjadwalan() {
  const { jadwalShift, pegawai, addJadwal, updateJadwal, deleteJadwal } = useAppContext();
  const [currentWeek, setCurrentWeek] = useState(new Date(2026, 2, 9));
  const [filterUnit, setFilterUnit] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const emptyForm: Omit<JadwalShift, 'id'> = { pegawaiId: '', tanggal: '', jenisShift: 'Pagi', jamMulai: '', jamSelesai: '', unitKerja: '', keterangan: '', status: 'Aktif' };
  const [form, setForm] = useState<Omit<JadwalShift, 'id'>>(emptyForm);

  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  const weekDateStrs = weekDates.map(d => d.toISOString().split('T')[0]);

  const units = useMemo(() => [...new Set(pegawai.map(p => p.unitKerja))].sort(), [pegawai]);

  const filteredPegawai = useMemo(() => {
    const pids = new Set(jadwalShift.filter(j => weekDateStrs.includes(j.tanggal)).map(j => j.pegawaiId));
    return pegawai.filter(p => (pids.has(p.id) || filterUnit === '') && (!filterUnit || p.unitKerja === filterUnit) && p.statusAktif === 'Aktif');
  }, [jadwalShift, weekDateStrs, pegawai, filterUnit]);

  const getShift = (pegId: string, dateStr: string) => jadwalShift.find(j => j.pegawaiId === pegId && j.tanggal === dateStr);

  const fmtDate = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  const weekRange = `${weekDates[0].getDate()} – ${weekDates[6].getDate()} ${weekDates[0].toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

  const shiftCounts = useMemo(() => {
    const c: Record<string, number> = { Pagi: 0, Sore: 0, Malam: 0, 'On-Call': 0, Libur: 0, Lepas: 0 };
    jadwalShift.filter(j => weekDateStrs.includes(j.tanggal)).forEach(j => { if (c[j.jenisShift] !== undefined) c[j.jenisShift]++; });
    return c;
  }, [jadwalShift, weekDateStrs]);

  const handleSave = () => {
    if (!form.pegawaiId || !form.tanggal) { toast.error('Harap pilih pegawai dan tanggal'); return; }
    if (editId) { updateJadwal({ ...form, id: editId }); toast.success('Jadwal diperbarui'); }
    else { addJadwal(form); toast.success('Jadwal berhasil ditambahkan'); }
    setShowModal(false);
  };

  const listJadwal = useMemo(() => jadwalShift.filter(j => weekDateStrs.includes(j.tanggal)).sort((a, b) => a.tanggal.localeCompare(b.tanggal)), [jadwalShift, weekDateStrs]);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Penjadwalan Shift & On-Call</h1>
          <p className="text-sm text-gray-500 mt-0.5">UU No. 13/2003 Pasal 77–85 · Permenkes No. 33/2015 · Pola Ketenagaan RS</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tambah Jadwal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(shiftCounts).map(([shift, count]) => {
          const cfg = SHIFT_CONFIG[shift];
          return (
            <div key={shift} className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
              <p className={`text-xs font-medium ${cfg.text}`}>{shift}</p>
              <p className={`text-2xl font-bold mt-0.5 ${cfg.text}`}>{count}</p>
            </div>
          );
        })}
      </div>

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
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 text-xs ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Grid</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>List</button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
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
                ) : filteredPegawai.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 sticky left-0 bg-white border-r border-gray-100">
                      <p className="font-medium text-xs text-gray-800 truncate max-w-[140px]">{p.nama}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{p.unitKerja}</p>
                    </td>
                    {weekDateStrs.map((ds, di) => {
                      const shift = getShift(p.id, ds);
                      const isWeekend = di >= 5;
                      const cfg = shift ? SHIFT_CONFIG[shift.jenisShift] : null;
                      return (
                        <td key={ds} className={`px-1 py-2 text-center ${isWeekend ? 'bg-red-50/30' : ''}`}>
                          {shift ? (
                            <div className={`inline-block rounded px-2 py-1 text-xs ${cfg?.bg} ${cfg?.text} border ${cfg?.border} cursor-pointer`}
                              onClick={() => { setEditId(shift.id); setForm({ pegawaiId: shift.pegawaiId, tanggal: shift.tanggal, jenisShift: shift.jenisShift, jamMulai: shift.jamMulai || '', jamSelesai: shift.jamSelesai || '', unitKerja: shift.unitKerja, keterangan: shift.keterangan || '', status: shift.status }); setShowModal(true); }}>
                              {shift.jenisShift}
                              {shift.status === 'Swap' && <span className="ml-1 text-[9px]">↔</span>}
                            </div>
                          ) : (
                            <button onClick={() => { setEditId(null); setForm({ ...emptyForm, pegawaiId: p.id, tanggal: ds, unitKerja: p.unitKerja }); setShowModal(true); }} className="text-gray-300 hover:text-blue-400 text-xs px-2 py-1 rounded hover:bg-blue-50">+</button>
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
        {viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal & Hari</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Shift</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jam</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Unit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Keterangan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {listJadwal.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada jadwal</td></tr>
                  : listJadwal.map(j => {
                    const cfg = SHIFT_CONFIG[j.jenisShift];
                    const d = new Date(j.tanggal);
                    const hariIdx = (d.getDay() + 6) % 7;
                    const p = pegawai.find(x => x.id === j.pegawaiId);
                    return (
                      <tr key={j.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3.5"><p className="font-medium text-sm text-gray-800">{p?.nama || '—'}</p><p className="text-xs text-gray-400">{p?.jabatan}</p></td>
                        <td className="px-4 py-3.5"><p className="text-sm text-gray-700">{HARI_FULL[hariIdx]}, {d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p></td>
                        <td className="px-4 py-3.5"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{j.jenisShift}{j.status === 'Swap' ? ' (Swap)' : ''}</span></td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">{j.jamMulai && j.jamSelesai ? `${j.jamMulai} – ${j.jamSelesai}` : cfg.jam || '—'}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{j.unitKerja}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-400">{j.keterangan || '—'}</td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditId(j.id); setForm({ pegawaiId: j.pegawaiId, tanggal: j.tanggal, jenisShift: j.jenisShift, jamMulai: j.jamMulai || '', jamSelesai: j.jamSelesai || '', unitKerja: j.unitKerja, keterangan: j.keterangan || '', status: j.status }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
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

      {/* Modal */}
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
                <select value={form.pegawaiId} onChange={e => { const p = pegawai.find(x => x.id === e.target.value); setForm(f => ({ ...f, pegawaiId: e.target.value, unitKerja: p?.unitKerja || '' })); }} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.filter(p => p.statusAktif === 'Aktif').map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tanggal *</label><input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Shift</label>
                  <select value={form.jenisShift} onChange={e => { const s = e.target.value as JadwalShift['jenisShift']; const cfg = SHIFT_CONFIG[s]; setForm(f => ({ ...f, jenisShift: s, jamMulai: cfg.jam ? cfg.jam.split('–')[0].trim() : '', jamSelesai: cfg.jam ? cfg.jam.split('–')[1].trim() : '' })); }} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.keys(SHIFT_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jam Mulai</label><input type="time" value={form.jamMulai} onChange={e => setForm(f => ({ ...f, jamMulai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jam Selesai</label><input type="time" value={form.jamSelesai} onChange={e => setForm(f => ({ ...f, jamSelesai: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Unit Kerja</label><input value={form.unitKerja} onChange={e => setForm(f => ({ ...f, unitKerja: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as JadwalShift['status'] }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['Aktif', 'Swap', 'Pengganti'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Keterangan</label><input value={form.keterangan || ''} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} placeholder="On-call, tukar shift, dll." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editId ? 'Perbarui' : 'Simpan'}</button>
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
              <button onClick={() => { deleteJadwal(showDeleteConfirm); toast.success('Jadwal dihapus'); setShowDeleteConfirm(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
