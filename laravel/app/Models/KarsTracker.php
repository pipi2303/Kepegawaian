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

    // STARKES 2022 — Standar Nasional Akreditasi RS Edisi 1 (2022)
    public static function standarDefault(): array
    {
        return [
            // KKS — Kualifikasi dan Kompetensi Staf
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-1',  'judul_standar' => 'Perencanaan dan Penetapan Kebutuhan Staf'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-2',  'judul_standar' => 'Rekrutmen, Seleksi, dan Orientasi Staf Baru'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-3',  'judul_standar' => 'Pengelolaan File Kepegawaian'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-4',  'judul_standar' => 'Pelatihan dan Pengembangan Kompetensi Staf'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-5',  'judul_standar' => 'Evaluasi Kinerja Staf Non-Klinis'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-6',  'judul_standar' => 'Kesehatan dan Keselamatan Kerja Staf'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-7',  'judul_standar' => 'Kredensial Staf Medis — Verifikasi STR/SIP'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-8',  'judul_standar' => 'Delineasi Kewenangan Klinis (SPK & RKK)'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-9',  'judul_standar' => 'Pemantauan Praktik Klinis Berkelanjutan (OPPE/FPPE)'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-10', 'judul_standar' => 'Rekredensial Staf Medis (Re-Kredensial)'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-11', 'judul_standar' => 'Kredensial Staf Keperawatan & Kebidanan'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-12', 'judul_standar' => 'Evaluasi Kinerja Staf Keperawatan'],
            ['bab' => 'KKS', 'kode_standar' => 'S-KKS-13', 'judul_standar' => 'Kredensial Staf Klinis Lain (Apoteker, Radiografer, dll)'],
            // TKRS — Tata Kelola Rumah Sakit
            ['bab' => 'TKRS', 'kode_standar' => 'S-TKRS-1', 'judul_standar' => 'Kepemimpinan dan Tanggung Jawab Direksi RS'],
            ['bab' => 'TKRS', 'kode_standar' => 'S-TKRS-2', 'judul_standar' => 'Struktur Organisasi, Tata Kelola, dan Akuntabilitas'],
            ['bab' => 'TKRS', 'kode_standar' => 'S-TKRS-3', 'judul_standar' => 'Etika Organisasi dan Budaya Keselamatan'],
            ['bab' => 'TKRS', 'kode_standar' => 'S-TKRS-4', 'judul_standar' => 'Perencanaan Strategis dan Manajemen Kinerja'],
            // PMKP — Peningkatan Mutu dan Keselamatan Pasien
            ['bab' => 'PMKP', 'kode_standar' => 'S-PMKP-1', 'judul_standar' => 'Tata Kelola Program PMKP'],
            ['bab' => 'PMKP', 'kode_standar' => 'S-PMKP-2', 'judul_standar' => 'Pelatihan PMKP untuk Staf dan Pimpinan'],
            ['bab' => 'PMKP', 'kode_standar' => 'S-PMKP-3', 'judul_standar' => 'Indikator Mutu Prioritas RS & Unit Kerja'],
            ['bab' => 'PMKP', 'kode_standar' => 'S-PMKP-4', 'judul_standar' => 'Manajemen Data Indikator Mutu'],
            ['bab' => 'PMKP', 'kode_standar' => 'S-PMKP-5', 'judul_standar' => 'Pelaporan Insiden Keselamatan Pasien (IKP)'],
            // MFK — Manajemen Fasilitas dan Keselamatan
            ['bab' => 'MFK', 'kode_standar' => 'S-MFK-1',  'judul_standar' => 'Keselamatan dan Keamanan Lingkungan Kerja'],
            ['bab' => 'MFK', 'kode_standar' => 'S-MFK-2',  'judul_standar' => 'Tanggap Darurat — Bencana dan Code Blue'],
            ['bab' => 'MFK', 'kode_standar' => 'S-MFK-3',  'judul_standar' => 'Pelatihan Staf untuk Keselamatan Fasilitas'],
            // PPI — Pencegahan dan Pengendalian Infeksi
            ['bab' => 'PPI', 'kode_standar' => 'S-PPI-1',  'judul_standar' => 'Program PPI — Peran Komite/Tim PPI'],
            ['bab' => 'PPI', 'kode_standar' => 'S-PPI-2',  'judul_standar' => 'Pelatihan dan Edukasi PPI untuk Staf'],
            ['bab' => 'PPI', 'kode_standar' => 'S-PPI-3',  'judul_standar' => 'Kesehatan dan Keselamatan Petugas (APD, Vaksinasi)'],
            // SKP — Sasaran Keselamatan Pasien
            ['bab' => 'SKP', 'kode_standar' => 'S-SKP-1',  'judul_standar' => 'Ketepatan Identifikasi Pasien'],
            ['bab' => 'SKP', 'kode_standar' => 'S-SKP-2',  'judul_standar' => 'Komunikasi Efektif dalam Pelayanan'],
            ['bab' => 'SKP', 'kode_standar' => 'S-SKP-6',  'judul_standar' => 'Risiko Jatuh — Asesmen dan Pencegahan'],
        ];
    }

    public static function standarStarkes2022(): array
    {
        return static::standarDefault();
    }
}
