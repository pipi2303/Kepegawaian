<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TPPKelas extends Model
{
    protected $table = 't_tpp_kelas';

    protected $fillable = ['nama_kelas', 'eselon', 'nilai_dasar', 'keterangan'];

    public function tppBulanan(): HasMany
    {
        return $this->hasMany(TPPBulanan::class, 'tpp_kelas_id');
    }
}
