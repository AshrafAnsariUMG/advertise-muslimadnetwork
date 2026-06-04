<?php

namespace App\Http\Requests;

use App\Enums\AdvertiserStatus;
use App\Enums\BusinessType;
use App\Enums\CampaignObjective;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PurchaseType;
use App\Enums\TargetGender;
use App\Services\AdvertiserSubmissionGate;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdvertiserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // contact_email is also nullable on update — already set at create
            'contact_email'            => ['nullable', 'email:rfc'],

            'business_name'            => ['nullable', 'string', 'max:255'],
            'business_type'            => ['nullable', Rule::enum(BusinessType::class)],
            'contact_name'             => ['nullable', 'string', 'max:255'],
            'contact_phone'            => ['nullable', 'string', 'max:50'],
            'website_url'              => ['nullable', 'url', 'max:500'],
            'company_description'      => ['nullable', 'string', 'max:5000'],

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
            // Address is an optional human-readable label — the pin lat/lng +
            // radius are the actual targeting data, so it must NOT be required
            // (an empty address while the map is set would block auto-save).
            'target_location.address'     => ['nullable', 'string', 'max:500'],
            'target_age_range'         => ['nullable', 'string', 'max:50'],
            'target_gender'            => ['nullable', Rule::enum(TargetGender::class)],

            'ad_creatives'             => ['nullable', 'array', 'max:4'],
            'ad_destination_url'       => ['nullable', 'url', 'max:500'],
            'design_service'           => ['nullable', 'boolean'],
            'has_ctv'                  => ['nullable', 'boolean'],

            'payment_method'           => ['nullable', Rule::enum(PaymentMethod::class)],
            'payment_status'           => ['nullable', Rule::enum(PaymentStatus::class)],
            'billing_address'          => ['nullable', 'string', 'max:1000'],

            'status'                   => ['nullable', Rule::enum(AdvertiserStatus::class)],
            'notes'                    => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * When the client transitions the record to pending_review, enforce the
     * full submission requirements. Until then every field is nullable so
     * partial drafts can save.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $statusRaw = $this->input('status');
            if ($statusRaw !== AdvertiserStatus::PendingReview->value) {
                return;
            }

            // Merge incoming payload with existing record state so partial
            // PATCH payloads pass when the record already has the data.
            /** @var \App\Models\Advertiser|null $existing */
            $existing = $this->route('advertiser') ?? null;
            $merged = array_merge(
                $existing ? $existing->getAttributes() : [],
                $this->all()
            );

            $gate = new AdvertiserSubmissionGate();
            foreach ($gate->errorsFor($merged) as $field => $message) {
                $v->errors()->add($field, $message);
            }
        });
    }
}
