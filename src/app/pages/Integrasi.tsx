import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  Search, Activity, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import http from '../lib/http';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceStatus {
  configured: boolean;
  last_sync: string | null;
}

interface IntegrationStatus {
  satusehat: ServiceStatus;
  siasn: ServiceStatus;
}

interface SyncResult {
  synced: number;
  failed: number;
}

interface SiasnSyncResult {
  synced_riwayat_jabatan: number;
  synced_kenaikan_pangkat: number;
}

interface LogEntry {
  id: number;
  waktu: string;
  service: 'SATUSEHAT' | 'SIASN';
  aksi: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string | null;
}

interface LogsResponse {
  data: LogEntry[];
  total: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Badge({ ok }: { ok: boolean }) {
  return ok
    ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Terkonfigurasi</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Belum dikonfigurasi</span>;
}

function ServiceBadge({ service }: { service: string }) {
  return service === 'SATUSEHAT'
    ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">SATUSEHAT</span>
    : <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">SIASN</span>;
}

function StatusBadge({ status }: { status: string }) {
  return status === 'SUCCESS'
    ? <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={13} /> Sukses</span>
    : <span className="flex items-center gap-1 text-red-600 text-sm"><XCircle size={13} /> Gagal</span>;
}

function NotConfiguredWarning({ envKey }: { envKey: string }) {
  return (
    <div className="flex items-start gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
      <span>Tambahkan <code className="font-mono bg-yellow-100 px-1 rounded">{envKey}</code> ke file <code className="font-mono bg-yellow-100 px-1 rounded">.env</code> untuk mengaktifkan integrasi ini.</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Integrasi() {
  const qc = useQueryClient();

  const [nipSatusehat, setNipSatusehat]       = useState('');
  const [practitioner, setPractitioner]       = useState<any>(null);
  const [nipSiasn, setNipSiasn]               = useState('');
  const [siasnResult, setSiasnResult]         = useState<SiasnSyncResult | null>(null);
  const [satusehatResult, setSatusehatResult] = useState<SyncResult | null>(null);
  const [logPage, setLogPage]                 = useState(1);
  const [syncInProgress, setSyncInProgress]   = useState(false);

  // Status
  const { data: status, isLoading: statusLoading } = useQuery<IntegrationStatus>({
    queryKey: ['integration-status'],
    queryFn: () => http.get('/integration/status').then(r => r.data),
    retry: false,
  });

  // Logs — auto-refresh every 10s when sync is in progress
  const { data: logsData, refetch: refetchLogs } = useQuery<LogsResponse>({
    queryKey: ['integration-logs', logPage],
    queryFn: () => http.get('/integration/logs', { params: { page: logPage, per_page: 10 } }).then(r => r.data),
    retry: false,
    refetchInterval: syncInProgress ? 10_000 : false,
  });

  // Sync SATUSEHAT all
  const syncSatusehat = useMutation({
    mutationFn: () => http.post('/integration/satusehat/sync'),
    onMutate: () => setSyncInProgress(true),
    onSuccess: (res) => {
      setSatusehatResult(res.data as SyncResult);
      toast.success('Sync SATUSEHAT selesai');
      qc.invalidateQueries({ queryKey: ['integration-logs'] });
      qc.invalidateQueries({ queryKey: ['integration-status'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Sync SATUSEHAT gagal'),
    onSettled: () => setSyncInProgress(false),
  });

  // Search practitioner
  const searchPractitioner = useMutation({
    mutationFn: (nip: string) => http.get('/integration/satusehat/practitioner', { params: { nip } }).then(r => r.data),
    onSuccess: (data) => setPractitioner(data),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Practitioner tidak ditemukan'),
  });

  // Sync SIASN
  const syncSiasn = useMutation({
    mutationFn: (pegawai_id: number) => http.post('/integration/siasn/sync', { pegawai_id }),
    onMutate: () => setSyncInProgress(true),
    onSuccess: (res) => {
      setSiasnResult(res.data as SiasnSyncResult);
      toast.success('Sync SIASN selesai');
      qc.invalidateQueries({ queryKey: ['integration-logs'] });
      qc.invalidateQueries({ queryKey: ['integration-status'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Sync SIASN gagal'),
    onSettled: () => setSyncInProgress(false),
  });

  // Sync now (individual service button)
  const syncNow = (service: 'satusehat' | 'siasn') => {
    if (service === 'satusehat') syncSatusehat.mutate();
    // SIASN sync-now from status card needs a pegawai_id — just invalidate status
    else qc.invalidateQueries({ queryKey: ['integration-status'] });
  };

  const logs = logsData?.data ?? [];
  const totalLogPages = Math.ceil((logsData?.total ?? 0) / 10);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Globe size={22} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrasi Pemerintah</h1>
          <p className="text-gray-500 text-sm">Kelola sinkronisasi SATUSEHAT &amp; SIASN</p>
        </div>
      </div>

      {/* ── Status Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['satusehat', 'siasn'] as const).map(svc => {
          const s = status?.[svc];
          return (
            <div key={svc} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 uppercase text-sm tracking-wide">{svc}</p>
                {statusLoading ? <span className="text-xs text-gray-400">Memuat...</span> : <Badge ok={!!s?.configured} />}
              </div>
              {s?.last_sync && (
                <p className="text-xs text-gray-400">
                  Sync terakhir: {new Date(s.last_sync).toLocaleString('id-ID')}
                </p>
              )}
              <button
                onClick={() => syncNow(svc)}
                disabled={!s?.configured || syncSatusehat.isPending}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <RefreshCw size={13} className={syncSatusehat.isPending && svc === 'satusehat' ? 'animate-spin' : ''} />
                Sync Sekarang
              </button>
            </div>
          );
        })}
      </div>

      {/* ── SATUSEHAT Section ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">SATUSEHAT</h2>
          <p className="text-sm text-gray-500 mt-0.5">Kementerian Kesehatan RI — Sinkronisasi data tenaga kesehatan ke platform SATUSEHAT</p>
        </div>

        {status && !status.satusehat.configured && <NotConfiguredWarning envKey="SATUSEHAT_CLIENT_ID" />}

        {/* Sync all nakes */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => syncSatusehat.mutate()}
            disabled={!status?.satusehat.configured || syncSatusehat.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
          >
            <RefreshCw size={14} className={syncSatusehat.isPending ? 'animate-spin' : ''} />
            Sync Semua Nakes
          </button>
          {satusehatResult && (
            <span className="text-sm text-gray-600">
              Disinkron: <strong className="text-green-600">{satusehatResult.synced}</strong> &nbsp;|&nbsp; Gagal: <strong className="text-red-600">{satusehatResult.failed}</strong>
            </span>
          )}
        </div>

        {/* Cari Practitioner */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Cari Practitioner</p>
          <div className="flex gap-2">
            <input
              value={nipSatusehat}
              onChange={e => setNipSatusehat(e.target.value)}
              placeholder="Masukkan NIP"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => { setPractitioner(null); searchPractitioner.mutate(nipSatusehat); }}
              disabled={!nipSatusehat.trim() || searchPractitioner.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 text-sm"
            >
              {searchPractitioner.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
              Cari
            </button>
          </div>
          {practitioner && (
            <pre className="mt-3 bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-auto max-h-64">
              {JSON.stringify(practitioner, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* ── SIASN Section ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">SIASN</h2>
          <p className="text-sm text-gray-500 mt-0.5">Badan Kepegawaian Negara — Sinkronisasi riwayat jabatan &amp; kenaikan pangkat ASN</p>
        </div>

        {status && !status.siasn.configured && <NotConfiguredWarning envKey="SIASN_CLIENT_ID" />}

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Sync per Pegawai</p>
          <div className="flex gap-2">
            <input
              value={nipSiasn}
              onChange={e => setNipSiasn(e.target.value)}
              placeholder="NIP / ID Pegawai"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => { setSiasnResult(null); syncSiasn.mutate(Number(nipSiasn)); }}
              disabled={!nipSiasn.trim() || syncSiasn.isPending || !status?.siasn.configured}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              {syncSiasn.isPending ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Sync Pegawai Ini
            </button>
          </div>
          {siasnResult && (
            <div className="mt-3 flex gap-4 text-sm">
              <span>Riwayat jabatan: <strong className="text-green-600">{siasnResult.synced_riwayat_jabatan}</strong></span>
              <span>Kenaikan pangkat: <strong className="text-green-600">{siasnResult.synced_kenaikan_pangkat}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ── Integration Logs ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Log Integrasi</h2>
            {syncInProgress && <span className="text-xs text-blue-500 animate-pulse">auto-refresh aktif</span>}
          </div>
          <button onClick={() => refetchLogs()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Belum ada log integrasi</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-gray-500 font-medium">Waktu</th>
                    <th className="px-5 py-3 text-left text-gray-500 font-medium">Service</th>
                    <th className="px-5 py-3 text-left text-gray-500 font-medium">Aksi</th>
                    <th className="px-5 py-3 text-left text-gray-500 font-medium">Status</th>
                    <th className="px-5 py-3 text-left text-gray-500 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(log.waktu).toLocaleString('id-ID')}</td>
                      <td className="px-5 py-3"><ServiceBadge service={log.service} /></td>
                      <td className="px-5 py-3 text-gray-700">{log.aksi}</td>
                      <td className="px-5 py-3"><StatusBadge status={log.status} /></td>
                      <td className="px-5 py-3 text-red-500 text-xs max-w-[200px] truncate">{log.error ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalLogPages > 1 && (
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
                <button
                  onClick={() => setLogPage(p => Math.max(1, p - 1))}
                  disabled={logPage === 1}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-sm text-gray-500">{logPage} / {totalLogPages}</span>
                <button
                  onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                  disabled={logPage === totalLogPages}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
