<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Pengaturan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PengaturanController extends Controller
{
    public function index(): JsonResponse
    {
        $keys   = Pengaturan::all_rs();
        $result = [];

        foreach ($keys as $key) {
            $result[$key] = Pengaturan::get($key);
        }

        return response()->json(['status' => 'success', 'data' => $result]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->authorize('pegawai.edit');

        $keys    = Pengaturan::all_rs();
        $allowed = array_fill_keys($keys, 'nullable|string|max:500');
        $data    = $request->validate($allowed);

        foreach ($data as $key => $value) {
            if (in_array($key, $keys, true)) {
                Pengaturan::set($key, $value);
            }
        }

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'Pengaturan',
            targetLabel: 'Konfigurasi Rumah Sakit',
            description: 'Pembaruan pengaturan RS: ' . implode(', ', array_keys($data)),
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Pengaturan berhasil disimpan.']);
    }
}
