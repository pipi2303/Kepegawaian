<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_dokumen_kompetensi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->enum('jenis_dokumen', [
                'BLS', 'ACLS', 'BTCLS', 'PPGD', 'ATLS', 'NLS',
                'Pelatihan Khusus', 'Sertifikat Kompetensi', 'Lainnya',
            ]);
            $table->string('nama_dokumen', 200);
            $table->string('nomor_sertifikat', 100)->nullable();
            $table->string('penyelenggara', 200)->nullable();
            $table->date('tanggal_terbit');
            $table->date('tanggal_expired');
            $table->enum('status', ['Aktif', 'Akan Expired', 'Expired'])->default('Aktif');
            $table->string('file_dokumen', 500)->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['pegawai_id', 'status']);
            $table->index(['status', 'tanggal_expired']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_dokumen_kompetensi');
    }
};
