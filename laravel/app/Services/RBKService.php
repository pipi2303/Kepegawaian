<?php

namespace App\Services;

use App\Models\Pegawai;
use App\Models\RBKBulanan;
use App\Models\RBKIndeks;
use Illuminate\Support\Facades\DB;

class RBKService
{
    private const BOBOT_SKP       = 0.60; // 60%
    private const BOBOT_KEHADIRAN = 0.40; // 40%

    public function hitungRBK(Pegawai $pegawai, int $bulan, int $tahun): RBKBulanan
    {
        return DB::transaction(function () use ($pegawai, $bulan, $tahun) {
            // Delete existing Draft for regeneration; Approved/Dibayarkan are kept
            RBKBulanan::where('pegawai_id', $pegawai->id)
                ->where('bulan', $bulan)->where('tahun', $tahun)
                ->where('status', 'Draft')->delete();

            // 1. Cari RBKIndeks: nama_jabatan dulu, lalu eselon, lalu default (keduanya null)
            $indeks = RBKIndeks::where('nama_jabatan', $pegawai->jabatan)->first()
                ?? RBKIndeks::where('eselon', $pegawai->eselon)->whereNull('nama_jabatan')->first()
                ?? RBKIndeks::whereNull('nama_jabatan')->whereNull('eselon')->first();

            $nilaiDasar    = (float) ($indeks?->nilai_dasar_rbk ?? 0);
            $indeksJabatan = (float) ($indeks?->indeks          ?? 1.00);

            // 2. SKP nilai_akhir dari semester terakhir yang disetujui; default 100
            $skp = DB::table('t_skp_header')
                ->where('pegawai_id', $pegawai->id)
                ->where('tahun', $tahun)
                ->where('status', 'Disetujui')
                ->orderByDesc('semester')
                ->value('nilai_akhir');
            $capaianSKP = $skp ? min(100, (float) $skp) : 100.0;

            // 3. Statistik absensi
            $absensi = DB::table('t_absensi')
                ->where('pegawai_id', $pegawai->id)
                ->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)
                ->selectRaw("
                    COUNT(*) as total_hari,
                    SUM(status IN ('Hadir','Terlambat')) as hadir,
                    SUM(status = 'Alpha') as alpha
                ")->first();

            $totalHari      = $absensi->total_hari ?: 1;
            $hariHadir      = $absensi->hadir ?: 0;
            $nAlpha         = $absensi->alpha ?: 0;
            $capaianHadir   = round(($hariHadir / $totalHari) * 100, 2);

            // 4. Hitung komponen
            $base               = $nilaiDasar * $indeksJabatan;
            $komponenSKP        = $base * self::BOBOT_SKP       * ($capaianSKP   / 100);
            $komponenKehadiran  = $base * self::BOBOT_KEHADIRAN  * ($capaianHadir / 100);
            $potonganAlpha      = $totalHari > 0 ? ($base / $totalHari) * $nAlpha * 0.05 : 0;
            $totalRBK           = max(0, $komponenSKP + $komponenKehadiran - $potonganAlpha);

            return RBKBulanan::create([
                'pegawai_id'        => $pegawai->id,
                'bulan'             => $bulan,
                'tahun'             => $tahun,
                'rbk_indeks_id'     => $indeks?->id,
                'nilai_dasar'       => $nilaiDasar,
                'indeks_jabatan'    => $indeksJabatan,
                'capaian_skp'       => $capaianSKP,
                'capaian_kehadiran' => $capaianHadir,
                'komponen_skp'      => round($komponenSKP),
                'komponen_kehadiran'=> round($komponenKehadiran),
                'potongan_alpha'    => round($potonganAlpha),
                'total_rbk'         => round($totalRBK),
                'status'            => 'Draft',
            ]);
        });
    }

    public function bulkHitung(int $bulan, int $tahun): array
    {
        $pegawais = Pegawai::where('status_aktif', 'Aktif')->get();

        $success = 0;
        $failed  = 0;
        $errors  = [];

        foreach ($pegawais as $p) {
            try {
                $this->hitungRBK($p, $bulan, $tahun);
                $success++;
            } catch (\Throwable $e) {
                $failed++;
                $errors[] = $p->nip . ': ' . $e->getMessage();
            }
        }

        return compact('success', 'failed', 'errors');
    }
}
