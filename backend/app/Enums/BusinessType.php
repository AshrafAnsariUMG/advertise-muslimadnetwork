<?php

namespace App\Enums;

enum BusinessType: string
{
    case HalalFood = 'halal_food';
    case Restaurant = 'restaurant';
    case IslamicEducation = 'islamic_education';
    case FashionModestWear = 'fashion_modest_wear';
    case TravelHajjUmrah = 'travel_hajj_umrah';
    case FinanceIslamicBanking = 'finance_islamic_banking';
    case Technology = 'technology';
    case Healthcare = 'healthcare';
    case RealEstate = 'real_estate';
    case CharityNonprofit = 'charity_nonprofit';
    case Other = 'other';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
