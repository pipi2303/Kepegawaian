<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pegawai;
use Illuminate\Support\Facades\File;

class PegawaiCsvSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $csvPath = base_path('../src/imports/employee-data.csv');
        if (!File::exists($csvPath)) {
            $csvPath = database_path('seeders/data/employee-data.csv');
        }

        if (!File::exists($csvPath)) {
            $this->command->warn("File CSV pegawai tidak ditemukan pada {$csvPath}. Melewati seeder CSV.");
            return;
        }

        $file = fopen($csvPath, 'r');
        $header = fgetcsv($file);

        while (($row = fgetcsv($file)) !== false) {
            $data = array_combine($header, $row);
            if (!$data || empty($data['nip'])) {
                continue;
            }

            Pegawai::updateOrCreate(
                ['nip' => trim($data['nip'])],
                [
                    'nama' => trim($data['nama'] ?? 'Tanpa Nama'),
                    'gelar_depan' => $data['gelar_depan'] ?? null,
                    'gelar_belakang' => $data['gelar_belakang'] ?? null,
                    'jenis_kelamin' => ($data['jenis_kelamin'] ?? 'L') === 'P' ? 'P' : 'L',
                    'tempat_lahir' => $data['tempat_lahir'] ?? 'Bandar Lampung',
                    'tanggal_lahir' => $data['tanggal_lahir'] ?? '1985-01-01',
                    'email' => $data['email'] ?? null,
                    'no_telp' => $data['no_telp'] ?? null,
                    'jabatan' => $data['jabatan'] ?? 'Staf Pelaksana',
                    'jabatan_fungsional' => $data['jabatan_fungsional'] ?? null,
                    'unit_kerja' => $data['unit_kerja'] ?? 'Umum',
                    'golongan' => $data['golongan'] ?? 'III/a',
                    'pangkat' => $data['pangkat'] ?? 'Penata Muda',
                    'status_pegawai' => in_array($data['status_pegawai'] ?? '', ['PNS', 'PPPK', 'Honorer']) ? $data['status_pegawai'] : 'PNS',
                    'status_aktif' => 'Aktif',
                    'tanggal_masuk' => $data['tanggal_masuk'] ?? '2015-01-01',
                    'batas_pensiun' => $data['batas_pensiun'] ?? '2045-01-01',
                ]
            );
        }

        fclose($file);
    }
}
