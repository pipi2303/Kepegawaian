<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_oppe_peer_review', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oppe_id')->constrained('t_oppe_fppe')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('m_pegawai')->cascadeOnDelete();
            $table->decimal('kompetensi_klinis', 4, 1);   // 0-100
            $table->decimal('komunikasi', 4, 1);
            $table->decimal('etika_profesional', 4, 1);
            $table->decimal('kerjasama_tim', 4, 1);
            $table->decimal('pengetahuan', 4, 1);
            $table->decimal('nilai_total', 4, 1)->nullable(); // avg, computed
            $table->text('catatan')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['oppe_id', 'reviewer_id']);
            $table->index('oppe_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_oppe_peer_review');
    }
};
