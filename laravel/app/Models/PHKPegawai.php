<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PHKPegawai extends Model
{
    protected $table = 't_phk_pegawai';

    protected $fillable = [
        'pegawai_id', 'jenis_phk', 'alasan', 'tanggal_phk',
        'pesangon', 'uang_penghargaan', 'uang_pisah', 'total_kompensasi',
        'status', 'nomor_sk', 'tanggal_sk', 'catatan',
    ];

    protected $casts = [
        'tanggal_phk'       => 'date',
        'tanggal_sk'        => 'date',
        'pesangon'          => 'decimal:2',
        'uang_penghargaan'  => 'decimal:2',
        'uang_pisah'        => 'decimal:2',
        'total_kompensasi'  => 'decimal:2',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }
}
