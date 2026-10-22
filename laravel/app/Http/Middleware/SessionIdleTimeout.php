<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SessionIdleTimeout
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return $next($request);
        }

        $idleMinutes = config('session.idle_timeout', 30);
        $lastActivity = $request->session()->get('last_activity_at');

        if ($lastActivity && now()->diffInMinutes($lastActivity) >= $idleMinutes) {
            $pegawai = Auth::user();

            ActivityLog::record(
                action: 'LOGOUT',
                targetType: 'Sesi Otentikasi',
                targetLabel: 'Sesi berakhir otomatis (idle ' . $idleMinutes . ' menit)',
                description: 'Sesi ' . ($pegawai->nama ?? '-') . ' dihentikan karena tidak aktif.',
                request: $request,
            );

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Sesi berakhir karena tidak aktif.'], 401);
            }

            return redirect()->route('login')->withErrors(['email' => 'Sesi Anda berakhir karena tidak aktif selama ' . $idleMinutes . ' menit.']);
        }

        $request->session()->put('last_activity_at', now());

        return $next($request);
    }
}
