<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Credentialing;
use App\Models\Pegawai;
use App\Services\CredentialingService;
use App\Services\LisensiMonitoringService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class CredentialingWebController extends Controller
{
    protected CredentialingService $credService;
    protected LisensiMonitoringService $lisensiService;

    public function __construct(CredentialingService $credService, LisensiMonitoringService $lisensiService)
    {
        $this->credService    = $credService;
        $this->lisensiService = $lisensiService;
    }

    public function index(Request $request): Response
    {
        $this->authorize('credentialing.view');

        $credentialingList = Credentialing::with('pegawai:id,nip,nama,jabatan,unit_kerja')
            ->latest('id')
            ->paginate(12);

        return Inertia::render('Credentialing', [
            'credentialingList' => $credentialingList,
            'licenseAlerts'     => [
                'summary'     => $this->lisensiService->getRingkasanKepatuhan(),
                'str_warning' => $this->lisensiService->getExpiringStr(90),
                'sip_warning' => $this->lisensiService->getExpiringSip(90),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('credentialing.request');

        $request->validate([
            'pegawai_id'               => 'required|exists:m_pegawai,id',
            'komite_terkait'           => 'required|string|in:Komite Medik,Komite Keperawatan,Komite Nakes Lain',
            'jenis_kredensial'         => 'required|string|in:Kredensial Awal,Re-Kredensial,Pemulihan Kewenangan,Penambahan Kewenangan',
            'rincian_kewenangan_klinis' => 'nullable|array',
        ]);

        $pegawai = Pegawai::findOrFail($request->input('pegawai_id'));
        $cred    = $this->credService->ajukanKredensial($pegawai, $request->all());

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'Credentialing',
            targetId: $cred->id,
            targetLabel: $pegawai->nama . ' — ' . $request->input('jenis_kredensial'),
            description: 'Pengajuan kredensial via Web Portal.',
            request: $request,
        );

        return redirect()->back()->with('success', 'Permohonan kewenangan klinis berhasil diajukan ke Komite Medik.');
    }

    public function issueSpk(Request $request, Credentialing $credentialing): RedirectResponse
    {
        $this->authorize('credentialing.issue-spk');

        $request->validate(['nomor_spk' => 'required|string|max:100']);
        $this->credService->terbitkanSpk($credentialing, $request->input('nomor_spk'));

        ActivityLog::record(
            action: 'CREATE',
            severity: 'warning',
            targetType: 'SPK',
            targetId: $request->input('nomor_spk'),
            targetLabel: 'SPK ' . $request->input('nomor_spk') . ' — ' . ($credentialing->pegawai->nama ?? '-'),
            description: 'Penerbitan SPK via Web Portal oleh Direktur.',
            changes: ['nomor_spk' => ['old' => null, 'new' => $request->input('nomor_spk')]],
            request: $request,
        );

        return redirect()->back()->with('success', 'Surat Penugasan Klinis (SPK) resmi diterbitkan.');
    }
}
