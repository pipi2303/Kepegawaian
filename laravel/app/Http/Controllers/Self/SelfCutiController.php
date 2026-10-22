<?php

namespace App\Http\Controllers\Self;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Cuti;
use App\Models\JadwalShift;
use App\Services\CutiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SelfCutiController extends Controller
{
    public function __construct(private CutiService $cutiService) {}

    public function index(Request $request): JsonResponse
    {
        $cuti = Cuti::where('pegawai_id', auth()->id())
            ->with('approvals')
            ->latest()
            ->paginate(10);

        return response()->json(['status' => 'success', 'data' => $cuti]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jenis_cuti'         => 'required|string|in:Cuti Tahunan,Cuti Sakit,Cuti Melahirkan,Cuti Besar,Cuti Alasan Penting,Cuti di Luar Tanggungan Negara',
            'tanggal_mulai'      => 'required|date|after_or_equal:today',
            'tanggal_selesai'    => 'required|date|after_or_equal:tanggal_mulai',
            'jumlah_hari'        => 'required|integer|min:1',
            'alasan'             => 'required|string|min:5|max:1000',
            'alamat_selama_cuti' => 'nullable|string|max:255',
            'no_telp_cuti'       => 'nullable|string|max:30',
        ]);

        $pegawai = auth()->user();
        $cuti = $this->cutiService->ajukanCuti($pegawai, $data);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'Cuti',
            targetId: $cuti->id,
            targetLabel: $pegawai->nama . ' — ' . $cuti->jenis_cuti . ' (' . $cuti->jumlah_hari . ' hari)',
            description: 'Self-service: pengajuan cuti oleh ' . $pegawai->nama . '.',
            request: $request,
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengajuan cuti berhasil dikirim dan menunggu persetujuan.',
            'data'    => $cuti,
        ], 201);
    }

    public function sisa(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'sisa_cuti_tahunan' => $user->sisa_cuti_tahunan,
                'kuota_tahunan'     => 12,
                'tahun'             => now()->year,
                'cuti_sakit'        => 'Tidak terbatas (dengan surat dokter)',
                'cuti_melahirkan'   => '3 bulan',
            ],
        ]);
    }

    public function jadwal(): JsonResponse
    {
        $jadwal = JadwalShift::where('pegawai_id', auth()->id())
            ->whereBetween('tanggal', [
                now()->startOfWeek(),
                now()->addWeeks(2)->endOfWeek(),
            ])
            ->orderBy('tanggal')
            ->get();

        return response()->json(['status' => 'success', 'data' => $jadwal]);
    }
}
