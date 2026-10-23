<?php

namespace App\Http\Controllers;

use App\Exports\BezettingExport;
use App\Exports\DUKExport;
use App\Exports\RekapAbsensiExport;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class LaporanBKDController extends Controller
{
    public function duk()
    {
        $this->authorize('pegawai.view');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Laporan BKD',
            targetLabel: 'DUK',
            description: 'Export Daftar Urut Kepangkatan (DUK)',
        );

        return Excel::download(new DUKExport(), 'DUK_' . now()->format('Y') . '.xlsx');
    }

    public function bezetting()
    {
        $this->authorize('pegawai.view');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Laporan BKD',
            targetLabel: 'Bezetting',
            description: 'Export Bezetting Pegawai',
        );

        return Excel::download(new BezettingExport(), 'Bezetting_' . now()->format('Ym') . '.xlsx');
    }

    public function rekapAbsensi(Request $request)
    {
        $this->authorize('pegawai.view');

        $data = $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000|max:2100',
        ]);

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Laporan BKD',
            targetLabel: 'Rekap Absensi',
            description: "Export Rekap Absensi {$data['bulan']}/{$data['tahun']}",
        );

        return Excel::download(
            new RekapAbsensiExport($data['bulan'], $data['tahun']),
            "Rekap_Absensi_{$data['bulan']}_{$data['tahun']}.xlsx"
        );
    }
}
