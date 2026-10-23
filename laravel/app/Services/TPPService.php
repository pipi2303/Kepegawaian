<?php

namespace App\Services;

use App\Models\Pegawai;
use App\Models\TPPBulanan;
use App\Models\TPPKelas;
use Illuminate\Support\Facades\DB;

class TPPService
{
    // Bobot komponen TPP (Permendagri default; ubah di sini jika RS menggunakan rasio berbeda)
    private const BOBOT_KEHADIRAN = 0.60; // 60%
    private const BOBOT_KINERJA   = 0.40; // 40%

    public function hitungTPP(Pegawai $pegawai, int $bulan, int $tahun): TPPBulanan
    {
        return DB::transaction(function () use ($pegawai, $bulan, $tahun) {
            // Delete existing draft for regeneration; approved/dibayarkan records are kept
            TPPBulanan::where('pegawai_id', $pegawai->id)
                ->where('bulan', $bulan)->where('tahun', $tahun)
                ->where('status', 'Draft')->delete();

            // 1. Kelas TPP berdasarkan eselon pegawai; fallback ke kelas tanpa eselon (umum)
            $kelas = TPPKelas::where('eselon', $pegawai->eselon)->first()
                ?? TPPKelas::whereNull('eselon')->first();
            $nilaiDasar = $kelas?->nilai_dasar ?? 0;

            // 2. Persentase kehadiran dari t_absensi
            $absensi = DB::table('t_absensi')
                ->where('pegawai_id', $pegawai->id)
                ->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)
                ->selectRaw("
                    COUNT(*) as total_hari,
                    SUM(status IN ('Hadir','Terlambat')) as hadir,
                    SUM(status = 'Alpha') as alpha
                ")->first();

            $hariKerja    = $absensi->total_hari ?: 1;
            $hariHadir    = $absensi->hadir ?: 0;
            $nAlpha       = $absensi->alpha ?: 0;
            $pctKehadiran = round(($hariHadir / $hariKerja) * 100, 2);

            // 3. Nilai kinerja dari SKP semester terakhir yang disetujui; default 100 jika belum ada
            $skp = DB::table('t_skp_header')
                ->where('pegawai_id', $pegawai->id)
                ->where('tahun', $tahun)
                ->where('status', 'Disetujui')
                ->orderByDesc('semester')
                ->value('nilai_akhir');
            $pctKinerja = $skp ? min(100, (float) $skp) : 100.0;

            // 4. Hitung komponen
            $komponenKehadiran = $nilaiDasar * self::BOBOT_KEHADIRAN * ($pctKehadiran / 100);
            $komponenKinerja   = $nilaiDasar * self::BOBOT_KINERJA   * ($pctKinerja   / 100);

            // 5. Potongan alpha: nilai_dasar / hari_kerja_bulan × jumlah_hari_alpha
            $potonganAlpha = $hariKerja > 0 ? ($nilaiDasar / $hariKerja) * $nAlpha : 0;

            $totalTPP = max(0, $komponenKehadiran + $komponenKinerja - $potonganAlpha);

            return TPPBulanan::create([
                'pegawai_id'          => $pegawai->id,
                'bulan'               => $bulan,
                'tahun'               => $tahun,
                'tpp_kelas_id'        => $kelas?->id,
                'nilai_dasar'         => $nilaiDasar,
                'persen_kehadiran'    => $pctKehadiran,
                'persen_kinerja'      => $pctKinerja,
                'komponen_kehadiran'  => round($komponenKehadiran),
                'komponen_kinerja'    => round($komponenKinerja),
                'potongan_alpha'      => round($potonganAlpha),
                'total_tpp'           => round($totalTPP),
                'status'              => 'Draft',
            ]);
        });
    }

    public function bulkHitung(int $bulan, int $tahun): array
    {
        $pegawais = Pegawai::where('status_aktif', 'Aktif')
            ->whereIn('status_pegawai', ['PNS', 'PPPK'])->get();

        $success = 0;
        $failed  = 0;
        $errors  = [];

        foreach ($pegawais as $p) {
            try {
                $this->hitungTPP($p, $bulan, $tahun);
                $success++;
            } catch (\Throwable $e) {
                $failed++;
                $errors[] = $p->nip . ': ' . $e->getMessage();
            }
        }

        return compact('success', 'failed', 'errors');
    }
}
