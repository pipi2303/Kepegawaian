<?php

namespace App\Console\Commands;

use Database\Seeders\DemoDataSeeder;
use Illuminate\Console\Command;

class SeedDemoData extends Command
{
    protected $signature   = 'hcms:demo-seed';
    protected $description = 'Seed realistic demo data for presentation (only if DB nearly empty)';

    public function handle(): int
    {
        $this->call(DemoDataSeeder::class);
        return self::SUCCESS;
    }
}
