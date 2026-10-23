<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_grievance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->enum('kategori', ['Remunerasi', 'Kondisi Kerja', 'Hubungan Rekan', 'Diskriminasi', 'Pelecehan', 'Lainnya']);
            $table->text('deskripsi');
            $table->date('tanggal_laporan');
            $table->enum('status', ['Diterima', 'Sedang Diproses', 'Mediasi', 'Selesai', 'Ditutup'])->default('Diterima');
            $table->text('resolusi')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->foreignId('mediator_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->boolean('is_anonim')->default(false);
            $table->timestamps();
        });

        Schema::create('t_phk_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->enum('jenis_phk', ['Pengunduran Diri', 'Diberhentikan', 'Kontrak Berakhir', 'Pensiun Dini', 'Meninggal Dunia']);
            $table->text('alasan');
            $table->date('tanggal_phk');
            $table->decimal('pesangon', 15, 2)->nullable();
            $table->decimal('uang_penghargaan', 15, 2)->nullable();
            $table->decimal('uang_pisah', 15, 2)->nullable();
            $table->decimal('total_kompensasi', 15, 2)->nullable();
            $table->enum('status', ['Proses', 'Selesai', 'Banding'])->default('Proses');
            $table->string('nomor_sk', 100)->nullable();
            $table->date('tanggal_sk')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_phk_pegawai');
        Schema::dropIfExists('t_grievance');
    }
};
