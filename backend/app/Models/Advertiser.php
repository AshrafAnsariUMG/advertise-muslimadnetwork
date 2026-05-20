<?php

namespace App\Models;

use App\Enums\AdvertiserStatus;
use App\Enums\BusinessType;
use App\Enums\CampaignObjective;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PurchaseType;
use App\Enums\TargetGender;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Advertiser extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $guarded = ['id', 'access_token', 'created_at', 'updated_at', 'deleted_at'];

    /**
     * access_token is the per-record secret for authorising public PATCH/GET on
     * drafts. It is exposed exactly once: in the response body of the create
     * call. After that it is hidden from JSON serialisation; the frontend
     * stores it in localStorage and passes it as ?token=... on subsequent
     * requests.
     */
    protected $hidden = ['access_token'];

    protected $casts = [
        'business_type'            => BusinessType::class,
        'campaign_objective'       => CampaignObjective::class,
        'purchase_type'            => PurchaseType::class,
        'target_gender'            => TargetGender::class,
        'payment_method'           => PaymentMethod::class,
        'payment_status'           => PaymentStatus::class,
        'status'                   => AdvertiserStatus::class,
        'target_countries'         => 'array',
        'target_location'          => 'array',
        'ad_creatives'             => 'array',
        'design_service'           => 'boolean',
        'recovery_email_sent'      => 'boolean',
        'pushed_to_pipedrive'      => 'boolean',
        'monthly_budget'           => 'decimal:2',
        'campaign_start_date'      => 'date',
        'campaign_end_date'        => 'date',
        'recovery_email_sent_date' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Advertiser $advertiser): void {
            if (empty($advertiser->access_token)) {
                $advertiser->access_token = Str::random(64);
            }
        });
    }

    /**
     * Canonical server-side price calculation. Stripe/PayPal checkout
     * endpoints in S6/S7 MUST use this method — never trust client-supplied
     * amounts.
     */
    public function calculateTotal(): float
    {
        $budget = (float) ($this->monthly_budget ?? 0);
        $design = $this->design_service ? 200.0 : 0.0;

        return round($budget + $design, 2);
    }

    /**
     * Expose access_token in serialised output (only used on the create
     * response so the client can store it and authorise later requests).
     */
    public function withAccessToken(): array
    {
        return array_merge($this->toArray(), ['access_token' => $this->access_token]);
    }
}
