import React, { memo, useState, Suspense, useEffect } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router';
import {
  LayoutDashboard, Users, Clock, CalendarDays, Briefcase,
  TrendingUp, Target, FileBarChart2, LogOut,
  Menu, Bell, ChevronDown, Search, Settings,
  Hospital, UserCircle, ChevronLeft, ShieldAlert, GraduationCap, Mail,
  ShieldCheck, HeartPulse, DollarSign, CalendarClock, Heart,
  FileSignature, Award, ArrowRightLeft, Users2, Scale, Network, Gauge,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'sonner';
import GlobalSearch from './GlobalSearch';
import AskIntramedika from './AskIntramedika';

const menuItems = [
  {
    section: 'UTAMA',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'DATA PEGAWAI',
    items: [
      { path: '/pegawai', label: 'Data Pegawai', icon: Users },
      { path: '/organisasi', label: 'Struktur Organisasi', icon: Network },
      { path: '/mutasi', label: 'Mutasi & Rotasi', icon: ArrowRightLeft },
      { path: '/penghargaan', label: 'Penghargaan', icon: Award },
    ],
  },
  {
    section: 'KEHADIRAN & JADWAL',
    items: [
      { path: '/absensi', label: 'Presensi / Absensi', icon: Clock },
      { path: '/cuti', label: 'Manajemen Cuti', icon: CalendarDays },
      { path: '/penjadwalan', label: 'Penjadwalan Shift', icon: CalendarClock },
    ],
  },
  {
    section: 'KARIR & PANGKAT',
    items: [
      { path: '/riwayat-jabatan', label: 'Riwayat Jabatan', icon: Briefcase },
      { path: '/kenaikan-pangkat', label: 'Kenaikan Pangkat', icon: TrendingUp },
    ],
  },
  {
    section: 'KINERJA & PENGEMBANGAN',
    items: [
      { path: '/skp', label: 'SKP & Penilaian Kinerja', icon: Target },
      { path: '/performance', label: 'Performance Management', icon: Gauge },
      { path: '/diklat', label: 'Diklat & Kompetensi', icon: GraduationCap },
    ],
  },
  {
    section: 'KLINIS & LISENSI',
    items: [
      { path: '/credentialing', label: 'Credentialing & Lisensi', icon: ShieldCheck },
      { path: '/k3rs', label: 'K3RS & Kesehatan Kerja', icon: HeartPulse },
      { path: '/komite-rs', label: 'Komite Rumah Sakit', icon: Users2 },
    ],
  },
  {
    section: 'KEPEGAWAIAN',
    items: [
      { path: '/penggajian', label: 'Penggajian & Tunjangan', icon: DollarSign },
      { path: '/bpjs', label: 'BPJS Kesehatan & BPJS Ketenagakerjaan', icon: Heart },
      { path: '/kontrak', label: 'Kontrak Kerja', icon: FileSignature },
    ],
  },
  {
    section: 'DISIPLIN & HUKUM',
    items: [
      { path: '/disiplin', label: 'Disiplin Pegawai', icon: ShieldAlert },
      { path: '/hubungan-industrial', label: 'Hubungan Industrial', icon: Scale },
    ],
  },
  {
    section: 'SURAT & LAPORAN',
    items: [
      { path: '/surat-kepegawaian', label: 'Surat Kepegawaian', icon: Mail },
      { path: '/laporan', label: 'Laporan & Statistik', icon: FileBarChart2 },
    ],
  },
];

const roleLabel: Record<string, string> = {
  admin: 'Administrator',
  direktur: 'Direktur',
  kepala_unit: 'Kepala Unit',
  pegawai: 'Pegawai',
};

const notifications = [
  { id: 1, text: 'Pengajuan cuti Ns. Jumiah, S.Kep menunggu persetujuan', time: '5 mnt lalu', type: 'cuti' },
  { id: 2, text: 'Kenaikan pangkat Susilawati, SKM., MM periode April 2026 siap diproses', time: '1 jam lalu', type: 'pangkat' },
  { id: 3, text: 'Pengajuan cuti dr. Marzuqi Sayuti menunggu persetujuan', time: '2 jam lalu', type: 'cuti' },
  { id: 4, text: '3 pegawai akan memasuki batas pensiun dalam 2 tahun', time: '1 hari lalu', type: 'info' },
  { id: 5, text: 'SKP semester 1 tahun 2026 belum ditetapkan untuk 8 pegawai', time: '2 hari lalu', type: 'skp' },
];

const SidebarContent = memo(({ sidebarOpen, currentUser, onLogout, setMobileSidebarOpen }: {
  sidebarOpen: boolean;
  currentUser: any;
  onLogout: () => void;
  setMobileSidebarOpen?: (open: boolean) => void;
}) => {
  const initials = currentUser?.nama
    ? currentUser.nama.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#2a4a6b]">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <Hospital className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm leading-tight">RSUD Abdul Moeloek</p>
            <p className="text-blue-300 text-xs">HR APP v2.0</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 custom-scrollbar">
        {menuItems.map((section) => (
          <div key={section.section}>
            {sidebarOpen && (
              <p className="px-4 mb-1 text-[10px] font-semibold text-blue-400 tracking-wider">{section.section}</p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileSidebarOpen?.(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#2a4a6b] p-3 space-y-1">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-all">
          <Settings className="w-4.5 h-4.5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm">Pengaturan</span>}
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-blue-200 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm">Keluar</span>}
        </button>
        {sidebarOpen && currentUser && (
          <div className="mt-3 pt-3 border-t border-[#2a4a6b] flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{currentUser.nama}</p>
              <p className="text-blue-300 text-[10px]">{roleLabel[currentUser.role]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SidebarContent.displayName = 'SidebarContent';

// ─── Layout ───────────────────────────────────────────────────────────────────
// Layout menggunakan useNavigate() — aman karena Layout selalu berada di dalam
// Router context (sebagai child dari pathless Root route di routes.ts).
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { isLoggedIn, currentUser, logout } = useAppContext();
  const navigate = useNavigate();

  // Ctrl+K / Cmd+K opens global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Anda berhasil keluar dari HR APP');
    navigate('/login', { replace: true });
  };

  // Redirect via React Router — tidak memerlukan window.location (tidak ada full reload)
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const initials = currentUser?.nama
    ? currentUser.nama.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : 'U';

  const Sidebar = () => (
    <aside
      className={`hidden lg:flex flex-col bg-[#1e3a5f] transition-all duration-300 flex-shrink-0 ${
        sidebarOpen ? 'w-[240px]' : 'w-[64px]'
      }`}
    >
      <SidebarContent sidebarOpen={sidebarOpen} currentUser={currentUser} onLogout={handleLogout} />
    </aside>
  );

  const MobileSidebar = () => (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
      <aside className="absolute left-0 top-0 bottom-0 w-[240px] bg-[#1e3a5f] flex flex-col">
        <SidebarContent sidebarOpen={true} currentUser={currentUser} onLogout={handleLogout} setMobileSidebarOpen={setMobileSidebarOpen} />
      </aside>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      {mobileSidebarOpen && <MobileSidebar />}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 h-14 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setMobileSidebarOpen(!mobileSidebarOpen);
                }
              }}
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {/* Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 pl-3 pr-4 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 border-0 rounded-lg w-64 text-gray-400 transition-colors group"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Cari pegawai, jabatan, modul...</span>
              <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-400 font-mono shadow-sm group-hover:border-gray-300 transition-colors">
                ⌘K
              </kbd>
            </button>
            {/* Mobile search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative"
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm">Notifikasi</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                          n.type === 'cuti' ? 'bg-orange-400' : n.type === 'pangkat' ? 'bg-green-400' : n.type === 'skp' ? 'bg-purple-400' : 'bg-blue-400'
                        }`} />
                        <div>
                          <p className="text-xs text-gray-700 leading-relaxed">{n.text}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 text-center">
                    <button className="text-xs text-blue-600 hover:underline">Lihat Semua Notifikasi</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">{initials}</div>
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[140px] truncate">{currentUser?.nama}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-medium text-gray-800 text-sm">{currentUser?.nama}</p>
                    <p className="text-xs text-gray-500">{roleLabel[currentUser?.role || '']} · {currentUser?.golongan}</p>
                  </div>
                  <div className="py-1">
                    <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <UserCircle className="w-4 h-4" /> Profil Saya
                    </button>
                    <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings className="w-4 h-4" /> Pengaturan
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Memuat halaman...</p>
              </div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {(notifOpen || profileOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />
      )}

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Ask INTRAMEDIKA – Floating Digital Assistant */}
      <AskIntramedika />
    </div>
  );
}

export default memo(Layout);