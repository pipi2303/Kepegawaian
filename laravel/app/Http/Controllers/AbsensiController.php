<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Models\Absensi;
use App\Models\Pengaturan;
use App\Services\AbsensiService;
use App\Services\GPSValidasiService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class AbsensiController extends Controller
{
    protected AbsensiService $absensiService;

    public function __construct(AbsensiService $absensiService)
    {
        $this->absensiService = $absensiService;
    }

    private function saveSelfie(string $base64, int|string $pegawaiId, string $date): string
    {
        $image    = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $base64));
        $filename = "selfie/{$pegawaiId}_{$date}.jpg";
        Storage::disk('public')->put($filename, $image);
        return $filename;
    }

    /**
     * Catat Presensi Check-In (Masuk)
     */
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'pegawai_id'  => 'required|exists:m_pegawai,id',
            'lokasi'      => 'nullable|string|max:150',
            'bukti_foto'  => 'nullable|string',
            'latitude'    => 'nullable|numeric|between:-90,90',
            'longitude'   => 'nullable|numeric|between:-180,180',
            'foto_selfie' => 'nullable|string',
        ]);

        $pegawai   = Pegawai::findOrFail($request->input('pegawai_id'));
        $gpsResult = null;

        if ($request->filled('latitude') && $request->filled('longitude')) {
            $gpsResult = GPSValidasiService::validasi(
                (float) $request->latitude,
                (float) $request->longitude
            );
            if (Pengaturan::get('gps_wajib') === 'true' && !$gpsResult['valid']) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Lokasi Anda (' . $gpsResult['jarak'] . ' m) di luar radius RS (' . $gpsResult['radius'] . ' m).',
                    'data'    => $gpsResult,
                ], 422);
            }
        }

        $buktiPath = $request->input('bukti_foto');
        if ($request->filled('foto_selfie') && str_starts_with($request->foto_selfie, 'data:image')) {
            $buktiPath = $this->saveSelfie($request->foto_selfie, $pegawai->id, now()->toDateString());
        }

        $absensi = $this->absensiService->recordCheckIn(
            $pegawai,
            $request->input('lokasi'),
            $buktiPath,
            $gpsResult
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Presensi masuk berhasil dicatat.',
            'data'    => $absensi,
        ]);
    }

    /**
     * Catat Presensi Check-Out (Pulang)
     */
    public function checkOut(Request $request): JsonResponse
    {
        $request->validate([
            'pegawai_id' => 'required|exists:m_pegawai,id',
            'latitude'   => 'nullable|numeric|between:-90,90',
            'longitude'  => 'nullable|numeric|between:-180,180',
        ]);

        $pegawai   = Pegawai::findOrFail($request->input('pegawai_id'));
        $gpsResult = null;

        if ($request->filled('latitude') && $request->filled('longitude')) {
            $gpsResult = GPSValidasiService::validasi(
                (float) $request->latitude,
                (float) $request->longitude
            );
        }

        $absensi = $this->absensiService->recordCheckOut($pegawai, $gpsResult);

        return response()->json([
            'status'  => 'success',
            'message' => 'Presensi pulang berhasil dicatat.',
            'data'    => $absensi,
        ]);
    }

    /**
     * Laporan Rekapitulasi Presensi Bulanan
     */
    public function rekapBulanan(Request $request): JsonResponse
    {
        $bulan = (int) $request->input('bulan', now()->month);
        $tahun = (int) $request->input('tahun', now()->year);
        $unitKerja = $request->input('unit_kerja');

        $rekap = $this->absensiService->getRekapBulanan($bulan, $tahun, $unitKerja);

        return response()->json([
            'status' => 'success',
            'data' => $rekap,
        ]);
    }
}
