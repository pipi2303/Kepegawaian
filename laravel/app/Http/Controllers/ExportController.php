<?php

namespace App\Http\Controllers;

use App\Exports\AbsensiExport;
use App\Exports\CutiExport;
use App\Exports\PegawaiExport;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportController extends Controller
{
    public function pegawai(Request $request): BinaryFileResponse
    {
        $this->authorize('pegawai.view');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Pegawai',
            targetLabel: 'Export Data Pegawai Aktif',
            description: 'Export Excel data seluruh pegawai aktif',
            request: $request,
        );

        $filename = 'pegawai_aktif_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new PegawaiExport(), $filename);
    }

    public function absensi(Request $request): BinaryFileResponse
    {
        $this->authorize('absensi.export');

        $validated = $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000|max:2100',
            'unit_kerja' => 'nullable|string|max:100',
        ]);

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Absensi',
            targetLabel: "Export Absensi {$validated['bulan']}/{$validated['tahun']}",
            description: "Export Excel data absensi bulan {$validated['bulan']} tahun {$validated['tahun']}",
            request: $request,
        );

        $filename = 'absensi_' . $validated['bulan'] . '_' . $validated['tahun'] . '_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(
            new AbsensiExport($validated['bulan'], $validated['tahun'], $validated['unit_kerja'] ?? null),
            $filename,
        );
    }

    public function cuti(Request $request): BinaryFileResponse
    {
        $this->authorize('cuti.view-all');

        $validated = $request->validate([
            'tahun'  => 'required|integer|min:2000|max:2100',
            'status' => 'nullable|string|in:Pending,Disetujui,Ditolak,Dibatalkan',
        ]);

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Cuti',
            targetLabel: "Export Cuti {$validated['tahun']}",
            description: "Export Excel data cuti tahun {$validated['tahun']}" . ($validated['status'] ?? ''),
            request: $request,
        );

        $filename = 'cuti_' . $validated['tahun'] . '_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(
            new CutiExport($validated['tahun'], $validated['status'] ?? null),
            $filename,
        );
    }
}
