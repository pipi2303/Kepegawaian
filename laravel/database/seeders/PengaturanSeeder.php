<?php

namespace Database\Seeders;

use App\Models\Pengaturan;
use Illuminate\Database\Seeder;

class PengaturanSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'nama_rs'     => env('NAMA_RS', 'Rumah Sakit'),
            'kota_rs'     => env('KOTA_RS', 'Indonesia'),
            'kelas_rs'    => env('KELAS_RS', 'B'),
            'akreditasi_rs' => env('AKREDITASI_RS', 'KARS'),
            'logo_rs'     => env('LOGO_RS', ''),
            'alamat_rs'   => '',
            'no_telp_rs'  => '',
            'email_rs'    => '',
            'direktur_rs'  => '',
            'lat_rs'       => env('LAT_RS', '-5.3971'),
            'lng_rs'       => env('LNG_RS', '105.2668'),
            'radius_meter' => env('RADIUS_ABSENSI', '200'),
            'gps_wajib'           => env('GPS_WAJIB', 'false'),
            'total_tempat_tidur'  => env('TOTAL_TT', '200'),
            'bor_manual'          => '0',
            'onboarding_completed' => env('ONBOARDING_COMPLETED', 'false'),
            'onboarding_step'      => '1',
        ];

        foreach ($defaults as $key => $value) {
            Pengaturan::firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
