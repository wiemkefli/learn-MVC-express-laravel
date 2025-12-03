<?php

namespace App\Providers;

use App\Services\DatabaseBootstrapper;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(DatabaseBootstrapper $bootstrapper): void
    {
        $bootstrapper->bootstrap();
    }
}
