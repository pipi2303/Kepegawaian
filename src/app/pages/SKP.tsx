import React, { useState, useMemo } from 'react';
import { Target, Plus, Info, X, Edit2, Eye, Award, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SKPRecord, SKPItem } from '../types';
import { toast } from 'sonner';

const predikatConfig: Record<string, { color: string; bg: string; min: number }> = {
  'Sangat Baik': { color: 'text-emerald-700', bg: 'bg-emerald-100', min: 110 },
  'Baik': { color: 'text-blue-700', bg: 'bg-blue-100', min: 90 },
  'Cukup': { color: 'text-yellow-700', bg: 'bg-yellow-100', min: 70 },
  'Kurang': { color: 'text-orange-700', bg: 'bg-orange-100', min: 50 },
  'Sangat Kurang': { color: 'text-red-700', bg: 'bg-red-100', min: 0 },
};

const statusConfig: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-600',
  'Aktif': 'bg-blue-100 text-blue-700',
  'Selesai': 'bg-green-100 text-green-700',
};

const getNilaiPredikat = (nilai: number): string => {
  if (nilai >= 110) return 'Sangat Baik';
  if (nilai >= 90) return 'Baik';
  if (nilai >= 70) return 'Cukup';
  if (nilai >= 50) return 'Kurang';
  return 'Sangat Kurang';
};

const genItemId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const EMPTY_ITEM: Omit<SKPItem, 'id'> = { uraianKegiatan: '', target: 0, satuan: '', bobot: 0 };

export default function SKP() {
  const { skp, pegawai, addSKP, updateSKP, deleteSKP } = useAppContext();
  const [selectedPegawai, setSelectedPegawai] = useState('');
  const [selectedSKP, setSelectedSKP] = useState<SKPRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showRealisasiModal, setShowRealisasiModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editData, setEditData] = useState<SKPRecord | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Form state
  const [formPegawaiId, setFormPegawaiId] = useState('');
  const [formTahun, setFormTahun] = useState(2026);
  const [formSemester, setFormSemester] = useState<1 | 2>(1);
  const [formStatus, setFormStatus] = useState<'Draft' | 'Aktif' | 'Selesai'>('Aktif');
  const [formItems, setFormItems] = useState<Array<Omit<SKPItem, 'id'> & { id: string }>>([
    { id: genItemId(), ...EMPTY_ITEM },
  ]);

  // Realisasi state
  const [realisasiValues, setRealisasiValues] = useState<Record<string, number>>({});

  const filteredSKP = useMemo(() =>
    skp.filter(s => !selectedPegawai || s.pegawaiId === selectedPegawai),
    [skp, selectedPegawai]
  );

  const getPegawai = (id: string) => pegawai.find(p => p.id === id);
  const getFullName = (id: string) => {
    const p = getPegawai(id);
    if (!p) return '-';
    return `${p.gelarDepan || ''} ${p.nama}`.trim();
  };

  const totalBobot = formItems.reduce((s, i) => s + (Number(i.bobot) || 0), 0);

  const openAdd = () => {
    setEditData(null);
    setFormPegawaiId(''); setFormTahun(2026); setFormSemester(1); setFormStatus('Aktif');
    setFormItems([{ id: genItemId(), ...EMPTY_ITEM }]);
    setShowFormModal(true);
  };

  const openEdit = (s: SKPRecord) => {
    setEditData(s);
    setFormPegawaiId(s.pegawaiId); setFormTahun(s.tahun); setFormSemester(s.semester); setFormStatus(s.status);
    setFormItems(s.targetKinerja.map(t => ({ ...t })));
    setShowFormModal(true);
  };

  const openRealisasi = (s: SKPRecord) => {
    setSelectedSKP(s);
    const init: Record<string, number> = {};
    s.targetKinerja.forEach(t => { if (t.realisasi != null) init[t.id] = t.realisasi; });
    setRealisasiValues(init);
    setShowRealisasiModal(true);
  };

  const addItem = () => setFormItems(prev => [...prev, { id: genItemId(), ...EMPTY_ITEM }]);
  const removeItem = (id: string) => setFormItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: string, value: any) =>
    setFormItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleSave = () => {
    if (!formPegawaiId) { toast.error('Pilih pegawai terlebih dahulu'); return; }
    if (formItems.some(i => !i.uraianKegiatan)) { toast.error('Isi semua uraian kegiatan'); return; }
    if (totalBobot !== 100) { toast.error(`Total bobot harus 100% (saat ini ${totalBobot}%)`); return; }

    const items: SKPItem[] = formItems.map(i => ({ ...i, target: Number(i.target), bobot: Number(i.bobot) }));
    if (editData) {
      updateSKP({ ...editData, pegawaiId: formPegawaiId, tahun: formTahun, semester: formSemester, status: formStatus, targetKinerja: items });
      toast.success('SKP berhasil diperbarui');
    } else {
      addSKP({ pegawaiId: formPegawaiId, tahun: formTahun, semester: formSemester, status: formStatus, targetKinerja: items });
      toast.success('SKP baru berhasil dibuat');
    }
    setShowFormModal(false);
  };

  const handleSaveRealisasi = () => {
    if (!selectedSKP) return;
    const updatedItems = selectedSKP.targetKinerja.map(t => {
      const real = realisasiValues[t.id] ?? t.realisasi ?? 0;
      const capaian = t.target > 0 ? Math.min(130, Math.round((real / t.target) * 100)) : 0;
      return { ...t, realisasi: real, nilaiCapaian: capaian };
    });
    const nilaiAkhir = Math.round(updatedItems.reduce((sum, t) => sum + ((t.nilaiCapaian || 0) * t.bobot / 100), 0));
    const predikat = getNilaiPredikat(nilaiAkhir);
    updateSKP({ ...selectedSKP, targetKinerja: updatedItems, nilaiAkhir, predikat, status: 'Selesai' });
    toast.success(`Realisasi disimpan. Nilai Akhir: ${nilaiAkhir} (${predikat})`);
    setShowRealisasiModal(false);
  };

  const handleDelete = (id: string) => {
    deleteSKP(id);
    setShowDeleteConfirm(null);
    toast.success('Data SKP berhasil dihapus');
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Stats
  const totalSKPCount = skp.length;
  const selesai = skp.filter(s => s.status === 'Selesai');
  const aktif = skp.filter(s => s.status === 'Aktif');
  const avgNilai = selesai.length > 0
    ? (selesai.reduce((sum, s) => sum + (s.nilaiAkhir || 0), 0) / selesai.length).toFixed(1)
    : '—';

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">SKP & Penilaian Kinerja</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sasaran Kinerja Pegawai sesuai PermenPAN-RB No. 6 Tahun 2022</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Buat SKP Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total SKP', value: totalSKPCount, sub: 'Semua periode', cls: 'bg-white border-gray-100', valCls: 'text-gray-800' },
          { label: 'SKP Aktif', value: aktif.length, sub: 'Periode berjalan', cls: 'bg-blue-50 border-blue-100', valCls: 'text-blue-600' },
          { label: 'Selesai Dinilai', value: selesai.length, sub: 'SKP telah dinilai', cls: 'bg-green-50 border-green-100', valCls: 'text-green-600' },
          { label: 'Rata-rata Nilai', value: avgNilai, sub: 'Dari SKP selesai', cls: 'bg-purple-50 border-purple-100', valCls: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border shadow-sm p-4 ${s.cls}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.valCls}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-800">Ketentuan SKP — PermenPAN-RB No. 6 Tahun 2022</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(predikatConfig).map(([predikat, cfg]) => (
                <span key={predikat} className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                  {predikat} ≥{cfg.min}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <select value={selectedPegawai} onChange={e => setSelectedPegawai(e.target.value)}
          className="w-full md:w-80 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Semua Pegawai</option>
          {pegawai.map(p => <option key={p.id} value={p.id}>{p.gelarDepan || ''} {p.nama} — {p.unitKerja}</option>)}
        </select>
      </div>

      {/* SKP Cards */}
      <div className="space-y-4">
        {filteredSKP.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada data SKP</p>
          </div>
        ) : filteredSKP.map(s => {
          const p = getPegawai(s.pegawaiId);
          const predikatCfg = s.predikat ? predikatConfig[s.predikat] : null;
          const isExpanded = expandedCards.has(s.id);

          return (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Card Header - clickable */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => toggleCard(s.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {p?.nama.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{getFullName(s.pegawaiId)}</p>
                    <p className="text-xs text-gray-500">{p?.jabatan} · {p?.unitKerja}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className="text-sm font-medium text-gray-600">Sem. {s.semester} — {s.tahun}</span>
                  {s.nilaiAkhir && <span className="text-lg font-bold text-gray-800">{s.nilaiAkhir}</span>}
                  {s.predikat && predikatCfg && (
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${predikatCfg.bg} ${predikatCfg.color}`}>{s.predikat}</span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full ${statusConfig[s.status]}`}>{s.status}</span>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setSelectedSKP(s); setShowDetailModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Detail"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                    {s.status === 'Aktif' && (
                      <button onClick={() => openRealisasi(s)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Input Realisasi">
                        <Save className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setShowDeleteConfirm(s.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
                </div>
              </div>

              {/* Expandable Detail */}
              {isExpanded && (
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100">
                          <th className="text-left pb-2 pr-4">Uraian Kegiatan</th>
                          <th className="text-center pb-2 px-2">Target</th>
                          <th className="text-center pb-2 px-2">Realisasi</th>
                          <th className="text-center pb-2 px-2">Bobot</th>
                          <th className="text-center pb-2 px-2">Capaian</th>
                          <th className="text-left pb-2">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.targetKinerja.map(t => {
                          const capai = t.realisasi != null && t.target > 0 ? Math.min(Math.round((t.realisasi / t.target) * 100), 130) : 0;
                          return (
                            <tr key={t.id} className="border-b border-gray-50 last:border-0">
                              <td className="py-2.5 pr-4 text-gray-700">{t.uraianKegiatan}</td>
                              <td className="py-2.5 text-center text-gray-600">{t.target.toLocaleString()} {t.satuan}</td>
                              <td className="py-2.5 text-center font-medium text-gray-700">{t.realisasi != null ? t.realisasi.toLocaleString() : '—'}</td>
                              <td className="py-2.5 text-center text-gray-600">{t.bobot}%</td>
                              <td className="py-2.5 text-center">
                                {t.nilaiCapaian != null ? (
                                  <span className={`font-medium ${t.nilaiCapaian >= 100 ? 'text-green-600' : t.nilaiCapaian >= 90 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                    {t.nilaiCapaian.toFixed(1)}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="py-2.5 pl-4">
                                <div className="flex items-center gap-2 min-w-28">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${capai >= 100 ? 'bg-green-500' : capai >= 70 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(capai, 100)}%` }} />
                                  </div>
                                  <span className="text-gray-500 w-8">{capai}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {s.nilaiAkhir && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Nilai Akhir SKP</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-800">{s.nilaiAkhir}</span>
                        {s.predikat && predikatCfg && (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${predikatCfg.bg} ${predikatCfg.color}`}>{s.predikat}</span>
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

      {/* ─── Form Modal Buat/Edit SKP ─── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFormModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-800">{editData ? 'Edit SKP' : 'Buat SKP Baru'}</h2>
              <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                  <select value={formPegawaiId} onChange={e => setFormPegawaiId(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih Pegawai</option>
                    {pegawai.map(p => <option key={p.id} value={p.id}>{p.gelarDepan || ''} {p.nama} — {p.jabatan}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tahun *</label>
                  <select value={formTahun} onChange={e => setFormTahun(Number(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Semester *</label>
                  <select value={formSemester} onChange={e => setFormSemester(Number(e.target.value) as 1 | 2)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={1}>Semester 1 (Jan–Jun)</option>
                    <option value={2}>Semester 2 (Jul–Des)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Draft">Draft</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              {/* Target Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Rencana Hasil Kerja / Target Kinerja
                    <span className={`ml-2 text-xs ${totalBobot === 100 ? 'text-green-600' : 'text-red-500'}`}>
                      (Total Bobot: {totalBobot}% / 100%)
                    </span>
                  </label>
                  <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>
                <div className="space-y-3">
                  {formItems.map((item, idx) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-600">Kegiatan #{idx + 1}</p>
                        {formItems.length > 1 && (
                          <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Uraian Kegiatan *</label>
                          <input type="text" value={item.uraianKegiatan} onChange={e => updateItem(item.id, 'uraianKegiatan', e.target.value)}
                            placeholder="Contoh: Melakukan pelayanan medis rawat jalan"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Target</label>
                            <input type="number" value={item.target || ''} onChange={e => updateItem(item.id, 'target', e.target.value)}
                              placeholder="1200"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Satuan</label>
                            <input type="text" value={item.satuan} onChange={e => updateItem(item.id, 'satuan', e.target.value)}
                              placeholder="pasien / dokumen"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Bobot (%)</label>
                            <input type="number" value={item.bobot || ''} onChange={e => updateItem(item.id, 'bobot', e.target.value)}
                              placeholder="25" min={0} max={100}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-800">
                  <strong>Catatan:</strong> SKP ditetapkan di awal periode dan ditandatangani oleh pegawai dan pejabat penilai kinerja. Total bobot harus = 100%.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowFormModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editData ? 'Perbarui SKP' : 'Simpan SKP'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Input Realisasi ─── */}
      {showRealisasiModal && selectedSKP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRealisasiModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">Input Realisasi Kinerja</h2>
              <button onClick={() => setShowRealisasiModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">{getFullName(selectedSKP.pegawaiId)}</p>
                <p className="text-xs text-blue-600">SKP Semester {selectedSKP.semester} Tahun {selectedSKP.tahun}</p>
              </div>
              <div className="space-y-4">
                {selectedSKP.targetKinerja.map(t => {
                  const real = realisasiValues[t.id] ?? t.realisasi ?? 0;
                  const capai = t.target > 0 ? Math.min(130, Math.round((real / t.target) * 100)) : 0;
                  return (
                    <div key={t.id} className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-3">{t.uraianKegiatan}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Target: {t.target.toLocaleString()} {t.satuan}</label>
                          <input type="number" value={real || ''} onChange={e => setRealisasiValues(prev => ({ ...prev, [t.id]: Number(e.target.value) }))}
                            placeholder="Input realisasi"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Bobot: {t.bobot}%</label>
                          <div className={`h-9 flex items-center px-3 rounded-lg ${capai >= 100 ? 'bg-green-50 text-green-700' : capai >= 70 ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            <span className="text-sm font-semibold">Capaian: {capai}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowRealisasiModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveRealisasi} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan & Hitung Nilai</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      {showDetailModal && selectedSKP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail SKP</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">{getPegawai(selectedSKP.pegawaiId)?.nama.charAt(0)}</div>
                <div>
                  <p className="font-semibold text-gray-800">{getFullName(selectedSKP.pegawaiId)}</p>
                  <p className="text-xs text-gray-500">Semester {selectedSKP.semester} — {selectedSKP.tahun}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400">Status</p><p className={`text-xs px-2 py-1 rounded-full mt-1 ${statusConfig[selectedSKP.status]}`}>{selectedSKP.status}</p></div>
                <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400">Nilai Akhir</p><p className="text-xl font-bold text-gray-800 mt-1">{selectedSKP.nilaiAkhir || '—'}</p></div>
                <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400">Predikat</p>
                  {selectedSKP.predikat && predikatConfig[selectedSKP.predikat] ? (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block ${predikatConfig[selectedSKP.predikat].bg} ${predikatConfig[selectedSKP.predikat].color}`}>{selectedSKP.predikat}</span>
                  ) : <p className="text-sm text-gray-400 mt-1">—</p>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Target Kinerja ({selectedSKP.targetKinerja.length} kegiatan)</p>
                <div className="space-y-2">
                  {selectedSKP.targetKinerja.map((t, i) => (
                    <div key={t.id} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-xs font-semibold text-gray-400 w-5 flex-shrink-0 mt-0.5">#{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{t.uraianKegiatan}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Target: {t.target} {t.satuan} · Bobot: {t.bobot}%{t.realisasi != null ? ` · Realisasi: ${t.realisasi}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowDetailModal(false); openEdit(selectedSKP); }} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"><Edit2 className="w-4 h-4" /> Edit</button>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Hapus Data SKP?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Data SKP ini akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
