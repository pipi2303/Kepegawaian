<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OppePeerReview extends Model
{
    protected $table = 't_oppe_peer_review';

    protected $fillable = [
        'oppe_id', 'reviewer_id',
        'kompetensi_klinis', 'komunikasi', 'etika_profesional', 'kerjasama_tim', 'pengetahuan',
        'nilai_total', 'catatan', 'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function oppe(): BelongsTo
    {
        return $this->belongsTo(OppeFppe::class, 'oppe_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'reviewer_id');
    }

    public function hitungTotal(): float
    {
        return round((
            $this->kompetensi_klinis +
            $this->komunikasi +
            $this->etika_profesional +
            $this->kerjasama_tim +
            $this->pengetahuan
        ) / 5, 1);
    }
}
