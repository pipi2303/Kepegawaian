import React, { useState, useEffect, useCallback } from 'react';
import { Star, Plus, X, CheckCircle, Clock, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { angkaKreditApi } from '../data/api';
import { toast } from 'sonner';

type TabType = 'input' | 'rekap';

const UNSUR_LIST = ['Pendidikan', 'Pelayanan', 'Pengembangan', 'Penunjang'] as const;

const STATUS_BADGE: Record<string, string> = {
  Draft:       'bg-gray-100 text-gray-600',
  Diajukan:    'bg-blue-100 text-blue-700',
  Diverifikasi:'bg-amber-100 text-amber-700',
  Disetujui:   'bg-green-100 text-green-700',
};

const PREDIKAT_BADGE: Record<string, string> = {
  Memenuhi:       'bg-green-100 text-green-700',
  Kurang:         'bg-amber-100 text-amber-700',
  'Belum Memenuhi': 'bg-red-100 text-red-700',
};

const TAHUN_NOW = new Date().getFullYear();
const SEMESTER_NOW = new Date().getMonth() < 6 ? 1 : 2;

const EMPTY_FORM = {
  pegawai_id: '',
  tahun: TAHUN_NOW,
  semester: SEMESTER_NOW as 1 | 2,
  jabatan_fungsional: '',
  unsur: 'Pelayanan' as typeof UNSUR_LIST[number],
  sub_unsur: '',
  kegiatan: '',
  satuan: '',
  jumlah_kegiatan: 0,
  angka_kredit_per_satuan: 0,
  bukti: '',
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cls}`}>{label}</span>;
}

export default function AngkaKredit() {
  const [activeTab, setActiveTab] = useState<TabType>('input');

  // Input tab
  const [filter, setFilter] = useState({ pegawai_id: '', tahun: TAHUN_NOW, semester: SEMESTER_NOW as 1 | 2 });
  const [items, setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const totalAK = parseFloat((form.jumlah_kegiatan * form.angka_kredit_per_satuan).toFixed(3));

  // Rekap tab
  const [rekap, setRekap]         = useState<any[]>([]);
  const [rekapTahun, setRekapTahun] = useState(TAHUN_NOW);
  const [rekapLoading, setRekapLoading] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const r = await angkaKreditApi.getAll({
        pegawai_id: filter.pegawai_id || undefined,
        tahun: filter.tahun,
        semester: filter.semester,
      });
      setItems(r.data?.data ?? r.data ?? []);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [filter]);

  const loadRekap = useCallback(async () => {
    setRekapLoading(true);
    try {
      const r = await angkaKreditApi.rekap({ tahun: rekapTahun });
      setRekap(r.data ?? []);
    } catch { toast.error('Gagal memuat rekap'); }
    finally { setRekapLoading(false); }
  }, [rekapTahun]);

  useEffect(() => { if (activeTab === 'input') loadItems(); }, [activeTab, loadItems]);
  useEffect(() => { if (activeTab === 'rekap') loadRekap(); }, [activeTab, loadRekap]);

  const handleSave = async () => {
    if (!form.pegawai_id || !form.jabatan_fungsional || !form.kegiatan || !form.satuan) {
      toast.error('Isi semua field wajib'); return;
    }
    try {
      await angkaKreditApi.create({ ...form, total_angka_kredit: totalAK });
      toast.success('Kegiatan AK disimpan');
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      loadItems();
    } catch { toast.error('Gagal menyimpan'); }
  };

  const handleAjukan = async () => {
    if (!filter.pegawai_id) { toast.error('Pilih pegawai terlebih dahulu'); return; }
    try {
      const r = await angkaKreditApi.ajukan({
        pegawai_id: parseInt(filter.pegawai_id),
        tahun: filter.tahun,
        semester: filter.semester,
      });
      toast.success(`${r.updated} kegiatan diajukan`);
      loadItems();
    } catch { toast.error('Gagal mengajukan'); }
  };

  const handleVerifikasi = async (id: number) => {
    try { await angkaKreditApi.verifikasi(id); toast.success('Diverifikasi'); loadItems(); }
    catch { toast.error('Gagal memverifikasi'); }
  };

  const handleSetujui = async (id: number) => {
    try { await angkaKreditApi.setujui(id); toast.success('Disetujui'); loadItems(); }
    catch { toast.error('Gagal menyetujui'); }
  };

  const draftCount = items.filter(i => i.status === 'Draft').length;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl"><Star className="w-5 h-5 text-amber-600" /></div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Angka Kredit Jabatan Fungsional</h1>
            <p className="text-sm text-gray-500 mt-0.5">Perawat · Dokter · Apoteker · Radiografer · Tenaga Fungsional Lain</p>
          </div>
        </div>
        {activeTab === 'input' && (
          <button onClick={() => { setForm({ ...EMPTY_FORM, pegawai_id: filter.pegawai_id, tahun: filter.tahun, semester: filter.semester }); setShowModal(true); }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Tambah Kegiatan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {([
            { key: 'input' as TabType, label: 'Input Kegiatan' },
            { key: 'rekap' as TabType, label: 'Rekap & Target' },
          ]).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-amber-500 text-amber-700 bg-amber-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── INPUT TAB ─── */}
        {activeTab === 'input' && (
          <>
            {/* Filter bar */}
            <div className="p-4 border-b border-gray-50 flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">ID Pegawai</label>
                <input value={filter.pegawai_id} onChange={e => setFilter(f => ({ ...f, pegawai_id: e.target.value }))}
                  placeholder="ID pegawai" className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 w-36" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tahun</label>
                <select value={filter.tahun} onChange={e => setFilter(f => ({ ...f, tahun: parseInt(e.target.value) }))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {[TAHUN_NOW, TAHUN_NOW - 1, TAHUN_NOW - 2].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Semester</label>
                <select value={filter.semester} onChange={e => setFilter(f => ({ ...f, semester: parseInt(e.target.value) as 1 | 2 }))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value={1}>Semester I (Jan–Jun)</option>
                  <option value={2}>Semester II (Jul–Des)</option>
                </select>
              </div>
              <button onClick={loadItems} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 mt-5" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {draftCount > 0 && (
                <button onClick={handleAjukan}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg mt-5">
                  <Send className="w-4 h-4" /> Ajukan {draftCount} Draft
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Unsur / Sub-Unsur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Kegiatan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Jumlah</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">AK/Satuan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 font-bold">Total AK</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {loading
                    ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Memuat data...</td></tr>
                    : items.length === 0
                    ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Belum ada data. Tambah kegiatan untuk memulai.</td></tr>
                    : items.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800 text-xs">{item.unsur}</p>
                          <p className="text-xs text-gray-400">{item.sub_unsur}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600 max-w-xs truncate">{item.kegiatan}</td>
                        <td className="px-4 py-3.5 text-right text-xs text-gray-700">{item.jumlah_kegiatan} {item.satuan}</td>
                        <td className="px-4 py-3.5 text-right text-xs text-gray-700">{item.angka_kredit_per_satuan}</td>
                        <td className="px-4 py-3.5 text-right text-sm font-bold text-amber-700">{item.total_angka_kredit}</td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge label={item.status} cls={STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-600'} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {item.status === 'Diajukan' && (
                              <button onClick={() => handleVerifikasi(item.id)}
                                className="text-xs px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md border border-amber-200">
                                Verifikasi
                              </button>
                            )}
                            {item.status === 'Diverifikasi' && (
                              <button onClick={() => handleSetujui(item.id)}
                                className="text-xs px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-md border border-green-200">
                                Setujui
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr className="bg-amber-50 border-t-2 border-amber-200">
                      <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">Total Angka Kredit Periode Ini</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-amber-700">
                        {items.reduce((s, i) => s + parseFloat(i.total_angka_kredit ?? 0), 0).toFixed(3)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {/* ─── REKAP TAB ─── */}
        {activeTab === 'rekap' && (
          <>
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tahun</label>
                <select value={rekapTahun} onChange={e => setRekapTahun(parseInt(e.target.value))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {[TAHUN_NOW, TAHUN_NOW - 1, TAHUN_NOW - 2].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={loadRekap} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 mt-5" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${rekapLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jabatan Fungsional</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Golongan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">AK Disetujui</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Target</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Gap</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Predikat</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {rekapLoading
                    ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Memuat rekap...</td></tr>
                    : rekap.length === 0
                    ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Belum ada data angka kredit yang disetujui untuk tahun {rekapTahun}</td></tr>
                    : rekap.map(r => (
                      <tr key={r.pegawai_id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800">{r.nama}</p>
                          <p className="text-xs text-gray-400">{r.nip}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{r.jabatan_fungsional}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{r.golongan || '—'}</td>
                        <td className="px-4 py-3.5 text-right text-sm font-bold text-amber-700">{r.total_ak_tahun}</td>
                        <td className="px-4 py-3.5 text-right text-xs text-gray-600">{r.target > 0 ? r.target : '—'}</td>
                        <td className={`px-4 py-3.5 text-right text-xs font-medium ${r.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {r.target > 0 ? (r.gap >= 0 ? `+${r.gap}` : r.gap) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge label={r.predikat} cls={PREDIKAT_BADGE[r.predikat] ?? 'bg-gray-100 text-gray-600'} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ─── ADD FORM MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Tambah Kegiatan Angka Kredit</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tahun</label>
                  <select value={form.tahun} onChange={e => setForm(f => ({ ...f, tahun: parseInt(e.target.value) }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {[TAHUN_NOW, TAHUN_NOW - 1].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Semester</label>
                  <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: parseInt(e.target.value) as 1 | 2 }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value={1}>Semester I</option>
                    <option value={2}>Semester II</option>
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">ID Pegawai *</label>
                <input value={form.pegawai_id} onChange={e => setForm(f => ({ ...f, pegawai_id: e.target.value }))}
                  placeholder="Masukkan ID pegawai" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan Fungsional *</label>
                <input value={form.jabatan_fungsional} onChange={e => setForm(f => ({ ...f, jabatan_fungsional: e.target.value }))}
                  placeholder="Cth: Perawat Ahli Pertama" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Unsur</label>
                  <select value={form.unsur} onChange={e => setForm(f => ({ ...f, unsur: e.target.value as any }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {UNSUR_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Sub-Unsur *</label>
                  <input value={form.sub_unsur} onChange={e => setForm(f => ({ ...f, sub_unsur: e.target.value }))}
                    placeholder="Sub-unsur kegiatan" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Nama Kegiatan *</label>
                <textarea rows={2} value={form.kegiatan} onChange={e => setForm(f => ({ ...f, kegiatan: e.target.value }))}
                  placeholder="Deskripsi kegiatan yang dilakukan" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Jumlah</label>
                  <input type="number" min={0} step={0.01} value={form.jumlah_kegiatan}
                    onChange={e => setForm(f => ({ ...f, jumlah_kegiatan: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Satuan *</label>
                  <input value={form.satuan} onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))}
                    placeholder="Kegiatan/Laporan/Jam" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1.5">AK/Satuan</label>
                  <input type="number" min={0} step={0.001} value={form.angka_kredit_per_satuan}
                    onChange={e => setForm(f => ({ ...f, angka_kredit_per_satuan: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              {/* Auto-calculated total */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Angka Kredit</span>
                <span className="text-lg font-bold text-amber-700">{totalAK.toFixed(3)}</span>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Bukti / Referensi</label>
                <input value={form.bukti} onChange={e => setForm(f => ({ ...f, bukti: e.target.value }))}
                  placeholder="Nomor SK / link dokumen" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
