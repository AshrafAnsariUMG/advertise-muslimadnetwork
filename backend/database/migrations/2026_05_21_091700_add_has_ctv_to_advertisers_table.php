<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('advertisers', function (Blueprint $table) {
            // Mirrors the reporting dashboard's `has_ctv` naming so a campaign
            // that ticks "Add Streaming TV Ads" here maps 1:1 to a CM360 record
            // there. Placed next to design_service since both are paid add-ons.
            $table->boolean('has_ctv')->default(false)->after('design_service');
        });
    }

    public function down(): void
    {
        Schema::table('advertisers', function (Blueprint $table) {
            $table->dropColumn('has_ctv');
        });
    }
};
