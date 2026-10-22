<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\ValidateLicense::class,
        ]);
    })
    ->withCommands([
        \App\Console\Commands\GenerateLicense::class,
        \App\Console\Commands\CekLisensiEkspiryNakes::class,
        \App\Console\Commands\GenerateSlipGajiBulanan::class,
        \App\Console\Commands\BackupDatabase::class,
    ])
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        $schedule->command('hcms:cek-lisensi-nakes')->dailyAt('07:00');
        $schedule->command('hcms:backup-db')->dailyAt('02:00');
        $schedule->command('hcms:generate-slip-gaji')->monthlyOn(25, '06:00');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
