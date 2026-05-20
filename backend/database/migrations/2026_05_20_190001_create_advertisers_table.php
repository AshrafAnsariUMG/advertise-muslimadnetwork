<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advertisers', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Per-record secret authorising public PATCH/GET on drafts
            $table->string('access_token', 64)->unique();

            // Business info
            $table->string('business_name')->nullable();
            $table->string('business_type')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('website_url')->nullable();
            $table->text('company_description')->nullable();

            // Campaign
            $table->string('campaign_name')->nullable();
            $table->string('campaign_objective')->nullable();
            $table->string('purchase_type')->nullable();
            $table->text('campaign_offer')->nullable();
            $table->decimal('monthly_budget', 10, 2)->nullable();
            $table->date('campaign_start_date')->nullable();
            $table->date('campaign_end_date')->nullable();
            $table->json('target_countries')->nullable();
            $table->json('target_location')->nullable();
            $table->string('target_age_range')->nullable();
            $table->string('target_gender')->nullable();

            // Creatives
            $table->json('ad_creatives')->nullable();
            $table->string('ad_destination_url')->nullable();
            $table->boolean('design_service')->default(false);

            // Payment
            $table->string('payment_method')->nullable();
            $table->string('payment_status')->default('pending');
            $table->string('stripe_session_id')->nullable();
            $table->string('stripe_payment_intent')->nullable();
            $table->string('paypal_order_id')->nullable();
            $table->string('paypal_payment_id')->nullable();
            $table->text('billing_address')->nullable();

            // State
            $table->string('status')->default('incomplete_step_1');
            $table->text('notes')->nullable();
            $table->boolean('recovery_email_sent')->default(false);
            $table->timestamp('recovery_email_sent_date')->nullable();
            $table->boolean('pushed_to_pipedrive')->default(false);

            // Audit
            $table->string('created_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('payment_status');
            $table->index('contact_email');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advertisers');
    }
};
