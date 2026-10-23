<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_tpp_kelas', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kelas', 50);
            $table->string('eselon', 20)->nullable();
            $table->decimal('nilai_dasar', 15, 2);
            $table->string('keterangan')->nullable();
            $table->timestamps();
        });

        Schema::create('t_tpp_bulanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->tinyInteger('bulan');
            $table->integer('tahun');
            $table->foreignId('tpp_kelas_id')->nullable()->constrained('t_tpp_kelas')->nullOnDelete();
            $table->decimal('nilai_dasar', 15, 2)->default(0);
            $table->decimal('persen_kehadiran', 5, 2)->default(0);
            $table->decimal('persen_kinerja', 5, 2)->default(0);
            $table->decimal('komponen_kehadiran', 15, 2)->default(0);
            $table->decimal('komponen_kinerja', 15, 2)->default(0);
            $table->decimal('potongan_alpha', 15, 2)->default(0);
            $table->decimal('total_tpp', 15, 2)->default(0);
            $table->enum('status', ['Draft', 'Approved', 'Dibayarkan'])->default('Draft');
            $table->timestamps();

            $table->unique(['pegawai_id', 'bulan', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_tpp_bulanan');
        Schema::dropIfExists('t_tpp_kelas');
    }
};
