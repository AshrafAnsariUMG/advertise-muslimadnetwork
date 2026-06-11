<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('advertisers', function (Blueprint $table) {
            // Marks a draft created from the /ssco-test sandbox. Test records
            // use the isolated calculateTotalTest() pricing, are excluded from
            // the live admin queues / dashboard / Pipedrive / recovery emails,
            // and never trigger real payment fulfillment.
            $table->boolean('is_test')->default(false)->after('status');
            $table->index('is_test');
        });
    }

    public function down(): void
    {
        Schema::table('advertisers', function (Blueprint $table) {
            $table->dropIndex(['is_test']);
            $table->dropColumn('is_test');
        });
    }
};
