<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Stripe = 'stripe';
    case PayPal = 'paypal';
    // apple_pay / google_pay were carried over from base44 but never wired
    // into Stripe Checkout or the PayPal flow. Removed in the pre-cutover
    // cleanup. If you enable Stripe's Apple/Google Pay payment methods later,
    // they still arrive as `stripe` here (Stripe reports the wallet on the
    // PaymentIntent, not as a separate method on our side), so no enum value
    // is needed for them.

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
