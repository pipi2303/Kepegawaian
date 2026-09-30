<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Cuti;
use App\Models\StrRecord;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $pegawai = $user ? $user->pegawai : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ] : null,
                'pegawai' => $pegawai ? [
                    'id' => $pegawai->id,
                    'nip' => $pegawai->nip,
                    'nama' => $pegawai->nama_lengkap,
                    'jabatan' => $pegawai->jabatan,
                    'unit_kerja' => $pegawai->unit_kerja,
                    'golongan' => $pegawai->golongan,
                    'sisa_cuti_tahunan' => $pegawai->sisa_cuti_tahunan,
                    'foto' => $pegawai->foto,
                ] : null,
            ],
            'alerts' => [
                'pending_cuti_count' => Cuti::where('status', 'Pending')->count(),
                'str_expiring_count' => StrRecord::expiringWithin(90)->count(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
        ];
    }
}
