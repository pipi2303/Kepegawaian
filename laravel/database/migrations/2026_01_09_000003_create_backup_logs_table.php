<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_backup_logs', function (Blueprint $table) {
            $table->id();
            $table->string('filename', 255);
            $table->text('filepath');
            $table->bigInteger('size_bytes')->default(0);
            $table->string('size_formatted', 20);
            $table->enum('status', ['completed', 'failed'])->default('completed');
            $table->text('error_message')->nullable();
            $table->foreignId('initiated_by')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_backup_logs');
    }
};
