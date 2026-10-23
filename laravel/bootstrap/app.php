<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        channels: __DIR__ . '/../routes/channels.php',
        then: function () {
            Route::middleware('api')->group(base_path('routes/self.php'));
            Route::middleware('api')->group(base_path('routes/dashboard.php'));
        },
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\ValidateLicense::class,
        ]);
    })
    ->withProviders([
        \App\Providers\EventServiceProvider::class,
    ])
    ->withCommands([
        \App\Console\Commands\GenerateLicense::class,
        \App\Console\Commands\CekLisensiEkspiryNakes::class,
        \App\Console\Commands\GenerateSlipGajiBulanan::class,
        \App\Console\Commands\BackupDatabase::class,
        \App\Console\Commands\CekKGBOtomatis::class,
    ])
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        $schedule->command('hcms:cek-lisensi-nakes')->dailyAt('07:00');
        $schedule->command('hcms:backup-db')->dailyAt('02:00');
        $schedule->command('hcms:generate-slip-gaji')->monthlyOn(25, '06:00');
        $schedule->command('hcms:cek-kgb')->weeklyOn(1, '08:00'); // Senin 08:00 WIB
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->report(function (\Throwable $e) {
            if (app()->bound('sentry') && $e->getPrevious() === null) {
                app('sentry')->captureException($e);
            }
        });
    })->create();
