<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TPPBulanan extends Model
{
    protected $table = 't_tpp_bulanan';

    protected $fillable = [
        'pegawai_id',
        'bulan',
        'tahun',
        'tpp_kelas_id',
        'nilai_dasar',
        'persen_kehadiran',
        'persen_kinerja',
        'komponen_kehadiran',
        'komponen_kinerja',
        'potongan_alpha',
        'total_tpp',
        'status',
    ];

    protected $casts = [
        'bulan'              => 'integer',
        'tahun'              => 'integer',
        'nilai_dasar'        => 'decimal:2',
        'persen_kehadiran'   => 'decimal:2',
        'persen_kinerja'     => 'decimal:2',
        'komponen_kehadiran' => 'decimal:2',
        'komponen_kinerja'   => 'decimal:2',
        'potongan_alpha'     => 'decimal:2',
        'total_tpp'          => 'decimal:2',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(TPPKelas::class, 'tpp_kelas_id');
    }
}
