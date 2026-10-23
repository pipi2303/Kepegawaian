<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Formasi extends Model
{
    protected $table = 't_formasi_jabatan';

    protected $fillable = [
        'jabatan', 'unit_kerja', 'kualifikasi_pendidikan', 'jurusan_dibutuhkan',
        'jumlah_formasi', 'gaji_min', 'gaji_max', 'status_pegawai_target',
        'persyaratan_khusus', 'batas_usia_min', 'batas_usia_max',
        'tanggal_buka', 'tanggal_tutup', 'status',
    ];

    protected $casts = [
        'tanggal_buka'  => 'date',
        'tanggal_tutup' => 'date',
        'gaji_min'      => 'decimal:2',
        'gaji_max'      => 'decimal:2',
    ];

    public function lamaran(): HasMany
    {
        return $this->hasMany(Lamaran::class, 'formasi_id');
    }

    public function scopeAktif($q)
    {
        return $q->where('status', 'Aktif')->where('tanggal_tutup', '>=', now()->toDateString());
    }
}
