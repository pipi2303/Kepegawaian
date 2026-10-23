import React, { useState } from 'react';
import { Shield, Search, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useActivityLog } from '../hooks';
import { PrintButton } from '../components/PrintButton';

function fmtDate(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function truncate(s: string, n = 40) {
  return s && s.length > n ? s.slice(0, n) + '…' : s;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE:  'bg-green-100 text-green-700',
  UPDATE:  'bg-blue-100 text-blue-700',
  DELETE:  'bg-red-100 text-red-700',
  LOGIN:   'bg-gray-100 text-gray-600',
  APPROVE: 'bg-emerald-100 text-emerald-700',
  REJECT:  'bg-orange-100 text-orange-700',
  EXPORT:  'bg-purple-100 text-purple-700',
  LOGOUT:  'bg-slate-100 text-slate-600',
};

const SEVERITY_DOT: Record<string, string> = {
  info:     'bg-blue-500',
  warning:  'bg-amber-500',
  critical: 'bg-red-500',
};

const STATUS_CLS: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED:  'bg-red-100 text-red-700',
};

interface LogEntry {
  id: number;
  created_at: string;
  action: string;
  target_type: string;
  target_label: string;
  description: string;
  severity: string;
  status: string;
  ip_address?: string;
  changes?: Record<string, { before: any; after: any }> | null;
  pegawai?: { nama: string; nip: string } | null;
}

export default function ActivityLog() {
  const [filters, setFilters] = useState({ action: '', severity: '', search: '' });
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useActivityLog({ ...filters, page });

  const logs: LogEntry[]  = data?.data?.data ?? [];
  const meta              = data?.data?.meta ?? {};
  const currentPage       = data?.data?.current_page ?? page;
  const lastPage          = data?.data?.last_page ?? 1;

  function set(k: keyof typeof filters, v: string) {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
  }

  const statPills = [
    { label: 'Total Events',    val: meta.total_events  ?? 0, cls: 'bg-blue-50 text-blue-700' },
    { label: 'CREATE',          val: meta.total_create  ?? 0, cls: 'bg-green-50 text-green-700' },
    { label: 'UPDATE/DELETE',   val: (meta.total_update ?? 0) + (meta.total_delete ?? 0), cls: 'bg-orange-50 text-orange-700' },
    { label: 'Critical',        val: meta.total_critical ?? 0, cls: 'bg-red-50 text-red-700' },
  ];

  const selectCls = "text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-gray-800 font-semibold text-lg leading-tight">Audit Trail Log</h1>
            <p className="text-sm text-gray-500">Semua aktivitas sistem tercatat secara otomatis</p>
          </div>
        </div>
        {/* Stat pills + Print */}
        <div className="flex flex-wrap items-center gap-2">
          {statPills.map(p => (
            <span key={p.label} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${p.cls}`}>
              {p.label}: {p.val}
            </span>
          ))}
          <PrintButton />
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari target atau deskripsi..."
              value={filters.search}
              onChange={e => set('search', e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={filters.action} onChange={e => set('action', e.target.value)} className={selectCls}>
            <option value="">SEMUA AKSI</option>
            {['LOGIN','CREATE','UPDATE','DELETE','APPROVE','REJECT','EXPORT','LOGOUT'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select value={filters.severity} onChange={e => set('severity', e.target.value)} className={selectCls}>
            <option value="">SEMUA SEVERITY</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="critical">critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Waktu','Operator','Aksi','Target','Severity','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-14 text-gray-400">
                        <Shield className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Tidak ada data aktivitas</p>
                      </td>
                    </tr>
                  ) : logs.map(log => (
                    <React.Fragment key={log.id}>
                      <tr
                        className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                        <td className="px-4 py-3">
                          {log.pegawai ? (
                            <div>
                              <p className="text-sm font-medium text-gray-800 leading-tight">{log.pegawai.nama}</p>
                              <p className="text-xs text-gray-400 font-mono">{log.pegawai.nip}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">System</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-500">{log.target_type}</p>
                          <p className="text-sm text-gray-700">{truncate(log.target_label)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[log.severity] ?? 'bg-gray-400'}`} />
                            <span className="text-xs text-gray-600">{log.severity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[log.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {log.status}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} />
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row — changes diff */}
                      {expandedId === log.id && (
                        <tr>
                          <td colSpan={6} className="px-6 pb-4 pt-2 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detail Perubahan</p>
                            {log.description && (
                              <p className="text-sm text-gray-600 mb-3">{log.description}</p>
                            )}
                            {!log.changes || Object.keys(log.changes).length === 0 ? (
                              <p className="text-sm text-gray-400 italic">Tidak ada perubahan</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="text-xs w-auto min-w-[400px] border border-gray-200 rounded-lg overflow-hidden">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Field</th>
                                      <th className="text-left px-3 py-2 font-semibold text-red-600">Sebelum</th>
                                      <th className="text-left px-3 py-2 font-semibold text-green-600">Sesudah</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 bg-white">
                                    {Object.entries(log.changes).map(([field, diff]) => (
                                      <tr key={field}>
                                        <td className="px-3 py-1.5 font-mono text-gray-700">{field}</td>
                                        <td className="px-3 py-1.5 text-red-600">{String(diff.before ?? '-')}</td>
                                        <td className="px-3 py-1.5 text-green-700">{String(diff.after ?? '-')}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">Halaman {currentPage} dari {lastPage}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                    disabled={currentPage >= lastPage}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
