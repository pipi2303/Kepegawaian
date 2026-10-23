<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_penghargaan_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('nama_penghargaan', 255);
            $table->enum('jenis', ['Pegawai Teladan', 'Inovasi', 'Dedikasi', 'Masa Kerja', 'Kehadiran', 'Lainnya']);
            $table->string('pemberi', 150)->nullable();
            $table->enum('level', ['Internal', 'Kabupaten/Kota', 'Provinsi', 'Nasional'])->default('Internal');
            $table->date('tanggal');
            $table->integer('tahun')->storedAs('YEAR(tanggal)');
            $table->text('deskripsi')->nullable();
            $table->text('file_sertifikat')->nullable();
            $table->timestamps();

            $table->index(['pegawai_id', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_penghargaan_pegawai');
    }
};
