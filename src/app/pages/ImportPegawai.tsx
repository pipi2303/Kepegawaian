import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Upload, CheckCircle, Download, RefreshCw, AlertCircle,
  FileText, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { pegawaiApi } from '../data/api';
import { downloadBlob } from '../lib/downloadBlob';
import http from '../lib/http';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ImportError {
  row: number;
  column: string;
  message: string;
}

interface ImportResult {
  success_rows: number;
  failed_rows: number;
  errors?: ImportError[];
}

interface HistoryItem {
  id: number;
  tanggal: string;
  filename: string;
  success_rows: number;
  failed_rows: number;
  status: 'success' | 'partial' | 'failed';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  success: { label: 'Sukses', cls: 'bg-green-100 text-green-700' },
  partial: { label: 'Sebagian', cls: 'bg-yellow-100 text-yellow-700' },
  failed:  { label: 'Gagal',   cls: 'bg-red-100 text-red-700' },
};

const STEPS = ['Download Template', 'Upload File', 'Hasil Import'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ImportPegawai() {
  const [step, setStep]       = useState<1 | 2 | 3>(1);
  const [file, setFile]       = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult]   = useState<ImportResult | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const [page, setPage]       = useState(1);
  const fileInputRef          = useRef<HTMLInputElement>(null);

  // Download template
  const templateMutation = useMutation({
    mutationFn: () => pegawaiApi.importTemplate(),
    onSuccess: (res) => downloadBlob(res.data as Blob, 'template_import_pegawai.csv'),
    onError: () => toast.error('Gagal mengunduh template'),
  });

  // Import
  const importMutation = useMutation({
    mutationFn: () => pegawaiApi.import(file!),
    onSuccess: (res) => { setResult(res.data as ImportResult); setStep(3); refetchHistory(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Import gagal'),
  });

  // History
  const { data: historyData, refetch: refetchHistory, isFetching: historyFetching } = useQuery<{ data: HistoryItem[]; total: number }>({
    queryKey: ['import-history', page],
    queryFn: () => http.get('/import/pegawai/history', { params: { page, per_page: 10 } }).then(r => r.data),
    retry: false,
  });

  // Drag-and-drop
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setStep(2); }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setStep(2); }
  };

  const reset = () => { setFile(null); setResult(null); setStep(1); setErrorsOpen(false); };

  const history = historyData?.data ?? [];
  const totalPages = Math.ceil((historyData?.total ?? 0) / 10);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Data Pegawai</h1>
        <p className="text-gray-500 mt-1">Unggah file CSV atau Excel untuk menambah pegawai secara massal</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const s = (i + 1) as 1 | 2 | 3;
          const active = step === s;
          const done   = step > s;
          return (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {done ? <CheckCircle size={16} /> : s}
                </div>
                <span className={`text-sm ${active ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step 1: Template ── */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-blue-800 mb-2">Panduan Import</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc ml-4">
                <li><strong>NIP</strong> — 18 digit angka tanpa spasi</li>
                <li><strong>tanggal</strong> — format YYYY-MM-DD (contoh: 1990-07-15)</li>
                <li><strong>jenis_kelamin</strong> — L (Laki-laki) atau P (Perempuan)</li>
                <li><strong>status_pegawai</strong> — PNS, PPPK, atau Honorer</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => templateMutation.mutate()}
            disabled={templateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {templateMutation.isPending
              ? <RefreshCw size={16} className="animate-spin" />
              : <Download size={16} />}
            Download Template CSV
          </button>

          <p className="text-sm text-gray-500">Atau seret &amp; lepas file CSV/Excel ke area di bawah</p>

          {/* Drop zone (also available in step 1 to jump directly) */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
          >
            <Upload size={32} className="text-gray-400" />
            <p className="text-gray-600 font-medium">Klik atau seret file CSV/XLSX</p>
            <p className="text-xs text-gray-400">Mendukung .csv, .xlsx, .xls</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {/* ── Step 2: Upload ── */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
          >
            <Upload size={32} className="text-gray-400" />
            <p className="text-gray-600 font-medium">Klik atau seret file CSV/XLSX</p>
            <p className="text-xs text-gray-400">Mendukung .csv, .xlsx, .xls</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileChange} />

          {file && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-lg">
              <CheckCircle size={16} />
              <span className="font-medium">{file.name}</span>
              <span className="text-green-500 ml-auto">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
              Kembali
            </button>
            <button
              onClick={() => importMutation.mutate()}
              disabled={!file || importMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
            >
              {importMutation.isPending
                ? <><RefreshCw size={15} className="animate-spin" /> Mengimpor...</>
                : 'Mulai Import'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Result ── */}
      {step === 3 && result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-lg">Hasil Import</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-green-50 rounded-lg p-4">
              <CheckCircle size={24} className="text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-700">{result.success_rows}</p>
                <p className="text-sm text-green-600">Baris berhasil</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-red-50 rounded-lg p-4">
              <AlertCircle size={24} className="text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-700">{result.failed_rows}</p>
                <p className="text-sm text-red-600">Baris gagal</p>
              </div>
            </div>
          </div>

          {(result.errors?.length ?? 0) > 0 && (
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setErrorsOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-50 text-sm font-medium text-red-700"
              >
                <span>{result.errors!.length} baris bermasalah</span>
                {errorsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {errorsOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-500 font-medium">Baris</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-medium">Kolom</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-medium">Pesan Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.errors!.map((err, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-gray-700">{err.row}</td>
                          <td className="px-4 py-2 text-gray-700 font-mono">{err.column}</td>
                          <td className="px-4 py-2 text-red-600">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Upload size={15} /> Import Lagi
          </button>
        </div>
      )}

      {/* ── History ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Riwayat Import</h2>
          </div>
          <button
            onClick={() => refetchHistory()}
            disabled={historyFetching}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <RefreshCw size={14} className={historyFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Belum ada riwayat import
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-gray-500 font-medium">Tanggal</th>
                    <th className="px-5 py-3 text-left text-gray-500 font-medium">File</th>
                    <th className="px-5 py-3 text-right text-gray-500 font-medium">Berhasil</th>
                    <th className="px-5 py-3 text-right text-gray-500 font-medium">Gagal</th>
                    <th className="px-5 py-3 text-left text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map(h => {
                    const st = STATUS_LABELS[h.status] ?? STATUS_LABELS.partial;
                    return (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-600">{new Date(h.tanggal).toLocaleString('id-ID')}</td>
                        <td className="px-5 py-3 text-gray-800 font-medium truncate max-w-[200px]">{h.filename}</td>
                        <td className="px-5 py-3 text-right text-green-600 font-medium">{h.success_rows}</td>
                        <td className="px-5 py-3 text-right text-red-600 font-medium">{h.failed_rows}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-40"
                >Prev</button>
                <span className="text-sm text-gray-500">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-40"
                >Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
