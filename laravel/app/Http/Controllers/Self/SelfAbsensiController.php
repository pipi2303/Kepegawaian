<?php

namespace App\Http\Controllers\Self;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Pengaturan;
use App\Services\GPSValidasiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SelfAbsensiController extends Controller
{
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'latitude'    => 'required|numeric|between:-90,90',
            'longitude'   => 'required|numeric|between:-180,180',
            'foto_selfie' => 'nullable|string',
        ]);

        $pegawai = $request->user();
        $today   = now()->toDateString();

        $existing = Absensi::where('pegawai_id', $pegawai->id)->where('tanggal', $today)->first();
        if ($existing?->jam_masuk) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Anda sudah check-in hari ini pukul ' . $existing->jam_masuk,
            ], 422);
        }

        $gps = GPSValidasiService::validasi((float) $request->latitude, (float) $request->longitude);

        if (Pengaturan::get('gps_wajib') === 'true' && !$gps['valid']) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Lokasi Anda (' . $gps['jarak'] . ' m) di luar radius RS (' . $gps['radius'] . ' m).',
                'data'    => $gps,
            ], 422);
        }

        $fotoPath = null;
        if ($request->filled('foto_selfie') && str_starts_with($request->foto_selfie, 'data:image')) {
            $image    = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $request->foto_selfie));
            $filename = "selfie/{$pegawai->id}_{$today}.jpg";
            Storage::disk('public')->put($filename, $image);
            $fotoPath = $filename;
        }

        $jamMasuk = now()->format('H:i:s');
        $batas    = '07:52:30';
        $menit    = $jamMasuk > $batas ? (int) ((strtotime($jamMasuk) - strtotime($batas)) / 60) : 0;

        Absensi::updateOrCreate(
            ['pegawai_id' => $pegawai->id, 'tanggal' => $today],
            [
                'jam_masuk'       => $jamMasuk,
                'status'          => $menit > 0 ? 'Terlambat' : 'Hadir',
                'menit_terlambat' => $menit,
                'latitude'        => $request->latitude,
                'longitude'       => $request->longitude,
                'lokasi_valid'    => $gps['valid'],
                'jarak_dari_rs'   => $gps['jarak'],
                'lokasi'          => 'Self-service via HCMS Mobile',
                'bukti_foto'      => $fotoPath,
            ]
        );

        return response()->json([
            'status'  => 'success',
            'message' => $menit > 0 ? "Check-in berhasil. Anda terlambat {$menit} menit." : 'Check-in berhasil. Tepat waktu!',
            'data'    => ['jam_masuk' => $jamMasuk, 'menit_terlambat' => $menit, 'jarak_dari_rs' => $gps['jarak'], 'lokasi_valid' => $gps['valid']],
        ]);
    }

    public function checkOut(Request $request): JsonResponse
    {
        $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $pegawai   = $request->user();
        $absensi   = Absensi::where('pegawai_id', $pegawai->id)
            ->where('tanggal', now()->toDateString())
            ->firstOrFail();

        $jamKeluar = now()->format('H:i:s');
        $absensi->update(['jam_keluar' => $jamKeluar]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Check-out berhasil.',
            'data'    => ['jam_keluar' => $jamKeluar],
        ]);
    }

    public function riwayat(Request $request): JsonResponse
    {
        $pegawai = $request->user();
        $bulan   = now()->month;
        $tahun   = now()->year;

        $riwayat = Absensi::where('pegawai_id', $pegawai->id)
            ->where('tanggal', '>=', now()->subDays(30)->toDateString())
            ->orderByDesc('tanggal')
            ->get();

        $stats = Absensi::where('pegawai_id', $pegawai->id)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->selectRaw("SUM(status IN ('Hadir','Terlambat')) as hadir, SUM(menit_terlambat > 0) as terlambat, SUM(status='Alpha') as alpha")
            ->first();

        return response()->json([
            'status' => 'success',
            'data'   => ['riwayat' => $riwayat, 'stats' => $stats],
        ]);
    }
}
