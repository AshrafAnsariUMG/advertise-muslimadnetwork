<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Public advertiser write endpoints — keep stricter limits to prevent
        // anonymous abuse (drafts are unauthenticated by design).
        RateLimiter::for('advertiser-create', function (Request $request) {
            return Limit::perHour(10)->by($request->ip());
        });

        RateLimiter::for('advertiser-read', function (Request $request) {
            return Limit::perHour(60)->by($request->ip());
        });

        // Higher because the wizard auto-saves as the user types
        RateLimiter::for('advertiser-write', function (Request $request) {
            return Limit::perHour(120)->by($request->ip());
        });

        RateLimiter::for('uploads', function (Request $request) {
            return Limit::perHour(30)->by($request->ip());
        });

        // Checkout session creation — short window, low ceiling. A user who's
        // legitimately retrying after a Stripe redirect failure will hit this
        // at most a couple of times.
        RateLimiter::for('checkout', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
