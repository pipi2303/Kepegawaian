<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AiChatController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\CutiController;
use App\Http\Controllers\AbsensiController;
use App\Http\Controllers\CredentialingController;
use App\Http\Controllers\ImportPegawaiController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PengaturanController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\LicenseController;
use App\Http\Controllers\SlipGajiPdfController;

/*
|--------------------------------------------------------------------------
| HCMS API Routes (v1)
|--------------------------------------------------------------------------
|
| Endpoint RESTful untuk Sistem Informasi Manajemen Kepegawaian RSUDAM.
|
*/

Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // 0. Notifikasi — cuti pending + STR/SIP akan kadaluarsa
    Route::get('notifications', function () {
        $cutiNotifs = \App\Models\Cuti::with('pegawai:id,nama,unit_kerja')
            ->where('status', 'Pending')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($c) => [
                'id'        => 'cuti-' . $c->id,
                'type'      => 'leave_request',
                'title'     => 'Permohonan ' . ($c->jenis_cuti ?? 'Cuti'),
                'message'   => ($c->pegawai->nama ?? 'Pegawai') . ' mengajukan ' . ($c->jumlah_hari ?? 1) . ' hari cuti (' . ($c->tanggal_mulai ?? '-') . ' s/d ' . ($c->tanggal_selesai ?? '-') . ')',
                'applicant' => $c->pegawai->nama ?? 'Pegawai',
                'unit'      => $c->pegawai->unit_kerja ?? '-',
                'timestamp' => $c->created_at?->toIso8601String(),
                'unread'    => true,
                'link'      => '/cuti',
                'priority'  => 'high',
            ]);

        $strNotifs = \App\Models\StrRecord::expiringWithin(90)
            ->with('pegawai:id,nama,unit_kerja')
            ->take(5)
            ->get()
            ->map(fn($s) => [
                'id'        => 'str-' . $s->id,
                'type'      => 'credential_alert',
                'title'     => 'STR Segera Kadaluarsa',
                'message'   => ($s->pegawai->nama ?? 'Pegawai') . ' — STR kadaluarsa ' . $s->tanggal_kadaluarsa,
                'applicant' => $s->pegawai->nama ?? '-',
                'unit'      => $s->pegawai->unit_kerja ?? '-',
                'timestamp' => $s->updated_at?->toIso8601String(),
                'unread'    => false,
                'link'      => '/credentialing',
                'priority'  => 'normal',
            ]);

        $all = $cutiNotifs->concat($strNotifs)->sortByDesc('timestamp')->values();

        return response()->json([
            'status'       => 'success',
            'data'         => $all,
            'unread_count' => $all->where('unread', true)->count(),
        ]);
    });

    // Dashboard & Summary Statistics
    Route::get('dashboard/summary', function () {
        $today = now()->toDateString();
        $totalPegawai = \App\Models\Pegawai::where('status_aktif', 'Aktif')->count();
        $absensiHariIni = \App\Models\Absensi::where('tanggal', $today)->get();
        $hadirHariIni = $absensiHariIni->whereIn('status', ['Hadir', 'Terlambat'])->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_pegawai'        => $totalPegawai,
                'pns'                  => \App\Models\Pegawai::where('status_aktif', 'Aktif')->where('status_pegawai', 'PNS')->count(),
                'pppk'                 => \App\Models\Pegawai::where('status_aktif', 'Aktif')->where('status_pegawai', 'PPPK')->count(),
                'honorer'              => \App\Models\Pegawai::where('status_aktif', 'Aktif')->where('status_pegawai', 'Honorer')->count(),
                'hadir_hari_ini'       => $hadirHariIni,
                'terlambat_hari_ini'   => $absensiHariIni->where('status', 'Terlambat')->count(),
                'persentase_kehadiran' => $totalPegawai > 0 ? round(($hadirHariIni / $totalPegawai) * 100, 1) : 0,
                'cuti_pending'         => \App\Models\Cuti::where('status', 'Pending')->count(),
                'str_expiring_soon'    => \App\Models\StrRecord::expiringWithin(90)->count(),
            ],
        ]);
    });

    // 1. Data Pegawai
    Route::apiResource('pegawai', PegawaiController::class);

    // 2. Manajemen Cuti Pegawai (PP 11/2017)
    Route::get('cuti', [CutiController::class, 'index']);
    Route::post('cuti', [CutiController::class, 'store']);
    Route::post('cuti/{cuti}/approve', [CutiController::class, 'approve']);
    Route::post('cuti/{cuti}/reject', [CutiController::class, 'reject']);
    Route::get('pegawai/{pegawai}/sisa-cuti', [CutiController::class, 'getSisaCuti']);

    // 3. Presensi & Absensi Rumah Sakit
    Route::post('absensi/check-in', [AbsensiController::class, 'checkIn']);
    Route::post('absensi/check-out', [AbsensiController::class, 'checkOut']);
    Route::get('absensi/rekap-bulanan', [AbsensiController::class, 'rekapBulanan']);

    // 4. Credentialing & Lisensi Nakes
    Route::get('credentialing', [CredentialingController::class, 'index']);
    Route::post('credentialing', [CredentialingController::class, 'store']);
    Route::post('credentialing/{credentialing}/rekomendasi', [CredentialingController::class, 'submitRekomendasi']);
    Route::post('credentialing/{credentialing}/issue-spk', [CredentialingController::class, 'issueSpk']);
    Route::get('credentialing/license-alerts', [CredentialingController::class, 'licenseAlerts']);

    // 5. Audit Trail Log (dari DB nyata)
    Route::get('activity-logs', function (\Illuminate\Http\Request $request) {
        $query = \App\Models\ActivityLog::with('pegawai:id,nip,nama')
            ->latest('created_at');

        if ($action = $request->input('action')) {
            if ($action !== 'SEMUA') $query->where('action', $action);
        }
        if ($severity = $request->input('severity')) {
            if ($severity !== 'SEMUA') $query->where('severity', $severity);
        }
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('target_label', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $logs = $query->paginate(25);

        $meta = \App\Models\ActivityLog::selectRaw("
            COUNT(*) as total_events,
            SUM(action = 'CREATE') as total_create,
            SUM(action = 'UPDATE') as total_update,
            SUM(action = 'DELETE') as total_delete,
            SUM(severity = 'critical') as critical_events
        ")->first();

        return response()->json([
            'status' => 'success',
            'data'   => $logs,
            'meta'   => $meta,
        ]);
    });

    // 6. Backup — admin only; implementasi nyata di Sprint 3 (ops)
    Route::middleware('can:backup.manage')->group(function () {
        Route::get('settings/backup/history', function () {
            // ponytail: return empty until real backup system is implemented (Sprint 3)
            return response()->json([
                'status'  => 'success',
                'data'    => [],
                'message' => 'Sistem backup belum dikonfigurasi. Hubungi tim IT.',
            ]);
        });

        Route::post('settings/backup/trigger', function (\Illuminate\Http\Request $request) {
            \App\Models\ActivityLog::record(
                action: 'EXPORT',
                severity: 'warning',
                targetType: 'Database',
                targetLabel: 'Backup trigger manual',
                description: 'Permintaan backup manual dicatat. Sistem backup belum dikonfigurasi.',
                request: $request,
            );
            return response()->json([
                'status'  => 'error',
                'message' => 'Sistem backup belum dikonfigurasi. Hubungi tim IT untuk setup mysqldump/cron.',
            ], 501);
        });
    });

    // 8. AI Chat proxy — Gemini dipanggil server-side, API key tidak pernah ke client
    Route::post('ai/chat', [\App\Http\Controllers\AiChatController::class, 'chat']);

    // 9. Import Wizard Pegawai (Excel/CSV)
    Route::get('import/pegawai/template', [ImportPegawaiController::class, 'template']);
    Route::post('import/pegawai', [ImportPegawaiController::class, 'store']);
    Route::get('import/pegawai/history', [ImportPegawaiController::class, 'history']);

    // 10. Konfigurasi Rumah Sakit
    Route::get('pengaturan', [PengaturanController::class, 'index']);
    Route::put('pengaturan', [PengaturanController::class, 'update']);

    // 11. Payroll / Slip Gaji
    Route::get('payroll', [PayrollController::class, 'index']);
    Route::post('payroll/generate', [PayrollController::class, 'store']);
    Route::post('payroll/bulk-generate', [PayrollController::class, 'bulkGenerate']);
    Route::get('payroll/{gaji}', [PayrollController::class, 'show']);
    Route::post('payroll/{gaji}/approve', [PayrollController::class, 'approve']);
    Route::post('payroll/{gaji}/bayar', [PayrollController::class, 'bayar']);

    // 12. License Info
    Route::get('license/info', [LicenseController::class, 'info']);

    // 13. Export Excel
    Route::get('export/pegawai', [ExportController::class, 'pegawai']);
    Route::get('export/absensi', [ExportController::class, 'absensi']);
    Route::get('export/cuti', [ExportController::class, 'cuti']);

    // 14. PDF Slip Gaji
    Route::get('payroll/{gaji}/pdf', [SlipGajiPdfController::class, 'download']);

    // 15. Auth — current user info (dipakai frontend untuk restore session)
    Route::get('auth/me', function () {
        $user = auth()->user();
        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'                => $user->id,
                'nip'               => $user->nip,
                'nama'              => $user->nama_lengkap,
                'email'             => $user->email,
                'jabatan'           => $user->jabatan,
                'unit_kerja'        => $user->unit_kerja,
                'golongan'          => $user->golongan,
                'foto'              => $user->foto,
                'sisa_cuti_tahunan' => $user->sisa_cuti_tahunan,
                'roles'             => $user->getRoleNames(),
                'permissions'       => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    });

    // 7. KPI — dari t_skp_header (PermenPAN-RB No. 6/2022)
    Route::get('kpi/summary', function () {
        $tahun = now()->year;

        $skpQuery = \Illuminate\Support\Facades\DB::table('t_skp_header')
            ->where('tahun', $tahun)
            ->where('status', 'Disetujui');

        $total = $skpQuery->count();
        $rataRata = $total > 0 ? round($skpQuery->avg('nilai_akhir'), 1) : 0;

        $distribusi = $skpQuery->selectRaw("predikat, COUNT(*) as jumlah")
            ->groupBy('predikat')
            ->pluck('jumlah', 'predikat');

        $perUnit = \Illuminate\Support\Facades\DB::table('t_skp_header as s')
            ->join('m_pegawai as p', 'p.id', '=', 's.pegawai_id')
            ->where('s.tahun', $tahun)
            ->where('s.status', 'Disetujui')
            ->selectRaw("p.unit_kerja as unit, ROUND(AVG(s.nilai_akhir), 1) as skor, COUNT(*) as jumlah")
            ->groupBy('p.unit_kerja')
            ->orderByDesc('skor')
            ->limit(10)
            ->get();

        $trendSemester = \Illuminate\Support\Facades\DB::table('t_skp_header')
            ->where('status', 'Disetujui')
            ->whereBetween('tahun', [$tahun - 2, $tahun])
            ->selectRaw("tahun, semester, ROUND(AVG(nilai_akhir), 1) as aktual")
            ->groupBy('tahun', 'semester')
            ->orderBy('tahun')->orderBy('semester')
            ->get()
            ->map(fn($r) => [
                'periode' => $r->tahun . ' Sem ' . $r->semester,
                'target'  => 85,
                'aktual'  => $r->aktual,
            ]);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'tahun'            => $tahun,
                'target_kpi_rs'    => 85.0,
                'rata_rata_kpi'    => $rataRata,
                'total_dievaluasi' => $total,
                'distribusi_predikat' => $distribusi,
                'trend_semester'   => $trendSemester,
                'performa_unit'    => $perUnit,
            ],
        ]);
    });
});

