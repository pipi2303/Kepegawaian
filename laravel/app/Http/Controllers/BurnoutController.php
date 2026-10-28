<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use App\Models\JadwalShift;
use App\Models\Pegawai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BurnoutController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $unit   = $request->input('unit_kerja');
        $today  = now()->toDateString();
        $d60    = now()->subDays(60)->toDateString();
        $d30    = now()->subDays(30)->toDateString();
        $d30b   = now()->subDays(31)->subDays(29)->toDateString(); // 30–60 days ago window

        $query = Pegawai::where('status_aktif', true);
        if ($unit) $query->where('unit_kerja', $unit);

        $pegawai = $query->get(['id', 'nama', 'jabatan', 'unit_kerja', 'tanggal_masuk']);

        $results = [];

        foreach ($pegawai as $p) {
            // Alpha/Izin/Sakit 60 hari terakhir
            $alpha60 = Absensi::where('pegawai_id', $p->id)
                ->whereBetween('tanggal', [$d60, $today])
                ->whereIn('status_kehadiran', ['Alpha', 'Izin', 'Sakit Tanpa Surat'])
                ->count();

            // Tren: 30 hari terakhir vs 30 hari sebelumnya
            $alpha30  = Absensi::where('pegawai_id', $p->id)
                ->whereBetween('tanggal', [$d30, $today])
                ->whereIn('status_kehadiran', ['Alpha', 'Izin', 'Sakit Tanpa Surat'])
                ->count();
            $alphaPrev = $alpha60 - $alpha30;
            $trenNaik  = $alpha30 > $alphaPrev;

            // Max malam berturut-turut (30 hari terakhir)
            $malamShifts = JadwalShift::where('pegawai_id', $p->id)
                ->where('jenis_shift', 'Malam')
                ->whereBetween('tanggal', [$d30, $today])
                ->orderBy('tanggal')
                ->pluck('tanggal')
                ->map(fn ($d) => $d->toDateString())
                ->toArray();

            $malamMax = 0;
            $malamCur = 0;
            $prevDate = null;
            foreach ($malamShifts as $dt) {
                if ($prevDate && date_diff(date_create($prevDate), date_create($dt))->days === 1) {
                    $malamCur++;
                } else {
                    $malamCur = 1;
                }
                $malamMax = max($malamMax, $malamCur);
                $prevDate = $dt;
            }

            // Bulan tanpa cuti tahunan tahun ini
            $bulanDenganCuti = DB::table('t_cuti')
                ->where('pegawai_id', $p->id)
                ->whereYear('tanggal_mulai', now()->year)
                ->where('status', 'Disetujui')
                ->where('jenis_cuti', 'like', '%Tahunan%')
                ->selectRaw('DISTINCT MONTH(tanggal_mulai) as bln')
                ->pluck('bln')->count();
            $bulanTanpaCuti = now()->month - $bulanDenganCuti;

            // Skor burnout (0–100)
            $alphaScore = min($alpha60 * 5, 40);
            $trenScore  = $trenNaik ? 20 : 0;
            $malamScore = min($malamMax * 4, 20);
            $cutiScore  = min(max($bulanTanpaCuti, 0) * 4, 20);
            $skor       = $alphaScore + $trenScore + $malamScore + $cutiScore;

            $risiko = match (true) {
                $skor >= 60 => 'Tinggi',
                $skor >= 35 => 'Sedang',
                default     => 'Rendah',
            };

            if ($risiko !== 'Rendah') {
                $results[] = [
                    'id'              => $p->id,
                    'nama'            => $p->nama,
                    'jabatan'         => $p->jabatan,
                    'unit_kerja'      => $p->unit_kerja,
                    'skor'            => $skor,
                    'risiko'          => $risiko,
                    'alpha_60_hari'   => $alpha60,
                    'tren_naik'       => $trenNaik,
                    'malam_max_streak'=> $malamMax,
                    'bulan_tanpa_cuti'=> max($bulanTanpaCuti, 0),
                ];
            }
        }

        usort($results, fn ($a, $b) => $b['skor'] <=> $a['skor']);

        $unitList = Pegawai::where('status_aktif', true)
            ->distinct()->whereNotNull('unit_kerja')->pluck('unit_kerja')->sort()->values();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'pegawai_risiko' => $results,
                'summary' => [
                    'tinggi'  => collect($results)->where('risiko', 'Tinggi')->count(),
                    'sedang'  => collect($results)->where('risiko', 'Sedang')->count(),
                    'total_dipantau' => count($results),
                    'total_aktif'    => $pegawai->count(),
                ],
                'unit_list' => $unitList,
            ],
        ]);
    }
}
