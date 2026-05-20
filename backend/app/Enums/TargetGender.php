<?php

namespace App\Enums;

enum TargetGender: string
{
    case All = 'all';
    case Male = 'male';
    case Female = 'female';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
