<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class LicenseService
{
    // Change before distributing to each client
    private const SECRET = 'HCMS-RSUDAM-2026-INTRAMEDIKA';

    public static function validate(): bool
    {
        if (in_array(app()->environment(), ['local', 'testing'], true)) {
            return true;
        }

        return Cache::remember('license.valid', 3600, function () {
            $key    = env('LICENSE_KEY', '');
            $expire = env('LICENSE_EXPIRE', '');
            $namaRs = env('NAMA_RS', '');

            if (empty($key) || empty($expire) || empty($namaRs)) {
                return false;
            }

            $expected = self::generate($namaRs, $expire);

            if (! hash_equals($expected, $key)) {
                return false;
            }

            return now()->toDateString() <= $expire;
        });
    }

    public static function generate(string $namaRs, string $expireDate): string
    {
        return hash_hmac('sha256', $namaRs . '|' . $expireDate, self::SECRET);
    }

    public static function info(): array
    {
        $expire  = env('LICENSE_EXPIRE', '');
        $namaRs  = env('NAMA_RS', '');
        $valid   = self::validate();
        $daysLeft = 0;

        if ($expire) {
            $daysLeft = max(0, (int) now()->diffInDays($expire, false));
        }

        return [
            'valid'     => $valid,
            'expire'    => $expire,
            'rs'        => $namaRs,
            'days_left' => $daysLeft,
        ];
    }
}
