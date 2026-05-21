<?php

namespace App\Providers;

use App\Mail\Transport\GmailApiTransport;
use App\Services\GmailMailerService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Singleton — fetching a Gmail access token does a network round-trip
        // and we'd rather not repeat it for every Mailable in a queue worker.
        $this->app->singleton(GmailMailerService::class, fn () => new GmailMailerService());
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

        /*
         * Custom Mail driver: gmail_api.
         *
         * Setting MAIL_MAILER=gmail_api in .env routes all Laravel mail
         * (Mail::raw, Mail::to()->send(), queued Mailables) through this
         * transport, which serialises the message to RFC-822 and posts it
         * via the Google Gmail v1 API.
         */
        Mail::extend('gmail_api', function () {
            return new GmailApiTransport(app(GmailMailerService::class));
        });
    }
}
