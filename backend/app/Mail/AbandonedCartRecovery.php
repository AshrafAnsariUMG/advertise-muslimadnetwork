<?php

namespace App\Mail;

use App\Models\Advertiser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent by the daily SendAbandonedCartEmails console command to advertisers
 * whose drafts reached step 3 (review) but never paid. The CTA button uses
 * `?return={id}&token={token}` so the wizard restores their state when the
 * link is clicked.
 *
 * `access_token` is the per-record secret stored only on disk + in our DB —
 * it never round-trips through normal API responses, so emailing it back
 * to the advertiser's contact_email is the explicit recovery path.
 */
class AbandonedCartRecovery extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(public Advertiser $advertiser)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pick up where you left off',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.abandoned-cart-recovery',
            with: [
                'advertiser' => $this->advertiser,
                'resumeUrl'  => $this->buildResumeUrl(),
            ],
        );
    }

    private function buildResumeUrl(): string
    {
        // Must use config('app.frontend_url'), NOT env('FRONTEND_URL') —
        // raw env() returns empty once `php artisan config:cache` has run,
        // and the URL silently degrades to the backend host. Discovered in
        // QA after the email body pointed at port 8004 instead of 3004.
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $qs = http_build_query([
            'return' => $this->advertiser->id,
            'token'  => $this->advertiser->access_token,
        ]);
        return $frontend . '/?' . $qs;
    }
}
