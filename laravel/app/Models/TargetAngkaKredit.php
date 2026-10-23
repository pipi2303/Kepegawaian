<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TargetAngkaKredit extends Model
{
    protected $table = 't_target_angka_kredit';

    protected $fillable = [
        'jabatan_fungsional', 'golongan', 'target_per_tahun', 'keterangan',
    ];

    protected $casts = [
        'target_per_tahun' => 'float',
    ];
}
