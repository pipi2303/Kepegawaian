<?php

namespace App\Http\Controllers;

use App\Exports\BPJSKesehatanExport;
use App\Exports\BPJSKetenagakerjaanExport;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BPJSController extends Controller
{
    public function exportTK(Request $request): BinaryFileResponse
    {
        $v = $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000|max:2100',
        ]);

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'BPJS TK',
            targetLabel: "Export BPJS Ketenagakerjaan {$v['bulan']}/{$v['tahun']}",
            description: "Export iPayroll BPJS TK bulan {$v['bulan']} tahun {$v['tahun']}",
            request: $request,
        );

        return Excel::download(
            new BPJSKetenagakerjaanExport($v['bulan'], $v['tahun']),
            "BPJS_TK_{$v['bulan']}_{$v['tahun']}.xlsx"
        );
    }

    public function exportKesehatan(Request $request): BinaryFileResponse
    {
        $v = $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000|max:2100',
        ]);

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'BPJS Kesehatan',
            targetLabel: "Export BPJS Kesehatan {$v['bulan']}/{$v['tahun']}",
            description: "Export BPJS Kesehatan bulan {$v['bulan']} tahun {$v['tahun']}",
            request: $request,
        );

        return Excel::download(
            new BPJSKesehatanExport($v['bulan'], $v['tahun']),
            "BPJS_Kes_{$v['bulan']}_{$v['tahun']}.xlsx"
        );
    }

    public function summary(Request $request)
    {
        $bulan = (int) now()->month;
        $tahun = (int) now()->year;

        $totalTK = DB::table('t_bpjs_pegawai as b')
            ->join('m_pegawai as p', 'p.id', '=', 'b.pegawai_id')
            ->where('p.status_aktif', 'Aktif')
            ->whereNotNull('b.nomor_bpjs_ketenagakerjaan')
            ->count();

        $totalKes = DB::table('t_bpjs_pegawai as b')
            ->join('m_pegawai as p', 'p.id', '=', 'b.pegawai_id')
            ->where('p.status_aktif', 'Aktif')
            ->where('b.status_bpjs_kesehatan', 'Aktif')
            ->count();

        // Sum iuran TK from gaji header for current month (JKK+JKM+JHT+JP combined ~7.04% employer + 3% employee)
        $totalGaji = DB::table('m_pegawai as p')
            ->where('p.status_aktif', 'Aktif')
            ->leftJoin('t_gaji_header as g', function ($j) use ($bulan, $tahun) {
                $j->on('g.pegawai_id', '=', 'p.id')
                  ->where('g.bulan', '=', $bulan)
                  ->where('g.tahun', '=', $tahun);
            })
            ->sum(DB::raw('COALESCE(g.gaji_pokok, 0)'));

        // ponytail: approximate totals from gaji pokok sum; per-row breakdown in export
        $iuranTK  = round($totalGaji * (0.0024 + 0.037 + 0.02 + 0.02 + 0.01 + 0.003), 0);
        $iuranKes = round($totalGaji * 0.05, 0);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'bulan'                  => $bulan,
                'tahun'                  => $tahun,
                'total_peserta_tk'       => $totalTK,
                'total_peserta_kesehatan' => $totalKes,
                'total_iuran_tk'         => $iuranTK,
                'total_iuran_kesehatan'  => $iuranKes,
            ],
        ]);
    }
}
