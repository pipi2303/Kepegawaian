<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnggotaKomite extends Model
{
    protected $table = 't_anggota_komite';

    protected $fillable = [
        'komite_id',
        'pegawai_id',
        'jabatan_di_komite',
        'tanggal_bergabung',
        'tanggal_berakhir',
        'status',
    ];

    protected $casts = [
        'tanggal_bergabung' => 'date:Y-m-d',
        'tanggal_berakhir'  => 'date:Y-m-d',
    ];

    public function komite(): BelongsTo
    {
        return $this->belongsTo(KomiteRS::class, 'komite_id');
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }
}
