<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SKPDetail extends Model
{
    protected $table = 't_skp_detail';

    protected $fillable = [
        'skp_id', 'aspek', 'rencana_kinerja_atasan',
        'rencana_kinerja_individu', 'indikator_kinerja_individu',
        'target_min', 'target_max', 'satuan',
        'realisasi', 'capaian_persen',
        'bukti_dukung', 'umpan_balik_berkelanjutan',
    ];

    protected $casts = [
        'target_min'    => 'decimal:2',
        'target_max'    => 'decimal:2',
        'realisasi'     => 'decimal:2',
        'capaian_persen'=> 'decimal:2',
    ];

    public function skp()
    {
        return $this->belongsTo(SKPHeader::class, 'skp_id');
    }
}
