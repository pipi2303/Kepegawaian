<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\GajiHeader;
use App\Models\Pengaturan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SlipGajiPdfController extends Controller
{
    public function download(Request $request, GajiHeader $gaji): Response
    {
        $user = auth()->user();

        // Non-admin/HR can only download their own slip
        if (! ($user->can('payroll.view-all'))) {
            if ($gaji->pegawai_id !== $user->id) {
                abort(403, 'Anda tidak memiliki akses untuk slip gaji ini.');
            }
            $this->authorize('payroll.view-own');
        }

        $gaji->load(['pegawai', 'details']);

        $namaRs   = Pengaturan::get('nama_rs', 'Rumah Sakit');
        $bulanNama = $gaji->nama_bulan;

        $details = [
            'penerimaan' => $gaji->details->where('jenis', 'Penerimaan')->values(),
            'potongan'   => $gaji->details->where('jenis', 'Potongan')->values(),
        ];

        $pdf = Pdf::loadView('pdf.slip_gaji', compact('gaji', 'namaRs', 'details', 'bulanNama'))
            ->setPaper('a4', 'portrait');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'SlipGaji',
            targetLabel: "Slip Gaji {$gaji->pegawai->nip} {$bulanNama} {$gaji->tahun}",
            description: "Download PDF slip gaji pegawai {$gaji->pegawai->nip} periode {$bulanNama} {$gaji->tahun}",
            targetId: $gaji->id,
            request: $request,
        );

        $filename = "slip_gaji_{$gaji->pegawai->nip}_{$gaji->bulan}_{$gaji->tahun}.pdf";

        return $pdf->download($filename);
    }
}
