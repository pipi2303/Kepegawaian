<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GajiDetail extends Model
{
    protected $table = 't_gaji_detail';

    protected $fillable = [
        'gaji_id',
        'jenis',
        'kode_komponen',
        'nama_komponen',
        'jumlah',
    ];

    public function gajiHeader(): BelongsTo
    {
        return $this->belongsTo(GajiHeader::class, 'gaji_id');
    }
}
