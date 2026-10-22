<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use Illuminate\Console\Command;

class BackupDatabase extends Command
{
    protected $signature   = 'hcms:backup-db';
    protected $description = 'Backup database MySQL ke storage/backups/';

    public function handle(): int
    {
        $dir = storage_path('backups');

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = 'backup_' . now()->format('Y-m-d_His') . '.sql';
        $path     = $dir . '/' . $filename;

        $host     = config('database.connections.mysql.host');
        $port     = config('database.connections.mysql.port', 3306);
        $user     = config('database.connections.mysql.username');
        $pass     = config('database.connections.mysql.password');
        $db       = config('database.connections.mysql.database');

        // ponytail: shell_exec for simplicity; swap to Spatie Backup if multi-DB or S3 needed
        $dumpCmd = "mysqldump -h{$host} -P{$port} -u{$user} " .
                   ($pass ? "-p" . escapeshellarg($pass) . " " : "") .
                   escapeshellarg($db) . " > " . escapeshellarg($path);

        shell_exec($dumpCmd);

        if (!file_exists($path) || filesize($path) === 0) {
            $this->error('Backup gagal: file kosong atau tidak terbuat.');
            return self::FAILURE;
        }

        shell_exec('gzip ' . escapeshellarg($path));
        $gzFile = $filename . '.gz';

        // Keep only the 30 most recent backups
        $files = glob($dir . '/backup_*.sql.gz');
        if ($files && count($files) > 30) {
            sort($files);
            foreach (array_slice($files, 0, count($files) - 30) as $old) {
                unlink($old);
            }
        }

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Database',
            targetLabel: $gzFile,
            description: 'Backup otomatis harian.',
        );

        $this->info("Backup selesai: {$gzFile}");

        return self::SUCCESS;
    }
}
