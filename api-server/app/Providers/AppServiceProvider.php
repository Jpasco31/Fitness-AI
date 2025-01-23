<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\UserAttributeRepository;
use App\Repositories\ActivityRepository;
use App\Services\UserAttributeService;
use App\Services\ActivityService;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(UserAttributeRepository::class, function ($app) {
            return new UserAttributeRepository();
        });

        $this->app->singleton(ActivityRepository::class, function ($app) {
            return new ActivityRepository();
        });

        $this->app->singleton(UserAttributeService::class, function ($app) {
            return new UserAttributeService($app->make(UserAttributeRepository::class));
        });

        $this->app->singleton(ActivityService::class, function ($app) {
            return new ActivityService($app->make(ActivityRepository::class));
        });
    }

    public function boot()
        {
            if (env('APP_ENV') == 'production') {
                $this->app['request']->server->set('HTTPS', true);
            }
        }
}
