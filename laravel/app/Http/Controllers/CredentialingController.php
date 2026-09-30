<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Models\Credentialing;
use App\Services\CredentialingService;
use App\Services\LisensiMonitoringService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CredentialingController extends Controller
{
    protected CredentialingService $credService;
    protected LisensiMonitoringService $lisensiService;

    public function __construct(CredentialingService $credService, LisensiMonitoringService $lisensiService)
    {
        $this->credService = $credService;
        $this->lisensiService = $lisensiService;
    }

    /**
     * Daftar Permohonan Credentialing
     */
    public function index(Request $request): JsonResponse
    {
        $query = Credentialing::with('pegawai:id,nip,nama,jabatan,unit_kerja');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($komite = $request->input('komite')) {
            $query->where('komite_terkait', $komite);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->latest('id')->paginate(15),
        ]);
    }

    /**
     * Pengajuan Kredensial Baru oleh Nakes
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'pegawai_id' => 'required|exists:m_pegawai,id',
            'komite_terkait' => 'required|string|in:Komite Medik,Komite Keperawatan,Komite Nakes Lain',
            'jenis_kredensial' => 'required|string|in:Kredensial Awal,Re-Kredensial,Pemulihan Kewenangan,Penambahan Kewenangan',
            'rincian_kewenangan_klinis' => 'nullable|array',
        ]);

        $pegawai = Pegawai::findOrFail($request->input('pegawai_id'));
        $cred = $this->credService->ajukanKredensial($pegawai, $request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Permohonan kredensial berhasil diajukan.',
            'data' => $cred,
        ], 201);
    }

    /**
     * Rekomendasi Mitra Bestari (Subkomite Kredensial)
     */
    public function submitRekomendasi(Request $request, Credentialing $credentialing): JsonResponse
    {
        $request->validate([
            'rincian_kewenangan_klinis' => 'required|array',
            'catatan' => 'required|string|max:1000',
        ]);

        $result = $this->credService->submitRekomendasiMitraBestari(
            $credentialing,
            $request->input('rincian_kewenangan_klinis'),
            $request->input('catatan')
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Rekomendasi mitra bestari berhasil disimpan.',
            'data' => $result,
        ]);
    }

    /**
     * Penerbitan Surat Penugasan Klinis (SPK) oleh Direktur
     */
    public function issueSpk(Request $request, Credentialing $credentialing): JsonResponse
    {
        $request->validate([
            'nomor_spk' => 'required|string|max:100|unique:t_credentialing,nomor_spk,' . $credentialing->id,
            'file_dokumen_spk' => 'nullable|string',
        ]);

        $result = $this->credService->terbitkanSpk(
            $credentialing,
            $request->input('nomor_spk'),
            $request->input('file_dokumen_spk')
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Surat Penugasan Klinis (SPK) resmi diterbitkan.',
            'data' => $result,
        ]);
    }

    /**
     * Early Warning Lisensi STR/SIP Kedaluwarsa
     */
    public function licenseAlerts(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'summary' => $this->lisensiService->getRingkasanKepatuhan(),
                'str_expiring_soon' => $this->lisensiService->getExpiringStr(90),
                'sip_expiring_soon' => $this->lisensiService->getExpiringSip(90),
            ],
        ]);
    }
}
