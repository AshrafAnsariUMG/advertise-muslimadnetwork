<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Models\Advertiser;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Internal Mattermost notifier.
 *
 * Posts to an incoming-webhook URL when a paid signup arrives. The webhook
 * URL is optional — if `MATTERMOST_WEBHOOK_URL_ADVERTISE` is empty, we
 * silently log and skip. The intent is that payments still work cleanly
 * even when staff notification isn't wired up yet.
 *
 * All failures (Mattermost down, network error, malformed URL) are caught
 * and logged. They must NEVER propagate up to the payment-processing path.
 */
class MattermostNotifier
{
    private const PAYMENT_LABEL = [
        'stripe'    => 'Stripe',
        'paypal'    => 'PayPal',
        'apple_pay' => 'Apple Pay',
        'google_pay' => 'Google Pay',
    ];

    public function notifyNewSubmission(Advertiser $advertiser): void
    {
        $url = config('services.mattermost.advertise_webhook_url');
        if (empty($url)) {
            Log::info('Mattermost webhook URL not configured, skipping', [
                'advertiser_id' => $advertiser->id,
            ]);
            return;
        }

        $paymentMethodValue = $advertiser->payment_method?->value ?? '';
        $paymentLabel = self::PAYMENT_LABEL[$paymentMethodValue] ?? 'Unknown';

        $budget = number_format((float) $advertiser->monthly_budget, 2);
        $total = number_format($advertiser->calculateTotal(), 2);

        $lines = [
            '🎯 *New paid campaign submission*',
            '',
            '• Business: ' . ($advertiser->business_name ?: '—'),
            '• Campaign: ' . ($advertiser->campaign_name ?: '—'),
            '• Budget: $' . $budget . ' / month',
            '• Total paid: $' . $total,
            '• Payment: ' . $paymentLabel,
            '• Contact: ' . ($advertiser->contact_name ?: '—')
                . ' &lt;' . ($advertiser->contact_email ?: '—') . '&gt;',
            '',
            'Advertiser ID: `' . $advertiser->id . '`',
        ];

        $payload = [
            'text'        => implode("\n", $lines),
            'username'    => 'Advertise Bot',
            'icon_emoji'  => ':mosque:',
        ];

        try {
            $response = Http::timeout(5)
                ->acceptJson()
                ->asJson()
                ->post($url, $payload);

            if (!$response->successful()) {
                Log::warning('Mattermost notify returned non-2xx', [
                    'status'        => $response->status(),
                    'body'          => substr((string) $response->body(), 0, 200),
                    'advertiser_id' => $advertiser->id,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Mattermost notify failed', [
                'advertiser_id' => $advertiser->id,
                'error'         => $e->getMessage(),
            ]);
            // Swallow — payment processing must keep working
        }
    }
}
