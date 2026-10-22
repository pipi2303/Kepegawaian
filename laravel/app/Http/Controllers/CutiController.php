<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Cuti;
use App\Models\Pegawai;
use App\Services\CutiService;
use App\Http\Requests\StoreCutiRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CutiController extends Controller
{
    protected CutiService $cutiService;

    public function __construct(CutiService $cutiService)
    {
        $this->cutiService = $cutiService;
    }

    /**
     * Daftar Pengajuan Cuti (Bisa difilter status dan unit kerja)
     */
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Cuti::with(['pegawai:id,nip,nama,jabatan,unit_kerja', 'approvals']);

        // view-own: filter ke data sendiri; view-all: semua
        if ($user->can('cuti.view-all')) {
            if ($pegawaiId = $request->input('pegawai_id')) {
                $query->where('pegawai_id', $pegawaiId);
            }
        } else {
            $this->authorize('cuti.view-own');
            $query->where('pegawai_id', $user->id);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $cutis = $query->latest('tanggal_pengajuan')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $cutis,
        ]);
    }

    /**
     * Ajukan Cuti Baru
     */
    public function store(StoreCutiRequest $request): JsonResponse
    {
        $pegawai = Pegawai::findOrFail($request->input('pegawai_id'));
        $cuti = $this->cutiService->ajukanCuti($pegawai, $request->validated());

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'Cuti',
            targetId: $cuti->id,
            targetLabel: $pegawai->nama . ' — ' . $cuti->jenis_cuti . ' (' . $cuti->jumlah_hari . ' hari)',
            description: 'Pengajuan cuti baru oleh ' . $pegawai->nama . '.',
            request: $request,
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan cuti berhasil dikirim dan menunggu persetujuan.',
            'data' => $cuti,
        ], 201);
    }

    /**
     * Persetujuan Cuti (Approve)
     */
    public function approve(Request $request, Cuti $cuti): JsonResponse
    {
        // Approver = user yang login; tidak bisa dimanipulasi via request body
        $approver = $request->user();
        $this->authorize('cuti.approve-unit');

        $request->validate(['catatan' => 'nullable|string|max:500']);

        $oldStatus = $cuti->status;
        $result    = $this->cutiService->approve($cuti, $approver, $request->input('catatan'));

        ActivityLog::record(
            action: 'APPROVE',
            targetType: 'Cuti',
            targetId: $cuti->id,
            targetLabel: ($cuti->pegawai->nama ?? '-') . ' — ' . $cuti->jenis_cuti,
            description: 'Persetujuan cuti oleh ' . $approver->nama . '.',
            changes: ['status' => ['old' => $oldStatus, 'new' => $cuti->status]],
            request: $request,
            pegawaiId: $approver->id,
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Persetujuan cuti berhasil diproses.',
            'data' => $result,
        ]);
    }

    /**
     * Penolakan Cuti (Reject)
     */
    public function reject(Request $request, Cuti $cuti): JsonResponse
    {
        $approver = $request->user();
        $this->authorize('cuti.approve-unit');

        $request->validate(['alasan' => 'required|string|max:500']);

        $oldStatus = $cuti->status;
        $result    = $this->cutiService->reject($cuti, $approver, $request->input('alasan'));

        ActivityLog::record(
            action: 'REJECT',
            severity: 'warning',
            targetType: 'Cuti',
            targetId: $cuti->id,
            targetLabel: ($cuti->pegawai->nama ?? '-') . ' — ' . $cuti->jenis_cuti,
            description: 'Penolakan cuti oleh ' . $approver->nama . '. Alasan: ' . $request->input('alasan'),
            changes: ['status' => ['old' => $oldStatus, 'new' => 'Ditolak']],
            request: $request,
            pegawaiId: $approver->id,
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan cuti ditolak.',
            'data' => $result,
        ]);
    }

    /**
     * Cek Sisa Kuota Cuti Tahunan Pegawai
     */
    public function getSisaCuti(Pegawai $pegawai): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'pegawai_id' => $pegawai->id,
                'nama' => $pegawai->nama_lengkap,
                'sisa_cuti_tahunan' => $pegawai->sisa_cuti_tahunan,
                'tahun' => now()->year,
            ],
        ]);
    }
}
