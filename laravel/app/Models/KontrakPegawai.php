<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KontrakPegawai extends Model
{
    protected $table = 't_kontrak_pegawai';

    protected $fillable = [
        'pegawai_id', 'nomor_perjanjian', 'tanggal_mulai', 'tanggal_selesai',
        'gaji_kontrak', 'posisi_tugas', 'status_kontrak', 'file_kontrak',
    ];

    protected $casts = [
        'tanggal_mulai'  => 'date',
        'tanggal_selesai'=> 'date',
        'gaji_kontrak'   => 'decimal:2',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }

    public function scopeAktif($q)
    {
        return $q->where('status_kontrak', 'Aktif');
    }

    public function scopeWillExpire($q, int $days = 30)
    {
        return $q->aktif()->whereBetween('tanggal_selesai', [now()->toDateString(), now()->addDays($days)->toDateString()]);
    }
}
