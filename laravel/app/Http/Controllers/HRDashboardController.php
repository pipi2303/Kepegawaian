<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use App\Models\DokumenKompetensi;
use App\Models\Diklat;
use App\Models\ExitInterview;
use App\Models\GajiHeader;
use App\Models\Lembur;
use App\Models\OppeFppe;
use App\Models\Pegawai;
use App\Models\SipRecord;
use App\Models\StrRecord;
use App\Models\TPPBulanan;
use App\Models\WisnPerhitungan;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HRDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $tahun = now()->year;
        $today = now()->toDateString();
        $d12   = now()->subMonths(12)->toDateString();

        // ── Headcount trend 12 bulan ─────────────────────────────────────────
        $headcountTrend = [];
        for ($i = 11; $i >= 0; $i--) {
            $tgl = now()->subMonths($i);
            $headcountTrend[] = [
                'bulan'  => $tgl->format('M y'),
                'aktif'  => Pegawai::where('status_aktif', true)
                    ->where('tanggal_masuk', '<=', $tgl->endOfMonth()->toDateString())
                    ->count(),
            ];
        }

        // ── Komposisi pegawai ────────────────────────────────────────────────
        $totalAktif = Pegawai::where('status_aktif', true)->count();
        $komposisi  = Pegawai::where('status_aktif', true)
            ->selectRaw('status_pegawai, count(*) as jumlah')
            ->groupBy('status_pegawai')
            ->pluck('jumlah', 'status_pegawai');

        // ── Turnover rate (12 bulan) ─────────────────────────────────────────
        $exitCount    = ExitInterview::whereBetween('tanggal_akhir_kerja', [$d12, $today])->count();
        $turnoverRate = $totalAktif > 0 ? round($exitCount / $totalAktif * 100, 1) : 0;
        $alasanTurnover = ExitInterview::whereBetween('tanggal_akhir_kerja', [$d12, $today])
            ->selectRaw('alasan_utama, count(*) as jumlah')
            ->groupBy('alasan_utama')->orderByDesc('jumlah')
            ->limit(5)->pluck('jumlah', 'alasan_utama');

        // ── Absenteeism rate (bulan ini) ────────────────────────────────────
        $hariKerjaBulanIni = 22; // estimasi
        $alphaCount = Absensi::whereMonth('tanggal', now()->month)->whereYear('tanggal', $tahun)
            ->whereIn('status_kehadiran', ['Alpha', 'Sakit Tanpa Surat'])->count();
        $absenteeismRate = $totalAktif > 0
            ? round($alphaCount / ($totalAktif * $hariKerjaBulanIni) * 100, 2) : 0;

        // ── Training hours ───────────────────────────────────────────────────
        $diklatTahunIni   = Diklat::where('tahun', $tahun)->where('status', 'Selesai')->sum('jumlah_jam');
        $targetJamPerOrang = 40;
        $targetTotalJam    = $totalAktif * $targetJamPerOrang;
        $diklatPct         = $targetTotalJam > 0 ? round($diklatTahunIni / $targetTotalJam * 100, 1) : 0;

        // ── OPPE compliance ──────────────────────────────────────────────────
        $oppeSemester = 'Semester ' . (now()->month <= 6 ? '1' : '2') . ' ' . $tahun;
        $oppeSelesai  = OppeFppe::where('periode', $oppeSemester)->where('status', 'Selesai')->count();
        $oppeTotal    = OppeFppe::where('periode', $oppeSemester)->count();
        $oppePct      = $oppeTotal > 0 ? round($oppeSelesai / $oppeTotal * 100, 1) : 0;

        // ── WISN gap summary ─────────────────────────────────────────────────
        $wisnGap = WisnPerhitungan::where('periode', (string) $tahun)
            ->where('status', 'Kekurangan')
            ->selectRaw('unit_kerja, jabatan_kategori, kebutuhan_sdmk, jumlah_aktual, wisn_ratio')
            ->orderBy('wisn_ratio')
            ->limit(5)->get();

        // ── Lisensi expiry (90 hari) ─────────────────────────────────────────
        $strExpiring  = StrRecord::expiringWithin(90)->count();
        $sipExpiring  = SipRecord::expiringWithin(90)->count();
        $dokExpiring  = DokumenKompetensi::expiringWithin(90)->count();

        // ── Biaya SDM bulan ini ──────────────────────────────────────────────
        $totalGaji = GajiHeader::whereMonth('created_at', now()->month)
            ->whereYear('created_at', $tahun)->sum('total_netto');
        $totalTPP  = TPPBulanan::where('bulan', now()->month)->where('tahun', $tahun)
            ->where('status', '!=', 'Draft')->sum('total_tpp');
        $totalLembur = Lembur::whereMonth('tanggal', now()->month)->whereYear('tanggal', $tahun)
            ->where('status', 'Disetujui')->sum('upah_lembur');

        return response()->json([
            'status' => 'success',
            'data'   => [
                'headcount'       => [
                    'total_aktif' => $totalAktif,
                    'komposisi'   => $komposisi,
                    'trend'       => $headcountTrend,
                ],
                'turnover'        => [
                    'rate_persen'    => $turnoverRate,
                    'exit_12bulan'   => $exitCount,
                    'alasan_top'     => $alasanTurnover,
                ],
                'absenteeism'     => [
                    'rate_persen'    => $absenteeismRate,
                    'alpha_bulanini' => $alphaCount,
                ],
                'training'        => [
                    'jam_realisasi'  => (float) $diklatTahunIni,
                    'jam_target'     => $targetTotalJam,
                    'pct_tercapai'   => $diklatPct,
                ],
                'oppe'            => [
                    'pct_compliance' => $oppePct,
                    'selesai'        => $oppeSelesai,
                    'total'          => $oppeTotal,
                    'periode'        => $oppeSemester,
                ],
                'wisn_gap'        => $wisnGap,
                'lisensi_expiry'  => [
                    'str' => $strExpiring,
                    'sip' => $sipExpiring,
                    'dok' => $dokExpiring,
                ],
                'biaya_sdm'       => [
                    'gaji'   => (float) $totalGaji,
                    'tpp'    => (float) $totalTPP,
                    'lembur' => (float) $totalLembur,
                    'total'  => (float) ($totalGaji + $totalTPP + $totalLembur),
                ],
            ],
        ]);
    }
}
