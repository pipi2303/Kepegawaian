import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import {
  Bell, CalendarDays, Megaphone, Check, CheckCheck,
  RefreshCw, ChevronRight, X, ShieldAlert, Sparkles,
  Info, Clock, ExternalLink
} from 'lucide-react';

export interface NotificationItem {
  id: string | number;
  type: 'leave_request' | 'announcement' | 'alert' | string;
  title: string;
  message: string;
  applicant?: string;
  unit?: string;
  timestamp: string;
  unread: boolean;
  link?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface NotificationBellProps {
  /** Polling interval in milliseconds (default: 30000ms = 30 seconds) */
  pollIntervalMs?: number;
  /** Custom CSS classes for the trigger button container */
  className?: string;
  /** Optional callback fired when an item is clicked */
  onItemClick?: (item: NotificationItem) => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'leave_request',
    title: 'Pengajuan Cuti Ns. Jumiah, S.Kep',
    message: 'Pengajuan cuti tahunan 4 hari dinas IGD menunggu verifikasi Kepala Ruangan & Kasubag SDM.',
    applicant: 'Ns. Jumiah, S.Kep',
    unit: 'Instalasi Gawat Darurat',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    unread: true,
    link: '/cuti',
    priority: 'high',
  },
  {
    id: 'notif-2',
    type: 'announcement',
    title: 'Vaksinasi Hepatitis B Booster Nakes',
    message: 'Pelaksanaan vaksinasi booster hepatitis B untuk nakes IGD & ICU dilaksanakan di Poliklinik MCU.',
    applicant: 'Komite K3RS',
    unit: 'K3RS & PPI',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: true,
    link: '/k3rs',
    priority: 'normal',
  },
  {
    id: 'notif-3',
    type: 'leave_request',
    title: 'Permohonan Cuti Sakit dr. Marzuqi Sayuti, Sp.An',
    message: 'Dokter spesialis anestesi mengajukan cuti sakit 3 hari kerja dengan lampiran surat keterangan medik.',
    applicant: 'dr. Marzuqi Sayuti, Sp.An',
    unit: 'Instalasi Anestesi & Bedah Sentral',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    unread: true,
    link: '/cuti',
    priority: 'high',
  },
  {
    id: 'notif-4',
    type: 'announcement',
    title: 'Batas Validasi Penetapan SKP 2026',
    message: 'Seluruh Pejabat Penilai Kinerja wajib memvalidasi target SKP pegawai sebelum tanggal 5 bulan berjalan.',
    applicant: 'Bagian Kepegawaian',
    unit: 'SDM & Diklit',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    unread: false,
    link: '/skp',
    priority: 'normal',
  },
];

/**
 * Helper to format ISO timestamp into Indonesian relative time.
 */
function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  } catch (e) {
    return 'Beberapa saat lalu';
  }
}

/**
 * NotificationBell component that periodically polls the Laravel API
 * for pending leave requests and staff announcements, presenting them in an accessible dropdown.
 */
export default function NotificationBell({
  pollIntervalMs = 30000,
  className = '',
  onItemClick,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'leave_request' | 'announcement'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll Laravel API endpoint
  const fetchNotifications = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          setNotifications(json.data);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      // Fallback gracefully to default items without throwing or crashing
    } finally {
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Periodic polling hook
  useEffect(() => {
    fetchNotifications();

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        fetchNotifications();
      }, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, pollIntervalMs]);

  // Click-outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const markItemAsRead = (id: string | number) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
        aria-label="Pemberitahuan & Pengumuman"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />

        {/* Unread Ping Badge */}
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping opacity-75" />
          </>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">Notifikasi & Pengumuman</span>
                {unreadCount > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {unreadCount} Baru
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Semua Terbaca
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Manual refresh button */}
                <button
                  type="button"
                  onClick={() => fetchNotifications(true)}
                  disabled={isRefreshing}
                  className="p-1.5 text-gray-400 hover:text-[#013E37] hover:bg-gray-100 rounded-lg transition"
                  title="Perbarui notifikasi"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#013E37]' : ''}`} />
                </button>

                {/* Mark all as read button */}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition"
                    title="Tandai semua dibaca"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeTab === 'all'
                    ? 'bg-[#013E37] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leave_request')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeTab === 'leave_request'
                    ? 'bg-[#013E37] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Pengajuan Cuti ({notifications.filter((n) => n.type === 'leave_request').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('announcement')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeTab === 'announcement'
                    ? 'bg-[#013E37] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Pengumuman ({notifications.filter((n) => n.type === 'announcement').length})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-84 overflow-y-auto divide-y divide-gray-50 scrollbar-thin">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((item) => {
                const isLeave = item.type === 'leave_request';
                const isAnnouncement = item.type === 'announcement';

                const targetLink = item.link || (isLeave ? '/cuti' : '/');

                return (
                  <Link
                    key={item.id}
                    href={targetLink}
                    onClick={() => {
                      markItemAsRead(item.id);
                      setIsOpen(false);
                      if (onItemClick) onItemClick(item);
                    }}
                    className={`p-3.5 flex items-start gap-3 transition block relative ${
                      item.unread ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Icon Badge */}
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isLeave
                          ? 'bg-amber-100/70 text-amber-700'
                          : isAnnouncement
                          ? 'bg-emerald-100/70 text-emerald-800'
                          : 'bg-blue-100/70 text-blue-700'
                      }`}
                    >
                      {isLeave ? (
                        <CalendarDays className="w-4 h-4" />
                      ) : isAnnouncement ? (
                        <Megaphone className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-gray-900 truncate">
                          {item.title}
                        </span>
                        {item.unread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
                        <span className="font-medium text-gray-500">
                          {item.unit || item.applicant}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(item.timestamp)}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-400 space-y-1">
                <Check className="w-6 h-6 mx-auto text-emerald-500" />
                <p className="text-xs font-semibold text-gray-600">Tidak ada notifikasi dalam kategori ini</p>
                <p className="text-[11px]">Seluruh permohonan staf telah ditinjau</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-[10px] text-gray-400">
              Polling RS: Tiap {Math.round(pollIntervalMs / 1000)} dtk
            </span>
            <Link
              href="/cuti"
              onClick={() => setIsOpen(false)}
              className="text-[#013E37] font-semibold hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Semua Permohonan Cuti</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
