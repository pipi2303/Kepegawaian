<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use App\Models\Absensi;
use App\Models\Cuti;
use App\Models\StrRecord;
use App\Models\SipRecord;
use App\Models\JadwalShift;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Tampilkan Dashboard Eksekutif RS
     */
    public function index(Request $request): Response
    {
        $today = now()->toDateString();

        // 1. Metrik Kepegawaian
        $totalPegawai = Pegawai::where('status_aktif', 'Aktif')->count();
        $totalPns = Pegawai::where('status_aktif', 'Aktif')->where('status_pegawai', 'PNS')->count();
        $totalPppk = Pegawai::where('status_aktif', 'Aktif')->where('status_pegawai', 'PPPK')->count();
        $totalHonorer = Pegawai::where('status_aktif', 'Aktif')->where('status_pegawai', 'Honorer')->count();

        // 2. Metrik Presensi Hari Ini
        $absensiHariIni = Absensi::where('tanggal', $today)->get();
        $hadirHariIni = $absensiHariIni->whereIn('status', ['Hadir', 'Terlambat'])->count();
        $terlambatHariIni = $absensiHariIni->where('status', 'Terlambat')->count();
        $persentaseKehadiran = $totalPegawai > 0 ? round(($hadirHariIni / $totalPegawai) * 100, 1) : 0;

        // 3. Metrik Cuti & Lisensi Medis
        $cutiPending = Cuti::where('status', 'Pending')->count();
        $strExpiringSoon = StrRecord::expiringWithin(90)->count();
        $sipExpiringSoon = SipRecord::expiringWithin(90)->count();

        // 4. Jadwal Shift Hari Ini
        $shiftsToday = JadwalShift::with('pegawai:id,nama,jabatan,unit_kerja')
            ->where('tanggal', $today)
            ->take(10)
            ->get();

        return Inertia::render('Dashboard', [
            'metrics' => [
                'total_pegawai' => $totalPegawai,
                'pns' => $totalPns,
                'pppk' => $totalPppk,
                'honorer' => $totalHonorer,
                'hadir_hari_ini' => $hadirHariIni,
                'terlambat_hari_ini' => $terlambatHariIni,
                'persentase_kehadiran' => $persentaseKehadiran,
                'cuti_pending' => $cutiPending,
                'str_expiring_soon' => $strExpiringSoon,
                'sip_expiring_soon' => $sipExpiringSoon,
            ],
            'recentShifts' => $shiftsToday,
        ]);
    }
}
