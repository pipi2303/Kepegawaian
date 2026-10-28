<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KarsTracker extends Model
{
    protected $table = 't_kars_tracker';

    protected $fillable = [
        'bab', 'kode_standar', 'judul_standar', 'elemen_penilaian',
        'status', 'pic_id', 'target_tanggal', 'tanggal_selesai',
        'file_bukti', 'catatan',
    ];

    protected $casts = [
        'target_tanggal'  => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function pic(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pic_id');
    }

    // Standar KARS yang relevan untuk SDM — di-seed saat migrate atau via seeder
    public static function standarDefault(): array
    {
        return [
            // KKS — Kualifikasi dan Pendidikan Staf
            ['bab' => 'KKS', 'kode_standar' => 'KKS.1',   'judul_standar' => 'Perencanaan Kebutuhan Staf'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.2',   'judul_standar' => 'Rekrutmen, Evaluasi, dan Pengangkatan Staf'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.3',   'judul_standar' => 'File Kepegawaian Staf'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.4',   'judul_standar' => 'Proses Kredensial Staf Medis'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.5',   'judul_standar' => 'Kewenangan Klinis Staf Medis (Privilege)'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.6',   'judul_standar' => 'Monitoring Praktik Profesional Berkelanjutan (OPPE)'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.7',   'judul_standar' => 'Kredensial Staf Keperawatan'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.8',   'judul_standar' => 'Evaluasi Kinerja Staf Keperawatan'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.9',   'judul_standar' => 'Kredensial Staf Klinis Lain'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.10',  'judul_standar' => 'Orientasi dan Pelatihan Staf Baru'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.11',  'judul_standar' => 'Pendidikan dan Pelatihan Berkelanjutan'],
            ['bab' => 'KKS', 'kode_standar' => 'KKS.12',  'judul_standar' => 'Kesehatan dan Keselamatan Kerja Staf'],
            // PMKP — Peningkatan Mutu dan Keselamatan Pasien
            ['bab' => 'PMKP', 'kode_standar' => 'PMKP.1',  'judul_standar' => 'Program PMKP'],
            ['bab' => 'PMKP', 'kode_standar' => 'PMKP.2',  'judul_standar' => 'Komite/Tim PMKP'],
            ['bab' => 'PMKP', 'kode_standar' => 'PMKP.3',  'judul_standar' => 'Pelatihan PMKP untuk Staf'],
            // TKRS — Tata Kelola Rumah Sakit
            ['bab' => 'TKRS', 'kode_standar' => 'TKRS.1',  'judul_standar' => 'Kepemimpinan RS'],
            ['bab' => 'TKRS', 'kode_standar' => 'TKRS.2',  'judul_standar' => 'Struktur Organisasi RS'],
            ['bab' => 'TKRS', 'kode_standar' => 'TKRS.3',  'judul_standar' => 'Etika Organisasi'],
            // MFK — Manajemen Fasilitas dan Keselamatan
            ['bab' => 'MFK',  'kode_standar' => 'MFK.1',   'judul_standar' => 'Keselamatan dan Keamanan Fasilitas'],
            ['bab' => 'MFK',  'kode_standar' => 'MFK.4',   'judul_standar' => 'Pengawasan Sistem Utilitas'],
            ['bab' => 'MFK',  'kode_standar' => 'MFK.8',   'judul_standar' => 'Pelatihan Staf untuk Keamanan Fasilitas'],
        ];
    }
}
