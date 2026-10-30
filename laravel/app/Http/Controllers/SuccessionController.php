<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Pegawai;
use App\Models\SuccessionKandidat;
use App\Models\SuccessionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuccessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SuccessionPlan::with([
            'incumbent:id,nama,jabatan,batas_pensiun',
            'kandidat.pegawai:id,nama,jabatan,unit_kerja',
        ]);

        if ($unit = $request->input('unit_kerja')) {
            $query->where('unit_kerja', $unit);
        }
        if ($urgency = $request->input('urgency')) {
            $query->where('urgency', $urgency);
        }

        $plans = $query->orderByRaw("FIELD(urgency, 'Segera', '1 Tahun', '2-3 Tahun', '3+ Tahun')")
            ->get();

        $summary = [
            'total'    => $plans->count(),
            'segera'   => $plans->where('urgency', 'Segera')->count(),
            'satu_tahun'=> $plans->where('urgency', '1 Tahun')->count(),
            'unit_list'=> SuccessionPlan::distinct()->pluck('unit_kerja')->sort()->values(),
        ];

        return response()->json(['status' => 'success', 'data' => $plans, 'summary' => $summary]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'jabatan_kritis'         => 'required|string|max:200',
            'unit_kerja'             => 'required|string|max:150',
            'incumbent_id'           => 'nullable|exists:m_pegawai,id',
            'urgency'                => 'required|in:Segera,1 Tahun,2-3 Tahun,3+ Tahun',
            'alasan_kritis'          => 'nullable|string|max:500',
            'kompetensi_dibutuhkan'  => 'nullable|string',
        ]);

        $plan = SuccessionPlan::create($validated);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'Succession',
            targetId: $plan->id,
            targetLabel: "{$plan->jabatan_kritis} — {$plan->unit_kerja}",
            description: "Succession plan dibuat. Urgency: {$plan->urgency}.",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $plan->load('incumbent')], 201);
    }

    public function update(Request $request, SuccessionPlan $succession): JsonResponse
    {
        $validated = $request->validate([
            'jabatan_kritis'         => 'sometimes|string|max:200',
            'unit_kerja'             => 'sometimes|string|max:150',
            'incumbent_id'           => 'nullable|exists:m_pegawai,id',
            'urgency'                => 'sometimes|in:Segera,1 Tahun,2-3 Tahun,3+ Tahun',
            'alasan_kritis'          => 'nullable|string|max:500',
            'kompetensi_dibutuhkan'  => 'nullable|string',
        ]);

        $succession->update($validated);
        return response()->json(['status' => 'success', 'data' => $succession->load('incumbent', 'kandidat.pegawai')]);
    }

    public function destroy(SuccessionPlan $succession): JsonResponse
    {
        $label = "{$succession->jabatan_kritis} — {$succession->unit_kerja}";
        $succession->delete(); // cascades to kandidat
        ActivityLog::record(action: 'DELETE', targetType: 'Succession', targetLabel: $label,
            description: 'Succession plan dihapus.');
        return response()->json(['status' => 'success']);
    }

    public function addKandidat(Request $request, SuccessionPlan $succession): JsonResponse
    {
        $validated = $request->validate([
            'pegawai_id'          => 'required|exists:m_pegawai,id',
            'urutan'              => 'integer|min:1',
            'readiness'           => 'required|in:Siap Sekarang,1-2 Tahun,3-5 Tahun',
            'gap_kompetensi'      => 'nullable|string',
            'rencana_pengembangan'=> 'nullable|string',
            'catatan'             => 'nullable|string',
        ]);

        $kandidat = SuccessionKandidat::updateOrCreate(
            ['succession_id' => $succession->id, 'pegawai_id' => $validated['pegawai_id']],
            $validated + ['succession_id' => $succession->id]
        );

        return response()->json(['status' => 'success', 'data' => $kandidat->load('pegawai:id,nama,jabatan,unit_kerja')]);
    }

    public function removeKandidat(SuccessionKandidat $kandidat): JsonResponse
    {
        $kandidat->delete();
        return response()->json(['status' => 'success']);
    }
}
