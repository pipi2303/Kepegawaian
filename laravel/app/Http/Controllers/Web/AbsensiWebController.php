<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Pegawai;
use App\Services\AbsensiService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AbsensiWebController extends Controller
{
    protected AbsensiService $absensiService;

    public function __construct(AbsensiService $absensiService)
    {
        $this->absensiService = $absensiService;
    }

    /**
     * Halaman Presensi Rumah Sakit
     */
    public function index(Request $request): Response
    {
        $today = now()->toDateString();
        $bulan = (int) $request->input('bulan', now()->month);
        $tahun = (int) $request->input('tahun', now()->year);

        // Rekapitulasi Presensi Hari Ini
        $absensiHariIni = Absensi::with('pegawai:id,nip,nama,jabatan,unit_kerja')
            ->where('tanggal', $today)
            ->latest('jam_masuk')
            ->paginate(15);

        // Ringkasan Statistik
        $rekap = $this->absensiService->getRekapBulanan($bulan, $tahun);

        return Inertia::render('Absensi', [
            'absensiHariIni' => $absensiHariIni,
            'rekapBulanan' => $rekap,
            'currentPeriod' => ['bulan' => $bulan, 'tahun' => $tahun],
        ]);
    }

    /**
     * Check-In Cepat dari Web Portal
     */
    public function checkIn(Request $request): RedirectResponse
    {
        $pegawai = $request->user()?->pegawai ?: Pegawai::first();
        $this->absensiService->recordCheckIn($pegawai, 'Web Portal HCMS RSUDAM');

        return redirect()->back()->with('success', 'Presensi masuk berhasil dicatat.');
    }

    /**
     * Check-Out Cepat dari Web Portal
     */
    public function checkOut(Request $request): RedirectResponse
    {
        $pegawai = $request->user()?->pegawai ?: Pegawai::first();
        $this->absensiService->recordCheckOut($pegawai);

        return redirect()->back()->with('success', 'Presensi pulang berhasil dicatat.');
    }
}
