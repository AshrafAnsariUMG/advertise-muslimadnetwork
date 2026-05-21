<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Scheduled jobs.
 *
 * The system crontab fires `php artisan schedule:run` every minute; that
 * tick is what advances these schedules. See /etc/cron.d/advertise-scheduler
 * for the cron entry.
 *
 * onOneServer() is a safety guard against duplicate runs in a multi-server
 * deployment — no-op for our single VPS today, but the lock survives a
 * future scale-out without code changes.
 */

Schedule::command('advertisers:send-abandoned-cart-emails')
    ->dailyAt('10:00')
    ->timezone('America/New_York')
    ->onOneServer();

Schedule::command('creatives:cleanup-orphans')
    ->weeklyOn(1, '03:00') // Mondays 03:00 server local
    ->onOneServer();
