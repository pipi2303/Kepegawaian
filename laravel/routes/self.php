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

    // SKP self-service
    Route::get('skp', function () {
        $pegawai = auth()->user();
        $skp = \App\Models\SKPHeader::with('details')
            ->where('pegawai_id', $pegawai->id)
            ->orderByDesc('tahun')->orderByDesc('semester')
            ->paginate(10);
        return response()->json(['status' => 'success', 'data' => $skp]);
    });

    // OPPE self-service
    Route::get('oppe', function () {
        $oppe = \App\Models\OppeFppe::where('pegawai_id', auth()->id())
            ->orderByDesc('id')->get();
        return response()->json(['status' => 'success', 'data' => $oppe]);
    });

    // Lembur self-service
    Route::get('lembur', function () {
        $lembur = \App\Models\Lembur::where('pegawai_id', auth()->id())
            ->latest('tanggal')->paginate(20);
        return response()->json(['status' => 'success', 'data' => $lembur]);
    });
    Route::post('lembur', function (\Illuminate\Http\Request $request) {
        $v = $request->validate([
            'tanggal'     => 'required|date',
            'jam_mulai'   => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'jenis_hari'  => 'required|in:Hari Kerja,Hari Libur,Hari Besar',
            'alasan'      => 'required|string|max:500',
        ]);
        $start = \Illuminate\Support\Carbon::parse($v['jam_mulai']);
        $end   = \Illuminate\Support\Carbon::parse($v['jam_selesai']);
        $lembur = \App\Models\Lembur::create(array_merge($v, [
            'pegawai_id'  => auth()->id(),
            'durasi_jam'  => round($start->diffInMinutes($end) / 60, 2),
            'status'      => 'Diajukan',
        ]));
        return response()->json(['status' => 'success', 'data' => $lembur], 201);
    });

    // Peer review pending (OPPE yang perlu dinilai)
    Route::get('peer-review/pending', [\App\Http\Controllers\OppePeerReviewController::class, 'pending']);
    Route::post('peer-review/{review}', [\App\Http\Controllers\OppePeerReviewController::class, 'submit']);
});
