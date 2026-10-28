<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_exit_interview', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->date('tanggal_wawancara');
            $table->date('tanggal_akhir_kerja');
            $table->string('unit_kerja', 150);   // denormalized
            $table->string('jabatan', 150);
            $table->decimal('masa_kerja_tahun', 4, 1)->default(0);
            $table->enum('alasan_utama', [
                'Gaji & Tunjangan',
                'Jenjang Karir',
                'Lingkungan Kerja',
                'Kepemimpinan',
                'Keluarga & Personal',
                'Kesehatan',
                'Pensiun',
                'Lainnya',
            ]);
            $table->tinyInteger('kepuasan_gaji')->default(3);           // 1–5
            $table->tinyInteger('kepuasan_atasan')->default(3);
            $table->tinyInteger('kepuasan_rekan')->default(3);
            $table->tinyInteger('kepuasan_fasilitas')->default(3);
            $table->tinyInteger('kepuasan_pengembangan')->default(3);
            $table->decimal('kepuasan_overall', 3, 2)->nullable();      // avg, computed
            $table->text('komentar')->nullable();
            $table->boolean('bersedia_kembali')->default(false);
            $table->foreignId('pewawancara_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->timestamps();

            $table->index(['unit_kerja', 'alasan_utama']);
            $table->index('tanggal_akhir_kerja');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_exit_interview');
    }
};
