import React, { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';
import {
  Users, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronRight,
  User, Building2, Info, X, Search, Maximize2, Minimize2,
  Briefcase, Award, AlertCircle,
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

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        node={node}
        pegawai={pegawai}
        isCollapsed={isCollapsed}
        isSelected={isSelected}
        onToggle={() => onToggle(node.id)}
        onSelect={() => onSelect(node)}
      />

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

  // Zoom & pan
  const [scale, setScale] = useState(0.85);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const hasDraggedRef = useRef(false);   // true only after mouse moved > 5px
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  // Collapse & selection
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Stats
  const totalPNS = pegawai.filter(p => p.statusPegawai === 'PNS').length;
  const totalPPPK = pegawai.filter(p => p.statusPegawai === 'PPPK').length;
  const totalHonorer = pegawai.filter(p => p.statusPegawai === 'Honorer').length;

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
    collect(ORG_DATA);
    setCollapsedIds(ids);
  };

  // Zoom
  const handleZoom = (delta: number) => {
    setScale(s => Math.min(2, Math.max(0.3, s + delta)));
  };

  const handleReset = () => {
    setScale(0.85);
    setTranslate({ x: 0, y: 0 });
  };

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
    // Mark as dragged once threshold exceeded
    if (!hasDraggedRef.current) {
      const totalDx = e.clientX - dragStartRef.current.x;
      const totalDy = e.clientY - dragStartRef.current.y;
      if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) {
        hasDraggedRef.current = true;
      }
    }
    setTranslate(t => ({ x: t.x + dx, y: t.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
    // Reset hasDragged after a tick so onClick handlers can read it first
    setTimeout(() => { hasDraggedRef.current = false; }, 0);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setScale(s => Math.min(2, Math.max(0.3, s + delta)));
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
          {/* Controls */}
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
            <p className="text-[10px] text-gray-500">Scroll untuk zoom · Drag untuk geser · Klik node untuk detail</p>
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
              <TreeNode
                node={ORG_DATA}
                pegawai={pegawai}
                collapsedIds={collapsedIds}
                selectedId={selectedNode?.id || null}
                onToggle={handleToggle}
                onSelect={(n) => setSelectedNode(prev => prev?.id === n.id ? null : n)}
              />
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