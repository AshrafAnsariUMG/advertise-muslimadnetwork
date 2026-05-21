<?php

namespace App\Jobs;

use App\Models\Advertiser;
use App\Services\PipedriveService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Push a single advertiser to Pipedrive via PipedriveService::pushAdvertiser.
 *
 * Backoff strategy: 60s, 5min, 15min. Pipedrive's rate limits are generous
 * (~100 req/sec per token) but bulk operations from the abandoned-carts page
 * can pile up; the backoff gives any transient rate-limit window time to
 * recover before retrying.
 *
 * On final failure we log loudly so the operator can investigate. The
 * advertiser remains pushed_to_pipedrive=false so they can retry manually
 * from the admin UI.
 */
class PushAdvertiserToPipedrive implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    /** @var array<int,int> */
    public array $backoff = [60, 300, 900];

    public int $timeout = 30;

    public function __construct(
        public Advertiser $advertiser,
        public string $stageType
    ) {
    }

    public function handle(PipedriveService $pipedrive): void
    {
        // Defensive: if a previous attempt already succeeded (e.g. the bulk
        // push retried after a transient error), don't double-push.
        if ($this->advertiser->pushed_to_pipedrive) {
            Log::info('PushAdvertiserToPipedrive: skipping (already pushed)', [
                'advertiser_id' => $this->advertiser->id,
                'stage_type'    => $this->stageType,
            ]);
            return;
        }

        $pipedrive->pushAdvertiser($this->advertiser, $this->stageType);
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error('PushAdvertiserToPipedrive: final failure after retries', [
            'advertiser_id'   => $this->advertiser->id,
            'stage_type'      => $this->stageType,
            'contact_email'   => $this->advertiser->contact_email,
            'exception_class' => $exception ? $exception::class : null,
            'message'         => $exception?->getMessage(),
        ]);
    }
}
