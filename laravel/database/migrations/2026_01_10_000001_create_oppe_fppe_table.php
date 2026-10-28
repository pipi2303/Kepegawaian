<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_oppe_fppe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->foreignId('credentialing_id')->nullable()->constrained('t_credentialing')->nullOnDelete();
            $table->enum('jenis', ['OPPE', 'FPPE'])->default('OPPE');
            $table->string('periode', 50);           // "Semester 1 2026"
            $table->string('smf', 100)->nullable();  // SMF / unit klinis
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->enum('status', ['Draft', 'Berlangsung', 'Selesai', 'Tindak Lanjut'])->default('Draft');

            // Metrik klinis
            $table->unsignedSmallInteger('jumlah_kasus')->default(0);
            $table->unsignedSmallInteger('jumlah_komplikasi')->default(0);
            $table->decimal('alos', 5, 2)->nullable();             // avg length of stay (hari)
            $table->decimal('kepatuhan_cp', 5, 2)->nullable();     // % kepatuhan Clinical Pathway
            $table->decimal('kelengkapan_klpcm', 5, 2)->nullable();// % kelengkapan pengisian RM

            // Peer review
            $table->decimal('nilai_rekan', 5, 2)->nullable();      // 0–100
            $table->text('catatan_rekan')->nullable();

            // Hasil
            $table->decimal('nilai_total', 5, 2)->nullable();      // computed
            $table->enum('rekomendasi', [
                'Lanjutkan Kewenangan',
                'Supervisi Ketat',
                'Batasi Kewenangan',
                'Cabut Kewenangan',
            ])->nullable();
            $table->text('catatan_komite')->nullable();
            $table->foreignId('penilai_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->date('tanggal_keputusan')->nullable();

            $table->timestamps();

            $table->index(['pegawai_id', 'jenis', 'periode']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_oppe_fppe');
    }
};
