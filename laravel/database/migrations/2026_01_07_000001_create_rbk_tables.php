<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_rbk_indeks', function (Blueprint $table) {
            $table->id();
            $table->string('nama_jabatan', 150)->nullable();
            $table->string('eselon', 20)->nullable();
            $table->decimal('indeks', 5, 2)->default(1.00);
            $table->decimal('nilai_dasar_rbk', 15, 2)->default(0);
            $table->string('keterangan', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('t_rbk_bulanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->tinyInteger('bulan');
            $table->integer('tahun');
            $table->foreignId('rbk_indeks_id')->nullable()->constrained('t_rbk_indeks')->nullOnDelete();
            $table->decimal('nilai_dasar', 15, 2);
            $table->decimal('indeks_jabatan', 5, 2);
            $table->decimal('capaian_skp', 5, 2);
            $table->decimal('capaian_kehadiran', 5, 2);
            $table->decimal('komponen_skp', 15, 2);
            $table->decimal('komponen_kehadiran', 15, 2);
            $table->decimal('potongan_alpha', 15, 2);
            $table->decimal('total_rbk', 15, 2);
            $table->enum('status', ['Draft', 'Approved', 'Dibayarkan'])->default('Draft');
            $table->timestamps();
            $table->unique(['pegawai_id', 'bulan', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_rbk_bulanan');
        Schema::dropIfExists('t_rbk_indeks');
    }
};
