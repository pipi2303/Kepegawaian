<?php

namespace App\Http\Controllers;

use App\Services\LicenseService;
use Illuminate\Http\JsonResponse;

class LicenseController extends Controller
{
    public function info(): JsonResponse
    {
        $this->authorize('pegawai.edit'); // admin only

        return response()->json([
            'status' => 'success',
            'data'   => LicenseService::info(),
        ]);
    }
}
