<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->string('action', 20);         // LOGIN, CREATE, UPDATE, DELETE, APPROVE, REJECT, EXPORT
            $table->enum('severity', ['info', 'warning', 'critical'])->default('info');
            $table->enum('status', ['SUCCESS', 'FAILED'])->default('SUCCESS');
            $table->string('target_type', 50)->nullable();
            $table->string('target_id', 50)->nullable();
            $table->string('target_label', 255)->nullable();
            $table->text('description')->nullable();
            $table->json('changes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['pegawai_id', 'created_at']);
            $table->index(['action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
