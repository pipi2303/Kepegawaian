import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Hospital, ArrowRight, ArrowLeft, Check, SkipForward,
  Upload, MapPin, Users, Building2, Wifi,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { pengaturanApi, pegawaiApi } from '../data/api';
import http from '../lib/http';

const TOTAL_STEPS = 6;

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={step}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                done    ? 'bg-[#013E37] text-[#FFEFB2]'
                : active ? 'bg-[#FFEFB2] text-[#013E37] ring-2 ring-[#013E37]'
                : 'bg-gray-100 text-gray-400'
              }`}
            >
              {done ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < TOTAL_STEPS && (
              <div className={`flex-1 h-0.5 ${step < current ? 'bg-[#013E37]' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Nav buttons ───────────────────────────────────────────────────────────────
function NavRow({
  onBack, onNext, onSkip, nextLabel = 'Lanjutkan', loading = false, showBack = true,
}: {
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  loading?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-8">
      <div>
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onSkip && (
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <SkipForward className="w-4 h-4" /> Lewati
          </button>
        )}
        <button
          onClick={onNext}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#013E37] text-[#FFEFB2] rounded-lg text-sm font-medium hover:bg-[#025046] disabled:opacity-50 transition-colors"
        >
          {loading ? <span className="w-4 h-4 border-2 border-[#FFEFB2] border-t-transparent rounded-full animate-spin" /> : null}
          {nextLabel} {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-[#013E37]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Hospital className="w-10 h-10 text-[#013E37]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang di HCMS</h1>
      <p className="text-gray-500 mb-8">Ikuti panduan singkat untuk mengatur sistem kepegawaian RS Anda</p>
      <ul className="text-left space-y-3 mb-8 max-w-sm mx-auto">
        {[
          'Identitas dan profil rumah sakit',
          'Akun administrator sistem',
          'Import data pegawai',
          'Konfigurasi GPS & absensi',
        ].map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-5 h-5 rounded-full bg-[#013E37]/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-[#013E37]" />
            </div>
            {item}
          </li>
        ))}
      </ul>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-3 bg-[#013E37] text-[#FFEFB2] rounded-lg font-medium hover:bg-[#025046] transition-colors"
      >
        Mulai Setup <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Step 2: RS Identity ───────────────────────────────────────────────────────
type PengaturanData = Record<string, string>;

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [form, setForm] = useState<PengaturanData>({
    nama_rs: '', kota_rs: '', kelas_rs: 'B', akreditasi_rs: '',
    alamat_rs: '', no_telp_rs: '', email_rs: '', direktur_rs: '',
  });
  const [loading, setLoading] = useState(false);

  // Pre-fill from server
  React.useEffect(() => {
    pengaturanApi.get().then((d: PengaturanData) => {
      setForm(f => ({ ...f, ...d }));
    }).catch(() => {});
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleNext = async () => {
    if (!form.nama_rs.trim()) { toast.error('Nama RS wajib diisi'); return; }
    setLoading(true);
    try {
      await pengaturanApi.update(form);
      onNext();
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, k, type = 'text', required = false }: { label: string; k: string; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        type={type}
        value={form[k] ?? ''}
        onChange={set(k)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30 focus:border-[#013E37]"
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-[#013E37]" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Identitas Rumah Sakit</h2>
          <p className="text-sm text-gray-500">Data ini ditampilkan di seluruh dokumen kepegawaian</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Field label="Nama Rumah Sakit" k="nama_rs" required /></div>
        <Field label="Kota" k="kota_rs" />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Kelas RS</label>
          <select value={form.kelas_rs ?? 'B'} onChange={set('kelas_rs')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30">
            {['A', 'B', 'C', 'D'].map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <Field label="Akreditasi" k="akreditasi_rs" />
        <Field label="No. Telepon" k="no_telp_rs" type="tel" />
        <Field label="Email RS" k="email_rs" type="email" />
        <Field label="Nama Direktur" k="direktur_rs" />
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Alamat</label>
          <textarea
            value={form.alamat_rs ?? ''}
            onChange={set('alamat_rs')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30 resize-none"
          />
        </div>
      </div>

      <NavRow onBack={onBack} onNext={handleNext} nextLabel="Simpan & Lanjutkan" loading={loading} />
    </div>
  );
}

// ── Step 3: Admin account ─────────────────────────────────────────────────────
function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { currentUser } = useAppContext();
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-[#013E37]" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Akun Administrator</h2>
          <p className="text-sm text-gray-500">Satu akun admin sudah dibuat saat instalasi</p>
        </div>
      </div>

      <div className="bg-[#013E37]/5 rounded-xl p-4 mb-6">
        <p className="text-xs font-medium text-gray-500 mb-1">Akun aktif saat ini</p>
        <p className="font-semibold text-gray-900">{currentUser?.nama ?? '-'}</p>
        <p className="text-sm text-gray-500">NIP: {currentUser?.nip ?? '-'} · Peran: {currentUser?.role ?? '-'}</p>
      </div>

      <p className="text-sm text-gray-600 mb-4">Perlu menambah admin lain? Anda bisa melakukannya kapan saja dari halaman Data Pegawai.</p>
      <a
        href="#/pegawai"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-[#013E37] font-medium hover:underline"
      >
        <Users className="w-4 h-4" /> Tambah Admin Lain (buka di tab baru)
      </a>

      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ── Step 4: Import Pegawai ────────────────────────────────────────────────────
function Step4({ onNext, onBack, onSkippedImport }: { onNext: () => void; onBack: () => void; onSkippedImport: (s: boolean) => void }) {
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const res = await pegawaiApi.import(file);
      const d = (res as any).data?.data ?? (res as any).data ?? {};
      setResult({ success: d.success ?? d.inserted ?? 0, failed: d.failed ?? d.errors ?? 0 });
      toast.success('Import selesai');
      onSkippedImport(false);
    } catch {
      toast.error('Gagal mengimport file');
    } finally {
      setLoading(false);
    }
  }, [onSkippedImport]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-[#013E37]" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Import Data Pegawai</h2>
          <p className="text-sm text-gray-500">Upload CSV atau input manual nanti</p>
        </div>
      </div>

      {result ? (
        <div className="rounded-xl border border-gray-200 p-5 mb-4">
          <p className="font-semibold text-gray-800 mb-2">Hasil Import</p>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{result.success}</p>
              <p className="text-xs text-gray-500">Berhasil</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{result.failed}</p>
              <p className="text-xs text-gray-500">Gagal</p>
            </div>
          </div>
        </div>
      ) : (
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
            dragging ? 'border-[#013E37] bg-[#013E37]/5' : 'border-gray-300 hover:border-[#013E37]/50'
          }`}
        >
          <input type="file" accept=".csv,.xlsx" className="hidden" onChange={onFileChange} />
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#013E37] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Mengimport...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Seret file CSV/XLSX ke sini</p>
              <p className="text-xs text-gray-400 mt-1">atau klik untuk memilih file</p>
            </>
          )}
        </label>
      )}

      <NavRow
        onBack={onBack}
        onNext={onNext}
        onSkip={() => { onSkippedImport(true); onNext(); }}
        nextLabel="Lanjutkan"
      />
    </div>
  );
}

// ── Step 5: GPS Config ────────────────────────────────────────────────────────
function Step5({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [form, setForm] = useState({ lat_rs: '', lng_rs: '', radius_meter: '200', gps_wajib: 'false' });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  React.useEffect(() => {
    pengaturanApi.get().then((d: PengaturanData) => {
      setForm(f => ({
        lat_rs: d.lat_rs ?? f.lat_rs,
        lng_rs: d.lng_rs ?? f.lng_rs,
        radius_meter: d.radius_meter ?? f.radius_meter,
        gps_wajib: d.gps_wajib ?? f.gps_wajib,
      }));
    }).catch(() => {});
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const useMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat_rs: String(pos.coords.latitude), lng_rs: String(pos.coords.longitude) }));
        setLocating(false);
      },
      () => { toast.error('Gagal mendapatkan lokasi'); setLocating(false); },
    );
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      await pengaturanApi.update(form);
      onNext();
    } catch {
      toast.error('Gagal menyimpan pengaturan GPS');
    } finally {
      setLoading(false);
    }
  };

  const mapsUrl = form.lat_rs && form.lng_rs
    ? `https://maps.google.com/?q=${form.lat_rs},${form.lng_rs}`
    : 'https://maps.google.com';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-[#013E37]" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Konfigurasi GPS & Absensi</h2>
          <p className="text-sm text-gray-500">Tentukan lokasi RS untuk validasi absensi berbasis GPS</p>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="rounded-xl bg-gray-100 h-32 flex items-center justify-center mb-5 text-gray-400 text-sm gap-2">
        <MapPin className="w-5 h-5" />
        {form.lat_rs && form.lng_rs
          ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[#013E37] hover:underline font-medium">
              Lihat di Google Maps ({form.lat_rs}, {form.lng_rs})
            </a>
          : <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[#013E37] hover:underline">
              Temukan koordinat RS di Google Maps
            </a>
        }
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {[
          { label: 'Latitude RS', k: 'lat_rs' },
          { label: 'Longitude RS', k: 'lng_rs' },
        ].map(({ label, k }) => (
          <div key={k}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
              type="text"
              value={form[k as keyof typeof form]}
              onChange={set(k)}
              placeholder="-5.3971"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Radius Absensi (meter)</label>
          <input
            type="number"
            value={form.radius_meter}
            onChange={set('radius_meter')}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#013E37]/30"
          />
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, gps_wajib: f.gps_wajib === 'true' ? 'false' : 'true' }))}
              className={`w-10 h-6 rounded-full relative transition-colors ${form.gps_wajib === 'true' ? 'bg-[#013E37]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.gps_wajib === 'true' ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-700">GPS Wajib</span>
          </label>
        </div>
      </div>

      <button
        onClick={useMyLocation}
        disabled={locating}
        className="flex items-center gap-2 text-sm text-[#013E37] font-medium hover:underline disabled:opacity-50"
      >
        <Wifi className="w-4 h-4" />
        {locating ? 'Mendapatkan lokasi...' : 'Gunakan Lokasi Saya'}
      </button>

      <NavRow onBack={onBack} onNext={handleNext} onSkip={onNext} loading={loading} />
    </div>
  );
}

// ── Step 6: Done ──────────────────────────────────────────────────────────────
function Step6({ onBack, skippedImport }: { onBack: () => void; skippedImport: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      await http.post('/api/v1/onboarding/complete');
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      toast.success('Setup selesai! Selamat datang di HCMS 🎉');
      navigate('/', { replace: true });
    } catch {
      toast.error('Gagal menyelesaikan setup');
    } finally {
      setLoading(false);
    }
  };

  const checks = [
    { label: 'Identitas Rumah Sakit', done: true },
    { label: 'Akun Administrator', done: true },
    { label: skippedImport ? 'Import Pegawai (dilewati)' : 'Data Pegawai Diimport', done: !skippedImport, skipped: skippedImport },
    { label: 'Konfigurasi GPS & Absensi', done: true },
  ];

  return (
    <div className="text-center">
      {/* CSS confetti — simple colored dots */}
      <div className="relative mb-6">
        <div className="text-5xl mb-2" aria-hidden>🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">Setup Selesai!</h2>
        <p className="text-gray-500 mt-1">HCMS siap digunakan di rumah sakit Anda</p>
      </div>

      <ul className="text-left space-y-3 max-w-xs mx-auto mb-8">
        {checks.map(({ label, done, skipped }) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span className={`text-base ${done ? 'text-green-500' : skipped ? 'text-gray-400' : 'text-green-500'}`}>
              {skipped ? '⏭' : '✅'}
            </span>
            <span className={skipped ? 'text-gray-400' : 'text-gray-700'}>{label}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-center gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <button
          onClick={finish}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-[#013E37] text-[#FFEFB2] rounded-lg font-medium hover:bg-[#025046] disabled:opacity-50 transition-colors"
        >
          {loading && <span className="w-4 h-4 border-2 border-[#FFEFB2] border-t-transparent rounded-full animate-spin" />}
          Menuju Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Onboarding page ──────────────────────────────────────────────────────
export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [skippedImport, setSkippedImport] = useState(false);

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const saveStep = (n: number) => {
    setStep(n);
    // Best-effort — don't block UI on failure
    http.post('/api/v1/onboarding/step', { step: n }).catch(() => {});
  };

  const advance = () => saveStep(Math.min(step + 1, TOTAL_STEPS));
  const retreat = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl p-8">
        <StepDots current={step} />

        {step === 1 && <Step1 onNext={advance} />}
        {step === 2 && <Step2 onNext={advance} onBack={retreat} />}
        {step === 3 && <Step3 onNext={advance} onBack={retreat} />}
        {step === 4 && (
          <Step4
            onNext={advance}
            onBack={retreat}
            onSkippedImport={setSkippedImport}
          />
        )}
        {step === 5 && <Step5 onNext={advance} onBack={retreat} />}
        {step === 6 && <Step6 onBack={retreat} skippedImport={skippedImport} />}
      </div>
    </div>
  );
}
