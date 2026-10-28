<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Pegawai;
use App\Models\WisnPerhitungan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WisnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WisnPerhitungan::query();

        if ($unit = $request->input('unit_kerja')) {
            $query->where('unit_kerja', $unit);
        }
        if ($periode = $request->input('periode')) {
            $query->where('periode', $periode);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->orderBy('unit_kerja')->orderBy('jabatan_kategori')->get(),
        ]);
    }

    public function summary(): JsonResponse
    {
        $total      = WisnPerhitungan::count();
        $kekurangan = WisnPerhitungan::where('status', 'Kekurangan')->count();
        $cukup      = WisnPerhitungan::where('status', 'Cukup')->count();
        $kelebihan  = WisnPerhitungan::where('status', 'Kelebihan')->count();

        // Unit paling kekurangan (ratio terendah)
        $kritis = WisnPerhitungan::where('status', 'Kekurangan')
            ->orderBy('wisn_ratio')
            ->limit(5)
            ->get(['unit_kerja', 'jabatan_kategori', 'kebutuhan_sdmk', 'jumlah_aktual', 'wisn_ratio']);

        $unitList    = WisnPerhitungan::distinct()->orderBy('unit_kerja')->pluck('unit_kerja');
        $periodeList = WisnPerhitungan::distinct()->orderByDesc('periode')->pluck('periode')->unique()->values();

        return response()->json([
            'status' => 'success',
            'data'   => compact('total', 'kekurangan', 'cukup', 'kelebihan', 'kritis', 'unitList', 'periodeList'),
        ]);
    }

    /**
     * Saran WKT dari data absensi/cuti/diklat yang sudah ada di DB.
     */
    public function saranWkt(Request $request): JsonResponse
    {
        $unit   = $request->input('unit_kerja');
        $tahun  = (int) ($request->input('tahun', date('Y')));

        $cuti = 0;
        $diklat = 0;
        $tidakHadir = 0;

        if ($unit) {
            // Rata-rata hari cuti per pegawai di unit ini
            $cuti = \App\Models\Cuti::whereHas('pegawai', fn ($q) => $q->where('unit_kerja', $unit))
                ->where('status', 'Disetujui')
                ->whereYear('tanggal_mulai', $tahun)
                ->avg('jumlah_hari') ?? 12;

            // Rata-rata hari diklat
            $diklat = \App\Models\Diklat::whereHas('pegawai', fn ($q) => $q->where('unit_kerja', $unit))
                ->where('status', 'Selesai')
                ->whereYear('tanggal_mulai', $tahun)
                ->selectRaw('SUM(jumlah_jam) / 8 as hari_diklat')
                ->value('hari_diklat') ?? 5;

            // Ketidakhadiran dari absensi (alpha / izin)
            $tidakHadir = \App\Models\Absensi::whereHas('pegawai', fn ($q) => $q->where('unit_kerja', $unit))
                ->whereIn('status_kehadiran', ['Alpha', 'Izin', 'Sakit Tanpa Surat'])
                ->whereYear('tanggal', $tahun)
                ->count();

            // Bagi dengan jumlah pegawai di unit
            $jumlahPegawai = Pegawai::where('unit_kerja', $unit)->where('status_aktif', true)->count();
            if ($jumlahPegawai > 0) {
                $tidakHadir = round($tidakHadir / $jumlahPegawai);
            }
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'cuti_tahunan'   => (int) round($cuti),
                'hari_diklat'    => (int) round($diklat),
                'hari_tidak_hadir' => (int) min($tidakHadir, 30),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit_kerja'          => 'required|string|max:100',
            'jabatan_kategori'    => 'required|string|max:100',
            'periode'             => 'required|string|max:10',
            'hari_kerja'          => 'required|integer|min:1|max:366',
            'cuti_tahunan'        => 'required|integer|min:0',
            'hari_diklat'         => 'required|integer|min:0',
            'hari_libur_nasional' => 'required|integer|min:0',
            'hari_tidak_hadir'    => 'required|integer|min:0',
            'jam_kerja_per_hari'  => 'required|numeric|min:1|max:24',
            'aktivitas'           => 'nullable|array',
            'aktivitas.*.nama'                => 'required|string',
            'aktivitas.*.jenis'               => 'required|in:Langsung,Tidak Langsung,Kelonggaran',
            'aktivitas.*.standar_waktu_menit' => 'required|numeric|min:0',
            'aktivitas.*.kuantitas_setahun'   => 'required|numeric|min:0',
            'jumlah_aktual'       => 'required|integer|min:0',
            'catatan'             => 'nullable|string|max:2000',
        ]);

        $wisn = new WisnPerhitungan($validated);
        $wisn->fill($wisn->hitung());
        $wisn->save();

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'WISN',
            targetId: $wisn->id,
            targetLabel: "{$wisn->unit_kerja} — {$wisn->jabatan_kategori} ({$wisn->periode})",
            description: "Perhitungan WISN dibuat. Kebutuhan: {$wisn->kebutuhan_sdmk}, Aktual: {$wisn->jumlah_aktual}, Rasio: {$wisn->wisn_ratio}.",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $wisn], 201);
    }

    public function update(Request $request, WisnPerhitungan $wisn): JsonResponse
    {
        $validated = $request->validate([
            'unit_kerja'          => 'sometimes|string|max:100',
            'jabatan_kategori'    => 'sometimes|string|max:100',
            'periode'             => 'sometimes|string|max:10',
            'hari_kerja'          => 'sometimes|integer|min:1|max:366',
            'cuti_tahunan'        => 'sometimes|integer|min:0',
            'hari_diklat'         => 'sometimes|integer|min:0',
            'hari_libur_nasional' => 'sometimes|integer|min:0',
            'hari_tidak_hadir'    => 'sometimes|integer|min:0',
            'jam_kerja_per_hari'  => 'sometimes|numeric|min:1|max:24',
            'aktivitas'           => 'nullable|array',
            'jumlah_aktual'       => 'sometimes|integer|min:0',
            'catatan'             => 'nullable|string|max:2000',
        ]);

        $wisn->update($validated);
        $wisn->fill($wisn->hitung());
        $wisn->save();

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'WISN',
            targetId: $wisn->id,
            targetLabel: "{$wisn->unit_kerja} — {$wisn->jabatan_kategori} ({$wisn->periode})",
            description: "Perhitungan WISN diperbarui. Kebutuhan: {$wisn->kebutuhan_sdmk}, Rasio: {$wisn->wisn_ratio}.",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $wisn]);
    }

    public function destroy(WisnPerhitungan $wisn): JsonResponse
    {
        $label = "{$wisn->unit_kerja} — {$wisn->jabatan_kategori} ({$wisn->periode})";
        $wisn->delete();

        ActivityLog::record(action: 'DELETE', targetType: 'WISN', targetLabel: $label,
            description: "Perhitungan WISN dihapus.");

        return response()->json(['status' => 'success']);
    }
}
