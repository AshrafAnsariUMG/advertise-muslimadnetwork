<?php

namespace App\Console\Commands;

use App\Enums\AdvertiserStatus;
use App\Mail\AbandonedCartRecovery;
use App\Models\Advertiser;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Dispatch one-shot recovery emails to drafts that reached the review screen
 * (highest-intent abandons) but didn't pay within 24 hours.
 *
 * Each advertiser receives this exactly once — `recovery_email_sent` is
 * flipped to true after dispatch. Later sessions may add a "second-touch"
 * variant at 72h, but for v1 one email avoids burning a sender reputation
 * with people who genuinely changed their minds.
 */
class SendAbandonedCartEmails extends Command
{
    protected $signature = 'advertisers:send-abandoned-cart-emails';

    protected $description = 'Email incomplete_step_3 drafts older than 24h that have not been notified yet.';

    /** Safety cap per run — protects the Gmail send quota in a backlog. */
    private const BATCH_LIMIT = 100;

    public function handle(): int
    {
        $candidates = Advertiser::query()
            ->where('status', AdvertiserStatus::IncompleteStep3->value)
            ->where('recovery_email_sent', false)
            ->where('created_at', '<', now()->subHours(24))
            ->whereNotNull('contact_email')
            ->limit(self::BATCH_LIMIT)
            ->get();

        $count = 0;
        foreach ($candidates as $advertiser) {
            try {
                Mail::to($advertiser->contact_email)
                    ->queue(new AbandonedCartRecovery($advertiser));

                $advertiser->recovery_email_sent = true;
                $advertiser->recovery_email_sent_date = now();
                $advertiser->save();

                $count++;
            } catch (\Throwable $e) {
                // Keep going — one bad row shouldn't stop the batch
                Log::error('Failed to queue abandoned cart email', [
                    'advertiser_id' => $advertiser->id,
                    'error'         => $e->getMessage(),
                ]);
            }
        }

        $msg = "Abandoned cart emails dispatched: {$count}";
        Log::info($msg);
        $this->info($msg);

        return self::SUCCESS;
    }
}
