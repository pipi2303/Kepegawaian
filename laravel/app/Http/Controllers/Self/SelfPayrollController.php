<?php

namespace App\Http\Controllers\Self;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\GajiHeader;
use App\Models\Pengaturan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SelfPayrollController extends Controller
{
    public function index(): JsonResponse
    {
        $gaji = GajiHeader::where('pegawai_id', auth()->id())
            ->with('details')
            ->orderByDesc('tahun')
            ->orderByDesc('bulan')
            ->paginate(12);

        return response()->json(['status' => 'success', 'data' => $gaji]);
    }

    public function pdf(Request $request, GajiHeader $gaji): Response
    {
        if ($gaji->pegawai_id !== auth()->id()) {
            abort(403, 'Anda tidak memiliki akses untuk slip gaji ini.');
        }

        $gaji->load(['pegawai', 'details']);

        $namaRs   = Pengaturan::get('nama_rs', 'Rumah Sakit');
        $bulanNama = $gaji->nama_bulan;

        $details = [
            'penerimaan' => $gaji->details->where('jenis', 'Penerimaan')->values(),
            'potongan'   => $gaji->details->where('jenis', 'Potongan')->values(),
        ];

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'SlipGaji',
            targetId: $gaji->id,
            targetLabel: "Slip Gaji {$gaji->pegawai->nip} {$bulanNama} {$gaji->tahun}",
            description: "Self-service: download PDF slip gaji periode {$bulanNama} {$gaji->tahun}.",
            request: $request,
        );

        $pdf = Pdf::loadView('pdf.slip_gaji', compact('gaji', 'namaRs', 'details', 'bulanNama'))
            ->setPaper('a4', 'portrait');

        $filename = "slip_gaji_{$gaji->pegawai->nip}_{$gaji->bulan}_{$gaji->tahun}.pdf";

        return $pdf->download($filename);
    }
}
