<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PayPal webhook idempotency ledger.
 *
 * Same role as `processed_stripe_events` but with two extras: we keep the
 * full event payload (PayPal events vary more in shape, and debugging
 * failures later is much easier with the raw body) and we record
 * `processed_at` separately from `created_at` so we can tell apart "we saw
 * this and stored it" vs "we successfully applied the side effect".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processed_paypal_events', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // PayPal's WH-xxx event ID — unique constraint is the
            // belt-and-braces idempotency guard.
            $table->string('event_id')->unique();

            $table->string('event_type');

            // Nullable: events like CHECKOUT.ORDER.APPROVED can match an
            // advertiser, but a subscription-level notification might not.
            $table->uuid('advertiser_id')->nullable();

            // Full raw event for diagnostics
            $table->json('payload');

            // Set when the side effect succeeds. NULL means "ingested but
            // handler errored" — flag for human review.
            $table->timestamp('processed_at')->nullable();

            $table->text('error')->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->index('event_type');
            $table->index('advertiser_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processed_paypal_events');
    }
};
