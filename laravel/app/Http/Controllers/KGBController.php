<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Pegawai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KGBController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Pegawai::where('status_aktif', 'Aktif')
            ->whereIn('status_pegawai', ['PNS', 'PPPK'])
            ->select('id', 'nip', 'nama', 'jabatan', 'unit_kerja', 'golongan', 'tmt_gaji_berkala', 'kgb_berikutnya');

        if ($unitKerja = $request->input('unit_kerja')) {
            $query->where('unit_kerja', $unitKerja);
        }
        if ($bulan = $request->input('bulan_kgb')) {
            $query->whereMonth('kgb_berikutnya', $bulan);
        }
        if ($tahun = $request->input('tahun_kgb')) {
            $query->whereYear('kgb_berikutnya', $tahun);
        }

        $pegawai = $query->orderBy('kgb_berikutnya')->paginate(20);

        $today = now();
        $pegawai->getCollection()->transform(function ($p) use ($today) {
            $hariTersisa = $p->kgb_berikutnya ? (int) $today->diffInDays($p->kgb_berikutnya, false) : null;
            $p->hari_tersisa     = $hariTersisa;
            $p->akan_jatuh_tempo = $hariTersisa !== null && $hariTersisa <= 60;
            return $p;
        });

        return response()->json(['status' => 'success', 'data' => $pegawai]);
    }

    public function update(Request $request, Pegawai $pegawai): JsonResponse
    {
        $data = $request->validate(['tmt_gaji_berkala' => 'required|date']);

        $tmtDate = \Carbon\Carbon::parse($data['tmt_gaji_berkala']);

        $pegawai->update([
            'tmt_gaji_berkala' => $tmtDate,
            'kgb_berikutnya'   => $tmtDate->copy()->addYears(2),
        ]);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'KGB',
            targetLabel: $pegawai->nama,
            description: "TMT Gaji Berkala diperbarui: {$tmtDate->format('d/m/Y')}, KGB berikutnya: {$pegawai->kgb_berikutnya->format('d/m/Y')}",
            targetId: $pegawai->id,
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $pegawai->refresh()]);
    }

    public function bulkCalculate(): JsonResponse
    {
        $updated = 0;

        Pegawai::whereIn('status_pegawai', ['PNS', 'PPPK'])
            ->where('status_aktif', 'Aktif')
            ->whereNull('kgb_berikutnya')
            ->where(function ($q) {
                $q->whereNotNull('tmt_gaji_berkala')->orWhereNotNull('tmt_golongan');
            })
            ->each(function (Pegawai $p) use (&$updated) {
                $base = $p->tmt_gaji_berkala ?? $p->tmt_golongan;
                $p->kgb_berikutnya = $base->copy()->addYears(2);
                $p->saveQuietly();
                $updated++;
            });

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'KGB',
            targetLabel: 'Bulk Calculate',
            description: "Kalkulasi KGB massal: {$updated} pegawai diperbarui.",
        );

        return response()->json(['status' => 'success', 'updated' => $updated]);
    }
}
