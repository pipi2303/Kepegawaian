<?php

namespace App\Http\Middleware;

use App\Services\LicenseService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateLicense
{
    public function handle(Request $request, Closure $next): Response
    {
        if (in_array(app()->environment(), ['local', 'testing'], true)) {
            return $next($request);
        }

        if (in_array($request->route()?->getName(), ['login', 'logout'], true)) {
            return $next($request);
        }

        if (LicenseService::validate()) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Lisensi tidak valid atau sudah kadaluarsa.',
            ], 403);
        }

        return \Inertia\Inertia::render('LicenseExpired', LicenseService::info())
            ->toResponse($request)
            ->setStatusCode(403);
    }
}
