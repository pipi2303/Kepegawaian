<?php

namespace App\Providers;

use App\Events\CutiDiajukan;
use App\Events\CutiStatusChanged;
use App\Listeners\SendWhatsAppOnCutiDiajukan;
use App\Listeners\SendWhatsAppOnCutiStatusChanged;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        CutiDiajukan::class      => [SendWhatsAppOnCutiDiajukan::class],
        CutiStatusChanged::class => [SendWhatsAppOnCutiStatusChanged::class],
    ];
}
