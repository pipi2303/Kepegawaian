<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_thr', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->unsignedSmallInteger('tahun');
            $table->enum('hari_raya', ['Idul Fitri', 'Natal', 'Nyepi', 'Waisak', 'Lainnya'])->default('Idul Fitri');
            $table->unsignedSmallInteger('masa_kerja_bulan')->default(0);
            $table->enum('formula', ['Penuh', 'Proporsional'])->default('Penuh');
            $table->decimal('gaji_dasar', 14, 2)->default(0);
            $table->decimal('jumlah_thr', 14, 2)->default(0);
            $table->enum('status', ['Draft', 'Approved', 'Dibayarkan'])->default('Draft');
            $table->date('tanggal_bayar')->nullable();
            $table->string('catatan', 500)->nullable();
            $table->timestamps();

            $table->unique(['pegawai_id', 'tahun', 'hari_raya']);
            $table->index(['tahun', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_thr');
    }
};
