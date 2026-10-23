<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lamaran extends Model
{
    protected $table = 't_lamaran';

    protected $fillable = [
        'formasi_id', 'nama_lengkap', 'nip_lama', 'tempat_lahir', 'tanggal_lahir',
        'jenis_kelamin', 'agama', 'alamat', 'no_hp', 'email',
        'pendidikan_terakhir', 'jurusan', 'institusi', 'ipk',
        'pengalaman_kerja', 'file_cv', 'file_ijazah', 'file_ktp', 'file_sertifikat',
        'status', 'catatan_admin', 'nilai_tes',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'ipk'           => 'decimal:2',
        'nilai_tes'     => 'decimal:2',
    ];

    public function formasi(): BelongsTo
    {
        return $this->belongsTo(Formasi::class, 'formasi_id');
    }
}
