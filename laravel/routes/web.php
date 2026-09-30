<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\PegawaiWebController;
use App\Http\Controllers\Web\CutiWebController;
use App\Http\Controllers\Web\AbsensiWebController;
use App\Http\Controllers\Web\CredentialingWebController;

/*
|--------------------------------------------------------------------------
| Web Routes (Inertia.js)
|--------------------------------------------------------------------------
|
| Routing untuk antarmuka web HCMS Rumah Sakit berbasis Inertia + React.
|
*/

// Guest Routes
Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

// Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    // 1. Dashboard Eksekutif
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Modul Data Pegawai & Employee Management
    Route::get('employee-management', fn() => \Inertia\Inertia::render('EmployeeManagement'))->name('employee-management');
    Route::get('pegawai', [PegawaiWebController::class, 'index'])->name('pegawai.index');
    Route::get('pegawai/{pegawai}', [PegawaiWebController::class, 'show'])->name('pegawai.show');
    Route::post('pegawai', [PegawaiWebController::class, 'store'])->name('pegawai.store');
    Route::put('pegawai/{pegawai}', [PegawaiWebController::class, 'update'])->name('pegawai.update');

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
    Route::post('credentialing/{credentialing}/issue-spk', [CredentialingWebController::class, 'issueSpk'])->name('credentialing.issue-spk');

    // 6. System Activity & Audit Trail Log
    Route::get('activity-log', fn() => \Inertia\Inertia::render('ActivityLog'))->name('activity-log');

    // 7. Pengaturan Sistem & Database Backup
    Route::get('settings', fn() => \Inertia\Inertia::render('AdminSettings'))->name('settings');

    // 8. KPI (Key Performance Indicator) & Performance Management
    Route::get('performance', fn() => \Inertia\Inertia::render('KpiTracking'))->name('performance');
    Route::get('kpi', fn() => \Inertia\Inertia::render('KpiTracking'))->name('kpi');
    Route::get('skp', fn() => \Inertia\Inertia::render('KpiTracking'))->name('skp');
});
