<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KomiteRS extends Model
{
    protected $table = 'm_komite_rs';

    protected $fillable = [
        'nama_komite',
        'singkatan',
        'ketua_pegawai_id',
        'nomor_sk_pendirian',
        'tanggal_sk',
        'deskripsi_tugas',
    ];

    protected $casts = [
        'tanggal_sk' => 'date:Y-m-d',
    ];

    public function ketua(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'ketua_pegawai_id');
    }

    public function anggota(): HasMany
    {
        return $this->hasMany(AnggotaKomite::class, 'komite_id');
    }

    public function kegiatan(): HasMany
    {
        return $this->hasMany(KegiatanKomite::class, 'komite_id');
    }
}
