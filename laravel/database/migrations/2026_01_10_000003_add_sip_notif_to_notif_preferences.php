<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notif_preferences', function (Blueprint $table) {
            $table->boolean('notif_sip_expiry_email')->default(true)->after('notif_str_expiry_wa');
            $table->boolean('notif_sip_expiry_wa')->default(true)->after('notif_sip_expiry_email');
        });
    }

    public function down(): void
    {
        Schema::table('notif_preferences', function (Blueprint $table) {
            $table->dropColumn(['notif_sip_expiry_email', 'notif_sip_expiry_wa']);
        });
    }
};
