<?php

namespace App\Console\Commands;

use App\Services\LicenseService;
use Illuminate\Console\Command;

class GenerateLicense extends Command
{
    protected $signature = 'license:generate {nama_rs : Nama rumah sakit (harus sama persis dengan NAMA_RS di .env)} {--expire= : Tanggal kadaluarsa (Y-m-d), default 1 tahun dari sekarang}';

    protected $description = 'Generate LICENSE_KEY untuk file .env';

    public function handle(): int
    {
        $namaRs  = $this->argument('nama_rs');
        $expire  = $this->option('expire') ?: now()->addYear()->toDateString();

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $expire)) {
            $this->error('Format tanggal harus Y-m-d, contoh: 2027-12-31');
            return 1;
        }

        $key = LicenseService::generate($namaRs, $expire);

        $this->newLine();
        $this->info('=== HCMS License Key Generator ===');
        $this->line('Nama RS    : ' . $namaRs);
        $this->line('Kadaluarsa : ' . $expire);
        $this->newLine();
        $this->info('Tambahkan baris berikut ke file .env:');
        $this->newLine();
        $this->line('NAMA_RS="' . $namaRs . '"');
        $this->line('LICENSE_KEY=' . $key);
        $this->line('LICENSE_EXPIRE=' . $expire);
        $this->newLine();

        return 0;
    }
}
