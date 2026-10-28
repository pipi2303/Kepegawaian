<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\KarsTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KarsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = KarsTracker::with('pic:id,nama');

        if ($bab = $request->input('bab')) {
            $query->where('bab', $bab);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $items = $query->orderBy('bab')->orderBy('kode_standar')->get();

        // Jika kosong, seed standar default
        if ($items->isEmpty()) {
            $defaults = collect(KarsTracker::standarDefault())
                ->map(fn ($d) => array_merge($d, ['status' => 'Belum', 'created_at' => now(), 'updated_at' => now()]));
            KarsTracker::insert($defaults->toArray());
            $items = KarsTracker::with('pic:id,nama')->orderBy('bab')->orderBy('kode_standar')->get();
        }

        $summary = [
            'total'          => $items->count(),
            'belum'          => $items->where('status', 'Belum')->count(),
            'proses'         => $items->where('status', 'Proses')->count(),
            'lengkap'        => $items->where('status', 'Lengkap')->count(),
            'tidak_berlaku'  => $items->where('status', 'Tidak Berlaku')->count(),
            'pct_lengkap'    => $items->count() > 0
                ? round($items->where('status', 'Lengkap')->count() / $items->count() * 100, 1)
                : 0,
        ];

        return response()->json(['status' => 'success', 'data' => $items, 'summary' => $summary]);
    }

    public function update(Request $request, KarsTracker $kars): JsonResponse
    {
        $validated = $request->validate([
            'status'          => 'sometimes|in:Belum,Proses,Lengkap,Tidak Berlaku',
            'pic_id'          => 'nullable|exists:m_pegawai,id',
            'target_tanggal'  => 'nullable|date',
            'tanggal_selesai' => 'nullable|date',
            'file_bukti'      => 'nullable|string|max:500',
            'catatan'         => 'nullable|string|max:2000',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'Lengkap' && !$kars->tanggal_selesai) {
            $validated['tanggal_selesai'] = now()->toDateString();
        }

        $kars->update($validated);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'KARS',
            targetId: $kars->id,
            targetLabel: $kars->kode_standar . ' — ' . $kars->judul_standar,
            description: "Status KARS {$kars->kode_standar} diperbarui → {$kars->status}.",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $kars->load('pic:id,nama')]);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'items'          => 'required|array',
            'items.*.id'     => 'required|exists:t_kars_tracker,id',
            'items.*.status' => 'required|in:Belum,Proses,Lengkap,Tidak Berlaku',
        ]);

        foreach ($request->input('items') as $item) {
            KarsTracker::where('id', $item['id'])->update(['status' => $item['status']]);
        }

        return response()->json(['status' => 'success']);
    }
}
