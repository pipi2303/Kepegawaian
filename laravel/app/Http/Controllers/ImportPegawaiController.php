<?php

namespace App\Http\Controllers;

use App\Imports\PegawaiImport;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ImportPegawaiController extends Controller
{
    /**
     * Download CSV template dengan 2 contoh baris
     */
    public function template(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'nip', 'nama', 'gelar_depan', 'gelar_belakang', 'jenis_kelamin',
            'tempat_lahir', 'tanggal_lahir', 'email', 'no_telp',
            'jabatan', 'unit_kerja', 'golongan', 'pangkat',
            'status_pegawai', 'tanggal_masuk',
        ];

        $examples = [
            ['199001010001', 'Budi Santoso', 'dr.', 'Sp.PD', 'L', 'Jakarta', '1990-01-01', 'budi@rs.id', '081234567890', 'Dokter Spesialis', 'Poli Dalam', 'III/c', 'Penata', 'PNS', '2015-03-01'],
            ['199205150002', 'Siti Rahayu', '', 'S.Kep', 'P', 'Surabaya', '1992-05-15', 'siti@rs.id', '087654321098', 'Perawat', 'ICU', 'II/d', 'Pengatur Tk.I', 'PNS', '2018-06-01'],
        ];

        return response()->streamDownload(function () use ($headers, $examples) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($examples as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, 'template_import_pegawai.csv', ['Content-Type' => 'text/csv']);
    }

    /**
     * Proses upload dan import file
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('pegawai.create');

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $file     = $request->file('file');
        $filename = $file->getClientOriginalName();
        $import   = new PegawaiImport();

        $log = \DB::table('import_logs')->insertGetId([
            'pegawai_id' => auth()->id(),
            'filename'   => $filename,
            'status'     => 'processing',
            'created_at' => now(),
        ]);

        try {
            Excel::import($import, $file);

            $failures   = $import->getFailures();
            $totalRows  = $import->getRowCount();
            $failCount  = count($failures);
            $successCount = max(0, $totalRows - $failCount);

            \DB::table('import_logs')->where('id', $log)->update([
                'total_rows'   => $totalRows,
                'success_rows' => $successCount,
                'failed_rows'  => $failCount,
                'errors'       => $failCount ? json_encode($failures) : null,
                'status'       => 'completed',
            ]);

            ActivityLog::record(
                action: 'IMPORT',
                targetType: 'Pegawai',
                targetLabel: $filename,
                description: 'Import data pegawai dari file ' . $filename . '. Berhasil: ' . $successCount . ', Gagal: ' . $failCount,
                request: $request,
            );

            return response()->json([
                'status'  => 'success',
                'success' => $successCount,
                'failed'  => $failCount,
                'errors'  => $failures,
            ]);
        } catch (\Throwable $e) {
            \DB::table('import_logs')->where('id', $log)->update([
                'status' => 'failed',
                'errors' => json_encode([['errors' => [$e->getMessage()]]]),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Import gagal: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Riwayat import
     */
    public function history(Request $request): JsonResponse
    {
        $logs = \DB::table('import_logs as il')
            ->leftJoin('m_pegawai as p', 'p.id', '=', 'il.pegawai_id')
            ->select('il.*', 'p.nama as operator_nama')
            ->orderByDesc('il.created_at')
            ->paginate(15);

        return response()->json(['status' => 'success', 'data' => $logs]);
    }
}
