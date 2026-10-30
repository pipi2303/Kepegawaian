<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('t_kars_tracker', function (Blueprint $table) {
            $table->string('versi', 20)->default('STARKES 2022')->after('bab');
        });

        // Tandai data lama sebagai versi lama
        \Illuminate\Support\Facades\DB::table('t_kars_tracker')
            ->update(['versi' => 'KARS 2012']);
    }

    public function down(): void
    {
        Schema::table('t_kars_tracker', function (Blueprint $table) {
            $table->dropColumn('versi');
        });
    }
};
