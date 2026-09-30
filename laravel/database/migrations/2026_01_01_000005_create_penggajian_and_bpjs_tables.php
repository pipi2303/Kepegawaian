<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Header Slip Gaji & Remunerasi
        Schema::create('t_gaji_header', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->integer('bulan');
            $table->integer('tahun');
            $table->decimal('gaji_pokok', 15, 2)->default(0);
            $table->decimal('tunjangan_kinerja', 15, 2)->default(0);
            $table->decimal('remunerasi_jasa_pelayanan', 15, 2)->default(0);
            $table->decimal('total_bruto', 15, 2)->default(0);
            $table->decimal('total_potongan', 15, 2)->default(0);
            $table->decimal('total_netto', 15, 2)->default(0);
            $table->enum('status_pembayaran', ['Draft', 'Approved', 'Dibayarkan'])->default('Draft');
            $table->date('tanggal_dibayar')->nullable();
            $table->timestamps();

            $table->unique(['pegawai_id', 'bulan', 'tahun']);
        });

        // 2. Rincian Item Gaji (Tunjangan & Potongan)
        Schema::create('t_gaji_detail', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gaji_id')->constrained('t_gaji_header')->cascadeOnDelete();
            $table->enum('jenis', ['Penerimaan', 'Potongan']);
            $table->string('kode_komponen', 50)->nullable();
            $table->string('nama_komponen', 150); // Tunjangan Anak, BPJS Kesehatan, Iuran KORPRI, PPh 21, dll.
            $table->decimal('jumlah', 15, 2);
            $table->timestamps();
        });

        // 3. BPJS Kesehatan & Ketenagakerjaan Pegawai
        Schema::create('t_bpjs_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('nomor_bpjs_kesehatan', 50)->nullable();
            $table->string('faskes_tingkat_1', 255)->nullable();
            $table->enum('status_bpjs_kesehatan', ['Aktif', 'Nonaktif'])->default('Aktif');
            $table->string('nomor_bpjs_ketenagakerjaan', 50)->nullable();
            $table->boolean('ikut_jkk')->default(true);
            $table->boolean('ikut_jkm')->default(true);
            $table->boolean('ikut_jht')->default(true);
            $table->boolean('ikut_jp')->default(true);
            $table->timestamps();
        });

        // 4. Manajemen Kontrak Kerja (PPPK & Honorer/BLUD)
        Schema::create('t_kontrak_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('nomor_perjanjian', 100);
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->decimal('gaji_kontrak', 15, 2)->nullable();
            $table->string('posisi_tugas', 150);
            $table->enum('status_kontrak', ['Aktif', 'Akan Berakhir', 'Diperpanjang', 'Berakhir'])->default('Aktif');
            $table->text('file_kontrak')->nullable();
            $table->timestamps();

            $table->index(['status_kontrak', 'tanggal_selesai']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_kontrak_pegawai');
        Schema::dropIfExists('t_bpjs_pegawai');
        Schema::dropIfExists('t_gaji_detail');
        Schema::dropIfExists('t_gaji_header');
    }
};
