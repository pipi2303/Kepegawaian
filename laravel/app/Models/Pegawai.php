<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class Pegawai extends Authenticatable
{
    use HasFactory, SoftDeletes, Notifiable, HasRoles;

    protected $table = 'm_pegawai';

    protected $hidden = ['password', 'remember_token'];

    protected $fillable = [
        'nip',
        'nama',
        'gelar_depan',
        'gelar_belakang',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'agama',
        'status_perkawinan',
        'alamat',
        'no_telp',
        'email',
        'jabatan',
        'jabatan_fungsional',
        'unit_kerja',
        'golongan',
        'pangkat',
        'tmt_golongan',
        'tmt_jabatan',
        'status_pegawai',
        'status_aktif',
        'pendidikan_terakhir',
        'jurusan',
        'institusi',
        'tahun_lulus',
        'tanggal_masuk',
        'batas_pensiun',
        'masa_kerja',
        'eselon',
        'badge',
        'foto',
        'sertifikat',
        'password',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'tmt_golongan' => 'date',
        'tmt_jabatan' => 'date',
        'tanggal_masuk' => 'date',
        'batas_pensiun' => 'date',
        'sertifikat' => 'array',
    ];

    // Accessor: Nama Lengkap beserta Gelar
    public function getNamaLengkapAttribute(): string
    {
        $depan = $this->gelar_depan ? trim($this->gelar_depan) . ' ' : '';
        $belakang = $this->gelar_belakang ? ', ' . trim($this->gelar_belakang) : '';
        return $depan . $this->nama . $belakang;
    }

    // Relasi Data Keluarga
    public function keluarga(): HasMany
    {
        return $this->hasMany(PegawaiKeluarga::class, 'pegawai_id');
    }

    // Relasi Dokumen Pegawai
    public function dokumen(): HasMany
    {
        return $this->hasMany(DokumenPegawai::class, 'pegawai_id');
    }

    // Relasi Presensi / Absensi
    public function absensi(): HasMany
    {
        return $this->hasMany(Absensi::class, 'pegawai_id');
    }

    // Relasi Cuti
    public function cuti(): HasMany
    {
        return $this->hasMany(Cuti::class, 'pegawai_id');
    }

    // Relasi Lisensi STR
    public function strList(): HasMany
    {
        return $this->hasMany(StrRecord::class, 'pegawai_id');
    }

    // Relasi Lisensi SIP
    public function sipList(): HasMany
    {
        return $this->hasMany(SipRecord::class, 'pegawai_id');
    }

    // Relasi Credentialing (SPK & RKK)
    public function credentialings(): HasMany
    {
        return $this->hasMany(Credentialing::class, 'pegawai_id');
    }

    // Relasi Jadwal Shift
    public function jadwalShifts(): HasMany
    {
        return $this->hasMany(JadwalShift::class, 'pegawai_id');
    }

    // Relasi Slip Gaji
    public function slipGaji(): HasMany
    {
        return $this->hasMany(SlipGaji::class, 'pegawai_id');
    }

    // Perhitungan Sisa Cuti Tahunan (PP 11/2017)
    public function getSisaCutiTahunanAttribute(): int
    {
        $tahun = now()->year;
        $cutiTerpakai = $this->cuti()
            ->whereYear('tanggal_mulai', $tahun)
            ->where('jenis_cuti', 'Cuti Tahunan')
            ->where('status', 'Disetujui')
            ->sum('jumlah_hari');

        return max(0, 12 - $cutiTerpakai);
    }
}
