<?php

namespace App\Services;

use App\Models\Pegawai;
use App\Models\Absensi;
use App\Models\JadwalShift;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class AbsensiService
{
    // Toleransi keterlambatan standar RS adalah 7.5 menit (450 detik)
    const TOLERANSI_DETIK = 450;

    /**
     * Catat Check-In Masuk Presensi
     */
    public function recordCheckIn(Pegawai $pegawai, ?string $lokasi = null, ?string $foto = null): Absensi
    {
        $now = Carbon::now('Asia/Jakarta');
        $today = $now->toDateString();

        // Cari jadwal shift hari ini
        $shift = JadwalShift::where('pegawai_id', $pegawai->id)
            ->where('tanggal', $today)
            ->first();

        $jamMulaiShift = $shift ? Carbon::parse($today . ' ' . $shift->jam_mulai, 'Asia/Jakarta') : Carbon::parse($today . ' 07:30:00', 'Asia/Jakarta');
        $jenisShift = $shift ? $shift->jenis_shift : 'Non-Shift';

        // Hitung selisih waktu dengan toleransi
        $diffSeconds = $now->diffInSeconds($jamMulaiShift, false); // Positif jika lebih awal, negatif jika telat
        $isLate = ($diffSeconds < -self::TOLERANSI_DETIK);
        $menitTerlambat = $isLate ? (int) abs(floor($diffSeconds / 60)) : 0;

        return Absensi::updateOrCreate(
            [
                'pegawai_id' => $pegawai->id,
                'tanggal' => $today,
            ],
            [
                'jam_masuk' => $now->toTimeString(),
                'status' => $isLate ? 'Terlambat' : 'Hadir',
                'menit_terlambat' => $menitTerlambat,
                'jenis_shift' => $jenisShift,
                'lokasi' => $lokasi ?: 'Mesin Fingerprint Utama / App',
                'bukti_foto' => $foto,
            ]
        );
    }

    /**
     * Catat Check-Out Pulang Presensi
     */
    public function recordCheckOut(Pegawai $pegawai): Absensi
    {
        $now = Carbon::now('Asia/Jakarta');
        $today = $now->toDateString();

        $absensi = Absensi::where('pegawai_id', $pegawai->id)
            ->where('tanggal', $today)
            ->firstOrFail();

        $absensi->update([
            'jam_keluar' => $now->toTimeString(),
        ]);

        return $absensi;
    }

    /**
     * Rekapitulasi Presensi Bulanan Pegawai & Unit
     */
    public function getRekapBulanan(int $bulan, int $tahun, ?string $unitKerja = null): array
    {
        $query = Absensi::with('pegawai:id,nip,nama,jabatan,unit_kerja')
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun);

        if ($unitKerja) {
            $query->whereHas('pegawai', function ($q) use ($unitKerja) {
                $q->where('unit_kerja', $unitKerja);
            });
        }

        $records = $query->get();

        $totalHadir = $records->whereIn('status', ['Hadir', 'Terlambat'])->count();
        $totalTerlambat = $records->where('status', 'Terlambat')->count();
        $totalIzin = $records->where('status', 'Izin')->count();
        $totalSakit = $records->where('status', 'Sakit')->count();
        $totalCuti = $records->where('status', 'Cuti')->count();
        $totalAlpha = $records->where('status', 'Alpha')->count();

        $totalHariKerja = $records->count() ?: 1;
        $persentaseKehadiran = round(($totalHadir / $totalHariKerja) * 100, 2);

        return [
            'periode' => Carbon::create($tahun, $bulan, 1)->translatedFormat('F Y'),
            'total_record' => $records->count(),
            'total_hadir' => $totalHadir,
            'total_terlambat' => $totalTerlambat,
            'total_sakit' => $totalSakit,
            'total_izin' => $totalIzin,
            'total_cuti' => $totalCuti,
            'total_alpha' => $totalAlpha,
            'persentase_kehadiran' => $persentaseKehadiran,
            'daftar_terlambat' => $records->where('status', 'Terlambat')->values(),
        ];
    }
}
