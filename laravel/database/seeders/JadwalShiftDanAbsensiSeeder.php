<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pegawai;
use App\Models\JadwalShift;
use App\Models\Absensi;
use Carbon\Carbon;

class JadwalShiftDanAbsensiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pegawais = Pegawai::take(25)->get();
        if ($pegawais->isEmpty()) {
            return;
        }

        $shifts = [
            'Pagi' => ['mulai' => '07:30:00', 'selesai' => '15:30:00'],
            'Sore' => ['mulai' => '14:00:00', 'selesai' => '21:00:00'],
            'Malam' => ['mulai' => '21:00:00', 'selesai' => '07:00:00'],
        ];

        $startDate = Carbon::create(2026, 3, 1);
        $endDate = Carbon::create(2026, 3, 31);

        foreach ($pegawais as $pegawai) {
            $currentDate = $startDate->copy();

            while ($currentDate->lte($endDate)) {
                $dayOfWeek = $currentDate->dayOfWeek; // 0 = Sunday, 6 = Saturday
                $shiftType = 'Pagi';
                
                // Distribusi shift untuk unit klinis
                if (stripos($pegawai->unit_kerja, 'MEDIK') !== false || stripos($pegawai->unit_kerja, 'KEPERAWATAN') !== false) {
                    $rand = rand(1, 10);
                    if ($rand <= 5) $shiftType = 'Pagi';
                    elseif ($rand <= 8) $shiftType = 'Sore';
                    else $shiftType = 'Malam';
                }

                // 1. Buat Jadwal Shift
                JadwalShift::firstOrCreate(
                    [
                        'pegawai_id' => $pegawai->id,
                        'tanggal' => $currentDate->toDateString(),
                    ],
                    [
                        'jenis_shift' => $shiftType,
                        'jam_mulai' => $shifts[$shiftType]['mulai'],
                        'jam_selesai' => $shifts[$shiftType]['selesai'],
                        'unit_kerja' => $pegawai->unit_kerja,
                        'status_kehadiran' => ($currentDate->isPast() || $currentDate->isToday()) ? 'Hadir' : 'Terjadwal',
                    ]
                );

                // 2. Buat Histori Presensi (Maret 2026 yang sudah berlalu)
                if ($currentDate->lte(Carbon::create(2026, 3, 29))) {
                    $isWeekend = ($dayOfWeek === 0 || $dayOfWeek === 6);
                    if (!$isWeekend || stripos($pegawai->unit_kerja, 'MEDIK') !== false) {
                        $isTerlambat = rand(1, 10) === 1; // 10% kemungkinan terlambat
                        $jamMasuk = $isTerlambat ? '07:42:00' : '07:25:00';
                        $menitTerlambat = $isTerlambat ? 12 : 0;

                        Absensi::firstOrCreate(
                            [
                                'pegawai_id' => $pegawai->id,
                                'tanggal' => $currentDate->toDateString(),
                            ],
                            [
                                'jam_masuk' => $jamMasuk,
                                'jam_keluar' => '15:35:00',
                                'status' => $isTerlambat ? 'Terlambat' : 'Hadir',
                                'menit_terlambat' => $menitTerlambat,
                                'jenis_shift' => $shiftType,
                                'lokasi' => 'Pintu Masuk Utama / Fingerprint RS',
                            ]
                        );
                    }
                }

                $currentDate->addDay();
            }
        }
    }
}
