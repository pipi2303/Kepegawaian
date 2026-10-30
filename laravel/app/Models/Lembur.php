<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lembur extends Model
{
    protected $table = 't_lembur';

    protected $fillable = [
        'pegawai_id', 'tanggal', 'jam_mulai', 'jam_selesai', 'durasi_jam',
        'jenis_hari', 'alasan', 'status', 'approver_id',
        'tanggal_approval', 'upah_lembur', 'catatan',
    ];

    protected $casts = [
        'tanggal'          => 'date',
        'tanggal_approval' => 'datetime',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'approver_id');
    }

    /** PP 35/2021: upah lembur berbasis gaji_pokok / 173 */
    public function hitungUpahLembur(float $gajiPokok): float
    {
        $perJam   = $gajiPokok / 173;
        $durasi   = (float) $this->durasi_jam;
        $isLibur  = in_array($this->jenis_hari, ['Hari Libur', 'Hari Besar']);

        if ($isLibur) {
            return round($perJam * 2 * $durasi, 2);
        }

        // Hari kerja: jam ke-1 = 1.5×, selebihnya 2×
        if ($durasi <= 1) {
            return round($perJam * 1.5 * $durasi, 2);
        }

        return round(($perJam * 1.5) + ($perJam * 2 * ($durasi - 1)), 2);
    }
}
