<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InsidenK3RS extends Model
{
    protected $table = 't_insiden_k3rs';

    protected $fillable = [
        'pegawai_id', 'tanggal_insiden', 'jam_insiden', 'lokasi',
        'jenis_insiden', 'kronologi', 'tingkat_keparahan', 'korban_jiwa',
        'penanganan_awal', 'status_investigasi', 'pelapor_id',
    ];

    protected $casts = [
        'tanggal_insiden' => 'date',
        'jam_insiden'     => 'string',
        'korban_jiwa'     => 'boolean',
    ];

    public function pelapor()
    {
        return $this->belongsTo(Pegawai::class, 'pelapor_id');
    }

    public function korban()
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }
}
