<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_logs', function (Blueprint $table) {
            $table->id();
            $table->string('service', 50);           // satusehat, siasn
            $table->string('action', 100);            // sync_practitioner, get_pegawai, etc.
            $table->enum('status', ['success', 'failed', 'pending'])->default('pending');
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->foreignId('pegawai_id')->nullable()->constrained('m_pegawai')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['service', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_logs');
    }
};
