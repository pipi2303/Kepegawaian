<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_angka_kredit', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->integer('tahun');
            $table->tinyInteger('semester'); // 1 or 2
            $table->string('jabatan_fungsional', 100);
            $table->enum('unsur', ['Pendidikan', 'Pelayanan', 'Pengembangan', 'Penunjang']);
            $table->string('sub_unsur', 150);
            $table->text('kegiatan');
            $table->string('satuan', 50);
            $table->decimal('jumlah_kegiatan', 10, 2)->default(0);
            $table->decimal('angka_kredit_per_satuan', 8, 3);
            $table->decimal('total_angka_kredit', 10, 3); // computed: jumlah × per_satuan
            $table->text('bukti')->nullable();
            $table->enum('status', ['Draft', 'Diajukan', 'Diverifikasi', 'Disetujui'])->default('Draft');
            $table->timestamps();

            $table->index(['pegawai_id', 'tahun', 'semester']);
        });

        Schema::create('t_target_angka_kredit', function (Blueprint $table) {
            $table->id();
            $table->string('jabatan_fungsional', 100);
            $table->string('golongan', 10);
            $table->decimal('target_per_tahun', 10, 3);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_angka_kredit');
        Schema::dropIfExists('t_target_angka_kredit');
    }
};
