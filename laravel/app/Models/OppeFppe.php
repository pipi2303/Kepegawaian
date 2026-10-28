<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OppeFppe extends Model
{
    protected $table = 't_oppe_fppe';

    protected $fillable = [
        'pegawai_id', 'credentialing_id', 'jenis', 'periode', 'smf',
        'tanggal_mulai', 'tanggal_selesai', 'status',
        'jumlah_kasus', 'jumlah_komplikasi', 'alos',
        'kepatuhan_cp', 'kelengkapan_klpcm',
        'nilai_rekan', 'catatan_rekan',
        'nilai_total', 'rekomendasi', 'catatan_komite',
        'penilai_id', 'tanggal_keputusan',
    ];

    protected $casts = [
        'tanggal_mulai'      => 'date',
        'tanggal_selesai'    => 'date',
        'tanggal_keputusan'  => 'date',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function credentialing(): BelongsTo
    {
        return $this->belongsTo(Credentialing::class, 'credentialing_id');
    }

    public function penilai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'penilai_id');
    }

    // Bobot KARS: CP 40%, KLPCM 30%, Peer Review 30%
    public function hitungNilai(): ?float
    {
        if (is_null($this->kepatuhan_cp) && is_null($this->kelengkapan_klpcm) && is_null($this->nilai_rekan)) {
            return null;
        }

        return round(
            (($this->kepatuhan_cp ?? 0) * 0.40) +
            (($this->kelengkapan_klpcm ?? 0) * 0.30) +
            (($this->nilai_rekan ?? 0) * 0.30),
            2
        );
    }

    public function getPredikatAttribute(): ?string
    {
        if (is_null($this->nilai_total)) return null;
        return match (true) {
            $this->nilai_total >= 90 => 'Baik Sekali',
            $this->nilai_total >= 75 => 'Baik',
            $this->nilai_total >= 60 => 'Cukup',
            default                  => 'Kurang',
        };
    }
}
