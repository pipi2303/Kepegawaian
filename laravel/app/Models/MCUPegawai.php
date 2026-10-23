<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MCUPegawai extends Model
{
    protected $table = 't_mcu_pegawai';

    protected $fillable = [
        'pegawai_id', 'tanggal_mcu', 'fasilitas_kesehatan',
        'hasil_umum', 'catatan_dokter', 'file_hasil',
    ];

    protected $casts = [
        'tanggal_mcu' => 'date',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }
}
