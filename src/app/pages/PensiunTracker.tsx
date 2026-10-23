import React, { useState } from 'react';
import { CalendarDays, FileText, Loader2, AlertTriangle, Clock, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pensiunApi } from '../data/api';

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

type TabKey = 'critical' | 'warning' | 'info';

const tabConfig: { key: TabKey; label: string; icon: React.ReactNode; badge: string }[] = [
  { key: 'critical', label: 'Kritis ≤30 hari', icon: <AlertTriangle className="w-4 h-4" />, badge: 'bg-red-100 text-red-700' },
  { key: 'warning',  label: 'Waspada ≤90 hari', icon: <Clock className="w-4 h-4" />,          badge: 'bg-amber-100 text-amber-700' },
  { key: 'info',     label: 'Semua ≤180 hari',  icon: <Info className="w-4 h-4" />,           badge: 'bg-blue-100 text-blue-700' },
];

const urgencyBadge: Record<TabKey, string> = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  warning:  'bg-amber-100 text-amber-700 border border-amber-200',
  info:     'bg-blue-100 text-blue-700 border border-blue-200',
};

export default function PensiunTracker() {
  const [activeTab, setActiveTab] = useState<TabKey>('critical');
  const [downloading, setDownloading] = useState<number | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['pensiun-stats'],
    queryFn: () => pensiunApi.stats(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['pensiun-list'],
    queryFn: () => pensiunApi.getAll(180),
    staleTime: 5 * 60 * 1000,
  });

  const stats = statsData?.data;
  const lists = listData?.data ?? { critical: [], warning: [], info: [] };

  const handleDownloadSurat = async (pegawaiId: number, nip: string) => {
    setDownloading(pegawaiId);
    try {
      const res = await pensiunApi.suratPengantar(pegawaiId);
      downloadBlob(res.data, `surat_pensiun_${nip}.pdf`);
      toast.success('Surat pengantar pensiun berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh surat pengantar');
    } finally {
      setDownloading(null);
    }
  };

  const rows = lists[activeTab] ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tracker Pensiun</h1>
          <p className="text-sm text-gray-500">Monitoring pegawai mendekati masa purnabakti</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pensiun Bulan Ini',  value: stats?.pensiun_bulan_ini ?? '-',  color: 'text-red-600',   bg: 'bg-red-50' },
          { label: 'Pensiun Tahun Ini',  value: stats?.pensiun_tahun_ini ?? '-',  color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Sudah Pensiun',      value: stats?.sudah_pensiun ?? '-',      color: 'text-gray-600',  bg: 'bg-gray-50' },
          { label: 'Rata Masa Kerja',    value: stats?.rata_masa_kerja ? `${stats.rata_masa_kerja} thn` : '-', color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border border-gray-200 p-4 ${s.bg}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabConfig.map(tab => {
            const count = (lists[tab.key] ?? []).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tab.badge}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nama / NIP</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Jabatan / Unit</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Golongan</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Tgl Pensiun</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Sisa Hari</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Surat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                      Tidak ada pegawai dalam kategori ini
                    </td>
                  </tr>
                ) : rows.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">{p.nama}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.nip}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-gray-700">{p.jabatan ?? '-'}</p>
                      <p className="text-xs text-gray-400">{p.unit_kerja ?? '-'}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-center">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                        {p.golongan ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-gray-600">
                      {fmtDate(p.batas_pensiun)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${urgencyBadge[p.urgency as TabKey] ?? ''}`}>
                        {p.hari_tersisa} hari
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleDownloadSurat(p.id, p.nip)}
                        disabled={downloading === p.id}
                        className="flex items-center gap-1.5 mx-auto px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                        title="Unduh Surat Pengantar"
                      >
                        {downloading === p.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <FileText className="w-3.5 h-3.5" />
                        }
                        Surat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
