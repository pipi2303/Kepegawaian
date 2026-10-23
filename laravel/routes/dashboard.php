<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/dashboard')->middleware(['auth:sanctum'])->group(function () {

    // ── Direktur Summary ─────────────────────────────────────────────────────
    Route::get('direktur-summary', function () {
        $tahun = now()->year;
        $bulan = now()->month;

        $totalAktif = DB::table('m_pegawai')->where('status_aktif', 'Aktif')->count();
        $pns        = DB::table('m_pegawai')->where('status_aktif', 'Aktif')->where('status_pegawai', 'PNS')->count();
        $pppk       = DB::table('m_pegawai')->where('status_aktif', 'Aktif')->where('status_pegawai', 'PPPK')->count();
        $honorer    = DB::table('m_pegawai')->where('status_aktif', 'Aktif')->where('status_pegawai', 'Honorer')->count();

        $hadirHariIni = DB::table('t_absensi')->where('tanggal', now()->toDateString())->whereIn('status', ['Hadir', 'Terlambat'])->count();
        $terlambat    = DB::table('t_absensi')->where('tanggal', now()->toDateString())->where('status', 'Terlambat')->count();

        $cutiPending        = DB::table('t_cuti')->where('status', 'Pending')->count();
        $strExpiring        = DB::table('t_str_records')->whereNotNull('tanggal_kadaluarsa')
            ->where('tanggal_kadaluarsa', '>=', now()->toDateString())
            ->where('tanggal_kadaluarsa', '<=', now()->addDays(90)->toDateString())->count();
        $kontrakExpiring    = DB::table('t_kontrak_pegawai')->where('status_kontrak', 'Aktif')
            ->where('tanggal_selesai', '<=', now()->addDays(30)->toDateString())
            ->where('tanggal_selesai', '>=', now()->toDateString())->count();
        $pensiunMendekati   = DB::table('m_pegawai')->where('status_aktif', 'Aktif')
            ->whereNotNull('batas_pensiun')
            ->where('batas_pensiun', '<=', now()->addDays(90)->toDateString())
            ->where('batas_pensiun', '>=', now()->toDateString())->count();

        $insidenYTD   = DB::table('t_insiden_k3rs')->whereYear('tanggal_insiden', $tahun)->count();
        $insidenBerat = DB::table('t_insiden_k3rs')->whereYear('tanggal_insiden', $tahun)
            ->whereIn('tingkat_keparahan', ['Berat', 'Fatal'])->count();

        $totalRBK = DB::table('t_rbk_bulanan')->where('bulan', $bulan)->where('tahun', $tahun)
            ->whereIn('status', ['Approved', 'Dibayarkan'])->sum('total_rbk');
        $totalTPP = DB::table('t_tpp_bulanan')->where('bulan', $bulan)->where('tahun', $tahun)
            ->whereIn('status', ['Approved', 'Dibayarkan'])->sum('total_tpp');

        $totalTT  = (int) \App\Models\Pengaturan::get('total_tempat_tidur', '200');
        $borManual = (float) \App\Models\Pengaturan::get('bor_manual', '0');

        $rataSkp = DB::table('t_skp_header')->where('tahun', $tahun)->where('status', 'Disetujui')->avg('nilai_akhir');

        return response()->json([
            'status' => 'success',
            'data'   => compact(
                'totalAktif', 'pns', 'pppk', 'honorer',
                'hadirHariIni', 'terlambat', 'cutiPending',
                'strExpiring', 'kontrakExpiring', 'pensiunMendekati',
                'insidenYTD', 'insidenBerat',
                'totalRBK', 'totalTPP',
                'totalTT', 'borManual',
                'rataSkp'
            ),
            'generated_at' => now()->toIso8601String(),
        ]);
    });

    // ── Workforce Map ─────────────────────────────────────────────────────────
    Route::get('workforce-map', function () {
        $unitStats = DB::table('m_pegawai')
            ->where('status_aktif', 'Aktif')
            ->selectRaw('unit_kerja, COUNT(*) as jumlah, SUM(status_pegawai="PNS") as pns, SUM(status_pegawai="PPPK") as pppk, SUM(status_pegawai="Honorer") as honorer')
            ->groupBy('unit_kerja')
            ->orderByDesc('jumlah')
            ->get();

        $absensiHariIni = DB::table('t_absensi as a')
            ->join('m_pegawai as p', 'p.id', '=', 'a.pegawai_id')
            ->where('a.tanggal', now()->toDateString())
            ->whereIn('a.status', ['Hadir', 'Terlambat'])
            ->selectRaw('p.unit_kerja, COUNT(*) as hadir')
            ->groupBy('p.unit_kerja')
            ->pluck('hadir', 'unit_kerja');

        $result = $unitStats->map(fn($u) => [
            'unit_kerja'     => $u->unit_kerja,
            'jumlah'         => $u->jumlah,
            'pns'            => $u->pns,
            'pppk'           => $u->pppk,
            'honorer'        => $u->honorer,
            'hadir_hari_ini' => $absensiHariIni[$u->unit_kerja] ?? 0,
            'kehadiran_pct'  => $u->jumlah > 0 ? round(($absensiHariIni[$u->unit_kerja] ?? 0) / $u->jumlah * 100, 1) : 0,
        ]);

        return response()->json(['status' => 'success', 'data' => $result]);
    });



    // Trend kehadiran 6 bulan terakhir (real data from t_absensi)
    Route::get('trend-absensi', function () {
        $months = collect(range(5, 0))->map(fn($m) => now()->subMonths($m));

        $data = $months->map(function ($month) {
            $bulan = $month->month;
            $tahun = $month->year;
            $total = DB::table('t_absensi')
                ->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->count();
            $hadir = DB::table('t_absensi')
                ->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)
                ->whereIn('status', ['Hadir', 'Terlambat'])->count();
            $terlambat = DB::table('t_absensi')
                ->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)
                ->where('status', 'Terlambat')->count();
            $alpha = DB::table('t_absensi')
                ->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)
                ->where('status', 'Alpha')->count();

            return [
                'bulan'      => $month->isoFormat('MMM YY'),
                'hadir'      => $hadir,
                'terlambat'  => $terlambat,
                'alpha'      => $alpha,
                'persentase' => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        });

        return response()->json(['status' => 'success', 'data' => $data]);
    });

    // Kontrak yang akan habis dalam 30 hari
    Route::get('kontrak-expiring', function () {
        $kontrak = DB::table('t_kontrak_pegawai as k')
            ->join('m_pegawai as p', 'p.id', '=', 'k.pegawai_id')
            ->where('k.status_kontrak', 'Aktif')
            ->whereBetween('k.tanggal_selesai', [now()->toDateString(), now()->addDays(30)->toDateString()])
            ->select(
                'p.nip', 'p.nama', 'p.jabatan', 'p.unit_kerja', 'p.status_pegawai',
                'k.tanggal_selesai', 'k.posisi_tugas',
                DB::raw('DATEDIFF(k.tanggal_selesai, CURDATE()) as hari_tersisa')
            )
            ->orderBy('k.tanggal_selesai')
            ->get();

        return response()->json(['status' => 'success', 'data' => $kontrak, 'total' => $kontrak->count()]);
    });

    // STR/SIP expiring per unit kerja (heat map data)
    Route::get('str-by-unit', function () {
        $expiring = DB::table('t_str_records as s')
            ->join('m_pegawai as p', 'p.id', '=', 's.pegawai_id')
            ->whereNotNull('s.tanggal_kadaluarsa')
            ->where('s.tanggal_kadaluarsa', '>=', now()->toDateString())
            ->where('s.tanggal_kadaluarsa', '<=', now()->addDays(90)->toDateString())
            ->where('p.status_aktif', 'Aktif')
            ->selectRaw('p.unit_kerja, COUNT(*) as jumlah')
            ->groupBy('p.unit_kerja')
            ->orderByDesc('jumlah')
            ->limit(10)
            ->get();

        return response()->json(['status' => 'success', 'data' => $expiring]);
    });

    // Distribusi pegawai per golongan dan status
    Route::get('demografi', function () {
        $perStatus = DB::table('m_pegawai')
            ->where('status_aktif', 'Aktif')
            ->selectRaw('status_pegawai, COUNT(*) as jumlah')
            ->groupBy('status_pegawai')
            ->get();

        $perGolongan = DB::table('m_pegawai')
            ->where('status_aktif', 'Aktif')
            ->whereNotNull('golongan')
            ->selectRaw('SUBSTRING(golongan, 1, 1) as tingkat, COUNT(*) as jumlah')
            ->groupBy('tingkat')
            ->orderBy('tingkat')
            ->get();

        $perUnit = DB::table('m_pegawai')
            ->where('status_aktif', 'Aktif')
            ->selectRaw('unit_kerja, COUNT(*) as jumlah')
            ->groupBy('unit_kerja')
            ->orderByDesc('jumlah')
            ->limit(10)
            ->get();

        $pensiunMendekati = DB::table('m_pegawai')
            ->where('status_aktif', 'Aktif')
            ->whereNotNull('batas_pensiun')
            ->where('batas_pensiun', '<=', now()->addYear()->toDateString())
            ->count();

        return response()->json([
            'status' => 'success',
            'data'   => compact('perStatus', 'perGolongan', 'perUnit', 'pensiunMendekati'),
        ]);
    });
});
