<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\GajiHeader;
use App\Models\Pegawai;
use App\Models\THR;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class THRController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = THR::with('pegawai:id,nama,nip,jabatan,unit_kerja,status_pegawai');

        if ($tahun = $request->input('tahun')) {
            $query->where('tahun', $tahun);
        }
        if ($hariRaya = $request->input('hari_raya')) {
            $query->where('hari_raya', $hariRaya);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $data   = $query->latest('id')->paginate(50);
        $total  = THR::where('tahun', $request->input('tahun', date('Y')))->sum('jumlah_thr');

        return response()->json(['status' => 'success', 'data' => $data, 'total_thr' => $total]);
    }

    /** Generate THR massal untuk semua pegawai aktif */
    public function generateBulk(Request $request): JsonResponse
    {
        $request->validate([
            'tahun'      => 'required|integer',
            'hari_raya'  => 'required|in:Idul Fitri,Natal,Nyepi,Waisak,Lainnya',
        ]);

        $tahun    = $request->integer('tahun');
        $hariRaya = $request->input('hari_raya');

        $pegawai = Pegawai::where('status_aktif', true)->get(['id', 'tanggal_masuk']);

        $created = 0;
        $skipped = 0;

        DB::transaction(function () use ($pegawai, $tahun, $hariRaya, &$created, &$skipped) {
            foreach ($pegawai as $p) {
                $exists = THR::where('pegawai_id', $p->id)
                    ->where('tahun', $tahun)->where('hari_raya', $hariRaya)->exists();

                if ($exists) { $skipped++; continue; }

                $masaKerjaBulan = $p->tanggal_masuk
                    ? (int) $p->tanggal_masuk->diffInMonths(now())
                    : 0;

                // Ambil gaji pokok terbaru
                $gajiPokok = (float) (GajiHeader::where('pegawai_id', $p->id)
                    ->latest('id')->value('gaji_pokok') ?? 0);

                $hasil = THR::hitungTHR($gajiPokok, $masaKerjaBulan);

                THR::create([
                    'pegawai_id'       => $p->id,
                    'tahun'            => $tahun,
                    'hari_raya'        => $hariRaya,
                    'masa_kerja_bulan' => $masaKerjaBulan,
                    'formula'          => $hasil['formula'],
                    'gaji_dasar'       => $gajiPokok,
                    'jumlah_thr'       => $hasil['jumlah'],
                    'status'           => 'Draft',
                ]);

                $created++;
            }
        });

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'THR',
            targetLabel: "THR {$hariRaya} {$tahun}",
            description: "Generate THR massal: {$created} dibuat, {$skipped} dilewati.",
            request: $request,
        );

        return response()->json([
            'status' => 'success',
            'data'   => ['created' => $created, 'skipped' => $skipped],
        ]);
    }

    public function approve(Request $request): JsonResponse
    {
        $request->validate([
            'ids'          => 'required|array',
            'ids.*'        => 'exists:t_thr,id',
            'tanggal_bayar'=> 'required|date',
        ]);

        THR::whereIn('id', $request->input('ids'))
            ->update(['status' => 'Approved', 'tanggal_bayar' => $request->input('tanggal_bayar')]);

        return response()->json(['status' => 'success']);
    }

    public function markDibayar(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:t_thr,id']);

        THR::whereIn('id', $request->input('ids'))
            ->where('status', 'Approved')
            ->update(['status' => 'Dibayarkan']);

        return response()->json(['status' => 'success']);
    }
}
