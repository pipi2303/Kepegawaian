<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notif_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->unique()->constrained('m_pegawai')->cascadeOnDelete();
            $table->boolean('notif_cuti_email')->default(true);
            $table->boolean('notif_cuti_wa')->default(true);
            $table->boolean('notif_str_expiry_email')->default(true);
            $table->boolean('notif_str_expiry_wa')->default(true);
            $table->boolean('notif_slip_gaji_wa')->default(true);
            $table->boolean('notif_kontrak_expiry_wa')->default(true);
            $table->boolean('notif_pensiun_wa')->default(true);
            $table->boolean('notif_kgb_wa')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notif_preferences');
    }
};
