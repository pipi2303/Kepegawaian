<?php

namespace App\Console\Commands;

use App\Models\Pegawai;
use App\Services\PayrollService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GenerateSlipGajiBulanan extends Command
{
    protected $signature   = 'hcms:generate-slip-gaji {--bulan=} {--tahun=}';
    protected $description = 'Generate slip gaji bulanan untuk semua pegawai aktif';

    public function handle(PayrollService $payroll): int
    {
        $bulan = (int) ($this->option('bulan') ?: now()->month);
        $tahun = (int) ($this->option('tahun') ?: now()->year);

        $pegawais = Pegawai::where('status_aktif', 'Aktif')->get();

        $ok = $failed = 0;

        foreach ($pegawais as $pegawai) {
            try {
                $payroll->generateSlipGaji($pegawai, $bulan, $tahun);
                $ok++;
            } catch (\Throwable $e) {
                $failed++;
                Log::error("GenerateSlipGaji gagal [{$pegawai->nip}]: " . $e->getMessage());
            }
        }

        $this->info("Generated {$ok} slip gaji untuk {$bulan}/{$tahun}, {$failed} gagal.");

        return self::SUCCESS;
    }
}
