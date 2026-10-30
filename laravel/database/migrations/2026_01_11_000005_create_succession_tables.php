<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_succession_plan', function (Blueprint $table) {
            $table->id();
            $table->string('jabatan_kritis', 200);
            $table->string('unit_kerja', 150);
            $table->foreignId('incumbent_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->enum('urgency', ['Segera', '1 Tahun', '2-3 Tahun', '3+ Tahun'])->default('2-3 Tahun');
            $table->string('alasan_kritis', 500)->nullable(); // why critical: retirement, key skill, etc.
            $table->text('kompetensi_dibutuhkan')->nullable();
            $table->timestamps();

            $table->index(['unit_kerja', 'urgency']);
        });

        Schema::create('t_succession_kandidat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('succession_id')->constrained('t_succession_plan')->cascadeOnDelete();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->tinyInteger('urutan')->default(1);   // priority rank
            $table->enum('readiness', ['Siap Sekarang', '1-2 Tahun', '3-5 Tahun'])->default('1-2 Tahun');
            $table->text('gap_kompetensi')->nullable();
            $table->text('rencana_pengembangan')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(['succession_id', 'pegawai_id']);
            $table->index('succession_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_succession_kandidat');
        Schema::dropIfExists('t_succession_plan');
    }
};
