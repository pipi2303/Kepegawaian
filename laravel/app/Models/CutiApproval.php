<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CutiApproval extends Model
{
    use HasFactory;

    protected $table = 't_cuti_approval';

    protected $fillable = [
        'cuti_id',
        'level',
        'jabatan_penilai',
        'approver_pegawai_id',
        'approver_nama',
        'status',
        'tanggal_aksi',
        'catatan',
    ];

    protected $casts = [
        'tanggal_aksi' => 'datetime',
    ];

    public function cuti(): BelongsTo
    {
        return $this->belongsTo(Cuti::class, 'cuti_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'approver_pegawai_id');
    }
}
