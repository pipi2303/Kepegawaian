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
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        $timestamp = now()->format('Y-m-d_His');
        $filename  = "backup_{$timestamp}.sql";
        $filepath  = "{$dir}/{$filename}";
        $gzpath    = "{$filepath}.gz";

        $host   = config('database.connections.mysql.host');
        $port   = config('database.connections.mysql.port', '3306');
        $user   = config('database.connections.mysql.username');
        $pass   = config('database.connections.mysql.password');
        $dbname = config('database.connections.mysql.database');

        // --single-transaction: consistent InnoDB snapshot without table locks
        // ponytail: shell exec for simplicity; swap to Spatie Backup if S3/multi-DB needed
        $cmd = "mysqldump --single-transaction --quick --no-tablespaces "
             . "-h" . escapeshellarg($host)
             . " -P" . escapeshellarg((string) $port)
             . " -u" . escapeshellarg($user)
             . ($pass ? " -p" . escapeshellarg($pass) : "")
             . " " . escapeshellarg($dbname)
             . " > " . escapeshellarg($filepath) . " 2>&1";

        exec($cmd, $out, $ret);

        if ($ret !== 0 || !file_exists($filepath) || filesize($filepath) === 0) {
            $this->error('mysqldump failed: ' . implode("\n", $out));
            return self::FAILURE;
        }

        exec("gzip -f " . escapeshellarg($filepath), $gout, $gret);
        $finalPath = file_exists($gzpath) ? $gzpath : $filepath;
        $finalName = basename($finalPath);

        // Keep only last 30 backups
        $files = glob("{$dir}/backup_*.sql*");
        if ($files) {
            rsort($files);
            foreach (array_slice($files, 30) as $old) unlink($old);
        }

        $size = round(filesize($finalPath) / 1024, 1) . ' KB';

        ActivityLog::record(
            action: 'EXPORT',
            severity: 'info',
            targetType: 'Database',
            targetLabel: $finalName,
            description: "Backup otomatis berhasil: {$size}",
        );

        $this->info("Backup berhasil: {$finalPath} ({$size})");

        return self::SUCCESS;
    }
}
