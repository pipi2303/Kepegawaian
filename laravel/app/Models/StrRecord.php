<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StrRecord extends Model
{
    use HasFactory;

    protected $table = 't_pegawai_str';

    protected $fillable = [
        'pegawai_id',
        'nomor_str',
        'jenis_tenaga',
        'konsil',
        'tanggal_terbit',
        'tanggal_expired',
        'status',
        'file_str',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_terbit' => 'date',
        'tanggal_expired' => 'date',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    // Scope untuk mencari STR yang akan kedaluwarsa dalam $days hari
    public function scopeExpiringWithin(Builder $query, int $days = 90): Builder
    {
        return $query->where('status', 'Aktif')
                     ->whereBetween('tanggal_expired', [now(), now()->addDays($days)]);
    }
}
