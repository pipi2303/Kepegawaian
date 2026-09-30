<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JadwalShift extends Model
{
    use HasFactory;

    protected $table = 't_jadwal_shift';

    protected $fillable = [
        'pegawai_id',
        'tanggal',
        'jenis_shift',
        'jam_mulai',
        'jam_selesai',
        'unit_kerja',
        'ruangan',
        'status_kehadiran',
        'tukar_dengan_pegawai_id',
        'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function pegawaiTukar(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'tukar_dengan_pegawai_id');
    }
}
