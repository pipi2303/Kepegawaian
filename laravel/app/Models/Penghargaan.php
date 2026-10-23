<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Penghargaan extends Model
{
    protected $table = 't_penghargaan_pegawai';

    protected $fillable = [
        'pegawai_id', 'nama_penghargaan', 'jenis', 'pemberi',
        'level', 'tanggal', 'deskripsi', 'file_sertifikat',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }
}
