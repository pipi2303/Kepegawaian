<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExitInterview extends Model
{
    protected $table = 't_exit_interview';

    protected $fillable = [
        'pegawai_id', 'tanggal_wawancara', 'tanggal_akhir_kerja',
        'unit_kerja', 'jabatan', 'masa_kerja_tahun', 'alasan_utama',
        'kepuasan_gaji', 'kepuasan_atasan', 'kepuasan_rekan',
        'kepuasan_fasilitas', 'kepuasan_pengembangan', 'kepuasan_overall',
        'komentar', 'bersedia_kembali', 'pewawancara_id',
    ];

    protected $casts = [
        'tanggal_wawancara'  => 'date',
        'tanggal_akhir_kerja'=> 'date',
        'bersedia_kembali'   => 'boolean',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function pewawancara(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pewawancara_id');
    }

    public function hitungOverall(): float
    {
        return round((
            $this->kepuasan_gaji +
            $this->kepuasan_atasan +
            $this->kepuasan_rekan +
            $this->kepuasan_fasilitas +
            $this->kepuasan_pengembangan
        ) / 5, 2);
    }
}
