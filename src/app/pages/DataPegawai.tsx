import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, Filter, Eye, Edit2, Trash2, Download, Upload, Users, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Pegawai } from '../types';
import { UNIT_KERJA } from '../data/constants';
import { toast } from 'sonner';
import { EmployeeAvatar } from '../components/EmployeeAvatar';
import EditPegawaiModal from '../components/EditPegawaiModal';

const ITEMS_PER_PAGE = 10;

const golonganList = ['I/a','I/b','I/c','I/d','II/a','II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e'];

const EMPTY_FORM: Omit<Pegawai, 'id'> = {
  nip: '', nama: '', gelarDepan: '', gelarBelakang: '', jenisKelamin: 'L',
  tempatLahir: '', tanggalLahir: '', agama: 'Islam', statusPerkawinan: 'Belum Kawin',
  alamat: '', noTelp: '', email: '', jabatan: '', jabatanFungsional: '',
  unitKerja: '', golongan: 'III/a', pangkat: 'Penata Muda', tmtGolongan: '',
  tmtJabatan: '', statusPegawai: 'PNS', statusAktif: 'Aktif',
  pendidikanTerakhir: 'S1', jurusan: '', institusi: '', tahunLulus: 2020,
  tanggalMasuk: '', batasPensiun: '', masaKerja: '',
  foto: '',
};

export default function DataPegawai() {
  const navigate = useNavigate();
  const { pegawai: dataPegawai, addPegawai, updatePegawai, deletePegawai } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterGolongan, setFilterGolongan] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editData, setEditData] = useState<Pegawai | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return dataPegawai.filter(p => {
      const fullName = `${p.gelarDepan || ''} ${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`.toLowerCase();
      const matchSearch = !search || fullName.includes(search.toLowerCase()) || p.nip.includes(search) || p.jabatan.toLowerCase().includes(search.toLowerCase());
      const matchUnit = !filterUnit || p.unitKerja === filterUnit;
      const matchStatus = !filterStatus || p.statusAktif === filterStatus;
      const matchJenis = !filterJenis || p.statusPegawai === filterJenis;
      const matchGolongan = !filterGolongan || p.golongan.startsWith(filterGolongan);
      return matchSearch && matchUnit && matchStatus && matchJenis && matchGolongan;
    });
  }, [dataPegawai, search, filterUnit, filterStatus, filterJenis, filterGolongan]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetFilters = () => {
    setFilterUnit(''); setFilterStatus(''); setFilterJenis(''); setFilterGolongan(''); setSearch(''); setCurrentPage(1);
  };
  const activeFilterCount = [filterUnit, filterStatus, filterJenis, filterGolongan].filter(Boolean).length;
  const getInitial = (nama: string) => nama.charAt(0).toUpperCase();
  const getFullName = (p: Pegawai) => `${p.gelarDepan || ''} ${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`.trim();

  const golonganColor: Record<string, string> = {
    'I': 'text-gray-600 bg-gray-100', 'II': 'text-yellow-700 bg-yellow-100',
    'III': 'text-blue-700 bg-blue-100', 'IV': 'text-purple-700 bg-purple-100',
  };
  const getGolonganColor = (g: string) => golonganColor[g.charAt(0)] || 'text-gray-600 bg-gray-100';

  const totalPNS = dataPegawai.filter(p => p.statusPegawai === 'PNS').length;
  const totalPPPK = dataPegawai.filter(p => p.statusPegawai === 'PPPK').length;
  const totalHonorer = dataPegawai.filter(p => p.statusPegawai === 'Honorer').length;

  // KPI tambahan
  const totalAktif    = dataPegawai.filter(p => p.statusAktif === 'Aktif').length;
  const totalL        = dataPegawai.filter(p => p.jenisKelamin === 'L').length;
  const totalP        = dataPegawai.filter(p => p.jenisKelamin === 'P').length;
  const today         = new Date('2026-03-07');
  const twoYearsLater = new Date('2028-03-07');
  const akanPensiun   = dataPegawai.filter(p => {
    if (!p.batasPensiun) return false;
    const d = new Date(p.batasPensiun);
    return d >= today && d <= twoYearsLater;
  }).length;
  const golIV         = dataPegawai.filter(p => p.golongan.startsWith('IV')).length;
  const golIII        = dataPegawai.filter(p => p.golongan.startsWith('III')).length;
  const golII         = dataPegawai.filter(p => p.golongan.startsWith('II')).length;
  const golI          = dataPegawai.filter(p => p.golongan.startsWith('I') && !p.golongan.startsWith('IV')).length;
  const totalS2S3     = dataPegawai.filter(p => ['S2','S3','Spesialis'].includes(p.pendidikanTerakhir)).length;
  const totalS1Prof   = dataPegawai.filter(p => ['S1','Profesi','D4'].includes(p.pendidikanTerakhir)).length;

  const pct = (n: number, total: number) => total === 0 ? 0 : Math.round((n / total) * 100);

  const openAdd = () => {
    setEditData(null);
    setShowModal(true);
  };

  const openEdit = (p: Pegawai) => {
    setEditData(p);
    setShowModal(true);
  };

  const handleSave = (data: Omit<Pegawai, 'id'> & { id?: string }) => {
    if (data.id) {
      updatePegawai(data as Pegawai);
      toast.success(`Data ${data.nama} berhasil diperbarui`);
    } else {
      addPegawai(data);
      toast.success(`Pegawai ${data.nama} berhasil ditambahkan`);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deletePegawai(id);
    setShowDeleteConfirm(null);
    toast.success('Data pegawai berhasil dihapus');
  };

  const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "text-xs font-medium text-gray-700 mb-1 block";

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-gray-800">Data Pegawai</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pengelolaan data ASN RSUD Abdul Moeloek</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Tambah Pegawai
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="space-y-3 mb-5">
        {/* Row 1 — Utama */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Pegawai */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Total</span>
            </div>
            <p className="text-3xl font-bold leading-none mb-1">{dataPegawai.length}</p>
            <p className="text-blue-100 text-xs mb-3">Seluruh Pegawai</p>
            <div className="flex items-center gap-3 pt-2 border-t border-white/20">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-200" />
                <span className="text-xs text-blue-100">L: <strong className="text-white">{totalL}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-pink-300" />
                <span className="text-xs text-blue-100">P: <strong className="text-white">{totalP}</strong></span>
              </div>
              <div className="ml-auto text-xs text-blue-100">
                Aktif: <strong className="text-white">{totalAktif}</strong>
              </div>
            </div>
          </div>

          {/* PNS */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <span className="text-xs font-extrabold text-blue-600">PNS</span>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {pct(totalPNS, dataPegawai.length)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800 leading-none mb-0.5">{totalPNS}</p>
            <p className="text-xs text-gray-400 mb-3">Pegawai Negeri Sipil</p>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct(totalPNS, dataPegawai.length)}%` }} />
            </div>
          </div>

          {/* PPPK */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <span className="text-xs font-extrabold text-purple-600">P3K</span>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {pct(totalPPPK, dataPegawai.length)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800 leading-none mb-0.5">{totalPPPK}</p>
            <p className="text-xs text-gray-400 mb-3">Pegawai Pemerintah</p>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${pct(totalPPPK, dataPegawai.length)}%` }} />
            </div>
          </div>

          {/* Honorer */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <span className="text-xs font-extrabold text-orange-600">HON</span>
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {pct(totalHonorer, dataPegawai.length)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800 leading-none mb-0.5">{totalHonorer}</p>
            <p className="text-xs text-gray-400 mb-3">Tenaga Honorer</p>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-orange-400 h-1.5 rounded-full transition-all" style={{ width: `${pct(totalHonorer, dataPegawai.length)}%` }} />
            </div>
          </div>
        </div>

        {/* Row 2 — Sekunder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Akan Pensiun */}
          <div className={`rounded-xl border shadow-sm p-4 ${akanPensiun > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${akanPensiun > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                <svg className={`w-4 h-4 ${akanPensiun > 0 ? 'text-amber-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {akanPensiun > 0 && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Perhatian</span>
              )}
            </div>
            <p className={`text-xl font-bold leading-none mb-0.5 ${akanPensiun > 0 ? 'text-amber-700' : 'text-gray-800'}`}>{akanPensiun}</p>
            <p className={`text-xs ${akanPensiun > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Pensiun ≤2 Tahun</p>
          </div>

          {/* Distribusi Golongan */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Distribusi Gol.</p>
            <div className="space-y-1.5">
              {[
                { label: 'Gol. IV', val: golIV, color: 'bg-purple-500' },
                { label: 'Gol. III', val: golIII, color: 'bg-blue-500' },
                { label: 'Gol. II', val: golII, color: 'bg-teal-500' },
                { label: 'Gol. I', val: golI, color: 'bg-gray-400' },
              ].map(g => (
                <div key={g.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-12 flex-shrink-0">{g.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`${g.color} h-1.5 rounded-full`} style={{ width: `${pct(g.val, dataPegawai.length)}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 w-4 text-right">{g.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pendidikan */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Pendidikan</p>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">S2 / S3 / Spesialis</span>
                  <span className="text-xs font-semibold text-indigo-600">{totalS2S3}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct(totalS2S3, dataPegawai.length)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">S1 / Profesi / D4</span>
                  <span className="text-xs font-semibold text-blue-600">{totalS1Prof}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${pct(totalS1Prof, dataPegawai.length)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">D3 / SMA</span>
                  <span className="text-xs font-semibold text-gray-600">{dataPegawai.length - totalS2S3 - totalS1Prof}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: `${pct(dataPegawai.length - totalS2S3 - totalS1Prof, dataPegawai.length)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Gender Ratio */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Jenis Kelamin</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-3 rounded-full overflow-hidden bg-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  style={{ width: `${pct(totalL, dataPegawai.length)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-xs text-gray-500">Laki-laki</span>
                <span className="text-xs font-bold text-gray-800 ml-1">{totalL}</span>
                <span className="text-[10px] text-gray-400">({pct(totalL, dataPegawai.length)}%)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-pink-400" />
              <span className="text-xs text-gray-500">Perempuan</span>
              <span className="text-xs font-bold text-gray-800 ml-1">{totalP}</span>
              <span className="text-[10px] text-gray-400">({pct(totalP, dataPegawai.length)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari nama, NIP, atau jabatan..." value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${activeFilterCount > 0 ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter className="w-4 h-4" /> Filter
            {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-white text-blue-600 text-xs font-bold flex items-center justify-center">{activeFilterCount}</span>}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
          </button>
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors">
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
        {showFilter && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: 'Status Pegawai', val: filterJenis, set: setFilterJenis, opts: [['PNS','PNS'],['PPPK','PPPK'],['Honorer','Honorer']] },
              { label: 'Status Aktif', val: filterStatus, set: setFilterStatus, opts: [['Aktif','Aktif'],['Pensiun','Pensiun'],['Diberhentikan','Diberhentikan']] },
              { label: 'Golongan', val: filterGolongan, set: setFilterGolongan, opts: [['I','Gol. I'],['II','Gol. II'],['III','Gol. III'],['IV','Gol. IV']] },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                <select value={f.val} onChange={e => { f.set(e.target.value); setCurrentPage(1); }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Semua</option>
                  {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Unit Kerja</label>
              <select value={filterUnit} onChange={e => { setFilterUnit(e.target.value); setCurrentPage(1); }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Unit</option>
                {UNIT_KERJA.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Menampilkan <span className="font-semibold text-gray-800">{paginatedData.length}</span> dari <span className="font-semibold text-gray-800">{filtered.length}</span> pegawai{activeFilterCount > 0 && ' (terfilter)'}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">NIP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Jabatan / Unit</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gol.</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Jenis</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedData.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Tidak ada pegawai yang sesuai filter</p>
                </td></tr>
              ) : paginatedData.map(p => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => navigate(`/pegawai/${p.id}`)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar id={p.id} nama={p.nama} foto={p.foto} size="md" />
                      <div>
                        <p className="font-medium text-gray-800 text-sm leading-tight">{getFullName(p)}</p>
                        <p className="text-xs text-gray-400 mt-0.5 md:hidden">{p.nip}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell"><p className="text-xs text-gray-500 font-mono">{p.nip}</p></td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <p className="text-sm text-gray-700 leading-tight">{p.jabatan}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.unitKerja}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${getGolonganColor(p.golongan)}`}>{p.golongan}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.statusPegawai === 'PNS' ? 'bg-blue-100 text-blue-700' : p.statusPegawai === 'PPPK' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{p.statusPegawai}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.statusAktif === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{p.statusAktif}</span>
                  </td>
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => navigate(`/pegawai/${p.id}`)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Detail"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setShowDeleteConfirm(p.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Halaman {currentPage} dari {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page < 1 || page > totalPages) return null;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Add/Edit Pegawai Modal ─── */}
      <EditPegawaiModal
        open={showModal}
        editData={editData}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
            <h3 className="text-center font-semibold text-gray-800 mb-2">Hapus Data Pegawai?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Data pegawai ini akan dihapus secara permanen beserta semua riwayatnya.</p>
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