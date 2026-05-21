<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processed_stripe_events', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Stripe's evt_xxx event ID — unique guarantees idempotency at
            // the database layer even if a race slips past our own check.
            $table->string('event_id')->unique();

            $table->string('event_type');

            // Nullable because some event types we may log later (refund.created,
            // dispute.created) don't have a 1:1 advertiser link in metadata.
            $table->uuid('advertiser_id')->nullable();

            // Append-only — created_at is the processed time, no updated_at.
            $table->timestamp('processed_at')->useCurrent();

            $table->index('advertiser_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processed_stripe_events');
    }
};
