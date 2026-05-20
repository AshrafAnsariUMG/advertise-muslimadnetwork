<?php

namespace App\Enums;

enum CampaignObjective: string
{
    case BrandAwareness = 'brand_awareness';
    case WebsiteTraffic = 'website_traffic';
    case LeadGeneration = 'lead_generation';
    case ProductSales = 'product_sales';
    case AppInstalls = 'app_installs';
    case EventPromotion = 'event_promotion';
    case DriveFootTraffic = 'drive_foot_traffic';
    case Donations = 'donations';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
