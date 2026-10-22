<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GajiHeader extends Model
{
    protected $table = 't_gaji_header';

    protected $fillable = [
        'pegawai_id',
        'bulan',
        'tahun',
        'gaji_pokok',
        'tunjangan_kinerja',
        'remunerasi_jasa_pelayanan',
        'total_bruto',
        'total_potongan',
        'total_netto',
        'status_pembayaran',
        'tanggal_dibayar',
    ];

    protected $casts = [
        'tanggal_dibayar'           => 'date',
        'gaji_pokok'                => 'decimal:2',
        'tunjangan_kinerja'         => 'decimal:2',
        'remunerasi_jasa_pelayanan' => 'decimal:2',
        'total_bruto'               => 'decimal:2',
        'total_potongan'            => 'decimal:2',
        'total_netto'               => 'decimal:2',
    ];

    private static array $bulanNames = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    public function getNamaBulanAttribute(): string
    {
        return self::$bulanNames[$this->bulan] ?? '-';
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(GajiDetail::class, 'gaji_id');
    }
}
