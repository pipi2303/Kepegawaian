<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LaporanController extends Controller
{
    // KARS/JCI accreditation compliance stats
    public function kepatuhanKARS(): JsonResponse
    {
        $nakesKeywords = ['Dokter', 'Perawat', 'Bidan', 'Apoteker', 'Fisioterapis', 'Radiografer', 'Analis'];

        $nakesQuery = DB::table('m_pegawai')->where('status_aktif', 'Aktif');
        foreach ($nakesKeywords as $k) {
            $nakesQuery->orWhere('jabatan', 'like', "%{$k}%");
        }
        // reset and rebuild with proper grouping
        $totalNakes = DB::table('m_pegawai')
            ->where('status_aktif', 'Aktif')
            ->where(function ($q) use ($nakesKeywords) {
                foreach ($nakesKeywords as $k) {
                    $q->orWhere('jabatan', 'like', "%{$k}%");
                }
            })
            ->count();

        $strValid = DB::table('t_str_records as s')
            ->join('m_pegawai as p', 'p.id', '=', 's.pegawai_id')
            ->where('p.status_aktif', 'Aktif')
            ->where(function ($q) use ($nakesKeywords) {
                foreach ($nakesKeywords as $k) {
                    $q->orWhere('p.jabatan', 'like', "%{$k}%");
                }
            })
            ->where('s.tanggal_kadaluarsa', '>', now()->toDateString())
            ->distinct('s.pegawai_id')
            ->count('s.pegawai_id');

        $sipValid = DB::table('t_sip_records as s')
            ->join('m_pegawai as p', 'p.id', '=', 's.pegawai_id')
            ->where('p.status_aktif', 'Aktif')
            ->where(function ($q) use ($nakesKeywords) {
                foreach ($nakesKeywords as $k) {
                    $q->orWhere('p.jabatan', 'like', "%{$k}%");
                }
            })
            ->where('s.tanggal_kadaluarsa', '>', now()->toDateString())
            ->distinct('s.pegawai_id')
            ->count('s.pegawai_id');

        $totalPegawai = DB::table('m_pegawai')->where('status_aktif', 'Aktif')->count();

        $mcuCoverage = DB::table('t_mcu_pegawai')
            ->where('tanggal_mcu', '>=', now()->subYear()->toDateString())
            ->distinct('pegawai_id')
            ->count('pegawai_id');

        $vaksinasiCoverage = DB::table('t_vaksinasi_pegawai')
            ->where('jenis_vaksin', 'like', '%Hepatitis%')
            ->distinct('pegawai_id')
            ->count('pegawai_id');

        $insidenYtd = DB::table('t_insiden_k3rs')
            ->whereYear('tanggal', now()->year)
            ->selectRaw('tingkat_keparahan, COUNT(*) as jumlah')
            ->groupBy('tingkat_keparahan')
            ->pluck('jumlah', 'tingkat_keparahan');

        $credentialingActive = DB::table('t_str_records')
            ->where('status', 'SPK Aktif')
            ->count();

        return response()->json([
            'status'       => 'success',
            'generated_at' => now()->toIso8601String(),
            'data'         => [
                'str_completeness'    => $totalNakes > 0 ? round(($strValid / $totalNakes) * 100, 1) : 0,
                'sip_completeness'    => $totalNakes > 0 ? round(($sipValid / $totalNakes) * 100, 1) : 0,
                'mcu_coverage'        => $totalPegawai > 0 ? round(($mcuCoverage / $totalPegawai) * 100, 1) : 0,
                'vaksinasi_coverage'  => $totalPegawai > 0 ? round(($vaksinasiCoverage / $totalPegawai) * 100, 1) : 0,
                'insiden_ytd'         => $insidenYtd,
                'credentialing_active'=> $credentialingActive,
                'total_nakes'         => $totalNakes,
                'total_pegawai'       => $totalPegawai,
            ],
        ]);
    }

    // Monthly attendance summary for a given year
    public function absensiTahunan(Request $request): JsonResponse
    {
        $tahun = $request->integer('tahun', now()->year);

        $data = DB::table('t_absensi')
            ->whereYear('tanggal', $tahun)
            ->selectRaw('
                MONTH(tanggal) as bulan,
                COUNT(DISTINCT tanggal) as total_hari_kerja,
                ROUND(SUM(status IN (\'Hadir\',\'Terlambat\')) / COUNT(*) * 100, 1) as rata_kehadiran,
                SUM(status = \'Terlambat\') as total_terlambat,
                SUM(status = \'Alpha\') as total_alpha
            ')
            ->groupBy('bulan')
            ->orderBy('bulan')
            ->get();

        return response()->json(['status' => 'success', 'tahun' => $tahun, 'data' => $data]);
    }

    // Employee turnover last 3 years
    public function turnoverPegawai(Request $request): JsonResponse
    {
        $years = collect(range(now()->year - 2, now()->year));

        $data = $years->map(function ($tahun) {
            $masuk = DB::table('m_pegawai')
                ->whereYear('tanggal_masuk', $tahun)
                ->count();

            $keluar = DB::table('m_pegawai')
                ->whereIn('status_aktif', ['Diberhentikan', 'Pensiun'])
                ->whereYear('updated_at', $tahun)
                ->count();

            return ['tahun' => $tahun, 'jumlah_masuk' => $masuk, 'jumlah_keluar' => $keluar];
        });

        return response()->json(['status' => 'success', 'data' => $data]);
    }

    // Payroll summary for a given month/year
    public function rekapPayroll(Request $request): JsonResponse
    {
        $request->validate(['bulan' => 'required|integer|between:1,12', 'tahun' => 'required|integer']);

        $bulan = $request->integer('bulan');
        $tahun = $request->integer('tahun');

        $rows = DB::table('t_gaji_header as g')
            ->join('m_pegawai as p', 'p.id', '=', 'g.pegawai_id')
            ->where('g.bulan', $bulan)
            ->where('g.tahun', $tahun)
            ->selectRaw('
                p.status_pegawai,
                COUNT(*) as jumlah_pegawai,
                SUM(g.total_bruto) as total_bruto,
                SUM(g.total_potongan) as total_potongan,
                SUM(g.total_netto) as total_netto
            ')
            ->groupBy('p.status_pegawai')
            ->get();

        $totals = [
            'total_pegawai_digaji' => $rows->sum('jumlah_pegawai'),
            'total_bruto'          => $rows->sum('total_bruto'),
            'total_potongan'       => $rows->sum('total_potongan'),
            'total_netto'          => $rows->sum('total_netto'),
        ];

        return response()->json([
            'status'  => 'success',
            'bulan'   => $bulan,
            'tahun'   => $tahun,
            'data'    => $rows,
            'totals'  => $totals,
        ]);
    }
}
