<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WisnPerhitungan extends Model
{
    protected $table = 't_wisn_perhitungan';

    protected $fillable = [
        'unit_kerja', 'jabatan_kategori', 'periode',
        'hari_kerja', 'cuti_tahunan', 'hari_diklat',
        'hari_libur_nasional', 'hari_tidak_hadir', 'jam_kerja_per_hari',
        'wkt_menit', 'aktivitas',
        'kebutuhan_sdmk', 'jumlah_aktual', 'wisn_ratio', 'status',
        'catatan', 'dibuat_oleh',
    ];

    protected $casts = [
        'aktivitas' => 'array',
    ];

    public function pembuatData(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'dibuat_oleh');
    }

    /**
     * Hitung WKT dan kebutuhan SDMK berdasarkan input.
     * Mengembalikan array hasil yang bisa di-assign ke model.
     */
    public function hitung(): array
    {
        // WKT (menit/tahun) = (A-B-C-D-E) × F × 60
        $hariEfektif = max(0,
            $this->hari_kerja
            - $this->cuti_tahunan
            - $this->hari_diklat
            - $this->hari_libur_nasional
            - $this->hari_tidak_hadir
        );
        $wkt = $hariEfektif * $this->jam_kerja_per_hari * 60;

        if ($wkt <= 0) {
            return ['wkt_menit' => 0, 'kebutuhan_sdmk' => null, 'wisn_ratio' => null, 'status' => null];
        }

        $aktivitas = $this->aktivitas ?? [];
        $totalKegiatanPokok = 0;
        $totalKelonggaran   = 0;

        foreach ($aktivitas as $a) {
            $standarWaktu = (float) ($a['standar_waktu_menit'] ?? 0);
            if ($standarWaktu <= 0) continue;

            if (($a['jenis'] ?? '') === 'Kelonggaran') {
                // Faktor kelonggaran = standar_waktu_setahun / WKT
                $totalKelonggaran += $standarWaktu / $wkt;
            } else {
                // SBK = WKT / standar_waktu; kontribusi = kuantitas / SBK
                $sbk = $wkt / $standarWaktu;
                $kuantitas = (float) ($a['kuantitas_setahun'] ?? 0);
                if ($sbk > 0) {
                    $totalKegiatanPokok += $kuantitas / $sbk;
                }
            }
        }

        $kebutuhan = round($totalKegiatanPokok + $totalKelonggaran, 2);
        $aktual    = $this->jumlah_aktual;
        $ratio     = $kebutuhan > 0 ? round($aktual / $kebutuhan, 2) : null;

        $status = null;
        if ($ratio !== null) {
            $status = match (true) {
                $ratio < 0.80 => 'Kekurangan',
                $ratio > 1.20 => 'Kelebihan',
                default       => 'Cukup',
            };
        }

        return [
            'wkt_menit'      => round($wkt, 2),
            'kebutuhan_sdmk' => $kebutuhan,
            'wisn_ratio'     => $ratio,
            'status'         => $status,
        ];
    }
}
