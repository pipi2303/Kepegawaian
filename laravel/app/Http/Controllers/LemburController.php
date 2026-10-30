<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\GajiHeader;
use App\Models\Lembur;
use App\Models\Pegawai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LemburController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Lembur::with('pegawai:id,nama,jabatan,unit_kerja', 'approver:id,nama');

        if ($unit = $request->input('unit_kerja')) {
            $query->whereHas('pegawai', fn ($q) => $q->where('unit_kerja', $unit));
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($bulan = $request->input('bulan')) {
            $query->whereMonth('tanggal', $bulan);
        }
        if ($tahun = $request->input('tahun')) {
            $query->whereYear('tanggal', $tahun);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->latest('tanggal')->paginate(25),
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $tahun = $request->input('tahun', date('Y'));
        $bulan = $request->input('bulan', date('m'));

        $base = Lembur::whereYear('tanggal', $tahun)->whereMonth('tanggal', $bulan);

        $totalDiajukan  = (clone $base)->where('status', 'Diajukan')->count();
        $totalDisetujui = (clone $base)->where('status', 'Disetujui')->count();
        $totalJam       = (clone $base)->where('status', 'Disetujui')->sum('durasi_jam');
        $totalUpah      = (clone $base)->where('status', 'Disetujui')->sum('upah_lembur');

        $unitList = Pegawai::where('status_aktif', true)
            ->distinct()->whereNotNull('unit_kerja')->pluck('unit_kerja')->sort()->values();

        return response()->json([
            'status' => 'success',
            'data'   => compact('totalDiajukan', 'totalDisetujui', 'totalJam', 'totalUpah', 'unitList'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pegawai_id'  => 'required|exists:m_pegawai,id',
            'tanggal'     => 'required|date',
            'jam_mulai'   => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'jenis_hari'  => 'required|in:Hari Kerja,Hari Libur,Hari Besar',
            'alasan'      => 'required|string|max:500',
        ]);

        $start = Carbon::parse($validated['jam_mulai']);
        $end   = Carbon::parse($validated['jam_selesai']);
        $validated['durasi_jam'] = round($start->diffInMinutes($end) / 60, 2);

        $lembur = Lembur::create($validated);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'Lembur',
            targetId: $lembur->id,
            targetLabel: ($lembur->pegawai->nama ?? '-') . " — Lembur {$lembur->tanggal->format('d/m/Y')}",
            description: "Pengajuan lembur {$lembur->durasi_jam} jam pada {$lembur->tanggal->format('d/m/Y')}.",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $lembur->load('pegawai')], 201);
    }

    public function approve(Request $request, Lembur $lembur): JsonResponse
    {
        $request->validate([
            'status'  => 'required|in:Disetujui,Ditolak',
            'catatan' => 'nullable|string|max:500',
        ]);

        $lembur->status           = $request->input('status');
        $lembur->approver_id      = auth()->id();
        $lembur->tanggal_approval = now();
        $lembur->catatan          = $request->input('catatan');

        if ($lembur->status === 'Disetujui') {
            $gaji = GajiHeader::where('pegawai_id', $lembur->pegawai_id)
                ->latest('id')->first();
            $gajiPokok = $gaji ? (float) $gaji->gaji_pokok : 0;
            $lembur->upah_lembur = $gajiPokok > 0 ? $lembur->hitungUpahLembur($gajiPokok) : null;
        }

        $lembur->save();

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'Lembur',
            targetId: $lembur->id,
            targetLabel: ($lembur->pegawai->nama ?? '-') . " — Lembur {$lembur->tanggal->format('d/m/Y')}",
            description: "Lembur {$lembur->status}. Upah: Rp " . number_format($lembur->upah_lembur ?? 0),
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $lembur->load('pegawai', 'approver')]);
    }

    public function destroy(Lembur $lembur): JsonResponse
    {
        if ($lembur->status === 'Disetujui') {
            return response()->json(['status' => 'error', 'message' => 'Lembur yang sudah disetujui tidak dapat dihapus.'], 422);
        }
        $label = ($lembur->pegawai->nama ?? '-') . " — Lembur {$lembur->tanggal->format('d/m/Y')}";
        $lembur->delete();
        ActivityLog::record(action: 'DELETE', targetType: 'Lembur', targetLabel: $label, description: 'Pengajuan lembur dihapus.');
        return response()->json(['status' => 'success']);
    }
}
