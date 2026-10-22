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
            'direktur_rs' => '',
        ];

        foreach ($defaults as $key => $value) {
            Pengaturan::firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
