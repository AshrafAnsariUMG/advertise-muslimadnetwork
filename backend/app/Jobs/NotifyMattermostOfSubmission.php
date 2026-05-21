<?php

namespace App\Jobs;

use App\Models\Advertiser;
use App\Services\MattermostNotifier;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Queued so the Stripe webhook / PayPal capture endpoint can return quickly
 * without waiting for a Mattermost HTTP call.
 */
class NotifyMattermostOfSubmission implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /** No retries — Mattermost notifications are nice-to-have, not critical. */
    public int $tries = 1;
    public int $timeout = 10;

    public function __construct(public Advertiser $advertiser)
    {
    }

    public function handle(MattermostNotifier $notifier): void
    {
        $notifier->notifyNewSubmission($this->advertiser);
    }
}
