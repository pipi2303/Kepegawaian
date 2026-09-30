<?php

namespace App\Http\Controllers;

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
        $query = Cuti::with(['pegawai:id,nip,nama,jabatan,unit_kerja', 'approvals']);

        if ($pegawaiId = $request->input('pegawai_id')) {
            $query->where('pegawai_id', $pegawaiId);
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
        $request->validate([
            'approver_pegawai_id' => 'required|exists:m_pegawai,id',
            'catatan' => 'nullable|string|max:500',
        ]);

        $approver = Pegawai::findOrFail($request->input('approver_pegawai_id'));
        $result = $this->cutiService->approve($cuti, $approver, $request->input('catatan'));

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
        $request->validate([
            'approver_pegawai_id' => 'required|exists:m_pegawai,id',
            'alasan' => 'required|string|max:500',
        ]);

        $approver = Pegawai::findOrFail($request->input('approver_pegawai_id'));
        $result = $this->cutiService->reject($cuti, $approver, $request->input('alasan'));

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
