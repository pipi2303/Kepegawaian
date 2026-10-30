import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import http from '../lib/http';

type TargetKinerja = {
  uraianKegiatan: string;
  target: number;
  realisasi?: number;
  nilaiCapaian?: number;
  satuan?: string;
};

type SKPHeader = {
  id: number;
  tahun: number;
  semester: 1 | 2;
  nilai_akhir?: number;
  predikat?: string;
  status: string;
  catatan_atasan?: string;
  targetKinerja?: TargetKinerja[];
};

const predikatConfig: Record<string, { label: string; color: string; bg: string }> = {
  'Sangat Baik': { label: 'Sangat Baik', color: 'text-green-700', bg: 'bg-green-100' },
  'Baik':        { label: 'Baik',        color: 'text-blue-700',  bg: 'bg-blue-100'  },
  'Cukup':       { label: 'Cukup',       color: 'text-yellow-700',bg: 'bg-yellow-100'},
  'Kurang':      { label: 'Kurang',      color: 'text-red-700',   bg: 'bg-red-100'   },
};

const nilaiColor = (nilai?: number) => {
  if (nilai == null) return 'text-gray-400';
  if (nilai >= 90) return 'text-green-600';
  if (nilai >= 76) return 'text-blue-600';
  if (nilai >= 61) return 'text-yellow-600';
  return 'text-red-600';
};

function SKPCard({ skp }: { skp: SKPHeader }) {
  const [open, setOpen] = useState(false);
  const pd = skp.predikat ? (predikatConfig[skp.predikat] ?? null) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <span className={`text-xl font-bold ${nilaiColor(skp.nilai_akhir)}`}>
              {skp.nilai_akhir != null ? skp.nilai_akhir.toFixed(1) : '—'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              Tahun {skp.tahun} · Semester {skp.semester}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {pd && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pd.color} ${pd.bg}`}>
                  {pd.label}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {skp.status}
              </span>
            </div>
          </div>
        </div>
        {skp.targetKinerja && skp.targetKinerja.length > 0 && (
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {open ? 'Tutup' : 'Detail'}
          </button>
        )}
      </div>

      {open && skp.targetKinerja && skp.targetKinerja.length > 0 && (
        <div className="border-t border-gray-100 px-5 pb-5">
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 pr-3 font-medium">Uraian Kegiatan</th>
                  <th className="text-center py-2 px-2 font-medium">Target</th>
                  <th className="text-center py-2 px-2 font-medium">Realisasi</th>
                  <th className="text-center py-2 px-2 font-medium">Capaian</th>
                </tr>
              </thead>
              <tbody>
                {skp.targetKinerja.map((t, i) => {
                  const capaian =
                    t.nilaiCapaian != null
                      ? t.nilaiCapaian
                      : t.target > 0 && t.realisasi != null
                      ? Math.round((t.realisasi / t.target) * 100)
                      : null;
                  return (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-3 text-gray-700">{t.uraianKegiatan}</td>
                      <td className="py-2 px-2 text-center text-gray-600">
                        {t.target}{t.satuan ? ` ${t.satuan}` : ''}
                      </td>
                      <td className="py-2 px-2 text-center text-gray-600">
                        {t.realisasi != null ? `${t.realisasi}${t.satuan ? ` ${t.satuan}` : ''}` : '—'}
                      </td>
                      <td className={`py-2 px-2 text-center font-medium ${nilaiColor(capaian ?? undefined)}`}>
                        {capaian != null ? `${capaian}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {skp.catatan_atasan && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
              <span className="font-medium">Catatan Atasan: </span>
              {skp.catatan_atasan}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MySKP() {
  const { data, isLoading } = useQuery({
    queryKey: ['self-skp'],
    queryFn: () =>
      http.get('/self/skp').then(r => {
        const d = r.data;
        return (d?.data?.data ?? d?.data ?? d ?? []) as SKPHeader[];
      }),
    staleTime: 60000,
    throwOnError: false,
    meta: {
      onError: () => toast.error('Gagal memuat data SKP'),
    },
  });

  const list: SKPHeader[] = data ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Target size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sasaran Kinerja Saya</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Riwayat penilaian SKP per semester — nilai akhir dan capaian target kinerja Anda.
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Target size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada data SKP</p>
            <p className="text-gray-400 text-sm mt-1">Data akan muncul setelah penilaian SKP diinput oleh atasan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(skp => <SKPCard key={skp.id} skp={skp} />)}
          </div>
        )}
      </div>
    </div>
  );
}
