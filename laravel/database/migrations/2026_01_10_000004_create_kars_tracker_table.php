<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_kars_tracker', function (Blueprint $table) {
            $table->id();
            $table->string('bab', 10);             // KKS, MFK, PMKP, TKRS, ARK, HPK, AP, PAB, PPI
            $table->string('kode_standar', 20);    // "KKS.1", "KKS.2.1"
            $table->string('judul_standar', 250);
            $table->text('elemen_penilaian')->nullable();
            $table->enum('status', ['Belum', 'Proses', 'Lengkap', 'Tidak Berlaku'])->default('Belum');
            $table->foreignId('pic_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->date('target_tanggal')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->string('file_bukti', 500)->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['bab', 'status']);
            $table->unique('kode_standar');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_kars_tracker');
    }
};
