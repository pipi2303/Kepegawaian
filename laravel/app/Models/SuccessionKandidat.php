<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuccessionKandidat extends Model
{
    protected $table = 't_succession_kandidat';

    protected $fillable = [
        'succession_id', 'pegawai_id', 'urutan', 'readiness',
        'gap_kompetensi', 'rencana_pengembangan', 'catatan',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function succession(): BelongsTo
    {
        return $this->belongsTo(SuccessionPlan::class, 'succession_id');
    }
}
