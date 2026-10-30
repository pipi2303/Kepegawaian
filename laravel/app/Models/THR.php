<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class THR extends Model
{
    protected $table = 't_thr';

    protected $fillable = [
        'pegawai_id', 'tahun', 'hari_raya', 'masa_kerja_bulan',
        'formula', 'gaji_dasar', 'jumlah_thr', 'status', 'tanggal_bayar', 'catatan',
    ];

    protected $casts = [
        'tanggal_bayar' => 'date',
        'gaji_dasar'    => 'decimal:2',
        'jumlah_thr'    => 'decimal:2',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    /** PP 36/2021: masa kerja ≥ 12 bulan = 1× gaji; < 12 bulan = proporsional */
    public static function hitungTHR(float $gajiDasar, int $masaKerjaBulan): array
    {
        if ($masaKerjaBulan >= 12) {
            return ['formula' => 'Penuh', 'jumlah' => $gajiDasar];
        }

        return [
            'formula' => 'Proporsional',
            'jumlah'  => round($gajiDasar * $masaKerjaBulan / 12, 2),
        ];
    }
}
