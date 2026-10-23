<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisiplinPegawai extends Model
{
    protected $table = 't_disiplin_pegawai';

    protected $fillable = [
        'pegawai_id', 'tingkat_hukuman', 'jenis_hukuman', 'uraian_pelanggaran',
        'nomor_sk', 'tanggal_sk', 'tanggal_mulai_berlaku', 'tanggal_selesai', 'status_hukuman',
    ];

    protected $casts = [
        'tanggal_sk'            => 'date',
        'tanggal_mulai_berlaku' => 'date',
        'tanggal_selesai'       => 'date',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }
}
