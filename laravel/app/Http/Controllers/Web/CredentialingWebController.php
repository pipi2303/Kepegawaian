<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
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
        $this->credService = $credService;
        $this->lisensiService = $lisensiService;
    }

    /**
     * Halaman Credentialing & Lisensi Nakes
     */
    public function index(Request $request): Response
    {
        $credentialingList = Credentialing::with('pegawai:id,nip,nama,jabatan,unit_kerja')
            ->latest('id')
            ->paginate(12);

        $licenseAlerts = [
            'summary' => $this->lisensiService->getRingkasanKepatuhan(),
            'str_warning' => $this->lisensiService->getExpiringStr(90),
            'sip_warning' => $this->lisensiService->getExpiringSip(90),
        ];

        return Inertia::render('Credentialing', [
            'credentialingList' => $credentialingList,
            'licenseAlerts' => $licenseAlerts,
        ]);
    }

    /**
     * Pengajuan Permohonan Kredensial Baru
     */
    public function store(Request $request): RedirectResponse
    {
        $pegawai = $request->user()?->pegawai ?: Pegawai::findOrFail($request->input('pegawai_id'));
        $this->credService->ajukanKredensial($pegawai, $request->all());

        return redirect()->back()->with('success', 'Permohonan kewenangan klinis berhasil diajukan ke Komite Medik.');
    }

    /**
     * Penerbitan SPK oleh Direktur
     */
    public function issueSpk(Request $request, Credentialing $credentialing): RedirectResponse
    {
        $request->validate(['nomor_spk' => 'required|string|max:100']);
        $this->credService->terbitkanSpk($credentialing, $request->input('nomor_spk'));

        return redirect()->back()->with('success', 'Surat Penugasan Klinis (SPK) resmi diterbitkan.');
    }
}
