<?php

namespace App\Http\Requests;

use App\Enums\AdvertiserStatus;
use App\Enums\BusinessType;
use App\Enums\CampaignObjective;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PurchaseType;
use App\Enums\TargetGender;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdvertiserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Required: contact_email is the only field we need at create so
            // the draft can be re-found later.
            'contact_email'            => ['required', 'email:rfc'],

            // Business info — everything else nullable so partial drafts save
            'business_name'            => ['nullable', 'string', 'max:255'],
            'business_type'            => ['nullable', Rule::enum(BusinessType::class)],
            'contact_name'             => ['nullable', 'string', 'max:255'],
            'contact_phone'            => ['nullable', 'string', 'max:50'],
            'website_url'              => ['nullable', 'url', 'max:500'],
            'company_description'      => ['nullable', 'string', 'max:5000'],

            // Campaign
            'campaign_name'            => ['nullable', 'string', 'max:255'],
            'campaign_objective'       => ['nullable', Rule::enum(CampaignObjective::class)],
            'purchase_type'            => ['nullable', Rule::enum(PurchaseType::class)],
            'campaign_offer'           => ['nullable', 'string', 'max:2000'],
            'monthly_budget'           => ['nullable', 'numeric', 'min:0'],
            'campaign_start_date'      => ['nullable', 'date'],
            'campaign_end_date'        => ['nullable', 'date', 'after_or_equal:campaign_start_date'],
            'target_countries'         => ['nullable', 'array'],
            'target_countries.*'       => ['string', 'max:100'],
            'target_location'          => ['nullable', 'array'],
            'target_location.latitude'    => ['required_with:target_location', 'numeric', 'between:-90,90'],
            'target_location.longitude'   => ['required_with:target_location', 'numeric', 'between:-180,180'],
            'target_location.radius_miles' => ['required_with:target_location', 'numeric', 'gt:0'],
            // Address is an optional human-readable label — see UpdateAdvertiserRequest.
            'target_location.address'     => ['nullable', 'string', 'max:500'],
            'target_age_range'         => ['nullable', 'string', 'max:50'],
            'target_gender'            => ['nullable', Rule::enum(TargetGender::class)],

            // Creatives
            'ad_creatives'             => ['nullable', 'array', 'max:4'],
            'ad_destination_url'       => ['nullable', 'url', 'max:500'],
            'design_service'           => ['nullable', 'boolean'],
            'has_ctv'                  => ['nullable', 'boolean'],
            'has_masjidconnect'        => ['nullable', 'boolean'],

            // Payment (controlled by webhooks normally, but allowed for completeness)
            'payment_method'           => ['nullable', Rule::enum(PaymentMethod::class)],
            'payment_status'           => ['nullable', Rule::enum(PaymentStatus::class)],
            'billing_address'          => ['nullable', 'string', 'max:1000'],

            // State
            'status'                   => ['nullable', Rule::enum(AdvertiserStatus::class)],
            'notes'                    => ['nullable', 'string', 'max:5000'],
        ];
    }
}
