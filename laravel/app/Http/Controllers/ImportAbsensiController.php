<?php

namespace App\Http\Controllers;

use App\Imports\AbsensiMesinImport;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ImportAbsensiController extends Controller
{
    public function template(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = ['NIP', 'Tanggal', 'Waktu', 'Jenis'];
        $examples = [
            ['197505101998031001', '2026-10-01', '07:45:22', 'Check-In'],
            ['197505101998031001', '2026-10-01', '16:02:11', 'Check-Out'],
            ['199001152005042001', '2026-10-01', '08:10:05', 'Check-In'],
        ];

        return response()->streamDownload(function () use ($headers, $examples) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($examples as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, 'template_import_absensi_mesin.csv', ['Content-Type' => 'text/csv']);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('absensi.edit');

        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls,txt|max:10240',
        ]);

        $file     = $request->file('file');
        $filename = $file->getClientOriginalName();

        $log = \DB::table('import_logs')->insertGetId([
            'pegawai_id' => auth()->id(),
            'filename'   => $filename,
            'status'     => 'processing',
            'created_at' => now(),
        ]);

        try {
            $import = new AbsensiMesinImport();
            Excel::import($import, $file);
            $results = $import->results;

            \DB::table('import_logs')->where('id', $log)->update([
                'total_rows'   => $results['processed'],
                'success_rows' => $results['created'] + $results['updated'],
                'failed_rows'  => $results['skipped'],
                'errors'       => $results['errors'] ? json_encode($results['errors']) : null,
                'status'       => 'completed',
            ]);

            ActivityLog::record(
                action: 'IMPORT',
                targetType: 'Absensi',
                targetLabel: $filename,
                description: "Import absensi mesin fingerprint. Diproses: {$results['processed']}, Dibuat: {$results['created']}, Diupdate: {$results['updated']}, Dilewati: {$results['skipped']}",
                request: $request,
            );

            return response()->json(['status' => 'success', 'results' => $results]);
        } catch (\Throwable $e) {
            \DB::table('import_logs')->where('id', $log)->update([
                'status' => 'failed',
                'errors' => json_encode([['errors' => [$e->getMessage()]]]),
            ]);

            return response()->json(['status' => 'error', 'message' => 'Import gagal: ' . $e->getMessage()], 500);
        }
    }
}
