<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RBKIndeks extends Model
{
    protected $table = 't_rbk_indeks';

    protected $fillable = [
        'nama_jabatan',
        'eselon',
        'indeks',
        'nilai_dasar_rbk',
        'keterangan',
    ];

    protected $casts = [
        'indeks'          => 'decimal:2',
        'nilai_dasar_rbk' => 'decimal:2',
    ];

    public function rbkBulanan(): HasMany
    {
        return $this->hasMany(RBKBulanan::class, 'rbk_indeks_id');
    }
}
