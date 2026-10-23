<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Diklat extends Model
{
    protected $table = 't_diklat_pegawai';

    protected $fillable = [
        'pegawai_id',
        'nama_diklat',
        'penyelenggara',
        'jenis',
        'metode',
        'tanggal_mulai',
        'tanggal_selesai',
        'jumlah_jam',
        'tempat',
        'nomor_sertifikat',
        'file_sertifikat',
        'status',
        'biaya',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_mulai'  => 'date',
        'tanggal_selesai' => 'date',
        'biaya'          => 'decimal:2',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function scopeTahun($query, int $tahun)
    {
        return $query->where('tahun', $tahun);
    }

    public function scopeSelesai($query)
    {
        return $query->where('status', 'Selesai');
    }
}
