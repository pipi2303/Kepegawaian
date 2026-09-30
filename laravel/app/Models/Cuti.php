<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cuti extends Model
{
    use HasFactory;

    protected $table = 't_cuti';

    protected $fillable = [
        'pegawai_id',
        'jenis_cuti',
        'tanggal_mulai',
        'tanggal_selesai',
        'jumlah_hari',
        'alasan',
        'alamat_selama_cuti',
        'no_telp_cuti',
        'status',
        'disetujui_oleh',
        'tanggal_pengajuan',
        'tanggal_disetujui',
        'lampiran',
        'catatan',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'tanggal_pengajuan' => 'date',
        'tanggal_disetujui' => 'date',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(CutiApproval::class, 'cuti_id')->orderBy('level', 'asc');
    }
}
