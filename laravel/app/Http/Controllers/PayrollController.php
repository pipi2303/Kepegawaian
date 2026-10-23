<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\GajiHeader;
use App\Models\Pegawai;
use App\Services\PayrollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function __construct(private PayrollService $payroll) {}

    public function index(Request $request): JsonResponse
    {
        $query = GajiHeader::with('pegawai:id,nip,nama,unit_kerja,golongan')
            ->latest('id');

        if ($bulan = $request->integer('bulan')) {
            $query->where('bulan', $bulan);
        }
        if ($tahun = $request->integer('tahun')) {
            $query->where('tahun', $tahun);
        }
        if ($pegawaiId = $request->integer('pegawai_id')) {
            $query->where('pegawai_id', $pegawaiId);
        }
        if ($status = $request->input('status')) {
            $query->where('status_pembayaran', $status);
        }

        // Pegawai biasa hanya bisa lihat milik sendiri
        if (! auth()->user()->can('payroll.view-all')) {
            $query->where('pegawai_id', auth()->id());
        }

        return response()->json(['status' => 'success', 'data' => $query->paginate(20)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('payroll.generate');

        $data = $request->validate([
            'pegawai_id'        => 'required|exists:m_pegawai,id',
            'bulan'             => 'required|integer|between:1,12',
            'tahun'             => 'required|integer|min:2020|max:2100',
            'tunjangan_kinerja' => 'nullable|numeric|min:0',
        ]);

        $pegawai = Pegawai::findOrFail($data['pegawai_id']);
        $header  = $this->payroll->generateSlipGaji(
            $pegawai,
            $data['bulan'],
            $data['tahun'],
            (float) ($data['tunjangan_kinerja'] ?? 0)
        );

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'GajiHeader',
            targetId: $header->id,
            targetLabel: 'Slip Gaji ' . $pegawai->nama . ' - ' . $data['bulan'] . '/' . $data['tahun'],
            description: 'Generate slip gaji.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $header->load('details')], 201);
    }

    public function bulkGenerate(Request $request): JsonResponse
    {
        $this->authorize('payroll.generate');

        $data = $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer|min:2020|max:2100',
            'tunjangan_kinerja' => 'nullable|numeric|min:0',
        ]);

        $pegawais = Pegawai::where('status_aktif', 'Aktif')->get();
        $count    = 0;
        $tk       = (float) ($data['tunjangan_kinerja'] ?? 0);

        foreach ($pegawais as $pegawai) {
            try {
                $this->payroll->generateSlipGaji($pegawai, $data['bulan'], $data['tahun'], $tk);
                $count++;
            } catch (\Throwable $e) {
                // ponytail: skip and continue — individual failures don't abort bulk job
                error_log('[PayrollBulk] Pegawai #' . $pegawai->id . ': ' . $e->getMessage());
            }
        }

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'GajiHeader',
            targetLabel: 'Bulk Generate ' . $data['bulan'] . '/' . $data['tahun'],
            description: 'Bulk generate slip gaji untuk ' . $count . ' pegawai.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'generated' => $count, 'total' => $pegawais->count()]);
    }

    public function show(GajiHeader $gaji): JsonResponse
    {
        $user = auth()->user();

        if (! $user->can('payroll.view-all') && $gaji->pegawai_id !== $user->id) {
            abort(403, 'Tidak diizinkan melihat slip gaji pegawai lain.');
        }

        $gaji->load(['details', 'pegawai:id,nip,nama,jabatan,unit_kerja,golongan,status_pegawai']);

        return response()->json(['status' => 'success', 'data' => $gaji]);
    }

    public function approve(Request $request, GajiHeader $gaji): JsonResponse
    {
        $this->authorize('payroll.generate');

        $this->payroll->approvePayroll($gaji);

        return response()->json(['status' => 'success', 'message' => 'Slip gaji disetujui.']);
    }

    public function bayar(Request $request, GajiHeader $gaji): JsonResponse
    {
        $this->authorize('payroll.generate');

        $this->payroll->markDibayar($gaji);

        $gaji->load('pegawai');
        if ($gaji->pegawai?->no_telp) {
            \App\Services\WhatsAppService::send(
                $gaji->pegawai->no_telp,
                \App\Services\WhatsAppService::msgSlipGajiTersedia(
                    $gaji->pegawai->nama,
                    $gaji->nama_bulan . ' ' . $gaji->tahun
                )
            );
        }

        return response()->json(['status' => 'success', 'message' => 'Slip gaji ditandai dibayarkan.']);
    }
}
