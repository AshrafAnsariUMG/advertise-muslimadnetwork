<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Idempotency ledger for Stripe webhooks.
 *
 * Stripe retries failed webhook deliveries — without this table a transient
 * 500 followed by a retry would re-process the same payment event twice.
 * The WebhookController checks here first and writes here last, both inside
 * the same DB transaction as the actual side effect.
 */
class ProcessedStripeEvent extends Model
{
    use HasUuids;

    /**
     * No updated_at — these rows are immutable once written.
     */
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'processed_at' => 'datetime',
    ];
}
