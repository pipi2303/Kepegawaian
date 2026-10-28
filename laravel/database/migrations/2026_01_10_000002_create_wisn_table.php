<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_wisn_perhitungan', function (Blueprint $table) {
            $table->id();
            $table->string('unit_kerja', 100);
            $table->string('jabatan_kategori', 100); // "Perawat", "Dokter Spesialis Bedah", dst
            $table->string('periode', 10);            // "2026"

            // Komponen WKT (Waktu Kerja Tersedia) — Permenkes WISN
            $table->unsignedSmallInteger('hari_kerja')->default(260);        // A
            $table->unsignedSmallInteger('cuti_tahunan')->default(12);       // B
            $table->unsignedSmallInteger('hari_diklat')->default(5);         // C
            $table->unsignedSmallInteger('hari_libur_nasional')->default(16);// D
            $table->unsignedSmallInteger('hari_tidak_hadir')->default(10);   // E
            $table->decimal('jam_kerja_per_hari', 4, 1)->default(8.0);       // F

            // WKT = (A-B-C-D-E) × F × 60  (menit/tahun)
            $table->decimal('wkt_menit', 10, 2)->nullable();

            // Daftar aktivitas (JSON): [{nama, jenis, standar_waktu_menit, kuantitas_setahun}]
            // jenis: 'Langsung' | 'Tidak Langsung' | 'Kelonggaran'
            $table->json('aktivitas')->nullable();

            // Hasil
            $table->decimal('kebutuhan_sdmk', 6, 2)->nullable();
            $table->unsignedSmallInteger('jumlah_aktual')->default(0);
            $table->decimal('wisn_ratio', 5, 2)->nullable();
            $table->enum('status', ['Kekurangan', 'Cukup', 'Kelebihan'])->nullable();

            $table->text('catatan')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('m_pegawai')->nullOnDelete();

            $table->timestamps();

            $table->unique(['unit_kerja', 'jabatan_kategori', 'periode']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_wisn_perhitungan');
    }
};
