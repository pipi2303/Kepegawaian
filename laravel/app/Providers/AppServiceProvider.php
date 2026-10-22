<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Spatie permissions → Laravel Gate bridge.
        // Allows $this->authorize('permission.name') in controllers.
        Gate::before(function ($user, $ability) {
            if (method_exists($user, 'hasPermissionTo')) {
                return $user->hasPermissionTo($ability) ?: null;
            }
        });
    }
}
