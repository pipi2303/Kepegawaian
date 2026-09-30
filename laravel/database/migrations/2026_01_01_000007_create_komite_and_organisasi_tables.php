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
        // 1. Master Unit Kerja & Struktur Organisasi
        Schema::create('m_unit_kerja', function (Blueprint $table) {
            $table->id();
            $table->string('kode_unit', 50)->unique();
            $table->string('nama_unit', 150);
            $table->enum('tipe_unit', ['Direksi', 'Bidang', 'Bagian', 'Instalasi', 'Ruangan', 'Komite', 'UPT']);
            $table->foreignId('parent_id')->nullable()->constrained('m_unit_kerja')->nullOnDelete();
            $table->foreignId('kepala_unit_pegawai_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->timestamps();
        });

        // 2. Komite Rumah Sakit (Komite Medik, Keperawatan, Nakes Lain, PPI, Mutu, Etik)
        Schema::create('m_komite_rs', function (Blueprint $table) {
            $table->id();
            $table->string('nama_komite', 150);
            $table->string('singkatan', 50)->nullable();
            $table->foreignId('ketua_pegawai_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->string('nomor_sk_pendirian', 100)->nullable();
            $table->date('tanggal_sk')->nullable();
            $table->text('deskripsi_tugas')->nullable();
            $table->timestamps();
        });

        // 3. Anggota Komite
        Schema::create('t_anggota_komite', function (Blueprint $table) {
            $table->id();
            $table->foreignId('komite_id')->constrained('m_komite_rs')->cascadeOnDelete();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('jabatan_di_komite', 100); // Ketua, Sekretaris, Subkomite Kredensial, Subkomite Mutu, Anggota
            $table->date('tanggal_bergabung');
            $table->date('tanggal_berakhir')->nullable();
            $table->enum('status', ['Aktif', 'Nonaktif'])->default('Aktif');
            $table->timestamps();
        });

        // 4. Kegiatan & Rapat Komite
        Schema::create('t_kegiatan_komite', function (Blueprint $table) {
            $table->id();
            $table->foreignId('komite_id')->constrained('m_komite_rs')->cascadeOnDelete();
            $table->string('judul_kegiatan', 255);
            $table->date('tanggal_kegiatan');
            $table->time('jam_mulai')->nullable();
            $table->time('jam_selesai')->nullable();
            $table->string('tempat', 150);
            $table->text('agenda');
            $table->text('notulensi')->nullable();
            $table->text('daftar_hadir_foto')->nullable();
            $table->timestamps();
        });

        // 5. Surat Keluar Kepegawaian (Digital Signature & Dokumen)
        Schema::create('t_surat_kepegawaian', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_surat', 100)->unique();
            $table->enum('jenis_surat', [
                'Surat Keterangan Aktif Bekerja',
                'Surat Keterangan Penghasilan',
                'Surat Keterangan Pengalaman Kerja',
                'Surat Izin Cuti',
                'Surat Tugas Pelatihan / Seminar',
                'Surat Penugasan Klinis (SPK)'
            ]);
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->date('tanggal_surat');
            $table->string('pejabat_penandatangan', 255)->default('dr. IMAM GHOZALI, Sp.An., M.Kes.');
            $table->string('nip_penandatangan', 50)->default('19680415 199703 1 001');
            $table->string('jabatan_penandatangan', 150)->default('Direktur Utama');
            $table->text('keperluan');
            $table->enum('status', ['Draft', 'Diajukan', 'Disetujui', 'Ditolak'])->default('Draft');
            $table->text('file_pdf_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_surat_kepegawaian');
        Schema::dropIfExists('t_kegiatan_komite');
        Schema::dropIfExists('t_anggota_komite');
        Schema::dropIfExists('m_komite_rs');
        Schema::dropIfExists('m_unit_kerja');
    }
};
