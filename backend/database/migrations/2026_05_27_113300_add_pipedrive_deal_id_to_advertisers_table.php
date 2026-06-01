<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('advertisers', function (Blueprint $table) {
            // Store the Pipedrive deal id we created, so we can UPDATE the
            // deal's stage on later transitions (activate → "live" stage)
            // instead of only ever creating new deals. pushed_to_pipedrive
            // (boolean) stays as the soft "has it been pushed" guard.
            $table->string('pipedrive_deal_id')->nullable()->after('pushed_to_pipedrive');
            $table->timestamp('pipedrive_pushed_at')->nullable()->after('pipedrive_deal_id');
        });
    }

    public function down(): void
    {
        Schema::table('advertisers', function (Blueprint $table) {
            $table->dropColumn(['pipedrive_deal_id', 'pipedrive_pushed_at']);
        });
    }
};
