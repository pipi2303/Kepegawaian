import React, { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';
import {
  Users, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronRight,
  User, Building2, Info, X, Search, Maximize2, Minimize2,
  Briefcase, Award, AlertCircle, Plus, GitBranch,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Pegawai } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────
interface OrgNode {
  id: string;
  title: string;
  subtitle?: string;
  type: 'hospital' | 'eselon2' | 'eselon3' | 'eselon4' | 'unit';
  pegawaiId?: string;
  unitKerja?: string;
  eselon?: string;
  isVacant?: boolean;
  children?: OrgNode[];
}

// ─── Tree helpers ─────────────────────────────────────────────────────────────
function addNodeToTree(tree: OrgNode, parentId: string, newNode: OrgNode): OrgNode {
  if (tree.id === parentId) {
    return { ...tree, children: [...(tree.children || []), newNode] };
  }
  return {
    ...tree,
    children: (tree.children || []).map(c => addNodeToTree(c, parentId, newNode)),
  };
}

function getAllNodes(tree: OrgNode): OrgNode[] {
  return [tree, ...(tree.children || []).flatMap(c => getAllNodes(c))];
}

// ─── Org Structure ──────────────────────────────────────────────────────────
const ORG_DATA: OrgNode = {
  id: 'rsud',
  title: 'RSUD Abdul Moeloek',
  subtitle: 'Rumah Sakit Umum Daerah Provinsi Lampung',
  type: 'hospital',
  children: [
    {
      id: 'direktur',
      title: 'Direktur',
      subtitle: 'Eselon II/b',
      type: 'eselon2',
      pegawaiId: 'P016',
      eselon: 'Eselon II/b',
      children: [
        {
          id: 'bid-pelmed',
          title: 'Bidang Pelayanan Medis',
          subtitle: 'Eselon III/a',
          type: 'eselon3',
          eselon: 'Eselon III/a',
          isVacant: true,
          unitKerja: 'Bidang Pelayanan Medis',
          children: [
            { id: 'igd', title: 'Inst. Gawat Darurat', type: 'unit', unitKerja: 'Instalasi Gawat Darurat (IGD)' },
            { id: 'rawat-inap', title: 'Inst. Rawat Inap', type: 'unit', unitKerja: 'Instalasi Rawat Inap' },
            { id: 'rawat-jalan', title: 'Inst. Rawat Jalan', type: 'unit', unitKerja: 'Instalasi Rawat Jalan' },
            { id: 'ibs', title: 'Inst. Bedah Sentral', type: 'unit', unitKerja: 'Instalasi Bedah Sentral (IBS)' },
            { id: 'icu', title: 'Inst. ICU / ICCU', type: 'unit', unitKerja: 'Instalasi ICU/ICCU' },
            { id: 'kebidanan', title: 'Inst. Kebidanan & Kand.', type: 'unit', unitKerja: 'Instalasi Kebidanan & Kandungan' },
            { id: 'rehab', title: 'Inst. Rehabilitasi Medis', type: 'unit', unitKerja: 'Instalasi Rehabilitasi Medis' },
          ],
        },
        {
          id: 'bid-kep',
          title: 'Bidang Keperawatan',
          subtitle: 'Eselon III/a',
          type: 'eselon3',
          pegawaiId: 'P017',
          eselon: 'Eselon III/a',
          unitKerja: 'Bidang Keperawatan',
          children: [
            { id: 'kep-igd', title: 'Kep. IGD', type: 'unit', unitKerja: 'Instalasi Gawat Darurat (IGD)' },
            { id: 'kep-rawat-inap', title: 'Kep. Rawat Inap', type: 'unit', unitKerja: 'Instalasi Rawat Inap' },
            { id: 'kep-icu', title: 'Kep. ICU/ICCU', type: 'unit', unitKerja: 'Instalasi ICU/ICCU' },
            { id: 'kep-keb', title: 'Kep. Kebidanan', type: 'unit', unitKerja: 'Instalasi Kebidanan & Kandungan' },
          ],
        },
        {
          id: 'bid-penunjang',
          title: 'Bidang Penunjang Medis',
          subtitle: 'Eselon III/a',
          type: 'eselon3',
          eselon: 'Eselon III/a',
          isVacant: true,
          unitKerja: 'Bidang Penunjang Medis',
          children: [
            { id: 'farmasi', title: 'Inst. Farmasi', type: 'unit', unitKerja: 'Instalasi Farmasi' },
            { id: 'lab', title: 'Inst. Laboratorium', type: 'unit', unitKerja: 'Instalasi Laboratorium' },
            { id: 'radiologi', title: 'Inst. Radiologi', type: 'unit', unitKerja: 'Instalasi Radiologi' },
            { id: 'gizi', title: 'Inst. Gizi', type: 'unit', unitKerja: 'Instalasi Gizi' },
            { id: 'rekam-medis', title: 'Inst. Rekam Medis', type: 'unit', unitKerja: 'Instalasi Rekam Medis' },
            { id: 'ipsrs', title: 'IPSRS', type: 'unit', unitKerja: 'IPSRS' },
            { id: 'cssd', title: 'Inst. CSSD', type: 'unit', unitKerja: 'Instalasi CSSD' },
          ],
        },
        {
          id: 'bag-tu',
          title: 'Bagian Tata Usaha',
          subtitle: 'Eselon III/b',
          type: 'eselon3',
          pegawaiId: 'P019',
          eselon: 'Eselon III/b',
          unitKerja: 'Bagian Tata Usaha',
          children: [
            {
              id: 'subbag-kepeg',
              title: 'Subbag Kepegawaian & Umum',
              subtitle: 'Eselon IV/a',
              type: 'eselon4',
              pegawaiId: 'P007',
              eselon: 'Eselon IV/a',
              unitKerja: 'Sub Bagian Kepegawaian & Umum',
            },
            {
              id: 'subbag-keu',
              title: 'Subbag Keuangan',
              subtitle: 'Eselon IV/a',
              type: 'eselon4',
              eselon: 'Eselon IV/a',
              isVacant: true,
              unitKerja: 'Sub Bagian Keuangan',
            },
          ],
        },
      ],
    },
  ],
};

// ─── Node Style Map ──────────────────────────────────────────────────────────
const NODE_STYLES: Record<string, { wrapper: string; title: string; sub: string; badge: string; connector: string }> = {
  hospital: {
    wrapper: 'bg-[#1e3a5f] border-[#0f2744] shadow-blue-900/40',
    title: 'text-white',
    sub: 'text-blue-200',
    badge: 'bg-blue-500/30 text-blue-200',
    connector: '#3b82f6',
  },
  eselon2: {
    wrapper: 'bg-blue-700 border-blue-800 shadow-blue-800/30',
    title: 'text-white',
    sub: 'text-blue-100',
    badge: 'bg-yellow-400/20 text-yellow-200',
    connector: '#2563eb',
  },
  eselon3: {
    wrapper: 'bg-sky-600 border-sky-700 shadow-sky-700/30',
    title: 'text-white',
    sub: 'text-sky-100',
    badge: 'bg-white/20 text-white',
    connector: '#0284c7',
  },
  eselon4: {
    wrapper: 'bg-teal-600 border-teal-700 shadow-teal-700/30',
    title: 'text-white',
    sub: 'text-teal-100',
    badge: 'bg-white/20 text-white',
    connector: '#0d9488',
  },
  unit: {
    wrapper: 'bg-white border-gray-200 shadow-gray-200/60',
    title: 'text-gray-800',
    sub: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-600',
    connector: '#94a3b8',
  },
};

const LINE_COLOR: Record<string, string> = {
  hospital: '#3b82f6',
  eselon2: '#2563eb',
  eselon3: '#0284c7',
  eselon4: '#0d9488',
  unit: '#cbd5e1',
};

// ─── Count unit pegawai ──────────────────────────────────────────────────────
function countNodePegawai(node: OrgNode, allPegawai: Pegawai[]): number {
  const direct = node.unitKerja
    ? allPegawai.filter(p => p.unitKerja === node.unitKerja).length
    : node.pegawaiId ? 1 : 0;
  const fromChildren = (node.children || []).reduce((sum, c) => sum + countNodePegawai(c, allPegawai), 0);
  return node.type === 'unit' ? direct : (node.pegawaiId ? Math.max(direct, 1) : 0) + fromChildren;
}

// ─── Drag context (shared between canvas and node cards) ─────────────────────
const DragCtx = createContext<React.MutableRefObject<boolean>>({ current: false });

// ─── Add-child context ────────────────────────────────────────────────────────
const AddCtx = createContext<(parentId: string) => void>(() => {});

// ─── Add Node Modal ───────────────────────────────────────────────────────────
interface AddNodeModalProps {
  allNodes: OrgNode[];
  pegawai: Pegawai[];
  initialParentId: string;
  onClose: () => void;
  onSubmit: (parentId: string, node: OrgNode) => void;
}

const NODE_TYPE_LABELS: Record<OrgNode['type'], string> = {
  hospital: 'Rumah Sakit (Hospital)',
  eselon2: 'Eselon II (Direktur)',
  eselon3: 'Eselon III (Kepala Bidang/Bagian)',
  eselon4: 'Eselon IV (Kepala Sub Bagian)',
  unit: 'Unit / Instalasi',
};

const ESELON_OPTIONS = ['Eselon II/a', 'Eselon II/b', 'Eselon III/a', 'Eselon III/b', 'Eselon IV/a', 'Eselon IV/b'];

function AddNodeModal({ allNodes, pegawai, initialParentId, onClose, onSubmit }: AddNodeModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<OrgNode['type']>('unit');
  const [subtitle, setSubtitle] = useState('');
  const [eselon, setEselon] = useState('');
  const [parentId, setParentId] = useState(initialParentId);
  const [unitKerja, setUnitKerja] = useState('');
  const [pegawaiId, setPegawaiId] = useState('');
  const [isVacant, setIsVacant] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill subtitle based on type
  const handleTypeChange = (t: OrgNode['type']) => {
    setType(t);
    if (t === 'eselon2') { setSubtitle('Eselon II/b'); setEselon('Eselon II/b'); }
    else if (t === 'eselon3') { setSubtitle('Eselon III/a'); setEselon('Eselon III/a'); }
    else if (t === 'eselon4') { setSubtitle('Eselon IV/a'); setEselon('Eselon IV/a'); }
    else { setSubtitle(''); setEselon(''); }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Nama jabatan/unit wajib diisi';
    if (!parentId) e.parentId = 'Node induk wajib dipilih';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const newNode: OrgNode = {
      id: `node-${Date.now()}`,
      title: title.trim(),
      type,
      subtitle: subtitle.trim() || undefined,
      eselon: eselon.trim() || undefined,
      unitKerja: unitKerja.trim() || undefined,
      pegawaiId: pegawaiId || undefined,
      isVacant: isVacant || undefined,
    };
    onSubmit(parentId, newNode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,27,68,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-gray-800 text-sm">Tambah Node Baru</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Tambahkan jabatan atau unit ke struktur organisasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">

            {/* Parent node */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Node Induk <span className="text-red-500">*</span>
              </label>
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className={`w-full text-xs border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.parentId ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">-- Pilih node induk --</option>
                {allNodes.filter(n => n.type !== 'unit').map(n => (
                  <option key={n.id} value={n.id}>{n.title}</option>
                ))}
              </select>
              {errors.parentId && <p className="text-[10px] text-red-500 mt-1">{errors.parentId}</p>}
            </div>

            {/* Tipe node */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Tipe Node <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['eselon2', 'eselon3', 'eselon4', 'unit'] as OrgNode['type'][]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`text-left px-3 py-2 rounded-lg border-2 transition-all ${
                      type === t
                        ? t === 'eselon2' ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : t === 'eselon3' ? 'border-sky-500 bg-sky-50 text-sky-800'
                          : t === 'eselon4' ? 'border-teal-500 bg-teal-50 text-teal-800'
                          : 'border-gray-400 bg-gray-50 text-gray-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <p className="text-[10px] font-semibold truncate">{NODE_TYPE_LABELS[t]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Nama Jabatan / Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Bidang Litbang, Inst. Radiologi..."
                className={`w-full text-xs border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* Subtitle & Eselon (tampil jika bukan unit) */}
            {type !== 'unit' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subtitle</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    placeholder="mis. Eselon III/a"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Eselon</label>
                  <select
                    value={eselon}
                    onChange={e => setEselon(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Pilih --</option>
                    {ESELON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Unit Kerja */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit Kerja (untuk pencocokan data pegawai)</label>
              <input
                type="text"
                value={unitKerja}
                onChange={e => setUnitKerja(e.target.value)}
                placeholder="Nama unit kerja sesuai data kepegawaian..."
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pejabat */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pejabat / Penanggung Jawab</label>
              <select
                value={pegawaiId}
                onChange={e => { setPegawaiId(e.target.value); if (e.target.value) setIsVacant(false); }}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Tidak ada / Lowong --</option>
                {pegawai.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.gelarDepan ? `${p.gelarDepan} ` : ''}{p.nama}{p.gelarBelakang ? `, ${p.gelarBelakang}` : ''} — {p.jabatan}
                  </option>
                ))}
              </select>
            </div>

            {/* Jabatan Lowong */}
            {!pegawaiId && type !== 'unit' && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  id="isVacant"
                  checked={isVacant}
                  onChange={e => setIsVacant(e.target.checked)}
                  className="w-4 h-4 accent-red-500 cursor-pointer"
                />
                <label htmlFor="isVacant" className="text-xs text-red-700 cursor-pointer">
                  Tandai sebagai <strong>Jabatan Lowong</strong> (tampil badge merah)
                </label>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── NodeCard ────────────────────────────────────────────────────────────────
interface NodeCardProps {
  node: OrgNode;
  pegawai: Pegawai[];
  isCollapsed: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

function NodeCard({ node, pegawai, isCollapsed, isSelected, onToggle, onSelect }: NodeCardProps) {
  const isDraggingRef = useContext(DragCtx);
  const style = NODE_STYLES[node.type];
  const pejabat = node.pegawaiId ? pegawai.find(p => p.id === node.pegawaiId) : null;
  const unitStaff = node.unitKerja
    ? pegawai.filter(p => p.unitKerja === node.unitKerja)
    : [];
  const staffCount = node.type === 'unit' ? unitStaff.length : countNodePegawai(node, pegawai);
  const hasChildren = (node.children || []).length > 0;

  return (
    <div
      onClick={() => { if (!isDraggingRef.current) onSelect(); }}
      className={`relative rounded-xl border-2 shadow-lg cursor-pointer transition-all duration-200
        select-none w-[190px] min-h-[80px]
        ${style.wrapper}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-105' : 'hover:scale-102 hover:shadow-xl'}
      `}
    >
      {/* Vacant badge */}
      {node.isVacant && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full z-10">
          Lowong
        </div>
      )}

      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        {/* Type badge */}
        <div className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded mb-1.5 ${style.badge}`}>
          {node.subtitle || node.type.toUpperCase()}
        </div>

        {/* Title */}
        <p className={`text-xs font-semibold leading-tight ${style.title}`}>
          {node.title}
        </p>

        {/* Pejabat name */}
        {pejabat ? (
          <p className={`text-[10px] mt-1 leading-tight ${style.sub}`}>
            {pejabat.gelarDepan || ''} {pejabat.nama} {pejabat.gelarBelakang || ''}
          </p>
        ) : node.isVacant && node.type !== 'unit' ? (
          <p className="text-[10px] mt-1 text-red-300 italic">— Jabatan Lowong —</p>
        ) : null}
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-b-[10px] ${
        node.type === 'unit' ? 'bg-gray-50 border-t border-gray-100' : 'bg-black/10'
      }`}>
        <div className="flex items-center gap-1">
          <Users className={`w-3 h-3 ${node.type === 'unit' ? 'text-gray-400' : 'text-white/60'}`} />
          <span className={`text-[10px] font-medium ${node.type === 'unit' ? 'text-gray-500' : 'text-white/80'}`}>
            {staffCount} pegawai
          </span>
        </div>

        {hasChildren && (
          <button
            onClick={e => { e.stopPropagation(); onToggle(); }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              node.type === 'unit'
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {isCollapsed
              ? <ChevronRight className="w-3 h-3" />
              : <ChevronDown className="w-3 h-3" />
            }
          </button>
        )}
      </div>
    </div>
  );
}

// ─── TreeNode ─────────────────────────────────────────────────────────────────
interface TreeNodeProps {
  node: OrgNode;
  pegawai: Pegawai[];
  collapsedIds: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: OrgNode) => void;
  depth?: number;
}

function TreeNode({ node, pegawai, collapsedIds, selectedId, onToggle, onSelect, depth = 0 }: TreeNodeProps) {
  const isCollapsed = collapsedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const lineColor = LINE_COLOR[node.type] || '#cbd5e1';
  const onAddChild = useContext(AddCtx);

  return (
    <div className="flex flex-col items-center">
      {/* Card + Add button wrapper */}
      <div className="relative group/node">
        <NodeCard
          node={node}
          pegawai={pegawai}
          isCollapsed={isCollapsed}
          isSelected={isSelected}
          onToggle={() => onToggle(node.id)}
          onSelect={() => onSelect(node)}
        />
        {/* + Add child button (visible on hover, hidden for unit type) */}
        {node.type !== 'unit' && (
          <button
            onClick={e => { e.stopPropagation(); onAddChild(node.id); }}
            title="Tambah node anak"
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 transition-all duration-150
              w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg
              flex items-center justify-center z-20 border-2 border-white"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {hasChildren && !isCollapsed && (
        <div className="contents">
          {/* Vertical line from parent */}
          <div style={{ width: 1, height: 24, background: lineColor, margin: '0 auto' }} />

          {/* Children row */}
          <div className="flex justify-center">
            {children.map((child, idx) => {
              const childLineColor = LINE_COLOR[node.type] || '#cbd5e1';
              const isFirst = idx === 0;
              const isLast = idx === children.length - 1;
              const isOnly = children.length === 1;

              return (
                <div
                  key={child.id}
                  className="relative flex flex-col items-center"
                  style={{ paddingTop: 24, paddingLeft: 12, paddingRight: 12 }}
                >
                  {/* Left branch of horizontal line */}
                  {!isOnly && !isFirst && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: '50%',
                        height: 1,
                        background: childLineColor,
                      }}
                    />
                  )}
                  {/* Right branch of horizontal line */}
                  {!isOnly && !isLast && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        right: 0,
                        height: 1,
                        background: childLineColor,
                      }}
                    />
                  )}
                  {/* Vertical stub down to child */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      width: 1,
                      height: 24,
                      transform: 'translateX(-50%)',
                      background: childLineColor,
                    }}
                  />

                  <TreeNode
                    node={child}
                    pegawai={pegawai}
                    collapsedIds={collapsedIds}
                    selectedId={selectedId}
                    onToggle={onToggle}
                    onSelect={onSelect}
                    depth={depth + 1}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ node, pegawai, onClose }: { node: OrgNode; pegawai: Pegawai[]; onClose: () => void }) {
  const pejabat = node.pegawaiId ? pegawai.find(p => p.id === node.pegawaiId) : null;
  const unitStaff = node.unitKerja
    ? pegawai.filter(p => p.unitKerja === node.unitKerja && p.id !== node.pegawaiId)
    : [];

  const style = NODE_STYLES[node.type];

  const eselonColor: Record<string, string> = {
    hospital: 'bg-[#1e3a5f] text-white',
    eselon2: 'bg-blue-700 text-white',
    eselon3: 'bg-sky-600 text-white',
    eselon4: 'bg-teal-600 text-white',
    unit: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="w-[280px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-4 ${eselonColor[node.type]} flex-shrink-0`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold opacity-70 uppercase tracking-wider mb-1">
              {node.subtitle || node.type}
            </p>
            <p className="text-sm font-bold leading-tight">{node.title}</p>
            {node.eselon && (
              <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-medium">
                {node.eselon}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Pejabat */}
        {pejabat ? (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Pejabat Struktural
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {pejabat.nama.split(' ').slice(0, 2).map(w => w[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {pejabat.gelarDepan || ''} {pejabat.nama}{pejabat.gelarBelakang ? `, ${pejabat.gelarBelakang}` : ''}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">{pejabat.nip}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                    {pejabat.golongan}
                  </span>
                  <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {pejabat.statusPegawai}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : node.isVacant && node.type !== 'unit' ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-600">Jabatan struktural saat ini kosong / lowong</p>
          </div>
        ) : null}

        {/* Unit staff */}
        {node.unitKerja && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Staf {node.type === 'unit' ? '' : 'di Unit Ini'} ({unitStaff.length})
            </p>
            {unitStaff.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">Tidak ada staf terdaftar</p>
            ) : (
              <div className="space-y-2">
                {unitStaff.map(p => (
                  <div key={p.id} className="bg-gray-50 rounded-lg p-2.5 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold flex-shrink-0">
                      {p.nama.split(' ').slice(0, 2).map(w => w[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-800 leading-tight truncate">
                        {p.gelarDepan || ''} {p.nama}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5 truncate">{p.jabatan}</p>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                          {p.golongan}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          p.statusPegawai === 'PNS' ? 'bg-green-50 text-green-600'
                          : p.statusPegawai === 'PPPK' ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.statusPegawai}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary if no unit */}
        {!node.unitKerja && !pejabat && (
          <div className="text-center py-6 text-gray-400">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Pilih node untuk melihat detail</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrganisasiTree() {
  const { pegawai } = useAppContext();

  // Org tree data (mutable state)
  const [orgData, setOrgData] = useState<OrgNode>(ORG_DATA);

  // Zoom & pan
  const [scale, setScale] = useState(0.85);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  // Collapse & selection
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Add node modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addParentId, setAddParentId] = useState('');

  // Stats
  const totalPNS = pegawai.filter(p => p.statusPegawai === 'PNS').length;
  const totalPPPK = pegawai.filter(p => p.statusPegawai === 'PPPK').length;
  const totalHonorer = pegawai.filter(p => p.statusPegawai === 'Honorer').length;

  const allNodes = getAllNodes(orgData);

  // Toggle collapse
  const handleToggle = useCallback((id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExpandAll = () => setCollapsedIds(new Set());
  const handleCollapseAll = () => {
    const ids = new Set<string>();
    const collect = (n: OrgNode) => { if ((n.children || []).length) { ids.add(n.id); (n.children || []).forEach(collect); } };
    collect(orgData);
    setCollapsedIds(ids);
  };

  // Zoom
  const handleZoom = (delta: number) => setScale(s => Math.min(2, Math.max(0.3, s + delta)));
  const handleReset = () => { setScale(0.85); setTranslate({ x: 0, y: 0 }); };

  // Add node handlers
  const handleOpenAdd = useCallback((parentId: string) => {
    setAddParentId(parentId);
    setShowAddModal(true);
  }, []);

  const handleAddNode = useCallback((parentId: string, newNode: OrgNode) => {
    setOrgData(prev => addNodeToTree(prev, parentId, newNode));
    // Auto-expand the parent so new child is visible
    setCollapsedIds(prev => {
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
  }, []);

  // Pan (mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (!hasDraggedRef.current) {
      const totalDx = e.clientX - dragStartRef.current.x;
      const totalDy = e.clientY - dragStartRef.current.y;
      if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) hasDraggedRef.current = true;
    }
    setTranslate(t => ({ x: t.x + dx, y: t.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
    setTimeout(() => { hasDraggedRef.current = false; }, 0);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(2, Math.max(0.3, s + (-e.deltaY * 0.001))));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseMove, handleMouseUp, handleWheel]);

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>

      {/* Add Node Modal */}
      {showAddModal && (
        <AddNodeModal
          allNodes={allNodes}
          pegawai={pegawai}
          initialParentId={addParentId}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddNode}
        />
      )}

      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-gray-800">Struktur Organisasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">RSUD Abdul Moeloek — Berdasarkan Perda Struktur Organisasi RS</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Stats pills */}
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium border border-green-100">
              PNS: {totalPNS}
            </span>
            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium border border-amber-100">
              PPPK: {totalPPPK}
            </span>
            {totalHonorer > 0 && (
              <span className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full font-medium border border-gray-200">
                Honorer: {totalHonorer}
              </span>
            )}
          </div>

          <button onClick={handleExpandAll} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            Buka Semua
          </button>
          <button onClick={handleCollapseAll} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            Tutup Semua
          </button>

          {/* Tambah Node button */}
          <button
            onClick={() => handleOpenAdd('rsud')}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Node
          </button>

          <button
            onClick={() => setIsFullscreen(f => !f)}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-100 px-5 py-2 flex items-center gap-4 overflow-x-auto">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">Legenda:</p>
        {[
          { label: 'Direktur (Eselon II)', color: 'bg-blue-700' },
          { label: 'Kepala Bidang/Bagian (Eselon III)', color: 'bg-sky-600' },
          { label: 'Kepala Sub Bagian (Eselon IV)', color: 'bg-teal-600' },
          { label: 'Unit / Instalasi', color: 'bg-gray-300' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 whitespace-nowrap">
            <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            <span className="text-[10px] text-gray-500">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-[10px] text-gray-500">Jabatan Lowong</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tree canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative bg-[#f8fafc]"
          style={{ cursor: 'grab', backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          onMouseDown={handleMouseDown}
        >
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            <button onClick={() => handleZoom(0.15)} className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600" title="Perbesar">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => handleZoom(-0.15)} className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600" title="Perkecil">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleReset} className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600" title="Reset">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-sm px-2 py-1 text-center">
              <span className="text-[10px] text-gray-500 font-medium">{Math.round(scale * 100)}%</span>
            </div>
          </div>

          {/* Hint */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/80 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-sm">
            <Info className="w-3 h-3 text-gray-400" />
            <p className="text-[10px] text-gray-500">Scroll untuk zoom · Drag untuk geser · Hover node → klik <span className="font-semibold text-blue-600">+</span> untuk tambah anak</p>
          </div>

          {/* Tree */}
          <div
            ref={treeRef}
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: 'center top',
              transition: isPanning.current ? 'none' : 'transform 0.1s ease',
              padding: '48px 64px 80px',
              display: 'inline-flex',
              justifyContent: 'center',
              minWidth: '100%',
              userSelect: 'none',
            }}
          >
            <DragCtx.Provider value={hasDraggedRef}>
              <AddCtx.Provider value={handleOpenAdd}>
                <TreeNode
                  node={orgData}
                  pegawai={pegawai}
                  collapsedIds={collapsedIds}
                  selectedId={selectedNode?.id || null}
                  onToggle={handleToggle}
                  onSelect={(n) => setSelectedNode(prev => prev?.id === n.id ? null : n)}
                />
              </AddCtx.Provider>
            </DragCtx.Provider>
          </div>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <DetailPanel
            node={selectedNode}
            pegawai={pegawai}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}