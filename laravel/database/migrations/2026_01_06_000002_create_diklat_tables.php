<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_diklat_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('nama_diklat', 255);
            $table->string('penyelenggara', 150);
            $table->enum('jenis', ['Teknis', 'Fungsional', 'Kepemimpinan', 'Orientasi', 'Seminar', 'Workshop', 'Webinar', 'Magang']);
            $table->enum('metode', ['Klasikal', 'Online', 'Blended'])->default('Klasikal');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->integer('jumlah_jam');
            $table->string('tempat', 150)->nullable();
            $table->string('nomor_sertifikat', 100)->nullable();
            $table->text('file_sertifikat')->nullable();
            $table->enum('status', ['Direncanakan', 'Sedang Berjalan', 'Selesai', 'Batal'])->default('Direncanakan');
            $table->integer('tahun')->storedAs('YEAR(tanggal_mulai)');
            $table->decimal('biaya', 12, 2)->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['pegawai_id', 'tahun']);
        });

        Schema::create('t_rencana_diklat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->integer('tahun');
            $table->integer('target_jam')->default(40);
            $table->integer('realisasi_jam')->default(0);
            $table->timestamps();

            $table->unique(['pegawai_id', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_rencana_diklat');
        Schema::dropIfExists('t_diklat_pegawai');
    }
};
