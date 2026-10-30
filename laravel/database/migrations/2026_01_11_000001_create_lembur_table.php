<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_lembur', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->date('tanggal');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->decimal('durasi_jam', 4, 2)->default(0);       // computed
            $table->enum('jenis_hari', ['Hari Kerja', 'Hari Libur', 'Hari Besar'])->default('Hari Kerja');
            $table->string('alasan', 500);
            $table->enum('status', ['Diajukan', 'Disetujui', 'Ditolak'])->default('Diajukan');
            $table->foreignId('approver_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->timestamp('tanggal_approval')->nullable();
            $table->decimal('upah_lembur', 12, 2)->nullable();     // computed saat approve
            $table->string('catatan', 500)->nullable();
            $table->timestamps();

            $table->index(['pegawai_id', 'tanggal']);
            $table->index(['status', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_lembur');
    }
};
