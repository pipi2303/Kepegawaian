<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LoginController extends Controller
{
    /**
     * Tampilkan Halaman Login
     */
    public function create(): Response
    {
        return Inertia::render('Login', [
            'status' => session('status'),
        ]);
    }

    /**
     * Proses Autentikasi Pengguna RS
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login = $request->input('email');
        $password = $request->input('password');

        // Support login via NIP (numeric) atau email
        $field = is_numeric($login) ? 'nip' : 'email';

        if (Auth::attempt([$field => $login, 'password' => $password], $request->boolean('remember'))) {
            $request->session()->regenerate();

            ActivityLog::record(
                action: 'LOGIN',
                targetType: 'Sesi Otentikasi',
                targetLabel: 'Login berhasil',
                description: 'Autentikasi berhasil via ' . $field . '.',
                request: $request,
            );

            return redirect()->intended(route('dashboard'));
        }

        ActivityLog::record(
            action: 'LOGIN',
            severity: 'warning',
            status: 'FAILED',
            targetType: 'Sesi Otentikasi',
            targetLabel: 'Login gagal — ' . $login,
            description: 'Percobaan login gagal.',
            request: $request,
            pegawaiId: null,
        );

        return back()->withErrors([
            'email' => 'NIP atau email yang dimasukkan tidak sesuai dengan data kepegawaian RSUDAM.',
        ])->onlyInput('email');
    }

    /**
     * Logout Sesi
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
