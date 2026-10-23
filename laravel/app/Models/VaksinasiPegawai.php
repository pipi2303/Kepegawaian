<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VaksinasiPegawai extends Model
{
    protected $table = 't_vaksinasi_pegawai';

    protected $fillable = [
        'pegawai_id', 'nama_vaksin', 'tanggal_vaksinasi', 'dosis',
        'nomor_batch', 'pemberi_vaksin', 'lokasi_vaksinasi', 'status',
    ];

    protected $casts = [
        'tanggal_vaksinasi' => 'date',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }
}
