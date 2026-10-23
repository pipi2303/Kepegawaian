<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grievance extends Model
{
    protected $table = 't_grievance';

    protected $fillable = [
        'pegawai_id', 'kategori', 'deskripsi', 'tanggal_laporan',
        'status', 'resolusi', 'tanggal_selesai', 'mediator_id', 'is_anonim',
    ];

    protected $casts = [
        'tanggal_laporan' => 'date',
        'tanggal_selesai' => 'date',
        'is_anonim'       => 'boolean',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function mediator()
    {
        return $this->belongsTo(Pegawai::class, 'mediator_id');
    }
}
