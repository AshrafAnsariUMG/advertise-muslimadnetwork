<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Stripe = 'stripe';
    case PayPal = 'paypal';
    case ApplePay = 'apple_pay';
    case GooglePay = 'google_pay';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
