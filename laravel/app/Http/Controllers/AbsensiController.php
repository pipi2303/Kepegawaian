<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Models\Absensi;
use App\Services\AbsensiService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AbsensiController extends Controller
{
    protected AbsensiService $absensiService;

    public function __construct(AbsensiService $absensiService)
    {
        $this->absensiService = $absensiService;
    }

    /**
     * Catat Presensi Check-In (Masuk)
     */
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'pegawai_id' => 'required|exists:m_pegawai,id',
            'lokasi' => 'nullable|string|max:150',
            'bukti_foto' => 'nullable|string',
        ]);

        $pegawai = Pegawai::findOrFail($request->input('pegawai_id'));
        $absensi = $this->absensiService->recordCheckIn(
            $pegawai,
            $request->input('lokasi'),
            $request->input('bukti_foto')
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Presensi masuk berhasil dicatat.',
            'data' => $absensi,
        ]);
    }

    /**
     * Catat Presensi Check-Out (Pulang)
     */
    public function checkOut(Request $request): JsonResponse
    {
        $request->validate([
            'pegawai_id' => 'required|exists:m_pegawai,id',
        ]);

        $pegawai = Pegawai::findOrFail($request->input('pegawai_id'));
        $absensi = $this->absensiService->recordCheckOut($pegawai);

        return response()->json([
            'status' => 'success',
            'message' => 'Presensi pulang berhasil dicatat.',
            'data' => $absensi,
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
