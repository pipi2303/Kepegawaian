<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('t_absensi', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable()->after('lokasi');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->boolean('lokasi_valid')->nullable()->after('longitude');
            $table->decimal('jarak_dari_rs', 8, 2)->nullable()->after('lokasi_valid');
        });
    }

    public function down(): void
    {
        Schema::table('t_absensi', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'lokasi_valid', 'jarak_dari_rs']);
        });
    }
};
