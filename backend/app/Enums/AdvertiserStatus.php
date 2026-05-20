<?php

namespace App\Enums;

enum AdvertiserStatus: string
{
    case IncompleteStep1 = 'incomplete_step_1';
    case IncompleteStep2 = 'incomplete_step_2';
    case IncompleteStep3 = 'incomplete_step_3';
    case PendingReview = 'pending_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Active = 'active';
    case Paused = 'paused';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
