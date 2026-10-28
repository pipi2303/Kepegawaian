<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ExitInterview;
use App\Models\Pegawai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExitInterviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ExitInterview::with('pegawai:id,nama,nip', 'pewawancara:id,nama');

        if ($unit = $request->input('unit_kerja')) {
            $query->where('unit_kerja', $unit);
        }
        if ($alasan = $request->input('alasan_utama')) {
            $query->where('alasan_utama', $alasan);
        }
        if ($tahun = $request->input('tahun')) {
            $query->whereYear('tanggal_akhir_kerja', $tahun);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->latest('tanggal_akhir_kerja')->paginate(20),
        ]);
    }

    public function summary(): JsonResponse
    {
        $total = ExitInterview::count();

        $alasanDist = ExitInterview::selectRaw('alasan_utama, count(*) as jumlah')
            ->groupBy('alasan_utama')->orderByDesc('jumlah')
            ->pluck('jumlah', 'alasan_utama');

        $unitTurnover = ExitInterview::selectRaw('unit_kerja, count(*) as jumlah')
            ->groupBy('unit_kerja')->orderByDesc('jumlah')
            ->limit(5)->get();

        $avgKepuasan = ExitInterview::selectRaw(
            'ROUND(AVG(kepuasan_gaji),2) as gaji,
             ROUND(AVG(kepuasan_atasan),2) as atasan,
             ROUND(AVG(kepuasan_rekan),2) as rekan,
             ROUND(AVG(kepuasan_fasilitas),2) as fasilitas,
             ROUND(AVG(kepuasan_pengembangan),2) as pengembangan,
             ROUND(AVG(kepuasan_overall),2) as overall'
        )->first();

        $bersediaKembali = ExitInterview::where('bersedia_kembali', true)->count();

        $unitList = ExitInterview::distinct()->orderBy('unit_kerja')->pluck('unit_kerja');
        $tahunList = ExitInterview::selectRaw('YEAR(tanggal_akhir_kerja) as tahun')
            ->distinct()->orderByDesc('tahun')->pluck('tahun');

        return response()->json([
            'status' => 'success',
            'data'   => compact('total', 'alasanDist', 'unitTurnover', 'avgKepuasan', 'bersediaKembali', 'unitList', 'tahunList'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pegawai_id'          => 'required|exists:m_pegawai,id',
            'tanggal_wawancara'   => 'required|date',
            'tanggal_akhir_kerja' => 'required|date',
            'alasan_utama'        => 'required|string',
            'kepuasan_gaji'       => 'required|integer|between:1,5',
            'kepuasan_atasan'     => 'required|integer|between:1,5',
            'kepuasan_rekan'      => 'required|integer|between:1,5',
            'kepuasan_fasilitas'  => 'required|integer|between:1,5',
            'kepuasan_pengembangan'=> 'required|integer|between:1,5',
            'komentar'            => 'nullable|string|max:2000',
            'bersedia_kembali'    => 'boolean',
            'pewawancara_id'      => 'nullable|exists:m_pegawai,id',
        ]);

        $pegawai = Pegawai::findOrFail($validated['pegawai_id']);
        $validated['unit_kerja']       = $pegawai->unit_kerja;
        $validated['jabatan']          = $pegawai->jabatan;
        $validated['masa_kerja_tahun'] = $pegawai->tanggal_masuk
            ? round(now()->diffInDays($pegawai->tanggal_masuk) / 365, 1)
            : 0;

        $ei = ExitInterview::create($validated);
        $ei->kepuasan_overall = $ei->hitungOverall();
        $ei->save();

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'ExitInterview',
            targetId: $ei->id,
            targetLabel: $pegawai->nama . ' — Exit Interview',
            description: "Exit interview direkam. Alasan: {$ei->alasan_utama}. Kepuasan overall: {$ei->kepuasan_overall}/5.",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $ei->load('pegawai')], 201);
    }

    public function destroy(ExitInterview $exitInterview): JsonResponse
    {
        $label = $exitInterview->pegawai->nama ?? 'Exit Interview #' . $exitInterview->id;
        $exitInterview->delete();
        ActivityLog::record(action: 'DELETE', targetType: 'ExitInterview', targetLabel: $label,
            description: 'Data exit interview dihapus.');
        return response()->json(['status' => 'success']);
    }
}
