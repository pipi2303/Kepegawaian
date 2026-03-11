/**
 * GlobalSearch.tsx — Command palette / spotlight search
 * Shortcut: Ctrl+K (Windows/Linux) atau Cmd+K (Mac)
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, X, Users, CalendarDays, TrendingUp, Target, ShieldAlert,
  GraduationCap, LayoutDashboard, Clock, Briefcase, FileBarChart2,
  Mail, ShieldCheck, HeartPulse, DollarSign, CalendarClock, Heart,
  FileSignature, Award, ArrowRightLeft, Network, Users2, Scale,
  ArrowRight, Hash, Building2, ChevronRight, Keyboard,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  type: 'pegawai' | 'cuti' | 'kenaikan_pangkat' | 'diklat' | 'disiplin' | 'skp' | 'nav' | 'absensi';
  title: string;
  subtitle: string;
  path: string;
  icon: React.ElementType;
  badge?: { text: string; color: string };
}

interface ResultGroup {
  label: string;
  icon: React.ElementType;
  color: string;
  results: SearchResult[];
}

// ─── Navigation quick links ───────────────────────────────────────────────────
const NAV_ITEMS: Omit<SearchResult, 'type' | 'id'>[] = [
  { title: 'Dashboard',              subtitle: 'Beranda utama HR APP',         path: '/',                   icon: LayoutDashboard },
  { title: 'Data Pegawai',           subtitle: 'Kelola data semua pegawai',    path: '/pegawai',            icon: Users },
  { title: 'Presensi / Absensi',     subtitle: 'Rekap kehadiran pegawai',      path: '/absensi',            icon: Clock },
  { title: 'Manajemen Cuti',         subtitle: 'Pengajuan & approval cuti',    path: '/cuti',               icon: CalendarDays },
  { title: 'Penjadwalan Shift',      subtitle: 'Jadwal shift & piket',         path: '/penjadwalan',        icon: CalendarClock },
  { title: 'Riwayat Jabatan',        subtitle: 'Histori jabatan pegawai',      path: '/riwayat-jabatan',    icon: Briefcase },
  { title: 'Kenaikan Pangkat',       subtitle: 'Proses kenaikan pangkat/golongan', path: '/kenaikan-pangkat', icon: TrendingUp },
  { title: 'SKP & Penilaian Kinerja',subtitle: 'Sasaran Kinerja Pegawai',      path: '/skp',                icon: Target },
  { title: 'Diklat & Kompetensi',    subtitle: 'Pelatihan dan pengembangan',   path: '/diklat',             icon: GraduationCap },
  { title: 'Credentialing & Lisensi',subtitle: 'STR, SIP, kredensial klinisi', path: '/credentialing',      icon: ShieldCheck },
  { title: 'K3RS & Kesehatan Kerja', subtitle: 'Keselamatan kerja RS',         path: '/k3rs',               icon: HeartPulse },
  { title: 'Komite Rumah Sakit',     subtitle: 'Komite medik dan keperawatan', path: '/komite-rs',          icon: Users2 },
  { title: 'Penggajian & Tunjangan', subtitle: 'Slip gaji, tunjangan, potongan', path: '/penggajian',       icon: DollarSign },
  { title: 'BPJS Kesehatan & BPJS Ketenagakerjaan',   subtitle: 'Data kepesertaan BPJS',        path: '/bpjs',               icon: Heart },
  { title: 'Kontrak Kerja',          subtitle: 'Kontrak pegawai honorer/PKWT', path: '/kontrak',            icon: FileSignature },
  { title: 'Disiplin Pegawai',       subtitle: 'Kasus pelanggaran disiplin',   path: '/disiplin',           icon: ShieldAlert },
  { title: 'Hubungan Industrial',    subtitle: 'Grievance & hubungan kerja',   path: '/hubungan-industrial',icon: Scale },
  { title: 'Surat Kepegawaian',      subtitle: 'Buat & kelola surat resmi',    path: '/surat-kepegawaian',  icon: Mail },
  { title: 'Laporan & Statistik',    subtitle: 'Analitik & laporan SDM',       path: '/laporan',            icon: FileBarChart2 },
  { title: 'Struktur Organisasi',    subtitle: 'Bagan organisasi RSUD',        path: '/organisasi',         icon: Network },
  { title: 'Mutasi & Rotasi',        subtitle: 'Perpindahan unit/jabatan',     path: '/mutasi',             icon: ArrowRightLeft },
  { title: 'Penghargaan',            subtitle: 'Satyalancana dan penghargaan', path: '/penghargaan',        icon: Award },
];

// ─── Status badge helper ──────────────────────────────────────────────────────
function statusBadge(status: string): { text: string; color: string } {
  const map: Record<string, string> = {
    'Aktif': 'bg-green-100 text-green-700',
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Disetujui': 'bg-green-100 text-green-700',
    'Ditolak': 'bg-red-100 text-red-700',
    'Proses': 'bg-blue-100 text-blue-700',
    'Selesai': 'bg-gray-100 text-gray-600',
    'Berlangsung': 'bg-blue-100 text-blue-700',
    'Direncanakan': 'bg-purple-100 text-purple-700',
    'Tidak Aktif': 'bg-gray-100 text-gray-500',
  };
  return { text: status, color: map[status] || 'bg-gray-100 text-gray-600' };
}

// ─── GlobalSearch component ───────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: Props) {
  const navigate = useNavigate();
  const {
    pegawai, cuti, kenaikanPangkat, diklat, disiplin, skp, absensi,
  } = useAppContext();

  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Build search results
  const groups: ResultGroup[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Empty state: show nav quick links
      return [{
        label: 'Navigasi Cepat',
        icon: ArrowRight,
        color: 'text-blue-500',
        results: NAV_ITEMS.slice(0, 10).map((n, i) => ({
          ...n,
          id: `nav-${i}`,
          type: 'nav' as const,
        })),
      }];
    }

    const out: ResultGroup[] = [];

    // ── Pegawai ─────────────────────────────────────────────────────────────
    const pegawaiResults: SearchResult[] = pegawai
      .filter(p =>
        p.nama.toLowerCase().includes(q) ||
        p.nip?.toLowerCase().includes(q) ||
        p.jabatan?.toLowerCase().includes(q) ||
        p.unitKerja?.toLowerCase().includes(q) ||
        p.golongan?.toLowerCase().includes(q) ||
        p.statusPegawai?.toLowerCase().includes(q) ||
        p.jabatanFungsional?.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map(p => ({
        id: `peg-${p.id}`,
        type: 'pegawai' as const,
        title: `${p.gelarDepan ? p.gelarDepan + ' ' : ''}${p.nama}${p.gelarBelakang ? ', ' + p.gelarBelakang : ''}`,
        subtitle: `${p.jabatan || p.jabatanFungsional || '-'} · ${p.unitKerja}`,
        path: `/pegawai/${p.id}`,
        icon: Users,
        badge: statusBadge(p.statusPegawai),
      }));
    if (pegawaiResults.length) {
      out.push({ label: 'Pegawai', icon: Users, color: 'text-blue-500', results: pegawaiResults });
    }

    // ── Cuti ────────────────────────────────────────────────────────────────
    const cutiResults: SearchResult[] = cuti
      .filter(c => {
        const p = pegawai.find(x => x.id === c.pegawaiId);
        return (
          p?.nama.toLowerCase().includes(q) ||
          c.jenisCuti.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q) ||
          c.alasan?.toLowerCase().includes(q)
        );
      })
      .slice(0, 4)
      .map(c => {
        const p = pegawai.find(x => x.id === c.pegawaiId);
        return {
          id: `cuti-${c.id}`,
          type: 'cuti' as const,
          title: `${p?.nama || '-'} — ${c.jenisCuti}`,
          subtitle: `${c.tanggalMulai} s.d. ${c.tanggalSelesai} · ${c.jumlahHari} hari`,
          path: '/cuti',
          icon: CalendarDays,
          badge: statusBadge(c.status),
        };
      });
    if (cutiResults.length) {
      out.push({ label: 'Pengajuan Cuti', icon: CalendarDays, color: 'text-orange-500', results: cutiResults });
    }

    // ── Kenaikan Pangkat ────────────────────────────────────────────────────
    const kpResults: SearchResult[] = kenaikanPangkat
      .filter(k => {
        const p = pegawai.find(x => x.id === k.pegawaiId);
        return (
          p?.nama.toLowerCase().includes(q) ||
          k.golonganBaru?.toLowerCase().includes(q) ||
          k.golonganLama?.toLowerCase().includes(q) ||
          k.status.toLowerCase().includes(q) ||
          k.jenisPangkat?.toLowerCase().includes(q)
        );
      })
      .slice(0, 4)
      .map(k => {
        const p = pegawai.find(x => x.id === k.pegawaiId);
        return {
          id: `kp-${k.id}`,
          type: 'kenaikan_pangkat' as const,
          title: `${p?.nama || '-'}`,
          subtitle: `${k.golonganLama || '-'} → ${k.golonganBaru || '-'} · ${k.jenisPangkat || ''}`,
          path: '/kenaikan-pangkat',
          icon: TrendingUp,
          badge: statusBadge(k.status),
        };
      });
    if (kpResults.length) {
      out.push({ label: 'Kenaikan Pangkat', icon: TrendingUp, color: 'text-purple-500', results: kpResults });
    }

    // ── SKP ─────────────────────────────────────────────────────────────────
    const skpResults: SearchResult[] = skp
      .filter(s => {
        const p = pegawai.find(x => x.id === s.pegawaiId);
        return (
          p?.nama.toLowerCase().includes(q) ||
          String(s.tahun).includes(q) ||
          s.predikat?.toLowerCase().includes(q)
        );
      })
      .slice(0, 4)
      .map(s => {
        const p = pegawai.find(x => x.id === s.pegawaiId);
        return {
          id: `skp-${s.id}`,
          type: 'skp' as const,
          title: `${p?.nama || '-'}`,
          subtitle: `SKP Tahun ${s.tahun} · Nilai ${s.nilaiAkhir || 0}`,
          path: '/skp',
          icon: Target,
          badge: s.predikat ? { text: s.predikat, color: 'bg-indigo-100 text-indigo-700' } : undefined,
        };
      });
    if (skpResults.length) {
      out.push({ label: 'SKP', icon: Target, color: 'text-indigo-500', results: skpResults });
    }

    // ── Diklat ──────────────────────────────────────────────────────────────
    const diklatResults: SearchResult[] = diklat
      .filter(d => {
        const p = pegawai.find(x => x.id === d.pegawaiId);
        return (
          p?.nama.toLowerCase().includes(q) ||
          d.namaDiklat?.toLowerCase().includes(q) ||
          d.jenisDiklat?.toLowerCase().includes(q) ||
          d.penyelenggara?.toLowerCase().includes(q) ||
          d.status.toLowerCase().includes(q)
        );
      })
      .slice(0, 4)
      .map(d => {
        const p = pegawai.find(x => x.id === d.pegawaiId);
        return {
          id: `diklat-${d.id}`,
          type: 'diklat' as const,
          title: d.namaDiklat || 'Diklat',
          subtitle: `${p?.nama || '-'} · ${d.penyelenggara || ''} · ${d.tahun || ''}`,
          path: '/diklat',
          icon: GraduationCap,
          badge: statusBadge(d.status),
        };
      });
    if (diklatResults.length) {
      out.push({ label: 'Diklat & Kompetensi', icon: GraduationCap, color: 'text-teal-500', results: diklatResults });
    }

    // ── Disiplin ────────────────────────────────────────────────────────────
    const disiplinResults: SearchResult[] = disiplin
      .filter(d => {
        const p = pegawai.find(x => x.id === d.pegawaiId);
        return (
          p?.nama.toLowerCase().includes(q) ||
          d.jenisPelanggaran?.toLowerCase().includes(q) ||
          d.tingkatHukuman?.toLowerCase().includes(q) ||
          d.status?.toLowerCase().includes(q)
        );
      })
      .slice(0, 4)
      .map(d => {
        const p = pegawai.find(x => x.id === d.pegawaiId);
        const tingkatColor: Record<string, string> = {
          'Ringan': 'bg-yellow-100 text-yellow-700',
          'Sedang': 'bg-orange-100 text-orange-700',
          'Berat': 'bg-red-100 text-red-700',
        };
        return {
          id: `dis-${d.id}`,
          type: 'disiplin' as const,
          title: `${p?.nama || '-'}`,
          subtitle: d.jenisPelanggaran || 'Pelanggaran disiplin',
          path: '/disiplin',
          icon: ShieldAlert,
          badge: d.tingkatHukuman ? { text: d.tingkatHukuman, color: tingkatColor[d.tingkatHukuman] || 'bg-gray-100 text-gray-600' } : undefined,
        };
      });
    if (disiplinResults.length) {
      out.push({ label: 'Disiplin', icon: ShieldAlert, color: 'text-red-500', results: disiplinResults });
    }

    // ── Navigation ──────────────────────────────────────────────────────────
    const navResults: SearchResult[] = NAV_ITEMS
      .filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.subtitle.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((n, i) => ({ ...n, id: `nav-${i}`, type: 'nav' as const }));
    if (navResults.length) {
      out.push({ label: 'Navigasi', icon: ArrowRight, color: 'text-gray-500', results: navResults });
    }

    return out;
  }, [query, pegawai, cuti, kenaikanPangkat, diklat, disiplin, skp]);

  // Flatten for keyboard nav
  const flatResults = useMemo(() => groups.flatMap(g => g.results), [groups]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatResults[activeIdx]) {
      navigate(flatResults[activeIdx].path);
      onClose();
    }
  }, [flatResults, activeIdx, navigate, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Reset active on query change
  useEffect(() => { setActiveIdx(0); }, [query]);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  if (!open) return null;

  const totalResults = flatResults.length;
  let globalIdx = 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari pegawai, NIP, jabatan, modul, cuti, diklat..."
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-[10px] text-gray-500 font-mono border border-gray-200 flex-shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto flex-1 py-2">
          {groups.length === 0 ? (
            <div className="py-14 text-center">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Tidak ada hasil untuk "<span className="font-medium text-gray-600">{query}</span>"</p>
              <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain seperti nama, NIP, atau jabatan</p>
            </div>
          ) : (
            groups.map(group => {
              const GroupIcon = group.icon;
              return (
                <div key={group.label} className="mb-1">
                  {/* Group header */}
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <GroupIcon className={`w-3.5 h-3.5 ${group.color}`} />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</span>
                    <span className="text-[10px] text-gray-300 ml-auto">{group.results.length} hasil</span>
                  </div>

                  {/* Results */}
                  {group.results.map(result => {
                    const idx = globalIdx++;
                    const isActive = idx === activeIdx;
                    const ResultIcon = result.icon;
                    return (
                      <button
                        key={result.id}
                        data-idx={idx}
                        onClick={() => handleSelect(result.path)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                          isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <ResultIcon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isActive ? 'text-blue-800 font-medium' : 'text-gray-800'}`}>
                            {result.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{result.subtitle}</p>
                        </div>

                        {result.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${result.badge.color}`}>
                            {result.badge.text}
                          </span>
                        )}

                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">↑↓</kbd>
              navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">↵</kbd>
              pilih
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">Esc</kbd>
              tutup
            </span>
          </div>
          {totalResults > 0 && (
            <p className="text-[11px] text-gray-400">
              {totalResults} hasil ditemukan
            </p>
          )}
        </div>
      </div>
    </div>
  );
}