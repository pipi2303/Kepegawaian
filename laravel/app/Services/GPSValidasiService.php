<?php

namespace App\Services;

use App\Models\Pengaturan;

class GPSValidasiService
{
    public static function hitungJarak(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R = 6371000;
        $phi1 = deg2rad($lat1); $phi2 = deg2rad($lat2);
        $dphi = deg2rad($lat2 - $lat1); $dlambda = deg2rad($lng2 - $lng1);
        $a = sin($dphi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($dlambda / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    public static function validasi(float $lat, float $lng): array
    {
        $latRS  = (float) Pengaturan::get('lat_rs', '-5.3971');
        $lngRS  = (float) Pengaturan::get('lng_rs', '105.2668');
        $radius = (int)   Pengaturan::get('radius_meter', '200');
        $jarak  = self::hitungJarak($lat, $lng, $latRS, $lngRS);
        return ['valid' => $jarak <= $radius, 'jarak' => round($jarak, 2), 'radius' => $radius];
    }
}
