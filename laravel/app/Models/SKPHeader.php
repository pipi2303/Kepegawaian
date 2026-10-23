<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SKPHeader extends Model
{
    protected $table = 't_skp_header';

    protected $fillable = [
        'pegawai_id', 'tahun', 'semester',
        'nilai_hasil_kerja', 'nilai_perilaku', 'nilai_akhir',
        'predikat', 'status', 'pejabat_penilai_id',
        'catatan_atasan', 'tanggal_penilaian',
    ];

    protected $casts = [
        'nilai_hasil_kerja' => 'decimal:2',
        'nilai_perilaku'    => 'decimal:2',
        'nilai_akhir'       => 'decimal:2',
        'tanggal_penilaian' => 'date',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function penilai()
    {
        return $this->belongsTo(Pegawai::class, 'pejabat_penilai_id');
    }

    public function details()
    {
        return $this->hasMany(SKPDetail::class, 'skp_id');
    }
}
