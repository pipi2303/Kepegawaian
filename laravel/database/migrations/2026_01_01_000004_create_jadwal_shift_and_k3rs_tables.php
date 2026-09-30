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
        // 1. Jadwal Shift 24/7 Rumah Sakit
        Schema::create('t_jadwal_shift', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->date('tanggal');
            $table->enum('jenis_shift', ['Pagi', 'Sore', 'Malam', 'Non-Shift', 'Libur', 'On-Call'])->default('Pagi');
            $table->time('jam_mulai')->default('07:30:00');
            $table->time('jam_selesai')->default('15:30:00');
            $table->string('unit_kerja', 150);
            $table->string('ruangan', 150)->nullable();
            $table->enum('status_kehadiran', ['Terjadwal', 'Hadir', 'Tukar Shift', 'Tidak Hadir'])->default('Terjadwal');
            $table->foreignId('tukar_dengan_pegawai_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['tanggal', 'unit_kerja']);
            $table->index(['pegawai_id', 'tanggal']);
        });

        // 2. Insiden K3RS (Keselamatan & Kesehatan Kerja Rumah Sakit)
        Schema::create('t_insiden_k3rs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->string('nomor_laporan', 50)->unique();
            $table->dateTime('waktu_kejadian');
            $table->string('lokasi_kejadian', 255);
            $table->enum('kategori_insiden', [
                'Tertusuk Jarum / Benda Tajam',
                'Paparan Cairan Tubuh / Darah',
                'Terpeleset / Jatuh',
                'Paparan Kimia / B3',
                'Kekerasan Fisik / Verbal',
                'Lainnya'
            ]);
            $table->enum('grading_risiko', ['Biru', 'Hijau', 'Kuning', 'Merah'])->default('Hijau');
            $table->text('kronologi');
            $table->text('tindakan_awal');
            $table->enum('status_investigasi', ['Dilaporkan', 'Investigasi', 'Rekomendasi', 'Selesai'])->default('Dilaporkan');
            $table->text('rekomendasi_perbaikan')->nullable();
            $table->timestamps();
        });

        // 3. Vaksinasi Pegawai (Hepatitis B, COVID-19, Influenza, dll.)
        Schema::create('t_vaksinasi_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('jenis_vaksin', 100);
            $table->integer('dosis_ke');
            $table->date('tanggal_vaksin');
            $table->string('nomor_batch', 100)->nullable();
            $table->string('lokasi_pemberian', 150)->default('Poli Pegawai RSUDAM');
            $table->string('nama_vaksinator', 255)->nullable();
            $table->text('catatan_kipi')->nullable();
            $table->timestamps();
        });

        // 4. MCU Pegawai Berkala
        Schema::create('t_mcu_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->integer('tahun');
            $table->date('tanggal_mcu');
            $table->enum('kategori_hasil', ['Fit to Work', 'Fit with Note', 'Unfit Temporary', 'Unfit Permanent'])->default('Fit to Work');
            $table->decimal('berat_badan', 5, 2)->nullable();
            $table->decimal('tinggi_badan', 5, 2)->nullable();
            $table->string('tekanan_darah', 20)->nullable();
            $table->text('kesimpulan_medis')->nullable();
            $table->text('saran_tindak_lanjut')->nullable();
            $table->text('file_hasil_mcu')->nullable();
            $table->timestamps();

            $table->index(['pegawai_id', 'tahun']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_mcu_pegawai');
        Schema::dropIfExists('t_vaksinasi_pegawai');
        Schema::dropIfExists('t_insiden_k3rs');
        Schema::dropIfExists('t_jadwal_shift');
    }
};
