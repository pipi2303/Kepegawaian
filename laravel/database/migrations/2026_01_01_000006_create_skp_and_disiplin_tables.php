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
        // 1. SKP (Sasaran Kinerja Pegawai - PermenPAN-RB No. 6/2022)
        Schema::create('t_skp_header', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->integer('tahun');
            $table->tinyInteger('semester')->default(1); // 1 or 2
            $table->decimal('nilai_hasil_kerja', 5, 2)->default(0);
            $table->decimal('nilai_perilaku', 5, 2)->default(0);
            $table->decimal('nilai_akhir', 5, 2)->default(0);
            $table->enum('predikat', ['Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'Sangat Kurang'])->default('Baik');
            $table->enum('status', ['Draft', 'Diajukan', 'Dinilai', 'Disetujui', 'Banding'])->default('Draft');
            $table->foreignId('pejabat_penilai_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->text('catatan_atasan')->nullable();
            $table->date('tanggal_penilaian')->nullable();
            $table->timestamps();

            $table->unique(['pegawai_id', 'tahun', 'semester']);
        });

        // 2. Butir Target & Rencana Kinerja SKP
        Schema::create('t_skp_detail', function (Blueprint $table) {
            $table->id();
            $table->foreignId('skp_id')->constrained('t_skp_header')->cascadeOnDelete();
            $table->enum('aspek', ['Kuantitas', 'Kualitas', 'Waktu', 'Biaya'])->default('Kuantitas');
            $table->text('rencana_kinerja_atasan')->nullable();
            $table->text('rencana_kinerja_individu');
            $table->text('indikator_kinerja_individu');
            $table->decimal('target_min', 15, 2)->nullable();
            $table->decimal('target_max', 15, 2)->nullable();
            $table->string('satuan', 50); // Dokumen, Pasien, Kegiatan, Laporan, %
            $table->decimal('realisasi', 15, 2)->default(0);
            $table->decimal('capaian_persen', 5, 2)->default(0);
            $table->text('bukti_dukung')->nullable();
            $table->text('umpan_balik_berkelanjutan')->nullable();
            $table->timestamps();
        });

        // 3. Disiplin & Pelanggaran ASN (PP No. 94/2021)
        Schema::create('t_disiplin_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->enum('tingkat_hukuman', ['Ringan', 'Sedang', 'Berat']);
            $table->string('jenis_hukuman', 150); // Teguran Lisan, Tertulis, Penundaan KGB, Penurunan Pangkat, dll.
            $table->text('uraian_pelanggaran');
            $table->string('nomor_sk', 100);
            $table->date('tanggal_sk');
            $table->date('tanggal_mulai_berlaku');
            $table->date('tanggal_selesai_berlaku')->nullable();
            $table->string('pejabat_penetap', 255);
            $table->enum('status_hukuman', ['Sedang Menjalani', 'Selesai'])->default('Sedang Menjalani');
            $table->text('file_sk')->nullable();
            $table->timestamps();
        });

        // 4. Penghargaan & Prestasi Kerja
        Schema::create('t_penghargaan_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->string('nama_penghargaan', 255);
            $table->enum('tingkat', ['Internal RS', 'Kota/Kabupaten', 'Provinsi', 'Nasional', 'Internasional']);
            $table->string('instansi_pemberi', 255);
            $table->integer('tahun');
            $table->string('nomor_piagam', 100)->nullable();
            $table->text('file_piagam')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_penghargaan_pegawai');
        Schema::dropIfExists('t_disiplin_pegawai');
        Schema::dropIfExists('t_skp_detail');
        Schema::dropIfExists('t_skp_header');
    }
};
