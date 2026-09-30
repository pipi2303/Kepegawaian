<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Credentialing extends Model
{
    use HasFactory;

    protected $table = 't_credentialing';

    protected $fillable = [
        'pegawai_id',
        'komite_terkait',
        'jenis_kredensial',
        'nomor_spk',
        'tanggal_spk',
        'tanggal_berlaku_sampai',
        'status',
        'rincian_kewenangan_klinis',
        'catatan_mitra_bestari',
        'file_dokumen_spk',
    ];

    protected $casts = [
        'tanggal_spk' => 'date',
        'tanggal_berlaku_sampai' => 'date',
        'rincian_kewenangan_klinis' => 'array',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }
}
