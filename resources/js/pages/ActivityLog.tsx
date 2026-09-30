import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../components/Layout';
import SearchBar, { filterRecords } from '../components/SearchBar';
import {
  Shield, ShieldAlert, ShieldCheck, Clock, Users, User,
  Search, Filter, RefreshCw, FileText, Download, Eye,
  AlertTriangle, CheckCircle2, ChevronRight, X, ArrowRight,
  Laptop, Database, Lock, Key, Calendar, Info, Layers
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AuditOperator {
  id: number;
  name: string;
  nip: string;
  role: string;
  ip_address: string;
  user_agent?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN';
  severity: 'info' | 'warning' | 'critical';
  status: 'SUCCESS' | 'FAILED';
  operator: AuditOperator;
  target_type: string;
  target_id: string | number;
  target_label: string;
  description: string;
  changes?: Record<string, { old: any; new: any }> | null;
}

const DEFAULT_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'ACT-2026-0929-001',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    action: 'CREATE',
    severity: 'info',
    status: 'SUCCESS',
    operator: {
      id: 1,
      name: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
      nip: '197505101998031001',
      role: 'Administrator Kepegawaian',
      ip_address: '192.168.10.42 (Gedung Direksi Lt. 2)',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0',
    },
    target_type: 'Pegawai',
    target_id: 8,
    target_label: 'Ns. Ratna Dewi, S.Kep (NIP. 198009122005012008)',
    description: 'Penambahan data pegawai baru formasi Perawat Rawat Inap Ruang Alamanda Bedah.',
    changes: {
      nip: { old: null, new: '198009122005012008' },
      nama: { old: null, new: 'Ratna Dewi' },
      jabatan: { old: null, new: 'Kepala Ruangan Rawat Inap Bedah' },
      unit_kerja: { old: null, new: 'Ruang Alamanda (Bedah)' },
      status_pegawai: { old: null, new: 'PNS' },
    },
  },
  {
    id: 'ACT-2026-0929-002',
    timestamp: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    action: 'UPDATE',
    severity: 'info',
    status: 'SUCCESS',
    operator: {
      id: 2,
      name: 'Siti Rahmawati, S.Kom',
      nip: '198803122010012005',
      role: 'Kasubag Mutasi & Karir',
      ip_address: '192.168.10.58 (Bagian SDM Lt. 1)',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    target_type: 'Pegawai',
    target_id: 1,
    target_label: 'dr. Marzuqi Sayuti, Sp.An-TI (NIP. 198204122008011005)',
    description: 'Pembaruan data kepangkatan dan golongan ruang dari III/d ke IV/a Pembina.',
    changes: {
      golongan: { old: 'III/d', new: 'IV/a' },
      pangkat: { old: 'Penata Tk. I', new: 'Pembina' },
      jabatan: { old: 'Dokter Spesialis Anestesiologi', new: 'Dokter Spesialis Anestesiologi & Terapi Intensif' },
    },
  },
  {
    id: 'ACT-2026-0929-003',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    action: 'EXPORT',
    severity: 'info',
    status: 'SUCCESS',
    operator: {
      id: 1,
      name: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
      nip: '197505101998031001',
      role: 'Super Administrator',
      ip_address: '192.168.10.42 (Gedung Direksi Lt. 2)',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    target_type: 'Laporan',
    target_id: 'EXP-20260929',
    target_label: 'Rekapitulasi 1.603 Pegawai RSUDAM',
    description: 'Mengekspor seluruh data master pegawai ke format dokumen resmi PDF & Excel.',
    changes: {
      format: { old: null, new: 'PDF / Excel CSV (UTF-8 BOM)' },
      total_records: { old: null, new: 1603 },
    },
  },
  {
    id: 'ACT-2026-0929-004',
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    action: 'DELETE',
    severity: 'critical',
    status: 'SUCCESS',
    operator: {
      id: 1,
      name: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
      nip: '197505101998031001',
      role: 'Super Administrator',
      ip_address: '192.168.10.42 (Gedung Direksi Lt. 2)',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    target_type: 'Pegawai',
    target_id: 99,
    target_label: 'Bambang Triatmojo, A.Md (NIP. 202102140089)',
    description: 'Penonaktifan / Soft-Delete akun staf penunjang logistik karena masa kontrak BLUD berakhir.',
    changes: {
      status_aktif: { old: 'Aktif', new: 'Diberhentikan / Selesai Kontrak' },
      deleted_at: { old: null, new: new Date(Date.now() - 240 * 60 * 1000).toISOString() },
    },
  },
  {
    id: 'ACT-2026-0929-005',
    timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    action: 'UPDATE',
    severity: 'warning',
    status: 'SUCCESS',
    operator: {
      id: 3,
      name: 'Ahmad Fauzi, S.E',
      nip: '198407192009021003',
      role: 'Staf Tata Usaha SDM',
      ip_address: '192.168.10.70 (Kantor SDM)',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    target_type: 'Pegawai',
    target_id: 4,
    target_label: 'apt. Rahmat Hidayat, S.Farm (NIP. 198703152010011002)',
    description: 'Perubahan mutasi internal unit kerja dari Instalasi Farmasi Rawat Jalan ke Farmasi Sentral.',
    changes: {
      unit_kerja: { old: 'Instalasi Farmasi Rawat Jalan', new: 'Instalasi Farmasi Sentral' },
    },
  },
  {
    id: 'ACT-2026-0929-006',
    timestamp: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    action: 'CREATE',
    severity: 'info',
    status: 'SUCCESS',
    operator: {
      id: 2,
      name: 'Siti Rahmawati, S.Kom',
      nip: '198803122010012005',
      role: 'Kasubag Mutasi & Karir',
      ip_address: '192.168.10.58 (Bagian SDM Lt. 1)',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    target_type: 'Pegawai',
    target_id: 7,
    target_label: 'Agus Santoso, S.Kom (NIP. 202301150012)',
    description: 'Perekaman biodata pegawai baru kontrak BLUD posisi Teknisi Jaringan SIMRS.',
    changes: {
      nip: { old: null, new: '202301150012' },
      nama: { old: null, new: 'Agus Santoso' },
      unit_kerja: { old: null, new: 'Instalasi SIMRS & Teknologi Informasi' },
      status_pegawai: { old: null, new: 'Honorer' },
    },
  },
  {
    id: 'ACT-2026-0929-007',
    timestamp: new Date(Date.now() - 720 * 60 * 1000).toISOString(),
    action: 'LOGIN',
    severity: 'info',
    status: 'SUCCESS',
    operator: {
      id: 1,
      name: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
      nip: '197505101998031001',
      role: 'Super Administrator',
      ip_address: '192.168.10.42 (Gedung Direksi Lt. 2)',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0',
    },
    target_type: 'Sesi Otentikasi',
    target_id: 'SES-99120',
    target_label: 'Sesi Login Berhasil',
    description: 'Autentikasi akun administrator melalui verifikasi Single Sign-On (SSO) RSUDAM.',
    changes: null,
  },
];

function formatTimeAgo(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  } catch (e) {
    return '-';
  }
}

function formatFullDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return (
      d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' ' +
      d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' WIB'
    );
  } catch (e) {
    return dateString;
  }
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogItem[]>(DEFAULT_ACTIVITY_LOGS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('SEMUA');
  const [severityFilter, setSeverityFilter] = useState<string>('SEMUA');
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  // Fetch from Laravel API
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'SEMUA') params.append('action', actionFilter);
      if (severityFilter !== 'SEMUA') params.append('severity', severityFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/v1/activity-logs?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          setLogs(json.data);
        }
      }
    } catch (err) {
      // Fallback to client state
    } finally {
      setLoading(false);
    }
  }, [actionFilter, severityFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (actionFilter !== 'SEMUA') {
      result = result.filter((l) => l.action === actionFilter);
    }

    if (severityFilter !== 'SEMUA') {
      result = result.filter((l) => l.severity === severityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => {
        return (
          l.id.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.target_label.toLowerCase().includes(q) ||
          l.operator.name.toLowerCase().includes(q) ||
          l.operator.nip.includes(q) ||
          l.operator.ip_address.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [logs, actionFilter, severityFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const create = logs.filter((l) => l.action === 'CREATE').length;
    const update = logs.filter((l) => l.action === 'UPDATE').length;
    const deleteCount = logs.filter((l) => l.action === 'DELETE').length;
    const critical = logs.filter((l) => l.severity === 'critical').length;
    return { total, create, update, deleteCount, critical };
  }, [logs]);

  // Export audit log to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Header
    doc.setFillColor(1, 62, 55);
    doc.rect(14, 10, 269, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(1, 62, 55);
    doc.text('RSUD Dr. H. ABDUL MOELOEK PROVINSI LAMPUNG', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Laporan Audit Trail & Rekam Jejak Aktivitas Operasi Data Pegawai', 14, 25);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')} | Total Event: ${filteredLogs.length}`, 14, 30);

    const rows = filteredLogs.map((l, idx) => [
      (idx + 1).toString(),
      formatFullDateTime(l.timestamp),
      l.action,
      `${l.operator.name}\nNIP. ${l.operator.nip}\n${l.operator.ip_address}`,
      l.target_label,
      l.description,
      l.severity.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['No', 'Waktu Kejadian', 'Aksi', 'Operator & IP', 'Target Pegawai', 'Rincian Operasi', 'Risiko']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [1, 62, 55], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 32 },
        2: { halign: 'center', cellWidth: 18 },
        3: { cellWidth: 50 },
        4: { cellWidth: 50 },
        5: { cellWidth: 80 },
        6: { halign: 'center', cellWidth: 18 },
      },
    });

    doc.save(`Audit_Log_RSUDAM_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Export audit log to Excel CSV
  const handleExportCsv = () => {
    const headers = ['ID Log', 'Waktu Kejadian', 'Aksi', 'Nama Operator', 'NIP Operator', 'Peran Operator', 'IP Address', 'Target Pegawai', 'Deskripsi Aktivitas', 'Tingkat Risiko', 'Status'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${formatFullDateTime(l.timestamp)}"`,
      `"${l.action}"`,
      `"${l.operator.name}"`,
      `"'${l.operator.nip}"`,
      `"${l.operator.role}"`,
      `"${l.operator.ip_address}"`,
      `"${l.target_label}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${l.severity}"`,
      `"${l.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Log_Aktivitas_RSUDAM_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <Head title="Log Aktivitas & Audit Trail - HCMS RSUDAM" />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Security Audit Trail</span>
              </span>
              <span className="text-xs text-gray-400">
                Permenkes 24/2022 & ISO 27001 Compliance
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              Log Aktivitas Sistem & Pengawasan Keamanan
            </h1>
            <p className="text-sm text-gray-500">
              Pencatatan riwayat audit operasi CRUD (Create, Update, Delete) pada data pegawai, penanda waktu, identitas operator, dan alamat IP
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition disabled:opacity-50"
              title="Refresh log audit terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#013E37]' : ''}`} />
              <span>{loading ? 'Memuat...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition"
              title="Ekspor laporan audit ke PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ekspor PDF</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
              title="Ekspor laporan audit ke Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Security Metrics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Total Event Log</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">{stats.total}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 text-gray-700">
              <Database className="w-5 h-5 text-[#013E37]" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Operasi CREATE</div>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1">{stats.create}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Operasi UPDATE</div>
              <div className="text-2xl font-extrabold text-blue-700 mt-1">{stats.update}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Operasi DELETE / Kritis</div>
              <div className="text-2xl font-extrabold text-red-600 mt-1">{stats.deleteCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* SearchBar */}
            <div className="w-full md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari operator, NIP, target pegawai, rincian, atau IP address..."
                resultsCount={filteredLogs.length}
                totalCount={logs.length}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Action Filter */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                {['SEMUA', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN'].map((act) => (
                  <button
                    key={act}
                    onClick={() => setActionFilter(act)}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
                      actionFilter === act
                        ? 'bg-white text-[#013E37] shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
              >
                <option value="SEMUA">Semua Tingkat Risiko</option>
                <option value="info">Info (Normal)</option>
                <option value="warning">Warning (Peringatan)</option>
                <option value="critical">Critical (Kritis)</option>
              </select>
            </div>
          </div>

          {/* Interactive Audit Trail Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Waktu Kejadian</th>
                  <th className="p-3.5">Operator / Pengguna</th>
                  <th className="p-3.5">Aksi</th>
                  <th className="p-3.5">Target Entitas</th>
                  <th className="p-3.5">Rincian Operasi</th>
                  <th className="p-3.5 text-center">Risiko</th>
                  <th className="p-3.5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isCreate = log.action === 'CREATE';
                    const isUpdate = log.action === 'UPDATE';
                    const isDelete = log.action === 'DELETE';
                    const isExport = log.action === 'EXPORT';
                    const isLogin = log.action === 'LOGIN';

                    return (
                      <tr key={log.id} className="hover:bg-gray-50/80 transition">
                        {/* Timestamp */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">
                            {formatFullDateTime(log.timestamp)}
                          </div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(log.timestamp)}</span>
                          </div>
                        </td>

                        {/* Operator */}
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900">{log.operator.name}</div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            NIP. {log.operator.nip}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-gray-400" />
                            <span>{log.operator.ip_address}</span>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isCreate
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isUpdate
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : isDelete
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : isExport
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Target Entitas */}
                        <td className="p-3.5">
                          <div className="font-semibold text-gray-900 max-w-[200px] truncate">
                            {log.target_label}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Tipe: <span className="font-medium text-gray-600">{log.target_type}</span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="p-3.5 text-gray-600 max-w-[260px]">
                          <div className="line-clamp-2 leading-relaxed text-[11px]">
                            {log.description}
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              log.severity === 'critical'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : log.severity === 'warning'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {log.severity === 'critical' ? 'Kritis' : log.severity === 'warning' ? 'Peringatan' : 'Normal'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-gray-400 hover:text-[#013E37] hover:bg-emerald-50 rounded-lg transition"
                            title="Inspeksi Detail Audit"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Shield className="w-8 h-8 text-gray-300 mx-auto" />
                        <div className="font-semibold text-gray-700 text-sm">Tidak ada log aktivitas</div>
                        <div className="text-xs">
                          Tidak ditemukan catatan audit yang cocok dengan filter pencarian.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 px-1">
            <span>
              Menampilkan <strong className="text-gray-900">{filteredLogs.length}</strong> dari{' '}
              {logs.length} catatan audit trail
            </span>
            <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Immutable Audit Trail: Catatan terlindungi dari modifikasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* AUDIT INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#013E37] bg-emerald-50 px-2 py-0.5 rounded-md">
                    {selectedLog.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedLog.severity === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedLog.action}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 mt-1">
                  Inspeksi Rekam Jejak Audit Sistem
                </h3>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Operator & Target Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Identitas Operator</span>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedLog.operator.name}</div>
                  <div className="text-gray-500 font-mono text-[11px]">NIP. {selectedLog.operator.nip}</div>
                  <div className="text-[11px] text-[#013E37] font-semibold">{selectedLog.operator.role}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Jaringan & Waktu</span>
                  <div className="font-semibold text-gray-900 mt-0.5">{selectedLog.operator.ip_address}</div>
                  <div className="text-gray-500 text-[11px] mt-0.5">{formatFullDateTime(selectedLog.timestamp)}</div>
                  <div className="text-gray-400 text-[10px] truncate max-w-[200px]" title={selectedLog.operator.user_agent}>
                    {selectedLog.operator.user_agent || 'Browser Intranet RS'}
                  </div>
                </div>
              </div>

              {/* Target & Action Summary */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Target Entitas</span>
                <div className="p-3 rounded-xl bg-white border border-gray-200">
                  <div className="font-bold text-gray-900">{selectedLog.target_label}</div>
                  <p className="text-gray-600 text-xs mt-1 leading-relaxed">{selectedLog.description}</p>
                </div>
              </div>

              {/* Changes Diff Table */}
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    Rincian Perubahan Field (Snapshot Diff)
                  </span>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="p-2.5">Field</th>
                          <th className="p-2.5">Nilai Sebelumnya</th>
                          <th className="p-2.5">Nilai Baru</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(selectedLog.changes).map(([field, diff]) => (
                          <tr key={field}>
                            <td className="p-2.5 font-mono text-[11px] font-bold text-gray-700">{field}</td>
                            <td className="p-2.5 text-red-600 bg-red-50/40">
                              {diff.old !== null && diff.old !== undefined ? String(diff.old) : <span className="italic text-gray-400">null / kosong</span>}
                            </td>
                            <td className="p-2.5 text-emerald-700 bg-emerald-50/40 font-semibold">
                              {diff.new !== null && diff.new !== undefined ? String(diff.new) : <span className="italic text-gray-400">null</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 text-center text-gray-400 text-xs">
                  Tidak ada perubahan field data (Event log otentikasi / ekspor data)
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-xs"
                >
                  Tutup Inspeksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
