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
        // 1. Master Pegawai
        Schema::create('m_pegawai', function (Blueprint $table) {
            $table->id();
            $table->string('nip', 30)->unique();
            $table->string('nama', 255);
            $table->string('gelar_depan', 50)->nullable();
            $table->string('gelar_belakang', 50)->nullable();
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->string('tempat_lahir', 100)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('agama', 50)->nullable();
            $table->string('status_perkawinan', 50)->nullable();
            $table->text('alamat')->nullable();
            $table->string('no_telp', 25)->nullable();
            $table->string('email', 100)->nullable()->unique();
            $table->string('jabatan', 150);
            $table->string('jabatan_fungsional', 150)->nullable();
            $table->string('unit_kerja', 150);
            $table->string('golongan', 10)->nullable();
            $table->string('pangkat', 100)->nullable();
            $table->date('tmt_golongan')->nullable();
            $table->date('tmt_jabatan')->nullable();
            $table->enum('status_pegawai', ['PNS', 'PPPK', 'Honorer'])->default('PNS');
            $table->enum('status_aktif', ['Aktif', 'Pensiun', 'Meninggal', 'Diberhentikan'])->default('Aktif');
            $table->string('pendidikan_terakhir', 50)->nullable();
            $table->string('jurusan', 150)->nullable();
            $table->string('institusi', 150)->nullable();
            $table->integer('tahun_lulus')->nullable();
            $table->date('tanggal_masuk')->nullable();
            $table->date('batas_pensiun')->nullable();
            $table->string('masa_kerja', 50)->nullable();
            $table->string('eselon', 20)->nullable();
            $table->string('badge', 50)->nullable();
            $table->text('foto')->nullable();
            $table->json('sertifikat')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['unit_kerja', 'status_aktif']);
            $table->index(['status_pegawai', 'status_aktif']);
        });

        // 2. Data Keluarga
        Schema::create('t_pegawai_keluarga', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->enum('hubungan', ['Suami', 'Istri', 'Anak', 'Orang Tua', 'Mertua', 'Saudara Kandung', 'Lainnya']);
            $table->string('nama', 255);
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->string('tempat_lahir', 100)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('nomor_ktp', 30)->nullable();
            $table->string('agama', 50)->nullable();
            $table->string('pendidikan', 50)->nullable();
            $table->string('pekerjaan', 100)->nullable();
            $table->enum('status_hidup', ['Hidup', 'Meninggal'])->default('Hidup');
            $table->boolean('tunjangan')->default(false);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        // 3. Dokumen Pegawai
        Schema::create('t_dokumen_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('kategori', 100); // Identitas Diri, Kepegawaian, Pendidikan, Dokumen Rumah Sakit
            $table->string('nama_dokumen', 255);
            $table->string('nomor_dokumen', 100)->nullable();
            $table->date('tanggal_terbit')->nullable();
            $table->date('tanggal_kadaluarsa')->nullable();
            $table->string('instansi_penerbit', 255)->nullable();
            $table->text('file_url')->nullable();
            $table->string('file_name', 255)->nullable();
            $table->enum('status', ['Valid', 'Kadaluarsa', 'Segera Kadaluarsa', 'Belum Upload'])->default('Valid');
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['pegawai_id', 'status']);
        });

        // 4. Riwayat Jabatan
        Schema::create('t_riwayat_jabatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('nama_jabatan', 150);
            $table->string('unit_kerja', 150);
            $table->string('eselon', 20)->nullable();
            $table->date('tmt_jabatan');
            $table->date('tmt_selesai')->nullable();
            $table->string('nomor_sk', 100);
            $table->date('tanggal_sk');
            $table->string('pejabat_penetap', 255)->nullable();
            $table->text('file_sk')->nullable();
            $table->boolean('is_current')->default(false);
            $table->timestamps();
        });

        // 5. Kenaikan Pangkat
        Schema::create('t_kenaikan_pangkat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('golongan_lama', 10);
            $table->string('pangkat_lama', 100);
            $table->string('golongan_baru', 10);
            $table->string('pangkat_baru', 100);
            $table->enum('jenis_kenaikan', ['Reguler', 'Pilihan', 'Anumerta', 'Pengabdian', 'Penyesuaian Ijazah']);
            $table->date('tmt_baru');
            $table->string('nomor_sk', 100)->nullable();
            $table->date('tanggal_sk')->nullable();
            $table->enum('status', ['Usulan', 'Verifikasi BKD', 'Disetujui BKN', 'SK Terbit', 'Ditolak'])->default('Usulan');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_kenaikan_pangkat');
        Schema::dropIfExists('t_riwayat_jabatan');
        Schema::dropIfExists('t_dokumen_pegawai');
        Schema::dropIfExists('t_pegawai_keluarga');
        Schema::dropIfExists('m_pegawai');
    }
};
