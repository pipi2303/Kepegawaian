<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DokumenKompetensi extends Model
{
    protected $table = 't_dokumen_kompetensi';

    protected $fillable = [
        'pegawai_id', 'jenis_dokumen', 'nama_dokumen', 'nomor_sertifikat',
        'penyelenggara', 'tanggal_terbit', 'tanggal_expired',
        'status', 'file_dokumen', 'keterangan',
    ];

    protected $casts = [
        'tanggal_terbit'   => 'date',
        'tanggal_expired'  => 'date',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function scopeExpiringWithin(Builder $query, int $days = 90): Builder
    {
        return $query->where('status', 'Aktif')
                     ->whereBetween('tanggal_expired', [now(), now()->addDays($days)]);
    }

    public function updateStatus(): void
    {
        $this->status = match (true) {
            now()->gt($this->tanggal_expired)           => 'Expired',
            now()->addDays(90)->gt($this->tanggal_expired) => 'Akan Expired',
            default                                     => 'Aktif',
        };
    }
}
