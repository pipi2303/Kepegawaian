<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AngkaKredit extends Model
{
    protected $table = 't_angka_kredit';

    protected $fillable = [
        'pegawai_id', 'tahun', 'semester', 'jabatan_fungsional',
        'unsur', 'sub_unsur', 'kegiatan', 'satuan',
        'jumlah_kegiatan', 'angka_kredit_per_satuan', 'total_angka_kredit',
        'bukti', 'status',
    ];

    protected $casts = [
        'jumlah_kegiatan'        => 'float',
        'angka_kredit_per_satuan'=> 'float',
        'total_angka_kredit'     => 'float',
        'semester'               => 'integer',
        'tahun'                  => 'integer',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }
}
