import React, { useState, useMemo } from 'react';
import { DollarSign, Search, Plus, Eye, X, Printer, CheckCircle, Clock, CreditCard, TrendingUp, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { SlipGaji } from '../types';
import { toast } from 'sonner';
import { GAJI_POKOK, TUNJANGAN_FUNGSIONAL, TUNJANGAN_STRUKTURAL } from '../data/mockDataRS';

const BULAN_NAMES = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const statusConfig = {
  'Draft': { bg: 'bg-gray-100', color: 'text-gray-600', icon: Clock },
  'Disetujui': { bg: 'bg-blue-50', color: 'text-blue-700', icon: CheckCircle },
  'Dibayar': { bg: 'bg-green-50', color: 'text-green-700', icon: CreditCard },
};
const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function Penggajian() {
  const { slipGaji, pegawai, addSlipGaji, updateSlipGaji, deleteSlipGaji } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterBulan, setFilterBulan] = useState<string>('3');
  const [filterTahun, setFilterTahun] = useState<string>('2026');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailSlip, setDetailSlip] = useState<SlipGaji | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genForm, setGenForm] = useState({ bulan: 3, tahun: 2026 });

  const getFullName = (id: string) => { const p = pegawai.find(x => x.id === id); if (!p) return '—'; return `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`; };
  const getPegawai = (id: string) => pegawai.find(x => x.id === id);

  const filtered = useMemo(() => slipGaji.filter(s => {
    const nm = getFullName(s.pegawaiId).toLowerCase();
    const ok = !search || nm.includes(search.toLowerCase());
    const okB = !filterBulan || String(s.bulan) === filterBulan;
    const okT = !filterTahun || String(s.tahun) === filterTahun;
    const okS = !filterStatus || s.status === filterStatus;
    return ok && okB && okT && okS;
  }), [slipGaji, search, filterBulan, filterTahun, filterStatus, pegawai]);

  const totalNetto = filtered.reduce((a, s) => a + s.totalNetto, 0);
  const totalBruto = filtered.reduce((a, s) => a + s.totalBruto, 0);

  const handleApprove = (slip: SlipGaji) => {
    if (slip.status === 'Draft') {
      updateSlipGaji({ ...slip, status: 'Disetujui' });
      toast.success('Slip gaji disetujui');
    } else if (slip.status === 'Disetujui') {
      updateSlipGaji({ ...slip, status: 'Dibayar', tanggalDibayar: new Date().toISOString().split('T')[0] });
      toast.success('Gaji berhasil ditandai sebagai dibayar');
    }
  };

  const generateSlipAll = () => {
    const existingIds = new Set(slipGaji.filter(s => s.bulan === genForm.bulan && s.tahun === genForm.tahun).map(s => s.pegawaiId));
    let count = 0;
    pegawai.filter(p => !existingIds.has(p.id) && p.statusAktif === 'Aktif').forEach(p => {
      const gp = GAJI_POKOK[p.golongan] || 2500000;
      const tf = TUNJANGAN_FUNGSIONAL[p.jabatanFungsional] || 300000;
      const tj = p.eselon && p.eselon !== '-' && p.eselon !== 'Non-Eselon' ? (TUNJANGAN_STRUKTURAL[p.eselon] || 0) : 0;
      const kawin = p.statusPerkawinan === 'Kawin';
      const tistri = kawin ? Math.round(gp * 0.10) : 0;
      const tanak = Math.round(gp * 0.02); // asumsi 1 anak
      const tberas = 80000 * (1 + (kawin ? 1 : 0) + 1);
      const tukin = Math.round(gp * 0.45);
      const bruto = gp + tj + tf + tberas + tanak + tistri + tukin;
      const potBPJSKes = Math.round(gp * 0.01);
      const potBPJSTK = Math.round(gp * 0.02);
      const potTaspen = Math.round(gp * 0.0475);
      const potPph = Math.round(bruto * 0.025);
      const totalPot = potBPJSKes + potBPJSTK + potTaspen + potPph;
      addSlipGaji({ pegawaiId: p.id, bulan: genForm.bulan, tahun: genForm.tahun, gajiPokok: gp, tunjanganJabatan: tj, tunjanganFungsional: tf, tunjanganBeras: tberas, tunjanganAnak: tanak, tunjanganIstri: tistri, tunjanganKinerja: tukin, tambahanLain: [], potonganBPJSKes: potBPJSKes, potonganBPJSTK: potBPJSTK, potonganPPh21: potPph, potonganTaspen: potTaspen, potonganLain: [], totalBruto: bruto, totalPotongan: totalPot, totalNetto: bruto - totalPot, status: 'Draft' } as any);
      count++;
    });
    toast.success(`${count} slip gaji berhasil digenerate untuk ${BULAN_NAMES[genForm.bulan]} ${genForm.tahun}`);
    setShowGenerateModal(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Penggajian & Tunjangan</h1>
          <p className="text-sm text-gray-500 mt-0.5">PP No. 15/2019 (Gaji PNS) · PP No. 49/2018 (Gaji PPPK) · Peraturan Tukin</p>
        </div>
        <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Generate Slip Gaji
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bruto (Filter)', value: `Rp ${(totalBruto / 1e6).toFixed(1)}jt`, sub: `${filtered.length} pegawai`, color: 'text-blue-600' },
          { label: 'Total Netto (Filter)', value: `Rp ${(totalNetto / 1e6).toFixed(1)}jt`, sub: 'Setelah potongan', color: 'text-green-600' },
          { label: 'Slip Belum Dibayar', value: slipGaji.filter(s => s.status !== 'Dibayar').length, sub: 'Draft & Disetujui', color: 'text-yellow-600' },
          { label: 'Slip Telah Dibayar', value: slipGaji.filter(s => s.status === 'Dibayar').length, sub: 'Bulan ini', color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama pegawai..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Bulan</option>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{BULAN_NAMES[i + 1]}</option>)}
          </select>
          <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            {['Draft', 'Disetujui', 'Dibayar'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Periode</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Gaji Pokok</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tunjangan</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Potongan</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Gaji Bersih</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? <tr><td colSpan={8} className="py-10 text-center text-gray-400">Tidak ada data slip gaji</td></tr>
                : filtered.map(s => {
                  const sc = statusConfig[s.status];
                  const Icon = sc.icon;
                  const tunjTotal = s.tunjanganJabatan + s.tunjanganFungsional + s.tunjanganBeras + s.tunjanganAnak + s.tunjanganIstri + s.tunjanganKinerja;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailSlip(s)}>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-sm text-gray-800">{getFullName(s.pegawaiId)}</p>
                        <p className="text-xs text-gray-400">{getPegawai(s.pegawaiId)?.golongan} · {getPegawai(s.pegawaiId)?.unitKerja}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">{BULAN_NAMES[s.bulan]} {s.tahun}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-right text-xs text-gray-700">Rp {fmt(s.gajiPokok)}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-right text-xs text-green-700">+Rp {fmt(tunjTotal)}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-right text-xs text-red-600">-Rp {fmt(s.totalPotongan)}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-800 text-sm">Rp {fmt(s.totalNetto)}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}><Icon className="w-3 h-3" />{s.status}</span></td>
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailSlip(s)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                          {s.status !== 'Dibayar' && <button onClick={() => handleApprove(s)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"><CheckCircle className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot><tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">TOTAL ({filtered.length} pegawai)</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">Rp {fmt(totalNetto)}</td>
                <td colSpan={2}></td>
              </tr></tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Slip Detail Modal */}
      {detailSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailSlip(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-800">Slip Gaji — {BULAN_NAMES[detailSlip.bulan]} {detailSlip.tahun}</p>
                <p className="text-xs text-gray-400">{getFullName(detailSlip.pegawaiId)}</p>
              </div>
              <button onClick={() => setDetailSlip(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium">RSUD ABDUL MOELOEK</p>
                <p className="font-semibold text-gray-800 mt-1">{getFullName(detailSlip.pegawaiId)}</p>
                <p className="text-xs text-gray-500">{getPegawai(detailSlip.pegawaiId)?.jabatan} · {getPegawai(detailSlip.pegawaiId)?.golongan}</p>
                <p className="text-xs text-gray-500">{getPegawai(detailSlip.pegawaiId)?.nip}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500">PENGHASILAN</p>
                {[
                  ['Gaji Pokok', detailSlip.gajiPokok],
                  ['Tunjangan Jabatan Struktural', detailSlip.tunjanganJabatan],
                  ['Tunjangan Fungsional', detailSlip.tunjanganFungsional],
                  ['Tunjangan Istri/Suami', detailSlip.tunjanganIstri],
                  ['Tunjangan Anak', detailSlip.tunjanganAnak],
                  ['Tunjangan Beras', detailSlip.tunjanganBeras],
                  ['Tunjangan Kinerja (Tukin)', detailSlip.tunjanganKinerja],
                  ...(detailSlip.tambahanLain || []).map((t: any) => [t.nama, t.jumlah]),
                ].filter(([, v]) => (v as number) > 0).map(([label, val], i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{label as string}</span>
                    <span className="text-gray-800">Rp {fmt(val as number)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2">
                  <span className="text-gray-700">Total Bruto</span>
                  <span className="text-gray-900">Rp {fmt(detailSlip.totalBruto)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500">POTONGAN</p>
                {[
                  ['Iuran Taspen (4,75%)', detailSlip.potonganTaspen],
                  ['BPJS Kesehatan (1%)', detailSlip.potonganBPJSKes],
                  ['BPJS Ketenagakerjaan JHT (2%)', detailSlip.potonganBPJSTK],
                  ['PPh Pasal 21', detailSlip.potonganPPh21],
                  ...(detailSlip.potonganLain || []).map((p: any) => [p.nama, p.jumlah]),
                ].filter(([, v]) => (v as number) > 0).map(([label, val], i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{label as string}</span>
                    <span className="text-red-600">-Rp {fmt(val as number)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2">
                  <span className="text-gray-700">Total Potongan</span>
                  <span className="text-red-600">-Rp {fmt(detailSlip.totalPotongan)}</span>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">GAJI BERSIH (NETTO)</span>
                  <span className="text-xl font-bold text-green-700">Rp {fmt(detailSlip.totalNetto)}</span>
                </div>
                {detailSlip.tanggalDibayar && <p className="text-xs text-gray-500 mt-1">Dibayarkan: {new Date(detailSlip.tanggalDibayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusConfig[detailSlip.status].bg} ${statusConfig[detailSlip.status].color}`}>{detailSlip.status}</span>
                {detailSlip.status !== 'Dibayar' && (
                  <button onClick={() => { handleApprove(detailSlip); setDetailSlip({ ...detailSlip, status: detailSlip.status === 'Draft' ? 'Disetujui' : 'Dibayar' }); }} className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    {detailSlip.status === 'Draft' ? 'Setujui' : 'Tandai Dibayar'}
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end"><button onClick={() => setDetailSlip(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg">Tutup</button></div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowGenerateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Generate Slip Gaji</h2>
            <p className="text-sm text-gray-500 mb-4">Buat slip gaji untuk seluruh pegawai aktif pada periode yang dipilih.</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Bulan</label>
                <select value={genForm.bulan} onChange={e => setGenForm(f => ({ ...f, bulan: parseInt(e.target.value) }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{BULAN_NAMES[i + 1]}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-700 block mb-1.5">Tahun</label>
                <select value={genForm.tahun} onChange={e => setGenForm(f => ({ ...f, tahun: parseInt(e.target.value) }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg mb-4">
              <p className="text-xs text-blue-700">Akan digenerate untuk pegawai yang belum memiliki slip gaji di periode ini. Basis gaji menggunakan PP No. 15/2019.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Batal</button>
              <button onClick={generateSlipAll} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
