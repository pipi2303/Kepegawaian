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
        // 1. STR Tenaga Medis & Tenaga Kesehatan
        Schema::create('t_pegawai_str', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('nomor_str', 100)->unique();
            $table->string('jenis_tenaga', 100); // Dokter Umum, Spesialis, Perawat, Bidan, Apoteker, dll.
            $table->string('konsil', 150); // KKI, KTKI, dll.
            $table->date('tanggal_terbit');
            $table->date('tanggal_expired');
            $table->enum('status', ['Aktif', 'Akan Expired', 'Expired'])->default('Aktif');
            $table->text('file_str')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['status', 'tanggal_expired']);
        });

        // 2. SIP (Surat Izin Praktik di Faskes)
        Schema::create('t_pegawai_sip', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('nomor_sip', 100)->unique();
            $table->string('jenis_dokumen', 50)->default('SIP'); // SIP, SIPP, SIPB, SIPA
            $table->string('jenis_praktik', 150);
            $table->string('fasyankes', 255)->default('RSUDAM');
            $table->string('instansi_penerbit', 255);
            $table->date('tanggal_terbit');
            $table->date('tanggal_expired');
            $table->enum('status', ['Aktif', 'Akan Expired', 'Expired'])->default('Aktif');
            $table->text('file_sip')->nullable();
            $table->timestamps();

            $table->index(['status', 'tanggal_expired']);
        });

        // 3. Credentialing & Re-Credentialing (Komite Medik & Komite Keperawatan)
        Schema::create('t_credentialing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('komite_terkait', 100); // Komite Medik, Komite Keperawatan, Komite Nakes Lain
            $table->enum('jenis_kredensial', ['Kredensial Awal', 'Re-Kredensial', 'Pemulihan Kewenangan', 'Penambahan Kewenangan']);
            $table->string('nomor_spk', 100)->nullable(); // Surat Penugasan Klinis
            $table->date('tanggal_spk')->nullable();
            $table->date('tanggal_berlaku_sampai')->nullable();
            $table->enum('status', ['Diajukan', 'Review Subkomite', 'Rekomendasi Terbit', 'SPK Diterbitkan', 'Ditolak'])->default('Diajukan');
            $table->text('rincian_kewenangan_klinis')->nullable(); // JSON / Text rincian tindakan yang diizinkan (RKK)
            $table->text('catatan_mitra_bestari')->nullable();
            $table->text('file_dokumen_spk')->nullable();
            $table->timestamps();
        });

        // 4. CPD (Continuous Professional Development / Satuan Kredit Profesi)
        Schema::create('t_cpd_skp', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('nama_kegiatan', 255);
            $table->string('kategori_kegiatan', 100); // Pembelajaran, Pelayanan, Pengabdian, Publikasi
            $table->date('tanggal_kegiatan');
            $table->decimal('jumlah_skp', 5, 2);
            $table->string('penyelenggara', 255);
            $table->string('nomor_sertifikat', 150)->nullable();
            $table->text('file_sertifikat')->nullable();
            $table->enum('status_verifikasi', ['Pending', 'Terverifikasi', 'Ditolak'])->default('Pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_cpd_skp');
        Schema::dropIfExists('t_credentialing');
        Schema::dropIfExists('t_pegawai_sip');
        Schema::dropIfExists('t_pegawai_str');
    }
};
