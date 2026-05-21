<?php

namespace App\Mail;

use App\Enums\PaymentMethod;
use App\Models\Advertiser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to the advertiser as soon as the Stripe webhook or PayPal capture
 * confirms payment. Queued so the webhook responds fast (Stripe will retry
 * on >5s) — the advertise-queue PM2 worker picks it up.
 */
class PaymentConfirmation extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    private const OBJECTIVE_LABELS = [
        'brand_awareness'    => 'Brand Awareness',
        'website_traffic'    => 'Website Traffic',
        'lead_generation'    => 'Lead Generation',
        'product_sales'      => 'Product Sales',
        'app_installs'       => 'App Installs',
        'event_promotion'    => 'Event Promotion',
        'drive_foot_traffic' => 'Drive Foot Traffic',
        'donations'          => 'Donations',
    ];

    public function __construct(public Advertiser $advertiser)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your campaign has been submitted!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-confirmation',
            with: [
                'advertiser'          => $this->advertiser,
                'objectiveLabel'      => $this->objectiveLabel(),
                'datesLabel'          => $this->datesLabel(),
                'total'               => $this->advertiser->calculateTotal(),
                'paymentMethodLabel'  => $this->paymentMethodLabel(),
            ],
        );
    }

    private function objectiveLabel(): string
    {
        $value = $this->advertiser->campaign_objective?->value;
        return self::OBJECTIVE_LABELS[$value] ?? 'Campaign';
    }

    private function datesLabel(): string
    {
        $start = optional($this->advertiser->campaign_start_date)->format('M j, Y');
        $end = optional($this->advertiser->campaign_end_date)->format('M j, Y');
        if (!$start && !$end) return '—';
        return trim(($start ?: 'TBD') . ' – ' . ($end ?: 'TBD'));
    }

    private function paymentMethodLabel(): string
    {
        return match ($this->advertiser->payment_method) {
            PaymentMethod::Stripe   => 'Stripe (Card / Bank)',
            PaymentMethod::PayPal   => 'PayPal',
            PaymentMethod::ApplePay => 'Apple Pay',
            PaymentMethod::GooglePay => 'Google Pay',
            default                  => 'Card',
        };
    }
}
