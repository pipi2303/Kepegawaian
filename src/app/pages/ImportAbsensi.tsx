import React, { useRef, useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { absensiImportApi } from '../data/api';

interface ImportResults {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

const FORMAT_CSV = `NIP,Tanggal,Waktu,Jenis
197505101998031001,2026-10-01,07:45:22,Check-In
197505101998031001,2026-10-01,16:02:11,Check-Out`;

const FORMAT_ZKT = `197505101998031001  2026-10-01 07:45:22  0  1
199001152005042001  2026-10-01 08:10:05  0  1
197505101998031001  2026-10-01 16:02:11  0  0`;

export default function ImportAbsensi() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [tab, setTab] = useState<'csv' | 'zkt'>('csv');

  const accept = '.csv,.xlsx,.xls,.txt,.dat';

  const handleFile = (f: File) => {
    setFile(f);
    setResults(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const downloadTemplate = async () => {
    try {
      const res = await absensiImportApi.template();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_import_absensi_mesin.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh template');
    }
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Pilih file terlebih dahulu'); return; }
    setLoading(true);
    try {
      const res = await absensiImportApi.upload(file);
      setResults(res.data.results);
      toast.success(`Import selesai: ${res.data.results.created} data baru`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Import gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-gray-800">Import Absensi Mesin Fingerprint</h1>
        <p className="text-sm text-gray-500 mt-0.5">Upload data kehadiran dari mesin ZKTeco atau file CSV standar</p>
      </div>

      {/* Section 1: Upload */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Upload File Mesin</h2>

        {/* Info */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">Mendukung format ZKTeco (.dat/.csv) dan format CSV standar. Sistem otomatis mendeteksi format dan mengelompokkan jam masuk/keluar per NIP per hari.</p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-blue-400 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={e => { e.stopPropagation(); setFile(null); setResults(null); }} className="ml-2 text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drag & drop file di sini, atau klik untuk memilih</p>
              <p className="text-xs text-gray-400 mt-1">{accept}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Download Template CSV
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <span className="animate-spin">⏳</span> : <Upload className="w-4 h-4" />}
            {loading ? 'Memproses...' : 'Upload & Proses'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="font-semibold text-sm text-gray-700">Hasil Import</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Diproses', val: results.processed, color: 'bg-blue-50 text-blue-700' },
                { label: 'Dibuat', val: results.created, color: 'bg-green-50 text-green-700' },
                { label: 'Diupdate', val: results.updated, color: 'bg-yellow-50 text-yellow-700' },
                { label: 'Dilewati', val: results.skipped, color: 'bg-gray-50 text-gray-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
                  <p className="text-2xl font-bold">{val}</p>
                  <p className="text-xs">{label}</p>
                </div>
              ))}
            </div>
            {results.errors.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-xs font-semibold text-red-700">Error ({results.errors.length})</p>
                </div>
                <ul className="space-y-1">
                  {results.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600">• {e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Panduan Format */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Panduan Format</h2>

        <div className="flex border border-gray-200 rounded-lg overflow-hidden w-fit">
          {(['csv', 'zkt'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t === 'csv' ? 'Format CSV Standar' : 'Format ZKTeco Log'}
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">
            {tab === 'csv'
              ? 'File CSV dengan header baris pertama. Kolom Jenis bisa berisi Check-In/Check-Out (opsional — sistem ambil jam paling awal sebagai masuk, paling akhir sebagai keluar).'
              : 'Format log mentah ZKTeco. Kolom 1 = NIP, Kolom 2 = datetime, Kolom 4 = 0 (check-in) atau 1 (check-out).'}
          </p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto font-mono">
            {tab === 'csv' ? FORMAT_CSV : FORMAT_ZKT}
          </pre>
        </div>
      </div>
    </div>
  );
}
