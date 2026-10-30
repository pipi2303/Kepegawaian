<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuccessionPlan extends Model
{
    protected $table = 't_succession_plan';

    protected $fillable = [
        'jabatan_kritis', 'unit_kerja', 'incumbent_id',
        'urgency', 'alasan_kritis', 'kompetensi_dibutuhkan',
    ];

    public function incumbent(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'incumbent_id');
    }

    public function kandidat(): HasMany
    {
        return $this->hasMany(SuccessionKandidat::class, 'succession_id')->orderBy('urutan');
    }
}
