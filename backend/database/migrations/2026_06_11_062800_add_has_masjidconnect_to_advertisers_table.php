<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('advertisers', function (Blueprint $table) {
            // MasjidConnect / DOOH (Digital Out-Of-Home, in-mosque screens)
            // campaign add-on — sibling to has_ctv. Both gate the budget to a
            // $1,500 minimum and are bundled into the monthly spend (no extra
            // line item). Named to mirror the reporting-dashboard convention.
            $table->boolean('has_masjidconnect')->default(false)->after('has_ctv');
        });
    }

    public function down(): void
    {
        Schema::table('advertisers', function (Blueprint $table) {
            $table->dropColumn('has_masjidconnect');
        });
    }
};
