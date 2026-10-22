<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
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

    public function index(Request $request): Response
    {
        $today = now()->toDateString();
        $bulan = (int) $request->input('bulan', now()->month);
        $tahun = (int) $request->input('tahun', now()->year);

        $absensiHariIni = Absensi::with('pegawai:id,nip,nama,jabatan,unit_kerja')
            ->where('tanggal', $today)
            ->latest('jam_masuk')
            ->paginate(15);

        $rekap = $this->absensiService->getRekapBulanan($bulan, $tahun);

        return Inertia::render('Absensi', [
            'absensiHariIni' => $absensiHariIni,
            'rekapBulanan'   => $rekap,
            'currentPeriod'  => ['bulan' => $bulan, 'tahun' => $tahun],
        ]);
    }

    public function checkIn(Request $request): RedirectResponse
    {
        // auth()->user() IS the Pegawai — tidak ada fallback ke pegawai lain
        $pegawai = $request->user() ?? abort(403, 'Anda harus login untuk mencatat presensi.');
        $this->absensiService->recordCheckIn($pegawai, 'Web Portal HCMS');

        return redirect()->back()->with('success', 'Presensi masuk berhasil dicatat.');
    }

    public function checkOut(Request $request): RedirectResponse
    {
        $pegawai = $request->user() ?? abort(403, 'Anda harus login untuk mencatat presensi.');
        $this->absensiService->recordCheckOut($pegawai);

        return redirect()->back()->with('success', 'Presensi pulang berhasil dicatat.');
    }
}
