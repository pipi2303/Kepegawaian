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
        // Pegawai IS the auth model — no separate user/pegawai split
        $pegawai = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $pegawai ? [
                    'id'          => $pegawai->id,
                    'nip'         => $pegawai->nip,
                    'nama'        => $pegawai->nama_lengkap,
                    'email'       => $pegawai->email,
                    'jabatan'     => $pegawai->jabatan,
                    'unit_kerja'  => $pegawai->unit_kerja,
                    'golongan'    => $pegawai->golongan,
                    'foto'        => $pegawai->foto,
                    'sisa_cuti_tahunan' => $pegawai->sisa_cuti_tahunan,
                    'roles'       => $pegawai->getRoleNames(),
                    'permissions' => $pegawai->getAllPermissions()->pluck('name'),
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
