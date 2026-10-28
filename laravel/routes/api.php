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
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\SlipGajiPdfController;
use App\Http\Controllers\LaporanBKDController;
use App\Http\Controllers\KGBController;
use App\Http\Controllers\ImportAbsensiController;
use App\Http\Controllers\SuratController;
use App\Http\Controllers\TPPController;
use App\Http\Controllers\DiklatController;
use App\Http\Controllers\BPJSController;
use App\Http\Controllers\RekrutmenController;
use App\Http\Controllers\RBKController;
use App\Http\Controllers\PensiunController;
use App\Http\Controllers\MutasiController;
use App\Http\Controllers\KenaikanPangkatController;
use App\Http\Controllers\SKPController;
use App\Http\Controllers\DisiplinController;
use App\Http\Controllers\KontrakController;
use App\Http\Controllers\HubunganIndustrialController;
use App\Http\Controllers\PenghargaanController;
use App\Http\Controllers\PenjadwalanController;
use App\Http\Controllers\KomiteController;
use App\Http\Controllers\NotifPreferenceController;

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
    Route::get('absensi/harian', [AbsensiController::class, 'harian']);
    Route::post('absensi', [AbsensiController::class, 'store']);
    Route::put('absensi/{absensi}', [AbsensiController::class, 'update']);
    Route::delete('absensi/{absensi}', [AbsensiController::class, 'destroy']);

    // 4. Credentialing & Lisensi Nakes
    Route::get('credentialing', [CredentialingController::class, 'index']);
    Route::post('credentialing', [CredentialingController::class, 'store']);
    Route::post('credentialing/{credentialing}/rekomendasi', [CredentialingController::class, 'submitRekomendasi']);
    Route::post('credentialing/{credentialing}/issue-spk', [CredentialingController::class, 'issueSpk']);
    Route::get('credentialing/license-alerts', [CredentialingController::class, 'licenseAlerts']);
    Route::get('credentialing/privilege-matrix', [CredentialingController::class, 'privilegeMatrix']);

    // 5. OPPE / FPPE
    Route::get('oppe/summary', [\App\Http\Controllers\OppeFppeController::class, 'summary']);
    Route::get('oppe',         [\App\Http\Controllers\OppeFppeController::class, 'index']);
    Route::post('oppe',        [\App\Http\Controllers\OppeFppeController::class, 'store']);
    Route::put('oppe/{oppe}',  [\App\Http\Controllers\OppeFppeController::class, 'update']);
    Route::delete('oppe/{oppe}', [\App\Http\Controllers\OppeFppeController::class, 'destroy']);

    // 6. WISN — Analisis Kebutuhan Tenaga
    Route::get('wisn/summary',  [\App\Http\Controllers\WisnController::class, 'summary']);
    Route::get('wisn/saran-wkt',[\App\Http\Controllers\WisnController::class, 'saranWkt']);
    Route::get('wisn',          [\App\Http\Controllers\WisnController::class, 'index']);
    Route::post('wisn',         [\App\Http\Controllers\WisnController::class, 'store']);
    Route::put('wisn/{wisn}',   [\App\Http\Controllers\WisnController::class, 'update']);
    Route::delete('wisn/{wisn}',[\App\Http\Controllers\WisnController::class, 'destroy']);

    // 7. KARS Document Tracker
    Route::get('kars',              [\App\Http\Controllers\KarsController::class, 'index']);
    Route::put('kars/{kars}',       [\App\Http\Controllers\KarsController::class, 'update']);
    Route::post('kars/bulk-update', [\App\Http\Controllers\KarsController::class, 'bulkUpdate']);

    // 8. Exit Interview & Turnover
    Route::get('exit-interview/summary',            [\App\Http\Controllers\ExitInterviewController::class, 'summary']);
    Route::get('exit-interview',                    [\App\Http\Controllers\ExitInterviewController::class, 'index']);
    Route::post('exit-interview',                   [\App\Http\Controllers\ExitInterviewController::class, 'store']);
    Route::delete('exit-interview/{exitInterview}', [\App\Http\Controllers\ExitInterviewController::class, 'destroy']);

    // 9. Burnout Early Warning
    Route::get('burnout/dashboard', [\App\Http\Controllers\BurnoutController::class, 'dashboard']);

    // 10. Remuneration Analytics
    Route::get('remunerasi/analytics', [\App\Http\Controllers\RemunerasiAnalyticsController::class, 'index']);

    // 11. SISDMK (via existing IntegrationController)
    Route::get('integrasi/sisdmk/preview', [\App\Http\Controllers\IntegrationController::class, 'sisdmkPreview']);
    Route::get('integrasi/sisdmk/export',  [\App\Http\Controllers\IntegrationController::class, 'sisdmkExport']);

    // 12. Audit Trail Log (dari DB nyata)
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

    // 6. Backup — admin only
    Route::middleware('can:backup.manage')->group(function () {
        Route::get('settings/backup/history', function () {
            $dir     = storage_path('backups');
            $backups = [];
            if (is_dir($dir)) {
                $files = glob("{$dir}/backup_*.sql*") ?: [];
                rsort($files);
                foreach (array_slice($files, 20) as $f) {
                    $bytes = filesize($f);
                    $backups[] = [
                        'filename'       => basename($f),
                        'created_at'     => date('c', filemtime($f)),
                        'size_bytes'     => $bytes,
                        'size_formatted' => round($bytes / 1024 / 1024, 1) . ' MB',
                        'type'           => 'Auto',
                        'status'         => 'COMPLETED',
                    ];
                }
            }
            return response()->json([
                'status'  => 'success',
                'data'    => $backups,
                'summary' => [
                    'total_backups' => count($backups),
                    'database_name' => config('database.connections.mysql.database'),
                    'last_backup'   => $backups[0]['created_at'] ?? null,
                ],
            ]);
        });

        Route::post('settings/backup/trigger', function (\Illuminate\Http\Request $request) {
            abort_unless(auth()->user()->hasRole('admin'), 403);
            \Artisan::call('hcms:backup-db');
            $output = trim(\Artisan::output());
            \App\Models\ActivityLog::record(
                action: 'EXPORT',
                severity: 'warning',
                targetType: 'Database',
                targetLabel: 'Manual backup',
                description: 'Backup manual dipicu via UI.',
                request: $request,
            );
            return response()->json([
                'status'  => 'success',
                'message' => $output ?: 'Backup berhasil dijalankan.',
            ]);
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

    // 17. Laporan & Compliance
    Route::prefix('laporan')->group(function () {
        Route::get('kepatuhan-kars', [\App\Http\Controllers\LaporanController::class, 'kepatuhanKARS']);
        Route::get('absensi-tahunan', [\App\Http\Controllers\LaporanController::class, 'absensiTahunan']);
        Route::get('turnover', [\App\Http\Controllers\LaporanController::class, 'turnoverPegawai']);
        Route::get('rekap-payroll', [\App\Http\Controllers\LaporanController::class, 'rekapPayroll']);
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

    // 18. WhatsApp test (admin only)
    Route::post('whatsapp/test', function (\Illuminate\Http\Request $request) {
        $request->validate(['phone' => 'required|string', 'message' => 'required|string|max:500']);
        abort_unless(auth()->user()->hasRole('admin'), 403);
        $sent = \App\Services\WhatsAppService::send($request->phone, $request->message);
        return response()->json(['status' => $sent ? 'success' : 'failed', 'enabled' => config('whatsapp.enabled')]);
    });

    // 16. Government Integrations
    Route::prefix('integration')->group(function () {
        Route::get('status', [IntegrationController::class, 'status']);
        Route::post('satusehat/sync', [IntegrationController::class, 'satusehatSync']);
        Route::get('satusehat/practitioner', [IntegrationController::class, 'satusehatPractitioner']);
        Route::post('siasn/sync', [IntegrationController::class, 'siasnSync']);
        Route::get('logs', [IntegrationController::class, 'integrationLogs']);
    });

    // 21. Laporan BKD Format Resmi
    Route::prefix('laporan-bkd')->group(function () {
        Route::get('duk',           [LaporanBKDController::class, 'duk']);
        Route::get('bezetting',     [LaporanBKDController::class, 'bezetting']);
        Route::get('rekap-absensi', [LaporanBKDController::class, 'rekapAbsensi']);
    });

    // 22. KGB (Kenaikan Gaji Berkala)
    Route::post('kgb/bulk-calculate', [KGBController::class, 'bulkCalculate']);
    Route::get('kgb',               [KGBController::class, 'index']);
    Route::put('kgb/{pegawai}',     [KGBController::class, 'update']);

    // 23. Import Absensi Mesin Fingerprint
    Route::get('import/absensi/template', [ImportAbsensiController::class, 'template']);
    Route::post('import/absensi', [ImportAbsensiController::class, 'store']);

    // 24. Generator Surat Kepegawaian
    Route::prefix('surat')->group(function () {
        Route::post('keterangan-bekerja', [SuratController::class, 'keteranganBekerja']);
        Route::post('surat-tugas', [SuratController::class, 'suratTugas']);
        Route::post('surat-cuti', [SuratController::class, 'suratCuti']);
        Route::post('kontrak-pppk', [SuratController::class, 'kontrakPPPK']);
    });

    // 25. TPP (Tambahan Penghasilan Pegawai)
    Route::prefix('tpp')->group(function () {
        Route::get('/',                 [TPPController::class, 'index']);
        Route::post('/generate',        [TPPController::class, 'store']);
        Route::post('/bulk-generate',   [TPPController::class, 'bulkGenerate']);
        Route::get('/export',           [TPPController::class, 'export']);
        Route::get('/kelas',            [TPPController::class, 'kelas']);
        Route::post('/kelas',           [TPPController::class, 'storeKelas']);
        Route::delete('/kelas/{kelas}', [TPPController::class, 'destroyKelas']);
        Route::post('/{tpp}/approve',   [TPPController::class, 'approve']);
        Route::post('/{tpp}/bayar',     [TPPController::class, 'bayar']);
    });

    // 26. Rekrutmen (Admin)
    Route::prefix('rekrutmen')->group(function () {
        Route::get('formasi',                      [RekrutmenController::class, 'indexFormasi']);
        Route::post('formasi',                     [RekrutmenController::class, 'storeFormasi']);
        Route::put('formasi/{formasi}',            [RekrutmenController::class, 'updateFormasi']);
        Route::post('formasi/{formasi}/aktifkan',  [RekrutmenController::class, 'activateFormasi']);
        Route::post('formasi/{formasi}/tutup',     [RekrutmenController::class, 'closeFormasi']);
        Route::get('lamaran',                      [RekrutmenController::class, 'indexLamaran']);
        Route::get('lamaran/{lamaran}',            [RekrutmenController::class, 'showLamaran']);
        Route::put('lamaran/{lamaran}/status',     [RekrutmenController::class, 'updateStatus']);
        Route::get('export-lamaran',               [RekrutmenController::class, 'exportLamaran']);
    });

    // 27. Diklat & Kompetensi
    Route::apiResource('diklat', DiklatController::class);
    Route::get('diklat-rekap',                [DiklatController::class, 'rekap']);
    Route::post('diklat/{diklat}/sertifikat', [DiklatController::class, 'uploadSertifikat']);

    // 28. BPJS e-Reporting
    Route::prefix('bpjs')->group(function () {
        Route::get('export-tk',        [BPJSController::class, 'exportTK']);
        Route::get('export-kesehatan', [BPJSController::class, 'exportKesehatan']);
        Route::get('summary',          [BPJSController::class, 'summary']);
    });

    // 29. RBK (Remunerasi Berbasis Kinerja) — wajib RS BLUD
    Route::prefix('rbk')->group(function () {
        Route::get('/',                   [RBKController::class, 'index']);
        Route::post('/generate',          [RBKController::class, 'store']);
        Route::post('/bulk-generate',     [RBKController::class, 'bulkGenerate']);
        Route::post('/{rbk}/approve',     [RBKController::class, 'approve']);
        Route::post('/{rbk}/bayar',       [RBKController::class, 'bayar']);
        Route::get('/export',             [RBKController::class, 'export']);
        Route::get('/indeks',             [RBKController::class, 'indeks']);
        Route::post('/indeks',            [RBKController::class, 'storeIndeks']);
        Route::delete('/indeks/{indeks}', [RBKController::class, 'destroyIndeks']);
    });

    // 30. Pensiun Tracker
    Route::prefix('pensiun')->group(function () {
        Route::get('/',                 [PensiunController::class, 'index']);
        Route::get('/stats',            [PensiunController::class, 'stats']);
        Route::post('/surat-pengantar', [PensiunController::class, 'generateSuratPengantar']);
    });

    // 31. Mutasi Jabatan
    Route::prefix('mutasi')->group(function () {
        Route::get('/',                  [MutasiController::class, 'index']);
        Route::post('/',                 [MutasiController::class, 'store']);
        Route::post('/surat-mutasi',     [MutasiController::class, 'generateSuratMutasi']);
        Route::get('/riwayat/{pegawai}', [MutasiController::class, 'riwayat']);
    });

    // 32. Kenaikan Pangkat
    Route::prefix('kenaikan-pangkat')->group(function () {
        Route::get('/',               [KenaikanPangkatController::class, 'index']);
        Route::post('/',              [KenaikanPangkatController::class, 'store']);
        Route::put('/{id}/status',    [KenaikanPangkatController::class, 'updateStatus']);
        Route::post('/surat-usulan',  [KenaikanPangkatController::class, 'generateSuratUsulan']);
    });

    // 33. SKP (Sasaran Kinerja Pegawai) — PermenPAN-RB No. 6/2022
    Route::prefix('skp')->group(function () {
        Route::get('/',                          [SKPController::class, 'index']);
        Route::post('/',                         [SKPController::class, 'store']);
        Route::get('/summary',                   [SKPController::class, 'summary']);
        Route::put('/detail/{detail}/realisasi', [SKPController::class, 'updateRealisasi']);
        Route::get('/{skp}',                     [SKPController::class, 'show']);
        Route::put('/{skp}',                     [SKPController::class, 'update']);
        Route::post('/{skp}/ajukan',             [SKPController::class, 'ajukan']);
        Route::post('/{skp}/nilai',              [SKPController::class, 'nilai']);
        Route::post('/{skp}/setujui',            [SKPController::class, 'setujui']);
    });

    // 34. Disiplin ASN (PP 94/2021)
    Route::prefix('disiplin')->group(function () {
        Route::get('/',              [DisiplinController::class, 'index']);
        Route::get('/stats',         [DisiplinController::class, 'stats']);
        Route::post('/',             [DisiplinController::class, 'store']);
        Route::put('/{id}',          [DisiplinController::class, 'update']);
        Route::delete('/{id}',       [DisiplinController::class, 'destroy']);
        Route::post('/sk-disiplin',  [DisiplinController::class, 'generateSKDisiplin']);
    });

    // 38. Penjadwalan Shift
    Route::prefix('jadwal')->group(function () {
        Route::get('/rekap',         [PenjadwalanController::class, 'rekap']);
        Route::post('/auto-generate',[PenjadwalanController::class, 'autoGenerate']);
        Route::get('/',              [PenjadwalanController::class, 'index']);
        Route::post('/bulk',       [PenjadwalanController::class, 'bulkStore']);
        Route::post('/swap',       [PenjadwalanController::class, 'swap']);
        Route::post('/',           [PenjadwalanController::class, 'store']);
        Route::put('/{jadwal}',    [PenjadwalanController::class, 'update']);
        Route::delete('/{jadwal}', [PenjadwalanController::class, 'destroy']);
    });

    // 39. Komite Rumah Sakit
    Route::prefix('komite')->group(function () {
        Route::get('/anggota',                 [KomiteController::class, 'indexAnggota']);
        Route::post('/anggota',                [KomiteController::class, 'storeAnggota']);
        Route::put('/anggota/{anggota}',       [KomiteController::class, 'updateAnggota']);
        Route::delete('/anggota/{anggota}',    [KomiteController::class, 'destroyAnggota']);
        Route::get('/kegiatan',                [KomiteController::class, 'indexKegiatan']);
        Route::post('/kegiatan',               [KomiteController::class, 'storeKegiatan']);
        Route::put('/kegiatan/{kegiatan}',     [KomiteController::class, 'updateKegiatan']);
        Route::delete('/kegiatan/{kegiatan}',  [KomiteController::class, 'destroyKegiatan']);
        Route::get('/',                        [KomiteController::class, 'indexKomite']);
        Route::post('/',                       [KomiteController::class, 'storeKomite']);
        Route::put('/{komite}',                [KomiteController::class, 'updateKomite']);
        Route::delete('/{komite}',             [KomiteController::class, 'destroyKomite']);
    });

    // 35. Kontrak Pegawai + Expiry Alerts
    Route::prefix('kontrak')->group(function () {
        Route::get('/',                       [KontrakController::class, 'index']);
        Route::get('/expiring',               [KontrakController::class, 'expiring']);
        Route::post('/',                      [KontrakController::class, 'store']);
        Route::put('/{kontrak}',              [KontrakController::class, 'update']);
        Route::post('/{kontrak}/perpanjang',  [KontrakController::class, 'perpanjang']);
        Route::post('/generate-pdf',          [KontrakController::class, 'generateKontrak']);
    });

    // 36. K3RS — Keselamatan & Kesehatan Kerja RS (Wajib KARS)
    Route::prefix('k3rs')->group(function () {
        // stats/coverage routes before wildcards
        Route::get('/insiden/stats',     [\App\Http\Controllers\K3RSController::class, 'statsInsiden']);
        Route::get('/insiden',           [\App\Http\Controllers\K3RSController::class, 'indexInsiden']);
        Route::post('/insiden',          [\App\Http\Controllers\K3RSController::class, 'storeInsiden']);
        Route::put('/insiden/{insiden}', [\App\Http\Controllers\K3RSController::class, 'updateInsiden']);

        Route::get('/vaksinasi/coverage',      [\App\Http\Controllers\K3RSController::class, 'coverage']);
        Route::get('/vaksinasi',               [\App\Http\Controllers\K3RSController::class, 'indexVaksinasi']);
        Route::post('/vaksinasi',              [\App\Http\Controllers\K3RSController::class, 'storeVaksinasi']);
        Route::put('/vaksinasi/{vaksinasi}',   [\App\Http\Controllers\K3RSController::class, 'updateVaksinasi']);
        Route::delete('/vaksinasi/{vaksinasi}',[\App\Http\Controllers\K3RSController::class, 'destroyVaksinasi']);

        Route::get('/mcu/summary',  [\App\Http\Controllers\K3RSController::class, 'mcuSummary']);
        Route::get('/mcu',          [\App\Http\Controllers\K3RSController::class, 'indexMCU']);
        Route::post('/mcu',         [\App\Http\Controllers\K3RSController::class, 'storeMCU']);
        Route::put('/mcu/{mcu}',    [\App\Http\Controllers\K3RSController::class, 'updateMCU']);
        Route::delete('/mcu/{mcu}', [\App\Http\Controllers\K3RSController::class, 'destroyMCU']);
    });

    // 38. Organisasi & Unit Kerja
    Route::prefix('organisasi')->group(function () {
        Route::get('tree', function () {
            $rows = \Illuminate\Support\Facades\DB::table('m_unit_kerja as u')
                ->leftJoin('m_pegawai as p', 'p.id', '=', 'u.kepala_id')
                ->select('u.*',
                    'p.nama as nama_kepala',
                    'p.jabatan as jabatan_kepala',
                    \Illuminate\Support\Facades\DB::raw(
                        '(SELECT COUNT(*) FROM m_pegawai WHERE unit_kerja = u.nama_unit AND status_aktif = "Aktif") as jumlah_pegawai'
                    ))
                ->orderBy('u.level')->orderBy('u.nama_unit')
                ->get();

            // Convert to keyed array of arrays for easy tree assembly
            $byId = [];
            foreach ($rows as $row) {
                $byId[$row->id] = (array) $row;
                $byId[$row->id]['children'] = [];
            }
            $tree = [];
            foreach ($byId as $id => &$node) {
                if ($node['parent_id'] && isset($byId[$node['parent_id']])) {
                    $byId[$node['parent_id']]['children'][] = &$node;
                } else {
                    $tree[] = &$node;
                }
            }
            unset($node);

            return response()->json(['status' => 'success', 'data' => array_values($tree)]);
        });

        Route::get('units', function () {
            $units = \Illuminate\Support\Facades\DB::table('m_unit_kerja')->orderBy('nama_unit')->get();
            return response()->json(['status' => 'success', 'data' => $units]);
        });

        Route::post('units', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'nama_unit' => 'required|string|max:150',
                'kode_unit' => 'nullable|string|max:20',
                'parent_id' => 'nullable|exists:m_unit_kerja,id',
                'kepala_id' => 'nullable|exists:m_pegawai,id',
                'level'     => 'required|integer|min:1',
            ]);
            abort_unless(auth()->user()->hasRole('admin'), 403);
            $id = \Illuminate\Support\Facades\DB::table('m_unit_kerja')->insertGetId(
                array_merge(
                    $request->only(['nama_unit', 'kode_unit', 'parent_id', 'kepala_id', 'level']),
                    ['created_at' => now(), 'updated_at' => now()]
                )
            );
            return response()->json(['status' => 'success', 'data' => ['id' => $id]], 201);
        });
    });

    // 37. Angka Kredit JFT (Jabatan Fungsional Tertentu)
    Route::prefix('angka-kredit')->group(function () {
        Route::get('/rekap',            [\App\Http\Controllers\AngkaKreditController::class, 'rekap']);
        Route::get('/target',           [\App\Http\Controllers\AngkaKreditController::class, 'target']);
        Route::post('/target',          [\App\Http\Controllers\AngkaKreditController::class, 'storeTarget']);
        Route::get('/',                 [\App\Http\Controllers\AngkaKreditController::class, 'index']);
        Route::post('/',                [\App\Http\Controllers\AngkaKreditController::class, 'store']);
        Route::post('/ajukan',          [\App\Http\Controllers\AngkaKreditController::class, 'ajukan']);
        Route::post('/{id}/verifikasi', [\App\Http\Controllers\AngkaKreditController::class, 'verifikasi']);
        Route::post('/{id}/setujui',    [\App\Http\Controllers\AngkaKreditController::class, 'setujui']);
    });

    // 38. Hubungan Industrial (Grievance & PHK)
    Route::prefix('hubungan-industrial')->group(function () {
        Route::get('/grievance/stats',        [HubunganIndustrialController::class, 'statsGrievance']);
        Route::get('/grievance',              [HubunganIndustrialController::class, 'indexGrievance']);
        Route::post('/grievance',             [HubunganIndustrialController::class, 'storeGrievance']);
        Route::put('/grievance/{grievance}',  [HubunganIndustrialController::class, 'updateGrievance']);
        Route::get('/phk',                    [HubunganIndustrialController::class, 'indexPHK']);
        Route::post('/phk',                   [HubunganIndustrialController::class, 'storePHK']);
        Route::post('/phk/surat',             [HubunganIndustrialController::class, 'generateSuratPHK']);
    });

    // 39. Penghargaan Pegawai
    Route::prefix('penghargaan')->group(function () {
        Route::get('/stats',                       [PenghargaanController::class, 'stats']);
        Route::get('/',                            [PenghargaanController::class, 'index']);
        Route::post('/',                           [PenghargaanController::class, 'store']);
        Route::put('/{penghargaan}',               [PenghargaanController::class, 'update']);
        Route::delete('/{penghargaan}',            [PenghargaanController::class, 'destroy']);
        Route::post('/{penghargaan}/sertifikat',   [PenghargaanController::class, 'uploadSertifikat']);
    });

    // 40. Onboarding
    Route::get('onboarding/status', function () {
        return response()->json([
            'status' => 'success',
            'data'   => [
                'completed' => \App\Models\Pengaturan::get('onboarding_completed', 'false') === 'true',
                'step'      => (int) \App\Models\Pengaturan::get('onboarding_step', '1'),
            ],
        ]);
    });

    Route::post('onboarding/complete', function () {
        abort_unless(auth()->user()->hasRole('admin'), 403);
        \App\Models\Pengaturan::set('onboarding_completed', 'true');
        \App\Models\Pengaturan::set('onboarding_step', '6');
        \App\Models\ActivityLog::record(action: 'UPDATE', targetType: 'Pengaturan', targetLabel: 'Onboarding selesai', description: 'Setup awal HCMS selesai dilakukan.');
        return response()->json(['status' => 'success', 'message' => 'Setup selesai.']);
    });

    Route::post('onboarding/step', function (\Illuminate\Http\Request $request) {
        $request->validate(['step' => 'required|integer|between:1,6']);
        abort_unless(auth()->user()->hasRole('admin'), 403);
        \App\Models\Pengaturan::set('onboarding_step', (string) $request->step);
        return response()->json(['status' => 'success']);
    });

    // ── Bulk Operations ───────────────────────────────────────────────────────────
    Route::post('cuti/bulk-approve', function (\Illuminate\Http\Request $request) {
        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer|exists:t_cuti,id']);
        abort_unless(auth()->user()->can('cuti.approve-unit'), 403);
        $approver = auth()->user();
        $count = 0;
        foreach ($request->ids as $id) {
            $cuti = \App\Models\Cuti::find($id);
            if ($cuti && $cuti->status === 'Pending') {
                app(\App\Services\CutiService::class)->approve($cuti, $approver, 'Bulk approve');
                $count++;
            }
        }
        \App\Models\ActivityLog::record(action:'APPROVE', targetType:'Cuti (Bulk)',
            targetLabel:"Bulk approve {$count} pengajuan cuti", description:'Bulk approval oleh '.auth()->user()->nama, request:$request);
        return response()->json(['status' => 'success', 'message' => "{$count} cuti berhasil disetujui."]);
    });

    Route::post('cuti/bulk-reject', function (\Illuminate\Http\Request $request) {
        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer|exists:t_cuti,id', 'alasan' => 'required|string|max:500']);
        abort_unless(auth()->user()->can('cuti.approve-unit'), 403);
        $approver = auth()->user();
        $count = 0;
        foreach ($request->ids as $id) {
            $cuti = \App\Models\Cuti::find($id);
            if ($cuti && $cuti->status === 'Pending') {
                app(\App\Services\CutiService::class)->reject($cuti, $approver, $request->alasan);
                $count++;
            }
        }
        return response()->json(['status' => 'success', 'message' => "{$count} cuti berhasil ditolak."]);
    });

    Route::post('pegawai/bulk-status', function (\Illuminate\Http\Request $request) {
        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer|exists:m_pegawai,id', 'status_aktif' => 'required|in:Aktif,Pensiun,Diberhentikan']);
        abort_unless(auth()->user()->can('pegawai.edit'), 403);
        \App\Models\Pegawai::whereIn('id', $request->ids)->update(['status_aktif' => $request->status_aktif]);
        \App\Models\ActivityLog::record(action:'UPDATE', severity:'warning', targetType:'Pegawai (Bulk)',
            targetLabel:'Bulk update '.count($request->ids).' pegawai → '.$request->status_aktif, description:'Bulk status update.', request:$request);
        return response()->json(['status' => 'success', 'message' => count($request->ids).' pegawai diperbarui.']);
    });

    // 41. Notification Preferences
    Route::get('notif-preferences',       [NotifPreferenceController::class, 'get']);
    Route::put('notif-preferences',       [NotifPreferenceController::class, 'update']);
    Route::get('notif-preferences/admin', [NotifPreferenceController::class, 'adminGet']);
});

