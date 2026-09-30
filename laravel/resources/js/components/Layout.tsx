import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard, Users, Clock, CalendarDays, Briefcase,
  TrendingUp, Target, FileBarChart2, LogOut, Menu, X, Bell,
  ChevronDown, Search, Settings, Hospital, UserCircle,
  ChevronLeft, ShieldAlert, GraduationCap, Mail, ShieldCheck,
  HeartPulse, DollarSign, CalendarClock, Heart, FileSignature,
  Award, ArrowRightLeft, Users2, Scale, Network, Gauge, AlertCircle,
  CheckCircle2, Info
} from 'lucide-react';

export type UserRole = 'admin' | 'direktur' | 'kepala_unit' | 'komite_medik' | 'pegawai';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  roles?: UserRole[];
}

interface MenuSection {
  section: string;
  items: MenuItem[];
  roles?: UserRole[];
}

const menuItems: MenuSection[] = [
  {
    section: 'UTAMA',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'DATA KEPEGAWAIAN',
    items: [
      { path: '/pegawai', label: 'Data Pegawai', icon: Users },
      { path: '/organisasi', label: 'Struktur Organisasi', icon: Network },
      { path: '/mutasi', label: 'Mutasi & Rotasi', icon: ArrowRightLeft, roles: ['admin', 'direktur'] },
      { path: '/penghargaan', label: 'Penghargaan', icon: Award, roles: ['admin', 'direktur'] },
    ],
  },
  {
    section: 'KEHADIRAN & WAKTU',
    items: [
      { path: '/absensi', label: 'Presensi / Absensi', icon: Clock },
      { path: '/cuti', label: 'Manajemen Cuti', icon: CalendarDays },
      { path: '/penjadwalan', label: 'Penjadwalan Shift', icon: CalendarClock, roles: ['admin', 'kepala_unit', 'direktur'] },
    ],
  },
  {
    section: 'KARIR & PANGKAT',
    items: [
      { path: '/riwayat-jabatan', label: 'Riwayat Jabatan', icon: Briefcase },
      { path: '/kenaikan-pangkat', label: 'Kenaikan Pangkat', icon: TrendingUp, roles: ['admin', 'direktur'] },
    ],
  },
  {
    section: 'KINERJA & KOMPETENSI',
    items: [
      { path: '/skp', label: 'SKP & Penilaian Kinerja', icon: Target },
      { path: '/performance', label: 'Performance Management', icon: Gauge, roles: ['admin', 'direktur'] },
      { path: '/diklat', label: 'Diklat & Pelatihan', icon: GraduationCap },
    ],
  },
  {
    section: 'PELAYANAN MEDIS & LISENSI',
    items: [
      { path: '/credentialing', label: 'Credentialing & Lisensi', icon: ShieldCheck },
      { path: '/k3rs', label: 'K3RS & Kesehatan Kerja', icon: HeartPulse },
      { path: '/komite-rs', label: 'Komite Rumah Sakit', icon: Users2, roles: ['admin', 'direktur'] },
    ],
  },
  {
    section: 'KESEJAHTERAAN & HUKUM',
    roles: ['admin', 'direktur', 'kepala_unit'],
    items: [
      { path: '/penggajian', label: 'Penggajian & Remunerasi', icon: DollarSign },
      { path: '/bpjs', label: 'BPJS Kesehatan & Ketenagakerjaan', icon: Heart },
      { path: '/kontrak', label: 'Kontrak Kerja', icon: FileSignature },
      { path: '/disiplin', label: 'Disiplin Pegawai', icon: ShieldAlert },
      { path: '/hubungan-industrial', label: 'Hubungan Industrial', icon: Scale },
    ],
  },
  {
    section: 'TATA KELOLA & LAPORAN',
    items: [
      { path: '/surat-kepegawaian', label: 'Surat Kepegawaian', icon: Mail, roles: ['admin', 'direktur'] },
      { path: '/laporan', label: 'Laporan & Statistik', icon: FileBarChart2, roles: ['admin', 'direktur'] },
      { path: '/activity-log', label: 'Log Aktivitas Sistem', icon: ShieldCheck, roles: ['admin', 'direktur'] },
      { path: '/settings', label: 'Pengaturan & Backup DB', icon: Settings, roles: ['admin', 'direktur'] },
    ],
  },
];

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  let pageUrl = '/';
  let sharedProps: any = {};

  try {
    const page = usePage();
    pageUrl = page?.url || '/';
    sharedProps = page?.props || {};
  } catch (e) {
    if (typeof window !== 'undefined') {
      pageUrl = window.location.pathname;
    }
  }

  const user = sharedProps?.auth?.user || {
    id: 1,
    name: 'Administrator RSUDAM',
    email: 'admin@rsudam.lampungprov.go.id',
    roles: ['admin'],
  };

  const pegawai = sharedProps?.auth?.pegawai || {
    nip: '197808152005011002',
    nama: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
    jabatan: 'Direktur Utama',
    unit_kerja: 'Direksi RSUD Dr. H. Abdul Moeloek',
    sisa_cuti_tahunan: 12,
  };

  const alerts = sharedProps?.alerts || {
    pending_cuti_count: 3,
    str_expiring_count: 5,
  };

  const flash = sharedProps?.flash || {};

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setNotificationOpen(false);
      setProfileOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof router !== 'undefined' && router.post) {
      router.post('/logout');
    } else {
      window.location.href = '/login';
    }
  };

  const isCurrentPath = (path: string) => {
    if (path === '/') return pageUrl === '/';
    return pageUrl.startsWith(path);
  };

  const userRole: UserRole = (user.roles?.[0] as UserRole) || 'admin';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-gray-800">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#013E37] text-white flex flex-col transition-all duration-300 ease-in-out border-r border-[#025046]/40 shadow-xl lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#025046]/60 bg-[#01342E]">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Hospital className="w-6 h-6 text-emerald-300" />
            </div>
            {sidebarOpen && (
              <div className="leading-tight truncate">
                <span className="font-bold text-base tracking-wide text-white block">HCMS RSUDAM</span>
                <span className="text-[10px] text-emerald-300/80 font-medium block">Provinsi Lampung</span>
              </div>
            )}
          </Link>

          {/* Toggle sidebar button (Desktop) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-200 transition"
            title={sidebarOpen ? 'Perkecil Sidebar' : 'Perbesar Sidebar'}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Close button (Mobile) */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-emerald-200 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Links Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-[#025046] scrollbar-track-transparent">
          {menuItems.map((sec, secIdx) => {
            const hasSectionRole = !sec.roles || sec.roles.includes(userRole);
            if (!hasSectionRole) return null;

            const visibleItems = sec.items.filter((item) => !item.roles || item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={secIdx} className="space-y-1">
                {sidebarOpen ? (
                  <div className="px-3 text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider mb-2">
                    {sec.section}
                  </div>
                ) : (
                  <div className="h-2 border-t border-[#025046]/40 my-2" />
                )}

                {visibleItems.map((item, itemIdx) => {
                  const active = isCurrentPath(item.path);
                  const Icon = item.icon;

                  let badgeCount = 0;
                  if (item.path === '/cuti' && alerts.pending_cuti_count) {
                    badgeCount = alerts.pending_cuti_count;
                  } else if (item.path === '/credentialing' && alerts.str_expiring_count) {
                    badgeCount = alerts.str_expiring_count;
                  }

                  return (
                    <Link
                      key={itemIdx}
                      href={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                        active
                          ? 'bg-[#025046] text-white shadow-sm shadow-emerald-950/20 font-semibold'
                          : 'text-emerald-100/80 hover:bg-white/5 hover:text-white'
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-emerald-300' : 'text-emerald-300/70 group-hover:text-emerald-200'}`} />
                      
                      {sidebarOpen && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}

                      {sidebarOpen && badgeCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-gray-900 shadow-xs">
                          {badgeCount}
                        </span>
                      )}

                      {!sidebarOpen && badgeCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#013E37]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Card at Bottom of Sidebar */}
        <div className="p-3 border-t border-[#025046]/60 bg-[#01342E]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-lg bg-emerald-700/80 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">
              {pegawai.nama ? pegawai.nama.charAt(0) : 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 leading-tight">
                <div className="text-xs font-bold text-white truncate">{pegawai.nama}</div>
                <div className="text-[10px] text-emerald-300/80 truncate">{pegawai.jabatan}</div>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-emerald-300/70 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          {/* Left: Mobile Toggle & Search */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pegawai (Nama, NIP), jadwal shift, unit kerja..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/10 focus:border-[#013E37] transition"
              />
            </div>
          </div>

          {/* Right Header: Badges, Notification & Profile */}
          <div className="flex items-center gap-2 sm:gap-4 ml-4">
            {/* Status Hospital Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Aktif (RSUDAM 24/7)</span>
            </div>

            {/* Notification Bell Component (Polling API) */}
            <NotificationBell pollIntervalMs={30000} />

            {/* Profile Dropdown Menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-[#013E37] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {pegawai.nama ? pegawai.nama.charAt(0) : 'A'}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-bold text-gray-900 truncate max-w-[130px]">{pegawai.nama}</div>
                  <div className="text-[10px] text-gray-500 uppercase">{userRole}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-bold text-gray-900 truncate">{pegawai.nama}</div>
                    <div className="text-gray-400 text-[11px]">NIP. {pegawai.nip}</div>
                    <div className="text-emerald-700 font-medium text-[11px] mt-1 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                      {pegawai.unit_kerja}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/pegawai"
                      className="px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition"
                    >
                      <UserCircle className="w-4 h-4 text-gray-400" />
                      <span>Profil Pegawai</span>
                    </Link>
                    <Link
                      href="/cuti"
                      className="px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition"
                    >
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      <span>Sisa Cuti ({pegawai.sisa_cuti_tahunan || 12} Hari)</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Pengaturan & Database</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition font-medium"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Keluar Sistem</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Flash Alerts */}
        {flash.success && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{flash.success}</span>
          </div>
        )}

        {flash.error && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{flash.error}</span>
          </div>
        )}

        {/* MAIN BODY CONTENT OUTLET */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="border-t border-gray-200/60 bg-white py-4 px-6 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} RSUD Dr. H. Abdul Moeloek Provinsi Lampung — Human Capital Management System (HCMS)</p>
        </footer>
      </div>
    </div>
  );
}
