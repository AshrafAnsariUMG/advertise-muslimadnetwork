<?php

namespace App\Services;

use App\Models\Advertiser;

/**
 * Single source of truth for "is this draft ready to submit?"
 *
 * Used by:
 *  - UpdateAdvertiserRequest::withValidator() — when the client tries to
 *    transition status to pending_review.
 *  - CheckoutController::stripe() — before opening a Stripe Checkout Session.
 *
 * Returns an empty array when the record is submission-ready; otherwise an
 * associative array of {field => error-message} suitable for a 422 response.
 */
class AdvertiserSubmissionGate
{
    /**
     * Fields that must be populated before a draft can transition to
     * pending_review or pay.
     */
    private const REQUIRED_FIELDS = [
        'business_name', 'business_type', 'contact_name', 'contact_email',
        'contact_phone', 'campaign_name', 'campaign_objective',
        'monthly_budget', 'campaign_start_date', 'campaign_end_date',
        'ad_destination_url',
    ];

    /**
     * @param  array<string,mixed>  $data  raw advertiser attributes
     * @return array<string,string>        empty if valid
     */
    public function errorsFor(array $data): array
    {
        $errors = [];

        foreach (self::REQUIRED_FIELDS as $field) {
            if (empty($data[$field])) {
                $errors[$field] = "The {$field} field is required to submit for review.";
            }
        }

        $hasCountries = !empty($data['target_countries']);
        $hasLocation = !empty($data['target_location']);
        if (!$hasCountries && !$hasLocation) {
            $errors['target_countries'] = 'Either target_countries or target_location is required to submit for review.';
        }

        return $errors;
    }

    /**
     * Convenience: gate-check an Advertiser model directly.
     *
     * @return array<string,string>
     */
    public function errorsForAdvertiser(Advertiser $advertiser): array
    {
        return $this->errorsFor($advertiser->getAttributes());
    }
}
