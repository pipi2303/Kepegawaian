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
        // 1. Absensi (Presensi Rumah Sakit)
        Schema::create('t_absensi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->date('tanggal');
            $table->time('jam_masuk')->nullable();
            $table->time('jam_keluar')->nullable();
            $table->enum('status', ['Hadir', 'Izin', 'Sakit', 'Cuti', 'Alpha', 'Dinas Luar', 'Tugas Belajar']);
            $table->integer('menit_terlambat')->default(0);
            $table->integer('menit_pulang_cepat')->default(0);
            $table->string('jenis_shift', 50)->default('Pagi'); // Pagi, Sore, Malam, Non-Shift
            $table->string('lokasi', 100)->nullable();
            $table->text('keterangan')->nullable();
            $table->text('bukti_foto')->nullable();
            $table->timestamps();

            $table->unique(['pegawai_id', 'tanggal']);
            $table->index(['tanggal', 'status']);
        });

        // 2. Cuti Pegawai (PP No. 11/2017)
        Schema::create('t_cuti', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('jenis_cuti', 100); // Cuti Tahunan, Sakit, Melahirkan, Cuti Besar, Alasan Penting, CTLN
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->integer('jumlah_hari');
            $table->text('alasan');
            $table->string('alamat_selama_cuti', 255)->nullable();
            $table->string('no_telp_cuti', 30)->nullable();
            $table->enum('status', ['Pending', 'Disetujui', 'Ditolak', 'Dibatalkan'])->default('Pending');
            $table->string('disetujui_oleh', 255)->nullable();
            $table->date('tanggal_pengajuan')->useCurrent();
            $table->date('tanggal_disetujui')->nullable();
            $table->text('lampiran')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['pegawai_id', 'status']);
            $table->index(['tanggal_mulai', 'tanggal_selesai']);
        });

        // 3. Approval Cuti Berjenjang (Atasan Langsung, Kepala Unit, Direksi/BKD)
        Schema::create('t_cuti_approval', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuti_id')->constrained('t_cuti')->cascadeOnDelete();
            $table->integer('level'); // 1 = Kepala Ruangan/Unit, 2 = Kabid/Subbag, 3 = Direktur/Wadir
            $table->string('jabatan_penilai', 150);
            $table->foreignId('approver_pegawai_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->string('approver_nama', 255)->nullable();
            $table->enum('status', ['Pending', 'Disetujui', 'Ditolak'])->default('Pending');
            $table->timestamp('tanggal_aksi')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['cuti_id', 'level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_cuti_approval');
        Schema::dropIfExists('t_cuti');
        Schema::dropIfExists('t_absensi');
    }
};
