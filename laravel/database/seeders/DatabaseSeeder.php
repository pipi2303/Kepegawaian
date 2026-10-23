<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            PegawaiCsvSeeder::class,
            PegawaiDetailSeeder::class,
            JadwalShiftDanAbsensiSeeder::class,
            PengaturanSeeder::class,
        ]);
        // Demo data — only run manually: php artisan db:seed --class=DemoDataSeeder
        // Or via: php artisan hcms:demo-seed
        // DO NOT add DemoDataSeeder to the $this->call() array above.
    }
}
