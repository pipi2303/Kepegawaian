<?php

namespace App\Http\Controllers;

use App\Models\IntegrationLog;
use App\Models\Pegawai;
use App\Services\SatuSehatService;
use App\Services\SiasnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class IntegrationController extends Controller
{
    public function __construct(
        private SatuSehatService $satusehat,
        private SiasnService $siasn,
    ) {}

    private function requireAdmin(): void
    {
        abort_unless(
            auth()->user()?->hasRole(['Super Admin', 'Admin']) || auth()->user()?->can('pegawai.edit'),
            403,
            'Akses ditolak. Diperlukan hak Admin.'
        );
    }

    public function status(): JsonResponse
    {
        $this->requireAdmin();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'satusehat' => [
                    'configured'   => $this->satusehat->isConfigured(),
                    'last_sync_at' => Cache::get('satusehat_last_sync_at'),
                ],
                'siasn' => [
                    'configured'   => $this->siasn->isConfigured(),
                    'last_sync_at' => Cache::get('siasn_last_sync_at'),
                ],
            ],
        ]);
    }

    public function satusehatSync(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $request->validate(['pegawai_id' => 'nullable|integer|exists:m_pegawai,id']);

        abort_unless($this->satusehat->isConfigured(), 422, 'SATUSEHAT belum dikonfigurasi. Set SATUSEHAT_CLIENT_ID dan SATUSEHAT_CLIENT_SECRET.');

        if ($request->filled('pegawai_id')) {
            $pegawai = Pegawai::findOrFail($request->pegawai_id);
            $result  = $this->satusehat->syncPractitioner($pegawai);
        } else {
            set_time_limit(300);
            $result = $this->satusehat->bulkSyncNakes();
            Cache::put('satusehat_last_sync_at', now()->toIso8601String(), 86400);
        }

        return response()->json(['status' => 'success', 'data' => $result]);
    }

    public function satusehatPractitioner(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $request->validate(['nip' => 'required|string|max:30']);

        abort_unless($this->satusehat->isConfigured(), 422, 'SATUSEHAT belum dikonfigurasi.');

        $result = $this->satusehat->getPractitioner($request->nip);

        return response()->json(['status' => 'success', 'data' => $result]);
    }

    public function siasnSync(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $request->validate(['pegawai_id' => 'required|integer|exists:m_pegawai,id']);

        abort_unless($this->siasn->isConfigured(), 422, 'SIASN belum dikonfigurasi. Set SIASN_CLIENT_ID dan SIASN_CLIENT_SECRET.');

        $pegawai = Pegawai::findOrFail($request->pegawai_id);

        $jabatan = $this->siasn->syncRiwayatJabatan($pegawai);
        $pangkat = $this->siasn->syncKenaikanPangkat($pegawai);

        Cache::put('siasn_last_sync_at', now()->toIso8601String(), 86400);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'riwayat_jabatan'   => $jabatan,
                'kenaikan_pangkat'  => $pangkat,
            ],
        ]);
    }

    public function integrationLogs(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $query = IntegrationLog::with('pegawai:id,nip,nama')
            ->latest('created_at');

        if ($service = $request->input('service')) {
            $query->where('service', $service);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->paginate(25),
        ]);
    }
}
