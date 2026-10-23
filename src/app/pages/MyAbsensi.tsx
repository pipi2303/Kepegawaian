import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Camera, CheckCircle, Clock, Loader2, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { selfAbsensiApi } from '../data/api';

type Coords = { latitude: number; longitude: number };
type GPSState = 'idle' | 'loading' | 'ok' | 'error';

function statusBadge(jam_masuk?: string, jam_keluar?: string) {
  if (!jam_masuk) return { label: 'BELUM CHECK-IN', cls: 'bg-gray-100 text-gray-500' };
  if (!jam_keluar) return { label: `HADIR · JAM ${jam_masuk.slice(0, 5)}`, cls: 'bg-green-100 text-green-700' };
  return { label: `SUDAH PULANG · ${jam_keluar.slice(0, 5)}`, cls: 'bg-blue-100 text-blue-700' };
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' });
}

export default function MyAbsensi() {
  const qc = useQueryClient();
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const [coords, setCoords]         = useState<Coords | null>(null);
  const [gpsState, setGpsState]     = useState<GPSState>('idle');
  const [gpsError, setGpsError]     = useState('');
  const [selfieB64, setSelfieB64]   = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [phase, setPhase]           = useState<'idle' | 'preview'>('idle');

  const { data, isLoading } = useQuery({
    queryKey: ['self-absensi'],
    queryFn: selfAbsensiApi.riwayat,
  });

  const today = data?.data?.riwayat?.[0]?.tanggal === new Date().toISOString().slice(0, 10)
    ? data.data.riwayat[0]
    : null;
  const stats  = data?.data?.stats ?? { hadir: 0, terlambat: 0, alpha: 0 };
  const riwayat: any[] = data?.data?.riwayat ?? [];

  const badge = statusBadge(today?.jam_masuk, today?.jam_keluar);

  const checkInMut = useMutation({
    mutationFn: selfAbsensiApi.checkIn,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['self-absensi'] });
      toast.success(res.message ?? 'Check-in berhasil');
      setPhase('idle'); setCoords(null); setSelfieB64(''); setSelfiePreview('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Check-in gagal'),
  });

  const checkOutMut = useMutation({
    mutationFn: selfAbsensiApi.checkOut,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['self-absensi'] }); toast.success('Check-out berhasil'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Check-out gagal'),
  });

  function handleCheckInStart() {
    setGpsState('loading');
    setPhase('preview');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsState('ok');
      },
      (err) => {
        setGpsError(err.message);
        setGpsState('error');
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  }

  function handleSelfieCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setSelfieB64(result);
      setSelfiePreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleConfirmCheckIn() {
    if (!coords) return;
    checkInMut.mutate({ ...coords, foto_selfie: selfieB64 || undefined });
  }

  function handleCheckOut() {
    if (!coords && !today?.jam_masuk) { toast.error('Aktifkan GPS terlebih dahulu'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => checkOutMut.mutate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => toast.error('Gagal mendapatkan lokasi GPS'),
      { timeout: 8000, maximumAge: 30000 }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#013E37]" />
      </div>
    );
  }

  const canCheckIn  = !today?.jam_masuk;
  const canCheckOut = !!today?.jam_masuk && !today?.jam_keluar;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Absensi Saya</h1>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${badge.cls}`}>
          <CheckCircle className="w-4 h-4" />
          {badge.label}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCheckInStart}
            disabled={!canCheckIn || phase === 'preview'}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#013E37] text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-[#025046] transition-colors"
          >
            <LogIn className="w-4 h-4" />
            CHECK-IN SEKARANG
          </button>
          <button
            onClick={handleCheckOut}
            disabled={!canCheckOut || checkOutMut.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            {checkOutMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            CHECK-OUT
          </button>
        </div>
      </div>

      {/* Check-in flow preview */}
      {phase === 'preview' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Konfirmasi Kehadiran</h2>

          {/* GPS status */}
          {gpsState === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Mendapatkan lokasi GPS...
            </div>
          )}
          {gpsState === 'error' && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">GPS error: {gpsError}. Pastikan izin lokasi diaktifkan.</p>
            </div>
          )}
          {gpsState === 'ok' && coords && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Lokasi berhasil didapat</p>
                <p className="text-xs text-green-700 font-mono">{coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</p>
                <p className="text-xs text-green-600 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
          )}

          {/* Selfie capture */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Foto Selfie (opsional)</p>
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleSelfieCapture}
            />
            <button
              onClick={() => selfieInputRef.current?.click()}
              className="flex items-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-600 hover:border-[#013E37] hover:text-[#013E37] transition-colors"
            >
              <Camera className="w-4 h-4" />
              {selfiePreview ? 'Ganti Selfie' : 'Ambil Foto Selfie'}
            </button>
            {selfiePreview && (
              <img
                src={selfiePreview}
                alt="selfie preview"
                className="mt-2 w-24 h-24 object-cover rounded-xl border border-gray-200"
              />
            )}
          </div>

          {/* Confirm */}
          <div className="flex gap-2">
            <button
              onClick={() => { setPhase('idle'); setCoords(null); setSelfieB64(''); setSelfiePreview(''); setGpsState('idle'); }}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmCheckIn}
              disabled={gpsState !== 'ok' || checkInMut.isPending}
              className="flex-1 py-2.5 bg-[#013E37] text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-[#025046] transition-colors"
            >
              {checkInMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Konfirmasi Check-In'}
            </button>
          </div>
        </div>
      )}

      {/* Stats pills */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hadir', value: stats.hadir ?? 0, cls: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Terlambat', value: stats.terlambat ?? 0, cls: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Alpha', value: stats.alpha ?? 0, cls: 'bg-red-50 text-red-700 border-red-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.cls}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Riwayat list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Riwayat 30 Hari</h2>
        </div>
        {riwayat.length === 0 ? (
          <p className="p-5 text-sm text-gray-400 text-center">Belum ada data absensi</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {riwayat.map((r: any) => (
              <li key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{formatTanggal(r.tanggal)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.jam_masuk ? r.jam_masuk.slice(0, 5) : '--:--'}
                    {' — '}
                    {r.jam_keluar ? r.jam_keluar.slice(0, 5) : '--:--'}
                    {r.jarak_dari_rs != null && (
                      <span className="ml-2">
                        <MapPin className="w-3 h-3 inline" /> {r.jarak_dari_rs} m
                      </span>
                    )}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  r.status === 'Hadir'     ? 'bg-green-100 text-green-700' :
                  r.status === 'Terlambat' ? 'bg-amber-100 text-amber-700' :
                  r.status === 'Alpha'     ? 'bg-red-100 text-red-700'     :
                                             'bg-gray-100 text-gray-500'
                }`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
