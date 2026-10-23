<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Self\SelfProfileController;
use App\Http\Controllers\Self\SelfCutiController;
use App\Http\Controllers\Self\SelfPayrollController;

Route::prefix('api/v1/self')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Profile
    Route::get('me', [SelfProfileController::class, 'me']);
    Route::put('me', [SelfProfileController::class, 'update']);

    // Cuti self-service
    Route::get('cuti', [SelfCutiController::class, 'index']);
    Route::post('cuti', [SelfCutiController::class, 'store']);
    Route::get('cuti/sisa', [SelfCutiController::class, 'sisa']);
    Route::get('jadwal', [SelfCutiController::class, 'jadwal']);

    // Payroll self-service
    Route::get('payroll', [SelfPayrollController::class, 'index']);
    Route::get('payroll/{gaji}/pdf', [SelfPayrollController::class, 'pdf']);

    // Credential upload
    Route::post('str-renewal', [SelfProfileController::class, 'uploadStr']);
    Route::post('sip-renewal', [SelfProfileController::class, 'uploadSip']);

    // Absensi self-service (GPS + selfie)
    Route::post('checkin',  [\App\Http\Controllers\Self\SelfAbsensiController::class, 'checkIn']);
    Route::post('checkout', [\App\Http\Controllers\Self\SelfAbsensiController::class, 'checkOut']);
    Route::get('absensi',   [\App\Http\Controllers\Self\SelfAbsensiController::class, 'riwayat']);
});
