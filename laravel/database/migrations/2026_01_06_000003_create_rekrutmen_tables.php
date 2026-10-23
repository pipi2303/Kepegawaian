<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_formasi_jabatan', function (Blueprint $table) {
            $table->id();
            $table->string('jabatan', 150);
            $table->string('unit_kerja', 150);
            $table->string('kualifikasi_pendidikan', 100);
            $table->string('jurusan_dibutuhkan', 255)->nullable();
            $table->integer('jumlah_formasi')->default(1);
            $table->decimal('gaji_min', 12, 2)->nullable();
            $table->decimal('gaji_max', 12, 2)->nullable();
            $table->enum('status_pegawai_target', ['PPPK', 'Honorer'])->default('PPPK');
            $table->text('persyaratan_khusus')->nullable();
            $table->integer('batas_usia_min')->nullable();
            $table->integer('batas_usia_max')->nullable();
            $table->date('tanggal_buka');
            $table->date('tanggal_tutup');
            $table->enum('status', ['Draft', 'Aktif', 'Ditutup', 'Selesai'])->default('Draft');
            $table->timestamps();
        });

        Schema::create('t_lamaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('formasi_id')->constrained('t_formasi_jabatan')->cascadeOnDelete();
            $table->string('nama_lengkap', 255);
            $table->string('nip_lama', 30)->nullable();
            $table->string('tempat_lahir', 100);
            $table->date('tanggal_lahir');
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->string('agama', 50);
            $table->text('alamat');
            $table->string('no_hp', 25);
            $table->string('email', 100);
            $table->string('pendidikan_terakhir', 50);
            $table->string('jurusan', 150);
            $table->string('institusi', 255);
            $table->decimal('ipk', 3, 2)->nullable();
            $table->text('pengalaman_kerja')->nullable();
            $table->text('file_cv')->nullable();
            $table->text('file_ijazah')->nullable();
            $table->text('file_ktp')->nullable();
            $table->text('file_sertifikat')->nullable();
            $table->enum('status', ['Diterima', 'Review', 'Tes', 'Wawancara', 'Lolos', 'Tidak Lolos', 'Cadangan'])->default('Diterima');
            $table->text('catatan_admin')->nullable();
            $table->decimal('nilai_tes', 5, 2)->nullable();
            $table->timestamps();

            $table->index(['formasi_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_lamaran');
        Schema::dropIfExists('t_formasi_jabatan');
    }
};
