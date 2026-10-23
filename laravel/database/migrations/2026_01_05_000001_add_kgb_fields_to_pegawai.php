<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_pegawai', function (Blueprint $table) {
            $table->date('tmt_gaji_berkala')->nullable()->after('tmt_golongan');
            $table->date('kgb_berikutnya')->nullable()->after('tmt_gaji_berkala');
            $table->integer('masa_kerja_golongan')->nullable()->after('kgb_berikutnya'); // dalam bulan
        });
    }

    public function down(): void
    {
        Schema::table('m_pegawai', function (Blueprint $table) {
            $table->dropColumn(['tmt_gaji_berkala', 'kgb_berikutnya', 'masa_kerja_golongan']);
        });
    }
};
