<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\PegawaiWebController;
use App\Http\Controllers\Web\CutiWebController;
use App\Http\Controllers\Web\AbsensiWebController;
use App\Http\Controllers\Web\CredentialingWebController;
use App\Http\Middleware\SessionIdleTimeout;

// Guest Routes
Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store'])->middleware('throttle:5,1');
});

// Authenticated Routes — idle timeout aktif di semua route ini
Route::middleware(['auth', SessionIdleTimeout::class])->group(function () {
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    // 1. Dashboard Eksekutif
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Modul Data Pegawai
    Route::get('employee-management', fn() => \Inertia\Inertia::render('EmployeeManagement'))->name('employee-management');
    Route::get('pegawai', [PegawaiWebController::class, 'index'])->name('pegawai.index');
    Route::get('pegawai/{pegawai}', [PegawaiWebController::class, 'show'])->name('pegawai.show');
    Route::post('pegawai', [PegawaiWebController::class, 'store'])->name('pegawai.store');
    Route::put('pegawai/{pegawai}', [PegawaiWebController::class, 'update'])->name('pegawai.update');

    // DELETE pegawai — wajib konfirmasi password (operasi irreversible di tampilan user)
    Route::delete('pegawai/{pegawai}', [PegawaiWebController::class, 'destroy'])
        ->middleware('password.confirm')
        ->name('pegawai.destroy');

    // 3. Modul Cuti Pegawai (PP 11/2017)
    Route::get('cuti', [CutiWebController::class, 'index'])->name('cuti.index');
    Route::post('cuti', [CutiWebController::class, 'store'])->name('cuti.store');
    Route::post('cuti/{cuti}/approve', [CutiWebController::class, 'approve'])->name('cuti.approve');
    Route::post('cuti/{cuti}/reject', [CutiWebController::class, 'reject'])->name('cuti.reject');

    // 4. Modul Presensi & Shift
    Route::get('absensi', [AbsensiWebController::class, 'index'])->name('absensi.index');
    Route::post('absensi/check-in', [AbsensiWebController::class, 'checkIn'])->name('absensi.checkin');
    Route::post('absensi/check-out', [AbsensiWebController::class, 'checkOut'])->name('absensi.checkout');

    // 5. Modul Credentialing & Lisensi Nakes
    Route::get('credentialing', [CredentialingWebController::class, 'index'])->name('credentialing.index');
    Route::post('credentialing', [CredentialingWebController::class, 'store'])->name('credentialing.store');

    // Issue SPK — wajib konfirmasi password (dokumen resmi RS, tidak bisa dibatalkan lewat sistem)
    Route::post('credentialing/{credentialing}/issue-spk', [CredentialingWebController::class, 'issueSpk'])
        ->middleware('password.confirm')
        ->name('credentialing.issue-spk');

    // 6. Audit Trail
    Route::get('activity-log', fn() => \Inertia\Inertia::render('ActivityLog'))->name('activity-log');

    // 7. Pengaturan Sistem
    Route::get('settings', fn() => \Inertia\Inertia::render('AdminSettings'))->name('settings');

    // 8. KPI & Performance Management
    Route::get('performance', fn() => \Inertia\Inertia::render('KpiTracking'))->name('performance');
    Route::get('kpi', fn() => \Inertia\Inertia::render('KpiTracking'))->name('kpi');
    Route::get('skp', fn() => \Inertia\Inertia::render('KpiTracking'))->name('skp');
});
