<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RBKBulanan extends Model
{
    protected $table = 't_rbk_bulanan';

    protected $fillable = [
        'pegawai_id',
        'bulan',
        'tahun',
        'rbk_indeks_id',
        'nilai_dasar',
        'indeks_jabatan',
        'capaian_skp',
        'capaian_kehadiran',
        'komponen_skp',
        'komponen_kehadiran',
        'potongan_alpha',
        'total_rbk',
        'status',
    ];

    protected $casts = [
        'nilai_dasar'       => 'decimal:2',
        'indeks_jabatan'    => 'decimal:2',
        'capaian_skp'       => 'decimal:2',
        'capaian_kehadiran' => 'decimal:2',
        'komponen_skp'      => 'decimal:2',
        'komponen_kehadiran'=> 'decimal:2',
        'potongan_alpha'    => 'decimal:2',
        'total_rbk'         => 'decimal:2',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function indeks(): BelongsTo
    {
        return $this->belongsTo(RBKIndeks::class, 'rbk_indeks_id');
    }
}
