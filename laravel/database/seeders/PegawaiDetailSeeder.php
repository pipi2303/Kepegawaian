<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pegawai;
use App\Models\StrRecord;
use App\Models\SipRecord;
use App\Models\PegawaiKeluarga;
use Illuminate\Support\Facades\File;

class PegawaiDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $csvPath = base_path('../src/imports/pegawai-jabatan-unit.csv');
        if (!File::exists($csvPath)) {
            $csvPath = database_path('seeders/data/pegawai-jabatan-unit.csv');
        }

        if (File::exists($csvPath)) {
            $file = fopen($csvPath, 'r');
            $header = fgetcsv($file, 0, "\t"); // Tab separated
            if (!$header || count($header) < 2) {
                // Try comma separated if tab didn't work
                rewind($file);
                $header = fgetcsv($file, 0, ",");
            }

            $count = 0;
            while (($row = fgetcsv($file, 0, "\t")) !== false && $count < 100) {
                if (count($row) < 4) continue;
                $nama = trim($row[0] ?? '');
                $jabatan = trim($row[1] ?? '');
                $golongan = trim($row[2] ?? '');
                $unitKerja = trim($row[3] ?? '');

                if (empty($nama)) continue;

                $count++;
                $dummyNip = '198' . str_pad($count, 5, '0', STR_PAD_LEFT) . ' 201' . str_pad($count % 9, 4, '0', STR_PAD_LEFT) . ' 1 001';

                $pegawai = Pegawai::firstOrCreate(
                    ['nama' => $nama],
                    [
                        'nip' => $dummyNip,
                        'jenis_kelamin' => (stripos($nama, 'dr.') !== false || stripos($nama, 'Ns.') !== false) ? (rand(0, 1) ? 'L' : 'P') : 'L',
                        'tempat_lahir' => 'Bandar Lampung',
                        'tanggal_lahir' => '198' . rand(0, 8) . '-0' . rand(1, 9) . '-15',
                        'email' => 'pegawai' . $count . '@intramedika.hospital',
                        'jabatan' => $jabatan,
                        'unit_kerja' => $unitKerja,
                        'golongan' => $golongan ?: 'III/a',
                        'status_pegawai' => 'PNS',
                        'status_aktif' => 'Aktif',
                        'tanggal_masuk' => '2015-03-01',
                        'batas_pensiun' => '2045-03-01',
                    ]
                );

                // Tambahkan lisensi STR/SIP jika merupakan dokter atau perawat
                if (stripos($nama, 'dr.') !== false || stripos($nama, 'Ns.') !== false || stripos($nama, 'Sp.') !== false) {
                    $isDokter = stripos($nama, 'dr.') !== false;
                    
                    StrRecord::firstOrCreate(
                        ['pegawai_id' => $pegawai->id],
                        [
                            'nomor_str' => ($isDokter ? 'STR-DOK-' : 'STR-PER-') . rand(1000000, 9999999),
                            'jenis_tenaga' => $isDokter ? 'Dokter Spesialis / Umum' : 'Perawat Vokasi / Ners',
                            'konsil' => $isDokter ? 'Konsil Kedokteran Indonesia (KKI)' : 'Konsil Keperawatan Indonesia',
                            'tanggal_terbit' => now()->subYears(2)->toDateString(),
                            'tanggal_expired' => now()->addMonths(rand(2, 36))->toDateString(),
                            'status' => 'Aktif',
                        ]
                    );

                    SipRecord::firstOrCreate(
                        ['pegawai_id' => $pegawai->id],
                        [
                            'nomor_sip' => ($isDokter ? 'SIP-DOK/' : 'SIPP/') . rand(100, 999) . '/DINKES/2024',
                            'jenis_dokumen' => $isDokter ? 'SIP' : 'SIPP',
                            'jenis_praktik' => $isDokter ? 'Praktik Kedokteran Spesialis' : 'Pelayanan Keperawatan',
                            'fasyankes' => 'RSUDAM',
                            'instansi_penerbit' => 'Dinas Kesehatan Kota Bandar Lampung',
                            'tanggal_terbit' => now()->subYears(2)->toDateString(),
                            'tanggal_expired' => now()->addMonths(rand(2, 36))->toDateString(),
                            'status' => 'Aktif',
                        ]
                    );
                }

                // Tambahkan data keluarga contoh
                PegawaiKeluarga::firstOrCreate(
                    [
                        'pegawai_id' => $pegawai->id,
                        'hubungan' => 'Istri',
                    ],
                    [
                        'nama' => 'Ny. ' . $nama,
                        'jenis_kelamin' => 'P',
                        'status_hidup' => 'Hidup',
                        'tunjangan' => true,
                    ]
                );
            }

            fclose($file);
        }
    }
}
