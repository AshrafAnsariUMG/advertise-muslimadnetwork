<?php

namespace App\Enums;

enum PurchaseType: string
{
    case Impressions = 'impressions';
    case Clicks = 'clicks';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
