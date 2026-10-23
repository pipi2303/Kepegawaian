<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KegiatanKomite extends Model
{
    protected $table = 't_kegiatan_komite';

    protected $fillable = [
        'komite_id',
        'judul_kegiatan',
        'tanggal_kegiatan',
        'jam_mulai',
        'jam_selesai',
        'tempat',
        'agenda',
        'notulensi',
        'daftar_hadir_foto',
    ];

    protected $casts = [
        'tanggal_kegiatan' => 'date:Y-m-d',
    ];

    public function komite(): BelongsTo
    {
        return $this->belongsTo(KomiteRS::class, 'komite_id');
    }
}
