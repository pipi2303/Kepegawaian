<?php

namespace App\Http\Controllers;

use App\Models\OppeFppe;
use App\Models\Pegawai;
use App\Models\SKPHeader;
use App\Models\TPPBulanan;
use App\Models\WisnPerhitungan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RemunerasiAnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $unit   = $request->input('unit_kerja');
        $tahun  = (int) ($request->input('tahun', date('Y')));

        // TPP rata-rata 3 bulan terakhir per pegawai
        $tppData = TPPBulanan::where('tahun', $tahun)
            ->where('status', '!=', 'Draft')
            ->select('pegawai_id', DB::raw('ROUND(AVG(total_tpp),0) as avg_tpp'))
            ->groupBy('pegawai_id')
            ->pluck('avg_tpp', 'pegawai_id');

        // SKP terakhir per pegawai
        $skpData = SKPHeader::where('tahun', $tahun)
            ->whereNotNull('nilai_akhir')
            ->orderByDesc('id')
            ->get(['pegawai_id', 'nilai_akhir', 'predikat'])
            ->unique('pegawai_id')
            ->keyBy('pegawai_id');

        // OPPE terakhir per pegawai
        $oppeData = OppeFppe::where('status', 'Selesai')
            ->whereNotNull('nilai_total')
            ->orderByDesc('id')
            ->get(['pegawai_id', 'nilai_total', 'rekomendasi'])
            ->unique('pegawai_id')
            ->keyBy('pegawai_id');

        // WISN ratio per unit
        $wisnData = WisnPerhitungan::where('periode', (string) $tahun)
            ->get(['unit_kerja', 'jabatan_kategori', 'wisn_ratio', 'status'])
            ->keyBy('unit_kerja');

        // Merge per pegawai
        $q = Pegawai::where('status_aktif', true);
        if ($unit) $q->where('unit_kerja', $unit);
        $pegawai = $q->get(['id', 'nama', 'jabatan', 'unit_kerja']);

        $scatter = [];
        foreach ($pegawai as $p) {
            $tpp  = $tppData[$p->id] ?? null;
            $skp  = $skpData[$p->id]->nilai_akhir ?? null;
            $oppe = $oppeData[$p->id]->nilai_total ?? null;

            if (!$tpp && !$skp && !$oppe) continue;

            $scatter[] = [
                'id'          => $p->id,
                'nama'        => $p->nama,
                'jabatan'     => $p->jabatan,
                'unit_kerja'  => $p->unit_kerja,
                'avg_tpp'     => (float) $tpp,
                'nilai_skp'   => $skp ? (float) $skp : null,
                'nilai_oppe'  => $oppe ? (float) $oppe : null,
                'predikat_skp'=> $skpData[$p->id]->predikat ?? null,
                'rek_oppe'    => $oppeData[$p->id]->rekomendasi ?? null,
            ];
        }

        // Per-unit stats
        $unitStats = collect($scatter)->groupBy('unit_kerja')->map(function ($items, $unitKey) use ($wisnData) {
            $tpps  = $items->pluck('avg_tpp')->filter()->values();
            $skps  = $items->pluck('nilai_skp')->filter()->values();
            $oppes = $items->pluck('nilai_oppe')->filter()->values();

            $max = $tpps->max() ?? 0;
            $min = $tpps->min() ?? 0;

            return [
                'unit_kerja'   => $unitKey,
                'jumlah'       => $items->count(),
                'avg_tpp'      => $tpps->avg() ? round($tpps->avg()) : null,
                'avg_skp'      => $skps->avg() ? round($skps->avg(), 1) : null,
                'avg_oppe'     => $oppes->avg() ? round($oppes->avg(), 1) : null,
                'gap_tpp'      => $max - $min,
                'wisn_ratio'   => $wisnData[$unitKey]->wisn_ratio ?? null,
                'wisn_status'  => $wisnData[$unitKey]->status ?? null,
            ];
        })->values()->sortByDesc('avg_tpp')->values();

        $unitList = Pegawai::where('status_aktif', true)
            ->distinct()->whereNotNull('unit_kerja')->pluck('unit_kerja')->sort()->values();

        return response()->json([
            'status' => 'success',
            'data'   => compact('scatter', 'unitStats', 'unitList'),
        ]);
    }
}
